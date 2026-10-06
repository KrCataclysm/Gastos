import { describe, expect, it } from "vitest";
import { contrast, luminance, mix, normalizeHex, readableOn, wcagLevel } from "../src/theme/colors";
import { checkContrast, resolveTheme } from "../src/theme/engine";
import { DEFAULT_PREFS, sanitizePrefs } from "../src/theme/prefs";
import { PRESETS } from "../src/theme/presets";

describe("cores", () => {
  it("normaliza hex e rejeita lixo", () => {
    expect(normalizeHex("#ABC")).toBe("#aabbcc");
    expect(normalizeHex("0f766e")).toBe("#0f766e");
    expect(normalizeHex("verde")).toBeNull();
    expect(normalizeHex("#12345")).toBeNull();
  });
  it("contraste WCAG: valores de referência", () => {
    expect(contrast("#000000", "#ffffff")).toBeCloseTo(21, 1);
    expect(contrast("#ffffff", "#ffffff")).toBeCloseTo(1, 5);
    expect(contrast("#767676", "#ffffff")).toBeCloseTo(4.54, 1); // cinza clássico que passa AA
    expect(luminance("#000000")).toBe(0);
  });
  it("readableOn escolhe preto ou branco", () => {
    expect(readableOn("#ffd60a")).toBe("#0b0b0b");
    expect(readableOn("#0f766e")).toBe("#ffffff");
  });
  it("mix e níveis", () => {
    expect(mix("#000000", "#ffffff", 0.5)).toBe("#808080");
    expect(wcagLevel(7.1)).toBe("AAA");
    expect(wcagLevel(2)).toBe("falha");
  });
});

describe("presets", () => {
  it.each(PRESETS.map((p) => [p.name, p] as const))("%s atende WCAG AA nos pares essenciais", (_n, preset) => {
    const failed = checkContrast(preset.palette).filter((c) => !c.ok).map((c) => `${c.label}: ${c.ratio.toFixed(2)}`);
    expect(failed).toEqual([]);
  });
  it("alto contraste chega a AAA no texto", () => {
    for (const id of ["contraste-claro", "contraste-escuro"]) {
      const p = PRESETS.find((x) => x.id === id)!.palette;
      expect(contrast(p.text, p.bg)).toBeGreaterThanOrEqual(7);
    }
  });
});

describe("resolveTheme", () => {
  it("auto segue o sistema", () => {
    expect(resolveTheme(DEFAULT_PREFS, true).scheme).toBe("dark");
    expect(resolveTheme(DEFAULT_PREFS, false).scheme).toBe("light");
  });
  it("aplica escala de texto, raio e atributos de acessibilidade", () => {
    const r = resolveTheme({ ...DEFAULT_PREFS, radius: 20, a11y: { ...DEFAULT_PREFS.a11y, textScale: 1.3, wideSpacing: true, reduceMotion: true, bigTargets: true } }, false);
    expect(r.vars["--font-scale"]).toBe("1.3");
    expect(r.vars["--radius"]).toBe("20px");
    expect(r.attrs["data-spacing"]).toBe("wide");
    expect(r.attrs["data-motion"]).toBe("reduce");
    expect(r.attrs["data-targets"]).toBe("big");
  });
  it("bordas reforçadas escurecem a borda", () => {
    const base = resolveTheme(DEFAULT_PREFS, false).vars["--border"]!;
    const strong = resolveTheme({ ...DEFAULT_PREFS, a11y: { ...DEFAULT_PREFS.a11y, strongBorders: true } }, false).vars["--border"]!;
    expect(contrast(strong, "#ffffff")).toBeGreaterThan(contrast(base, "#ffffff"));
  });
  it("on-accent sempre legível sobre o destaque escolhido", () => {
    for (const accent of ["#ffd60a", "#0f766e", "#7c3aed", "#facc15"]) {
      const r = resolveTheme({ ...DEFAULT_PREFS, themeId: "custom", custom: { ...DEFAULT_PREFS.custom, accent } }, false);
      expect(contrast(r.vars["--on-accent"]!, accent)).toBeGreaterThanOrEqual(4.5);
    }
  });
});

describe("sanitizePrefs (não confia em dados externos)", () => {
  it("descarta valores inválidos e limita faixas", () => {
    const p = sanitizePrefs({ themeId: "<script>", font: "comic", radius: 999, a11y: { textScale: 9, wideSpacing: "sim" }, custom: { accent: "red", bg: "#FFF", mode: "x" }, avatar: { emoji: "😀😀😀", color: "nope" } });
    expect(p.themeId).toBe("auto");
    expect(p.font).toBe("inter");
    expect(p.radius).toBe(24);
    expect(p.a11y.textScale).toBe(1.5);
    expect(p.a11y.wideSpacing).toBe(false);
    expect(p.custom.accent).toBe(DEFAULT_PREFS.custom.accent);
    expect(p.custom.bg).toBe("#ffffff");
    expect(p.avatar.emoji).toBe("😀😀");
    expect(p.avatar.color).toBe(DEFAULT_PREFS.avatar.color);
  });
  it("aceita lixo total sem lançar", () => {
    expect(sanitizePrefs(null)).toEqual(DEFAULT_PREFS);
    expect(sanitizePrefs("x")).toEqual(DEFAULT_PREFS);
  });
});
