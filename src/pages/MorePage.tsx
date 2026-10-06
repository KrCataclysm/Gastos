import { Link, useNavigate } from "react-router-dom";
import { ChevronRight, FolderKanban, Flag, Landmark, LogOut, Settings, Tags, UserRound, Wrench, type LucideIcon } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { SyncBadge } from "@/components/layout/SyncBadge";
import { PageHeader } from "@/components/ui/PageHeader";

const GROUPS: { label: string; items: { to: string; label: string; hint: string; icon: LucideIcon }[] }[] = [
  { label: "Objetivos e análise", items: [
    { to: "/metas", label: "Metas", hint: "Quanto guardar e se você está no prumo do prazo", icon: Flag },
    { to: "/projetos", label: "Projetos de melhoria", hint: "DMAIC guiado e check-up 5S das suas finanças", icon: FolderKanban },
    { to: "/ferramentas", label: "Ferramentas", hint: "Pareto, Ishikawa, PDCA, 5S, Gantt e mais", icon: Wrench },
  ] },
  { label: "Organização", items: [
    { to: "/categorias", label: "Categorias", hint: "Despesas e receitas, fixas e variáveis", icon: Tags },
    { to: "/contas", label: "Contas e carteiras", hint: "Saldos, cartões e faturas", icon: Landmark },
  ] },
  { label: "Conta", items: [
    { to: "/perfil", label: "Perfil", hint: "Dados acadêmicos, senha e backup", icon: UserRound },
    { to: "/configuracoes", label: "Configurações", hint: "Temas, fonte e acessibilidade", icon: Settings },
  ] },
];

export function MorePage() {
  const { signOut, user } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="stack">
      <PageHeader eyebrow="Menu" title="Mais">
        <SyncBadge />
      </PageHeader>

      {GROUPS.map((g) => (
        <section key={g.label} aria-label={g.label}>
          <div className="eyebrow" style={{ margin: "0 4px 8px" }}>{g.label}</div>
          <div className="card card--flush">
            {g.items.map((item) => (
              <Link key={item.to} to={item.to} className="menu-row">
                <span className="menu-row__icon"><item.icon size={17} strokeWidth={1.7} aria-hidden /></span>
                <span className="menu-row__text">{item.label}<span className="menu-row__hint">{item.hint}</span></span>
                <ChevronRight size={16} color="var(--color-text-muted)" aria-hidden />
              </Link>
            ))}
          </div>
        </section>
      ))}

      <section className="card">
        <div className="eyebrow">Conectado como</div>
        <div style={{ fontWeight: 500, marginTop: 4, overflowWrap: "anywhere" }}>{user?.email}</div>
      </section>

      <button className="btn btn--danger btn--block" onClick={async () => { await signOut(); navigate("/login", { replace: true }); }}>
        <LogOut size={16} /> Sair da conta
      </button>
    </div>
  );
}
