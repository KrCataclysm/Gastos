import type { HistogramBin } from "@/lib/stats";
import { formatCurrencyCompact } from "@/lib/format";

const W = 560;
const H = 190;
const M = { top: 12, right: 8, bottom: 30, left: 30 };

export function HistogramView({ bins }: { bins: HistogramBin[] }) {
  const max = Math.max(...bins.map((b) => b.count), 1);
  const pw = W - M.left - M.right;
  const ph = H - M.top - M.bottom;
  const bw = pw / bins.length;
  return (
    <svg className="chart" viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Histograma do gasto semanal">
      <line className="gridline" x1={M.left} x2={W - M.right} y1={M.top + ph} y2={M.top + ph} />
      {bins.map((b, i) => {
        const h = (b.count / max) * ph;
        return (
          <g key={i}>
            <rect x={M.left + i * bw + 1} y={M.top + ph - h} width={bw - 2} height={Math.max(h, b.count ? 1 : 0)} rx={1.5} style={{ fill: "var(--color-accent)" }}>
              <title>{`${formatCurrencyCompact(b.from)} a ${formatCurrencyCompact(b.to)}: ${b.count} semana(s)`}</title>
            </rect>
            {b.count > 0 && <text className="axis" x={M.left + i * bw + bw / 2} y={M.top + ph - h - 4} textAnchor="middle">{b.count}</text>}
            <text className="axis" x={M.left + i * bw + bw / 2} y={H - 10} textAnchor="middle">{formatCurrencyCompact(b.from)}</text>
          </g>
        );
      })}
    </svg>
  );
}
