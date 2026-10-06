import { addDaysISO, addMonths, daysInMonth, isoToYearMonth, parseISODate, toISODate, ymKey, type YearMonth } from "../lib/dates";
import { fromCents, toCents } from "../lib/money";
import type { Account, Budget, Category, Frequency, Nature, Recurring, Transaction } from "./types";

export const UNCATEGORIZED_ID = "__none__";
const UNCATEGORIZED: Pick<Category, "name" | "color" | "nature"> = { name: "Sem categoria", color: "#94a3b8", nature: "variable" };

/* ------------------------------------------------------------------ Resumo */

export interface Summary {
  income: number;
  expense: number;
  balance: number;
  savingsRate: number | null; // sobra / receita
}

/** Transferências entre contas não são receita nem despesa. */
export function summarize(txs: readonly Transaction[]): Summary {
  let inc = 0;
  let exp = 0;
  for (const t of txs) {
    if (t.type === "income") inc += toCents(t.amount);
    else if (t.type === "expense") exp += toCents(t.amount);
  }
  return { income: fromCents(inc), expense: fromCents(exp), balance: fromCents(inc - exp), savingsRate: inc > 0 ? (inc - exp) / inc : null };
}

export function accountBalances(accounts: readonly Account[], txs: readonly Transaction[]): Map<string, number> {
  const cents = new Map(accounts.map((a) => [a.id, toCents(a.initial_balance)]));
  const add = (id: string | null, delta: number) => {
    if (id && cents.has(id)) cents.set(id, (cents.get(id) ?? 0) + delta);
  };
  for (const t of txs) {
    if (t.status === "pending") continue;
    const c = toCents(t.amount);
    if (t.type === "income") add(t.account_id, c);
    else if (t.type === "expense") add(t.account_id, -c);
    else {
      add(t.account_id, -c);
      add(t.transfer_account_id, c);
    }
  }
  return new Map([...cents].map(([id, v]) => [id, fromCents(v)]));
}

/* ------------------------------------------------------------------ Por categoria */

export interface CategoryTotal {
  id: string;
  name: string;
  color: string;
  nature: Nature;
  total: number;
  count: number;
}

export function totalsByCategory(txs: readonly Transaction[], categories: readonly Category[], kind: "expense" | "income" = "expense"): CategoryTotal[] {
  const byId = new Map(categories.map((c) => [c.id, c]));
  const acc = new Map<string, { cents: number; count: number }>();
  for (const t of txs) {
    if (t.type !== kind) continue;
    const key = t.category_id && byId.has(t.category_id) ? t.category_id : UNCATEGORIZED_ID;
    const cur = acc.get(key) ?? { cents: 0, count: 0 };
    cur.cents += toCents(t.amount);
    cur.count += 1;
    acc.set(key, cur);
  }
  return [...acc]
    .map(([id, v]) => {
      const c = byId.get(id) ?? UNCATEGORIZED;
      return { id, name: c.name, color: c.color, nature: c.nature, total: fromCents(v.cents), count: v.count };
    })
    .sort((a, b) => b.total - a.total || a.name.localeCompare(b.name, "pt-BR"));
}

/* ------------------------------------------------------------------ Pareto */

export interface ParetoItem extends CategoryTotal {
  share: number; // % do total (0-1)
  cumulative: number; // % acumulado até este item, inclusive (0-1)
  vital: boolean; // pertence ao grupo que explica ~80% do total
}

/**
 * Princípio de Pareto: ordena causas por impacto e marca as "vitais", isto é,
 * as primeiras que, somadas, alcançam o limiar (80% por padrão). O item que
 * cruza o limiar também é vital.
 */
export function pareto(items: readonly CategoryTotal[], threshold = 0.8): ParetoItem[] {
  const sorted = [...items].filter((i) => i.total > 0).sort((a, b) => b.total - a.total);
  const total = sorted.reduce((s, i) => s + toCents(i.total), 0);
  if (total === 0) return [];
  let running = 0;
  let before = 0;
  return sorted.map((i) => {
    before = running;
    running += toCents(i.total);
    return { ...i, share: toCents(i.total) / total, cumulative: running / total, vital: before / total < threshold };
  });
}

/* ------------------------------------------------------------------ Ishikawa */

export interface Rib {
  label: string;
  total: number;
  count: number;
}

export interface Bone {
  id: string;
  name: string;
  color: string;
  nature: Nature;
  total: number;
  share: number;
  ribs: Rib[];
}

const normalizeLabel = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();

/**
 * Diagrama de causa e efeito (espinha de peixe) dos gastos:
 * efeito = total gasto; espinhas = categorias de maior impacto;
 * causas = descrições que mais pesam dentro de cada categoria.
 */
export function ishikawa(txs: readonly Transaction[], categories: readonly Category[], opts: { maxBones?: number; maxRibs?: number } = {}): { effectTotal: number; bones: Bone[] } {
  const { maxBones = 6, maxRibs = 3 } = opts;
  const expenses = txs.filter((t) => t.type === "expense");
  const grand = expenses.reduce((s, t) => s + toCents(t.amount), 0);
  const cats = totalsByCategory(expenses, categories, "expense");

  const ribsFor = (ids: Set<string>): Rib[] => {
    const groups = new Map<string, { label: string; cents: number; count: number }>();
    for (const t of expenses) {
      const key = t.category_id && ids.has(t.category_id) ? t.category_id : ids.has(UNCATEGORIZED_ID) && !t.category_id ? UNCATEGORIZED_ID : null;
      if (!key) continue;
      const raw = t.description.trim() || "Sem descrição";
      const norm = normalizeLabel(raw);
      const g = groups.get(norm) ?? { label: raw, cents: 0, count: 0 };
      g.cents += toCents(t.amount);
      g.count += 1;
      groups.set(norm, g);
    }
    const sorted = [...groups.values()].sort((a, b) => b.cents - a.cents);
    const keep = sorted.length === maxRibs + 1 ? maxRibs + 1 : maxRibs;
    const top = sorted.slice(0, keep).map((g) => ({ label: g.label, total: fromCents(g.cents), count: g.count }));
    const rest = sorted.slice(keep);
    if (rest.length > 0) top.push({ label: `Outros (${rest.length})`, total: fromCents(rest.reduce((s, g) => s + g.cents, 0)), count: rest.reduce((s, g) => s + g.count, 0) });
    return top;
  };

  const limit = cats.length === maxBones + 1 ? maxBones + 1 : maxBones; // não agrupa "Outras (1)"
  const head = cats.slice(0, limit);
  const tail = cats.slice(limit);
  const bones: Bone[] = head.map((c) => ({ id: c.id, name: c.name, color: c.color, nature: c.nature, total: c.total, share: grand ? toCents(c.total) / grand : 0, ribs: ribsFor(new Set([c.id])) }));
  if (tail.length > 0) {
    const cents = tail.reduce((s, c) => s + toCents(c.total), 0);
    bones.push({ id: "__rest__", name: `Outras (${tail.length})`, color: "#94a3b8", nature: "variable", total: fromCents(cents), share: grand ? cents / grand : 0, ribs: ribsFor(new Set(tail.map((c) => c.id))) });
  }
  return { effectTotal: fromCents(grand), bones };
}

/* ------------------------------------------------------------------ Fixos x variáveis */

export function fixedVariable(txs: readonly Transaction[], categories: readonly Category[]): { fixed: number; variable: number } {
  const totals = totalsByCategory(txs, categories, "expense");
  let fixed = 0;
  let variable = 0;
  for (const c of totals) {
    if (c.nature === "fixed") fixed += toCents(c.total);
    else variable += toCents(c.total);
  }
  return { fixed: fromCents(fixed), variable: fromCents(variable) };
}

/* ------------------------------------------------------------------ Série mensal */

export interface MonthPoint extends Summary {
  ym: YearMonth;
}

export function monthlySeries(txs: readonly Transaction[], end: YearMonth, months = 6): MonthPoint[] {
  const buckets = new Map<string, Transaction[]>();
  for (const t of txs) {
    const k = ymKey(isoToYearMonth(t.date));
    const arr = buckets.get(k);
    if (arr) arr.push(t);
    else buckets.set(k, [t]);
  }
  return Array.from({ length: months }, (_, i) => {
    const ym = addMonths(end, i - (months - 1));
    return { ym, ...summarize(buckets.get(ymKey(ym)) ?? []) };
  });
}

/* ------------------------------------------------------------------ Orçamento */

export interface BudgetLine {
  category: Category;
  planned: number;
  spent: number;
  ratio: number; // gasto / planejado
  status: "ok" | "warn" | "over";
}

/** Orçamento do mês: tabela `budgets` tem prioridade; senão usa `monthly_budget` da categoria. */
export function budgetLines(categories: readonly Category[], budgets: readonly Budget[], txs: readonly Transaction[]): BudgetLine[] {
  const spent = new Map(totalsByCategory(txs, categories).map((c) => [c.id, c.total]));
  const override = new Map(budgets.map((b) => [b.category_id, b.amount]));
  return categories
    .filter((c) => c.kind === "expense" && !c.archived_at)
    .map((category) => {
      const planned = override.get(category.id) ?? category.monthly_budget ?? 0;
      const s = spent.get(category.id) ?? 0;
      const ratio = planned > 0 ? s / planned : 0;
      return { category, planned, spent: s, ratio, status: planned <= 0 ? ("ok" as const) : ratio > 1 ? ("over" as const) : ratio >= 0.85 ? ("warn" as const) : ("ok" as const) };
    })
    .filter((l) => l.planned > 0 || l.spent > 0)
    .sort((a, b) => b.ratio - a.ratio || b.spent - a.spent);
}

/** Totais do orçamento considerando só categorias que têm limite (compara o que é comparável). */
export function budgetTotals(lines: readonly BudgetLine[]): { planned: number; spent: number; unbudgeted: number } {
  let planned = 0;
  let spent = 0;
  let unbudgeted = 0;
  for (const l of lines) {
    if (l.planned > 0) {
      planned += toCents(l.planned);
      spent += toCents(l.spent);
    } else unbudgeted += toCents(l.spent);
  }
  return { planned: fromCents(planned), spent: fromCents(spent), unbudgeted: fromCents(unbudgeted) };
}

/** Quanto ainda dá para gastar por dia até o fim do mês, dado o que sobrou do plano. */
export function dailyAllowance(remaining: number, daysLeft: number): number | null {
  if (daysLeft <= 0) return null;
  return Math.max(0, fromCents(Math.floor(toCents(remaining) / daysLeft)));
}

/* ------------------------------------------------------------------ Recorrências */

export function advanceDate(iso: string, frequency: Frequency, interval: number, dayOfMonth?: number | null): string {
  const n = Math.max(1, interval);
  if (frequency === "weekly") return addDaysISO(iso, 7 * n);
  if (frequency === "biweekly") return addDaysISO(iso, 14 * n);
  const d = parseISODate(iso);
  const stepMonths = frequency === "yearly" ? 12 * n : n;
  const target = addMonths({ year: d.getFullYear(), month: d.getMonth() + 1 }, stepMonths);
  const wanted = dayOfMonth ?? d.getDate();
  const day = Math.min(wanted, daysInMonth(target));
  return toISODate(new Date(target.year, target.month - 1, day));
}

export const dueRecurring = (list: readonly Recurring[], today: string): Recurring[] =>
  list.filter((r) => r.active && r.next_run_date <= today && (!r.end_date || r.next_run_date <= r.end_date)).sort((a, b) => a.next_run_date.localeCompare(b.next_run_date));

/* ------------------------------------------------------------------ Insights em linguagem simples */

export interface Insight {
  tone: "good" | "warn" | "info";
  text: string;
}

export function buildInsights(input: { current: Summary; previous: Summary | null; pareto: ParetoItem[]; budgets: BudgetLine[]; fmt: (n: number) => string }): Insight[] {
  const { current, previous, pareto: p, budgets, fmt } = input;
  const out: Insight[] = [];
  if (current.income > 0 && current.expense > current.income) out.push({ tone: "warn", text: `Você gastou ${fmt(current.expense - current.income)} a mais do que recebeu neste mês.` });
  else if (current.income > 0 && current.savingsRate !== null && current.savingsRate >= 0.1) out.push({ tone: "good", text: `Você está guardando ${Math.round(current.savingsRate * 100)}% da sua renda neste mês.` });
  if (previous && previous.expense > 0 && current.expense > 0) {
    const diff = (current.expense - previous.expense) / previous.expense;
    if (Math.abs(diff) >= 0.05) out.push({ tone: diff > 0 ? "warn" : "good", text: `Seus gastos estão ${Math.round(Math.abs(diff) * 100)}% ${diff > 0 ? "maiores" : "menores"} que no mês anterior.` });
  }
  const vitals = p.filter((i) => i.vital);
  if (vitals.length > 0 && p.length > 2) {
    const sum = vitals.reduce((s, i) => s + i.share, 0);
    out.push({ tone: "info", text: `${vitals.length} ${vitals.length === 1 ? "categoria concentra" : "categorias concentram"} ${Math.round(sum * 100)}% dos seus gastos: ${vitals.map((v) => v.name).join(", ")}.` });
  }
  const over = budgets.filter((b) => b.status === "over");
  if (over.length > 0) out.push({ tone: "warn", text: `Orçamento estourado em ${over.map((b) => b.category.name).join(", ")}.` });
  return out;
}
