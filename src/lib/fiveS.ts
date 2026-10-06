import { parseDate } from "@/lib/calc";
import type { Account, Category, RecurringTransaction, Transaction } from "@/types";

/**
 * Check-up 5S das finanças (Seiri, Seiton, Seiso, Seiketsu, Shitsuke) calculado só com os
 * dados do próprio usuário. Cada senso vira uma nota 0-100 e uma recomendação objetiva.
 */

export type SensoId = "utilizacao" | "ordenacao" | "limpeza" | "saude" | "autodisciplina";

export interface Senso {
  id: SensoId;
  jp: string;
  name: string;
  score: number | null; // null = dados insuficientes
  detail: string;
  tip: string;
}

export interface FiveSInput {
  transactions: readonly Transaction[];
  categories: readonly Category[];
  accounts: readonly Account[];
  recurring: readonly RecurringTransaction[];
  ref?: Date;
}

const pct = (n: number) => Math.round(Math.min(1, Math.max(0, n)) * 100);
const DAY = 86_400_000;
const daysBetween = (a: Date, b: Date) => Math.floor((a.getTime() - b.getTime()) / DAY);

export function fiveS({ transactions, categories, accounts, recurring, ref = new Date() }: FiveSInput): Senso[] {
  const live = transactions.filter((t) => !t.deleted_at);
  const last90 = live.filter((t) => daysBetween(ref, parseDate(t.date)) <= 90 && daysBetween(ref, parseDate(t.date)) >= 0);
  const last30 = last90.filter((t) => daysBetween(ref, parseDate(t.date)) < 30);

  // 1. Utilização (Seiri): categorias e contas que não servem a nada ficam de fora.
  const used = new Set(last90.map((t) => t.category_id).filter(Boolean));
  const expenseCats = categories.filter((c) => c.kind === "expense" && !c.deleted_at);
  const idleCats = expenseCats.filter((c) => !used.has(c.id));
  const usedAcc = new Set(last90.flatMap((t) => [t.account_id, t.transfer_account_id]).filter(Boolean));
  const idleAcc = accounts.filter((a) => !a.deleted_at && !a.archived_at && !usedAcc.has(a.id));
  const totalItems = expenseCats.length + accounts.filter((a) => !a.deleted_at && !a.archived_at).length;
  const utilizacao: Senso = {
    id: "utilizacao",
    jp: "Seiri",
    name: "Utilização",
    score: totalItems === 0 ? null : pct(1 - (idleCats.length + idleAcc.length) / totalItems),
    detail: `${idleCats.length} categoria(s) e ${idleAcc.length} conta(s) sem uso nos últimos 90 dias.`,
    tip: idleCats.length + idleAcc.length > 0 ? "Arquive o que você não usa mais. Menos opções, lançamento mais rápido." : "Tudo que você cadastrou está em uso.",
  };

  // 2. Ordenação (Seiton): cada gasto no seu lugar (categoria) e com nome claro.
  const exp90 = last90.filter((t) => t.type === "expense");
  const categorized = exp90.filter((t) => t.category_id).length;
  const described = exp90.filter((t) => t.description.trim().length >= 3).length;
  const ordenacao: Senso = {
    id: "ordenacao",
    jp: "Seiton",
    name: "Ordenação",
    score: exp90.length < 5 ? null : pct((categorized + described) / (2 * exp90.length)),
    detail: `${categorized} de ${exp90.length} despesas com categoria; ${described} com descrição legível.`,
    tip: categorized < exp90.length ? "Gasto sem categoria some do Pareto. Classifique no ato do lançamento." : "Boa classificação: seus relatórios refletem a realidade.",
  };

  // 3. Limpeza (Seiso): pendências velhas e recorrências vencidas viram sujeira no saldo.
  const stalePending = live.filter((t) => t.status === "pending" && daysBetween(ref, parseDate(t.date)) > 30);
  const staleRec = recurring.filter((r) => !r.deleted_at && r.active && daysBetween(ref, parseDate(r.next_run_date)) > 35);
  const limpeza: Senso = {
    id: "limpeza",
    jp: "Seiso",
    name: "Limpeza",
    score: pct(1 - Math.min(1, (stalePending.length + staleRec.length) / 5)),
    detail: `${stalePending.length} pendência(s) com mais de 30 dias; ${staleRec.length} recorrência(s) atrasada(s).`,
    tip: stalePending.length + staleRec.length > 0 ? "Efetive ou apague o que ficou para trás. Saldo só é confiável sem pendência velha." : "Sem pendências antigas. Saldo confiável.",
  };

  // 4. Saúde (Seiketsu): taxa de poupança dos últimos 30 dias.
  const inc = last30.filter((t) => t.type === "income" && t.status === "cleared").reduce((s, t) => s + Math.round(t.amount * 100), 0);
  const out = last30.filter((t) => t.type === "expense" && t.status === "cleared").reduce((s, t) => s + Math.round(t.amount * 100), 0);
  const rate = inc > 0 ? (inc - out) / inc : null;
  const saude: Senso = {
    id: "saude",
    jp: "Seiketsu",
    name: "Saúde financeira",
    score: rate == null ? null : pct(rate / 0.2), // 20% de poupança = nota máxima
    detail: rate == null ? "Registre suas receitas para calcular." : `Você guardou ${Math.round(rate * 100)}% da renda nos últimos 30 dias (referência: 20%).`,
    tip: rate == null ? "Sem receita lançada o app não consegue medir sua saúde." : rate < 0 ? "Você gastou mais do que entrou. Ataque a categoria nº 1 do Pareto primeiro." : rate < 0.2 ? "Automatize um valor fixo para a reserva assim que a renda entrar." : "Ótimo ritmo. Mantenha e direcione para uma meta.",
  };

  // 5. Autodisciplina (Shitsuke): consistência de registro.
  const days = new Set(last30.map((t) => t.date)).size;
  const autodisciplina: Senso = {
    id: "autodisciplina",
    jp: "Shitsuke",
    name: "Autodisciplina",
    score: live.length < 3 ? null : pct(days / 15), // 15 dias com registro em 30 = nota máxima
    detail: `${days} dia(s) com lançamento nos últimos 30.`,
    tip: days < 15 ? "Reserve 2 minutos por dia (ex.: no ônibus) para lançar. Hábito vale mais que perfeição." : "Hábito consolidado. Seus dados são confiáveis.",
  };

  return [utilizacao, ordenacao, limpeza, saude, autodisciplina];
}

/** Média das notas disponíveis; null se nenhuma pôde ser calculada. */
export function overallScore(sensos: readonly Senso[]): number | null {
  const s = sensos.map((x) => x.score).filter((x): x is number => x != null);
  return s.length ? Math.round(s.reduce((a, b) => a + b, 0) / s.length) : null;
}
