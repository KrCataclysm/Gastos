/** Datas do app são strings "YYYY-MM-DD" no fuso local (igual ao tipo `date` do Postgres). */
const pad = (n: number) => String(n).padStart(2, "0");

export const toISODate = (d: Date): string => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const todayISO = (): string => toISODate(new Date());

export function parseISODate(iso: string): Date {
  const [y = 1970, m = 1, d = 1] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export interface YearMonth {
  year: number;
  month: number; // 1-12
}

export const currentYearMonth = (now = new Date()): YearMonth => ({ year: now.getFullYear(), month: now.getMonth() + 1 });
export const daysInMonth = ({ year, month }: YearMonth): number => new Date(year, month, 0).getDate();

export function addMonths({ year, month }: YearMonth, delta: number): YearMonth {
  const idx = year * 12 + (month - 1) + delta;
  return { year: Math.floor(idx / 12), month: (idx % 12) + 1 };
}

export const monthRange = (ym: YearMonth): { from: string; to: string } => ({
  from: `${ym.year}-${pad(ym.month)}-01`,
  to: `${ym.year}-${pad(ym.month)}-${pad(daysInMonth(ym))}`,
});

export const sameMonth = (a: YearMonth, b: YearMonth): boolean => a.year === b.year && a.month === b.month;
export const ymKey = ({ year, month }: YearMonth): string => `${year}-${pad(month)}`;
export const isoToYearMonth = (iso: string): YearMonth => ({ year: Number(iso.slice(0, 4)), month: Number(iso.slice(5, 7)) });

const monthName = new Intl.DateTimeFormat("pt-BR", { month: "long" });
const monthShort = new Intl.DateTimeFormat("pt-BR", { month: "short" });
const dayLong = new Intl.DateTimeFormat("pt-BR", { weekday: "long", day: "2-digit", month: "long" });
const dayShort = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
export const monthLabel = (ym: YearMonth): string => `${cap(monthName.format(new Date(ym.year, ym.month - 1, 1)))} de ${ym.year}`;
export const monthShortLabel = (ym: YearMonth): string => cap(monthShort.format(new Date(ym.year, ym.month - 1, 1)).replace(".", ""));
export const dayLabel = (iso: string): string => cap(dayLong.format(parseISODate(iso)));
export const dateBR = (iso: string): string => dayShort.format(parseISODate(iso));

/** Dias restantes no mês, contando o dia de hoje. Em meses passados = 0; em futuros = todos. */
export function daysLeftInMonth(ym: YearMonth, now = new Date()): number {
  const cur = currentYearMonth(now);
  const total = daysInMonth(ym);
  if (ym.year * 12 + ym.month < cur.year * 12 + cur.month) return 0;
  if (ym.year * 12 + ym.month > cur.year * 12 + cur.month) return total;
  return total - now.getDate() + 1;
}

export function addDaysISO(iso: string, days: number): string {
  const d = parseISODate(iso);
  d.setDate(d.getDate() + days);
  return toISODate(d);
}
