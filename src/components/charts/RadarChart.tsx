const SIZE = 320;
const C = SIZE / 2;
const R = 100;

interface Axis { label: string; score: number | null }

const point = (i: number, n: number, r: number): [number, number] => {
  const a = -Math.PI / 2 + (2 * Math.PI * i) / n;
  return [C + r * Math.cos(a), C + r * Math.sin(a)];
};

/** Radar de 0 a 100. Eixos sem dados ficam no centro e são marcados com "—". */
export function RadarChart({ axes, label }: { axes: Axis[]; label: string }) {
  const n = axes.length;
  const poly = axes.map((a, i) => point(i, n, (R * (a.score ?? 0)) / 100).join(",")).join(" ");
  return (
    <svg className="chart" viewBox={`-60 0 ${SIZE + 120} ${SIZE}`} role="img" aria-label={label} style={{ maxWidth: 440, margin: "0 auto" }}>
      {[0.25, 0.5, 0.75, 1].map((f) => (
        <polygon key={f} points={axes.map((_, i) => point(i, n, R * f).join(",")).join(" ")} fill="none" className="gridline" strokeDasharray={f === 1 ? undefined : "2 4"} />
      ))}
      {axes.map((_, i) => {
        const [x, y] = point(i, n, R);
        return <line key={i} x1={C} y1={C} x2={x} y2={y} className="gridline" />;
      })}
      <polygon className="zoom-in" points={poly} style={{ fill: "var(--color-accent-soft)", stroke: "var(--color-accent)" }} strokeWidth={2} strokeLinejoin="round" />
      {axes.map((a, i) => {
        const [x, y] = point(i, n, (R * (a.score ?? 0)) / 100);
        const [lx, ly] = point(i, n, R + 26);
        return (
          <g key={a.label}>
            {a.score != null && <circle cx={x} cy={y} r={4} style={{ fill: "var(--color-accent)" }} />}
            <text x={lx} y={ly - 2} textAnchor={lx < C - 4 ? "end" : lx > C + 4 ? "start" : "middle"} style={{ fontSize: 12, fontWeight: 600 }}>{a.label}</text>
            <text x={lx} y={ly + 12} textAnchor={lx < C - 4 ? "end" : lx > C + 4 ? "start" : "middle"} className="axis">{a.score ?? "—"}</text>
          </g>
        );
      })}
    </svg>
  );
}
