import { describe, expect, it } from "vitest";
import { controlChart, histogram, mean, stdev, sturges } from "@/lib/stats";

describe("stats", () => {
  it("média e desvio amostral", () => {
    expect(mean([2, 4, 6])).toBe(4);
    expect(stdev([2, 4, 4, 4, 5, 5, 7, 9])).toBeCloseTo(2.138, 3);
    expect(stdev([5])).toBe(0);
  });

  it("gráfico de controle exige 5 pontos", () => {
    expect(controlChart([1, 2, 3, 4])).toBeNull();
  });

  it("limites I-MR e ponto fora de controle", () => {
    const c = controlChart([100, 102, 98, 101, 99, 100, 300])!;
    expect(c.outOfControl).toContain(6);
    expect(c.lcl).toBeGreaterThanOrEqual(0);
    expect(c.ucl).toBeGreaterThan(c.center);
  });

  it("detecta 7 pontos seguidos do mesmo lado", () => {
    const c = controlChart([10, 10, 20, 21, 22, 23, 24, 25, 26, 5, 5])!;
    expect(c.runs.length).toBeGreaterThan(0);
  });

  it("Sturges e histograma conservam a contagem", () => {
    expect(sturges(1)).toBe(1);
    expect(sturges(30)).toBe(6);
    const v = [1, 2, 2, 3, 3, 3, 4, 4, 5, 9];
    const h = histogram(v);
    expect(h.reduce((s, b) => s + b.count, 0)).toBe(v.length);
    expect(histogram([4, 4, 4])).toEqual([{ from: 4, to: 4, count: 3 }]);
    expect(histogram([])).toEqual([]);
  });
});
