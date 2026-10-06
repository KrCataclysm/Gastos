import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ClipboardCheck, FolderKanban, Plus } from "lucide-react";
import { useData } from "@/contexts/DataContext";
import { useToast } from "@/components/ui/Toast";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { Sheet } from "@/components/ui/Sheet";
import { STAGES, actionProgress, emptyProjectData, monthlyBaseline, normalizeProjectData } from "@/lib/dmaic";
import { formatCurrency } from "@/lib/format";

export function ProjectsPage() {
  const { projects, categories, transactions, saveProject } = useData();
  const { show } = useToast();
  const navigate = useNavigate();
  const [showNew, setShowNew] = useState(false);
  const [title, setTitle] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const expenseCats = categories.filter((c) => c.kind === "expense" && !c.archived_at);

  async function create() {
    if (!title.trim()) return;
    const data = emptyProjectData();
    if (categoryId) data.baseline = Math.round(monthlyBaseline(transactions, categoryId) * 100) / 100;
    try {
      const p = await saveProject({ title: title.trim().slice(0, 120), category_id: categoryId || null, stage: "define", data });
      setShowNew(false);
      setTitle("");
      setCategoryId("");
      navigate(`/projetos/${p.id}`);
    } catch (e) {
      show(e instanceof Error ? e.message : "Não foi possível criar o projeto.", "error");
    }
  }

  const active = projects.filter((p) => !p.archived_at);

  return (
    <div className="stack">
      <PageHeader eyebrow="Melhoria contínua" title="Projetos">
        <Link to="/checkup" className="btn btn--secondary btn--sm"><ClipboardCheck size={15} /> Check-up 5S</Link>
        <button className="btn btn--primary btn--sm" onClick={() => setShowNew(true)}><Plus size={15} /> Novo projeto</button>
      </PageHeader>

      <section className="card">
        <p style={{ fontSize: 14, lineHeight: 1.6, maxWidth: "62ch" }}>
          Um projeto usa o método <b>DMAIC</b> para atacar um gasto específico: <b>D</b>efinir o problema, <b>M</b>edir como ele se comporta, <b>A</b>nalisar as causas, <b>M</b>elhorar com um plano de ação e <b>C</b>ontrolar para o ganho não se perder.
        </p>
      </section>

      {active.length === 0 ? (
        <section className="card"><EmptyState icon={FolderKanban} title="Nenhum projeto ainda" description="Escolha o gasto que mais pesa (veja o Pareto em Relatórios) e transforme em um projeto com meta e prazo." /></section>
      ) : (
        <div className="grid grid--2">
          {active.map((p) => {
            const d = normalizeProjectData(p.data);
            const cat = categories.find((c) => c.id === p.category_id);
            const idx = STAGES.findIndex((s) => s.id === p.stage);
            const prog = actionProgress(d.actions);
            return (
              <Link key={p.id} to={`/projetos/${p.id}`} className="card" style={{ textDecoration: "none", color: "inherit", display: "block" }} aria-label={`Abrir projeto ${p.title}`}>
                <div className="eyebrow">{cat?.name ?? "Geral"}</div>
                <h2 style={{ fontSize: "1.1rem", fontWeight: 600, margin: "6px 0 14px" }}>{p.title}</h2>
                <ol style={{ display: "flex", gap: 6, listStyle: "none", padding: 0, margin: 0 }} aria-label={`Etapa atual: ${p.stage === "done" ? "concluído" : STAGES[idx]?.label}`}>
                  {STAGES.map((s, i) => {
                    const reached = p.stage === "done" || i <= idx;
                    return <li key={s.id} className="mono" style={{ width: 30, height: 30, display: "grid", placeItems: "center", borderRadius: 6, fontWeight: 600, fontSize: 13, background: reached ? "var(--color-accent)" : "var(--color-panel-alt)", color: reached ? "var(--color-on-accent)" : "var(--color-text-muted)" }}>{s.letter}</li>;
                  })}
                </ol>
                <div className="mono text-muted" style={{ fontSize: 12.5, marginTop: 12 }}>
                  {d.target != null ? `Meta: ${formatCurrency(d.target)}/mês` : "Meta ainda não definida"}
                  {prog.actionsTotal > 0 ? ` · ${prog.actionsDone}/${prog.actionsTotal} ações` : ""}
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {showNew && (
        <Sheet title="Novo projeto de melhoria" onClose={() => setShowNew(false)}>
          <div className="auth-form">
            <div className="field">
              <label htmlFor="proj-title">Nome do projeto</label>
              <input id="proj-title" className="input" autoFocus maxLength={120} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex.: Reduzir gasto com delivery" />
            </div>
            <div className="field">
              <label htmlFor="proj-cat">Gasto em foco (opcional)</label>
              <select id="proj-cat" className="select" value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
                <option value="">Todos os gastos</option>
                {expenseCats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <button className="btn btn--primary btn--block" onClick={create} disabled={!title.trim()}>Criar e começar</button>
          </div>
        </Sheet>
      )}
    </div>
  );
}
