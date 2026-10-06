import { Download, Printer, BarChart3 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { IshikawaDiagram } from "../components/charts/IshikawaDiagram";
import { MonthlyBars } from "../components/charts/MonthlyBars";
import { ParetoChart } from "../components/charts/ParetoChart";
import { MonthPicker } from "../components/MonthPicker";
import { Banner, CardTitle, Empty, Loading } from "../components/ui";
import { useAccounts, useCategories, useProfile, useTransactions } from "../data/api";
import { budgetLines, buildInsights, fixedVariable, ishikawa, monthlySeries, pareto, summarize, totalsByCategory } from "../domain/analytics";
import { useBudgets } from "../data/api";
import { downloadText, toCSV } from "../lib/csv";
import { addMonths, dateBR, monthLabel, monthRange, ymKey } from "../lib/dates";
import { formatBRL, formatPercent } from "../lib/money";
import { useMonth } from "../lib/useMonth";

type Tab = "pareto" | "ishikawa" | "evolucao" | "relatorio";
const TABS: [Tab, string][] = [["pareto", "Pareto"], ["ishikawa", "Ishikawa"], ["evolucao", "Evolução"], ["relatorio", "Relatório"]];

export function Analysis() {
  const [ym, setYm] = useMonth();
  const [tab, setTab] = useState<Tab>("pareto");
  const r = monthRange(ym);
  const series = monthRange(addMonths(ym, -5));
  const txs = useTransactions(r.from, r.to);
  const history = useTransactions(series.from, r.to);
  const categories = useCategories();
  const budgets = useBudgets(ym);
  const profile = useProfile();
  const accounts = useAccounts();

  const items = useMemo(() => txs.data ?? [], [txs.data]);
  const cats = useMemo(() => categories.data ?? [], [categories.data]);
  const totals = useMemo(() => totalsByCategory(items, cats), [items, cats]);
  const par = useMemo(() => pareto(totals), [totals]);
  const fish = useMemo(() => ishikawa(items, cats), [items, cats]);
  const cur = useMemo(() => summarize(items), [items]);
  const fv = useMemo(() => fixedVariable(items, cats), [items, cats]);
  const points = useMemo(() => monthlySeries(history.data ?? [], ym, 6), [history.data, ym]);
  const lines = useMemo(() => budgetLines(cats, budgets.data ?? [], items), [cats, budgets.data, items]);
  const [view, setView] = useState<"diagram" | "list">("list");
  useEffect(() => { setView(matchMedia("(min-width: 760px)").matches ? "diagram" : "list"); }, []);

  if (txs.isLoading || categories.isLoading) return <Loading />;
  if (txs.error) return <Banner tone="danger">Não foi possível carregar as análises.</Banner>;

  const vitals = par.filter((p) => p.vital);
  const vitalShare = vitals.reduce((s, p) => s + p.share, 0);
  const previous = points.length >= 2 ? points[points.length - 2] : undefined;
  const insights = buildInsights({ current: cur, previous: previous && previous.expense > 0 ? previous : null, pareto: par, budgets: lines, fmt: formatBRL });
  const noExpenses = cur.expense === 0;

  const exportReport = () => {
    const share = new Map(par.map((p) => [p.id, p]));
    downloadText(`relatorio-${ymKey(ym)}.csv`, toCSV(["Categoria", "Natureza", "Lançamentos", "Total", "% do total", "% acumulado", "Grupo Pareto"], totals.map((t) => [t.name, t.nature === "fixed" ? "Fixa" : "Variável", t.count, t.total, formatPercent(share.get(t.id)?.share ?? 0), formatPercent(share.get(t.id)?.cumulative ?? 0), share.get(t.id)?.vital ? "Vital (80%)" : "Trivial"])));
  };

  return (
    <div className="stack">
      <div className="page-head no-print"><div><h1>Análises</h1><p className="sub">Entenda para onde o dinheiro vai</p></div><MonthPicker value={ym} onChange={setYm} /></div>
      <div className="tabs no-print" role="tablist" aria-label="Tipo de análise">
        {TABS.map(([k, l]) => <button key={k} role="tab" className="tab" aria-selected={tab === k} onClick={() => setTab(k)}>{l}</button>)}
      </div>

      {noExpenses && tab !== "evolucao" ? <section className="card"><Empty icon={BarChart3} title="Sem despesas neste mês">Registre despesas para gerar o {tab === "pareto" ? "Pareto" : tab === "ishikawa" ? "diagrama de Ishikawa" : "relatório"}.</Empty></section> : null}

      {tab === "pareto" && !noExpenses && (
        <>
          <section className="card">
            <CardTitle title="Pareto das despesas" hint={monthLabel(ym)} />
            <Banner tone="info"><strong>{vitals.length} de {par.length} categorias</strong> ({vitals.map((v) => v.name).join(", ")}) respondem por <strong>{formatPercent(vitalShare)}</strong> dos seus gastos. Comece a economizar por elas: é onde cada corte rende mais.</Banner>
            <div style={{ marginTop: 12 }}><ParetoChart items={par} /></div>
            <div className="legend" style={{ marginTop: 8 }}><span><i className="dot" style={{ background: "var(--accent)" }} />Poucos vitais (até 80%)</span><span><i className="dot" style={{ background: "var(--chart-muted)" }} />Muitos triviais</span><span><i className="dot" style={{ background: "var(--text)" }} />% acumulado</span></div>
          </section>
          <section className="card">
            <CardTitle title="Dados do gráfico" />
            <div className="scroll-x"><table className="data"><thead><tr><th>Categoria</th><th className="r">Total</th><th className="r">% do total</th><th className="r">Acumulado</th></tr></thead><tbody>
              {par.map((p) => <tr key={p.id}><td><i className="dot" style={{ background: p.color, marginRight: 8 }} />{p.name}{p.vital && <> <span className="tag">vital</span></>}</td><td className="r num">{formatBRL(p.total)}</td><td className="r num">{formatPercent(p.share)}</td><td className="r num">{formatPercent(p.cumulative)}</td></tr>)}
            </tbody></table></div>
          </section>
        </>
      )}

      {tab === "ishikawa" && !noExpenses && (
        <section className="card">
          <div className="card-title"><h2>Diagrama de Ishikawa (causa e efeito)</h2>
            <div className="seg no-print" style={{ width: 190 }} role="group" aria-label="Modo de exibição"><button type="button" aria-pressed={view === "diagram"} onClick={() => setView("diagram")}>Diagrama</button><button type="button" aria-pressed={view === "list"} onClick={() => setView("list")}>Lista</button></div></div>
          <p className="muted" style={{ marginBottom: 12 }}>Efeito: <strong>quanto você gastou</strong>. Cada espinha é uma categoria (causa); as linhas menores mostram os itens que mais pesaram dentro dela.</p>
          {view === "diagram" ? <div className="scroll-x"><IshikawaDiagram bones={fish.bones} effectTotal={fish.effectTotal} effectTitle={`Gastos de ${monthLabel(ym).split(" ")[0]}`} /></div> : (
            <div className="stack" style={{ gap: 12 }}>
              {fish.bones.map((b) => (
                <div key={b.id} style={{ borderLeft: `4px solid ${b.color}`, paddingLeft: 12 }}>
                  <div className="row between"><strong>{b.name}</strong><span className="num">{formatBRL(b.total)} · {formatPercent(b.share)}</span></div>
                  <ul style={{ margin: "6px 0 0", paddingLeft: 18 }} className="muted">{b.ribs.map((rb, i) => <li key={`${rb.label}${i}`}>{rb.label}: <span className="num">{formatBRL(rb.total)}</span>{rb.count > 1 ? ` (${rb.count}×)` : ""}</li>)}</ul>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {tab === "evolucao" && (
        <>
          <section className="card">
            <CardTitle title="Receitas x despesas" hint="Últimos 6 meses" />
            {history.isLoading ? <Loading rows={2} /> : <MonthlyBars points={points} />}
            <div className="legend"><span><i className="dot" style={{ background: "var(--bar-income)" }} />Receitas</span><span><i className="dot" style={{ background: "var(--bar-expense)" }} />Despesas</span></div>
          </section>
          <section className="card">
            <CardTitle title="Gastos fixos x variáveis" hint={monthLabel(ym)} />
            {fv.fixed + fv.variable === 0 ? <p className="muted">Sem despesas neste mês.</p> : (
              <div className="stack" style={{ gap: 10 }}>
                <div className="stackbar" role="img" aria-label={`Fixos ${formatPercent(fv.fixed / (fv.fixed + fv.variable))}, variáveis ${formatPercent(fv.variable / (fv.fixed + fv.variable))}`}><span style={{ width: `${(fv.fixed / (fv.fixed + fv.variable)) * 100}%`, background: "var(--accent)" }} /><span style={{ flex: 1, background: "var(--bar-expense)" }} /></div>
                <div className="row between wrap"><span><i className="dot" style={{ background: "var(--accent)" }} /> Fixos (difíceis de cortar): <strong className="num">{formatBRL(fv.fixed)}</strong></span><span><i className="dot" style={{ background: "var(--bar-expense)" }} /> Variáveis (onde dá para economizar): <strong className="num">{formatBRL(fv.variable)}</strong></span></div>
              </div>
            )}
          </section>
        </>
      )}

      {tab === "relatorio" && !noExpenses && (
        <section className="card stack" aria-label="Relatório mensal">
          <div className="row between wrap no-print"><h2>Relatório de {monthLabel(ym)}</h2><div className="row"><button className="btn sm" onClick={exportReport}><Download aria-hidden />CSV</button><button className="btn primary sm" onClick={() => window.print()}><Printer aria-hidden />Imprimir / PDF</button></div></div>
          <div className="print-only"><h1>Relatório financeiro — {monthLabel(ym)}</h1><p>{[profile.data?.display_name, profile.data?.institution, profile.data?.course].filter(Boolean).join(" · ")}</p></div>
          <div className="kpis"><div className="kpi"><div className="label">Receitas</div><div className="value num income">{formatBRL(cur.income)}</div></div><div className="kpi"><div className="label">Despesas</div><div className="value num expense">{formatBRL(cur.expense)}</div></div><div className="kpi"><div className="label">Sobra</div><div className="value num">{formatBRL(cur.balance)}</div></div><div className="kpi"><div className="label">Poupança</div><div className="value num">{cur.savingsRate === null ? "—" : formatPercent(cur.savingsRate)}</div></div></div>
          {insights.length > 0 && <div className="stack" style={{ gap: 8 }}>{insights.map((i) => <Banner key={i.text} tone={i.tone}>{i.text}</Banner>)}</div>}
          <div><h3 style={{ marginBottom: 6 }}>Despesas por categoria</h3><table className="data"><thead><tr><th>Categoria</th><th className="r">Total</th><th className="r">%</th></tr></thead><tbody>{par.map((p) => <tr key={p.id}><td>{p.name}</td><td className="r num">{formatBRL(p.total)}</td><td className="r num">{formatPercent(p.share)}</td></tr>)}<tr><th>Total</th><th className="r num">{formatBRL(cur.expense)}</th><th className="r">100%</th></tr></tbody></table></div>
          <div><h3 style={{ marginBottom: 6 }}>5 maiores despesas</h3><table className="data"><tbody>{[...items].filter((t) => t.type === "expense").sort((a, b) => b.amount - a.amount).slice(0, 5).map((t) => <tr key={t.id}><td>{dateBR(t.date)}</td><td>{t.description || "Sem descrição"}</td><td className="r num">{formatBRL(t.amount)}</td></tr>)}</tbody></table></div>
          <div><h3 style={{ marginBottom: 6 }}>Contas</h3><p className="muted">{(accounts.data ?? []).filter((a) => !a.archived_at).map((a) => a.name).join(", ")}</p></div>
        </section>
      )}
    </div>
  );
}
