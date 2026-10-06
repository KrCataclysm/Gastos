import type { MonthPoint } from "../../domain/analytics";
import { monthShortLabel } from "../../lib/dates";
import { formatBRL, formatBRLCompact } from "../../lib/money";

const W = 640;
const H = 270;
const M = { top: 16, right: 12, bottom: 34, left: 62 };

export function MonthlyBars({ points }: { points: MonthPoint[] }) {
  const max = Math.max(...points.flatMap((p) => [p.income, p.expense]), 1);
  const pw = W - M.left - M.right;
  const ph = H - M.top - M.bottom;
  const slot = pw / points.length;
  const bw = Math.min(26, slot * 0.32);
  const y = (v: number) => M.top + ph - (v / max) * ph;
  const ticks = [0, 0.5, 1];
  return (
    <svg className="chart" viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Receitas e despesas dos últimos meses">
      {ticks.map((t) => (
        <g key={t}>
          <line className="gridline" x1={M.left} x2={W - M.right} y1={y(max * t)} y2={y(max * t)} />
          <text className="axis" x={M.left - 8} y={y(max * t) + 4} textAnchor="end">{formatBRLCompact(max * t)}</text>
        </g>
      ))}
      {points.map((p, i) => {
        const cx = M.left + slot * i + slot / 2;
        return (
          <g key={`${p.ym.year}-${p.ym.month}`}>
            <rect x={cx - bw - 2} y={y(p.income)} width={bw} height={Math.max(1, M.top + ph - y(p.income))} rx={3} style={{ fill: "var(--bar-income)" }}><title>{`Receitas: ${formatBRL(p.income)}`}</title></rect>
            <rect x={cx + 2} y={y(p.expense)} width={bw} height={Math.max(1, M.top + ph - y(p.expense))} rx={3} style={{ fill: "var(--bar-expense)" }}><title>{`Despesas: ${formatBRL(p.expense)}`}</title></rect>
            <text className="axis" x={cx} y={H - 12} textAnchor="middle">{monthShortLabel(p.ym)}</text>
          </g>
        );
      })}
    </svg>
  );
}
