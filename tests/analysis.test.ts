import { describe, expect, it } from "vitest";
import { ishikawa, pareto, totalsByCategory } from "@/lib/analysis";

type Cat = { id: string; name: string; color: string; nature: "fixed" | "variable" };
type Tx = { type: "income" | "expense" | "transfer"; amount: number; category_id: string | null; description: string; status: "cleared" | "pending"; deleted_at: string | null };

const cat = (id: string, name: string, nature: Cat["nature"] = "variable"): Cat => ({ id, name, color: "#000000", nature });
const tx = (amount: number, category_id: string | null, description = "", extra: Partial<Tx> = {}): Tx => ({ type: "expense", amount, category_id, description, status: "cleared", deleted_at: null, ...extra });

const cats = [cat("food", "Alimentação"), cat("bus", "Transporte"), cat("fun", "Lazer"), cat("rent", "Moradia", "fixed")];

describe("totalsByCategory", () => {
  it("soma em centavos sem erro de ponto flutuante", () => {
    expect(totalsByCategory([tx(0.1, "food"), tx(0.2, "food")], cats)[0]?.total).toBe(0.3);
  });
  it("ignora receitas, pendentes e excluídas", () => {
    const t = totalsByCategory([tx(10, "food"), tx(99, "food", "", { type: "income" }), tx(99, "food", "", { status: "pending" }), tx(99, "food", "", { deleted_at: "2026-01-01" })], cats);
    expect(t).toHaveLength(1);
    expect(t[0]?.total).toBe(10);
  });
  it("agrupa o que não tem categoria (ou categoria desconhecida)", () => {
    const t = totalsByCategory([tx(10, null), tx(5, "inexistente")], cats);
    expect(t).toEqual([expect.objectContaining({ name: "Sem categoria", total: 15, count: 2 })]);
  });
});

describe("pareto", () => {
  const p = pareto(totalsByCategory([tx(500, "rent"), tx(300, "food"), tx(100, "bus"), tx(30, "fun"), tx(20, "fun")], cats));
  it("ordena do maior para o menor e acumula até 100%", () => {
    expect(p.map((i) => i.name)).toEqual(["Moradia", "Alimentação", "Transporte", "Lazer"]);
    expect(p.at(-1)?.cumulative).toBeCloseTo(1);
    expect(p[0]?.share).toBeCloseTo(500 / 950);
  });
  it("marca como vitais as categorias até cruzar 80% (a que cruza também é vital)", () => {
    expect(p.map((i) => i.vital)).toEqual([true, true, false, false]);
  });
  it("lista vazia retorna vazio", () => expect(pareto([])).toEqual([]));
});

describe("ishikawa", () => {
  const txs = [tx(30, "food", "Bandejão"), tx(25, "food", "bandejao"), tx(80, "food", "Pizza"), tx(10, "food", "Café"), tx(9, "food", "Pão"), tx(200, "rent", "Aluguel"), tx(15, "bus", "Ônibus"), tx(5, "fun", "Cinema")];
  const r = ishikawa(txs, cats, { maxBones: 2, maxRibs: 2 });
  it("efeito é o total gasto", () => expect(r.effectTotal).toBe(374));
  it("espinhas = categorias de maior peso + resto agregado; soma bate com o efeito", () => {
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
    expect(ishikawa(txs, cats, { maxBones: 3 }).bones.map((b) => b.name)).toEqual(["Moradia", "Alimentação", "Transporte", "Lazer"]);
  });
  it("sem despesas não gera espinhas", () => expect(ishikawa([tx(99, "food", "x", { type: "income" })], cats).bones).toEqual([]));
});
