import type { Correlation } from "@/lib/stats";
import { formatCurrencyCompact } from "@/lib/format";

const W = 560;
const H = 280;
const M = { top: 14, right: 16, bottom: 40, left: 66 };

/** Dispersão com reta de tendência (mínimos quadrados). Um ponto = uma semana. */
export function ScatterView({ xs, ys, fit, xLabel, yLabel }: { xs: number[]; ys: number[]; fit: Correlation | null; xLabel: string; yLabel: string }) {
  const maxX = Math.max(...xs, 1) * 1.08;
  const maxY = Math.max(...ys, 1) * 1.08;
  const pw = W - M.left - M.right;
  const ph = H - M.top - M.bottom;
  const x = (v: number) => M.left + (v / maxX) * pw;
  const y = (v: number) => M.top + ph - (v / maxY) * ph;
  const line = fit ? [0, maxX].map((vx) => [x(vx), y(Math.max(0, Math.min(maxY, fit.slope * vx + fit.intercept)))] as const) : null;
  return (
    <svg className="chart" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Dispersão entre ${xLabel} e ${yLabel}${fit ? `, correlação ${fit.r.toFixed(2)}` : ""}`}>
      {[0, 0.5, 1].map((t) => (
        <g key={t}>
          <line className="gridline" x1={M.left} x2={W - M.right} y1={y(maxY * t)} y2={y(maxY * t)} strokeDasharray={t === 0 ? undefined : "2 4"} />
          <text className="axis" x={M.left - 8} y={y(maxY * t) + 4} textAnchor="end">{formatCurrencyCompact(maxY * t)}</text>
          <text className="axis" x={x(maxX * t)} y={H - 20} textAnchor="middle">{formatCurrencyCompact(maxX * t)}</text>
        </g>
      ))}
      <text className="axis" x={M.left + pw / 2} y={H - 4} textAnchor="middle">{xLabel}</text>
      {line && <line className="draw" pathLength={1} x1={line[0][0]} y1={line[0][1]} x2={line[1][0]} y2={line[1][1]} style={{ stroke: "var(--color-expense)" }} strokeWidth={2} strokeDasharray="1" />}
      {xs.map((vx, i) => (
        <circle key={i} className="pop" cx={x(vx)} cy={y(ys[i])} r={5} style={{ fill: "var(--color-accent)", fillOpacity: 0.75, stroke: "var(--color-panel)", ["--i" as string]: i * 0.5 }} strokeWidth={1.5}>
          <title>{`${xLabel}: ${formatCurrencyCompact(vx)} · ${yLabel}: ${formatCurrencyCompact(ys[i])}`}</title>
        </circle>
      ))}
    </svg>
  );
}
