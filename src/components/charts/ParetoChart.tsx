import type { ParetoItem } from "@/lib/analysis";
import { formatCurrency as formatBRL, formatPercent } from "@/lib/format";

const W = 640;
const H = 330;
const M = { top: 20, right: 48, bottom: 86, left: 56 };

const clip = (s: string, n: number) => (s.length > n ? `${s.slice(0, n - 1)}…` : s);

/** Gráfico de Pareto: barras (valor) ordenadas + linha do % acumulado + referência de 80%. */
export function ParetoChart({ items }: { items: ParetoItem[] }) {
  const maxBars = 7;
  let data = items;
  if (items.length > maxBars) {
    const head = items.slice(0, maxBars - 1);
    const tail = items.slice(maxBars - 1);
    const total = tail.reduce((s, i) => s + i.total, 0);
    data = [...head, { id: "__rest__", name: `Outras (${tail.length})`, color: "#94a3b8", nature: "variable", total, count: tail.reduce((s, i) => s + i.count, 0), share: tail.reduce((s, i) => s + i.share, 0), cumulative: 1, vital: tail.some((t) => t.vital) }];
  }
  const max = Math.max(...data.map((d) => d.total), 1);
  const pw = W - M.left - M.right;
  const ph = H - M.top - M.bottom;
  const slot = pw / data.length;
  const bw = Math.min(56, slot * 0.62);
  const x = (i: number) => M.left + slot * i + slot / 2;
  const yVal = (v: number) => M.top + ph - (v / max) * ph;
  const yPct = (p: number) => M.top + ph - p * ph;
  const line = data.map((d, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)},${yPct(d.cumulative).toFixed(1)}`).join(" ");
  const ticks = [0, 0.5, 1];

  return (
    <svg className="chart" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Gráfico de Pareto com ${data.length} categorias de despesa`}>
      {ticks.map((t) => (
        <g key={t}>
          <line className="gridline" x1={M.left} x2={W - M.right} y1={yPct(t)} y2={yPct(t)} />
          <text className="axis" x={W - M.right + 6} y={yPct(t) + 4}>{Math.round(t * 100)}%</text>
          <text className="axis" x={M.left - 6} y={yPct(t) + 4} textAnchor="end">{formatCompact(max * t)}</text>
        </g>
      ))}
      <line x1={M.left} x2={W - M.right} y1={yPct(0.8)} y2={yPct(0.8)} stroke="var(--color-warning)" strokeWidth={1.5} strokeDasharray="6 4" />
      <text x={W - M.right + 6} y={yPct(0.8) + 4} fontSize={11} fontWeight={700} style={{ fill: "var(--color-warning)" }}>80%</text>
      {data.map((d, i) => (
        <g key={d.id}>
          <rect className="bar" style={{ ["--i" as string]: i }} x={x(i) - bw / 2} y={yVal(d.total)} width={bw} height={Math.max(1, M.top + ph - yVal(d.total))} rx={4} fill={d.vital ? "var(--color-accent)" : "var(--chart-muted)"}>
            <title>{`${d.name}: ${formatBRL(d.total)} (${formatPercent(d.share)}, acumulado ${formatPercent(d.cumulative)})`}</title>
          </rect>
          <text x={x(i)} y={yVal(d.total) - 6} textAnchor="middle" fontSize={11} fontWeight={600}>{formatPercent(d.share)}</text>
          <text className="axis" transform={`translate(${x(i)},${H - M.bottom + 14}) rotate(-35)`} textAnchor="end">{clip(d.name, 16)}</text>
        </g>
      ))}
      <path className="draw" pathLength={1} style={{ ["--i" as string]: data.length * 0.6 }} d={line} fill="none" stroke="var(--color-text)" strokeWidth={2} />
      {data.map((d, i) => <circle className="pop" style={{ fill: "var(--color-panel)", stroke: "var(--color-text)", ["--i" as string]: i }} key={d.id} cx={x(i)} cy={yPct(d.cumulative)} r={3.5} strokeWidth={2} />)}
    </svg>
  );
}

function formatCompact(n: number): string {
  if (n >= 1000) return `${(n / 1000).toLocaleString("pt-BR", { maximumFractionDigits: 1 })} mil`;
  return Math.round(n).toLocaleString("pt-BR");
}
