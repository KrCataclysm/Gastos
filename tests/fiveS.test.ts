import { describe, expect, it } from "vitest";
import { fiveS, overallScore } from "@/lib/fiveS";
import type { Account, Category, Transaction } from "@/types";

const ref = new Date(2026, 9, 7);
const cat = (id: string): Category => ({ id, kind: "expense", deleted_at: null }) as Category;
const acc = (id: string): Account => ({ id, deleted_at: null, archived_at: null }) as Account;
const tx = (date: string, o: Partial<Transaction> = {}): Transaction =>
  ({ id: date + Math.random(), type: "expense", status: "cleared", deleted_at: null, date, amount: 10, category_id: "c1", account_id: "a1", transfer_account_id: null, description: "Almoço", ...o }) as Transaction;

describe("fiveS", () => {
  it("sem dados, notas ficam indefinidas em vez de inventadas", () => {
    const s = fiveS({ transactions: [], categories: [], accounts: [], recurring: [], ref });
    expect(s.find((x) => x.id === "saude")!.score).toBeNull();
    expect(s.find((x) => x.id === "autodisciplina")!.score).toBeNull();
    expect(overallScore(s.filter((x) => x.score == null))).toBeNull();
  });

  it("utilização penaliza categoria parada", () => {
    const s = fiveS({ transactions: [tx("2026-10-01")], categories: [cat("c1"), cat("c2")], accounts: [acc("a1")], recurring: [], ref });
    expect(s.find((x) => x.id === "utilizacao")!.score).toBe(67);
  });

  it("saúde: poupar 20% da renda dá 100", () => {
    const txs = [tx("2026-10-01", { type: "income", amount: 1000 }), tx("2026-10-02", { amount: 800 }), tx("2026-10-03"), tx("2026-10-04")];
    const saude = fiveS({ transactions: txs, categories: [], accounts: [], recurring: [], ref }).find((x) => x.id === "saude")!;
    expect(saude.score).toBe(Math.round(((1000 - 820) / 1000 / 0.2) * 100));
  });

  it("limpeza conta pendência antiga", () => {
    const l = fiveS({ transactions: [tx("2026-08-01", { status: "pending" })], categories: [], accounts: [], recurring: [], ref }).find((x) => x.id === "limpeza")!;
    expect(l.score).toBe(80);
  });
});
