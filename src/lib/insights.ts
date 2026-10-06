import { effectiveExpenses, totalsByCategory } from "@/lib/analysis";
import { parseDate } from "@/lib/calc";
import type { Category, Transaction } from "@/types";

export interface Insight {
  id: string;
  tone: "neutral" | "warn" | "good";
  title: string;
  text: string;
}

const brl = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const WEEKDAYS = ["domingo", "segunda", "terça", "quarta", "quinta", "sexta", "sábado"];

/**
 * "Leitura do mês": no máximo 3 observações objetivas tiradas dos próprios lançamentos.
 * Só fala quando há dado suficiente; prefere silêncio a chute.
 */
export function monthInsights(txs: readonly Transaction[], categories: readonly Category[], ref: Date = new Date()): Insight[] {
  const y = ref.getFullYear();
  const m = ref.getMonth();
  const inMonth = (t: Transaction, yy: number, mm: number) => { const d = parseDate(t.date); return d.getFullYear() === yy && d.getMonth() === mm; };
  const prev = new Date(y, m - 1, 1);
  const cur = effectiveExpenses(txs).filter((t) => inMonth(t, y, m));
  const before = effectiveExpenses(txs).filter((t) => inMonth(t, prev.getFullYear(), prev.getMonth()));
  const out: Insight[] = [];
  if (cur.length < 5) return out;

  const totals = totalsByCategory(cur, categories);
  const sum = totals.reduce((s, c) => s + c.total, 0);
  const top = totals[0];
  if (top && sum > 0) {
    const share = top.total / sum;
    if (share >= 0.3) out.push({ id: "pareto", tone: "neutral", title: `${top.name} lidera`, text: `Responde por ${Math.round(share * 100)}% das despesas do mês (${brl(top.total)}). É onde um ajuste pequeno rende mais.` });
  }

  if (before.length >= 5) {
    const prevTotals = new Map(totalsByCategory(before, categories).map((c) => [c.id, c.total]));
    const rises = totals
      .map((c) => ({ c, base: prevTotals.get(c.id) ?? 0 }))
      .filter(({ c, base }) => base > 0 && c.total - base >= 30 && c.total / base >= 1.25)
      .sort((a, b) => b.c.total - b.base - (a.c.total - a.base));
    if (rises[0]) {
      const { c, base } = rises[0];
      out.push({ id: "rise", tone: "warn", title: `${c.name} subiu`, text: `${brl(c.total)} contra ${brl(base)} no mês passado (+${Math.round((c.total / base - 1) * 100)}%). Vale olhar o que mudou.` });
    } else {
      const falls = totals.map((c) => ({ c, base: prevTotals.get(c.id) ?? 0 })).filter(({ c, base }) => base >= 50 && c.total <= base * 0.75).sort((a, b) => b.base - b.c.total - (a.base - a.c.total));
      if (falls[0]) out.push({ id: "fall", tone: "good", title: `${falls[0].c.name} caiu`, text: `${brl(falls[0].c.total)} contra ${brl(falls[0].base)} no mês passado. Bom sinal: o que você mudou está funcionando.` });
    }
  }

  const byDay = new Array<number>(7).fill(0);
  for (const t of cur) byDay[parseDate(t.date).getDay()] += Math.round(t.amount * 100);
  const total = byDay.reduce((s, v) => s + v, 0);
  const maxDay = byDay.indexOf(Math.max(...byDay));
  if (total > 0 && cur.length >= 10 && byDay[maxDay] / total >= 0.3) {
    out.push({ id: "weekday", tone: "neutral", title: `Gasto concentrado: ${WEEKDAYS[maxDay]}`, text: `${Math.round((byDay[maxDay] / total) * 100)}% do que você gastou no mês caiu em ${WEEKDAYS[maxDay]}${maxDay === 0 || maxDay === 6 ? "" : "s"}. Planejar esse dia ajuda.` });
  }

  const big = [...cur].sort((a, b) => b.amount - a.amount)[0];
  if (out.length < 3 && big && sum > 0 && big.amount / sum >= 0.2) out.push({ id: "big", tone: "neutral", title: "Uma despesa pesa muito", text: `“${big.description.trim() || "Sem descrição"}” (${brl(big.amount)}) é ${Math.round((big.amount / sum) * 100)}% do mês.` });

  return out.slice(0, 3);
}
