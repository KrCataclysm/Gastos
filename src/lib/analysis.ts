import type { Category, CategoryNature, Transaction } from "@/types";

/**
 * Ferramentas da Qualidade aplicadas aos gastos (Pareto e Ishikawa).
 * Funções puras: somam em centavos inteiros para não acumular erro de ponto flutuante.
 */

export const UNCATEGORIZED_ID = "__none__";
const toCents = (v: number) => Math.round(v * 100);
const fromCents = (c: number) => c / 100;

export interface CategoryTotal {
  id: string;
  name: string;
  color: string;
  nature: CategoryNature;
  total: number;
  count: number;
}

type TxLike = Pick<Transaction, "type" | "amount" | "category_id" | "description" | "status" | "deleted_at">;

/** Despesas efetivadas (não excluídas e já pagas) do período já filtrado pelo chamador. */
export const effectiveExpenses = <T extends TxLike>(txs: readonly T[]): T[] => txs.filter((t) => t.type === "expense" && t.status === "cleared" && !t.deleted_at);

export function totalsByCategory(txs: readonly TxLike[], categories: readonly Pick<Category, "id" | "name" | "color" | "nature">[]): CategoryTotal[] {
  const byId = new Map(categories.map((c) => [c.id, c]));
  const acc = new Map<string, { cents: number; count: number }>();
  for (const t of effectiveExpenses(txs)) {
    const key = t.category_id && byId.has(t.category_id) ? t.category_id : UNCATEGORIZED_ID;
    const cur = acc.get(key) ?? { cents: 0, count: 0 };
    cur.cents += toCents(t.amount);
    cur.count += 1;
    acc.set(key, cur);
  }
  return [...acc]
    .map(([id, v]) => {
      const c = byId.get(id);
      return { id, name: c?.name ?? "Sem categoria", color: c?.color ?? "#94a3b8", nature: c?.nature ?? "variable", total: fromCents(v.cents), count: v.count };
    })
    .sort((a, b) => b.total - a.total || a.name.localeCompare(b.name, "pt-BR"));
}

/* ------------------------------------------------------------------ Pareto */

export interface ParetoItem extends CategoryTotal {
  share: number; // fração do total (0-1)
  cumulative: number; // fração acumulada até este item, inclusive (0-1)
  vital: boolean; // pertence ao grupo "poucos vitais" que explica ~80%
}

/**
 * Diagrama de Pareto: ordena as causas por impacto e marca as "vitais", as primeiras que,
 * somadas, alcançam o limiar (80% por padrão). O item que cruza o limiar também é vital.
 */
export function pareto(items: readonly CategoryTotal[], threshold = 0.8): ParetoItem[] {
  const sorted = [...items].filter((i) => i.total > 0).sort((a, b) => b.total - a.total);
  const total = sorted.reduce((s, i) => s + toCents(i.total), 0);
  if (total === 0) return [];
  let running = 0;
  return sorted.map((i) => {
    const before = running;
    running += toCents(i.total);
    return { ...i, share: toCents(i.total) / total, cumulative: running / total, vital: before / total < threshold };
  });
}

/* ------------------------------------------------------------------ Ishikawa */

export interface Rib {
  label: string;
  total: number;
  count: number;
}

export interface Bone {
  id: string;
  name: string;
  color: string;
  nature: CategoryNature;
  total: number;
  share: number;
  ribs: Rib[];
}

const normalizeLabel = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();

/**
 * Diagrama de causa e efeito (espinha de peixe): efeito = total gasto; espinhas = categorias de
 * maior impacto; causas = descrições que mais pesam em cada categoria (agrupadas sem acento/caixa).
 */
export function ishikawa(
  txs: readonly TxLike[],
  categories: readonly Pick<Category, "id" | "name" | "color" | "nature">[],
  opts: { maxBones?: number; maxRibs?: number } = {},
): { effectTotal: number; bones: Bone[] } {
  const { maxBones = 6, maxRibs = 3 } = opts;
  const expenses = effectiveExpenses(txs);
  const grand = expenses.reduce((s, t) => s + toCents(t.amount), 0);
  const cats = totalsByCategory(expenses, categories);
  const known = new Set(categories.map((c) => c.id));

  const ribsFor = (ids: Set<string>): Rib[] => {
    const groups = new Map<string, { label: string; cents: number; count: number }>();
    for (const t of expenses) {
      const bucket = t.category_id && known.has(t.category_id) ? t.category_id : UNCATEGORIZED_ID;
      if (!ids.has(bucket)) continue;
      const raw = t.description.trim() || "Sem descrição";
      const norm = normalizeLabel(raw);
      const g = groups.get(norm) ?? { label: raw, cents: 0, count: 0 };
      g.cents += toCents(t.amount);
      g.count += 1;
      groups.set(norm, g);
    }
    const sorted = [...groups.values()].sort((a, b) => b.cents - a.cents);
    const keep = sorted.length === maxRibs + 1 ? maxRibs + 1 : maxRibs; // não cria "Outros (1)"
    const top = sorted.slice(0, keep).map((g) => ({ label: g.label, total: fromCents(g.cents), count: g.count }));
    const rest = sorted.slice(keep);
    if (rest.length > 0) top.push({ label: `Outros (${rest.length})`, total: fromCents(rest.reduce((s, g) => s + g.cents, 0)), count: rest.reduce((s, g) => s + g.count, 0) });
    return top;
  };

  const limit = cats.length === maxBones + 1 ? maxBones + 1 : maxBones;
  const head = cats.slice(0, limit);
  const tail = cats.slice(limit);
  const bones: Bone[] = head.map((c) => ({ id: c.id, name: c.name, color: c.color, nature: c.nature, total: c.total, share: grand ? toCents(c.total) / grand : 0, ribs: ribsFor(new Set([c.id])) }));
  if (tail.length > 0) {
    const cents = tail.reduce((s, c) => s + toCents(c.total), 0);
    bones.push({ id: "__rest__", name: `Outras (${tail.length})`, color: "#94a3b8", nature: "variable", total: fromCents(cents), share: grand ? cents / grand : 0, ribs: ribsFor(new Set(tail.map((c) => c.id))) });
  }
  return { effectTotal: fromCents(grand), bones };
}
