import { describe, expect, it } from "vitest";
import { accountBalances, advanceDate, dailyAllowance, dueRecurring, ishikawa, pareto, summarize, totalsByCategory, budgetLines } from "../src/domain/analytics";
import type { Account, Budget, Category, Recurring, Transaction } from "../src/domain/types";

const cat = (id: string, name: string, extra: Partial<Category> = {}): Category => ({ id, name, kind: "expense", nature: "variable", color: "#000", icon: "tag", monthly_budget: null, archived_at: null, ...extra });
const tx = (id: string, amount: number, category_id: string | null, description = "", extra: Partial<Transaction> = {}): Transaction => ({
  id, account_id: "a1", category_id, transfer_account_id: null, recurring_id: null, type: "expense", amount, description, notes: null, date: "2026-10-05", status: "cleared", ...extra,
});

const cats = [cat("food", "Alimentação"), cat("bus", "Transporte"), cat("fun", "Lazer"), cat("rent", "Moradia", { nature: "fixed" }), cat("sal", "Mesada", { kind: "income" })];

describe("summarize", () => {
  it("soma em centavos sem erro de ponto flutuante e ignora transferências", () => {
    const s = summarize([tx("1", 0.1, "food"), tx("2", 0.2, "food"), tx("3", 100, "sal", "", { type: "income" }), tx("4", 50, null, "", { type: "transfer", transfer_account_id: "a2" })]);
    expect(s.expense).toBe(0.3);
    expect(s.income).toBe(100);
    expect(s.balance).toBe(99.7);
    expect(s.savingsRate).toBeCloseTo(0.997);
  });
  it("sem receita não calcula taxa de poupança", () => expect(summarize([tx("1", 10, "food")]).savingsRate).toBeNull());
});

describe("pareto", () => {
  const totals = totalsByCategory([tx("1", 500, "rent"), tx("2", 300, "food"), tx("3", 100, "bus"), tx("4", 30, "fun"), tx("5", 20, "fun")], cats);
  const p = pareto(totals);
  it("ordena do maior para o menor e acumula até 100%", () => {
    expect(p.map((i) => i.name)).toEqual(["Moradia", "Alimentação", "Transporte", "Lazer"]);
    expect(p.at(-1)?.cumulative).toBeCloseTo(1);
    expect(p[0]?.share).toBeCloseTo(500 / 950);
  });
  it("marca como vitais as categorias até cruzar 80%", () => {
    expect(p.map((i) => i.vital)).toEqual([true, true, false, false]); // 50% -> 80% (item que cruza é vital)
  });
  it("lista vazia ou zerada retorna vazio", () => expect(pareto([])).toEqual([]));
  it("agrupa gastos sem categoria", () => expect(totalsByCategory([tx("1", 10, null)], cats)[0]?.name).toBe("Sem categoria"));
});

describe("ishikawa", () => {
  const txs = [tx("1", 30, "food", "Bandejão"), tx("2", 25, "food", "bandejao"), tx("3", 80, "food", "Pizza"), tx("4", 10, "food", "Café"), tx("5", 9, "food", "Pão"), tx("6", 200, "rent", "Aluguel"), tx("7", 15, "bus", "Ônibus"), tx("8", 5, "fun", "Cinema")];
  const r = ishikawa(txs, cats, { maxBones: 2, maxRibs: 2 });
  it("efeito é o total gasto", () => expect(r.effectTotal).toBe(374));
  it("espinhas são as categorias de maior peso + resto agregado", () => {
    expect(r.bones.map((b) => b.name)).toEqual(["Moradia", "Alimentação", "Outras (2)"]);
    expect(r.bones.reduce((s, b) => s + b.total, 0)).toBeCloseTo(374);
  });
  it("agrupa causas ignorando acento e caixa e limita as costelas", () => {
    const food = r.bones.find((b) => b.id === "food");
    expect(food?.ribs[0]).toMatchObject({ label: "Pizza", total: 80 });
    expect(food?.ribs[1]).toMatchObject({ label: "Bandejão", total: 55, count: 2 });
    expect(food?.ribs[2]?.label).toBe("Outros (2)");
  });
  it("não cria 'Outras (1)': mostra a categoria sobrando", () => {
    const r2 = ishikawa(txs, cats, { maxBones: 3 }); // 4 categorias: a 4ª aparece direto
    expect(r2.bones.map((b) => b.name)).toEqual(["Moradia", "Alimentação", "Transporte", "Lazer"]);
  });
  it("ignora receitas", () => expect(ishikawa([tx("1", 99, "sal", "x", { type: "income" })], cats).bones).toEqual([]));
});

describe("saldos de conta", () => {
  const accounts: Account[] = [
    { id: "a1", name: "Carteira", type: "cash", initial_balance: 100, color: "#000", icon: "wallet", archived_at: null },
    { id: "a2", name: "Conta", type: "checking", initial_balance: 0, color: "#000", icon: "wallet", archived_at: null },
  ];
  it("considera receitas, despesas, transferências e ignora pendentes", () => {
    const b = accountBalances(accounts, [tx("1", 20, "food"), tx("2", 50, null, "", { type: "transfer", transfer_account_id: "a2" }), tx("3", 999, "food", "", { status: "pending" }), tx("4", 10, "sal", "", { type: "income", account_id: "a2" })]);
    expect(b.get("a1")).toBe(30);
    expect(b.get("a2")).toBe(60);
  });
});

describe("recorrências", () => {
  it("avança mensalmente respeitando fim de mês", () => {
    expect(advanceDate("2026-01-31", "monthly", 1, 31)).toBe("2026-02-28");
    expect(advanceDate("2026-02-28", "monthly", 1, 31)).toBe("2026-03-31");
    expect(advanceDate("2026-10-05", "weekly", 2)).toBe("2026-10-19");
    expect(advanceDate("2026-10-05", "yearly", 1)).toBe("2027-10-05");
  });
  it("lista vencidas e ignora inativas ou encerradas", () => {
    const base: Recurring = { id: "r", account_id: "a1", category_id: null, type: "expense", amount: 1, description: "x", frequency: "monthly", interval_count: 1, day_of_month: 5, start_date: "2026-01-05", end_date: null, next_run_date: "2026-10-05", active: true };
    const list = [base, { ...base, id: "r2", next_run_date: "2026-11-05" }, { ...base, id: "r3", active: false }, { ...base, id: "r4", end_date: "2026-09-01" }];
    expect(dueRecurring(list, "2026-10-06").map((r) => r.id)).toEqual(["r"]);
  });
});

describe("orçamento", () => {
  it("usa budgets do mês antes do orçamento padrão da categoria e classifica o status", () => {
    const c = [cat("food", "Alimentação", { monthly_budget: 100 }), cat("bus", "Transporte", { monthly_budget: 50 })];
    const budgets: Budget[] = [{ id: "b", category_id: "food", year: 2026, month: 10, amount: 200 }];
    const lines = budgetLines(c, budgets, [tx("1", 190, "food"), tx("2", 60, "bus")]);
    expect(lines.find((l) => l.category.id === "food")).toMatchObject({ planned: 200, status: "warn" });
    expect(lines.find((l) => l.category.id === "bus")).toMatchObject({ planned: 50, status: "over" });
  });
  it("gasto diário disponível", () => {
    expect(dailyAllowance(100, 3)).toBe(33.33);
    expect(dailyAllowance(-5, 3)).toBe(0);
    expect(dailyAllowance(100, 0)).toBeNull();
  });
});
