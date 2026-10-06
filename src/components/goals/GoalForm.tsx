import { useState } from "react";
import { Sheet } from "@/components/ui/Sheet";
import { useData } from "@/contexts/DataContext";
import { useToast } from "@/components/ui/Toast";
import { ICON_CHOICES, getIcon } from "@/components/ui/icons";
import type { Goal } from "@/types";

const GOAL_ICONS = ["piggy-bank", "flag", "rocket", "trophy", "plane-takeoff", "home", "car", "graduation-cap", "gift", "heart-pulse"].filter((i) =>
  ICON_CHOICES.includes(i),
);

const COLOR_CHOICES = ["#6366f1", "#22c55e", "#f59e0b", "#ef4444", "#3b82f6", "#ec4899", "#06b6d4", "#8b5cf6"];

export function GoalForm({ initial, onClose }: { initial?: Goal; onClose: () => void }) {
  const { accounts, saveGoal } = useData();
  const { show } = useToast();
  const [name, setName] = useState(initial?.name ?? "");
  const [targetAmount, setTargetAmount] = useState(initial ? String(initial.target_amount) : "");
  const [currentAmount, setCurrentAmount] = useState(initial ? String(initial.current_amount) : "0");
  const [targetDate, setTargetDate] = useState(initial?.target_date ?? "");
  const [accountId, setAccountId] = useState(initial?.account_id ?? "");
  const [icon, setIcon] = useState(initial?.icon ?? GOAL_ICONS[0]);
  const [color, setColor] = useState(initial?.color ?? COLOR_CHOICES[0]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    setError(null);
    const parsedTarget = Number(targetAmount.replace(",", "."));
    const parsedCurrent = Number((currentAmount || "0").replace(",", "."));
    if (!name.trim()) {
      setError("Dê um nome para a meta.");
      return;
    }
    if (!parsedTarget || parsedTarget <= 0) {
      setError("Informe um valor alvo válido.");
      return;
    }
    setSaving(true);
    try {
      await saveGoal({
        id: initial?.id,
        name: name.trim(),
        icon,
        color,
        target_amount: parsedTarget,
        current_amount: Number.isFinite(parsedCurrent) ? parsedCurrent : 0,
        target_date: targetDate || null,
        account_id: accountId || null,
      });
      show("Meta salva.", "success");
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao salvar.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Sheet title={initial ? "Editar meta" : "Nova meta"} onClose={onClose}>
      <div className="auth-form">
        <div className="field">
          <label>Nome da meta</label>
          <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Reserva de emergência" />
        </div>

        <div className="field">
          <label>Ícone</label>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {GOAL_ICONS.map((i) => {
              const Icon = getIcon(i);
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => setIcon(i)}
                  className="panel-alt"
                  style={{
                    width: 38,
                    height: 38,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    border: icon === i ? "2px solid var(--color-accent)" : "2px solid transparent",
                    color: "var(--color-text)",
                  }}
                >
                  <Icon size={16} />
                </button>
              );
            })}
          </div>
        </div>

        <div className="field">
          <label>Cor</label>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {COLOR_CHOICES.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: "50%",
                  background: c,
                  border: color === c ? "3px solid var(--color-text)" : "2px solid transparent",
                  cursor: "pointer",
                }}
                aria-label={c}
              />
            ))}
          </div>
        </div>

        <div style={{ display: "flex", gap: 12 }}>
          <div className="field" style={{ flex: 1 }}>
            <label>Valor alvo</label>
            <input className="input" inputMode="decimal" value={targetAmount} onChange={(e) => setTargetAmount(e.target.value)} placeholder="0,00" />
          </div>
          <div className="field" style={{ flex: 1 }}>
            <label>Já economizado</label>
            <input className="input" inputMode="decimal" value={currentAmount} onChange={(e) => setCurrentAmount(e.target.value)} placeholder="0,00" />
          </div>
        </div>

        <div className="field">
          <label>Data alvo (opcional)</label>
          <input className="input" type="date" value={targetDate} onChange={(e) => setTargetDate(e.target.value)} />
        </div>

        <div className="field">
          <label>Vincular a uma conta (opcional)</label>
          <select className="select" value={accountId} onChange={(e) => setAccountId(e.target.value)}>
            <option value="">Nenhuma</option>
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
        </div>

        {error && <div className="error-text">{error}</div>}
        <button className="btn btn--primary btn--block" onClick={handleSubmit} disabled={saving}>
          {saving ? "Salvando…" : "Salvar meta"}
        </button>
      </div>
    </Sheet>
  );
}
