import { zodResolverLite } from "../lib/validate";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { z } from "zod";
import { useAccounts, useCategories, useDeleteTransaction, useRestoreTransaction, useSaveTransaction } from "../data/api";
import type { Transaction, TxType } from "../domain/types";
import { todayISO } from "../lib/dates";
import { parseMoneyInput } from "../lib/money";
import { SelectField, TextArea, TextField } from "./Field";
import { Icon } from "./Icon";
import { Sheet } from "./Sheet";
import { useToast } from "./Toast";

const schema = z.object({
  amount: z.number({ error: "Informe um valor." }).positive("O valor precisa ser maior que zero.").lt(1_000_000_000, "Valor alto demais."),
  description: z.string().trim().max(200, "Máximo de 200 caracteres."),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data inválida."),
  account_id: z.string().min(1, "Escolha a conta."),
  transfer_account_id: z.string().nullable(),
  notes: z.string().trim().max(1000, "Máximo de 1000 caracteres."),
});

export function QuickAdd({ open, editing, onClose }: { open: boolean; editing: Transaction | null; onClose: () => void }) {
  const accounts = useAccounts();
  const categories = useCategories();
  const save = useSaveTransaction();
  const del = useDeleteTransaction();
  const restore = useRestoreTransaction();
  const toast = useToast();

  const activeAccounts = useMemo(() => (accounts.data ?? []).filter((a) => !a.archived_at || a.id === editing?.account_id), [accounts.data, editing]);
  const [type, setType] = useState<TxType>("expense");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(todayISO());
  const [accountId, setAccountId] = useState("");
  const [toAccountId, setToAccountId] = useState("");
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [pending, setPending] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!open) return;
    setErrors({});
    if (editing) {
      setType(editing.type); setAmount(String(editing.amount).replace(".", ",")); setDescription(editing.description); setDate(editing.date);
      setAccountId(editing.account_id); setToAccountId(editing.transfer_account_id ?? ""); setCategoryId(editing.category_id); setNotes(editing.notes ?? ""); setPending(editing.status === "pending");
    } else {
      setType("expense"); setAmount(""); setDescription(""); setDate(todayISO()); setAccountId(""); setToAccountId(""); setCategoryId(null); setNotes(""); setPending(false);
    }
  }, [open, editing]);

  useEffect(() => {
    if (open && !accountId && activeAccounts[0]) setAccountId(activeAccounts[0].id);
  }, [open, accountId, activeAccounts]);

  const kindCats = (categories.data ?? []).filter((c) => type !== "transfer" && c.kind === type && (!c.archived_at || c.id === categoryId));

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const parsed = zodResolverLite(schema, { amount: parseMoneyInput(amount) ?? undefined, description, date, account_id: accountId, transfer_account_id: type === "transfer" ? toAccountId || null : null, notes });
    const errs: Record<string, string> = parsed.errors;
    if (type === "transfer") {
      if (!toAccountId) errs.transfer_account_id = "Escolha a conta de destino.";
      else if (toAccountId === accountId) errs.transfer_account_id = "Origem e destino precisam ser diferentes.";
    }
    setErrors(errs);
    if (!parsed.data || Object.keys(errs).length > 0) return;
    const v = parsed.data;
    try {
      await save.mutateAsync({
        id: editing?.id,
        input: { type, amount: v.amount, description: v.description || (type === "transfer" ? "Transferência" : ""), date: v.date, account_id: v.account_id, transfer_account_id: type === "transfer" ? toAccountId : null, category_id: type === "transfer" ? null : categoryId, notes: v.notes || null, status: pending ? "pending" : "cleared" },
      });
      toast.show(editing ? "Lançamento atualizado." : "Lançamento salvo.");
      onClose();
    } catch (err) { toast.error(err); }
  };

  const remove = async () => {
    if (!editing) return;
    const id = editing.id;
    try {
      await del.mutateAsync(id);
      onClose();
      toast.show("Lançamento excluído.", { action: { label: "Desfazer", run: () => restore.mutate(id, { onError: toast.error }) } });
    } catch (err) { toast.error(err); }
  };

  const busy = save.isPending || del.isPending;
  return (
    <Sheet open={open} title={editing ? "Editar lançamento" : "Novo lançamento"} onClose={onClose}>
      <form className="stack" onSubmit={submit} noValidate>
        <div className="seg" role="group" aria-label="Tipo de lançamento">
          {(["expense", "income", "transfer"] as const).map((t) => (
            <button key={t} type="button" aria-pressed={type === t} className={`is-${t}`} onClick={() => { setType(t); setCategoryId(null); }}>
              {t === "expense" ? "Despesa" : t === "income" ? "Receita" : "Transferência"}
            </button>
          ))}
        </div>
        <TextField label="Valor (R$)" className="input amount-input" inputMode="decimal" placeholder="0,00" value={amount} onChange={(e) => setAmount(e.target.value)} error={errors.amount} autoFocus autoComplete="off" />
        <TextField label="Descrição" placeholder={type === "expense" ? "Ex.: Bandejão, Xerox, Uber" : "Ex.: Mesada, Estágio"} value={description} onChange={(e) => setDescription(e.target.value)} error={errors.description} maxLength={200} autoComplete="off" />
        {type !== "transfer" && (
          <div className="field">
            <span className="lbl" id="cat-lbl">Categoria</span>
            <div className="chips" role="group" aria-labelledby="cat-lbl">
              {kindCats.map((c) => (
                <button key={c.id} type="button" className="chip" aria-pressed={categoryId === c.id} onClick={() => setCategoryId(categoryId === c.id ? null : c.id)}>
                  <span style={{ color: c.color, display: "inline-flex" }}><Icon name={c.icon} size={16} /></span>{c.name}
                </button>
              ))}
              {kindCats.length === 0 && <span className="muted">Nenhuma categoria. Crie em Mais › Contas e categorias.</span>}
            </div>
          </div>
        )}
        <div className="form-grid two">
          <TextField label="Data" type="date" value={date} onChange={(e) => setDate(e.target.value)} error={errors.date} />
          <SelectField label={type === "transfer" ? "Conta de origem" : "Conta"} value={accountId} onChange={(e) => setAccountId(e.target.value)} error={errors.account_id}>
            {activeAccounts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
          </SelectField>
        </div>
        {type === "transfer" && (
          <SelectField label="Conta de destino" value={toAccountId} onChange={(e) => setToAccountId(e.target.value)} error={errors.transfer_account_id}>
            <option value="">Selecione…</option>
            {activeAccounts.filter((a) => a.id !== accountId).map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
          </SelectField>
        )}
        <label className="row" style={{ gap: 10 }}>
          <input type="checkbox" checked={pending} onChange={(e) => setPending(e.target.checked)} style={{ width: 20, height: 20 }} />
          <span>Ainda não foi pago/recebido (pendente)</span>
        </label>
        <TextArea label="Observações (opcional)" value={notes} onChange={(e) => setNotes(e.target.value)} error={errors.notes} maxLength={1000} />
        <div className="sheet-actions">
          {editing && <button type="button" className="btn danger" onClick={remove} disabled={busy}>Excluir</button>}
          <span className="spacer" />
          <button type="button" className="btn" onClick={onClose}>Cancelar</button>
          <button type="submit" className="btn primary" disabled={busy}>{busy ? "Salvando…" : "Salvar"}</button>
        </div>
      </form>
    </Sheet>
  );
}
