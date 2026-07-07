import { useState } from "react";
import { Sheet } from "@/components/ui/Sheet";
import { useData } from "@/contexts/DataContext";
import { useToast } from "@/components/ui/Toast";
import { ACCENT_PRESETS } from "@/contexts/ThemeContext";
import type { Account, AccountType } from "@/types";

const TYPE_LABELS: Record<AccountType, string> = {
  checking: "Conta corrente",
  cash: "Dinheiro",
  credit_card: "Cartão de crédito",
  savings: "Poupança",
  investment: "Investimento",
  other: "Outro",
};

export function AccountForm({ initial, onClose }: { initial?: Account; onClose: () => void }) {
  const { saveAccount, removeAccount } = useData();
  const { show } = useToast();
  const [name, setName] = useState(initial?.name ?? "");
  const [type, setType] = useState<AccountType>(initial?.type ?? "checking");
  const [initialBalance, setInitialBalance] = useState(initial ? String(initial.initial_balance) : "0");
  const [color, setColor] = useState(initial?.color ?? ACCENT_PRESETS[0]);
  const [creditLimit, setCreditLimit] = useState(initial?.credit_limit ? String(initial.credit_limit) : "");
  const [closingDay, setClosingDay] = useState(initial?.closing_day ? String(initial.closing_day) : "1");
  const [dueDay, setDueDay] = useState(initial?.due_day ? String(initial.due_day) : "10");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    setError(null);
    if (!name.trim()) {
      setError("Dê um nome para a conta.");
      return;
    }
    setSaving(true);
    try {
      await saveAccount({
        id: initial?.id,
        name: name.trim(),
        type,
        initial_balance: Number(initialBalance.replace(",", ".")) || 0,
        color,
        icon: type === "credit_card" ? "credit-card" : type === "investment" ? "trending-up" : "wallet",
        credit_limit: type === "credit_card" && creditLimit ? Number(creditLimit.replace(",", ".")) : null,
        closing_day: type === "credit_card" ? Number(closingDay) : null,
        due_day: type === "credit_card" ? Number(dueDay) : null,
      });
      show(initial ? "Conta atualizada." : "Conta criada.", "success");
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao salvar.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!initial) return;
    if (!window.confirm("Excluir esta conta? Lançamentos ligados a ela serão mantidos no histórico.")) return;
    await removeAccount(initial.id);
    show("Conta excluída.", "success");
    onClose();
  }

  return (
    <Sheet title={initial ? "Editar conta" : "Nova conta"} onClose={onClose}>
      <div className="auth-form">
        <div className="field">
          <label>Nome</label>
          <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Nubank, Carteira…" />
        </div>

        <div className="field">
          <label>Tipo</label>
          <select className="select" value={type} onChange={(e) => setType(e.target.value as AccountType)}>
            {Object.entries(TYPE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>

        <div className="field">
          <label>Saldo inicial</label>
          <input className="input" inputMode="decimal" value={initialBalance} onChange={(e) => setInitialBalance(e.target.value)} />
        </div>

        {type === "credit_card" && (
          <>
            <div className="field">
              <label>Limite do cartão</label>
              <input className="input" inputMode="decimal" value={creditLimit} onChange={(e) => setCreditLimit(e.target.value)} placeholder="0,00" />
            </div>
            <div style={{ display: "flex", gap: 12 }}>
              <div className="field" style={{ flex: 1 }}>
                <label>Dia de fechamento</label>
                <input className="input" type="number" min={1} max={28} value={closingDay} onChange={(e) => setClosingDay(e.target.value)} />
              </div>
              <div className="field" style={{ flex: 1 }}>
                <label>Dia de vencimento</label>
                <input className="input" type="number" min={1} max={28} value={dueDay} onChange={(e) => setDueDay(e.target.value)} />
              </div>
            </div>
          </>
        )}

        <div className="field">
          <label>Cor</label>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {ACCENT_PRESETS.map((c) => (
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

        {error && <div className="error-text">{error}</div>}
        <button className="btn btn--primary btn--block" onClick={handleSubmit} disabled={saving}>
          {saving ? "Salvando…" : "Salvar conta"}
        </button>
        {initial && (
          <button type="button" className="btn btn--danger btn--block" onClick={handleDelete}>
            Excluir conta
          </button>
        )}
      </div>
    </Sheet>
  );
}
