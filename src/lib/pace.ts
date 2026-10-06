/**
 * "Prumo": onde você deveria estar hoje.
 * Orçamento: se o mês tem 30 dias e hoje é dia 15, o ritmo ideal é ter gasto 50% do limite.
 * Meta: se já passou metade do prazo, o ideal é ter juntado metade do valor.
 */

export type PaceStatus = "ok" | "warn" | "off" | "over" | "done";

export const PACE_LABEL: Record<PaceStatus, string> = {
  ok: "No prumo",
  warn: "Atenção",
  off: "Fora do prumo",
  over: "Estourou",
  done: "Concluída",
};

/** Tom visual da régua para cada situação. */
export const PACE_TONE: Record<PaceStatus, "ok" | "warn" | "over" | "done"> = { ok: "ok", warn: "warn", off: "over", over: "over", done: "done" };

const clamp01 = (n: number) => Math.min(1, Math.max(0, n));
const DAY = 86_400_000;

/** Fração do mês já transcorrida (inclui o dia de hoje). Meses passados = 1; futuros = 0. */
export function monthFraction(year: number, month: number, ref: Date = new Date()): number {
  const cur = ref.getFullYear() * 12 + ref.getMonth();
  const target = year * 12 + (month - 1);
  if (target < cur) return 1;
  if (target > cur) return 0;
  const days = new Date(year, month, 0).getDate();
  return clamp01(ref.getDate() / days);
}

export interface BudgetPace {
  fractionOfMonth: number;
  fractionSpent: number;
  idealSpent: number;
  /** gasto - ideal (positivo = acima do ritmo) */
  deviation: number;
  status: PaceStatus;
}

export function budgetPace(spent: number, budget: number, fractionOfMonth: number): BudgetPace | null {
  if (!(budget > 0)) return null;
  const fractionSpent = spent / budget;
  const idealSpent = budget * fractionOfMonth;
  const diff = fractionSpent - fractionOfMonth;
  const status: PaceStatus = fractionSpent > 1 ? "over" : diff <= 0.02 ? "ok" : diff <= 0.12 ? "warn" : "off";
  return { fractionOfMonth, fractionSpent, idealSpent, deviation: spent - idealSpent, status };
}

export interface GoalPace {
  fractionOfTime: number;
  fractionDone: number;
  status: PaceStatus;
  /** quanto guardar por mês, a partir de hoje, para chegar no prazo (0 se já concluída) */
  perMonth: number | null;
  monthsLeft: number | null;
}

export function goalPace(goal: { target_amount: number; current_amount: number; target_date: string | null; created_at: string }, ref: Date = new Date()): GoalPace {
  const fractionDone = goal.target_amount > 0 ? goal.current_amount / goal.target_amount : 0;
  if (fractionDone >= 1) return { fractionOfTime: 1, fractionDone, status: "done", perMonth: 0, monthsLeft: 0 };
  if (!goal.target_date) return { fractionOfTime: 0, fractionDone, status: "ok", perMonth: null, monthsLeft: null };
  const start = new Date(goal.created_at).getTime();
  const end = new Date(`${goal.target_date}T23:59:59`).getTime();
  const now = ref.getTime();
  const fractionOfTime = end > start ? clamp01((now - start) / (end - start)) : 1;
  const monthsLeft = Math.max(1, Math.ceil((end - now) / (30.4375 * DAY)));
  const missing = Math.max(0, goal.target_amount - goal.current_amount);
  const diff = fractionDone - fractionOfTime;
  const overdue = now > end;
  const status: PaceStatus = overdue ? "off" : diff >= -0.02 ? "ok" : diff >= -0.15 ? "warn" : "off";
  return { fractionOfTime, fractionDone, status, perMonth: overdue ? missing : missing / monthsLeft, monthsLeft: overdue ? 0 : monthsLeft };
}
