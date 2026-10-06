import type { MonthSeriesPoint } from "@/lib/calc";
import { formatCurrency, formatCurrencyCompact, monthShortLabel } from "@/lib/format";

const W = 560;
const H = 230;
const M = { top: 14, right: 8, bottom: 30, left: 66 };

/** Receitas x despesas por mês: SVG próprio, sem biblioteca. Receita em verde-petróleo e despesa em terracota (distinguíveis também no daltonismo). */
export function MonthlyBars({ data }: { data: MonthSeriesPoint[] }) {
  const max = Math.max(...data.flatMap((p) => [p.income, p.expense]), 1);
  const pw = W - M.left - M.right;
  const ph = H - M.top - M.bottom;
  const slot = pw / data.length;
  const bw = Math.min(26, slot * 0.3);
  const y = (v: number) => M.top + ph - (v / max) * ph;
  const ticks = [0, 0.5, 1];
  return (
    <svg className="chart" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Receitas e despesas dos últimos ${data.length} meses`}>
      {ticks.map((t) => (
        <g key={t}>
          <line className="gridline" x1={M.left} x2={W - M.right} y1={y(max * t)} y2={y(max * t)} strokeDasharray={t === 0 ? undefined : "2 4"} />
          <text className="axis" x={M.left - 8} y={y(max * t) + 3.5} textAnchor="end">{formatCurrencyCompact(max * t)}</text>
        </g>
      ))}
      {data.map((p, i) => {
        const cx = M.left + slot * i + slot / 2;
        return (
          <g key={`${p.year}-${p.month}`}>
            <rect x={cx - bw - 2} y={y(p.income)} width={bw} height={Math.max(1, M.top + ph - y(p.income))} rx={1.5} style={{ fill: "var(--color-accent)" }}><title>{`Receitas: ${formatCurrency(p.income)}`}</title></rect>
            <rect x={cx + 2} y={y(p.expense)} width={bw} height={Math.max(1, M.top + ph - y(p.expense))} rx={1.5} style={{ fill: "var(--color-expense)" }}><title>{`Despesas: ${formatCurrency(p.expense)}`}</title></rect>
            <text className="axis" x={cx} y={H - 10} textAnchor="middle">{monthShortLabel(p.year, p.month).toUpperCase()}</text>
          </g>
        );
      })}
    </svg>
  );
}
