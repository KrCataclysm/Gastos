import { openDB, type DBSchema, type IDBPDatabase } from "idb";
import type {
  Account,
  Budget,
  Category,
  QueuedMutation,
  RecurringTransaction,
  SpendingProfile,
  Tag,
  Transaction,
} from "@/types";

interface GastosDB extends DBSchema {
  accounts: { key: string; value: Account; indexes: { updated_at: string } };
  categories: { key: string; value: Category; indexes: { updated_at: string } };
  tags: { key: string; value: Tag; indexes: { updated_at: string } };
  transactions: {
    key: string;
    value: Transaction;
    indexes: { updated_at: string; date: string; account_id: string };
  };
  budgets: { key: string; value: Budget; indexes: { updated_at: string } };
  recurring_transactions: {
    key: string;
    value: RecurringTransaction;
    indexes: { updated_at: string };
  };
  spending_profiles: { key: string; value: SpendingProfile };
  mutation_queue: { key: string; value: QueuedMutation };
  meta: { key: string; value: unknown };
}

let dbPromise: Promise<IDBPDatabase<GastosDB>> | null = null;

export function getDb() {
  if (!dbPromise) {
    dbPromise = openDB<GastosDB>("gastos-db", 1, {
      upgrade(db) {
        const accounts = db.createObjectStore("accounts", { keyPath: "id" });
        accounts.createIndex("updated_at", "updated_at");

        const categories = db.createObjectStore("categories", { keyPath: "id" });
        categories.createIndex("updated_at", "updated_at");

        const tags = db.createObjectStore("tags", { keyPath: "id" });
        tags.createIndex("updated_at", "updated_at");

        const transactions = db.createObjectStore("transactions", { keyPath: "id" });
        transactions.createIndex("updated_at", "updated_at");
        transactions.createIndex("date", "date");
        transactions.createIndex("account_id", "account_id");

        const budgets = db.createObjectStore("budgets", { keyPath: "id" });
        budgets.createIndex("updated_at", "updated_at");

        const recurring = db.createObjectStore("recurring_transactions", { keyPath: "id" });
        recurring.createIndex("updated_at", "updated_at");

        db.createObjectStore("spending_profiles", { keyPath: "id" });
        db.createObjectStore("mutation_queue", { keyPath: "queue_id" });
        db.createObjectStore("meta");
      },
    });
  }
  return dbPromise;
}

export async function getAllLocal<T extends keyof GastosDB>(
  store: T,
): Promise<GastosDB[T]["value"][]> {
  const db = await getDb();
  return db.getAll(store as never);
}

export async function putLocal<T extends "accounts" | "categories" | "tags" | "transactions" | "budgets" | "recurring_transactions" | "spending_profiles">(
  store: T,
  value: GastosDB[T]["value"],
): Promise<void> {
  const db = await getDb();
  await db.put(store, value);
}

export async function getMeta(key: string): Promise<unknown> {
  const db = await getDb();
  return db.get("meta", key);
}

export async function setMeta(key: string, value: unknown): Promise<void> {
  const db = await getDb();
  await db.put("meta", value, key);
}

export async function clearAllLocal(): Promise<void> {
  const db = await getDb();
  await Promise.all(
    [
      "accounts",
      "categories",
      "tags",
      "transactions",
      "budgets",
      "recurring_transactions",
      "spending_profiles",
      "mutation_queue",
      "meta",
    ].map((s) => db.clear(s as never)),
  );
}

export async function enqueueMutation(m: QueuedMutation): Promise<void> {
  const db = await getDb();
  await db.put("mutation_queue", m);
}

export async function getQueue(): Promise<QueuedMutation[]> {
  const db = await getDb();
  return db.getAll("mutation_queue");
}

export async function removeFromQueue(queueId: string): Promise<void> {
  const db = await getDb();
  await db.delete("mutation_queue", queueId);
}
