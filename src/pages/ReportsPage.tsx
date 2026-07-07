import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Download, Printer } from "lucide-react";
import { addMonths, endOfMonth, startOfMonth } from "date-fns";
import { useAuth } from "@/contexts/AuthContext";
import { useData } from "@/contexts/DataContext";
import { MonthlyBarChart } from "@/components/charts/MonthlyBarChart";
import { CategoryPieChart } from "@/components/charts/CategoryPieChart";
import { buildDRE, categoryDistribution, lastNMonthsSeries, monthsSinceRegistration, monthTotals } from "@/lib/calc";
import { formatCurrency, formatPercent, monthLabel } from "@/lib/format";
import { downloadCsv, transactionsToCsv } from "@/lib/csv";

export function ReportsPage() {
  const { transactions, categories, accounts } = useData();
  const { user } = useAuth();
  const [cursor, setCursor] = useState(new Date());
  const year = cursor.getFullYear();
  const month = cursor.getMonth() + 1;
  const start = startOfMonth(cursor);
  const end = endOfMonth(cursor);
  const registeredAt = user?.created_at ? new Date(user.created_at) : cursor;
  const seriesMonths = monthsSinceRegistration(registeredAt, cursor, 12);

  const dre = useMemo(() => buildDRE(transactions, categories, start, end), [transactions, categories, start, end]);
  const series = useMemo(() => lastNMonthsSeries(transactions, seriesMonths, cursor), [transactions, seriesMonths, cursor]);
  const distribution = useMemo(
    () => categoryDistribution(transactions, categories, start, end, "expense").slice(0, 8),
    [transactions, categories, start, end],
  );
  const previousMonth = addMonths(cursor, -1);
  const previousTotals = monthTotals(transactions, previousMonth.getFullYear(), previousMonth.getMonth() + 1);
  const currentTotals = monthTotals(transactions, year, month);
  const previousYearTotals = monthTotals(transactions, year - 1, month);

  const pieData = distribution.map((d) => ({ name: d.category.name, value: d.total, color: d.category.color }));

  function exportMonth() {
    const items = transactions.filter((t) => {
      const d = new Date(t.date + "T00:00:00");
      return d >= start && d <= end;
    });
    downloadCsv(`gastos-${year}-${String(month).padStart(2, "0")}.csv`, transactionsToCsv(items, accounts, categories));
  }

  function exportAll() {
    downloadCsv("gastos-completo.csv", transactionsToCsv(transactions, accounts, categories));
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div className="topbar">
        <div className="topbar__title">Relatórios</div>
        <div className="topbar__actions no-print">
          <button className="btn btn--secondary btn--sm" onClick={exportMonth}>
            <Download size={14} /> Mês (CSV)
          </button>
          <button className="btn btn--secondary btn--sm" onClick={exportAll}>
            <Download size={14} /> Tudo (CSV)
          </button>
          <button className="btn btn--ghost btn--sm" onClick={() => window.print()}>
            <Printer size={14} /> PDF
          </button>
        </div>
      </div>

      <div className="no-print" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <button className="btn btn--ghost btn--icon" onClick={() => setCursor((c) => addMonths(c, -1))}>
          <ChevronLeft size={18} />
        </button>
        <div style={{ fontWeight: 700 }}>{monthLabel(year, month)}</div>
        <button className="btn btn--ghost btn--icon" onClick={() => setCursor((c) => addMonths(c, 1))}>
          <ChevronRight size={18} />
        </button>
      </div>

      <div className="card">
        <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 14 }}>DRE simplificado · {monthLabel(year, month)}</h3>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <Row label="Receitas" value={dre.income} tone="income" />
          <Row label="(-) Despesas fixas" value={-dre.fixedExpense} tone="expense" />
          <Row label="(-) Despesas variáveis" value={-dre.variableExpense} tone="expense" />
          <div style={{ height: 1, background: "var(--color-border)", margin: "4px 0" }} />
          <Row label="Resultado do mês" value={dre.result} tone={dre.result >= 0 ? "income" : "expense"} bold />
          <Row label="Taxa de poupança" value={dre.savingsRate} tone="neutral" isPercent />
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px,1fr))", gap: 12 }}>
        <div className="card">
          <div className="text-muted" style={{ fontSize: 12 }}>Vs. mês anterior</div>
          <div className="mono" style={{ fontWeight: 700, fontSize: 16, marginTop: 4 }}>
            {formatCurrency(currentTotals.expense - previousTotals.expense)}
          </div>
          <div className="text-muted" style={{ fontSize: 11 }}>em despesas</div>
        </div>
        <div className="card">
          <div className="text-muted" style={{ fontSize: 12 }}>Vs. mesmo mês ano passado</div>
          <div className="mono" style={{ fontWeight: 700, fontSize: 16, marginTop: 4 }}>
            {formatCurrency(currentTotals.expense - previousYearTotals.expense)}
          </div>
          <div className="text-muted" style={{ fontSize: 11 }}>em despesas</div>
        </div>
      </div>

      <div className="card">
        <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 12 }}>
          Evolução — {seriesMonths === 1 ? "este mês" : `últimos ${seriesMonths} meses`}
        </h3>
        <MonthlyBarChart data={series} />
      </div>

      {pieData.length > 0 && (
        <div className="card">
          <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 12 }}>Distribuição de despesas por categoria</h3>
          <CategoryPieChart data={pieData} />
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 12 }}>
            {distribution.map((d) => (
              <div key={d.category.id} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}>
                <span style={{ width: 10, height: 10, borderRadius: "50%", background: d.category.color }} />
                <span style={{ flex: 1 }}>{d.category.name}</span>
                <span className="mono text-muted">{formatCurrency(d.total)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function Row({ label, value, tone, bold, isPercent }: { label: string; value: number; tone: "income" | "expense" | "neutral"; bold?: boolean; isPercent?: boolean }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", fontSize: bold ? 15 : 14, fontWeight: bold ? 700 : 500 }}>
      <span>{label}</span>
      <span className={`mono ${tone === "income" ? "text-income" : tone === "expense" ? "text-expense" : ""}`}>
        {isPercent ? formatPercent(value, 1) : formatCurrency(value)}
      </span>
    </div>
  );
}
