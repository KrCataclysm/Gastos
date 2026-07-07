import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { MailCheck, SendHorizontal } from "lucide-react";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { useAuth } from "@/contexts/AuthContext";

export function ForgotPasswordPage() {
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const result = await resetPassword(email);
    setLoading(false);
    if (result.error) setError(result.error);
    else setSent(true);
  }

  return (
    <AuthLayout>
      <div className="auth-card">
        <div className="auth-card__brand">
          <div className="auth-card__brand-mark">G</div>
          Gastos
        </div>
        {sent ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 12, alignItems: "flex-start" }}>
            <MailCheck size={32} color="var(--color-accent-strong)" />
            <h1>Verifique seu e-mail</h1>
            <p className="auth-card__sub">
              Se <b>{email}</b> tiver uma conta, enviamos um link para redefinir a senha.
            </p>
          </div>
        ) : (
          <>
            <div>
              <h1>Recuperar senha</h1>
              <p className="auth-card__sub">Enviaremos um link de redefinição para seu e-mail.</p>
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
              {error && <div className="error-text">{error}</div>}
              <button className="btn btn--primary btn--block" type="submit" disabled={loading}>
                <SendHorizontal size={18} /> {loading ? "Enviando…" : "Enviar link"}
              </button>
            </form>
          </>
        )}
        <div className="auth-footer-link">
          <Link to="/login">Voltar para o login</Link>
        </div>
      </div>
    </AuthLayout>
  );
}
