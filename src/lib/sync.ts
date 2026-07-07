import { supabase } from "@/lib/supabase";
import { enqueueMutation, getMeta, getQueue, putLocal, removeFromQueue, setMeta } from "@/lib/db";
import type { QueuedMutation, SyncStatus, SyncTable } from "@/types";

const SYNCABLE_TABLES: SyncTable[] = [
  "spending_profiles",
  "accounts",
  "categories",
  "tags",
  "recurring_transactions",
  "transactions",
  "budgets",
];

type Listener = (status: SyncStatus) => void;

class SyncEngine {
  private userId: string | null = null;
  private status: SyncStatus = "idle";
  private listeners = new Set<Listener>();
  private onRemoteChange: (() => void) | null = null;
  private timer: ReturnType<typeof setInterval> | null = null;
  private syncing = false;

  init(userId: string, onRemoteChange: () => void) {
    this.userId = userId;
    this.onRemoteChange = onRemoteChange;
    window.addEventListener("online", this.handleOnline);
    window.addEventListener("offline", this.handleOffline);
    document.addEventListener("visibilitychange", this.handleVisibility);
    this.timer = setInterval(() => this.syncNow(), 45_000);
  }

  dispose() {
    window.removeEventListener("online", this.handleOnline);
    window.removeEventListener("offline", this.handleOffline);
    document.removeEventListener("visibilitychange", this.handleVisibility);
    if (this.timer) clearInterval(this.timer);
    this.userId = null;
  }

  private handleOnline = () => this.syncNow();
  private handleOffline = () => this.setStatus("offline");
  private handleVisibility = () => {
    if (document.visibilityState === "visible") this.syncNow();
  };

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    listener(this.status);
    return () => this.listeners.delete(listener);
  }

  private setStatus(s: SyncStatus) {
    this.status = s;
    this.listeners.forEach((l) => l(s));
  }

  async queueMutation(m: Omit<QueuedMutation, "queue_id" | "created_at">) {
    await enqueueMutation({
      ...m,
      queue_id: crypto.randomUUID(),
      created_at: new Date().toISOString(),
    });
    void this.syncNow();
  }

  async syncNow(): Promise<void> {
    if (!this.userId || this.syncing) return;
    if (!navigator.onLine) {
      this.setStatus("offline");
      return;
    }
    this.syncing = true;
    this.setStatus("syncing");
    try {
      await this.flushQueue();
      await this.pullAll();
      this.setStatus("idle");
    } catch (err) {
      console.error("[sync] falhou", err);
      this.setStatus(navigator.onLine ? "error" : "offline");
    } finally {
      this.syncing = false;
    }
  }

  private async flushQueue() {
    const queue = await getQueue();
    for (const m of queue.sort((a, b) => a.created_at.localeCompare(b.created_at))) {
      const { queue_id, table, op, record, tag_ids } = m;
      if (op === "delete") {
        const { error } = await supabase.from(table).delete().eq("id", record.id as string);
        if (error) throw error;
      } else {
        const { error } = await supabase.from(table).upsert(record);
        if (error) throw error;
        if (table === "transactions" && tag_ids) {
          await supabase.from("transaction_tags").delete().eq("transaction_id", record.id as string);
          if (tag_ids.length) {
            await supabase
              .from("transaction_tags")
              .insert(tag_ids.map((tagId) => ({ transaction_id: record.id, tag_id: tagId })));
          }
        }
      }
      await removeFromQueue(queue_id);
    }
  }

  private async pullAll() {
    if (!this.userId) return;
    let changed = false;
    for (const table of SYNCABLE_TABLES) {
      const watermarkKey = `pull:${table}`;
      const since = ((await getMeta(watermarkKey)) as string | undefined) ?? "1970-01-01T00:00:00Z";
      const { data, error } = await supabase
        .from(table)
        .select("*")
        .eq("user_id", this.userId)
        .gt("updated_at", since)
        .order("updated_at", { ascending: true })
        .limit(2000);
      if (error) throw error;
      if (data && data.length > 0) {
        changed = true;
        for (const row of data) {
          await putLocal(table as never, row as never);
        }
        const last = data[data.length - 1] as { updated_at: string };
        await setMeta(watermarkKey, last.updated_at);
      }
    }

    const tagsWatermark = "pull:transaction_tags";
    const { data: tagRows, error: tagErr } = await supabase
      .from("transaction_tags")
      .select("transaction_id, tag_id");
    if (!tagErr && tagRows) {
      const map = new Map<string, string[]>();
      for (const r of tagRows as { transaction_id: string; tag_id: string }[]) {
        const arr = map.get(r.transaction_id) ?? [];
        arr.push(r.tag_id);
        map.set(r.transaction_id, arr);
      }
      await setMeta(tagsWatermark, new Date().toISOString());
      if (map.size > 0) {
        changed = true;
        this.tagMapCache = map;
      }
    }

    if (changed && this.onRemoteChange) this.onRemoteChange();
  }

  tagMapCache: Map<string, string[]> | null = null;
}

export const syncEngine = new SyncEngine();
