import { NavLink, Outlet } from "react-router-dom";
import { BarChart3, Flag, FolderKanban, Landmark, LayoutDashboard, MoreHorizontal, Receipt, Settings, Tags, Target, UserRound, Wrench, type LucideIcon } from "lucide-react";
import { BRAND } from "@/brand";
import { Logo } from "@/components/brand/Logo";
import { InstallPrompt } from "@/components/layout/InstallPrompt";
import { SyncBadge } from "@/components/layout/SyncBadge";
import { Avatar } from "@/components/ui/Avatar";
import { useAuth } from "@/contexts/AuthContext";
import { useData } from "@/contexts/DataContext";

interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  end?: boolean;
}

const HOME: NavItem = { to: "/", label: "Início", icon: LayoutDashboard, end: true };
const EXTRATO: NavItem = { to: "/lancamentos", label: "Lançamentos", icon: Receipt };
const ORCAMENTO: NavItem = { to: "/orcamento", label: "Orçamento", icon: Target };
const METAS: NavItem = { to: "/metas", label: "Metas", icon: Flag };
const RELATORIOS: NavItem = { to: "/relatorios", label: "Relatórios", icon: BarChart3 };
const PROJETOS: NavItem = { to: "/projetos", label: "Projetos", icon: FolderKanban };
const FERRAMENTAS: NavItem = { to: "/ferramentas", label: "Ferramentas", icon: Wrench };
const CATEGORIAS: NavItem = { to: "/categorias", label: "Categorias", icon: Tags };
const CONTAS: NavItem = { to: "/contas", label: "Contas", icon: Landmark };
const PERFIL: NavItem = { to: "/perfil", label: "Perfil", icon: UserRound };
const CONFIG: NavItem = { to: "/configuracoes", label: "Configurações", icon: Settings };

const GROUPS: { label: string; items: NavItem[] }[] = [
  { label: "Acompanhar", items: [HOME, EXTRATO, ORCAMENTO, METAS, RELATORIOS] },
  { label: "Organizar", items: [CATEGORIAS, CONTAS, PROJETOS, FERRAMENTAS] },
  { label: "Conta", items: [PERFIL, CONFIG] },
];

const BOTTOM: NavItem[] = [HOME, EXTRATO, ORCAMENTO, RELATORIOS];

const linkClass = ({ isActive }: { isActive: boolean }) => `nav-item${isActive ? " active" : ""}`;

export function AppShell() {
  const { loading } = useData();
  const { user } = useAuth();
  const name = (user?.user_metadata?.display_name as string | undefined) ?? user?.email?.split("@")[0] ?? "";

  return (
    <div className="app-shell">
      <a href="#conteudo" className="skip-link">Pular para o conteúdo</a>
      <aside className="sidebar" aria-label="Navegação principal">
        <div className="sidebar__brand"><Logo size={30} />{BRAND.name}</div>
        {GROUPS.map((g) => (
          <nav key={g.label} className="sidebar__group" aria-label={g.label}>
            <div className="eyebrow sidebar__label">{g.label}</div>
            {g.items.map((item) => (
              <NavLink key={item.to} to={item.to} end={item.end ?? false} className={linkClass}>
                <item.icon size={17} strokeWidth={1.7} aria-hidden />
                <span className="nav-item__label">{item.label}</span>
              </NavLink>
            ))}
          </nav>
        ))}
        <div className="sidebar__foot">
          <NavLink to="/perfil" className="nav-item" style={{ gap: 10 }} aria-label="Meu perfil">
            <Avatar name={name} size={28} />
            <span className="nav-item__label" style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{name || "Meu perfil"}</span>
          </NavLink>
          <div style={{ padding: "0 10px" }}><SyncBadge /></div>
        </div>
      </aside>

      <main className="app-main" id="conteudo" tabIndex={-1}>
        <InstallPrompt />
        {loading ? (
          <div className="stack">
            <div className="skeleton" style={{ height: 96 }} />
            <div className="skeleton" style={{ height: 220 }} />
            <div className="skeleton" style={{ height: 160 }} />
          </div>
        ) : (
          <Outlet />
        )}
      </main>

      <nav className="bottom-nav" aria-label="Navegação principal">
        {BOTTOM.map((item) => (
          <NavLink key={item.to} to={item.to} end={item.end ?? false} className={linkClass}>
            <item.icon size={20} strokeWidth={1.7} aria-hidden />
            <span className="nav-item__label">{item.label}</span>
          </NavLink>
        ))}
        <NavLink to="/mais" className={linkClass}>
          <MoreHorizontal size={20} strokeWidth={1.7} aria-hidden />
          <span className="nav-item__label">Mais</span>
        </NavLink>
      </nav>
    </div>
  );
}
