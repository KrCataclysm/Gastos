import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useAuth } from "@/contexts/AuthContext";
import { getAllLocal, putLocal } from "@/lib/db";
import { syncEngine } from "@/lib/sync";
import { newId } from "@/lib/id";
import { advanceRecurringDate, expandOccurrences, parseDate } from "@/lib/calc";
import { todayISO, toDateOnlyISO } from "@/lib/format";
import type {
  Account,
  Budget,
  Category,
  RecurringTransaction,
  SpendingProfile,
  SyncStatus,
  SyncTable,
  Tag,
  Transaction,
} from "@/types";

function nowIso() {
  return new Date().toISOString();
}

type Draft<T> = Partial<T> & { id?: string };

interface DataContextValue {
  loading: boolean;
  syncStatus: SyncStatus;
  spendingProfile: SpendingProfile | null;
  accounts: Account[];
  categories: Category[];
  tags: Tag[];
  transactions: Transaction[];
  budgets: Budget[];
  recurringTransactions: RecurringTransaction[];
  saveAccount: (input: Draft<Account>) => Promise<Account>;
  removeAccount: (id: string) => Promise<void>;
  saveCategory: (input: Draft<Category>) => Promise<Category>;
  removeCategory: (id: string) => Promise<void>;
  saveTag: (input: Draft<Tag>) => Promise<Tag>;
  removeTag: (id: string) => Promise<void>;
  saveTransaction: (input: Draft<Transaction>, tagIds?: string[]) => Promise<Transaction>;
  removeTransaction: (id: string) => Promise<void>;
  saveBudget: (input: Draft<Budget>) => Promise<Budget>;
  removeBudget: (id: string) => Promise<void>;
  saveRecurring: (input: Draft<RecurringTransaction>) => Promise<RecurringTransaction>;
  removeRecurring: (id: string) => Promise<void>;
  syncNow: () => Promise<void>;
}

const DataContext = createContext<DataContextValue | null>(null);

export function DataProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>("idle");
  const [spendingProfile, setSpendingProfile] = useState<SpendingProfile | null>(null);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [recurringTransactions, setRecurringTransactions] = useState<RecurringTransaction[]>([]);

  const reload = useCallback(async () => {
    const [sp, acc, cat, tg, txRaw, bud, rec] = await Promise.all([
      getAllLocal("spending_profiles"),
      getAllLocal("accounts"),
      getAllLocal("categories"),
      getAllLocal("tags"),
      getAllLocal("transactions"),
      getAllLocal("budgets"),
      getAllLocal("recurring_transactions"),
    ]);
    const tagMap = syncEngine.tagMapCache;
    setSpendingProfile(sp.find((p) => !p.archived_at) ?? sp[0] ?? null);
    setAccounts(acc.filter((a) => !a.deleted_at).sort((a, b) => a.name.localeCompare(b.name)));
    setCategories(cat.filter((c) => !c.deleted_at).sort((a, b) => a.name.localeCompare(b.name)));
    setTags(tg.filter((t) => !t.deleted_at).sort((a, b) => a.name.localeCompare(b.name)));
    setTransactions(
      txRaw
        .filter((t) => !t.deleted_at)
        .map((t) => ({ ...t, tag_ids: tagMap?.get(t.id) ?? t.tag_ids ?? [] }))
        .sort((a, b) => b.date.localeCompare(a.date) || b.created_at.localeCompare(a.created_at)),
    );
    setBudgets(bud.filter((b) => !b.deleted_at));
    setRecurringTransactions(rec.filter((r) => !r.deleted_at));
  }, []);

  useEffect(() => {
    if (!user) return;
    let disposed = false;
    const unsubStatus = syncEngine.subscribe(setSyncStatus);
    setLoading(true);
    (async () => {
      await reload();
      syncEngine.init(user.id, () => {
        if (!disposed) void reload();
      });
      await syncEngine.syncNow();
      if (!disposed) {
        await reload();
        setLoading(false);
      }
    })();
    return () => {
      disposed = true;
      unsubStatus();
      syncEngine.dispose();
    };
  }, [user, reload]);

  async function persist<T extends { id: string }>(
    table: SyncTable,
    record: T,
    tagIds?: string[],
  ): Promise<T> {
    await putLocal(table as never, record as never);
    await syncEngine.queueMutation({ table, op: "upsert", record: record as never, tag_ids: tagIds });
    return record;
  }

  const saveAccount = useCallback(
    async (input: Draft<Account>) => {
      if (!user || !spendingProfile) throw new Error("Sessão não carregada ainda.");
      const id = input.id ?? newId();
      const existing = accounts.find((a) => a.id === id);
      const record: Account = {
        id,
        user_id: user.id,
        profile_id: spendingProfile.id,
        name: input.name ?? existing?.name ?? "Conta",
        type: input.type ?? existing?.type ?? "checking",
        initial_balance: input.initial_balance ?? existing?.initial_balance ?? 0,
        color: input.color ?? existing?.color ?? "#6366f1",
        icon: input.icon ?? existing?.icon ?? "wallet",
        credit_limit: input.credit_limit ?? existing?.credit_limit ?? null,
        closing_day: input.closing_day ?? existing?.closing_day ?? null,
        due_day: input.due_day ?? existing?.due_day ?? null,
        archived_at: input.archived_at ?? existing?.archived_at ?? null,
        deleted_at: null,
        created_at: existing?.created_at ?? nowIso(),
        updated_at: nowIso(),
      };
      await persist("accounts", record);
      setAccounts((prev) => [...prev.filter((a) => a.id !== id), record].sort((a, b) => a.name.localeCompare(b.name)));
      return record;
    },
    [user, spendingProfile, accounts],
  );

  const removeAccount = useCallback(
    async (id: string) => {
      const existing = accounts.find((a) => a.id === id);
      if (!existing) return;
      const record = { ...existing, deleted_at: nowIso(), updated_at: nowIso() };
      await persist("accounts", record);
      setAccounts((prev) => prev.filter((a) => a.id !== id));
    },
    [accounts],
  );

  const saveCategory = useCallback(
    async (input: Draft<Category>) => {
      if (!user || !spendingProfile) throw new Error("Sessão não carregada ainda.");
      const id = input.id ?? newId();
      const existing = categories.find((c) => c.id === id);
      const parentId = input.parent_id !== undefined ? input.parent_id : existing?.parent_id ?? null;
      if (parentId) {
        const parent = categories.find((c) => c.id === parentId);
        if (parent?.parent_id) {
          throw new Error("Categorias suportam apenas 2 níveis (categoria e subcategoria).");
        }
      }
      const record: Category = {
        id,
        user_id: user.id,
        profile_id: spendingProfile.id,
        parent_id: parentId,
        name: input.name ?? existing?.name ?? "Categoria",
        kind: input.kind ?? existing?.kind ?? "expense",
        nature: input.nature ?? existing?.nature ?? "variable",
        color: input.color ?? existing?.color ?? "#6366f1",
        icon: input.icon ?? existing?.icon ?? "tag",
        monthly_budget: input.monthly_budget !== undefined ? input.monthly_budget : existing?.monthly_budget ?? null,
        archived_at: input.archived_at ?? existing?.archived_at ?? null,
        deleted_at: null,
        created_at: existing?.created_at ?? nowIso(),
        updated_at: nowIso(),
      };
      await persist("categories", record);
      setCategories((prev) => [...prev.filter((c) => c.id !== id), record].sort((a, b) => a.name.localeCompare(b.name)));
      return record;
    },
    [user, spendingProfile, categories],
  );

  const removeCategory = useCallback(
    async (id: string) => {
      const existing = categories.find((c) => c.id === id);
      if (!existing) return;
      const record = { ...existing, deleted_at: nowIso(), updated_at: nowIso() };
      await persist("categories", record);
      setCategories((prev) => prev.filter((c) => c.id !== id));
    },
    [categories],
  );

  const saveTag = useCallback(
    async (input: Draft<Tag>) => {
      if (!user || !spendingProfile) throw new Error("Sessão não carregada ainda.");
      const id = input.id ?? newId();
      const existing = tags.find((t) => t.id === id);
      const record: Tag = {
        id,
        user_id: user.id,
        profile_id: spendingProfile.id,
        name: input.name ?? existing?.name ?? "tag",
        color: input.color ?? existing?.color ?? "#6366f1",
        deleted_at: null,
        created_at: existing?.created_at ?? nowIso(),
        updated_at: nowIso(),
      };
      await persist("tags", record);
      setTags((prev) => [...prev.filter((t) => t.id !== id), record].sort((a, b) => a.name.localeCompare(b.name)));
      return record;
    },
    [user, spendingProfile, tags],
  );

  const removeTag = useCallback(
    async (id: string) => {
      const existing = tags.find((t) => t.id === id);
      if (!existing) return;
      const record = { ...existing, deleted_at: nowIso(), updated_at: nowIso() };
      await persist("tags", record);
      setTags((prev) => prev.filter((t) => t.id !== id));
    },
    [tags],
  );

  const saveTransaction = useCallback(
    async (input: Draft<Transaction>, tagIds?: string[]) => {
      if (!user || !spendingProfile) throw new Error("Sessão não carregada ainda.");
      const id = input.id ?? newId();
      const existing = transactions.find((t) => t.id === id);
      const record: Transaction = {
        id,
        user_id: user.id,
        profile_id: spendingProfile.id,
        account_id: input.account_id ?? existing?.account_id ?? "",
        category_id: input.category_id !== undefined ? input.category_id : existing?.category_id ?? null,
        transfer_account_id:
          input.transfer_account_id !== undefined ? input.transfer_account_id : existing?.transfer_account_id ?? null,
        recurring_id: input.recurring_id !== undefined ? input.recurring_id : existing?.recurring_id ?? null,
        type: input.type ?? existing?.type ?? "expense",
        amount: input.amount ?? existing?.amount ?? 0,
        description: input.description ?? existing?.description ?? "",
        notes: input.notes !== undefined ? input.notes : existing?.notes ?? null,
        date: input.date ?? existing?.date ?? nowIso().slice(0, 10),
        status: input.status ?? existing?.status ?? "cleared",
        deleted_at: null,
        created_at: existing?.created_at ?? nowIso(),
        updated_at: nowIso(),
      };
      const finalTagIds = tagIds ?? existing?.tag_ids ?? [];
      await persist("transactions", record, finalTagIds);
      setTransactions((prev) =>
        [...prev.filter((t) => t.id !== id), { ...record, tag_ids: finalTagIds }].sort(
          (a, b) => b.date.localeCompare(a.date) || b.created_at.localeCompare(a.created_at),
        ),
      );
      return record;
    },
    [user, spendingProfile, transactions],
  );

  const removeTransaction = useCallback(
    async (id: string) => {
      const existing = transactions.find((t) => t.id === id);
      if (!existing) return;
      const record = { ...existing, deleted_at: nowIso(), updated_at: nowIso() };
      const { tag_ids: _tagIds, ...rest } = record;
      await persist("transactions", rest, []);
      setTransactions((prev) => prev.filter((t) => t.id !== id));
    },
    [transactions],
  );

  const saveBudget = useCallback(
    async (input: Draft<Budget>) => {
      if (!user || !spendingProfile) throw new Error("Sessão não carregada ainda.");
      const id = input.id ?? newId();
      const existing = budgets.find((b) => b.id === id);
      const record: Budget = {
        id,
        user_id: user.id,
        profile_id: spendingProfile.id,
        category_id: input.category_id ?? existing?.category_id ?? "",
        year: input.year ?? existing?.year ?? new Date().getFullYear(),
        month: input.month ?? existing?.month ?? new Date().getMonth() + 1,
        amount: input.amount ?? existing?.amount ?? 0,
        deleted_at: null,
        created_at: existing?.created_at ?? nowIso(),
        updated_at: nowIso(),
      };
      await persist("budgets", record);
      setBudgets((prev) => [...prev.filter((b) => b.id !== id), record]);
      return record;
    },
    [user, spendingProfile, budgets],
  );

  const removeBudget = useCallback(
    async (id: string) => {
      const existing = budgets.find((b) => b.id === id);
      if (!existing) return;
      const record = { ...existing, deleted_at: nowIso(), updated_at: nowIso() };
      await persist("budgets", record);
      setBudgets((prev) => prev.filter((b) => b.id !== id));
    },
    [budgets],
  );

  const saveRecurring = useCallback(
    async (input: Draft<RecurringTransaction>) => {
      if (!user || !spendingProfile) throw new Error("Sessão não carregada ainda.");
      const id = input.id ?? newId();
      const existing = recurringTransactions.find((r) => r.id === id);
      const record: RecurringTransaction = {
        id,
        user_id: user.id,
        profile_id: spendingProfile.id,
        account_id: input.account_id ?? existing?.account_id ?? "",
        category_id: input.category_id !== undefined ? input.category_id : existing?.category_id ?? null,
        type: input.type ?? existing?.type ?? "expense",
        amount: input.amount ?? existing?.amount ?? 0,
        description: input.description ?? existing?.description ?? "",
        frequency: input.frequency ?? existing?.frequency ?? "monthly",
        interval_count: input.interval_count ?? existing?.interval_count ?? 1,
        day_of_month: input.day_of_month !== undefined ? input.day_of_month : existing?.day_of_month ?? null,
        start_date: input.start_date ?? existing?.start_date ?? nowIso().slice(0, 10),
        end_date: input.end_date !== undefined ? input.end_date : existing?.end_date ?? null,
        next_run_date: input.next_run_date ?? existing?.next_run_date ?? input.start_date ?? nowIso().slice(0, 10),
        auto_post: input.auto_post ?? existing?.auto_post ?? false,
        active: input.active ?? existing?.active ?? true,
        deleted_at: null,
        created_at: existing?.created_at ?? nowIso(),
        updated_at: nowIso(),
      };
      await persist("recurring_transactions", record);
      setRecurringTransactions((prev) => [...prev.filter((r) => r.id !== id), record]);
      return record;
    },
    [user, spendingProfile, recurringTransactions],
  );

  const removeRecurring = useCallback(
    async (id: string) => {
      const existing = recurringTransactions.find((r) => r.id === id);
      if (!existing) return;
      const record = { ...existing, deleted_at: nowIso(), updated_at: nowIso() };
      await persist("recurring_transactions", record);
      setRecurringTransactions((prev) => prev.filter((r) => r.id !== id));
    },
    [recurringTransactions],
  );

  const autoPostingRef = useRef(false);
  useEffect(() => {
    if (loading || autoPostingRef.current) return;
    const today = todayISO();
    const due = recurringTransactions.filter((r) => r.active && r.auto_post && r.next_run_date <= today);
    if (due.length === 0) return;
    autoPostingRef.current = true;
    (async () => {
      for (const r of due) {
        const occurrences = expandOccurrences(r, parseDate(r.next_run_date), parseDate(today));
        for (const occ of occurrences) {
          await saveTransaction({
            account_id: r.account_id,
            category_id: r.category_id,
            type: r.type,
            amount: r.amount,
            description: r.description,
            date: toDateOnlyISO(occ),
            status: "cleared",
            recurring_id: r.id,
          });
        }
        if (occurrences.length > 0) {
          const next = advanceRecurringDate(occurrences[occurrences.length - 1], r);
          await saveRecurring({ id: r.id, next_run_date: toDateOnlyISO(next) });
        }
      }
      autoPostingRef.current = false;
    })();
  }, [loading, recurringTransactions, saveTransaction, saveRecurring]);

  const syncNow = useCallback(async () => {
    await syncEngine.syncNow();
    await reload();
  }, [reload]);

  const value: DataContextValue = {
    loading,
    syncStatus,
    spendingProfile,
    accounts,
    categories,
    tags,
    transactions,
    budgets,
    recurringTransactions,
    saveAccount,
    removeAccount,
    saveCategory,
    removeCategory,
    saveTag,
    removeTag,
    saveTransaction,
    removeTransaction,
    saveBudget,
    removeBudget,
    saveRecurring,
    removeRecurring,
    syncNow,
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData(): DataContextValue {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error("useData deve ser usado dentro de DataProvider");
  return ctx;
}
