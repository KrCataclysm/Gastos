import { Link } from "react-router-dom";
import { ChevronRight, Landmark, LogOut, Settings, Tags } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { SyncBadge } from "@/components/layout/SyncBadge";

const ITEMS = [
  { to: "/categorias", label: "Categorias", icon: Tags },
  { to: "/contas", label: "Contas e carteiras", icon: Landmark },
  { to: "/configuracoes", label: "Configurações", icon: Settings },
];

export function MorePage() {
  const { signOut, user } = useAuth();
  const navigate = useNavigate();

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div className="topbar">
        <div className="topbar__title">Mais</div>
        <SyncBadge />
      </div>

      <div className="card" style={{ padding: 8 }}>
        {ITEMS.map((item) => (
          <Link
            key={item.to}
            to={item.to}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "14px 10px",
              textDecoration: "none",
              color: "var(--color-text)",
              borderBottom: "1px solid var(--color-border)",
            }}
          >
            <item.icon size={18} />
            <span style={{ flex: 1, fontWeight: 600, fontSize: 14 }}>{item.label}</span>
            <ChevronRight size={16} color="var(--color-text-muted)" />
          </Link>
        ))}
      </div>

      <div className="card">
        <div className="text-muted" style={{ fontSize: 13 }}>Conectado como</div>
        <div style={{ fontWeight: 600 }}>{user?.email}</div>
      </div>

      <button
        className="btn btn--danger btn--block"
        onClick={async () => {
          await signOut();
          navigate("/login", { replace: true });
        }}
      >
        <LogOut size={16} /> Sair da conta
      </button>
    </div>
  );
}
