import { Wallet2 } from "lucide-react";
import { useState, type FormEvent } from "react";
import { Navigate } from "react-router-dom";
import { z } from "zod";
import { useAuth } from "../auth/AuthProvider";
import { TextField } from "../components/Field";
import { Banner } from "../components/ui";
import { supabase } from "../lib/supabase";
import { zodResolverLite } from "../lib/validate";

type Mode = "login" | "signup" | "forgot" | "reset";

const email = z.string().trim().toLowerCase().email("E-mail inválido.");
const password = z.string().min(8, "Use ao menos 8 caracteres.").max(72, "Máximo de 72 caracteres.");
const schemas: Record<Mode, z.ZodType> = {
  login: z.object({ email, password: z.string().min(1, "Informe a senha.") }),
  signup: z.object({ name: z.string().trim().min(2, "Informe seu nome.").max(80), email, password }),
  forgot: z.object({ email }),
  reset: z.object({ password }),
};

function friendly(message: string): string {
  const m = message.toLowerCase();
  if (m.includes("invalid login")) return "E-mail ou senha incorretos.";
  if (m.includes("email not confirmed")) return "Confirme seu e-mail antes de entrar (veja a caixa de entrada e o spam).";
  if (m.includes("already registered")) return "Este e-mail já tem cadastro. Tente entrar.";
  if (m.includes("rate limit") || m.includes("too many")) return "Muitas tentativas. Aguarde alguns minutos.";
  if (m.includes("weak") || m.includes("pwned") || m.includes("compromised")) return "Essa senha é fraca ou já vazou em algum site. Escolha outra.";
  if (m.includes("failed to fetch") || m.includes("network")) return "Sem conexão com o servidor. Verifique sua internet.";
  return "Não foi possível concluir. Tente novamente.";
}

export function Login() {
  const { user, recovering, loading } = useAuth();
  const [mode, setMode] = useState<Mode>("login");
  const [name, setName] = useState("");
  const [mail, setMail] = useState("");
  const [pass, setPass] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [notice, setNotice] = useState<{ tone: "good" | "danger"; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  if (loading) return null;
  if (user && !recovering) return <Navigate to="/" replace />;
  const active: Mode = recovering ? "reset" : mode;
  const redirectTo = `${location.origin}/Gastos/`;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setNotice(null);
    const { data, errors: errs } = zodResolverLite(schemas[active], { name, email: mail, password: pass });
    setErrors(errs);
    if (!data) return;
    const v = data as { name: string; email: string; password: string };
    setBusy(true);
    try {
      if (active === "login") {
        const r = await supabase.auth.signInWithPassword({ email: v.email, password: v.password });
        if (r.error) throw r.error;
      } else if (active === "signup") {
        const r = await supabase.auth.signUp({ email: v.email, password: v.password, options: { data: { display_name: v.name }, emailRedirectTo: redirectTo } });
        if (r.error) throw r.error;
        if (!r.data.session) setNotice({ tone: "good", text: "Cadastro criado! Enviamos um link de confirmação para o seu e-mail." });
      } else if (active === "forgot") {
        const r = await supabase.auth.resetPasswordForEmail(v.email, { redirectTo });
        if (r.error) throw r.error;
        setNotice({ tone: "good", text: "Se este e-mail tiver cadastro, você receberá um link para redefinir a senha." });
      } else {
        const r = await supabase.auth.updateUser({ password: v.password });
        if (r.error) throw r.error;
        await supabase.auth.signOut();
        setMode("login");
        setPass("");
        setNotice({ tone: "good", text: "Senha alterada. Entre com a nova senha." });
      }
    } catch (err) {
      setNotice({ tone: "danger", text: friendly(err instanceof Error ? err.message : "") });
    } finally {
      setBusy(false);
    }
  };

  const title = { login: "Entrar", signup: "Criar conta", forgot: "Recuperar senha", reset: "Nova senha" }[active];
  return (
    <div className="auth-wrap">
      <form className="card auth-card" onSubmit={submit} noValidate>
        <div className="brand"><span className="brand-mark"><Wallet2 size={18} /></span>Gastos</div>
        <div><h1>{title}</h1><p className="muted">Seu controle financeiro de faculdade, sem planilha.</p></div>
        {notice && <Banner tone={notice.tone}>{notice.text}</Banner>}
        {active === "signup" && <TextField label="Nome" value={name} onChange={(e) => setName(e.target.value)} error={errors.name} autoComplete="name" />}
        {active !== "reset" && <TextField label="E-mail" type="email" value={mail} onChange={(e) => setMail(e.target.value)} error={errors.email} autoComplete="email" inputMode="email" />}
        {active !== "forgot" && <TextField label={active === "reset" ? "Nova senha" : "Senha"} type="password" value={pass} onChange={(e) => setPass(e.target.value)} error={errors.password} autoComplete={active === "login" ? "current-password" : "new-password"} hint={active === "login" ? undefined : "Mínimo de 8 caracteres."} />}
        <button className="btn primary" type="submit" disabled={busy}>{busy ? "Aguarde…" : title}</button>
        {!recovering && (
          <div className="row between wrap">
            {active === "login" ? (
              <>
                <button type="button" className="btn ghost sm" onClick={() => { setMode("signup"); setErrors({}); setNotice(null); }}>Criar conta</button>
                <button type="button" className="btn ghost sm" onClick={() => { setMode("forgot"); setErrors({}); setNotice(null); }}>Esqueci a senha</button>
              </>
            ) : (
              <button type="button" className="btn ghost sm" onClick={() => { setMode("login"); setErrors({}); setNotice(null); }}>Voltar para entrar</button>
            )}
          </div>
        )}
      </form>
    </div>
  );
}
