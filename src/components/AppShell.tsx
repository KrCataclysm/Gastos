import { BarChart3, Home, List, MoreHorizontal, Plus, PiggyBank, Repeat, Settings, Target, User, Wallet2, Moon, Sun, LogOut, type LucideIcon } from "lucide-react";
import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";
import type { Transaction } from "../domain/types";
import { useTheme } from "../theme/ThemeProvider";
import { Avatar } from "./Avatar";
import { QuickAdd } from "./QuickAdd";
import { useProfile } from "../data/api";

interface QuickAddApi {
  openNew: () => void;
  openEdit: (t: Transaction) => void;
  theme: "light" | "dark";
  toggleTheme: () => void;
}
const QA = createContext<QuickAddApi | null>(null);
export const useQuickAdd = (): QuickAddApi => {
  const v = useContext(QA);
  if (!v) throw new Error("useQuickAdd fora do AppShell");
  return v;
};

const MAIN: { to: string; label: string; icon: LucideIcon }[] = [
  { to: "/", label: "Início", icon: Home },
  { to: "/lancamentos", label: "Extrato", icon: List },
  { to: "/analises", label: "Análises", icon: BarChart3 },
  { to: "/orcamento", label: "Orçamento", icon: Wallet2 },
];
const SECONDARY: { to: string; label: string; icon: LucideIcon }[] = [
  { to: "/metas", label: "Metas", icon: Target },
  { to: "/fixas", label: "Contas fixas", icon: Repeat },
  { to: "/contas", label: "Contas e categorias", icon: PiggyBank },
  { to: "/perfil", label: "Perfil", icon: User },
  { to: "/configuracoes", label: "Configurações", icon: Settings },
];

export function AppShell() {
  const { signOut } = useAuth();
  const { isDark, quickToggle } = useTheme();
  const theme: "light" | "dark" = isDark ? "dark" : "light";
  const toggleTheme = quickToggle;
  const profile = useProfile();
  const [sheet, setSheet] = useState<{ open: boolean; editing: Transaction | null }>({ open: false, editing: null });
  const { pathname } = useLocation();
  const openNew = useCallback(() => setSheet({ open: true, editing: null }), []);
  const openEdit = useCallback((t: Transaction) => setSheet({ open: true, editing: t }), []);
  const api = useMemo(() => ({ openNew, openEdit, theme, toggleTheme }), [openNew, openEdit, theme, toggleTheme]);
  const moreActive = SECONDARY.some((s) => pathname.startsWith(s.to)) || pathname === "/mais";

  return (
    <QA.Provider value={api}>
      <a href="#conteudo" className="skip-link">Pular para o conteúdo</a>
      <div className="app">
        <aside className="sidebar" aria-label="Navegação principal">
          <div className="brand"><span className="brand-mark"><Wallet2 size={18} /></span>Gastos</div>
          <NavLink to="/perfil" className="side-link" style={{ marginBottom: 8 }}><Avatar name={profile.data?.display_name ?? ""} size={28} /><span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{profile.data?.display_name ?? "Meu perfil"}</span></NavLink>
          {[...MAIN, ...SECONDARY].map((l) => (
            <NavLink key={l.to} to={l.to} end={l.to === "/"} className="side-link"><l.icon aria-hidden />{l.label}</NavLink>
          ))}
          <span className="spacer" />
          <button type="button" className="side-link" onClick={toggleTheme}>{theme === "dark" ? <Sun aria-hidden /> : <Moon aria-hidden />}{theme === "dark" ? "Tema claro" : "Tema escuro"}</button>
          <button type="button" className="side-link" onClick={() => void signOut()}><LogOut aria-hidden />Sair</button>
        </aside>
        <main className="content" id="conteudo" tabIndex={-1}><Outlet /></main>
        <nav className="bottom-nav" aria-label="Navegação principal">
          {MAIN.map((l) => (
            <NavLink key={l.to} to={l.to} end={l.to === "/"} className="nav-link"><l.icon aria-hidden />{l.label}</NavLink>
          ))}
          <NavLink to="/mais" className="nav-link" aria-current={moreActive ? "page" : undefined}><MoreHorizontal aria-hidden />Mais</NavLink>
        </nav>
        <button type="button" className="fab no-print" onClick={openNew} aria-label="Novo lançamento"><Plus aria-hidden />Lançar</button>
      </div>
      <QuickAdd open={sheet.open} editing={sheet.editing} onClose={() => setSheet((s) => ({ ...s, open: false }))} />
    </QA.Provider>
  );
}

export const SECONDARY_LINKS = SECONDARY;
