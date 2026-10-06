import { useState } from "react";
import { Plus, Target, Trash2 } from "lucide-react";
import { useData } from "@/contexts/DataContext";
import { useToast } from "@/components/ui/Toast";
import { GoalForm } from "@/components/goals/GoalForm";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { EmptyState } from "@/components/ui/EmptyState";
import { getIcon } from "@/components/ui/icons";
import { formatCurrency, formatDateLong, formatPercent } from "@/lib/format";
import type { Goal } from "@/types";

export function GoalsPage() {
  const { goals, saveGoal, removeGoal } = useData();
  const { show } = useToast();
  const [showNew, setShowNew] = useState(false);
  const [editing, setEditing] = useState<Goal | null>(null);
  const [addingTo, setAddingTo] = useState<Goal | null>(null);
  const [amount, setAmount] = useState("");

  async function handleAddAmount() {
    if (!addingTo) return;
    const parsed = Number(amount.replace(",", "."));
    if (!parsed) return;
    await saveGoal({ id: addingTo.id, current_amount: addingTo.current_amount + parsed });
    show("Valor adicionado à meta.", "success");
    setAddingTo(null);
    setAmount("");
  }

  async function handleDelete(id: string) {
    await removeGoal(id);
    show("Meta removida.", "info");
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div className="topbar">
        <div className="topbar__title">Metas</div>
        <button className="btn btn--primary btn--sm" onClick={() => setShowNew(true)}>
          <Plus size={16} /> Nova meta
        </button>
      </div>

      {goals.length === 0 ? (
        <EmptyState
          icon={Target}
          title="Nenhuma meta ainda"
          description="Crie metas de economia (reserva, viagem, compra) e acompanhe o progresso."
        />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {goals.map((goal) => {
            const Icon = getIcon(goal.icon);
            const pct = goal.target_amount > 0 ? goal.current_amount / goal.target_amount : 0;
            const done = pct >= 1;
            return (
              <div key={goal.id} className="card">
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                  <div className="panel-alt" style={{ width: 40, height: 40, display: "flex", alignItems: "center", justifyContent: "center", color: goal.color }}>
                    <Icon size={18} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 15 }}>{goal.name}</div>
                    {goal.target_date && (
                      <div className="text-muted" style={{ fontSize: 12 }}>Até {formatDateLong(goal.target_date)}</div>
                    )}
                  </div>
                  {done && <span className="badge badge--income">Concluída</span>}
                  <button className="btn btn--ghost btn--icon" onClick={() => handleDelete(goal.id)} aria-label="Remover meta">
                    <Trash2 size={16} />
                  </button>
                </div>

                <ProgressBar pct={pct} color={done ? "var(--color-income)" : undefined} />

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 10 }}>
                  <span className="text-muted mono" style={{ fontSize: 13 }}>
                    {formatCurrency(goal.current_amount)} / {formatCurrency(goal.target_amount)} · {formatPercent(pct)}
                  </span>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button className="btn btn--secondary btn--sm" onClick={() => setEditing(goal)}>
                      Editar
                    </button>
                    {!done && (
                      <button className="btn btn--primary btn--sm" onClick={() => setAddingTo(goal)}>
                        Adicionar
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showNew && <GoalForm onClose={() => setShowNew(false)} />}
      {editing && <GoalForm initial={editing} onClose={() => setEditing(null)} />}

      {addingTo && (
        <div className="overlay" onClick={() => setAddingTo(null)}>
          <div className="sheet" onClick={(e) => e.stopPropagation()}>
            <h2 style={{ fontSize: 19, fontWeight: 700, marginBottom: 18 }}>Adicionar a "{addingTo.name}"</h2>
            <div className="auth-form">
              <div className="field">
                <label>Valor</label>
                <input className="input" inputMode="decimal" autoFocus value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0,00" />
              </div>
              <button className="btn btn--primary btn--block" onClick={handleAddAmount}>
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
