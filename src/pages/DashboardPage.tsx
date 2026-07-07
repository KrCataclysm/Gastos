import { useMemo, useState } from "react";
import { Plus, TrendingDown, TrendingUp, Receipt } from "lucide-react";
import { useData } from "@/contexts/DataContext";
import { SyncBadge } from "@/components/layout/SyncBadge";
import { TransactionForm } from "@/components/transactions/TransactionForm";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { MonthlyBarChart } from "@/components/charts/MonthlyBarChart";
import { EmptyState } from "@/components/ui/EmptyState";
import { getIcon } from "@/components/ui/icons";
import {
  accountBalance,
  budgetConsumption,
  lastNMonthsSeries,
  monthEndProjection,
  monthTotals,
  savingsRate,
  totalNetWorth,
} from "@/lib/calc";
import { formatCurrency, formatDate, formatPercent, monthLabel } from "@/lib/format";

export function DashboardPage() {
  const { accounts, categories, transactions, budgets, recurringTransactions, loading } = useData();
  const [showForm, setShowForm] = useState(false);
  const now = new Date();

  const netWorth = useMemo(() => totalNetWorth(accounts, transactions), [accounts, transactions]);
  const monthNow = monthTotals(transactions, now.getFullYear(), now.getMonth() + 1);
  const savings = savingsRate(monthNow.income, monthNow.expense);
  const projection = useMemo(
    () => monthEndProjection(transactions, categories, recurringTransactions, now),
    [transactions, categories, recurringTransactions],
  );
  const series = useMemo(() => lastNMonthsSeries(transactions, 6, now), [transactions]);
  const budgetLines = useMemo(
    () =>
      budgetConsumption(transactions, categories, budgets, now.getFullYear(), now.getMonth() + 1)
        .sort((a, b) => b.pct - a.pct)
        .slice(0, 3),
    [transactions, categories, budgets],
  );
  const recent = transactions.slice(0, 5);

  if (loading) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <div className="skeleton" style={{ height: 120 }} />
        <div className="skeleton" style={{ height: 220 }} />
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div className="topbar">
        <div>
          <div className="topbar__title">Olá 👋</div>
          <div className="text-muted" style={{ fontSize: 13 }}>
            {monthLabel(now.getFullYear(), now.getMonth() + 1)}
          </div>
        </div>
        <div className="topbar__actions">
          <div className="sidebar-hide-desktop" style={{ display: "block" }}>
            <SyncBadge />
          </div>
        </div>
      </div>

      <div className="card" style={{ background: "linear-gradient(135deg, var(--color-accent), var(--color-accent-strong))", color: "white", border: "none" }}>
        <div style={{ fontSize: 13, opacity: 0.85, fontWeight: 600 }}>Patrimônio líquido</div>
        <div style={{ fontSize: 34, fontWeight: 800, letterSpacing: "-0.02em", margin: "6px 0 14px" }}>
          {formatCurrency(netWorth)}
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
          {accounts.map((a) => (
            <div key={a.id} style={{ background: "rgba(255,255,255,0.14)", borderRadius: 10, padding: "6px 12px", fontSize: 13 }}>
              {a.name}: <b>{formatCurrency(accountBalance(a, transactions))}</b>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12 }}>
        <div className="card">
          <div className="text-muted" style={{ fontSize: 12, fontWeight: 600, display: "flex", alignItems: "center", gap: 6 }}>
            <TrendingUp size={14} /> Receitas do mês
          </div>
          <div className="text-income mono" style={{ fontSize: 22, fontWeight: 700, marginTop: 6 }}>
            {formatCurrency(monthNow.income)}
          </div>
        </div>
        <div className="card">
          <div className="text-muted" style={{ fontSize: 12, fontWeight: 600, display: "flex", alignItems: "center", gap: 6 }}>
            <TrendingDown size={14} /> Despesas do mês
          </div>
          <div className="text-expense mono" style={{ fontSize: 22, fontWeight: 700, marginTop: 6 }}>
            {formatCurrency(monthNow.expense)}
          </div>
        </div>
        <div className="card">
          <div className="text-muted" style={{ fontSize: 12, fontWeight: 600 }}>Taxa de poupança</div>
          <div className="mono" style={{ fontSize: 22, fontWeight: 700, marginTop: 6, color: savings >= 0 ? "var(--color-income)" : "var(--color-expense)" }}>
            {formatPercent(savings, 1)}
          </div>
        </div>
        <div className="card">
          <div className="text-muted" style={{ fontSize: 12, fontWeight: 600 }}>Projeção fim do mês</div>
          <div className="mono" style={{ fontSize: 22, fontWeight: 700, marginTop: 6, color: projection.projectedResult >= 0 ? "var(--color-income)" : "var(--color-expense)" }}>
            {formatCurrency(projection.projectedResult)}
          </div>
        </div>
      </div>

      <div className="card">
        <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 12 }}>Receitas x despesas — últimos 6 meses</h3>
        <MonthlyBarChart data={series} />
      </div>

      {budgetLines.length > 0 && (
        <div className="card">
          <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 12 }}>Orçamento do mês</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {budgetLines.map((line) => (
              <div key={line.category.id}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 6 }}>
                  <span>{line.category.name}</span>
                  <span className="text-muted">
                    {formatCurrency(line.spent)} / {formatCurrency(line.budgeted)}
                  </span>
                </div>
                <ProgressBar pct={line.pct} />
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700 }}>Últimos lançamentos</h3>
        </div>
        {recent.length === 0 ? (
          <EmptyState icon={Receipt} title="Nenhum lançamento ainda" description="Adicione seu primeiro lançamento para começar." />
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {recent.map((t) => {
              const category = categories.find((c) => c.id === t.category_id);
              const Icon = getIcon(category?.icon ?? "wallet");
              return (
                <div key={t.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: "1px solid var(--color-border)" }}>
                  <div className="panel-alt" style={{ width: 38, height: 38, display: "flex", alignItems: "center", justifyContent: "center", color: category?.color ?? "var(--color-accent)" }}>
                    <Icon size={17} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.description || category?.name || "Lançamento"}</div>
                    <div className="text-muted" style={{ fontSize: 12 }}>{formatDate(t.date)}</div>
                  </div>
                  <div className={t.type === "income" ? "text-income mono" : t.type === "expense" ? "text-expense mono" : "mono"} style={{ fontWeight: 700, fontSize: 14 }}>
                    {t.type === "expense" ? "-" : t.type === "income" ? "+" : ""}
                    {formatCurrency(t.amount)}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <button className="fab" onClick={() => setShowForm(true)} aria-label="Adicionar lançamento">
        <Plus size={26} />
      </button>

      {showForm && <TransactionForm onClose={() => setShowForm(false)} />}
    </div>
  );
}
