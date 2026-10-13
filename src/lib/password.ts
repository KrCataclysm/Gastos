/** Regras de senha para contas novas (o servidor continua valendo para as antigas). */
export const MIN_PASSWORD = 10;

const COMMON = new Set([
  "1234567890", "12345678910", "0123456789", "qwertyuiop", "senha12345", "password123", "senha123456",
  "123456789a", "abc1234567", "1q2w3e4r5t", "admin12345", "brasil2026", "iloveyou12", "123123123123",
]);

export interface PasswordCheck {
  /** 0 (inaceitável) a 4 (forte) */
  score: 0 | 1 | 2 | 3 | 4;
  label: string;
  /** primeira regra que impede de salvar, se houver */
  problem: string | null;
  /** dicas curtas do que melhoraria a senha */
  tips: string[];
}

const LABELS = ["Muito fraca", "Fraca", "Razoável", "Boa", "Forte"] as const;

export function checkPassword(password: string, email = ""): PasswordCheck {
  const tips: string[] = [];
  const lower = password.toLowerCase();
  const local = email.split("@")[0]?.toLowerCase() ?? "";
  let problem: string | null = null;

  if (password.length < MIN_PASSWORD) problem = `Use pelo menos ${MIN_PASSWORD} caracteres.`;
  else if (COMMON.has(lower) || /^(.)\1+$/.test(password)) problem = "Essa senha é muito comum. Escolha outra.";
  else if (local.length >= 4 && lower.includes(local)) problem = "A senha não pode conter o seu e-mail.";

  const classes = [/[a-z]/, /[A-Z]/, /\d/, /[^A-Za-z0-9]/].filter((r) => r.test(password)).length;
  let points = 0;
  if (password.length >= MIN_PASSWORD) points++;
  if (password.length >= 14) points++;
  if (classes >= 3) points++;
  if (password.length >= 18 || (classes === 4 && password.length >= 14)) points++;
  if (/(.)\1{2,}/.test(password) || /(012|123|234|345|456|567|678|789|abc|qwe)/i.test(password)) points = Math.max(0, points - 1);

  if (password.length < 14) tips.push("Passe de 14 caracteres");
  if (classes < 3) tips.push("Misture letras, números e símbolos");
  if (/(.)\1{2,}/.test(password)) tips.push("Evite repetir o mesmo caractere");

  const score = (problem ? Math.min(points, 1) : Math.max(1, points)) as 0 | 1 | 2 | 3 | 4;
  return { score: password ? score : 0, label: password ? LABELS[score] : "", problem, tips: tips.slice(0, 2) };
}
