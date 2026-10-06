import { useState } from "react";
import { Sheet } from "@/components/ui/Sheet";
import { useData } from "@/contexts/DataContext";
import { useToast } from "@/components/ui/Toast";
import type { Transaction, TransactionType } from "@/types";
import { todayISO } from "@/lib/format";

export function TransactionForm({
  initial,
  defaultType,
  onClose,
}: {
  initial?: Transaction;
  defaultType?: TransactionType;
  onClose: () => void;
}) {
  const { accounts, categories, tags, saveTransaction, saveTag, removeTransaction } = useData();
  const { show } = useToast();
  const [type, setType] = useState<TransactionType>(initial?.type ?? defaultType ?? "expense");
  const [amount, setAmount] = useState(initial ? String(initial.amount) : "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [date, setDate] = useState(initial?.date ?? todayISO());
  const [accountId, setAccountId] = useState(initial?.account_id ?? accounts[0]?.id ?? "");
  const [transferAccountId, setTransferAccountId] = useState(initial?.transfer_account_id ?? "");
  const [categoryId, setCategoryId] = useState(initial?.category_id ?? "");
  const [status, setStatus] = useState(initial?.status ?? "cleared");
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [tagIds, setTagIds] = useState<string[]>(initial?.tag_ids ?? []);
  const [newTag, setNewTag] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const categoryOptions = categories.filter((c) => c.kind === type && !c.parent_id);
  const subcategoriesOf = (parentId: string) => categories.filter((c) => c.parent_id === parentId);

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
    if (type === "transfer" && (!transferAccountId || transferAccountId === accountId)) {
      setError("Escolha uma conta de destino diferente da origem.");
      return;
    }
    setSaving(true);
    try {
      await saveTransaction(
        {
          id: initial?.id,
          type,
          amount: parsedAmount,
          description,
          date,
          account_id: accountId,
          transfer_account_id: type === "transfer" ? transferAccountId : null,
          category_id: type === "transfer" ? null : categoryId || null,
          status,
          notes: notes || null,
        },
        type === "transfer" ? [] : tagIds,
      );
      show(initial ? "Lançamento atualizado." : "Lançamento adicionado.", "success");
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao salvar.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!initial) return;
    if (!window.confirm("Excluir este lançamento?")) return;
    await removeTransaction(initial.id);
    show("Lançamento excluído.", "success");
    onClose();
  }

  async function handleAddTag() {
    const name = newTag.trim();
    if (!name) return;
    const tag = await saveTag({ name });
    setTagIds((prev) => [...prev, tag.id]);
    setNewTag("");
  }

  return (
    <Sheet title={initial ? "Editar lançamento" : "Novo lançamento"} onClose={onClose}>
      <div className="auth-form">
        <div style={{ display: "flex", gap: 8 }}>
          {(["expense", "income", "transfer"] as TransactionType[]).map((t) => (
            <button
              key={t}
              type="button"
              className={`chip${type === t ? " chip--active" : ""}`}
              style={{ flex: 1, justifyContent: "center" }}
              onClick={() => setType(t)}
            >
              {t === "expense" ? "Despesa" : t === "income" ? "Receita" : "Transferência"}
            </button>
          ))}
        </div>

        <div className="field">
          <label>Valor (R$)</label>
          <input
            className="input"
            inputMode="decimal"
            placeholder="0,00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </div>

        <div className="field">
          <label>Descrição</label>
          <input className="input" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Ex: Supermercado" />
        </div>

        <div style={{ display: "flex", gap: 12 }}>
          <div className="field" style={{ flex: 1 }}>
            <label>Data</label>
            <input className="input" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div className="field" style={{ flex: 1 }}>
            <label>Status</label>
            <select className="select" value={status} onChange={(e) => setStatus(e.target.value as "cleared" | "pending")}>
              <option value="cleared">Efetivado</option>
              <option value="pending">Pendente/futuro</option>
            </select>
          </div>
        </div>

        <div className="field">
          <label>{type === "transfer" ? "Conta de origem" : "Conta"}</label>
          <select className="select" value={accountId} onChange={(e) => setAccountId(e.target.value)}>
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
        </div>

        {type === "transfer" ? (
          <div className="field">
            <label>Conta de destino</label>
            <select className="select" value={transferAccountId} onChange={(e) => setTransferAccountId(e.target.value)}>
              <option value="">Selecione…</option>
              {accounts
                .filter((a) => a.id !== accountId)
                .map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
            </select>
          </div>
        ) : (
          <div className="field">
            <label>Categoria</label>
            <select className="select" value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
              <option value="">Sem categoria</option>
              {categoryOptions.map((c) => (
                <optgroup key={c.id} label={c.name}>
                  <option value={c.id}>{c.name}</option>
                  {subcategoriesOf(c.id).map((sub) => (
                    <option key={sub.id} value={sub.id}>
                      {"  "}↳ {sub.name}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>
        )}

        {type !== "transfer" && (
          <div className="field">
            <label>Tags</label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {tags.map((tag) => (
                <button
                  type="button"
                  key={tag.id}
                  className={`chip${tagIds.includes(tag.id) ? " chip--active" : ""}`}
                  onClick={() =>
                    setTagIds((prev) => (prev.includes(tag.id) ? prev.filter((id) => id !== tag.id) : [...prev, tag.id]))
                  }
                >
                  {tag.name}
                </button>
              ))}
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
              <input
                className="input"
                placeholder="Nova tag"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddTag())}
              />
              <button type="button" className="btn btn--secondary btn--sm" onClick={handleAddTag}>
                Adicionar
              </button>
            </div>
          </div>
        )}

        <div className="field">
          <label>Notas (opcional)</label>
          <textarea className="textarea" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
        </div>

        {error && <div className="error-text">{error}</div>}
        <button className="btn btn--primary btn--block" onClick={handleSubmit} disabled={saving}>
          {saving ? "Salvando…" : "Salvar lançamento"}
        </button>
        {initial && (
          <button type="button" className="btn btn--danger btn--block" onClick={handleDelete}>
            Excluir lançamento
          </button>
        )}
      </div>
    </Sheet>
  );
}
