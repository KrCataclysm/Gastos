import { useEffect, useMemo, useState } from "react";
import { Info } from "lucide-react";
import { IshikawaDiagram } from "@/components/charts/IshikawaDiagram";
import { ParetoChart } from "@/components/charts/ParetoChart";
import { ishikawa, pareto, totalsByCategory } from "@/lib/analysis";
import { periodTransactions } from "@/lib/calc";
import { formatCurrency, formatPercent } from "@/lib/format";
import type { Category, Transaction } from "@/types";

interface Props {
  transactions: Transaction[];
  categories: Category[];
  start: Date;
  end: Date;
  label: string;
}

/** Ferramentas da Qualidade (Gestão da Qualidade): Pareto 80/20 e diagrama de Ishikawa dos gastos do mês. */
export function QualityTools({ transactions, categories, start, end, label }: Props) {
  const monthTx = useMemo(() => periodTransactions(transactions, start, end), [transactions, start, end]);
  const totals = useMemo(() => totalsByCategory(monthTx, categories), [monthTx, categories]);
  const par = useMemo(() => pareto(totals), [totals]);
  const fish = useMemo(() => ishikawa(monthTx, categories), [monthTx, categories]);
  const [view, setView] = useState<"diagram" | "list">("list");
  useEffect(() => setView(matchMedia("(min-width: 760px)").matches ? "diagram" : "list"), []);

  if (par.length === 0) return null;
  const vitals = par.filter((p) => p.vital);
  const vitalShare = vitals.reduce((s, p) => s + p.share, 0);

  return (
    <>
      <div className="card">
        <h3 className="panel-title" style={{ marginBottom: 12 }}>Pareto das despesas · {label}</h3>
        <div className="callout">
          <Info size={16} aria-hidden style={{ flex: "none", marginTop: 2 }} />
          <div>
            <strong>{vitals.length} de {par.length} categorias</strong> ({vitals.map((v) => v.name).join(", ")}) respondem por <strong>{formatPercent(vitalShare)}</strong> dos seus gastos. Comece a economizar por elas: é onde cada corte rende mais.
          </div>
        </div>
        <div style={{ marginTop: 12 }}><ParetoChart items={par} /></div>
        <div className="legend" style={{ marginTop: 8 }}>
          <span><i style={{ background: "var(--color-accent)" }} />Poucos vitais (até 80%)</span>
          <span><i style={{ background: "var(--chart-muted)" }} />Muitos triviais</span>
          <span><i style={{ background: "var(--color-text)" }} />% acumulado</span>
        </div>
        <details style={{ marginTop: 12 }}>
          <summary style={{ cursor: "pointer", fontWeight: 600, fontSize: 13 }}>Ver dados do gráfico</summary>
          <div className="scroll-x" style={{ marginTop: 8 }}>
            <table className="data-table">
              <thead><tr><th>Categoria</th><th className="r">Total</th><th className="r">% do total</th><th className="r">Acumulado</th></tr></thead>
              <tbody>
                {par.map((p) => (
                  <tr key={p.id}>
                    <td>{p.name}{p.vital ? " ★" : ""}</td>
                    <td className="r mono">{formatCurrency(p.total)}</td>
                    <td className="r mono">{formatPercent(p.share, 1)}</td>
                    <td className="r mono">{formatPercent(p.cumulative, 1)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
      </div>

      <div className="card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 8 }}>
          <h3 className="panel-title">Diagrama de Ishikawa · {label}</h3>
          <div className="seg no-print" style={{ width: 190 }} role="group" aria-label="Modo de exibição">
            <button type="button" aria-pressed={view === "diagram"} onClick={() => setView("diagram")}>Diagrama</button>
            <button type="button" aria-pressed={view === "list"} onClick={() => setView("list")}>Lista</button>
          </div>
        </div>
        <p className="text-muted" style={{ fontSize: 13, marginBottom: 12 }}>
          Efeito: <strong>quanto você gastou</strong>. Cada espinha é uma categoria (causa); as linhas menores mostram os itens que mais pesaram dentro dela.
        </p>
        {view === "diagram" ? (
          <div className="scroll-x"><IshikawaDiagram bones={fish.bones} effectTotal={fish.effectTotal} effectTitle={`Gastos de ${label.split(" ")[0] ?? ""}`} /></div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {fish.bones.map((b) => (
              <div key={b.id} style={{ borderLeft: `4px solid ${b.color}`, paddingLeft: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                  <strong>{b.name}</strong>
                  <span className="mono">{formatCurrency(b.total)} · {formatPercent(b.share)}</span>
                </div>
                <ul className="text-muted" style={{ margin: "6px 0 0", paddingLeft: 18, fontSize: 13 }}>
                  {b.ribs.map((r, i) => (
                    <li key={`${r.label}${i}`}>{r.label}: <span className="mono">{formatCurrency(r.total)}</span>{r.count > 1 ? ` (${r.count}×)` : ""}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
