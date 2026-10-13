import { useEffect, useState, type FormEvent } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { useNavigate } from "react-router-dom";
import { Download, KeyRound, LogOut, Save, ShieldCheck, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import { PasswordStrength } from "@/components/ui/PasswordStrength";
import { checkPassword } from "@/lib/password";
import { getIdleMinutes, IDLE_OPTIONS, setIdleMinutes } from "@/lib/idle";
import { ACCOUNT_DELETION_ENABLED } from "@/brand";
import { useAuth } from "@/contexts/AuthContext";
import { useData } from "@/contexts/DataContext";
import { Avatar } from "@/components/ui/Avatar";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { useToast } from "@/components/ui/Toast";
import { fetchAcademic, saveAcademic } from "@/lib/profile";
import { setAvatar, useAvatar } from "@/lib/avatar";
import { downloadText } from "@/lib/csv";
import { todayISO } from "@/lib/format";
import { CHOICE_COLORS } from "@/lib/palette";

const EMOJIS = ["", "🎓", "📚", "☕", "🚀", "🦉", "🐱", "🌱", "💡", "⚡"];
const COLORS = CHOICE_COLORS;

export function ProfilePage() {
  const { user, signOut, deleteAccount, updatePassword, updateDisplayName } = useAuth();
  const data = useData();
  const navigate = useNavigate();
  const toast = useToast();
  const avatar = useAvatar();

  const [nickname, setNickname] = useState((user?.user_metadata?.display_name as string | undefined) ?? "");
  const [savingNick, setSavingNick] = useState(false);

  const [institution, setInstitution] = useState("");
  const [course, setCourse] = useState("");
  const [semStart, setSemStart] = useState("");
  const [semEnd, setSemEnd] = useState("");
  const [incomeGoal, setIncomeGoal] = useState("");
  const [acadState, setAcadState] = useState<"loading" | "ready" | "unavailable">("loading");
  const [acadError, setAcadError] = useState<string | null>(null);
  const [savingAcad, setSavingAcad] = useState(false);

  const [idleMin, setIdleMin] = useState(getIdleMinutes());
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleteWord, setDeleteWord] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [savingPassword, setSavingPassword] = useState(false);

  useEffect(() => {
    if (!user) return;
    let active = true;
    fetchAcademic(user.id)
      .then((p) => {
        if (!active) return;
        setInstitution(p?.institution ?? "");
        setCourse(p?.course ?? "");
        setSemStart(p?.semester_start ?? "");
        setSemEnd(p?.semester_end ?? "");
        setIncomeGoal(p?.monthly_income_goal ? String(p.monthly_income_goal).replace(".", ",") : "");
        setAcadState("ready");
      })
      .catch(() => active && setAcadState("unavailable"));
    return () => {
      active = false;
    };
  }, [user]);

  async function handleNickname(e: FormEvent) {
    e.preventDefault();
    setSavingNick(true);
    const r = await updateDisplayName(nickname.trim());
    setSavingNick(false);
    if (r.error) toast.show(r.error, "error");
    else toast.show("Apelido atualizado.", "success");
  }

  async function handleAcademic(e: FormEvent) {
    e.preventDefault();
    if (!user) return;
    setAcadError(null);
    const goalRaw = incomeGoal.trim().replace(/\./g, "").replace(",", ".");
    const goal = goalRaw === "" ? null : Number(goalRaw);
    if (goal !== null && (!Number.isFinite(goal) || goal < 0)) return setAcadError("Meta de renda inválida.");
    if (semStart && semEnd && semEnd < semStart) return setAcadError("O fim do semestre precisa ser depois do início.");
    setSavingAcad(true);
    try {
      await saveAcademic(user.id, { institution: institution.trim() || null, course: course.trim() || null, semester_start: semStart || null, semester_end: semEnd || null, monthly_income_goal: goal });
      toast.show("Dados acadêmicos salvos.", "success");
    } catch {
      setAcadError("Não foi possível salvar agora. Verifique a conexão e tente de novo.");
    } finally {
      setSavingAcad(false);
    }
  }

  async function handlePassword(e: FormEvent) {
    e.preventDefault();
    setPasswordError(null);
    if (newPassword !== confirmPassword) return setPasswordError("As senhas não coincidem.");
    const pw = checkPassword(newPassword, user?.email ?? "");
    if (pw.problem) return setPasswordError(pw.problem);
    setSavingPassword(true);
    const r = await updatePassword(newPassword);
    setSavingPassword(false);
    if (r.error) return setPasswordError(r.error);
    setNewPassword("");
    setConfirmPassword("");
    toast.show("Senha alterada com sucesso.", "success");
  }

  async function handleDelete() {
    setDeleteError(null);
    setDeleting(true);
    const r = await deleteAccount();
    setDeleting(false);
    if (r.error) return setDeleteError(r.error);
    navigate("/login", { replace: true });
  }

  function exportBackup() {
    const payload = {
      exported_at: new Date().toISOString(),
      accounts: data.accounts,
      categories: data.categories,
      transactions: data.transactions,
      budgets: data.budgets,
      goals: data.goals,
      recurring_transactions: data.recurringTransactions,
    };
    downloadText(`gastos-backup-${todayISO()}.json`, JSON.stringify(payload, null, 2), "application/json");
  }

  return (
    <div className="stack">
      <PageHeader eyebrow="Conta" title="Perfil" />

      <div className="card">
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 16 }}>
          <Avatar name={nickname || user?.email || ""} size={72} />
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 20, fontWeight: 800, overflowWrap: "anywhere" }}>{nickname || "Seu perfil"}</div>
            <div className="text-muted" style={{ fontSize: 13, overflowWrap: "anywhere" }}>{user?.email}</div>
          </div>
        </div>
        <div className="field" style={{ marginBottom: 14 }}>
          <span id="emo" style={{ fontSize: 13, fontWeight: 600 }}>Emoji do avatar (opcional)</span>
          <div role="group" aria-labelledby="emo" style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {EMOJIS.map((e) => (
              <button key={e || "ini"} type="button" className={`chip${avatar.emoji === e ? " chip--active" : ""}`} aria-pressed={avatar.emoji === e} aria-label={e ? `Emoji ${e}` : "Usar iniciais"} onClick={() => setAvatar({ emoji: e })}>{e || "Iniciais"}</button>
            ))}
          </div>
        </div>
        <div className="field">
          <span id="avc" style={{ fontSize: 13, fontWeight: 600 }}>Cor do avatar</span>
          <div role="group" aria-labelledby="avc" style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {COLORS.map((c) => (
              <button key={c} type="button" aria-pressed={avatar.color === c} aria-label={`Cor ${c}`} onClick={() => setAvatar({ color: c })}
                style={{ width: 34, height: 34, borderRadius: "50%", background: c, border: avatar.color === c ? "3px solid var(--color-text)" : "2px solid transparent", cursor: "pointer" }} />
            ))}
          </div>
        </div>
        <p className="text-muted" style={{ fontSize: 12, marginTop: 10 }}>O avatar fica salvo neste aparelho.</p>
      </div>

      <div className="card">
        <h3 className="panel-title" style={{ marginBottom: 12 }}>Apelido</h3>
        <form className="auth-form" onSubmit={handleNickname}>
          <div className="field">
            <label htmlFor="nickname">Como quer ser chamado(a)?</label>
            <input id="nickname" className="input" value={nickname} onChange={(e) => setNickname(e.target.value)} maxLength={60} autoComplete="nickname" />
          </div>
          <button className="btn btn--secondary btn--block" type="submit" disabled={savingNick}>{savingNick ? "Salvando…" : "Salvar apelido"}</button>
        </form>
      </div>

      <div className="card">
        <h3 className="panel-title" style={{ marginBottom: 12 }}>Dados acadêmicos</h3>
        {acadState === "unavailable" ? (
          <p className="text-muted" style={{ fontSize: 13 }}>Disponível quando houver conexão com o servidor.</p>
        ) : (
          <form className="auth-form" onSubmit={handleAcademic}>
            <div className="field"><label htmlFor="inst">Instituição</label><input id="inst" className="input" value={institution} onChange={(e) => setInstitution(e.target.value)} maxLength={120} placeholder="Ex.: UFPI" disabled={acadState === "loading"} /></div>
            <div className="field"><label htmlFor="course">Curso</label><input id="course" className="input" value={course} onChange={(e) => setCourse(e.target.value)} maxLength={120} placeholder="Ex.: Engenharia de Produção" disabled={acadState === "loading"} /></div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div className="field"><label htmlFor="ss">Início do semestre</label><input id="ss" className="input" type="date" value={semStart} onChange={(e) => setSemStart(e.target.value)} disabled={acadState === "loading"} /></div>
              <div className="field"><label htmlFor="se">Fim do semestre</label><input id="se" className="input" type="date" value={semEnd} onChange={(e) => setSemEnd(e.target.value)} disabled={acadState === "loading"} /></div>
            </div>
            <div className="field"><label htmlFor="goal">Meta de renda mensal (R$)</label><input id="goal" className="input" inputMode="decimal" value={incomeGoal} onChange={(e) => setIncomeGoal(e.target.value)} placeholder="Mesada + bolsa + estágio" disabled={acadState === "loading"} /></div>
            {acadError && <div className="error-text">{acadError}</div>}
            <button className="btn btn--primary btn--block" type="submit" disabled={savingAcad || acadState === "loading"}><Save size={16} /> {savingAcad ? "Salvando…" : "Salvar dados acadêmicos"}</button>
          </form>
        )}
      </div>

      <div className="card">
        <h3 className="panel-title" style={{ marginBottom: 14 }}>Alterar senha</h3>
        <form className="auth-form" onSubmit={handlePassword}>
          <div className="field"><label htmlFor="new-password">Nova senha</label><PasswordInput id="new-password" autoComplete="new-password" required value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Mínimo 10 caracteres" /><PasswordStrength password={newPassword} email={user?.email ?? ""} /></div>
          <div className="field"><label htmlFor="confirm-password">Confirmar nova senha</label><PasswordInput id="confirm-password" autoComplete="new-password" required value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Repita a senha" /></div>
          {passwordError && <div className="error-text">{passwordError}</div>}
          <button className="btn btn--secondary btn--block" type="submit" disabled={savingPassword}><KeyRound size={16} /> {savingPassword ? "Salvando…" : "Salvar nova senha"}</button>
        </form>
      </div>

      <div className="card">
        <h3 className="panel-title" style={{ marginBottom: 8 }}>Seus dados</h3>
        <p className="text-muted" style={{ fontSize: 13, marginBottom: 12 }}>Baixe uma cópia completa (JSON) de tudo que você registrou. Seus dados são privados: só você consegue acessá-los.</p>
        <button className="btn btn--secondary btn--block" onClick={exportBackup}><Download size={16} /> Exportar backup</button>
      </div>

      <div className="card">
        <h3 className="panel-title" style={{ marginBottom: 8 }}>Privacidade e segurança</h3>
        <p className="text-muted" style={{ fontSize: 13, marginBottom: 12 }}>Seus dados são só seus. Leia como cuidamos deles no <Link to="/privacidade" className="link">aviso de privacidade</Link>.</p>
        <div className="field" style={{ marginBottom: 14 }}>
          <label htmlFor="idle">Sair automaticamente por inatividade</label>
          <select id="idle" className="select" value={idleMin} onChange={(e) => { const n = Number(e.target.value); setIdleMin(n); setIdleMinutes(n); toast.show(n ? `Saída automática após ${n} min sem uso.` : "Saída automática desligada.", "success"); }}>
            {IDLE_OPTIONS.map((n) => <option key={n} value={n}>{n === 0 ? "Desligada" : `Após ${n} minutos`}</option>)}
          </select>
          <span className="text-muted" style={{ fontSize: 12 }}><ShieldCheck size={12} aria-hidden /> Recomendado em aparelho compartilhado.</span>
        </div>

        {!ACCOUNT_DELETION_ENABLED ? (
          <p className="text-muted" style={{ fontSize: 13 }}>Para excluir sua conta e todos os seus dados, fale com quem te passou o link do app. Você pode baixar tudo antes em “Exportar backup”.</p>
        ) : !confirmDelete ? (
          <button className="btn btn--danger btn--block" onClick={() => setConfirmDelete(true)}><Trash2 size={16} /> Excluir minha conta e dados</button>
        ) : (
          <div className="danger-zone">
            <p><b>Isso apaga sua conta e todos os seus registros, para sempre.</b> Não dá para desfazer. Se quiser, exporte o backup antes.</p>
            <div className="field">
              <label htmlFor="del-word">Digite EXCLUIR para confirmar</label>
              <input id="del-word" className={`input${deleteError ? " input-error" : ""}`} autoComplete="off" value={deleteWord} onChange={(e) => setDeleteWord(e.target.value)} placeholder="EXCLUIR" />
            </div>
            {deleteError && <div className="error-text" role="alert">{deleteError}</div>}
            <div className="danger-zone__actions">
              <button className="btn btn--secondary" onClick={() => { setConfirmDelete(false); setDeleteWord(""); setDeleteError(null); }}>Cancelar</button>
              <button className="btn btn--danger-solid" disabled={deleteWord.trim().toUpperCase() !== "EXCLUIR" || deleting} onClick={handleDelete}><Trash2 size={16} /> {deleting ? "Excluindo…" : "Excluir tudo"}</button>
            </div>
          </div>
        )}
      </div>

      <button className="btn btn--danger btn--block" onClick={async () => { await signOut(); navigate("/login", { replace: true }); }}>
        <LogOut size={16} /> Sair da conta
      </button>
    </div>
  );
}
