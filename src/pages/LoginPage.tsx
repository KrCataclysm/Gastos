import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { LogIn } from "lucide-react";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { useAuth } from "@/contexts/AuthContext";

export function LoginPage() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const result = await signIn(email, password);
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
          <h1>Bem-vindo de volta</h1>
          <p className="auth-card__sub">Entre para continuar controlando suas finanças.</p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="email">E-mail</label>
            <input
              id="email"
              className="input"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="voce@email.com"
            />
          </div>
          <div className="field">
            <label htmlFor="password">Senha</label>
            <input
              id="password"
              className="input"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>
          {error && <div className="error-text">{error}</div>}
          <div style={{ textAlign: "right" }}>
            <Link className="link" to="/esqueci-senha">
              Esqueci minha senha
            </Link>
          </div>
          <button className="btn btn--primary btn--block" type="submit" disabled={loading}>
            <LogIn size={18} /> {loading ? "Entrando…" : "Entrar"}
          </button>
        </form>

        <div className="auth-footer-link">
          Ainda não tem conta? <Link to="/cadastro">Criar conta</Link>
        </div>
      </div>
    </AuthLayout>
  );
}
