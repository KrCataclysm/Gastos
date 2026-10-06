import { useMemo, useState } from "react";
import { Plus, Target } from "lucide-react";
import { useData } from "@/contexts/DataContext";
import { BudgetForm } from "@/components/budget/BudgetForm";
import { EmptyState } from "@/components/ui/EmptyState";
import { MonthNav } from "@/components/ui/MonthNav";
import { PageHeader } from "@/components/ui/PageHeader";
import { Ruler } from "@/components/ui/Ruler";
import { budgetConsumption, monthEndProjection } from "@/lib/calc";
import { formatCurrency, formatPercent, monthLabel } from "@/lib/format";
import { budgetPace, monthFraction, PACE_LABEL, PACE_TONE } from "@/lib/pace";
import type { Category } from "@/types";

const BADGE = { ok: "badge--income", warn: "badge--warning", off: "badge--expense", over: "badge--expense", done: "badge--income" } as const;

export function BudgetPage() {
  const { transactions, categories, budgets, recurringTransactions } = useData();
  const [cursor, setCursor] = useState(new Date());
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [showNew, setShowNew] = useState(false);

  const year = cursor.getFullYear();
  const month = cursor.getMonth() + 1;
  const fraction = monthFraction(year, month);

  const lines = useMemo(() => budgetConsumption(transactions, categories, budgets, year, month).sort((a, b) => b.pct - a.pct), [transactions, categories, budgets, year, month]);
  const projection = useMemo(() => monthEndProjection(transactions, categories, recurringTransactions, cursor), [transactions, categories, recurringTransactions, cursor]);

  const budgeted = lines.filter((l) => l.budgeted > 0);
  const totalBudgeted = budgeted.reduce((s, l) => s + l.budgeted, 0);
  const totalSpent = budgeted.reduce((s, l) => s + l.spent, 0);
  const pace = budgetPace(totalSpent, totalBudgeted, fraction);

  function findBudget(categoryId: string) {
    return budgets.find((b) => b.category_id === categoryId && b.year === year && b.month === month);
  }

  return (
    <div className="stack">
      <PageHeader eyebrow="Planejamento" title="Orçamento">
        <MonthNav cursor={cursor} onChange={setCursor} />
        <button className="btn btn--primary btn--sm" onClick={() => setShowNew(true)}><Plus size={15} /> Definir limite</button>
      </PageHeader>

      <div className="grid grid--7-5">
        <section className="card" aria-label="Resumo do orçamento">
          <h2 className="panel-title">Resumo de {monthLabel(year, month)}</h2>
          {pace ? (
            <>
              <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                <div style={{ fontSize: "1.25rem", fontWeight: 600 }}>{PACE_LABEL[pace.status]}</div>
                <div className="mono text-muted" style={{ fontSize: 13 }}>{formatCurrency(totalSpent)} de {formatCurrency(totalBudgeted)}</div>
              </div>
              <div style={{ margin: "10px 0 6px" }}>
                <Ruler value={pace.fractionSpent} marker={fraction} status={pace.status} label="Total gasto em relação ao orçado" />
              </div>
              <p className="text-muted" style={{ fontSize: 13, lineHeight: 1.5 }}>A marca ▼ indica onde você deveria estar hoje ({formatPercent(fraction)} do mês).</p>
            </>
          ) : (
            <p className="text-muted" style={{ fontSize: 13.5 }}>Defina limites por categoria para acompanhar o ritmo do mês.</p>
          )}
        </section>
        <section className="card" aria-label="Projeção">
          <h2 className="panel-title">Projeção de fim de mês</h2>
          <div className="statement__row"><span className="text-muted">Despesa prevista</span><span className="mono text-expense">{formatCurrency(projection.projectedExpense)}</span></div>
          <div className="statement__row statement__row--total"><span>Resultado previsto</span><span className="mono" style={{ color: projection.projectedResult >= 0 ? "var(--color-income)" : "var(--color-expense)" }}>{formatCurrency(projection.projectedResult)}</span></div>
        </section>
      </div>

      {lines.length === 0 ? (
        <section className="card"><EmptyState icon={Target} title="Nenhum orçamento definido" description="Defina limites mensais por categoria para acompanhar seus gastos." /></section>
      ) : (
        <section className="card" aria-label="Limites por categoria">
          <h2 className="panel-title">Por categoria</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            {lines.map((line) => {
              const p = line.budgeted > 0 ? budgetPace(line.spent, line.budgeted, fraction) : null;
              return (
                <button key={line.category.id} type="button" onClick={() => setEditingCategory(line.category)} style={{ background: "none", border: 0, padding: 0, textAlign: "left", cursor: "pointer", color: "inherit" }} aria-label={`Editar limite de ${line.category.name}`}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12, flexWrap: "wrap" }}>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 8, fontSize: 14, fontWeight: 500 }}>
                      <i className="ledger__dot" style={{ background: line.category.color }} aria-hidden />
                      {line.category.name}
                      {p && <span className={`badge ${BADGE[p.status]}`}>{PACE_LABEL[p.status]}</span>}
                    </span>
                    <span className="mono text-muted" style={{ fontSize: 12.5 }}>
                      {formatCurrency(line.spent)}{line.budgeted > 0 ? ` / ${formatCurrency(line.budgeted)} · ${formatPercent(line.pct)}` : " · sem limite"}
                    </span>
                  </div>
                  {p ? <Ruler value={line.pct} marker={fraction} tone={PACE_TONE[p.status]} label={`Gasto em ${line.category.name}`} /> : <div style={{ height: 10 }} />}
                </button>
              );
            })}
          </div>
        </section>
      )}

      {editingCategory && <BudgetForm categoryId={editingCategory.id} year={year} month={month} initial={findBudget(editingCategory.id)} onClose={() => setEditingCategory(null)} />}
      {showNew && <BudgetForm year={year} month={month} onClose={() => setShowNew(false)} />}
    </div>
  );
}
