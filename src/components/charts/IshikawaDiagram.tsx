import type { Bone } from "../../domain/analytics";
import { formatBRL, formatPercent } from "../../lib/money";

const PAD = 96;
const W = 980;
const H = 500;
const SPINE_Y = H / 2;
const SPINE_X0 = 24;
const SPINE_X1 = 770;
const SLANT = 64;

const clip = (s: string, n: number) => (s.length > n ? `${s.slice(0, n - 1)}…` : s);

/** Diagrama de Ishikawa (causa e efeito): cabeça = efeito; espinhas = categorias; costelas = causas. */
export function IshikawaDiagram({ bones, effectTotal, effectTitle }: { bones: Bone[]; effectTotal: number; effectTitle: string }) {
  const top = bones.filter((_, i) => i % 2 === 0);
  const bottom = bones.filter((_, i) => i % 2 === 1);
  const slots = Math.max(top.length, 1);
  const slotW = (SPINE_X1 - SPINE_X0 - 20) / slots;

  const renderBone = (b: Bone, i: number, side: "top" | "bottom") => {
    const attachX = SPINE_X0 + slotW * (i + 1) - 6 + (side === "bottom" ? -slotW * 0.28 : 0);
    const startX = attachX - SLANT;
    const labelY = side === "top" ? 8 : H - 56;
    const startY = side === "top" ? 62 : H - 62;
    return (
      <g key={b.id}>
        <line x1={startX} y1={startY} x2={attachX} y2={SPINE_Y} stroke={b.color} strokeWidth={3} strokeLinecap="round" />
        <rect x={startX - 78} y={labelY} width={156} height={50} rx={9} fill={b.color} />
        <text x={startX} y={labelY + 21} textAnchor="middle" fontSize={13} fontWeight={700} style={{ fill: "#fff" }}>{clip(b.name, 20)}</text>
        <text x={startX} y={labelY + 39} textAnchor="middle" fontSize={11.5} style={{ fill: "#fff" }}>{formatBRL(b.total)} · {formatPercent(b.share)}</text>
        {b.ribs.map((r, k) => {
          const t = (k + 1) / (b.ribs.length + 1);
          const y = startY + (SPINE_Y - startY) * t;
          const x = startX + SLANT * t;
          return (
            <g key={`${r.label}-${k}`}>
              <line x1={x - 20} y1={y} x2={x} y2={y} stroke={b.color} strokeWidth={1.8} />
              <text x={x - 24} y={y - 3} textAnchor="end" fontSize={11.5}>{clip(r.label, 17)}</text>
              <text className="axis" x={x - 24} y={y + 11} textAnchor="end" fontSize={11}>{formatBRL(r.total)}</text>
            </g>
          );
        })}
      </g>
    );
  };

  return (
    <svg className="chart" viewBox={`0 0 ${W + PAD} ${H}`} role="img" aria-label={`Diagrama de Ishikawa: ${effectTitle}, ${formatBRL(effectTotal)}, com ${bones.length} grupos de causa`} style={{ minWidth: 940 }}>
      <defs>
        <marker id="ish-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="8" markerHeight="8" orient="auto-start-reverse">
          <path d="M0,0 L10,5 L0,10 z" style={{ fill: "var(--text)" }} />
        </marker>
      </defs>
      <g transform={`translate(${PAD},0)`}>
      <line x1={SPINE_X0} y1={SPINE_Y} x2={SPINE_X1 + 4} y2={SPINE_Y} stroke="var(--text)" strokeWidth={4} markerEnd="url(#ish-arrow)" />
      {top.map((b, i) => renderBone(b, i, "top"))}
      {bottom.map((b, i) => renderBone(b, i, "bottom"))}
      <rect x={SPINE_X1 + 8} y={SPINE_Y - 62} width={W - SPINE_X1 - 16} height={124} rx={14} style={{ fill: "var(--surface-2)", stroke: "var(--text)" }} strokeWidth={2} />
      <text x={SPINE_X1 + 8 + (W - SPINE_X1 - 16) / 2} y={SPINE_Y - 24} textAnchor="middle" fontSize={12} fontWeight={700} className="axis">EFEITO</text>
      <text x={SPINE_X1 + 8 + (W - SPINE_X1 - 16) / 2} y={SPINE_Y + 2} textAnchor="middle" fontSize={15} fontWeight={800}>{clip(effectTitle, 22)}</text>
      <text x={SPINE_X1 + 8 + (W - SPINE_X1 - 16) / 2} y={SPINE_Y + 28} textAnchor="middle" fontSize={17} fontWeight={800} style={{ fill: "var(--expense)" }}>{formatBRL(effectTotal)}</text>
      </g>
    </svg>
  );
}
