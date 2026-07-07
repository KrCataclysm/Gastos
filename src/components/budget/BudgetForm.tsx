import { useState } from "react";
import { Sheet } from "@/components/ui/Sheet";
import { useData } from "@/contexts/DataContext";
import { useToast } from "@/components/ui/Toast";
import { monthLabel } from "@/lib/format";
import type { Budget } from "@/types";

export function BudgetForm({
  categoryId,
  year,
  month,
  initial,
  onClose,
}: {
  categoryId?: string;
  year: number;
  month: number;
  initial?: Budget;
  onClose: () => void;
}) {
  const { categories, saveBudget } = useData();
  const { show } = useToast();
  const [selectedCategoryId, setSelectedCategoryId] = useState(initial?.category_id ?? categoryId ?? "");
  const [amount, setAmount] = useState(initial ? String(initial.amount) : "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const options = categories.filter((c) => c.kind === "expense");

  async function handleSubmit() {
    setError(null);
    const parsed = Number(amount.replace(",", "."));
    if (!selectedCategoryId) {
      setError("Escolha uma categoria.");
      return;
    }
    if (!parsed || parsed <= 0) {
      setError("Informe um valor válido.");
      return;
    }
    setSaving(true);
    try {
      await saveBudget({ id: initial?.id, category_id: selectedCategoryId, year, month, amount: parsed });
      show("Orçamento salvo.", "success");
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao salvar.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Sheet title={`Orçamento · ${monthLabel(year, month)}`} onClose={onClose}>
      <div className="auth-form">
        <div className="field">
          <label>Categoria</label>
          <select className="select" value={selectedCategoryId} onChange={(e) => setSelectedCategoryId(e.target.value)} disabled={!!categoryId}>
            <option value="">Selecione…</option>
            {options.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label>Valor do orçamento</label>
          <input className="input" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0,00" />
        </div>
        {error && <div className="error-text">{error}</div>}
        <button className="btn btn--primary btn--block" onClick={handleSubmit} disabled={saving}>
          {saving ? "Salvando…" : "Salvar orçamento"}
        </button>
      </div>
    </Sheet>
  );
}
