import { useState, type FormEvent } from "react";
import { KeyRound, LogOut, Moon, Pipette, RotateCcw, Sun, UserRound } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { ACCENT_PRESETS, FONT_OPTIONS, useTheme } from "@/contexts/ThemeContext";
import { useNavigate } from "react-router-dom";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { useToast } from "@/components/ui/Toast";

export function SettingsPage() {
  const { theme, setMode, setAccentColor, setFontFamily, setRadius, setBgColor, setPanelColor, resetBgColor, resetPanelColor } = useTheme();
  const { user, signOut, updatePassword, updateDisplayName } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const [nickname, setNickname] = useState((user?.user_metadata?.display_name as string | undefined) ?? "");
  const [savingNickname, setSavingNickname] = useState(false);

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [savingPassword, setSavingPassword] = useState(false);

  async function handleSignOut() {
    await signOut();
    navigate("/login", { replace: true });
  }

  async function handleSaveNickname(e: FormEvent) {
    e.preventDefault();
    setSavingNickname(true);
    const result = await updateDisplayName(nickname.trim());
    setSavingNickname(false);
    if (result.error) {
      toast.show(result.error, "error");
      return;
    }
    toast.show("Apelido atualizado.", "success");
  }

  async function handleChangePassword(e: FormEvent) {
    e.preventDefault();
    setPasswordError(null);
    if (newPassword !== confirmPassword) {
      setPasswordError("As senhas não coincidem.");
      return;
    }
    if (newPassword.length < 6) {
      setPasswordError("A senha precisa ter pelo menos 6 caracteres.");
      return;
    }
    setSavingPassword(true);
    const result = await updatePassword(newPassword);
    setSavingPassword(false);
    if (result.error) {
      setPasswordError(result.error);
      return;
    }
    setNewPassword("");
    setConfirmPassword("");
    toast.show("Senha alterada com sucesso.", "success");
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div className="topbar">
        <div className="topbar__title">Configurações</div>
      </div>

      <div className="card">
        <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 12 }}>Conta</h3>
        <div className="text-muted" style={{ fontSize: 14, marginBottom: 14 }}>{user?.email}</div>
        <form className="auth-form" onSubmit={handleSaveNickname}>
          <div className="field">
            <label htmlFor="nickname">Apelido</label>
            <input
              id="nickname"
              className="input"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="Como quer ser chamado(a)?"
              maxLength={60}
            />
          </div>
          <button className="btn btn--secondary btn--block" type="submit" disabled={savingNickname}>
            <UserRound size={16} /> {savingNickname ? "Salvando…" : "Salvar apelido"}
          </button>
        </form>
      </div>

      <div className="card">
        <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 14 }}>Alterar senha</h3>
        <form className="auth-form" onSubmit={handleChangePassword}>
          <div className="field">
            <label htmlFor="new-password">Nova senha</label>
            <PasswordInput
              id="new-password"
              autoComplete="new-password"
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Mínimo 6 caracteres"
            />
          </div>
          <div className="field">
            <label htmlFor="confirm-password">Confirmar nova senha</label>
            <PasswordInput
              id="confirm-password"
              autoComplete="new-password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Repita a senha"
            />
          </div>
          {passwordError && <div className="error-text">{passwordError}</div>}
          <button className="btn btn--primary btn--block" type="submit" disabled={savingPassword}>
            <KeyRound size={16} /> {savingPassword ? "Salvando…" : "Salvar nova senha"}
          </button>
        </form>
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
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
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
            <label className="color-picker" title="Escolher outra cor" aria-label="Cor de destaque personalizada">
              <input type="color" value={theme.accentColor} onChange={(e) => setAccentColor(e.target.value)} />
              <Pipette size={14} className="color-picker__icon" />
            </label>
          </div>
        </div>

        <div className="field" style={{ marginBottom: 16 }}>
          <label>Cor de fundo</label>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <label className="color-picker" title="Escolher cor de fundo" aria-label="Cor de fundo">
              <input type="color" value={theme.bgColor} onChange={(e) => setBgColor(e.target.value)} />
            </label>
            <span className="text-muted" style={{ fontSize: 13, flex: 1 }}>{theme.bgColor}</span>
            <button type="button" className="chip" onClick={resetBgColor} title="Restaurar padrão">
              <RotateCcw size={14} /> Padrão
            </button>
          </div>
        </div>

        <div className="field" style={{ marginBottom: 16 }}>
          <label>Cor dos painéis</label>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <label className="color-picker" title="Escolher cor dos painéis" aria-label="Cor dos painéis">
              <input type="color" value={theme.panelColor} onChange={(e) => setPanelColor(e.target.value)} />
            </label>
            <span className="text-muted" style={{ fontSize: 13, flex: 1 }}>{theme.panelColor}</span>
            <button type="button" className="chip" onClick={resetPanelColor} title="Restaurar padrão">
              <RotateCcw size={14} /> Padrão
            </button>
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
