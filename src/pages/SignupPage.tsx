import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { MailCheck, UserPlus } from "lucide-react";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { useAuth } from "@/contexts/AuthContext";

export function SignupPage() {
  const { signUp } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

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
    const result = await signUp(email, password, name);
    setLoading(false);
    if (result.error) setError(result.error);
    else setSent(true);
  }

  if (sent) {
    return (
      <AuthLayout>
        <div className="auth-card">
          <div className="auth-card__brand">
            <div className="auth-card__brand-mark">G</div>
            Gastos
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12, alignItems: "flex-start" }}>
            <MailCheck size={32} color="var(--color-accent-strong)" />
            <h1>Confirme seu e-mail</h1>
            <p className="auth-card__sub">
              Enviamos um link de confirmação para <b>{email}</b>. Abra o e-mail e confirme para poder entrar.
            </p>
          </div>
          <Link className="btn btn--secondary btn--block" to="/login">
            Ir para o login
          </Link>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <div className="auth-card">
        <div className="auth-card__brand">
          <div className="auth-card__brand-mark">G</div>
          Gastos
        </div>
        <div>
          <h1>Criar sua conta</h1>
          <p className="auth-card__sub">Leva menos de um minuto.</p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="name">Nome</label>
            <input
              id="name"
              className="input"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Seu nome"
            />
          </div>
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
              autoComplete="new-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mínimo 6 caracteres"
            />
          </div>
          <div className="field">
            <label htmlFor="confirm">Confirmar senha</label>
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
            <UserPlus size={18} /> {loading ? "Criando conta…" : "Criar conta"}
          </button>
        </form>

        <div className="auth-footer-link">
          Já tem conta? <Link to="/login">Entrar</Link>
        </div>
      </div>
    </AuthLayout>
  );
}
