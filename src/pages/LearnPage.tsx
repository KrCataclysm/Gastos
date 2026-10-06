import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronDown, Search } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { LEARN, LEARN_GROUPS, type LearnGroup } from "@/lib/learn";

const norm = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

export function LearnPage() {
  const [group, setGroup] = useState<LearnGroup | "all">("all");
  const [q, setQ] = useState("");
  const [open, setOpen] = useState<string | null>(null);

  const items = useMemo(() => {
    const needle = norm(q.trim());
    return LEARN.filter((i) => (group === "all" || i.group === group) && (!needle || norm(`${i.name} ${i.summary} ${i.how}`).includes(needle)));
  }, [group, q]);

  return (
    <div className="stack">
      <PageHeader eyebrow="Gestão da Qualidade" title="Aprender" />
      <p className="text-muted" style={{ fontSize: 14, lineHeight: 1.6, maxWidth: "64ch" }}>
        Cada ferramenta da disciplina, explicada com exemplo de dinheiro de estudante e com atalho para onde ela vive no app.
      </p>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center" }}>
        <div className="seg" role="group" aria-label="Filtrar por etapa">
          <button type="button" aria-pressed={group === "all"} onClick={() => setGroup("all")}>Todas</button>
          {(Object.keys(LEARN_GROUPS) as LearnGroup[]).map((g) => <button key={g} type="button" aria-pressed={group === g} onClick={() => setGroup(g)}>{LEARN_GROUPS[g]}</button>)}
        </div>
        <div style={{ position: "relative", flex: "1 1 220px", maxWidth: 340 }}>
          <label htmlFor="learn-q" className="sr-only">Buscar ferramenta</label>
          <Search size={16} aria-hidden style={{ position: "absolute", left: 13, top: 13, color: "var(--color-text-muted)" }} />
          <input id="learn-q" className="input" style={{ paddingLeft: 38 }} placeholder="Buscar ferramenta…" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
      </div>

      {items.length === 0 ? (
        <section className="card"><p className="text-muted" style={{ fontSize: 14 }}>Nenhuma ferramenta com esse termo.</p></section>
      ) : (
        <div className="grid grid--2 stagger">
          {items.map((i, n) => {
            const expanded = open === i.id;
            return (
              <article key={i.id} className="card learn" style={{ ["--i" as string]: n }}>
                <div className="eyebrow">{LEARN_GROUPS[i.group]}</div>
                <h2 style={{ fontSize: "1.1rem", fontWeight: 600, margin: "6px 0" }}>{i.name}</h2>
                <p style={{ fontSize: 14, lineHeight: 1.55 }}>{i.summary}</p>
                <button type="button" className="learn__toggle" aria-expanded={expanded} aria-controls={`learn-${i.id}`} onClick={() => setOpen(expanded ? null : i.id)}>
                  {expanded ? "Fechar" : "Como funciona"} <ChevronDown size={15} aria-hidden style={{ transform: expanded ? "rotate(180deg)" : undefined, transition: "transform 0.2s" }} />
                </button>
                <div id={`learn-${i.id}`} className="learn__body" hidden={!expanded}>
                  <h3 className="eyebrow" style={{ margin: "12px 0 4px" }}>Como usar</h3>
                  <p style={{ fontSize: 13.5, lineHeight: 1.6 }}>{i.how}</p>
                  <h3 className="eyebrow" style={{ margin: "12px 0 4px" }}>Exemplo</h3>
                  <p style={{ fontSize: 13.5, lineHeight: 1.6 }} className="text-muted">{i.example}</p>
                  {i.where && <Link to={i.where.to} className="btn btn--secondary btn--sm" style={{ marginTop: 14 }}>{i.where.label}</Link>}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
