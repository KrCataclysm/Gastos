import { describe, expect, it } from "vitest";
import { sanitizeA11y, sanitizeTheme, themeVars } from "@/contexts/ThemeContext";
import { contrast } from "@/lib/contrast";
import { checkContrast } from "@/lib/themeChecks";
import { PRESETS } from "@/lib/themePresets";

describe("temas prontos", () => {
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

describe("sanitizeTheme (não confia em localStorage nem em tema importado)", () => {
  it("aceita o formato antigo salvo pelo app (sem campos novos)", () => {
    const t = sanitizeTheme({ mode: "light", fontFamily: "poppins", accentColor: "#10b981", radius: 20, bgColor: "#ffffff", panelColor: "#fafafa", panelAltColor: "#eeeeee" });
    expect(t.mode).toBe("light");
    expect(t.fontFamily).toBe("poppins");
    expect(t.accentColor).toBe("#10b981");
    expect(t.radius).toBe(20);
    expect(t.a11y.uiScale).toBe(1);
    expect(t.followSystem).toBe(false);
  });
  it("descarta valores inválidos e limita faixas", () => {
    const t = sanitizeTheme({ mode: "x", fontFamily: "comic", accentColor: "red", radius: 999, presetId: "<script>", a11y: { uiScale: 9, wideSpacing: "sim" } });
    expect(t.mode).toBe("dark");
    expect(t.fontFamily).toBe("inter");
    expect(t.accentColor).toBe("#6064f0");
    expect(t.radius).toBe(28);
    expect(t.presetId).toBe("custom");
    expect(t.a11y.uiScale).toBe(1.3);
    expect(t.a11y.wideSpacing).toBe(false);
  });
  it("aceita lixo total sem lançar", () => {
    expect(() => sanitizeTheme(null)).not.toThrow();
    expect(() => sanitizeTheme("x")).not.toThrow();
    expect(sanitizeA11y(42).uiScale).toBe(1);
  });
});

describe("themeVars", () => {
  it("aplica escala, atributos e cor legível sobre o destaque", () => {
    const base = sanitizeTheme({});
    const { vars, attrs } = themeVars({ ...base, accentColor: "#ffd60a", a11y: { ...base.a11y, uiScale: 1.15, wideSpacing: true, reduceMotion: true, bigTargets: true } });
    expect(vars["--ui-scale"]).toBe("1.15");
    expect(attrs["data-spacing"]).toBe("wide");
    expect(attrs["data-motion"]).toBe("reduce");
    expect(attrs["data-targets"]).toBe("big");
    expect(contrast(vars["--color-on-accent"]!, "#ffd60a")).toBeGreaterThanOrEqual(4.5);
  });
  it("bordas reforçadas aumentam o contraste da borda", () => {
    const base = sanitizeTheme({ mode: "light", bgColor: "#ffffff", panelColor: "#ffffff" });
    const normal = themeVars(base).vars["--color-border"]!;
    const strong = themeVars({ ...base, a11y: { ...base.a11y, strongBorders: true } }).vars["--color-border"]!;
    expect(contrast(strong, "#ffffff")).toBeGreaterThan(contrast(normal, "#ffffff"));
  });
});
