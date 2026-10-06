import { effectiveExpenses } from "@/lib/analysis";
import { parseDate } from "@/lib/calc";
import type { CauseGroup, ProjectAction, ProjectCause, ProjectData, ProjectStage, Transaction } from "@/types";

export const STAGES: { id: Exclude<ProjectStage, "done">; letter: string; label: string; question: string }[] = [
  { id: "define", letter: "D", label: "Definir", question: "Qual é o problema e que resultado você quer?" },
  { id: "measure", letter: "M", label: "Medir", question: "Como o gasto se comporta hoje, de verdade?" },
  { id: "analyze", letter: "A", label: "Analisar", question: "Por que isso acontece? Quais as causas raiz?" },
  { id: "improve", letter: "I", label: "Melhorar", question: "O que você vai fazer a respeito?" },
  { id: "control", letter: "C", label: "Controlar", question: "Como garantir que o ganho se mantém?" },
];

export const CAUSE_GROUPS: Record<CauseGroup, string> = {
  metodo: "Método",
  maquina: "Máquina / ferramentas",
  mao_de_obra: "Mão de obra (hábitos)",
  material: "Material (o que se compra)",
  medida: "Medida (controle)",
  meio: "Meio (ambiente)",
};

export const emptyProjectData = (): ProjectData => ({
  problem: "",
  objective: "",
  baseline: null,
  target: null,
  deadline: null,
  benefit: "",
  causes: [],
  actions: [],
  ocap: "",
  standardized: false,
  lessons: "",
});

/** Mescla dados vindos do banco com o formato atual, tolerando campos ausentes. */
export function normalizeProjectData(raw: unknown): ProjectData {
  const base = emptyProjectData();
  if (!raw || typeof raw !== "object") return base;
  const r = raw as Partial<ProjectData>;
  return {
    ...base,
    ...r,
    causes: Array.isArray(r.causes) ? r.causes : [],
    actions: Array.isArray(r.actions) ? r.actions : [],
  };
}

const clamp15 = (n: number) => Math.min(5, Math.max(1, Math.round(n) || 1));

/** Matriz GUT: prioridade = Gravidade × Urgência × Tendência (1 a 125). */
export const gutScore = (c: Pick<ProjectCause, "g" | "u" | "t">) => clamp15(c.g) * clamp15(c.u) * clamp15(c.t);

export const rankCauses = (causes: readonly ProjectCause[]) =>
  [...causes].sort((a, b) => gutScore(b) - gutScore(a) || a.text.localeCompare(b.text, "pt-BR"));

/** Etapa mais avançada que já tem conteúdo, para sugerir por onde continuar. */
export function suggestedStage(d: ProjectData): Exclude<ProjectStage, "done"> {
  if (!d.problem.trim() || d.target == null) return "define";
  if (d.causes.length === 0) return "analyze";
  if (d.actions.length === 0) return "improve";
  return "control";
}

export interface ProjectProgress {
  actionsDone: number;
  actionsTotal: number;
}

export const actionProgress = (actions: readonly ProjectAction[]): ProjectProgress => ({ actionsDone: actions.filter((a) => a.done).length, actionsTotal: actions.length });

const isoDate = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

/** Segunda-feira da semana de `d` (semana ISO). */
export function weekStart(d: Date): Date {
  const x = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  x.setDate(x.getDate() - ((x.getDay() + 6) % 7));
  return x;
}

export interface WeekPoint {
  start: string;
  total: number;
}

/**
 * Gasto semanal (seg-dom) das últimas `weeks` semanas COMPLETAS, da mais antiga à mais recente.
 * Se `categoryId` vier, considera só ela. A semana corrente fica de fora (ainda incompleta).
 */
export function weeklySpending(txs: readonly Transaction[], weeks: number, categoryId: string | null = null, ref: Date = new Date()): WeekPoint[] {
  const thisWeek = weekStart(ref);
  const first = new Date(thisWeek);
  first.setDate(first.getDate() - weeks * 7);
  const cents = new Map<string, number>();
  for (let i = 0; i < weeks; i++) {
    const d = new Date(first);
    d.setDate(d.getDate() + i * 7);
    cents.set(isoDate(d), 0);
  }
  for (const t of effectiveExpenses(txs)) {
    if (categoryId && t.category_id !== categoryId) continue;
    const key = isoDate(weekStart(parseDate(t.date)));
    if (cents.has(key)) cents.set(key, (cents.get(key) ?? 0) + Math.round(t.amount * 100));
  }
  return [...cents].map(([start, c]) => ({ start, total: c / 100 }));
}

/** Média mensal gasta na categoria nos últimos `months` meses completos (base para a linha de base do projeto). */
export function monthlyBaseline(txs: readonly Transaction[], categoryId: string | null, months = 3, ref: Date = new Date()): number {
  const from = new Date(ref.getFullYear(), ref.getMonth() - months, 1);
  const to = new Date(ref.getFullYear(), ref.getMonth(), 1);
  let cents = 0;
  for (const t of effectiveExpenses(txs)) {
    if (categoryId && t.category_id !== categoryId) continue;
    const d = parseDate(t.date);
    if (d >= from && d < to) cents += Math.round(t.amount * 100);
  }
  return cents / 100 / months;
}

/** Gasto do mês corrente na categoria (para comparar com a meta do projeto). */
export function currentMonthSpend(txs: readonly Transaction[], categoryId: string | null, ref: Date = new Date()): number {
  let cents = 0;
  for (const t of effectiveExpenses(txs)) {
    if (categoryId && t.category_id !== categoryId) continue;
    const d = parseDate(t.date);
    if (d.getFullYear() === ref.getFullYear() && d.getMonth() === ref.getMonth()) cents += Math.round(t.amount * 100);
  }
  return cents / 100;
}

/** Economia mensal que o projeto pretende gerar (linha de base − meta). */
export const monthlySaving = (d: Pick<ProjectData, "baseline" | "target">) => (d.baseline != null && d.target != null ? Math.max(0, d.baseline - d.target) : 0);
