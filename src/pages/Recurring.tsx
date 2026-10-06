import { Plus, Repeat, Trash2 } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { z } from "zod";
import { SelectField, TextField } from "../components/Field";
import { Badge } from "../components/Icon";
import { Sheet } from "../components/Sheet";
import { useToast } from "../components/Toast";
import { Empty, Loading } from "../components/ui";
import { useAccounts, useCategories, useDeleteRecurring, useRecurring, useSaveRecurring } from "../data/api";
import type { Frequency } from "../domain/types";
import { dateBR, todayISO } from "../lib/dates";
import { formatBRL, parseMoneyInput } from "../lib/money";
import { zodResolverLite } from "../lib/validate";

const FREQ: Record<Frequency, string> = { weekly: "Toda semana", biweekly: "A cada 15 dias", monthly: "Todo mês", yearly: "Todo ano" };
const schema = z.object({ description: z.string().trim().min(1, "Descreva a conta.").max(200), amount: z.number({ error: "Informe o valor." }).positive("Maior que zero.").lt(1_000_000_000), account_id: z.string().min(1, "Escolha a conta."), start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data inválida.") });

export function Recurring() {
  const list = useRecurring(); const accounts = useAccounts(); const categories = useCategories();
  const save = useSaveRecurring(); const del = useDeleteRecurring(); const toast = useToast();
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<"expense" | "income">("expense");
  const [description, setDescription] = useState(""); const [amount, setAmount] = useState(""); const [accountId, setAccountId] = useState(""); const [categoryId, setCategoryId] = useState("");
  const [frequency, setFrequency] = useState<Frequency>("monthly"); const [start, setStart] = useState(todayISO()); const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => { if (!open) return; setType("expense"); setDescription(""); setAmount(""); setCategoryId(""); setFrequency("monthly"); setStart(todayISO()); setErrors({}); setAccountId(accounts.data?.find((a) => !a.archived_at)?.id ?? ""); }, [open, accounts.data]);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const { data, errors: errs } = zodResolverLite(schema, { description, amount: parseMoneyInput(amount) ?? undefined, account_id: accountId, start_date: start });
    setErrors(errs); if (!data) return;
    try { await save.mutateAsync({ input: { type, description: data.description, amount: data.amount, account_id: data.account_id, category_id: categoryId || null, frequency, start_date: data.start_date, day_of_month: Number(data.start_date.slice(8, 10)) } }); setOpen(false); toast.show("Conta fixa criada."); } catch (err) { toast.error(err); }
  };

  if (list.isLoading) return <Loading />;
  const catMap = new Map((categories.data ?? []).map((c) => [c.id, c]));
  const items = (list.data ?? []).filter((r) => r.active);
  return (
    <div className="stack">
      <div className="page-head"><div><h1>Contas fixas</h1><p className="sub">Mensalidade, aluguel, assinaturas: o app avisa quando vencem</p></div><button className="btn primary" onClick={() => setOpen(true)}><Plus aria-hidden />Nova</button></div>
      <section className="card">
        {items.length === 0 ? <Empty icon={Repeat} title="Nenhuma conta fixa">Cadastre o que se repete para não esquecer nem digitar todo mês.</Empty> : (
          <div className="list">{items.map((r) => { const c = r.category_id ? catMap.get(r.category_id) : undefined; return (
            <div key={r.id} className="item"><Badge icon={c?.icon ?? "repeat"} color={c?.color ?? "#64748b"} />
              <span className="main"><span className="title" style={{ display: "block" }}>{r.description}</span><span className="meta">{FREQ[r.frequency]} · próxima em {dateBR(r.next_run_date)}</span></span>
              <span className={`amount num ${r.type === "income" ? "income" : "expense"}`}>{formatBRL(r.amount)}</span>
              <button className="icon-btn" aria-label={`Excluir ${r.description}`} onClick={() => { if (confirm(`Excluir “${r.description}”? Lançamentos já feitos são mantidos.`)) del.mutate(r.id, { onError: toast.error }); }}><Trash2 /></button></div>); })}</div>
        )}
      </section>
      <Sheet open={open} title="Nova conta fixa" onClose={() => setOpen(false)}>
        <form className="stack" onSubmit={submit} noValidate>
          <div className="seg" role="group" aria-label="Tipo"><button type="button" className="is-expense" aria-pressed={type === "expense"} onClick={() => { setType("expense"); setCategoryId(""); }}>Despesa</button><button type="button" className="is-income" aria-pressed={type === "income"} onClick={() => { setType("income"); setCategoryId(""); }}>Receita</button></div>
          <TextField label="Descrição" value={description} onChange={(e) => setDescription(e.target.value)} error={errors.description} placeholder="Ex.: Mensalidade, Spotify" maxLength={200} />
          <div className="form-grid two"><TextField label="Valor (R$)" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} error={errors.amount} /><SelectField label="Repete" value={frequency} onChange={(e) => setFrequency(e.target.value as Frequency)}>{(Object.keys(FREQ) as Frequency[]).map((f) => <option key={f} value={f}>{FREQ[f]}</option>)}</SelectField></div>
          <div className="form-grid two"><TextField label="Primeiro vencimento" type="date" value={start} onChange={(e) => setStart(e.target.value)} error={errors.start_date} /><SelectField label="Conta" value={accountId} onChange={(e) => setAccountId(e.target.value)} error={errors.account_id}>{(accounts.data ?? []).filter((a) => !a.archived_at).map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}</SelectField></div>
          <SelectField label="Categoria" value={categoryId} onChange={(e) => setCategoryId(e.target.value)}><option value="">Sem categoria</option>{(categories.data ?? []).filter((c) => c.kind === type && !c.archived_at).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</SelectField>
          <div className="sheet-actions"><button type="button" className="btn" onClick={() => setOpen(false)}>Cancelar</button><button className="btn primary" disabled={save.isPending}>Salvar</button></div>
        </form>
      </Sheet>
    </div>
  );
}
