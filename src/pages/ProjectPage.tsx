import { useMemo, useState } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import { useData } from "@/contexts/DataContext";
import { useToast } from "@/components/ui/Toast";
import { PageHeader } from "@/components/ui/PageHeader";
import { Ruler } from "@/components/ui/Ruler";
import { ParetoChart } from "@/components/charts/ParetoChart";
import { ControlChartView } from "@/components/charts/ControlChartView";
import { HistogramView } from "@/components/charts/HistogramView";
import { CAUSE_GROUPS, STAGES, actionProgress, currentMonthSpend, gutScore, monthlyBaseline, monthlySaving, normalizeProjectData, rankCauses, suggestedStage, weeklySpending } from "@/lib/dmaic";
import { effectiveExpenses, pareto, totalsByCategory } from "@/lib/analysis";
import { controlChart, histogram, mean, stdev, sturges } from "@/lib/stats";
import { newId } from "@/lib/id";
import { formatCurrency, formatPercent } from "@/lib/format";
import { parseDate } from "@/lib/calc";
import type { CauseGroup, ProjectAction, ProjectCause, ProjectData, ProjectStage } from "@/types";

const num = (s: string) => {
  const n = Number(s.replace(",", "."));
  return s.trim() === "" || !Number.isFinite(n) ? null : Math.max(0, n);
};

/** Campo que só grava ao sair (blur), evitando uma escrita no banco a cada tecla. */
function Field({ id, label, value, onCommit, multiline, placeholder, inputMode, type = "text" }: { id: string; label: string; value: string; onCommit: (v: string) => void; multiline?: boolean; placeholder?: string; inputMode?: "decimal"; type?: string }) {
  const [v, setV] = useState(value);
  const props = { id, value: v, placeholder, onChange: (e: { target: { value: string } }) => setV(e.target.value), onBlur: () => v !== value && onCommit(v) };
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      {multiline ? <textarea className="textarea" maxLength={1000} {...props} /> : <input className={`input${inputMode ? " mono" : ""}`} type={type} inputMode={inputMode} maxLength={200} {...props} />}
    </div>
  );
}

export function ProjectPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { projects, categories, transactions, saveProject, removeProject, goals } = useData();
  const { show } = useToast();
  const project = projects.find((p) => p.id === id);
  const [tab, setTab] = useState<ProjectStage | null>(null);

  const data = useMemo(() => normalizeProjectData(project?.data), [project?.data]);
  const catId = project?.category_id ?? null;
  const cat = categories.find((c) => c.id === catId);

  const weekly = useMemo(() => weeklySpending(transactions, 12, catId), [transactions, catId]);
  const values = weekly.map((w) => w.total);
  const chart = useMemo(() => controlChart(values), [values]);
  const hist = useMemo(() => histogram(values), [values]);
  const scoped = useMemo(() => {
    const from = new Date();
    from.setMonth(from.getMonth() - 3);
    return effectiveExpenses(transactions).filter((t) => (!catId || t.category_id === catId) && parseDate(t.date) >= from);
  }, [transactions, catId]);
  const byDescription = useMemo(() => {
    const m = new Map<string, number>();
    for (const t of scoped) {
      const k = t.description.trim() || "Sem descrição";
      m.set(k, (m.get(k) ?? 0) + Math.round(t.amount * 100));
    }
    return pareto([...m].map(([name, c]) => ({ id: name, name, color: "var(--color-accent)", nature: "variable" as const, total: c / 100, count: 0 })));
  }, [scoped]);

  if (!project) return <Navigate to="/projetos" replace />;

  const current: ProjectStage = tab ?? (project.stage === "done" ? "control" : project.stage);
  const save = (patch: Partial<ProjectData>, stage?: ProjectStage) => saveProject({ id: project.id, data: { ...data, ...patch }, ...(stage ? { stage } : {}) }).catch((e) => show(e instanceof Error ? e.message : "Erro ao salvar.", "error"));
  const goTo = (s: ProjectStage) => { setTab(s); void saveProject({ id: project.id, stage: s === "control" && project.stage === "done" ? "done" : s }); };

  const spentNow = currentMonthSpend(transactions, catId);
  const saving = monthlySaving(data);
  const reached = data.target != null && spentNow <= data.target;
  const progress = actionProgress(data.actions);
  const ranked = rankCauses(data.causes);

  const updateCause = (cid: string, patch: Partial<ProjectCause>) => save({ causes: data.causes.map((c) => (c.id === cid ? { ...c, ...patch } : c)) });
  const updateAction = (aid: string, patch: Partial<ProjectAction>) => save({ actions: data.actions.map((a) => (a.id === aid ? { ...a, ...patch } : a)) });

  return (
    <div className="stack">
      <PageHeader eyebrow={`Projeto · ${cat?.name ?? "Geral"}`} title={project.title}>
        <Link to="/projetos" className="btn btn--secondary btn--sm"><ArrowLeft size={15} /> Projetos</Link>
        <button className="btn btn--ghost btn--sm" onClick={async () => { await removeProject(project.id); show("Projeto removido.", "info"); navigate("/projetos"); }} aria-label="Remover projeto"><Trash2 size={15} /></button>
      </PageHeader>

      <nav className="seg" aria-label="Etapas do DMAIC" style={{ alignSelf: "flex-start", flexWrap: "wrap" }}>
        {STAGES.map((s) => (
          <button key={s.id} type="button" aria-pressed={current === s.id} onClick={() => goTo(s.id)}>
            <b className="mono">{s.letter}</b> {s.label}{suggestedStage(data) === s.id && project.stage !== "done" ? " •" : ""}
          </button>
        ))}
      </nav>
      <p className="text-muted" style={{ fontSize: 14 }}>{STAGES.find((s) => s.id === current)?.question}</p>

      {current === "define" && (
        <section className="card stack" aria-label="Definir">
          <Field id="p-problem" label="Qual é o problema?" multiline value={data.problem} onCommit={(v) => save({ problem: v })} placeholder="Ex.: Gasto com delivery passa de R$ 400 todo mês e estoura o orçamento." />
          <Field id="p-obj" label="Objetivo (o quê, quanto, até quando)" multiline value={data.objective} onCommit={(v) => save({ objective: v })} placeholder="Ex.: Reduzir para R$ 250/mês até dezembro." />
          <div className="grid grid--2">
            <Field id="p-base" label="Situação atual (R$/mês)" inputMode="decimal" value={data.baseline != null ? String(data.baseline) : ""} onCommit={(v) => save({ baseline: num(v) })} />
            <Field id="p-target" label="Meta (R$/mês)" inputMode="decimal" value={data.target != null ? String(data.target) : ""} onCommit={(v) => save({ target: num(v) })} />
            <Field id="p-deadline" label="Prazo" type="date" value={data.deadline ?? ""} onCommit={(v) => save({ deadline: v || null })} />
            <Field id="p-benefit" label="Para quê? (benefício)" value={data.benefit} onCommit={(v) => save({ benefit: v })} placeholder="Ex.: Fechar a reserva da viagem." />
          </div>
          {catId && (
            <button className="btn btn--secondary btn--sm" style={{ alignSelf: "flex-start" }} onClick={() => save({ baseline: Math.round(monthlyBaseline(transactions, catId) * 100) / 100 })}>Recalcular situação atual (média dos 3 últimos meses)</button>
          )}
          {saving > 0 && <p style={{ fontSize: 13.5 }}>Economia prevista: <b className="mono">{formatCurrency(saving)}/mês</b> · <b className="mono">{formatCurrency(saving * 12)}/ano</b>.{goals.length > 0 ? " Direcione para uma de suas metas." : ""}</p>}
          <button className="btn btn--primary btn--sm" style={{ alignSelf: "flex-start" }} onClick={() => goTo("measure")}>Próxima: Medir</button>
        </section>
      )}

      {current === "measure" && (
        <>
          <section className="card" aria-label="Gráfico de controle">
            <h2 className="panel-title">Gasto semanal (12 semanas)</h2>
            {chart ? (
              <>
                <ControlChartView values={values} labels={weekly.map((w) => w.start.slice(8) + "/" + w.start.slice(5, 7))} chart={chart} />
                <p style={{ fontSize: 13.5, lineHeight: 1.6, marginTop: 8 }}>
                  Média de <b className="mono">{formatCurrency(chart.center)}</b> por semana (desvio {formatCurrency(stdev(values))}). Faixa normal: {formatCurrency(chart.lcl)} a {formatCurrency(chart.ucl)}.{" "}
                  {chart.outOfControl.length > 0 ? <>Há <b>{chart.outOfControl.length} semana(s) fora de controle</b>: algo fora do padrão aconteceu nelas.</> : "Nenhuma semana saiu da faixa: o gasto é estável, então mudar exige mudar o hábito, não apagar incêndio."}
                  {chart.runs.length > 0 && " Há uma sequência de 7 semanas do mesmo lado da média: o patamar mudou."}
                </p>
              </>
            ) : <p className="text-muted" style={{ fontSize: 13.5 }}>São necessárias ao menos 5 semanas completas com lançamentos para montar o gráfico de controle.</p>}
          </section>
          {values.some((v) => v > 0) && (
            <section className="card" aria-label="Histograma">
              <h2 className="panel-title">Distribuição semanal ({sturges(values.length)} classes, regra de Sturges)</h2>
              <HistogramView bins={hist} />
              <p className="text-muted" style={{ fontSize: 13, marginTop: 6 }}>Média {formatCurrency(mean(values))}. Se há um “segundo morro” à direita, existe um tipo de semana mais cara (ex.: fim de semana de saída).</p>
            </section>
          )}
          <section className="card" aria-label="Pareto das descrições">
            <h2 className="panel-title">O que mais pesa neste gasto (3 meses)</h2>
            {byDescription.length > 0 ? <ParetoChart items={byDescription} /> : <p className="text-muted" style={{ fontSize: 13.5 }}>Sem despesas neste recorte.</p>}
          </section>
          <button className="btn btn--primary btn--sm" style={{ alignSelf: "flex-start" }} onClick={() => goTo("analyze")}>Próxima: Analisar</button>
        </>
      )}

      {current === "analyze" && (
        <section className="card stack" aria-label="Analisar">
          <h2 className="panel-title">Causas (Ishikawa 6M) e prioridade (matriz GUT)</h2>
          <p className="text-muted" style={{ fontSize: 13.5, lineHeight: 1.5 }}>Liste por que o gasto acontece. Dê notas de 1 a 5 para Gravidade (quanto pesa), Urgência (quão rápido piora) e Tendência (se tende a piorar). A maior nota GUT é onde atacar primeiro.</p>
          {ranked.map((c) => (
            <div key={c.id} className="row-item" style={{ display: "grid", gap: 8, padding: "12px 0", borderTop: "1px solid var(--color-border)" }}>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                <span className="badge badge--warning">{CAUSE_GROUPS[c.group]}</span>
                <b style={{ flex: 1, minWidth: 140 }}>{c.text}</b>
                <span className="mono" title="Gravidade × Urgência × Tendência">GUT {gutScore(c)}</span>
                <button className="btn btn--ghost btn--icon btn--sm" aria-label={`Remover causa ${c.text}`} onClick={() => save({ causes: data.causes.filter((x) => x.id !== c.id) })}><Trash2 size={14} /></button>
              </div>
              <div style={{ display: "flex", gap: 14, flexWrap: "wrap", alignItems: "center" }}>
                {(["g", "u", "t"] as const).map((k) => (
                  <label key={k} style={{ fontSize: 12.5, display: "flex", gap: 6, alignItems: "center" }}>
                    {{ g: "Gravidade", u: "Urgência", t: "Tendência" }[k]}
                    <select className="select" style={{ width: 64 }} value={c[k]} onChange={(e) => updateCause(c.id, { [k]: Number(e.target.value) })}>{[1, 2, 3, 4, 5].map((n) => <option key={n}>{n}</option>)}</select>
                  </label>
                ))}
                <label style={{ fontSize: 12.5, display: "flex", gap: 6, alignItems: "center" }}><input type="checkbox" checked={c.root} onChange={(e) => updateCause(c.id, { root: e.target.checked })} /> Causa raiz</label>
              </div>
            </div>
          ))}
          <CauseAdder onAdd={(group, text) => save({ causes: [...data.causes, { id: newId(), group, text, g: 3, u: 3, t: 3, root: false }] })} />
          <button className="btn btn--primary btn--sm" style={{ alignSelf: "flex-start" }} onClick={() => goTo("improve")}>Próxima: Melhorar</button>
        </section>
      )}

      {current === "improve" && (
        <section className="card stack" aria-label="Melhorar">
          <h2 className="panel-title">Plano de ação 5W2H</h2>
          {ranked.filter((c) => c.root).length > 0 && <p className="text-muted" style={{ fontSize: 13.5 }}>Causas raiz: {ranked.filter((c) => c.root).map((c) => c.text).join("; ")}.</p>}
          {data.actions.map((a) => (
            <div key={a.id} style={{ display: "grid", gap: 8, padding: "12px 0", borderTop: "1px solid var(--color-border)" }}>
              <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <input type="checkbox" aria-label={`Concluir: ${a.what}`} checked={a.done} onChange={(e) => updateAction(a.id, { done: e.target.checked })} />
                <b style={{ flex: 1, textDecoration: a.done ? "line-through" : undefined }}>{a.what}</b>
                <button className="btn btn--ghost btn--icon btn--sm" aria-label={`Remover ação ${a.what}`} onClick={() => save({ actions: data.actions.filter((x) => x.id !== a.id) })}><Trash2 size={14} /></button>
              </div>
              <div className="text-muted" style={{ fontSize: 12.5, lineHeight: 1.5 }}>
                {[a.why && `Por quê: ${a.why}`, a.how && `Como: ${a.how}`, a.who && `Quem: ${a.who}`, a.where && `Onde: ${a.where}`, a.when && `Quando: ${a.when.split("-").reverse().join("/")}`, a.howMuch != null && `Quanto: ${formatCurrency(a.howMuch)}`].filter(Boolean).join(" · ")}
              </div>
            </div>
          ))}
          <ActionAdder onAdd={(a) => save({ actions: [...data.actions, a] })} />
          {progress.actionsTotal > 0 && <div><Ruler value={progress.actionsDone / progress.actionsTotal} tone={progress.actionsDone === progress.actionsTotal ? "done" : "ok"} label="Ações concluídas" /><div className="mono text-muted" style={{ fontSize: 12.5, marginTop: 4 }}>{progress.actionsDone} de {progress.actionsTotal} concluídas</div></div>}
          <button className="btn btn--primary btn--sm" style={{ alignSelf: "flex-start" }} onClick={() => goTo("control")}>Próxima: Controlar</button>
        </section>
      )}

      {current === "control" && (
        <>
          <section className="card" aria-label="Resultado">
            <h2 className="panel-title">Resultado no mês atual</h2>
            {data.target != null ? (
              <>
                <div className="mono" style={{ fontSize: "1.45rem" }}>{formatCurrency(spentNow)} <span className="text-muted" style={{ fontSize: "0.9rem" }}>/ meta {formatCurrency(data.target)}</span></div>
                <div style={{ margin: "10px 0 4px" }}><Ruler value={data.target > 0 ? spentNow / data.target : 0} tone={reached ? "ok" : "over"} label="Gasto do mês em relação à meta do projeto" /></div>
                <p style={{ fontSize: 13.5 }}>{reached ? `Dentro da meta (${formatPercent(data.target > 0 ? spentNow / data.target : 0)} do limite).` : `Acima da meta em ${formatCurrency(spentNow - data.target)}.`}{chart && chart.outOfControl.includes(values.length - 1) ? " A última semana saiu da faixa de controle: acione o plano abaixo." : ""}</p>
              </>
            ) : <p className="text-muted" style={{ fontSize: 13.5 }}>Defina a meta na etapa Definir para acompanhar o resultado.</p>}
          </section>
          {chart && <section className="card" aria-label="Gráfico de controle"><h2 className="panel-title">Gráfico de controle</h2><ControlChartView values={values} labels={weekly.map((w) => w.start.slice(8) + "/" + w.start.slice(5, 7))} chart={chart} /></section>}
          <section className="card stack" aria-label="Padronizar">
            <Field id="p-ocap" label="Plano de reação (OCAP): se o gasto sair da faixa, eu faço…" multiline value={data.ocap} onCommit={(v) => save({ ocap: v })} placeholder="Ex.: Se a semana passar de R$ 120, cozinho em casa nas próximas 3 refeições e reviso o orçamento." />
            <Field id="p-lessons" label="Lições aprendidas" multiline value={data.lessons} onCommit={(v) => save({ lessons: v })} />
            <label style={{ display: "flex", gap: 8, alignItems: "center", fontSize: 14 }}><input type="checkbox" checked={data.standardized} onChange={(e) => save({ standardized: e.target.checked })} /> Padronizei o que funcionou (virou rotina ou recorrência)</label>
            {project.stage !== "done" ? (
              <button className="btn btn--primary btn--sm" style={{ alignSelf: "flex-start" }} onClick={() => { void saveProject({ id: project.id, stage: "done" }); show("Projeto concluído. Parabéns!", "success"); }} disabled={!data.standardized}>Concluir projeto</button>
            ) : <span className="badge badge--income" style={{ alignSelf: "flex-start" }}>Concluído</span>}
            {!data.standardized && project.stage !== "done" && <p className="text-muted" style={{ fontSize: 12.5 }}>Marque “padronizei” para poder concluir: sem padronizar, o ganho some em dois meses.</p>}
          </section>
        </>
      )}
      {/* resumo de categorias só para o contexto de leitura de leitores de tela */}
      <span className="sr-only">{totalsByCategory(scoped, categories).length} categorias no recorte.</span>
    </div>
  );
}

function CauseAdder({ onAdd }: { onAdd: (g: CauseGroup, text: string) => void }) {
  const [group, setGroup] = useState<CauseGroup>("mao_de_obra");
  const [text, setText] = useState("");
  const submit = () => { if (text.trim()) { onAdd(group, text.trim().slice(0, 200)); setText(""); } };
  return (
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
      <select className="select" style={{ width: "auto" }} aria-label="Grupo da causa" value={group} onChange={(e) => setGroup(e.target.value as CauseGroup)}>{Object.entries(CAUSE_GROUPS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
      <input className="input" style={{ flex: 1, minWidth: 180 }} aria-label="Nova causa" maxLength={200} value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => e.key === "Enter" && submit()} placeholder="Ex.: Peço delivery quando chego tarde da aula" />
      <button className="btn btn--secondary btn--sm" onClick={submit}><Plus size={15} /> Adicionar</button>
    </div>
  );
}

function ActionAdder({ onAdd }: { onAdd: (a: ProjectAction) => void }) {
  const [f, setF] = useState({ what: "", why: "", how: "", who: "Eu", where: "", when: "", howMuch: "" });
  const set = (k: keyof typeof f) => (e: { target: { value: string } }) => setF((p) => ({ ...p, [k]: e.target.value }));
  const submit = () => {
    if (!f.what.trim()) return;
    onAdd({ id: newId(), what: f.what.trim(), why: f.why.trim(), how: f.how.trim(), who: f.who.trim(), where: f.where.trim(), when: f.when || null, howMuch: num(f.howMuch), done: false });
    setF({ what: "", why: "", how: "", who: "Eu", where: "", when: "", howMuch: "" });
  };
  return (
    <div className="stack" style={{ gap: 10 }}>
      <div className="grid grid--2">
        <div className="field"><label htmlFor="a-what">O quê</label><input id="a-what" className="input" maxLength={200} value={f.what} onChange={set("what")} placeholder="Ex.: Cozinhar marmitas no domingo" /></div>
        <div className="field"><label htmlFor="a-why">Por quê</label><input id="a-why" className="input" maxLength={200} value={f.why} onChange={set("why")} /></div>
        <div className="field"><label htmlFor="a-how">Como</label><input id="a-how" className="input" maxLength={200} value={f.how} onChange={set("how")} /></div>
        <div className="field"><label htmlFor="a-who">Quem</label><input id="a-who" className="input" maxLength={100} value={f.who} onChange={set("who")} /></div>
        <div className="field"><label htmlFor="a-where">Onde</label><input id="a-where" className="input" maxLength={100} value={f.where} onChange={set("where")} /></div>
        <div className="field"><label htmlFor="a-when">Quando</label><input id="a-when" className="input" type="date" value={f.when} onChange={set("when")} /></div>
        <div className="field"><label htmlFor="a-much">Quanto custa (R$)</label><input id="a-much" className="input mono" inputMode="decimal" value={f.howMuch} onChange={set("howMuch")} /></div>
      </div>
      <button className="btn btn--secondary btn--sm" style={{ alignSelf: "flex-start" }} onClick={submit} disabled={!f.what.trim()}><Plus size={15} /> Adicionar ação</button>
    </div>
  );
}
