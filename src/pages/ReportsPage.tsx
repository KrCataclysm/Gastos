import { useMemo, useState } from "react";
import { Download, Printer } from "lucide-react";
import { addMonths, endOfMonth, startOfMonth } from "date-fns";
import { useAuth } from "@/contexts/AuthContext";
import { useData } from "@/contexts/DataContext";
import { MonthlyBars } from "@/components/charts/MonthlyBars";
import { CategoryBars } from "@/components/charts/CategoryBars";
import { QualityTools } from "@/components/reports/QualityTools";
import { MonthNav } from "@/components/ui/MonthNav";
import { PageHeader } from "@/components/ui/PageHeader";
import { buildDRE, categoryDistribution, lastNMonthsSeries, monthsSinceRegistration, monthTotals } from "@/lib/calc";
import { formatCurrency, formatPercent, monthLabel } from "@/lib/format";
import { downloadCsv, transactionsToCsv } from "@/lib/csv";

function Compare({ label, value, base }: { label: string; value: number; base: number }) {
  const diff = value - base;
  if (!(base > 0)) {
    return (
      <div>
        <div className="eyebrow">{label}</div>
        <div className="mono text-muted" style={{ fontSize: "1.2rem", marginTop: 6 }}>—</div>
        <div className="text-muted" style={{ fontSize: 12, marginTop: 2 }}>sem despesas no período para comparar</div>
      </div>
    );
  }
  return (
    <div>
      <div className="eyebrow">{label}</div>
      <div className="mono" style={{ fontSize: "1.2rem", fontWeight: 500, marginTop: 6, color: diff > 0 ? "var(--color-expense)" : diff < 0 ? "var(--color-income)" : undefined }}>
        {diff > 0 ? "+" : diff < 0 ? "−" : ""} {formatCurrency(Math.abs(diff))}
      </div>
      <div className="text-muted" style={{ fontSize: 12, marginTop: 2 }}>{`em despesas (${diff >= 0 ? "+" : "−"}${formatPercent(Math.abs(diff) / base)})`}</div>
    </div>
  );
}

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
  const distribution = useMemo(() => categoryDistribution(transactions, categories, start, end, "expense").slice(0, 8), [transactions, categories, start, end]);
  const prevMonth = addMonths(cursor, -1);
  const previous = monthTotals(transactions, prevMonth.getFullYear(), prevMonth.getMonth() + 1);
  const current = monthTotals(transactions, year, month);
  const previousYear = monthTotals(transactions, year - 1, month);

  function exportMonth() {
    const items = transactions.filter((t) => {
      const d = new Date(t.date + "T00:00:00");
      return d >= start && d <= end;
    });
    downloadCsv(`prumo-${year}-${String(month).padStart(2, "0")}.csv`, transactionsToCsv(items, accounts, categories));
  }

  return (
    <div className="stack">
      <PageHeader eyebrow="Relatórios" title={monthLabel(year, month)}>
        <MonthNav cursor={cursor} onChange={setCursor} />
        <button className="btn btn--secondary btn--sm" onClick={exportMonth} aria-label="Exportar mês em CSV"><Download size={14} /> <span className="btn__label">CSV</span></button>
        <button className="btn btn--secondary btn--sm" onClick={() => downloadCsv("prumo-completo.csv", transactionsToCsv(transactions, accounts, categories))} aria-label="Exportar tudo em CSV"><Download size={14} /> <span className="btn__label">Tudo</span></button>
        <button className="btn btn--secondary btn--sm" onClick={() => window.print()} aria-label="Imprimir ou salvar em PDF"><Printer size={14} /> <span className="btn__label">PDF</span></button>
      </PageHeader>

      <div className="grid grid--7-5">
        <section className="card" aria-label="Demonstrativo do mês">
          <h2 className="panel-title">Demonstrativo do mês</h2>
          <div className="statement__row"><span>Receitas</span><span className="mono text-income">{formatCurrency(dre.income)}</span></div>
          <div className="statement__row statement__row--indent"><span>(−) Despesas fixas</span><span className="mono">{formatCurrency(dre.fixedExpense)}</span></div>
          <div className="statement__row statement__row--indent"><span>(−) Despesas variáveis</span><span className="mono">{formatCurrency(dre.variableExpense)}</span></div>
          <div className="statement__row statement__row--total"><span>Resultado do mês</span><span className="mono" style={{ color: dre.result >= 0 ? "var(--color-income)" : "var(--color-expense)" }}>{formatCurrency(dre.result)}</span></div>
          <div className="statement__row statement__row--last" style={{ marginTop: 6 }}><span className="text-muted">Taxa de poupança</span><span className="mono">{formatPercent(dre.savingsRate, 1)}</span></div>
        </section>

        <section className="card" aria-label="Comparativos">
          <h2 className="panel-title">Despesas comparadas</h2>
          <div style={{ display: "grid", gap: 22 }}>
            <Compare label="Contra o mês anterior" value={current.expense} base={previous.expense} />
            <Compare label="Contra o mesmo mês do ano passado" value={current.expense} base={previousYear.expense} />
          </div>
        </section>
      </div>

      <div className="grid grid--7-5">
        <section className="card" aria-label="Evolução">
          <div className="panel-head">
            <h2 className="panel-title">Evolução</h2>
            <span className="panel-note">{seriesMonths === 1 ? "este mês" : `últimos ${seriesMonths} meses`}</span>
          </div>
          <MonthlyBars data={series} />
          <div className="legend" style={{ marginTop: 8 }}>
            <span><i style={{ background: "var(--color-accent)" }} />Receitas</span>
            <span><i style={{ background: "var(--color-expense)" }} />Despesas</span>
          </div>
        </section>
        {distribution.length > 0 && (
          <section className="card" aria-label="Distribuição por categoria">
            <h2 className="panel-title">Despesas por categoria</h2>
            <CategoryBars items={distribution.map((d) => ({ id: d.category.id, name: d.category.name, color: d.category.color, total: d.total }))} />
          </section>
        )}
      </div>

      <QualityTools transactions={transactions} categories={categories} start={start} end={end} label={monthLabel(year, month)} />
    </div>
  );
}
