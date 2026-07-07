import { useState } from "react";
import { Sheet } from "@/components/ui/Sheet";
import { useData } from "@/contexts/DataContext";
import { useToast } from "@/components/ui/Toast";
import type { RecurringFrequency, RecurringTransaction, TransactionType } from "@/types";
import { todayISO } from "@/lib/format";

export function RecurringForm({ initial, onClose }: { initial?: RecurringTransaction; onClose: () => void }) {
  const { accounts, categories, saveRecurring, removeRecurring } = useData();
  const { show } = useToast();
  const [type, setType] = useState<Extract<TransactionType, "income" | "expense">>(initial?.type ?? "expense");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [amount, setAmount] = useState(initial ? String(initial.amount) : "");
  const [accountId, setAccountId] = useState(initial?.account_id ?? accounts[0]?.id ?? "");
  const [categoryId, setCategoryId] = useState(initial?.category_id ?? "");
  const [frequency, setFrequency] = useState<RecurringFrequency>(initial?.frequency ?? "monthly");
  const [intervalCount, setIntervalCount] = useState(initial?.interval_count ?? 1);
  const [startDate, setStartDate] = useState(initial?.start_date ?? todayISO());
  const [endDate, setEndDate] = useState(initial?.end_date ?? "");
  const [autoPost, setAutoPost] = useState(initial?.auto_post ?? false);
  const [active, setActive] = useState(initial?.active ?? true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const categoryOptions = categories.filter((c) => c.kind === type);

  async function handleSubmit() {
    setError(null);
    const parsedAmount = Number(amount.replace(",", "."));
    if (!parsedAmount || parsedAmount <= 0) {
      setError("Informe um valor válido.");
      return;
    }
    if (!accountId) {
      setError("Escolha uma conta.");
      return;
    }
    setSaving(true);
    try {
      await saveRecurring({
        id: initial?.id,
        type,
        description,
        amount: parsedAmount,
        account_id: accountId,
        category_id: categoryId || null,
        frequency,
        interval_count: intervalCount,
        start_date: startDate,
        end_date: endDate || null,
        auto_post: autoPost,
        active,
      });
      show(initial ? "Recorrência atualizada." : "Recorrência criada.", "success");
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao salvar.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!initial) return;
    if (!window.confirm("Excluir esta recorrência?")) return;
    await removeRecurring(initial.id);
    show("Recorrência excluída.", "success");
    onClose();
  }

  return (
    <Sheet title={initial ? "Editar recorrência" : "Nova recorrência"} onClose={onClose}>
      <div className="auth-form">
        <div style={{ display: "flex", gap: 8 }}>
          {(["expense", "income"] as const).map((t) => (
            <button
              key={t}
              type="button"
              className={`chip${type === t ? " chip--active" : ""}`}
              style={{ flex: 1, justifyContent: "center" }}
              onClick={() => setType(t)}
            >
              {t === "expense" ? "Despesa" : "Receita"}
            </button>
          ))}
        </div>

        <div className="field">
          <label>Descrição</label>
          <input className="input" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Ex: Aluguel, Netflix…" />
        </div>

        <div className="field">
          <label>Valor (R$)</label>
          <input className="input" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0,00" />
        </div>

        <div className="field">
          <label>Conta</label>
          <select className="select" value={accountId} onChange={(e) => setAccountId(e.target.value)}>
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
        </div>

        <div className="field">
          <label>Categoria</label>
          <select className="select" value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
            <option value="">Sem categoria</option>
            {categoryOptions.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div style={{ display: "flex", gap: 12 }}>
          <div className="field" style={{ flex: 1 }}>
            <label>Frequência</label>
            <select className="select" value={frequency} onChange={(e) => setFrequency(e.target.value as RecurringFrequency)}>
              <option value="weekly">Semanal</option>
              <option value="biweekly">Quinzenal</option>
              <option value="monthly">Mensal</option>
              <option value="yearly">Anual</option>
            </select>
          </div>
          <div className="field" style={{ width: 90 }}>
            <label>A cada</label>
            <input
              className="input"
              type="number"
              min={1}
              value={intervalCount}
              onChange={(e) => setIntervalCount(Number(e.target.value) || 1)}
            />
          </div>
        </div>

        <div style={{ display: "flex", gap: 12 }}>
          <div className="field" style={{ flex: 1 }}>
            <label>Início</label>
            <input className="input" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          </div>
          <div className="field" style={{ flex: 1 }}>
            <label>Fim (opcional)</label>
            <input className="input" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          </div>
        </div>

        <label style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 14 }}>
          <input type="checkbox" checked={autoPost} onChange={(e) => setAutoPost(e.target.checked)} />
          Lançar automaticamente quando vencer
        </label>
        <label style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 14 }}>
          <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} />
          Ativa
        </label>

        {error && <div className="error-text">{error}</div>}
        <button className="btn btn--primary btn--block" onClick={handleSubmit} disabled={saving}>
          {saving ? "Salvando…" : "Salvar recorrência"}
        </button>
        {initial && (
          <button type="button" className="btn btn--danger btn--block" onClick={handleDelete}>
            Excluir recorrência
          </button>
        )}
      </div>
    </Sheet>
  );
}
