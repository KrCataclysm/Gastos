import { Pencil, PiggyBank, Plus, Trash2 } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { z } from "zod";
import { TextField } from "../components/Field";
import { Badge } from "../components/Icon";
import { ColorPicker, IconPicker } from "../components/Pickers";
import { Sheet } from "../components/Sheet";
import { useToast } from "../components/Toast";
import { Banner, Empty, Loading, Progress } from "../components/ui";
import { useDeleteGoal, useGoals, useSaveGoal, useSetGoalAmount } from "../data/api";
import type { Goal } from "../domain/types";
import { dateBR, parseISODate, todayISO } from "../lib/dates";
import { formatBRL, formatPercent, parseMoneyInput } from "../lib/money";
import { zodResolverLite } from "../lib/validate";

const schema = z.object({ name: z.string().trim().min(1, "Dê um nome à meta.").max(80), target: z.number({ error: "Informe o valor da meta." }).positive("O valor precisa ser maior que zero.").lt(1_000_000_000), date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).or(z.literal("")) });

function monthsUntil(iso: string): number {
  const a = parseISODate(todayISO()); const b = parseISODate(iso);
  return Math.max(1, (b.getFullYear() - a.getFullYear()) * 12 + b.getMonth() - a.getMonth() + (b.getDate() >= a.getDate() ? 1 : 0));
}

export function Goals() {
  const goals = useGoals();
  const save = useSaveGoal();
  const setAmount = useSetGoalAmount();
  const del = useDeleteGoal();
  const toast = useToast();
  const [editing, setEditing] = useState<Goal | "new" | null>(null);
  const [deposit, setDeposit] = useState<Goal | null>(null);
  const [name, setName] = useState(""); const [target, setTarget] = useState(""); const [date, setDate] = useState(""); const [color, setColor] = useState("#0f766e"); const [icon, setIcon] = useState("piggy-bank");
  const [amount, setAmountText] = useState(""); const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (editing === null) return;
    setErrors({});
    if (editing === "new") { setName(""); setTarget(""); setDate(""); setColor("#0f766e"); setIcon("piggy-bank"); }
    else { setName(editing.name); setTarget(String(editing.target_amount).replace(".", ",")); setDate(editing.target_date ?? ""); setColor(editing.color); setIcon(editing.icon); }
  }, [editing]);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const { data, errors: errs } = zodResolverLite(schema, { name, target: parseMoneyInput(target) ?? undefined, date });
    setErrors(errs); if (!data) return;
    try { await save.mutateAsync({ id: editing !== "new" && editing ? editing.id : undefined, input: { name: data.name, target_amount: data.target, target_date: data.date || null, color, icon } }); setEditing(null); toast.show("Meta salva."); } catch (err) { toast.error(err); }
  };
  const confirmDeposit = async (e: FormEvent) => {
    e.preventDefault();
    const v = parseMoneyInput(amount);
    if (!deposit || v === null || v === 0) { setErrors({ amount: "Informe um valor." }); return; }
    try { await setAmount.mutateAsync({ id: deposit.id, current: deposit.current_amount + v }); toast.show(v > 0 ? "Valor guardado!" : "Retirada registrada."); setDeposit(null); } catch (err) { toast.error(err); }
  };

  if (goals.isLoading) return <Loading />;
  const list = goals.data ?? [];
  return (
    <div className="stack">
      <div className="page-head"><div><h1>Metas</h1><p className="sub">Notebook, intercâmbio, formatura… guarde com propósito</p></div><button className="btn primary" onClick={() => setEditing("new")}><Plus aria-hidden />Nova meta</button></div>
      {list.length === 0 ? <section className="card"><Empty icon={PiggyBank} title="Nenhuma meta ainda">Crie uma meta e acompanhe quanto falta para chegar lá.</Empty></section> : (
        <div className="grid-2">{list.map((g) => {
          const ratio = g.current_amount / g.target_amount; const missing = Math.max(0, g.target_amount - g.current_amount);
          return (
            <section key={g.id} className="card stack" style={{ gap: 10 }}>
              <div className="row"><Badge icon={g.icon} color={g.color} /><div className="main" style={{ flex: 1, minWidth: 0 }}><div className="title" style={{ fontWeight: 700 }}>{g.name}</div><div className="meta muted">{g.target_date ? `Até ${dateBR(g.target_date)}` : "Sem prazo"}</div></div>
                <button className="icon-btn" aria-label={`Editar ${g.name}`} onClick={() => setEditing(g)}><Pencil /></button>
                <button className="icon-btn" aria-label={`Excluir ${g.name}`} onClick={() => { if (confirm(`Excluir a meta “${g.name}”?`)) del.mutate(g.id, { onError: toast.error }); }}><Trash2 /></button></div>
              <Progress ratio={ratio} label={`Progresso da meta ${g.name}`} />
              <div className="row between"><strong className="num">{formatBRL(g.current_amount)}</strong><span className="muted num">de {formatBRL(g.target_amount)} · {formatPercent(Math.min(ratio, 1))}</span></div>
              {missing === 0 ? <Banner tone="good">Meta atingida! 🎉</Banner> : g.target_date && g.target_date >= todayISO() ? <p className="muted">Guarde cerca de <strong>{formatBRL(Math.ceil((missing / monthsUntil(g.target_date)) * 100) / 100)}</strong> por mês para chegar a tempo.</p> : <p className="muted">Faltam {formatBRL(missing)}.</p>}
              <div><button className="btn sm" onClick={() => { setDeposit(g); setAmountText(""); setErrors({}); }}>Guardar / retirar valor</button></div>
            </section>
          );
        })}</div>
      )}
      <Sheet open={editing !== null} title={editing === "new" ? "Nova meta" : "Editar meta"} onClose={() => setEditing(null)}>
        <form className="stack" onSubmit={submit} noValidate>
          <TextField label="Nome" value={name} onChange={(e) => setName(e.target.value)} error={errors.name} maxLength={80} placeholder="Ex.: Notebook novo" />
          <div className="form-grid two"><TextField label="Valor da meta (R$)" inputMode="decimal" value={target} onChange={(e) => setTarget(e.target.value)} error={errors.target} /><TextField label="Prazo (opcional)" type="date" value={date} onChange={(e) => setDate(e.target.value)} /></div>
          <ColorPicker value={color} onChange={setColor} /><IconPicker value={icon} onChange={setIcon} />
          <div className="sheet-actions"><button type="button" className="btn" onClick={() => setEditing(null)}>Cancelar</button><button className="btn primary" disabled={save.isPending}>Salvar</button></div>
        </form>
      </Sheet>
      <Sheet open={deposit !== null} title={`Guardar em “${deposit?.name ?? ""}”`} onClose={() => setDeposit(null)}>
        <form className="stack" onSubmit={confirmDeposit} noValidate>
          <TextField label="Valor (use negativo para retirar)" inputMode="decimal" value={amount} onChange={(e) => setAmountText(e.target.value)} error={errors.amount} autoFocus />
          <div className="sheet-actions"><button type="button" className="btn" onClick={() => setDeposit(null)}>Cancelar</button><button className="btn primary" disabled={setAmount.isPending}>Confirmar</button></div>
        </form>
      </Sheet>
    </div>
  );
}
