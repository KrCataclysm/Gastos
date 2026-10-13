import { checkPassword } from "@/lib/password";

/** Medidor animado de força da senha: quatro segmentos que acendem e uma dica curta. */
export function PasswordStrength({ password, email }: { password: string; email?: string }) {
  if (!password) return null;
  const c = checkPassword(password, email);
  return (
    <div className="pw-meter" data-score={c.score} aria-live="polite">
      <div className="pw-meter__bars" aria-hidden>
        {[1, 2, 3, 4].map((n) => <span key={n} className={n <= c.score ? "on" : ""} />)}
      </div>
      <div className="pw-meter__text">
        <b>{c.label}</b>
        <span>{c.problem ?? (c.tips.length ? c.tips.join(" · ") : "Ótima escolha.")}</span>
      </div>
    </div>
  );
}
