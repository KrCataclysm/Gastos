import { describe, expect, it } from "vitest";
import { contrast, luminance, mix, normalizeHex, readableOn, wcagLevel } from "@/lib/contrast";

describe("contraste WCAG", () => {
  it("normaliza hex e rejeita lixo", () => {
    expect(normalizeHex("#ABC")).toBe("#aabbcc");
    expect(normalizeHex("0f766e")).toBe("#0f766e");
    expect(normalizeHex("verde")).toBeNull();
    expect(normalizeHex("#12345")).toBeNull();
  });
  it("valores de referência", () => {
    expect(contrast("#000000", "#ffffff")).toBeCloseTo(21, 1);
    expect(contrast("#ffffff", "#ffffff")).toBeCloseTo(1, 5);
    expect(contrast("#767676", "#ffffff")).toBeCloseTo(4.54, 1);
    expect(luminance("#000000")).toBe(0);
  });
  it("readableOn escolhe preto ou branco", () => {
    expect(readableOn("#ffd60a")).toBe("#0b0b0b");
    expect(readableOn("#1d4ed8")).toBe("#ffffff");
  });
  it("mix e níveis", () => {
    expect(mix("#000000", "#ffffff", 0.5)).toBe("#808080");
    expect(wcagLevel(7.1)).toBe("AAA");
    expect(wcagLevel(2)).toBe("falha");
  });
});
