import { describe, expect, it } from "vitest";
import { gutScore, monthlyBaseline, monthlySaving, normalizeProjectData, rankCauses, suggestedStage, weeklySpending, weekStart } from "@/lib/dmaic";
import type { ProjectCause, Transaction } from "@/types";

const tx = (date: string, amount: number, category_id: string | null = "c1"): Transaction =>
  ({ id: date + amount, type: "expense", status: "cleared", deleted_at: null, date, amount, category_id, description: "x" }) as Transaction;

const cause = (text: string, g: number, u: number, t: number): ProjectCause => ({ id: text, group: "metodo", text, g, u, t, root: false });

describe("dmaic", () => {
  it("GUT multiplica e limita entre 1 e 5", () => {
    expect(gutScore({ g: 5, u: 4, t: 3 })).toBe(60);
    expect(gutScore({ g: 9, u: 0, t: 3 })).toBe(15);
  });

  it("ranqueia causas por GUT", () => {
    expect(rankCauses([cause("a", 1, 1, 1), cause("b", 5, 5, 5)])[0].text).toBe("b");
  });

  it("normaliza dados incompletos do banco", () => {
    expect(normalizeProjectData(null).causes).toEqual([]);
    expect(normalizeProjectData({ problem: "x", causes: "lixo" }).causes).toEqual([]);
  });

  it("sugere a etapa por onde continuar", () => {
    const d = normalizeProjectData({});
    expect(suggestedStage(d)).toBe("define");
    expect(suggestedStage({ ...d, problem: "p", target: 100 })).toBe("analyze");
    expect(suggestedStage({ ...d, problem: "p", target: 100, causes: [cause("a", 1, 1, 1)] })).toBe("improve");
  });

  it("semana começa na segunda", () => {
    expect(weekStart(new Date(2026, 9, 4)).getDate()).toBe(28); // domingo 04/10/2026 → segunda 28/09
    expect(weekStart(new Date(2026, 9, 5)).getDate()).toBe(5);
  });

  it("gasto semanal só considera semanas completas e a categoria", () => {
    const ref = new Date(2026, 9, 7); // quarta
    const pts = weeklySpending([tx("2026-09-29", 10), tx("2026-10-01", 5.1), tx("2026-10-01", 7, "c2"), tx("2026-10-06", 99)], 2, "c1", ref);
    expect(pts).toHaveLength(2);
    expect(pts[1].total).toBe(15.1);
    expect(pts.reduce((s, p) => s + p.total, 0)).toBe(15.1);
  });

  it("linha de base = média mensal dos últimos meses completos", () => {
    const ref = new Date(2026, 9, 7);
    expect(monthlyBaseline([tx("2026-07-10", 300), tx("2026-08-10", 300), tx("2026-09-10", 300), tx("2026-10-02", 999)], "c1", 3, ref)).toBe(300);
  });

  it("economia mensal nunca é negativa", () => {
    expect(monthlySaving({ baseline: 500, target: 350 })).toBe(150);
    expect(monthlySaving({ baseline: 100, target: 350 })).toBe(0);
    expect(monthlySaving({ baseline: null, target: 1 })).toBe(0);
  });
});
