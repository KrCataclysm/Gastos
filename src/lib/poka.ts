import { parseDate } from "@/lib/calc";
import type { Transaction } from "@/types";

/**
 * Poka-yoke: evita erro de digitação antes de gravar. Não bloqueia, só pede confirmação
 * quando o lançamento parece duplicado ou fora do padrão da categoria.
 */

export type PokaKind = "duplicate" | "outlier" | "zeros";
export interface PokaWarning { kind: PokaKind; message: string }

interface Draft { id?: string; type: string; amount: number; description: string; date: string; category_id: string | null }

const norm = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
const median = (xs: number[]) => {
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};

export function pokaYoke(draft: Draft, existing: readonly Transaction[]): PokaWarning[] {
  const out: PokaWarning[] = [];
  if (draft.type !== "expense" && draft.type !== "income") return out;
  const others = existing.filter((t) => !t.deleted_at && t.id !== draft.id);
  const when = parseDate(draft.date).getTime();

  const dup = others.find((t) => t.type === draft.type && Math.round(t.amount * 100) === Math.round(draft.amount * 100) && norm(t.description) === norm(draft.description) && Math.abs(parseDate(t.date).getTime() - when) <= 2 * 86_400_000);
  if (dup) out.push({ kind: "duplicate", message: "Já existe um lançamento igual (mesmo valor e descrição) nos últimos dias. Foi digitado duas vezes?" });

  if (draft.type === "expense" && draft.category_id) {
    const same = others.filter((t) => t.type === "expense" && t.category_id === draft.category_id).map((t) => t.amount);
    if (same.length >= 5) {
      const med = median(same);
      if (med > 0 && draft.amount >= med * 5) out.push({ kind: "outlier", message: `Este valor é ${Math.round(draft.amount / med)}× a mediana dessa categoria (mediana: ${med.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}). Confira a vírgula.` });
    }
  }

  if (draft.amount >= 1000 && Number.isInteger(draft.amount) && draft.amount % 1000 === 0 && draft.type === "expense") out.push({ kind: "zeros", message: "Valor redondo e alto. Se era para ser menor, confira os zeros." });
  return out;
}
