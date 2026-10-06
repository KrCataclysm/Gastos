import { BellRing, Receipt } from "lucide-react";
import { Link } from "react-router-dom";
import { useQuickAdd } from "../components/AppShell";
import { MonthPicker } from "../components/MonthPicker";
import { useToast } from "../components/Toast";
import { GroupedTransactions } from "../components/TransactionList";
import { Banner, CardTitle, Empty, Loading, Progress } from "../components/ui";
import { useAccounts, useAllTransactions, useBudgets, useCategories, useProfile, usePostRecurring, useRecurring, useTransactions } from "../data/api";
import { accountBalances, budgetLines, budgetTotals, buildInsights, dailyAllowance, dueRecurring, pareto, summarize, totalsByCategory } from "../domain/analytics";
import { addMonths, daysLeftInMonth, monthRange, todayISO } from "../lib/dates";
import { useMonth } from "../lib/useMonth";
import { formatBRL, formatPercent } from "../lib/money";

export function Dashboard() {
  const [ym, setYm] = useMonth();
  const range = monthRange(ym);
  const prev = monthRange(addMonths(ym, -1));
  const txs = useTransactions(range.from, range.to);
  const prevTxs = useTransactions(prev.from, prev.to);
  const all = useAllTransactions();
  const accounts = useAccounts();
  const categories = useCategories();
  const budgets = useBudgets(ym);
  const profile = useProfile();
  const recurring = useRecurring();
  const post = usePostRecurring();
  const toast = useToast();
  const { openNew, openEdit } = useQuickAdd();

  if (txs.isLoading || categories.isLoading || accounts.isLoading) return <Loading />;
  if (txs.error) return <Banner tone="danger">Não foi possível carregar seus dados. Verifique a conexão e recarregue a página.</Banner>;

  const items = txs.data ?? [];
  const cats = categories.data ?? [];
  const cur = summarize(items);
  const before = prevTxs.data ? summarize(prevTxs.data) : null;
  const lines = budgetLines(cats, budgets.data ?? [], items);
  const bt = budgetTotals(lines);
  const planned = bt.planned;
  const totalBalance = [...accountBalances((accounts.data ?? []).filter((a) => !a.archived_at), all.data ?? []).values()].reduce((s, v) => s + v, 0);
  const left = daysLeftInMonth(ym);
  const allowance = planned > 0 ? dailyAllowance(planned - bt.spent, left) : null;
  const par = pareto(totalsByCategory(items, cats));
  const insights = buildInsights({ current: cur, previous: before, pareto: par, budgets: lines, fmt: formatBRL });
  const due = dueRecurring(recurring.data ?? [], todayISO());
  const name = profile.data?.display_name?.split(" ")[0];
  const goal = profile.data?.monthly_income_goal;

  return (
    <div className="stack">
      <div className="page-head">
        <div><h1>{name ? `Olá, ${name}` : "Início"}</h1><p className="sub">Resumo do seu mês</p></div>
        <MonthPicker value={ym} onChange={setYm} />
      </div>

      {due.length > 0 && (
        <Banner tone="info">
          <div className="row between wrap" style={{ gap: 8 }}>
            <span><BellRing size={14} style={{ verticalAlign: "-2px" }} /> {due.length === 1 ? "1 conta fixa vence/venceu" : `${due.length} contas fixas vencem/venceram`}: <strong>{due.slice(0, 2).map((d) => d.description).join(", ")}{due.length > 2 ? "…" : ""}</strong></span>
            <button className="btn sm" disabled={post.isPending} onClick={async () => { try { for (const d of due) await post.mutateAsync(d); toast.show("Contas fixas lançadas."); } catch (e) { toast.error(e); } }}>Lançar agora</button>
          </div>
        </Banner>
      )}

      <div className="kpis">
        <div className="kpi hero"><div className="label">Sobra do mês</div><div className="value num">{formatBRL(cur.balance)}</div></div>
        <div className="kpi"><div className="label">Receitas</div><div className="value num income">{formatBRL(cur.income)}</div></div>
        <div className="kpi"><div className="label">Despesas</div><div className="value num expense">{formatBRL(cur.expense)}</div></div>
        <div className="kpi"><div className="label">Saldo nas contas</div><div className="value num">{formatBRL(totalBalance)}</div></div>
      </div>

      <div className="grid-2">
        <section className="card" aria-labelledby="orc">
          <CardTitle title="Orçamento do mês" hint={planned > 0 ? `${formatBRL(bt.spent)} de ${formatBRL(planned)}` : undefined} />
          {planned > 0 ? (
            <div className="stack" style={{ gap: 10 }}>
              <Progress ratio={bt.spent / planned} label="Gasto em relação ao orçamento" />
              <p>{bt.spent > planned ? <strong className="expense">Orçamento estourado em {formatBRL(bt.spent - planned)}.</strong> : <>Restam <strong>{formatBRL(planned - bt.spent)}</strong> ({formatPercent(1 - bt.spent / planned)}).</>}</p>
              {bt.unbudgeted > 0 && <p className="muted">Mais {formatBRL(bt.unbudgeted)} em categorias sem limite.</p>}
              {allowance !== null && bt.spent <= planned && <p className="muted">Dá para gastar cerca de <strong>{formatBRL(allowance)}</strong> por dia pelos próximos {left} dias.</p>}
              <Link to={`/orcamento?m=${ym.year}-${String(ym.month).padStart(2, "0")}`}>Ajustar orçamento</Link>
            </div>
          ) : (
            <Empty icon={Receipt} title="Sem orçamento definido">Defina um limite por categoria para saber quanto ainda pode gastar. <Link to="/orcamento">Criar orçamento</Link></Empty>
          )}
          {goal != null && goal > 0 && <p className="muted" style={{ marginTop: 10 }}>Meta de renda mensal: {formatBRL(cur.income)} de {formatBRL(goal)}.</p>}
        </section>

        <section className="card" aria-labelledby="ins">
          <CardTitle title="O que os números dizem" />
          {insights.length > 0 ? <div className="stack" style={{ gap: 8 }}>{insights.map((i) => <Banner key={i.text} tone={i.tone}>{i.text}</Banner>)}<Link to="/analises">Ver análises detalhadas</Link></div> : <Empty icon={Receipt} title="Ainda sem dados suficientes">Registre receitas e despesas para ver análises aqui.</Empty>}
        </section>
      </div>

      <section className="card">
        <CardTitle title="Últimos lançamentos" hint={items.length > 0 ? `${items.length} no mês` : undefined} />
        {items.length === 0 ? <Empty icon={Receipt} title="Nenhum lançamento neste mês"><button className="btn primary" onClick={openNew}>Fazer o primeiro lançamento</button></Empty> : <><GroupedTransactions items={items.slice(0, 6)} onOpen={openEdit} /><div style={{ marginTop: 8 }}><Link to="/lancamentos">Ver todos</Link></div></>}
      </section>
    </div>
  );
}
