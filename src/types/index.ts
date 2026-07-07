export type AccountType =
  | "checking"
  | "cash"
  | "credit_card"
  | "savings"
  | "investment"
  | "other";

export type CategoryKind = "income" | "expense";
export type CategoryNature = "fixed" | "variable";
export type TransactionType = "income" | "expense" | "transfer";
export type TransactionStatus = "cleared" | "pending";
export type RecurringFrequency = "weekly" | "biweekly" | "monthly" | "yearly";
export type Plan = "free" | "pro";

interface Syncable {
  id: string;
  user_id: string;
  profile_id: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface Profile {
  id: string;
  display_name: string | null;
  plan: Plan;
  feature_flags: Record<string, unknown>;
  created_at: string;
}

export interface SpendingProfile extends Omit<Syncable, "profile_id" | "deleted_at"> {
  name: string;
  is_default: boolean;
  archived_at: string | null;
}

export interface Account extends Syncable {
  name: string;
  type: AccountType;
  initial_balance: number;
  color: string;
  icon: string;
  credit_limit: number | null;
  closing_day: number | null;
  due_day: number | null;
  archived_at: string | null;
}

export interface Category extends Syncable {
  parent_id: string | null;
  name: string;
  kind: CategoryKind;
  nature: CategoryNature;
  color: string;
  icon: string;
  monthly_budget: number | null;
  archived_at: string | null;
}

export interface Tag extends Syncable {
  name: string;
  color: string;
}

export interface RecurringTransaction extends Syncable {
  account_id: string;
  category_id: string | null;
  type: Extract<TransactionType, "income" | "expense">;
  amount: number;
  description: string;
  frequency: RecurringFrequency;
  interval_count: number;
  day_of_month: number | null;
  start_date: string;
  end_date: string | null;
  next_run_date: string;
  auto_post: boolean;
  active: boolean;
}

export interface Transaction extends Syncable {
  account_id: string;
  category_id: string | null;
  transfer_account_id: string | null;
  recurring_id: string | null;
  type: TransactionType;
  amount: number;
  description: string;
  notes: string | null;
  date: string;
  status: TransactionStatus;
  tag_ids?: string[];
}

export interface Budget extends Syncable {
  category_id: string;
  year: number;
  month: number;
  amount: number;
}

export interface Goal extends Syncable {
  name: string;
  icon: string;
  color: string;
  target_amount: number;
  current_amount: number;
  target_date: string | null;
  account_id: string | null;
  archived_at: string | null;
}

export type SyncTable =
  | "accounts"
  | "categories"
  | "tags"
  | "transactions"
  | "budgets"
  | "goals"
  | "recurring_transactions"
  | "spending_profiles";

export type SyncStatus = "idle" | "syncing" | "offline" | "error";

export interface QueuedMutation {
  queue_id: string;
  table: SyncTable;
  op: "upsert" | "delete";
  record: Record<string, unknown>;
  created_at: string;
  tag_ids?: string[];
}
