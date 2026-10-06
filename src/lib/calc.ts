import {
  addDays,
  addMonths,
  addWeeks,
  addYears,
  differenceInCalendarDays,
  differenceInCalendarMonths,
  endOfMonth,
  getDaysInMonth,
  isAfter,
  isBefore,
  isWithinInterval,
  parseISO,
  startOfMonth,
  subMonths,
} from "date-fns";
import type { Account, Budget, Category, RecurringTransaction, Transaction } from "@/types";

export function parseDate(iso: string): Date {
  return parseISO(iso.length === 10 ? `${iso}T00:00:00` : iso);
}

function active(t: Transaction): boolean {
  return !t.deleted_at;
}

export function accountDelta(accountId: string, t: Transaction): number {
  if (t.type === "transfer") {
    if (t.account_id === accountId) return -t.amount;
    if (t.transfer_account_id === accountId) return t.amount;
    return 0;
  }
  if (t.account_id !== accountId) return 0;
  return t.type === "income" ? t.amount : -t.amount;
}

export function accountBalance(
  account: Account,
  transactions: Transaction[],
  asOf: Date = new Date(),
): number {
  let bal = account.initial_balance;
  for (const t of transactions) {
    if (!active(t) || t.status !== "cleared") continue;
    if (isAfter(parseDate(t.date), asOf)) continue;
    bal += accountDelta(account.id, t);
  }
  return bal;
}

export function totalNetWorth(
  accounts: Account[],
  transactions: Transaction[],
  asOf: Date = new Date(),
): number {
  return accounts.reduce((sum, a) => sum + accountBalance(a, transactions, asOf), 0);
}

export function periodTransactions(transactions: Transaction[], start: Date, end: Date): Transaction[] {
  return transactions.filter((t) => active(t) && isWithinInterval(parseDate(t.date), { start, end }));
}

export function sumByType(transactions: Transaction[], type: "income" | "expense"): number {
  return transactions
    .filter((t) => t.type === type && t.status === "cleared")
    .reduce((s, t) => s + t.amount, 0);
}

export function savingsRate(income: number, expense: number): number {
  if (income <= 0) return 0;
  return (income - expense) / income;
}

export interface DRESummary {
  income: number;
  fixedExpense: number;
  variableExpense: number;
  result: number;
  savingsRate: number;
}

export function buildDRE(
  transactions: Transaction[],
  categories: Category[],
  start: Date,
  end: Date,
): DRESummary {
  const catMap = new Map(categories.map((c) => [c.id, c]));
  const period = periodTransactions(transactions, start, end).filter((t) => t.status === "cleared");
  let income = 0;
  let fixedExpense = 0;
  let variableExpense = 0;
  for (const t of period) {
    if (t.type === "income") {
      income += t.amount;
      continue;
    }
    if (t.type === "expense") {
      const cat = t.category_id ? catMap.get(t.category_id) : undefined;
      if (cat?.nature === "fixed") fixedExpense += t.amount;
      else variableExpense += t.amount;
    }
  }
  const result = income - fixedExpense - variableExpense;
  return { income, fixedExpense, variableExpense, result, savingsRate: savingsRate(income, fixedExpense + variableExpense) };
}

export function categoryAverage(
  transactions: Transaction[],
  categoryId: string,
  monthsBack: number,
  referenceDate: Date = new Date(),
): number {
  const end = endOfMonth(subMonths(referenceDate, 1));
  const start = startOfMonth(subMonths(referenceDate, monthsBack));
  const relevant = transactions.filter(
    (t) =>
      active(t) &&
      t.category_id === categoryId &&
      t.status === "cleared" &&
      t.type === "expense" &&
      isWithinInterval(parseDate(t.date), { start, end }),
  );
  const total = relevant.reduce((s, t) => s + t.amount, 0);
  return total / monthsBack;
}

export function expandOccurrences(
  r: RecurringTransaction,
  rangeStart: Date,
  rangeEnd: Date,
): Date[] {
  if (!r.active) return [];
  const occurrences: Date[] = [];
  let cursor = parseDate(r.next_run_date);
  const hardEnd = r.end_date ? parseDate(r.end_date) : null;
  let guard = 0;
  while (!isAfter(cursor, rangeEnd) && guard < 500) {
    guard++;
    if (hardEnd && isAfter(cursor, hardEnd)) break;
    if (!isBefore(cursor, rangeStart)) occurrences.push(cursor);
    switch (r.frequency) {
      case "weekly":
        cursor = addWeeks(cursor, r.interval_count);
        break;
      case "biweekly":
        cursor = addWeeks(cursor, 2 * r.interval_count);
        break;
      case "monthly":
        cursor = addMonths(cursor, r.interval_count);
        break;
      case "yearly":
        cursor = addYears(cursor, r.interval_count);
        break;
    }
  }
  return occurrences;
}

export function advanceRecurringDate(
  cursor: Date,
  r: Pick<RecurringTransaction, "frequency" | "interval_count">,
): Date {
  switch (r.frequency) {
    case "weekly":
      return addWeeks(cursor, r.interval_count);
    case "biweekly":
      return addWeeks(cursor, 2 * r.interval_count);
    case "monthly":
      return addMonths(cursor, r.interval_count);
    case "yearly":
      return addYears(cursor, r.interval_count);
  }
}

export interface MonthProjection {
  projectedIncome: number;
  projectedExpense: number;
  projectedResult: number;
}

export function monthEndProjection(
  transactions: Transaction[],
  categories: Category[],
  recurring: RecurringTransaction[],
  referenceDate: Date = new Date(),
): MonthProjection {
  const catMap = new Map(categories.map((c) => [c.id, c]));
  const monthStart = startOfMonth(referenceDate);
  const monthEnd = endOfMonth(referenceDate);
  const daysElapsed = Math.max(1, differenceInCalendarDays(referenceDate, monthStart) + 1);
  const daysInMonth = getDaysInMonth(referenceDate);

  const soFar = periodTransactions(transactions, monthStart, referenceDate).filter((t) => t.status === "cleared");
  const incomeSoFar = sumByType(soFar, "income");
  const fixedExpenseSoFar = soFar
    .filter((t) => t.type === "expense" && catMap.get(t.category_id ?? "")?.nature === "fixed")
    .reduce((s, t) => s + t.amount, 0);
  const variableExpenseSoFar = soFar
    .filter((t) => t.type === "expense" && catMap.get(t.category_id ?? "")?.nature !== "fixed")
    .reduce((s, t) => s + t.amount, 0);

  const pacedVariable = (variableExpenseSoFar / daysElapsed) * daysInMonth;

  let recurringExpenseRemaining = 0;
  let recurringIncomeRemaining = 0;
  const remainingStart = isAfter(referenceDate, monthStart) ? addDays(referenceDate, 1) : monthStart;
  for (const r of recurring) {
    const occ = expandOccurrences(r, remainingStart, monthEnd);
    const amt = occ.length * r.amount;
    if (r.type === "expense") recurringExpenseRemaining += amt;
    else recurringIncomeRemaining += amt;
  }

  const projectedIncome = incomeSoFar + recurringIncomeRemaining;
  const projectedExpense = fixedExpenseSoFar + pacedVariable + recurringExpenseRemaining;
  return { projectedIncome, projectedExpense, projectedResult: projectedIncome - projectedExpense };
}

export interface BudgetLine {
  category: Category;
  budgeted: number;
  spent: number;
  pct: number;
}

export function budgetConsumption(
  transactions: Transaction[],
  categories: Category[],
  budgets: Budget[],
  year: number,
  month: number,
): BudgetLine[] {
  const monthStart = new Date(year, month - 1, 1);
  const monthEnd = endOfMonth(monthStart);
  const spentByCat = new Map<string, number>();
  for (const t of transactions) {
    if (!active(t) || t.type !== "expense" || t.status !== "cleared" || !t.category_id) continue;
    const d = parseDate(t.date);
    if (d < monthStart || d > monthEnd) continue;
    spentByCat.set(t.category_id, (spentByCat.get(t.category_id) ?? 0) + t.amount);
  }
  const budgetByCat = new Map(
    budgets.filter((b) => !b.deleted_at && b.year === year && b.month === month).map((b) => [b.category_id, b.amount]),
  );
  return categories
    .filter((c) => !c.deleted_at && c.kind === "expense")
    .map((c) => {
      const budgeted = budgetByCat.get(c.id) ?? c.monthly_budget ?? 0;
      const spent = spentByCat.get(c.id) ?? 0;
      return { category: c, budgeted, spent, pct: budgeted > 0 ? spent / budgeted : 0 };
    })
    .filter((line) => line.budgeted > 0 || line.spent > 0);
}

export function monthTotals(transactions: Transaction[], year: number, month: number) {
  const start = new Date(year, month - 1, 1);
  const end = endOfMonth(start);
  const items = periodTransactions(transactions, start, end).filter((t) => t.status === "cleared");
  return { income: sumByType(items, "income"), expense: sumByType(items, "expense") };
}

export function yearTotals(transactions: Transaction[], year: number) {
  const start = new Date(year, 0, 1);
  const end = new Date(year, 11, 31, 23, 59, 59);
  const items = periodTransactions(transactions, start, end).filter((t) => t.status === "cleared");
  return { income: sumByType(items, "income"), expense: sumByType(items, "expense") };
}

export interface MonthSeriesPoint {
  year: number;
  month: number;
  income: number;
  expense: number;
}

export function lastNMonthsSeries(
  transactions: Transaction[],
  n: number,
  referenceDate: Date = new Date(),
): MonthSeriesPoint[] {
  const out: MonthSeriesPoint[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = subMonths(referenceDate, i);
    const totals = monthTotals(transactions, d.getFullYear(), d.getMonth() + 1);
    out.push({ year: d.getFullYear(), month: d.getMonth() + 1, ...totals });
  }
  return out;
}

export function monthsSinceRegistration(
  registeredAt: Date,
  referenceDate: Date,
  maxMonths: number,
): number {
  const diff = differenceInCalendarMonths(startOfMonth(referenceDate), startOfMonth(registeredAt)) + 1;
  return Math.min(maxMonths, Math.max(1, diff));
}

export function creditCardCycle(closingDay: number, referenceDate: Date = new Date()): { start: Date; end: Date } {
  const day = referenceDate.getDate();
  const endMonthOffset = day > closingDay ? 1 : 0;
  const end = new Date(referenceDate.getFullYear(), referenceDate.getMonth() + endMonthOffset, closingDay);
  const start = new Date(end.getFullYear(), end.getMonth() - 1, closingDay + 1);
  return { start, end };
}

export function creditCardInvoiceTotal(
  account: Account,
  transactions: Transaction[],
  referenceDate: Date = new Date(),
): number {
  if (account.type !== "credit_card" || !account.closing_day) return 0;
  const { start, end } = creditCardCycle(account.closing_day, referenceDate);
  return transactions
    .filter(
      (t) =>
        !t.deleted_at &&
        t.account_id === account.id &&
        t.type === "expense" &&
        isWithinInterval(parseDate(t.date), { start, end }),
    )
    .reduce((s, t) => s + t.amount, 0);
}

export function categoryDistribution(
  transactions: Transaction[],
  categories: Category[],
  start: Date,
  end: Date,
  kind: "income" | "expense" = "expense",
): Array<{ category: Category; total: number }> {
  const catMap = new Map(categories.map((c) => [c.id, c]));
  const totals = new Map<string, number>();
  for (const t of periodTransactions(transactions, start, end)) {
    if (t.type !== kind || t.status !== "cleared" || !t.category_id) continue;
    totals.set(t.category_id, (totals.get(t.category_id) ?? 0) + t.amount);
  }
  return Array.from(totals.entries())
    .map(([categoryId, total]) => ({ category: catMap.get(categoryId)!, total }))
    .filter((x) => x.category)
    .sort((a, b) => b.total - a.total);
}
