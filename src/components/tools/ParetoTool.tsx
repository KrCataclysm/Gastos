import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { addMonths, endOfMonth, startOfMonth } from "date-fns";
import { Bar, CartesianGrid, ComposedChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useData } from "@/contexts/DataContext";
import { categoryDistribution } from "@/lib/calc";
import { formatCurrency, formatCurrencyCompact, formatPercent, monthLabel } from "@/lib/format";

export function ParetoTool() {
  const { transactions, categories } = useData();
  const [cursor, setCursor] = useState(new Date());
  const start = startOfMonth(cursor);
  const end = endOfMonth(cursor);

  const data = useMemo(() => {
    const distribution = categoryDistribution(transactions, categories, start, end, "expense");
    const total = distribution.reduce((s, d) => s + d.total, 0);
    let cumulative = 0;
    return distribution.map((d) => {
      cumulative += d.total;
      return {
        name: d.category.name,
        total: d.total,
        cumulativePct: total > 0 ? cumulative / total : 0,
      };
    });
  }, [transactions, categories, start, end]);

  const cutoffIndex = data.findIndex((d) => d.cumulativePct >= 0.8);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div className="text-muted" style={{ fontSize: 13 }}>
        Princípio de Pareto (80/20) aplicado às suas despesas: identifica as poucas categorias responsáveis pela maior
        parte dos seus gastos.
      </div>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <button className="btn btn--ghost btn--icon" onClick={() => setCursor((c) => addMonths(c, -1))} aria-label="Mês anterior">
          <ChevronLeft size={18} />
        </button>
        <div style={{ fontWeight: 700 }}>{monthLabel(cursor.getFullYear(), cursor.getMonth() + 1)}</div>
        <button className="btn btn--ghost btn--icon" onClick={() => setCursor((c) => addMonths(c, 1))} aria-label="Próximo mês">
          <ChevronRight size={18} />
        </button>
      </div>

      {data.length === 0 ? (
        <div className="text-muted" style={{ fontSize: 13 }}>
          Nenhuma despesa registrada neste mês para analisar.
        </div>
      ) : (
        <>
          <ResponsiveContainer width="100%" height={280}>
            <ComposedChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 24 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
              <XAxis
                dataKey="name"
                stroke="var(--color-text-muted)"
                fontSize={11}
                axisLine={false}
                tickLine={false}
                interval={0}
                angle={-30}
                textAnchor="end"
                height={60}
              />
              <YAxis
                yAxisId="left"
                stroke="var(--color-text-muted)"
                fontSize={11}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => formatCurrencyCompact(v)}
                width={54}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                stroke="var(--color-text-muted)"
                fontSize={11}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => `${Math.round(v * 100)}%`}
                domain={[0, 1]}
                width={44}
              />
              <Tooltip
                contentStyle={{ background: "var(--color-panel)", border: "1px solid var(--color-border)", borderRadius: 10, fontSize: 13 }}
                formatter={(value: number, key: string) => (key === "cumulativePct" ? formatPercent(value, 1) : formatCurrency(value))}
              />
              <Bar yAxisId="left" dataKey="total" fill="var(--color-expense)" radius={[4, 4, 0, 0]} maxBarSize={32} name="Gasto" />
              <Line yAxisId="right" type="monotone" dataKey="cumulativePct" stroke="var(--color-accent-strong)" strokeWidth={2} dot name="Acumulado %" />
            </ComposedChart>
          </ResponsiveContainer>

          {cutoffIndex >= 0 && (
            <div className="card" style={{ padding: 14 }}>
              <div style={{ fontSize: 13 }}>
                <b>{cutoffIndex + 1}</b> de <b>{data.length}</b> categorias concentram{" "}
                <b>{formatPercent(data[cutoffIndex].cumulativePct, 0)}</b> das suas despesas do mês.
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
