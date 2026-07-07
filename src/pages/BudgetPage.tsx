import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Plus, Target } from "lucide-react";
import { addMonths } from "date-fns";
import { useData } from "@/contexts/DataContext";
import { BudgetForm } from "@/components/budget/BudgetForm";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { EmptyState } from "@/components/ui/EmptyState";
import { getIcon } from "@/components/ui/icons";
import { budgetConsumption, monthEndProjection } from "@/lib/calc";
import { formatCurrency, formatPercent, monthLabel } from "@/lib/format";
import type { Category } from "@/types";

export function BudgetPage() {
  const { transactions, categories, budgets, recurringTransactions } = useData();
  const [cursor, setCursor] = useState(new Date());
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [showNew, setShowNew] = useState(false);

  const year = cursor.getFullYear();
  const month = cursor.getMonth() + 1;

  const lines = useMemo(
    () => budgetConsumption(transactions, categories, budgets, year, month).sort((a, b) => b.pct - a.pct),
    [transactions, categories, budgets, year, month],
  );

  const projection = useMemo(
    () => monthEndProjection(transactions, categories, recurringTransactions, cursor),
    [transactions, categories, recurringTransactions, cursor],
  );

  const totalBudgeted = lines.reduce((s, l) => s + l.budgeted, 0);
  const totalSpent = lines.reduce((s, l) => s + l.spent, 0);

  function findBudget(categoryId: string) {
    return budgets.find((b) => b.category_id === categoryId && b.year === year && b.month === month);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div className="topbar">
        <div className="topbar__title">Orçamento</div>
        <button className="btn btn--primary btn--sm" onClick={() => setShowNew(true)}>
          <Plus size={16} /> Definir
        </button>
      </div>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <button className="btn btn--ghost btn--icon" onClick={() => setCursor((c) => addMonths(c, -1))}>
          <ChevronLeft size={18} />
        </button>
        <div style={{ fontWeight: 700 }}>{monthLabel(year, month)}</div>
        <button className="btn btn--ghost btn--icon" onClick={() => setCursor((c) => addMonths(c, 1))}>
          <ChevronRight size={18} />
        </button>
      </div>

      <div className="card">
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 8 }}>
          <span className="text-muted">Total orçado x gasto</span>
          <span>
            {formatCurrency(totalSpent)} / {formatCurrency(totalBudgeted)}
          </span>
        </div>
        <ProgressBar pct={totalBudgeted > 0 ? totalSpent / totalBudgeted : 0} />
        <div style={{ display: "flex", gap: 16, marginTop: 16, flexWrap: "wrap" }}>
          <div>
            <div className="text-muted" style={{ fontSize: 12 }}>Projeção de despesa (fim do mês)</div>
            <div className="mono text-expense" style={{ fontWeight: 700, fontSize: 17 }}>{formatCurrency(projection.projectedExpense)}</div>
          </div>
          <div>
            <div className="text-muted" style={{ fontSize: 12 }}>Projeção de resultado</div>
            <div className="mono" style={{ fontWeight: 700, fontSize: 17, color: projection.projectedResult >= 0 ? "var(--color-income)" : "var(--color-expense)" }}>
              {formatCurrency(projection.projectedResult)}
            </div>
          </div>
        </div>
      </div>

      {lines.length === 0 ? (
        <EmptyState icon={Target} title="Nenhum orçamento definido" description="Defina limites mensais por categoria para acompanhar seus gastos." />
      ) : (
        <div className="card" style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          {lines.map((line) => {
            const Icon = getIcon(line.category.icon);
            const over = line.pct >= 1;
            return (
              <button
                key={line.category.id}
                onClick={() => setEditingCategory(line.category)}
                style={{ background: "none", border: "none", textAlign: "left", cursor: "pointer", padding: 0 }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div className="panel-alt" style={{ width: 30, height: 30, display: "flex", alignItems: "center", justifyContent: "center", color: line.category.color }}>
                      <Icon size={14} />
                    </div>
                    <span style={{ fontSize: 14, fontWeight: 600 }}>{line.category.name}</span>
                    {over && <span className="badge badge--expense">Estourou</span>}
                    {!over && line.pct >= 0.8 && <span className="badge badge--warning">Perto do limite</span>}
                  </div>
                  <span className="text-muted" style={{ fontSize: 13 }}>
                    {formatCurrency(line.spent)} / {formatCurrency(line.budgeted)} · {formatPercent(line.pct)}
                  </span>
                </div>
                <ProgressBar pct={line.pct} />
              </button>
            );
          })}
        </div>
      )}

      {editingCategory && (
        <BudgetForm
          categoryId={editingCategory.id}
          year={year}
          month={month}
          initial={findBudget(editingCategory.id)}
          onClose={() => setEditingCategory(null)}
        />
      )}
      {showNew && <BudgetForm year={year} month={month} onClose={() => setShowNew(false)} />}
    </div>
  );
}
