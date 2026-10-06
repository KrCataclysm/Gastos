import { Download, LogOut } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { z } from "zod";
import { useAuth } from "../auth/AuthProvider";
import { TextField } from "../components/Field";
import { Avatar } from "../components/Avatar";
import { PALETTE } from "../components/Pickers";
import { useToast } from "../components/Toast";
import { useTheme } from "../theme/ThemeProvider";
import { Banner, CardTitle, Loading } from "../components/ui";
import { useAccounts, useCategories, useGoals, useProfile, useRecurring, useUpdateProfile, useAllTransactions } from "../data/api";
import { downloadText } from "../lib/csv";
import { todayISO } from "../lib/dates";
import { parseMoneyInput } from "../lib/money";
import { supabase } from "../lib/supabase";
import { zodResolverLite } from "../lib/validate";

const schema = z.object({ display_name: z.string().trim().min(1, "Informe seu nome.").max(80), institution: z.string().trim().max(120), course: z.string().trim().max(120), start: z.string(), end: z.string() }).refine((v) => !v.start || !v.end || v.end >= v.start, { path: ["end"], message: "O fim precisa ser depois do início." });
const pw = z.string().min(8, "Use ao menos 8 caracteres.").max(72);

export function Profile() {
  const { user, signOut } = useAuth(); const { prefs, update: updatePrefs } = useTheme(); const profile = useProfile(); const update = useUpdateProfile(); const toast = useToast();
  const accounts = useAccounts(); const categories = useCategories(); const goals = useGoals(); const recurring = useRecurring(); const txs = useAllTransactions();
  const [f, setF] = useState({ display_name: "", institution: "", course: "", start: "", end: "", income: "" });
  const [errors, setErrors] = useState<Record<string, string>>({}); const [pass, setPass] = useState(""); const [passErr, setPassErr] = useState("");

  useEffect(() => { const p = profile.data; if (p) setF({ display_name: p.display_name ?? "", institution: p.institution ?? "", course: p.course ?? "", start: p.semester_start ?? "", end: p.semester_end ?? "", income: p.monthly_income_goal ? String(p.monthly_income_goal).replace(".", ",") : "" }); }, [profile.data]);
  if (profile.isLoading) return <Loading />;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const { data, errors: errs } = zodResolverLite(schema, f);
    const income = f.income.trim() === "" ? null : parseMoneyInput(f.income);
    if (f.income.trim() !== "" && (income === null || income < 0)) errs.income = "Valor inválido.";
    setErrors(errs); if (!data || errs.income) return;
    try { await update.mutateAsync({ display_name: data.display_name, institution: data.institution || null, course: data.course || null, semester_start: data.start || null, semester_end: data.end || null, monthly_income_goal: income }); toast.show("Perfil atualizado."); } catch (err) { toast.error(err); }
  };
  const changePass = async (e: FormEvent) => { e.preventDefault(); const r = pw.safeParse(pass); if (!r.success) { setPassErr(r.error.issues[0]?.message ?? "Senha inválida."); return; } setPassErr(""); const res = await supabase.auth.updateUser({ password: pass }); if (res.error) toast.error(new Error("Não foi possível alterar a senha. Tente uma senha diferente.")); else { setPass(""); toast.show("Senha alterada."); } };
  const exportAll = () => {
    downloadText(`gastos-backup-${todayISO()}.json`, JSON.stringify({ exported_at: new Date().toISOString(), profile: profile.data, accounts: accounts.data, categories: categories.data, transactions: txs.data, goals: goals.data, recurring: recurring.data }, null, 2), "application/json");
  };
  const set = (k: keyof typeof f) => (e: { target: { value: string } }) => setF((s) => ({ ...s, [k]: e.target.value }));
  const hasStudentCols = profile.data ? "institution" in profile.data : false;

  return (
    <div className="stack">
      <section className="card stack">
        <div className="hero-profile"><Avatar name={f.display_name} size={72} /><div><h1>{f.display_name || "Perfil"}</h1><p className="sub muted">{user?.email}</p></div></div>
        <div className="field"><span className="lbl" id="emo-lbl">Emoji do avatar (opcional)</span>
          <div className="chips" role="group" aria-labelledby="emo-lbl">
            {["", "🎓", "📚", "☕", "🚀", "🦉", "🐱", "🌱", "💡", "⚡"].map((e) => <button key={e || "ini"} type="button" className="chip" aria-pressed={prefs.avatar.emoji === e} aria-label={e ? `Emoji ${e}` : "Usar iniciais"} onClick={() => updatePrefs((p) => ({ ...p, avatar: { ...p.avatar, emoji: e } }))}>{e || "Iniciais"}</button>)}
          </div></div>
        <div className="field"><span className="lbl" id="av-cor">Cor do avatar</span>
          <div className="chips" role="group" aria-labelledby="av-cor">
            {PALETTE.map((c) => <button key={c} type="button" className="chip" aria-pressed={prefs.avatar.color === c} aria-label={`Cor ${c}`} onClick={() => updatePrefs((p) => ({ ...p, avatar: { ...p.avatar, color: c } }))} style={{ padding: 0, width: 36, justifyContent: "center" }}><i className="dot" style={{ background: c, width: 20, height: 20 }} /></button>)}
          </div></div>
        <p className="muted" style={{ fontSize: ".82rem" }}>O avatar fica salvo neste aparelho.</p>
      </section>
      <form className="card stack" onSubmit={submit} noValidate>
        <CardTitle title="Dados acadêmicos" />
        <TextField label="Nome" value={f.display_name} onChange={set("display_name")} error={errors.display_name} maxLength={80} autoComplete="name" />
        {hasStudentCols ? <>
          <div className="form-grid two"><TextField label="Instituição" value={f.institution} onChange={set("institution")} error={errors.institution} placeholder="Ex.: UFMG" maxLength={120} /><TextField label="Curso" value={f.course} onChange={set("course")} error={errors.course} placeholder="Ex.: Engenharia" maxLength={120} /></div>
          <div className="form-grid two"><TextField label="Início do semestre" type="date" value={f.start} onChange={set("start")} /><TextField label="Fim do semestre" type="date" value={f.end} onChange={set("end")} error={errors.end} /></div>
          <TextField label="Meta de renda mensal (R$)" inputMode="decimal" value={f.income} onChange={set("income")} error={errors.income} hint="Mesada + bolsa + estágio. Aparece no Início." />
        </> : <Banner tone="info">Campos acadêmicos indisponíveis: o banco ainda não tem as colunas de perfil.</Banner>}
        <div><button className="btn primary" disabled={update.isPending}>{update.isPending ? "Salvando…" : "Salvar perfil"}</button></div>
      </form>
      <form className="card stack" onSubmit={changePass} noValidate>
        <CardTitle title="Segurança" />
        <TextField label="Nova senha" type="password" value={pass} onChange={(e) => setPass(e.target.value)} error={passErr} autoComplete="new-password" hint="Mínimo de 8 caracteres." />
        <div><button className="btn">Alterar senha</button></div>
      </form>
      <section className="card stack">
        <CardTitle title="Seus dados" />
        <p className="muted">Baixe uma cópia completa (JSON) de tudo que você registrou. Seus dados são privados e só você consegue acessá-los.</p>
        <div className="row wrap"><button className="btn" onClick={exportAll} disabled={txs.isLoading}><Download aria-hidden />Exportar backup</button><button className="btn danger" onClick={() => void signOut()}><LogOut aria-hidden />Sair da conta</button></div>
      </section>
    </div>
  );
}
