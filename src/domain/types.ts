export type TxType = "income" | "expense" | "transfer";
export type TxStatus = "cleared" | "pending";
export type AccountType = "checking" | "cash" | "credit_card" | "savings" | "investment" | "other";
export type Nature = "fixed" | "variable";
export type Frequency = "weekly" | "biweekly" | "monthly" | "yearly";

export interface Profile {
  id: string;
  display_name: string | null;
  plan: string;
  created_at: string;
  institution?: string | null;
  course?: string | null;
  semester_start?: string | null;
  semester_end?: string | null;
  monthly_income_goal?: number | null;
}

export interface SpendingProfile {
  id: string;
  user_id: string;
  name: string;
  is_default: boolean;
}

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  initial_balance: number;
  color: string;
  icon: string;
  archived_at: string | null;
}

export interface Category {
  id: string;
  name: string;
  kind: "income" | "expense";
  nature: Nature;
  color: string;
  icon: string;
  monthly_budget: number | null;
  archived_at: string | null;
}

export interface Transaction {
  id: string;
  account_id: string;
  category_id: string | null;
  transfer_account_id: string | null;
  recurring_id: string | null;
  type: TxType;
  amount: number;
  description: string;
  notes: string | null;
  date: string;
  status: TxStatus;
}

export interface Budget {
  id: string;
  category_id: string;
  year: number;
  month: number;
  amount: number;
}

export interface Goal {
  id: string;
  name: string;
  icon: string;
  color: string;
  target_amount: number;
  current_amount: number;
  target_date: string | null;
  archived_at: string | null;
}

export interface Recurring {
  id: string;
  account_id: string;
  category_id: string | null;
  type: "income" | "expense";
  amount: number;
  description: string;
  frequency: Frequency;
  interval_count: number;
  day_of_month: number | null;
  start_date: string;
  end_date: string | null;
  next_run_date: string;
  active: boolean;
}
