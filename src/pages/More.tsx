import { ChevronRight, LogOut, Moon, PiggyBank, Repeat, Sun, Target, User } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";
import { useQuickAdd } from "../components/AppShell";

const LINKS = [
  { to: "/metas", label: "Metas", desc: "Guarde para notebook, intercâmbio, formatura", icon: Target },
  { to: "/fixas", label: "Contas fixas", desc: "Mensalidade, aluguel e assinaturas", icon: Repeat },
  { to: "/contas", label: "Contas e categorias", desc: "Organize carteiras, bancos e categorias", icon: PiggyBank },
  { to: "/perfil", label: "Perfil", desc: "Dados acadêmicos, senha e backup", icon: User },
];

export function More() {
  const { signOut } = useAuth();
  const { theme, toggleTheme } = useQuickAdd();
  const dark = theme === "dark";
  return (
    <div className="stack">
      <div className="page-head"><h1>Mais</h1></div>
      <section className="card"><div className="list">
        {LINKS.map((l) => <Link key={l.to} to={l.to} className="item" style={{ textDecoration: "none", color: "inherit" }}><span className="badge" style={{ background: "var(--accent)" }}><l.icon aria-hidden /></span><span className="main"><span className="title" style={{ display: "block" }}>{l.label}</span><span className="meta">{l.desc}</span></span><ChevronRight aria-hidden className="muted" /></Link>)}
        <button type="button" className="item" onClick={toggleTheme}><span className="badge" style={{ background: "#475569" }}>{dark ? <Sun aria-hidden /> : <Moon aria-hidden />}</span><span className="main"><span className="title" style={{ display: "block" }}>{dark ? "Tema claro" : "Tema escuro"}</span></span></button>
        <button type="button" className="item" onClick={() => void signOut()}><span className="badge" style={{ background: "var(--expense)" }}><LogOut aria-hidden /></span><span className="main"><span className="title" style={{ display: "block" }}>Sair</span></span></button>
      </div></section>
    </div>
  );
}
