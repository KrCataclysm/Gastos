import { describe, expect, it } from "vitest";
import { pokaYoke } from "@/lib/poka";
import type { Transaction } from "@/types";

const tx = (o: Partial<Transaction>): Transaction => ({ id: Math.random().toString(), type: "expense", amount: 10, description: "Café", date: "2026-10-05", category_id: "c1", deleted_at: null, ...o }) as Transaction;
const draft = (o = {}) => ({ type: "expense", amount: 10, description: "Café", date: "2026-10-06", category_id: "c1", ...o });

describe("pokaYoke", () => {
  it("detecta duplicado ignorando acento e caixa", () => {
    expect(pokaYoke(draft({ description: "CAFÉ" }), [tx({ description: "cafe" })]).map((w) => w.kind)).toContain("duplicate");
  });
  it("não acusa duplicado distante ou o próprio lançamento em edição", () => {
    expect(pokaYoke(draft(), [tx({ date: "2026-09-01" })])).toEqual([]);
    expect(pokaYoke(draft({ id: "x" }), [tx({ id: "x" })])).toEqual([]);
  });
  it("detecta valor 5x acima da mediana da categoria", () => {
    const base = [10, 12, 9, 11, 10].map((amount, i) => tx({ amount, description: `d${i}`, date: "2026-09-01" }));
    expect(pokaYoke(draft({ amount: 600, description: "x" }), base).map((w) => w.kind)).toContain("outlier");
    expect(pokaYoke(draft({ amount: 30, description: "x" }), base)).toEqual([]);
  });
  it("sem histórico suficiente não opina", () => {
    expect(pokaYoke(draft({ amount: 900, description: "y" }), [tx({ amount: 5, description: "z" })])).toEqual([]);
  });
  it("ignora transferências", () => {
    expect(pokaYoke(draft({ type: "transfer" }), [tx({})])).toEqual([]);
  });
});
