import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Receipt } from "lucide-react";
import { useData } from "@/contexts/DataContext";
import { useAuth } from "@/contexts/AuthContext";
import { SyncBadge } from "@/components/layout/SyncBadge";
import { TransactionForm } from "@/components/transactions/TransactionForm";
import { Ledger } from "@/components/transactions/Ledger";
import { MonthlyBars } from "@/components/charts/MonthlyBars";
import { AddFab } from "@/components/ui/AddFab";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { Ruler } from "@/components/ui/Ruler";
import { accountBalance, budgetConsumption, lastNMonthsSeries, monthEndProjection, monthsSinceRegistration, monthTotals, savingsRate, totalNetWorth } from "@/lib/calc";
import { firstTwoNames, formatCurrency, formatPercent, greeting, monthLabel, monthShortLabel } from "@/lib/format";
import { budgetPace, monthFraction, PACE_LABEL, PACE_TONE } from "@/lib/pace";

function delta(now: number, before: number): string | null {
  if (!(before > 0)) return null;
  const pct = (now - before) / before;
  if (Math.abs(pct) < 0.005) return "= igual";
  return `${pct > 0 ? "▲" : "▼"} ${Math.round(Math.abs(pct) * 100)}%`;
}

export function DashboardPage() {
  const { accounts, categories, transactions, budgets, recurringTransactions, loading } = useData();
  const { user } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const displayName = firstTwoNames((user?.user_metadata?.display_name as string | undefined) ?? user?.email?.split("@")[0]);
  const registeredAt = user?.created_at ? new Date(user.created_at) : now;
  const seriesMonths = monthsSinceRegistration(registeredAt, now, 6);

  const netWorth = useMemo(() => totalNetWorth(accounts, transactions), [accounts, transactions]);
  const cur = monthTotals(transactions, year, month);
  const prevDate = new Date(year, month - 2, 1);
  const prev = monthTotals(transactions, prevDate.getFullYear(), prevDate.getMonth() + 1);
  const savings = savingsRate(cur.income, cur.expense);
  const projection = useMemo(() => monthEndProjection(transactions, categories, recurringTransactions, now), [transactions, categories, recurringTransactions]);
  const series = useMemo(() => lastNMonthsSeries(transactions, seriesMonths, now), [transactions, seriesMonths]);
  const lines = useMemo(() => budgetConsumption(transactions, categories, budgets, year, month).filter((l) => l.budgeted > 0).sort((a, b) => b.pct - a.pct), [transactions, categories, budgets]);
  const recent = useMemo(() => transactions.slice(0, 6), [transactions]);

  const fraction = monthFraction(year, month, now);
  const totalBudgeted = lines.reduce((s, l) => s + l.budgeted, 0);
  const totalSpent = lines.reduce((s, l) => s + l.spent, 0);
  const pace = budgetPace(totalSpent, totalBudgeted, fraction);

  if (loading) {
    return (
      <div className="stack">
        <div className="skeleton" style={{ height: 96 }} />
        <div className="skeleton" style={{ height: 220 }} />
      </div>
    );
  }

  const dIncome = delta(cur.income, prev.income);
  const dExpense = delta(cur.expense, prev.expense);
  const prevLabel = monthShortLabel(prevDate.getFullYear(), prevDate.getMonth() + 1);

  return (
    <div className="stack">
      <PageHeader eyebrow={monthLabel(year, month)} title={`${greeting(now)}${displayName ? `, ${displayName}` : ""}`}>
        <SyncBadge />
      </PageHeader>

      <section className="kpi-strip" aria-label="Resumo do mês">
        <div className="kpi">
          <div className="eyebrow">Patrimônio</div>
          <div className="kpi__value">{formatCurrency(netWorth)}</div>
          <div className="kpi__sub">{accounts.length} {accounts.length === 1 ? "conta" : "contas"}</div>
        </div>
        <div className="kpi">
          <div className="eyebrow">Receitas do mês</div>
          <div className="kpi__value text-income">{formatCurrency(cur.income)}</div>
          <div className="kpi__sub">{dIncome ? `${dIncome} vs ${prevLabel}` : "sem mês anterior"}</div>
        </div>
        <div className="kpi">
          <div className="eyebrow">Despesas do mês</div>
          <div className="kpi__value text-expense">{formatCurrency(cur.expense)}</div>
          <div className="kpi__sub">{dExpense ? `${dExpense} vs ${prevLabel}` : "sem mês anterior"}</div>
        </div>
        <div className="kpi">
          <div className="eyebrow">Poupança</div>
          <div className="kpi__value" style={{ color: savings >= 0 ? "var(--color-income)" : "var(--color-expense)" }}>{formatPercent(savings, 1)}</div>
          <div className="kpi__sub">do que entrou no mês</div>
        </div>
      </section>

      <div className="grid grid--7-5">
        <section className="card" aria-label="Ritmo do orçamento">
          <div className="panel-head">
            <h2 className="panel-title">Ritmo do mês</h2>
            <Link to="/orcamento" className="link">Orçamento</Link>
          </div>
          {pace ? (
            <>
              <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                <div style={{ fontSize: "1.25rem", fontWeight: 600, letterSpacing: "-0.01em" }}>{PACE_LABEL[pace.status]}</div>
                <div className="mono text-muted" style={{ fontSize: 13 }}>
                  {formatPercent(pace.fractionSpent)} do limite · {formatPercent(fraction)} do mês
                </div>
              </div>
              <div style={{ margin: "10px 0 14px" }}>
                <Ruler value={pace.fractionSpent} marker={fraction} status={pace.status} label="Gasto em relação ao orçamento do mês" />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 12 }}>
                <div><div className="eyebrow">Gasto</div><div className="mono" style={{ fontSize: 15, fontWeight: 500, marginTop: 4 }}>{formatCurrency(totalSpent)}</div></div>
                <div><div className="eyebrow">Ideal hoje</div><div className="mono" style={{ fontSize: 15, fontWeight: 500, marginTop: 4 }}>{formatCurrency(pace.idealSpent)}</div></div>
                <div><div className="eyebrow">Limite</div><div className="mono" style={{ fontSize: 15, fontWeight: 500, marginTop: 4 }}>{formatCurrency(totalBudgeted)}</div></div>
              </div>
              <p className="text-muted" style={{ fontSize: 13, margin: "14px 0 18px", lineHeight: 1.5 }}>
                {Math.abs(pace.deviation) < 1 ? "Você está exatamente no ritmo planejado." : pace.deviation > 0 ? `Você está ${formatCurrency(pace.deviation)} acima do ritmo planejado para hoje.` : `Você está ${formatCurrency(-pace.deviation)} abaixo do ritmo planejado para hoje.`}
              </p>
              <div className="rank" style={{ gap: 14 }}>
                {lines.slice(0, 4).map((l) => {
                  const p = budgetPace(l.spent, l.budgeted, fraction)!;
                  return (
                    <div key={l.category.id}>
                      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, fontSize: 13.5 }}>
                        <span>{l.category.name}</span>
                        <span className="mono text-muted" style={{ fontSize: 12.5 }}>{formatCurrency(l.spent)} / {formatCurrency(l.budgeted)}</span>
                      </div>
                      <Ruler value={l.pct} marker={fraction} tone={PACE_TONE[p.status]} label={`Gasto em ${l.category.name}`} />
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            <EmptyState icon={Receipt} title="Defina limites por categoria" description="Com limites, o Prumo mostra se o seu gasto está no ritmo do mês, dia a dia." action={<Link to="/orcamento" className="btn btn--secondary btn--sm">Definir orçamento</Link>} />
          )}
        </section>

        <section className="card" aria-label="Projeção e contas">
          <h2 className="panel-title">Projeção de fim de mês</h2>
          <div className="mono" style={{ fontSize: "1.7rem", fontWeight: 500, letterSpacing: "-0.02em", color: projection.projectedResult >= 0 ? "var(--color-income)" : "var(--color-expense)" }}>
            {formatCurrency(projection.projectedResult)}
          </div>
          <div className="statement__row" style={{ marginTop: 10 }}><span className="text-muted">Receitas previstas</span><span className="mono">{formatCurrency(projection.projectedIncome)}</span></div>
          <div className="statement__row statement__row--last"><span className="text-muted">Despesas previstas</span><span className="mono">{formatCurrency(projection.projectedExpense)}</span></div>

          <h2 className="panel-title" style={{ marginTop: 26 }}>Contas</h2>
          {accounts.length === 0 ? (
            <p className="text-muted" style={{ fontSize: 13.5 }}>Nenhuma conta cadastrada.</p>
          ) : (
            accounts.map((a, i) => (
              <div key={a.id} className={`statement__row${i === accounts.length - 1 ? " statement__row--last" : ""}`}>
                <span>{a.name}</span>
                <span className="mono">{formatCurrency(accountBalance(a, transactions))}</span>
              </div>
            ))
          )}
        </section>
      </div>

      <div className="grid grid--7-5">
        <section className="card" aria-label="Últimos lançamentos">
          <div className="panel-head">
            <h2 className="panel-title">Últimos lançamentos</h2>
            <Link to="/lancamentos" className="link">Ver todos</Link>
          </div>
          {recent.length === 0 ? (
            <EmptyState icon={Receipt} title="Nenhum lançamento ainda" description="Registre sua primeira receita ou despesa para começar." action={<button className="btn btn--primary btn--sm" onClick={() => setShowForm(true)}>Fazer o primeiro lançamento</button>} />
          ) : (
            <Ledger items={recent} categories={categories} accounts={accounts} />
          )}
        </section>

        <section className="card" aria-label="Evolução">
          <div className="panel-head">
            <h2 className="panel-title">Receitas x despesas</h2>
            <span className="panel-note">{seriesMonths === 1 ? "este mês" : `${seriesMonths} meses`}</span>
          </div>
          <MonthlyBars data={series} />
          <div className="legend" style={{ marginTop: 8 }}>
            <span><i style={{ background: "var(--color-accent)" }} />Receitas</span>
            <span><i style={{ background: "var(--color-expense)" }} />Despesas</span>
          </div>
        </section>
      </div>

      <AddFab onClick={() => setShowForm(true)} />
      {showForm && <TransactionForm onClose={() => setShowForm(false)} />}
    </div>
  );
}
