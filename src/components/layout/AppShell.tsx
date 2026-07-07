import { NavLink, Outlet } from "react-router-dom";
import {
  LayoutDashboard,
  Landmark,
  MoreHorizontal,
  PieChart,
  Receipt,
  Settings,
  Tags,
  Target,
  Trophy,
  Wrench,
  type LucideIcon,
} from "lucide-react";

interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  end?: boolean;
}
import { InstallPrompt } from "@/components/layout/InstallPrompt";
import { SyncBadge } from "@/components/layout/SyncBadge";
import { useData } from "@/contexts/DataContext";

const PRIMARY_NAV: NavItem[] = [
  { to: "/", label: "Início", icon: LayoutDashboard, end: true },
  { to: "/lancamentos", label: "Lançamentos", icon: Receipt },
  { to: "/orcamento", label: "Orçamento", icon: Target },
  { to: "/metas", label: "Metas", icon: Trophy },
  { to: "/relatorios", label: "Relatórios", icon: PieChart },
  { to: "/ferramentas", label: "Ferramentas", icon: Wrench },
];

const SECONDARY_NAV: NavItem[] = [
  { to: "/categorias", label: "Categorias", icon: Tags },
  { to: "/contas", label: "Contas", icon: Landmark },
  { to: "/configuracoes", label: "Configurações", icon: Settings },
];

export function AppShell() {
  const { loading } = useData();

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar__brand">Gastos</div>
        {[...PRIMARY_NAV, ...SECONDARY_NAV].map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end ?? false}
            className={({ isActive }) => `nav-item${isActive ? " active" : ""}`}
          >
            <item.icon size={18} />
            <span className="nav-item__label">{item.label}</span>
          </NavLink>
        ))}
        <div style={{ marginTop: "auto", paddingTop: 16 }}>
          <SyncBadge />
        </div>
      </aside>

      <main className="app-main">
        <InstallPrompt />
        {loading ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div className="skeleton" style={{ height: 120 }} />
            <div className="skeleton" style={{ height: 220 }} />
            <div className="skeleton" style={{ height: 160 }} />
          </div>
        ) : (
          <Outlet />
        )}
      </main>

      <nav className="bottom-nav">
        {PRIMARY_NAV.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) => `nav-item${isActive ? " active" : ""}`}
          >
            <item.icon size={20} />
            <span className="nav-item__label">{item.label}</span>
          </NavLink>
        ))}
        <NavLink to="/mais" className={({ isActive }) => `nav-item${isActive ? " active" : ""}`}>
          <MoreHorizontal size={20} />
          <span className="nav-item__label">Mais</span>
        </NavLink>
      </nav>
    </div>
  );
}
