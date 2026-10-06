import { useMemo, useState } from "react";
import { endOfMonth, startOfMonth } from "date-fns";
import { ParetoChart } from "@/components/charts/ParetoChart";
import { MonthNav } from "@/components/ui/MonthNav";
import { useData } from "@/contexts/DataContext";
import { pareto, totalsByCategory } from "@/lib/analysis";
import { periodTransactions } from "@/lib/calc";
import { formatPercent } from "@/lib/format";

/** Ferramenta de Pareto (aba Ferramentas): mesma análise dos Relatórios, para consulta rápida por mês. */
export function ParetoTool() {
  const { transactions, categories } = useData();
  const [cursor, setCursor] = useState(new Date());
  const start = startOfMonth(cursor);
  const end = endOfMonth(cursor);

  const items = useMemo(() => pareto(totalsByCategory(periodTransactions(transactions, start, end), categories)), [transactions, categories, start, end]);
  const vitals = items.filter((i) => i.vital);
  const vitalShare = vitals.reduce((s, i) => s + i.share, 0);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <p className="text-muted" style={{ fontSize: 13.5, lineHeight: 1.55 }}>
        Princípio de Pareto (80/20) aplicado às suas despesas: identifica as poucas categorias responsáveis pela maior parte dos gastos.
      </p>
      <div><MonthNav cursor={cursor} onChange={setCursor} /></div>
      {items.length === 0 ? (
        <p className="text-muted" style={{ fontSize: 13.5 }}>Nenhuma despesa registrada neste mês para analisar.</p>
      ) : (
        <>
          <div className="callout">
            <div><b>{vitals.length} de {items.length}</b> categorias concentram <b>{formatPercent(vitalShare)}</b> das despesas do mês.</div>
          </div>
          <ParetoChart items={items} />
        </>
      )}
    </div>
  );
}
