import { useMutation, useQuery, useQueryClient, type QueryClient } from "@tanstack/react-query";
import { useAuth } from "../auth/AuthProvider";
import { advanceDate } from "../domain/analytics";
import type { Account, Budget, Category, Goal, Profile, Recurring, SpendingProfile, Transaction } from "../domain/types";
import { todayISO, type YearMonth } from "../lib/dates";
import { supabase } from "../lib/supabase";

const PAGE = 1000;

function must<T>(res: { data: T | null; error: { message: string } | null }): T {
  if (res.error) throw new Error(res.error.message);
  if (res.data === null) throw new Error("Resposta vazia do servidor.");
  return res.data;
}

/* ------------------------------------------------------------------ Escopo do usuário */

export interface Scope {
  userId: string;
  profileId: string;
}

export function useSpendingProfile() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["spending_profile", user?.id],
    enabled: !!user,
    staleTime: Infinity,
    queryFn: async (): Promise<SpendingProfile> => {
      const res = await supabase.from("spending_profiles").select("*").is("archived_at", null).order("is_default", { ascending: false }).order("created_at").limit(1).maybeSingle();
      return must({ data: res.data as SpendingProfile | null, error: res.error });
    },
  });
}

export function useScope(): Scope | null {
  const { user } = useAuth();
  const sp = useSpendingProfile();
  return user && sp.data ? { userId: user.id, profileId: sp.data.id } : null;
}

function requireScope(scope: Scope | null): Scope {
  if (!scope) throw new Error("Sessão ainda carregando. Tente de novo em instantes.");
  return scope;
}

/* ------------------------------------------------------------------ Leituras */

export function useProfile() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["profile", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const r = await supabase.from("profiles").select("*").eq("id", user!.id).single();
      return must({ data: r.data as Profile | null, error: r.error });
    },
  });
}

export function useAccounts() {
  const scope = useScope();
  return useQuery({
    queryKey: ["accounts", scope?.userId],
    enabled: !!scope,
    queryFn: async () => {
      const r = await supabase.from("accounts").select("*").is("deleted_at", null).order("created_at");
      return must({ data: r.data as Account[] | null, error: r.error });
    },
  });
}

export function useCategories() {
  const scope = useScope();
  return useQuery({
    queryKey: ["categories", scope?.userId],
    enabled: !!scope,
    queryFn: async () => {
      const r = await supabase.from("categories").select("*").is("deleted_at", null).order("name");
      return must({ data: r.data as Category[] | null, error: r.error });
    },
  });
}

async function fetchTransactions(from: string, to: string): Promise<Transaction[]> {
  const all: Transaction[] = [];
  for (let offset = 0; ; offset += PAGE) {
    const r = await supabase.from("transactions").select("*").is("deleted_at", null).gte("date", from).lte("date", to).order("date", { ascending: false }).order("created_at", { ascending: false }).range(offset, offset + PAGE - 1);
    const rows = must({ data: r.data as Transaction[] | null, error: r.error });
    all.push(...rows);
    if (rows.length < PAGE) return all;
  }
}

export function useTransactions(from: string, to: string) {
  const scope = useScope();
  return useQuery({ queryKey: ["transactions", scope?.userId, from, to], enabled: !!scope, queryFn: () => fetchTransactions(from, to) });
}

/** Histórico completo (para saldos de conta). Paginado; o volume de um usuário pessoal é baixo. */
export function useAllTransactions() {
  const scope = useScope();
  return useQuery({ queryKey: ["transactions", scope?.userId, "all"], enabled: !!scope, queryFn: () => fetchTransactions("1970-01-01", "2999-12-31") });
}

export function useBudgets(ym: YearMonth) {
  const scope = useScope();
  return useQuery({
    queryKey: ["budgets", scope?.userId, ym.year, ym.month],
    enabled: !!scope,
    queryFn: async () => {
      const r = await supabase.from("budgets").select("*").is("deleted_at", null).eq("year", ym.year).eq("month", ym.month);
      return must({ data: r.data as Budget[] | null, error: r.error });
    },
  });
}

export function useGoals() {
  const scope = useScope();
  return useQuery({
    queryKey: ["goals", scope?.userId],
    enabled: !!scope,
    queryFn: async () => {
      const r = await supabase.from("goals").select("*").is("deleted_at", null).is("archived_at", null).order("created_at");
      return must({ data: r.data as Goal[] | null, error: r.error });
    },
  });
}

export function useRecurring() {
  const scope = useScope();
  return useQuery({
    queryKey: ["recurring", scope?.userId],
    enabled: !!scope,
    queryFn: async () => {
      const r = await supabase.from("recurring_transactions").select("*").is("deleted_at", null).order("next_run_date");
      return must({ data: r.data as Recurring[] | null, error: r.error });
    },
  });
}

/* ------------------------------------------------------------------ Escritas */

const invalidate = (qc: QueryClient, ...keys: string[]) => Promise.all(keys.map((k) => qc.invalidateQueries({ queryKey: [k] })));

export type TransactionInput = Pick<Transaction, "type" | "amount" | "description" | "date" | "account_id" | "category_id" | "transfer_account_id" | "notes" | "status">;

export function useSaveTransaction() {
  const qc = useQueryClient();
  const scope = useScope();
  return useMutation({
    mutationFn: async ({ id, input }: { id?: string; input: TransactionInput }) => {
      const s = requireScope(scope);
      const row = { ...input, user_id: s.userId, profile_id: s.profileId };
      const r = id ? await supabase.from("transactions").update(input).eq("id", id) : await supabase.from("transactions").insert(row);
      if (r.error) throw new Error(r.error.message);
    },
    onSuccess: () => invalidate(qc, "transactions"),
  });
}

export function useDeleteTransaction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const r = await supabase.from("transactions").update({ deleted_at: new Date().toISOString() }).eq("id", id);
      if (r.error) throw new Error(r.error.message);
    },
    onSuccess: () => invalidate(qc, "transactions"),
  });
}

export function useRestoreTransaction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const r = await supabase.from("transactions").update({ deleted_at: null }).eq("id", id);
      if (r.error) throw new Error(r.error.message);
    },
    onSuccess: () => invalidate(qc, "transactions"),
  });
}

export type AccountInput = Pick<Account, "name" | "type" | "initial_balance" | "color" | "icon">;
export function useSaveAccount() {
  const qc = useQueryClient();
  const scope = useScope();
  return useMutation({
    mutationFn: async ({ id, input }: { id?: string; input: AccountInput }) => {
      const s = requireScope(scope);
      const r = id ? await supabase.from("accounts").update(input).eq("id", id) : await supabase.from("accounts").insert({ ...input, user_id: s.userId, profile_id: s.profileId });
      if (r.error) throw new Error(r.error.message);
    },
    onSuccess: () => invalidate(qc, "accounts"),
  });
}

export function useArchiveAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, archived }: { id: string; archived: boolean }) => {
      const r = await supabase.from("accounts").update({ archived_at: archived ? new Date().toISOString() : null }).eq("id", id);
      if (r.error) throw new Error(r.error.message);
    },
    onSuccess: () => invalidate(qc, "accounts"),
  });
}

export type CategoryInput = Pick<Category, "name" | "kind" | "nature" | "color" | "icon" | "monthly_budget">;
export function useSaveCategory() {
  const qc = useQueryClient();
  const scope = useScope();
  return useMutation({
    mutationFn: async ({ id, input }: { id?: string; input: CategoryInput }) => {
      const s = requireScope(scope);
      const r = id ? await supabase.from("categories").update(input).eq("id", id) : await supabase.from("categories").insert({ ...input, user_id: s.userId, profile_id: s.profileId });
      if (r.error) throw new Error(r.error.message);
    },
    onSuccess: () => invalidate(qc, "categories", "budgets"),
  });
}

export function useArchiveCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, archived }: { id: string; archived: boolean }) => {
      const r = await supabase.from("categories").update({ archived_at: archived ? new Date().toISOString() : null }).eq("id", id);
      if (r.error) throw new Error(r.error.message);
    },
    onSuccess: () => invalidate(qc, "categories"),
  });
}

/** Define o teto do mês para uma categoria (upsert pela chave única category_id+year+month). */
export function useSetBudget() {
  const qc = useQueryClient();
  const scope = useScope();
  return useMutation({
    mutationFn: async ({ categoryId, ym, amount }: { categoryId: string; ym: YearMonth; amount: number }) => {
      const s = requireScope(scope);
      const r = await supabase.from("budgets").upsert({ category_id: categoryId, year: ym.year, month: ym.month, amount, deleted_at: null, user_id: s.userId, profile_id: s.profileId }, { onConflict: "category_id,year,month" });
      if (r.error) throw new Error(r.error.message);
    },
    onSuccess: () => invalidate(qc, "budgets"),
  });
}

export type GoalInput = Pick<Goal, "name" | "icon" | "color" | "target_amount" | "target_date">;
export function useSaveGoal() {
  const qc = useQueryClient();
  const scope = useScope();
  return useMutation({
    mutationFn: async ({ id, input }: { id?: string; input: GoalInput }) => {
      const s = requireScope(scope);
      const r = id ? await supabase.from("goals").update(input).eq("id", id) : await supabase.from("goals").insert({ ...input, user_id: s.userId, profile_id: s.profileId });
      if (r.error) throw new Error(r.error.message);
    },
    onSuccess: () => invalidate(qc, "goals"),
  });
}

export function useSetGoalAmount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, current }: { id: string; current: number }) => {
      const r = await supabase.from("goals").update({ current_amount: Math.max(0, current) }).eq("id", id);
      if (r.error) throw new Error(r.error.message);
    },
    onSuccess: () => invalidate(qc, "goals"),
  });
}

export function useDeleteGoal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const r = await supabase.from("goals").update({ deleted_at: new Date().toISOString() }).eq("id", id);
      if (r.error) throw new Error(r.error.message);
    },
    onSuccess: () => invalidate(qc, "goals"),
  });
}

export type RecurringInput = Pick<Recurring, "type" | "amount" | "description" | "account_id" | "category_id" | "frequency" | "start_date" | "day_of_month">;
export function useSaveRecurring() {
  const qc = useQueryClient();
  const scope = useScope();
  return useMutation({
    mutationFn: async ({ id, input }: { id?: string; input: RecurringInput }) => {
      const s = requireScope(scope);
      const r = id
        ? await supabase.from("recurring_transactions").update(input).eq("id", id)
        : await supabase.from("recurring_transactions").insert({ ...input, next_run_date: input.start_date, interval_count: 1, auto_post: false, user_id: s.userId, profile_id: s.profileId });
      if (r.error) throw new Error(r.error.message);
    },
    onSuccess: () => invalidate(qc, "recurring"),
  });
}

export function useDeleteRecurring() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const r = await supabase.from("recurring_transactions").update({ deleted_at: new Date().toISOString(), active: false }).eq("id", id);
      if (r.error) throw new Error(r.error.message);
    },
    onSuccess: () => invalidate(qc, "recurring"),
  });
}

/**
 * Lança uma conta fixa vencida. Primeiro "reserva" a ocorrência avançando next_run_date
 * condicionalmente (evita lançar em duplicidade com duplo clique ou duas abas) e só então cria a transação.
 */
export function usePostRecurring() {
  const qc = useQueryClient();
  const scope = useScope();
  return useMutation({
    mutationFn: async (rec: Recurring) => {
      const s = requireScope(scope);
      const next = advanceDate(rec.next_run_date, rec.frequency, rec.interval_count, rec.day_of_month);
      const claim = await supabase.from("recurring_transactions").update({ next_run_date: next }).eq("id", rec.id).eq("next_run_date", rec.next_run_date).select("id");
      if (claim.error) throw new Error(claim.error.message);
      if (!claim.data || claim.data.length === 0) return; // outra aba já lançou
      const ins = await supabase.from("transactions").insert({
        user_id: s.userId, profile_id: s.profileId, account_id: rec.account_id, category_id: rec.category_id, recurring_id: rec.id,
        type: rec.type, amount: rec.amount, description: rec.description, date: rec.next_run_date <= todayISO() ? rec.next_run_date : todayISO(), status: "cleared",
      });
      if (ins.error) {
        await supabase.from("recurring_transactions").update({ next_run_date: rec.next_run_date }).eq("id", rec.id);
        throw new Error(ins.error.message);
      }
    },
    onSuccess: () => invalidate(qc, "recurring", "transactions"),
  });
}

export function useUpdateProfile() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (patch: Partial<Omit<Profile, "id" | "plan" | "created_at">>) => {
      const r = await supabase.from("profiles").update(patch).eq("id", user!.id);
      if (r.error) throw new Error(r.error.message);
    },
    onSuccess: () => invalidate(qc, "profile"),
  });
}
