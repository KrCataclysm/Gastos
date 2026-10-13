import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { MailCheck, UserPlus } from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { PasswordStrength } from "@/components/ui/PasswordStrength";
import { checkPassword } from "@/lib/password";
import { useAuth } from "@/contexts/AuthContext";
import { BRAND } from "@/brand";

export function SignupPage() {
  const { signUp } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [consent, setConsent] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (password !== confirmPassword) {
      setError("As senhas não coincidem.");
      return;
    }
    const check = checkPassword(password, email);
    if (check.problem) {
      setError(check.problem);
      return;
    }
    if (!consent) {
      setError("Para criar a conta, confirme que leu o aviso de privacidade.");
      return;
    }
    setLoading(true);
    const result = await signUp(email, password, name);
    setLoading(false);
    if (result.error) setError(result.error);
    else if (result.needsConfirmation) setSent(true);
  }

  if (sent) {
    return (
      <AuthLayout>
        <div className="auth-card">
          <div className="auth-card__brand">
            <Logo size={36} />
            {BRAND.name}
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
          <Logo size={36} />
          {BRAND.name}
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
              autoComplete="username"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="voce@email.com"
            />
          </div>
          <div className="field">
            <label htmlFor="password">Senha</label>
            <PasswordInput
              id="password"
              autoComplete="new-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mínimo 10 caracteres"
            />
            <PasswordStrength password={password} email={email} />
          </div>
          <div className="field">
            <label htmlFor="confirm">Confirmar senha</label>
            <PasswordInput
              id="confirm"
              autoComplete="new-password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Repita a senha"
            />
          </div>
          <label className="consent">
            <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
            <span>Li e concordo com o <Link to="/privacidade" target="_blank">aviso de privacidade</Link>. Meus dados ficam só comigo e eu posso exportar ou apagar tudo quando quiser.</span>
          </label>
          {error && <div className="error-text" role="alert">{error}</div>}
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
