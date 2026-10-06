import { describe, expect, it } from "vitest";
import { budgetPace, goalPace, monthFraction } from "@/lib/pace";

describe("monthFraction", () => {
  it("dia 15 de um mês de 30 dias = 50%", () => expect(monthFraction(2026, 9, new Date(2026, 8, 15))).toBe(0.5));
  it("meses passados = 1 e futuros = 0", () => {
    expect(monthFraction(2026, 8, new Date(2026, 8, 15))).toBe(1);
    expect(monthFraction(2026, 10, new Date(2026, 8, 15))).toBe(0);
  });
  it("último dia do mês = 100%", () => expect(monthFraction(2026, 9, new Date(2026, 8, 30))).toBe(1));
});

describe("budgetPace", () => {
  it("sem orçamento não há ritmo", () => expect(budgetPace(50, 0, 0.5)).toBeNull());
  it("gasto no ritmo = no prumo", () => expect(budgetPace(500, 1000, 0.5)).toMatchObject({ status: "ok", idealSpent: 500, deviation: 0 }));
  it("um pouco acima = atenção; muito acima = fora do prumo", () => {
    expect(budgetPace(580, 1000, 0.5)?.status).toBe("warn");
    expect(budgetPace(800, 1000, 0.5)?.status).toBe("off");
  });
  it("passou do limite = estourou, mesmo no fim do mês", () => expect(budgetPace(1001, 1000, 1)?.status).toBe("over"));
  it("abaixo do ritmo fica no prumo e o desvio é negativo", () => expect(budgetPace(200, 1000, 0.5)).toMatchObject({ status: "ok", deviation: -300 }));
});

describe("goalPace", () => {
  const base = { target_amount: 1200, current_amount: 0, created_at: "2026-01-01T00:00:00Z", target_date: "2026-12-31" };
  it("meta concluída", () => expect(goalPace({ ...base, current_amount: 1200 }, new Date(2026, 5, 1))).toMatchObject({ status: "done", perMonth: 0 }));
  it("sem prazo não cobra ritmo", () => expect(goalPace({ ...base, target_date: null }, new Date(2026, 5, 1))).toMatchObject({ status: "ok", perMonth: null }));
  it("no ritmo do tempo = no prumo", () => {
    const g = goalPace({ ...base, current_amount: 600 }, new Date(2026, 6, 2)); // ~metade do ano
    expect(g.status).toBe("ok");
  });
  it("muito atrás do tempo = fora do prumo e calcula quanto guardar por mês", () => {
    const g = goalPace({ ...base, current_amount: 100 }, new Date(2026, 8, 1));
    expect(g.status).toBe("off");
    expect(g.perMonth).toBeCloseTo((1200 - 100) / g.monthsLeft!, 5);
  });
  it("prazo vencido e incompleta = fora do prumo, falta tudo de uma vez", () => {
    const g = goalPace({ ...base, current_amount: 300 }, new Date(2027, 1, 1));
    expect(g).toMatchObject({ status: "off", perMonth: 900, monthsLeft: 0 });
  });
});
