import { Archive, ArchiveRestore, Pencil, Plus } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { z } from "zod";
import { SelectField, TextField } from "../components/Field";
import { Badge } from "../components/Icon";
import { ColorPicker, IconPicker } from "../components/Pickers";
import { Sheet } from "../components/Sheet";
import { useToast } from "../components/Toast";
import { CardTitle, Loading } from "../components/ui";
import { useAccounts, useArchiveAccount, useArchiveCategory, useCategories, useSaveAccount, useSaveCategory } from "../data/api";
import type { Account, AccountType, Category, Nature } from "../domain/types";
import { formatBRL, parseMoneyInput } from "../lib/money";
import { zodResolverLite } from "../lib/validate";

const ACC_TYPES: Record<AccountType, string> = { cash: "Dinheiro/Carteira", checking: "Conta corrente", savings: "Poupança", credit_card: "Cartão de crédito", investment: "Investimento", other: "Outra" };
const accSchema = z.object({ name: z.string().trim().min(1, "Informe o nome.").max(60), balance: z.number({ error: "Valor inválido." }).gt(-1_000_000_000).lt(1_000_000_000) });
const catSchema = z.object({ name: z.string().trim().min(1, "Informe o nome.").max(60) });

function AccountSheet({ editing, onClose }: { editing: Account | "new" | null; onClose: () => void }) {
  const save = useSaveAccount(); const toast = useToast();
  const [name, setName] = useState(""); const [type, setType] = useState<AccountType>("checking"); const [balance, setBalance] = useState("0"); const [color, setColor] = useState("#2563eb"); const [icon, setIcon] = useState("wallet"); const [errors, setErrors] = useState<Record<string, string>>({});
  useEffect(() => { if (editing === null) return; setErrors({}); if (editing === "new") { setName(""); setType("checking"); setBalance("0"); setColor("#2563eb"); setIcon("wallet"); } else { setName(editing.name); setType(editing.type); setBalance(String(editing.initial_balance).replace(".", ",")); setColor(editing.color); setIcon(editing.icon); } }, [editing]);
  const submit = async (e: FormEvent) => { e.preventDefault(); const { data, errors: errs } = zodResolverLite(accSchema, { name, balance: parseMoneyInput(balance) ?? undefined }); setErrors(errs); if (!data) return;
    try { await save.mutateAsync({ id: editing && editing !== "new" ? editing.id : undefined, input: { name: data.name, type, initial_balance: data.balance, color, icon } }); toast.show("Conta salva."); onClose(); } catch (err) { toast.error(err); } };
  return (
    <Sheet open={editing !== null} title={editing === "new" ? "Nova conta" : "Editar conta"} onClose={onClose}>
      <form className="stack" onSubmit={submit} noValidate>
        <TextField label="Nome" value={name} onChange={(e) => setName(e.target.value)} error={errors.name} maxLength={60} placeholder="Ex.: Nubank, Carteira" />
        <div className="form-grid two"><SelectField label="Tipo" value={type} onChange={(e) => setType(e.target.value as AccountType)}>{(Object.keys(ACC_TYPES) as AccountType[]).map((t) => <option key={t} value={t}>{ACC_TYPES[t]}</option>)}</SelectField><TextField label="Saldo inicial (R$)" inputMode="decimal" value={balance} onChange={(e) => setBalance(e.target.value)} error={errors.balance} /></div>
        <ColorPicker value={color} onChange={setColor} /><IconPicker value={icon} onChange={setIcon} />
        <div className="sheet-actions"><button type="button" className="btn" onClick={onClose}>Cancelar</button><button className="btn primary" disabled={save.isPending}>Salvar</button></div>
      </form>
    </Sheet>
  );
}

function CategorySheet({ editing, onClose }: { editing: Category | "new" | null; onClose: () => void }) {
  const save = useSaveCategory(); const toast = useToast();
  const [name, setName] = useState(""); const [kind, setKind] = useState<"income" | "expense">("expense"); const [nature, setNature] = useState<Nature>("variable"); const [color, setColor] = useState("#0f766e"); const [icon, setIcon] = useState("tag"); const [limit, setLimit] = useState(""); const [errors, setErrors] = useState<Record<string, string>>({});
  useEffect(() => { if (editing === null) return; setErrors({}); if (editing === "new") { setName(""); setKind("expense"); setNature("variable"); setColor("#0f766e"); setIcon("tag"); setLimit(""); } else { setName(editing.name); setKind(editing.kind); setNature(editing.nature); setColor(editing.color); setIcon(editing.icon); setLimit(editing.monthly_budget ? String(editing.monthly_budget).replace(".", ",") : ""); } }, [editing]);
  const submit = async (e: FormEvent) => { e.preventDefault(); const { data, errors: errs } = zodResolverLite(catSchema, { name }); const lim = limit.trim() === "" ? null : parseMoneyInput(limit); if (limit.trim() !== "" && (lim === null || lim < 0)) errs.limit = "Valor inválido."; setErrors(errs); if (!data || errs.limit) return;
    try { await save.mutateAsync({ id: editing && editing !== "new" ? editing.id : undefined, input: { name: data.name, kind, nature, color, icon, monthly_budget: kind === "expense" ? lim : null } }); toast.show("Categoria salva."); onClose(); } catch (err) { toast.error(err); } };
  return (
    <Sheet open={editing !== null} title={editing === "new" ? "Nova categoria" : "Editar categoria"} onClose={onClose}>
      <form className="stack" onSubmit={submit} noValidate>
        <TextField label="Nome" value={name} onChange={(e) => setName(e.target.value)} error={errors.name} maxLength={60} />
        <div className="form-grid two"><SelectField label="Tipo" value={kind} onChange={(e) => setKind(e.target.value as "income" | "expense")} disabled={editing !== "new" && editing !== null}><option value="expense">Despesa</option><option value="income">Receita</option></SelectField><SelectField label="Natureza" value={nature} onChange={(e) => setNature(e.target.value as Nature)} hint="Fixa: todo mês igual. Variável: muda."><option value="variable">Variável</option><option value="fixed">Fixa</option></SelectField></div>
        {kind === "expense" && <TextField label="Limite mensal padrão (opcional)" inputMode="decimal" value={limit} onChange={(e) => setLimit(e.target.value)} error={errors.limit} hint="Usado no Orçamento quando não há limite específico do mês." />}
        <ColorPicker value={color} onChange={setColor} /><IconPicker value={icon} onChange={setIcon} />
        <div className="sheet-actions"><button type="button" className="btn" onClick={onClose}>Cancelar</button><button className="btn primary" disabled={save.isPending}>Salvar</button></div>
      </form>
    </Sheet>
  );
}

export function Manage() {
  const accounts = useAccounts(); const categories = useCategories(); const archA = useArchiveAccount(); const archC = useArchiveCategory(); const toast = useToast();
  const [acc, setAcc] = useState<Account | "new" | null>(null); const [cat, setCat] = useState<Category | "new" | null>(null);
  if (accounts.isLoading || categories.isLoading) return <Loading />;
  const catGroup = (kind: "expense" | "income", title: string) => (
    <>
      <div className="list-group-title"><span>{title}</span></div>
      {(categories.data ?? []).filter((c) => c.kind === kind).map((c) => (
        <div key={c.id} className="item" style={{ opacity: c.archived_at ? 0.55 : 1 }}><Badge icon={c.icon} color={c.color} />
          <span className="main"><span className="title" style={{ display: "block" }}>{c.name}</span><span className="meta">{c.nature === "fixed" ? "Fixa" : "Variável"}{c.archived_at ? " · arquivada" : ""}</span></span>
          <button className="icon-btn" aria-label={`Editar ${c.name}`} onClick={() => setCat(c)}><Pencil /></button>
          <button className="icon-btn" aria-label={`${c.archived_at ? "Reativar" : "Arquivar"} ${c.name}`} onClick={() => archC.mutate({ id: c.id, archived: !c.archived_at }, { onError: toast.error })}>{c.archived_at ? <ArchiveRestore /> : <Archive />}</button></div>
      ))}
    </>
  );
  return (
    <div className="stack">
      <div className="page-head"><h1>Contas e categorias</h1></div>
      <section className="card">
        <div className="card-title"><h2>Contas</h2><button className="btn sm" onClick={() => setAcc("new")}><Plus aria-hidden />Nova</button></div>
        <div className="list">{(accounts.data ?? []).map((a) => (
          <div key={a.id} className="item" style={{ opacity: a.archived_at ? 0.55 : 1 }}><Badge icon={a.icon} color={a.color} />
            <span className="main"><span className="title" style={{ display: "block" }}>{a.name}</span><span className="meta">{ACC_TYPES[a.type]} · saldo inicial {formatBRL(a.initial_balance)}{a.archived_at ? " · arquivada" : ""}</span></span>
            <button className="icon-btn" aria-label={`Editar ${a.name}`} onClick={() => setAcc(a)}><Pencil /></button>
            <button className="icon-btn" aria-label={`${a.archived_at ? "Reativar" : "Arquivar"} ${a.name}`} onClick={() => archA.mutate({ id: a.id, archived: !a.archived_at }, { onError: toast.error })}>{a.archived_at ? <ArchiveRestore /> : <Archive />}</button></div>))}</div>
      </section>
      <section className="card">
        <div className="card-title"><h2>Categorias</h2><button className="btn sm" onClick={() => setCat("new")}><Plus aria-hidden />Nova</button></div>
        <CardTitle title="" />
        <div className="list">{catGroup("expense", "Despesas")}{catGroup("income", "Receitas")}</div>
        <p className="muted" style={{ marginTop: 10 }}>Arquivar esconde a categoria dos formulários sem apagar o histórico.</p>
      </section>
      <AccountSheet editing={acc} onClose={() => setAcc(null)} />
      <CategorySheet editing={cat} onClose={() => setCat(null)} />
    </div>
  );
}
