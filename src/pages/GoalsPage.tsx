import { useState } from "react";
import { Plus, Target, Trash2 } from "lucide-react";
import { useData } from "@/contexts/DataContext";
import { useToast } from "@/components/ui/Toast";
import { GoalForm } from "@/components/goals/GoalForm";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { Ruler } from "@/components/ui/Ruler";
import { formatCurrency, formatDateLong, formatPercent } from "@/lib/format";
import { goalPace, PACE_LABEL, PACE_TONE } from "@/lib/pace";
import type { Goal } from "@/types";

const BADGE = { ok: "badge--income", warn: "badge--warning", off: "badge--expense", over: "badge--expense", done: "badge--income" } as const;

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
    <div className="stack">
      <PageHeader eyebrow="Objetivos" title="Metas">
        <button className="btn btn--primary btn--sm" onClick={() => setShowNew(true)}><Plus size={15} /> Nova meta</button>
      </PageHeader>

      {goals.length === 0 ? (
        <section className="card"><EmptyState icon={Target} title="Nenhuma meta ainda" description="Crie metas de economia (reserva, viagem, notebook) e acompanhe se você está no prumo do prazo." /></section>
      ) : (
        <div className="grid grid--2">
          {goals.map((goal) => {
            const pct = goal.target_amount > 0 ? goal.current_amount / goal.target_amount : 0;
            const pace = goalPace(goal);
            return (
              <section key={goal.id} className="card" aria-label={goal.name}>
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                      <h2 style={{ fontSize: "1.05rem", fontWeight: 600 }}>{goal.name}</h2>
                      <span className={`badge ${BADGE[pace.status]}`}>{PACE_LABEL[pace.status]}</span>
                    </div>
                    <div className="eyebrow" style={{ marginTop: 6 }}>{goal.target_date ? `Até ${formatDateLong(goal.target_date)}` : "Sem prazo"}</div>
                  </div>
                  <button className="btn btn--ghost btn--icon btn--sm" onClick={() => handleDelete(goal.id)} aria-label={`Remover meta ${goal.name}`}><Trash2 size={15} /></button>
                </div>

                <div className="mono" style={{ fontSize: "1.45rem", fontWeight: 500, letterSpacing: "-0.02em", margin: "16px 0 4px" }}>
                  {formatCurrency(goal.current_amount)} <span className="text-muted" style={{ fontSize: "0.9rem" }}>/ {formatCurrency(goal.target_amount)}</span>
                </div>
                <Ruler value={pct} marker={goal.target_date && pace.status !== "done" ? pace.fractionOfTime : null} status={pace.status} label={`Progresso da meta ${goal.name}`} />
                <div className="mono text-muted" style={{ fontSize: 12.5, marginTop: 4 }}>{formatPercent(pct)} concluído{goal.target_date && pace.status !== "done" ? ` · ${formatPercent(pace.fractionOfTime)} do prazo` : ""}</div>

                {pace.status !== "done" && pace.perMonth != null && (
                  <p style={{ fontSize: 13.5, margin: "12px 0 0", lineHeight: 1.5 }}>
                    {pace.monthsLeft === 0 ? <>Prazo vencido. Faltam <b className="mono">{formatCurrency(pace.perMonth)}</b>.</> : <>Guarde <b className="mono">{formatCurrency(pace.perMonth)}</b> por mês durante {pace.monthsLeft} {pace.monthsLeft === 1 ? "mês" : "meses"} para chegar no prazo.</>}
                  </p>
                )}

                <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
                  <button className="btn btn--secondary btn--sm" onClick={() => setEditing(goal)}>Editar</button>
                  {pace.status !== "done" && <button className="btn btn--primary btn--sm" onClick={() => setAddingTo(goal)}>Guardar valor</button>}
                </div>
              </section>
            );
          })}
        </div>
      )}

      {showNew && <GoalForm onClose={() => setShowNew(false)} />}
      {editing && <GoalForm initial={editing} onClose={() => setEditing(null)} />}

      {addingTo && (
        <div className="overlay" onClick={() => setAddingTo(null)}>
          <div className="sheet" role="dialog" aria-label={`Guardar em ${addingTo.name}`} onClick={(e) => e.stopPropagation()}>
            <h2 style={{ fontSize: "1.15rem", marginBottom: 18 }}>Guardar em “{addingTo.name}”</h2>
            <div className="auth-form">
              <div className="field">
                <label htmlFor="goal-amount">Valor</label>
                <input id="goal-amount" className="input mono" inputMode="decimal" autoFocus value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0,00" />
              </div>
              <button className="btn btn--primary btn--block" onClick={handleAddAmount}>Confirmar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
