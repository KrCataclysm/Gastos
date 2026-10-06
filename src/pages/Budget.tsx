import { Copy } from "lucide-react";
import { useEffect, useState } from "react";
import { Badge } from "../components/Icon";
import { MonthPicker } from "../components/MonthPicker";
import { useToast } from "../components/Toast";
import { Banner, CardTitle, Empty, Loading, Progress } from "../components/ui";
import { useBudgets, useCategories, useSetBudget, useTransactions } from "../data/api";
import { budgetLines, budgetTotals, totalsByCategory } from "../domain/analytics";
import { addMonths, monthRange } from "../lib/dates";
import { formatBRL, formatPercent, parseMoneyInput } from "../lib/money";
import { useMonth } from "../lib/useMonth";

function LimitInput({ initial, onSave, label }: { initial: number; onSave: (v: number) => void; label: string }) {
  const [v, setV] = useState(initial ? String(initial).replace(".", ",") : "");
  useEffect(() => setV(initial ? String(initial).replace(".", ",") : ""), [initial]);
  return (
    <input className="input num" style={{ width: 120, minHeight: 38, textAlign: "right" }} inputMode="decimal" placeholder="Sem limite" aria-label={label} value={v} onChange={(e) => setV(e.target.value)}
      onBlur={() => { const n = v.trim() === "" ? 0 : parseMoneyInput(v); if (n === null || n < 0) { setV(initial ? String(initial).replace(".", ",") : ""); return; } if (n !== initial) onSave(n); }} />
  );
}

export function Budget() {
  const [ym, setYm] = useMonth();
  const prevYm = addMonths(ym, -1);
  const r = monthRange(ym);
  const cats = useCategories();
  const budgets = useBudgets(ym);
  const prevBudgets = useBudgets(prevYm);
  const txs = useTransactions(r.from, r.to);
  const setBudget = useSetBudget();
  const toast = useToast();

  if (cats.isLoading || budgets.isLoading || txs.isLoading) return <Loading />;
  const expense = (cats.data ?? []).filter((c) => c.kind === "expense" && !c.archived_at);
  const override = new Map((budgets.data ?? []).map((b) => [b.category_id, b.amount]));
  const spent = new Map(totalsByCategory(txs.data ?? [], cats.data ?? []).map((c) => [c.id, c.total]));
  const rows = expense.map((c) => ({ c, planned: override.get(c.id) ?? c.monthly_budget ?? 0, spent: spent.get(c.id) ?? 0 }));
  const bt = budgetTotals(budgetLines(cats.data ?? [], budgets.data ?? [], txs.data ?? []));
  const planned = bt.planned;
  const total = bt.spent;

  const save = (categoryId: string, amount: number) => setBudget.mutate({ categoryId, ym, amount }, { onError: toast.error });
  const copyPrev = async () => {
    const list = prevBudgets.data ?? [];
    if (list.length === 0) { toast.show("O mês anterior não tem limites definidos."); return; }
    try { for (const b of list) await setBudget.mutateAsync({ categoryId: b.category_id, ym, amount: b.amount }); toast.show("Limites copiados do mês anterior."); } catch (e) { toast.error(e); }
  };

  return (
    <div className="stack">
      <div className="page-head"><div><h1>Orçamento</h1><p className="sub">Defina o limite de cada categoria neste mês</p></div><MonthPicker value={ym} onChange={setYm} /></div>
      <section className="card">
        <CardTitle title="Visão geral" hint={planned > 0 ? `${formatBRL(total)} de ${formatBRL(planned)} (categorias com limite)` : undefined} />
        {planned > 0 ? <div className="stack" style={{ gap: 8 }}><Progress ratio={total / planned} label="Total gasto em relação ao orçamento" /><p className="muted">{total > planned ? `Estourou ${formatBRL(total - planned)} (${formatPercent(total / planned - 1)} acima).` : `Você usou ${formatPercent(total / planned)} do planejado.`}</p></div> : <Banner tone="info">Escreva um limite ao lado de cada categoria. Ele vale para este mês; use “Copiar do mês anterior” para repetir.</Banner>}
        <div style={{ marginTop: 12 }}><button className="btn sm" onClick={copyPrev} disabled={setBudget.isPending}><Copy aria-hidden />Copiar do mês anterior</button></div>
      </section>
      <section className="card">
        {rows.length === 0 ? <Empty icon={Copy} title="Sem categorias de despesa">Crie categorias em Mais › Contas e categorias.</Empty> : (
          <div className="list">
            {rows.map(({ c, planned: p, spent: s }) => {
              const ratio = p > 0 ? s / p : 0;
              return (
                <div key={c.id} className="item" style={{ alignItems: "flex-start" }}>
                  <Badge icon={c.icon} color={c.color} />
                  <div className="main" style={{ display: "grid", gap: 6 }}>
                    <div className="row between"><span className="title">{c.name}</span><LimitInput initial={p} label={`Limite de ${c.name}`} onSave={(v) => save(c.id, v)} /></div>
                    {p > 0 ? <Progress ratio={ratio} label={`Gasto em ${c.name}`} /> : null}
                    <span className="meta num">{formatBRL(s)} gastos{p > 0 ? (s > p ? <> · <span className="expense">{formatBRL(s - p)} acima</span></> : ` · restam ${formatBRL(p - s)}`) : ""}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
