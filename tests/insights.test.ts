import { describe, expect, it } from "vitest";
import { monthInsights } from "@/lib/insights";
import type { Category, Transaction } from "@/types";

const ref = new Date(2026, 9, 20);
const cats = [{ id: "a", name: "Alimentação", color: "#000", nature: "variable" }, { id: "b", name: "Lazer", color: "#111", nature: "variable" }] as Category[];
let n = 0;
const tx = (date: string, amount: number, category_id = "a", description = "x"): Transaction => ({ id: String(++n), type: "expense", status: "cleared", deleted_at: null, date, amount, category_id, description }) as Transaction;

describe("monthInsights", () => {
  it("fica em silêncio com poucos lançamentos", () => {
    expect(monthInsights([tx("2026-10-02", 50), tx("2026-10-03", 50)], cats, ref)).toEqual([]);
  });

  it("aponta a categoria líder do mês", () => {
    const txs = [1, 2, 3, 4, 5, 6].map((d) => tx(`2026-10-0${d}`, 100)).concat([tx("2026-10-07", 20, "b")]);
    const ins = monthInsights(txs, cats, ref);
    expect(ins[0].id).toBe("pareto");
    expect(ins[0].title).toContain("Alimentação");
  });

  it("aponta alta contra o mês anterior", () => {
    const prev = [1, 2, 3, 4, 5].map((d) => tx(`2026-09-0${d}`, 20, "b"));
    const cur = [1, 2, 3, 4, 5].map((d) => tx(`2026-10-0${d}`, 40, "b"));
    expect(monthInsights([...prev, ...cur], cats, ref).map((i) => i.id)).toContain("rise");
  });

  it("nunca passa de 3 observações", () => {
    const txs = Array.from({ length: 20 }, (_, i) => tx(`2026-10-${String((i % 14) + 1).padStart(2, "0")}`, 30 + i));
    expect(monthInsights(txs, cats, ref).length).toBeLessThanOrEqual(3);
  });
});
