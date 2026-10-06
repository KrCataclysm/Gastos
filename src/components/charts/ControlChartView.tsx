import type { ControlChart } from "@/lib/stats";
import { formatCurrency, formatCurrencyCompact } from "@/lib/format";

const W = 560;
const H = 220;
const M = { top: 14, right: 12, bottom: 28, left: 92 };

/** Gráfico de controle de valores individuais: pontos fora dos limites em terracota, linha central tracejada. */
export function ControlChartView({ values, labels, chart }: { values: number[]; labels: string[]; chart: ControlChart }) {
  const max = Math.max(chart.ucl, ...values) * 1.08 || 1;
  const pw = W - M.left - M.right;
  const ph = H - M.top - M.bottom;
  const x = (i: number) => M.left + (values.length === 1 ? pw / 2 : (pw * i) / (values.length - 1));
  const y = (v: number) => M.top + ph - (v / max) * ph;
  const path = values.map((v, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(" ");
  const out = new Set(chart.outOfControl);
  const run = new Set(chart.runs);
  const step = Math.ceil(values.length / 8);
  return (
    <svg className="chart" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Gráfico de controle do gasto semanal: média ${formatCurrency(chart.center)}, limite superior ${formatCurrency(chart.ucl)}, ${chart.outOfControl.length} ponto(s) fora de controle`}>
      {[["LSC", chart.ucl], ["Média", chart.center], ["LIC", chart.lcl]].map(([name, v]) => (
        <g key={name as string}>
          <line className="gridline" x1={M.left} x2={W - M.right} y1={y(v as number)} y2={y(v as number)} strokeDasharray={name === "Média" ? undefined : "5 4"} style={name === "Média" ? { stroke: "var(--color-accent)" } : undefined} />
          <text className="axis" x={M.left - 8} y={y(v as number) + 3.5} textAnchor="end">{name === "Média" ? formatCurrencyCompact(v as number) : `${name} ${formatCurrencyCompact(v as number)}`}</text>
        </g>
      ))}
      <path className="draw" pathLength={1} d={path} fill="none" style={{ stroke: "var(--color-text-muted)" }} strokeWidth={1.5} />
      {values.map((v, i) => (
        <g key={labels[i]}>
          <circle className="pop" cx={x(i)} cy={y(v)} r={out.has(i) ? 5 : 3.5} style={{ ["--i" as string]: i * 0.7, fill: out.has(i) ? "var(--color-expense)" : run.has(i) ? "var(--color-warning, var(--color-expense))" : "var(--color-accent)" }}>
            <title>{`Semana de ${labels[i]}: ${formatCurrency(v)}${out.has(i) ? " (fora de controle)" : ""}`}</title>
          </circle>
          {i % step === 0 && <text className="axis" x={x(i)} y={H - 8} textAnchor="middle">{labels[i]}</text>}
        </g>
      ))}
    </svg>
  );
}
