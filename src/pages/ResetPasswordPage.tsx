import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { KeyRound } from "lucide-react";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { useAuth } from "@/contexts/AuthContext";

export function ResetPasswordPage() {
  const { updatePassword } = useAuth();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (password !== confirmPassword) {
      setError("As senhas não coincidem.");
      return;
    }
    if (password.length < 6) {
      setError("A senha precisa ter pelo menos 6 caracteres.");
      return;
    }
    setLoading(true);
    const result = await updatePassword(password);
    setLoading(false);
    if (result.error) setError(result.error);
    else navigate("/", { replace: true });
  }

  return (
    <AuthLayout>
      <div className="auth-card">
        <div className="auth-card__brand">
          <div className="auth-card__brand-mark">G</div>
          Gastos
        </div>
        <div>
          <h1>Defina uma nova senha</h1>
          <p className="auth-card__sub">Escolha uma senha forte para proteger sua conta.</p>
        </div>
        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="password">Nova senha</label>
            <input
              id="password"
              className="input"
              type="password"
              autoComplete="new-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mínimo 6 caracteres"
            />
          </div>
          <div className="field">
            <label htmlFor="confirm">Confirmar nova senha</label>
            <input
              id="confirm"
              className="input"
              type="password"
              autoComplete="new-password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Repita a senha"
            />
          </div>
          {error && <div className="error-text">{error}</div>}
          <button className="btn btn--primary btn--block" type="submit" disabled={loading}>
            <KeyRound size={18} /> {loading ? "Salvando…" : "Salvar nova senha"}
          </button>
        </form>
      </div>
    </AuthLayout>
  );
}
