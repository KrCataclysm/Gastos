import { LogOut, Moon, Sun } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { ACCENT_PRESETS, FONT_OPTIONS, useTheme } from "@/contexts/ThemeContext";
import { useNavigate } from "react-router-dom";

export function SettingsPage() {
  const { theme, setMode, setAccentColor, setFontFamily, setRadius } = useTheme();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  async function handleSignOut() {
    await signOut();
    navigate("/login", { replace: true });
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div className="topbar">
        <div className="topbar__title">Configurações</div>
      </div>

      <div className="card">
        <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 12 }}>Conta</h3>
        <div className="text-muted" style={{ fontSize: 14 }}>{user?.email}</div>
      </div>

      <div className="card">
        <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 14 }}>Aparência</h3>

        <div className="field" style={{ marginBottom: 16 }}>
          <label>Modo</label>
          <div style={{ display: "flex", gap: 8 }}>
            <button className={`chip${theme.mode === "dark" ? " chip--active" : ""}`} style={{ flex: 1, justifyContent: "center" }} onClick={() => setMode("dark")}>
              <Moon size={14} /> Escuro
            </button>
            <button className={`chip${theme.mode === "light" ? " chip--active" : ""}`} style={{ flex: 1, justifyContent: "center" }} onClick={() => setMode("light")}>
              <Sun size={14} /> Claro
            </button>
          </div>
        </div>

        <div className="field" style={{ marginBottom: 16 }}>
          <label>Cor de destaque</label>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {ACCENT_PRESETS.map((c) => (
              <button
                key={c}
                onClick={() => setAccentColor(c)}
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: "50%",
                  background: c,
                  border: theme.accentColor === c ? "3px solid var(--color-text)" : "2px solid transparent",
                  cursor: "pointer",
                }}
                aria-label={c}
              />
            ))}
          </div>
        </div>

        <div className="field" style={{ marginBottom: 16 }}>
          <label>Fonte</label>
          <select className="select" value={theme.fontFamily} onChange={(e) => setFontFamily(e.target.value as typeof theme.fontFamily)}>
            {FONT_OPTIONS.map((f) => (
              <option key={f.value} value={f.value}>
                {f.label}
              </option>
            ))}
          </select>
        </div>

        <div className="field">
          <label>Arredondamento das bordas ({theme.radius}px)</label>
          <input
            type="range"
            min={4}
            max={28}
            value={theme.radius}
            onChange={(e) => setRadius(Number(e.target.value))}
          />
        </div>
      </div>

      <button className="btn btn--danger btn--block" onClick={handleSignOut}>
        <LogOut size={16} /> Sair da conta
      </button>
    </div>
  );
}
