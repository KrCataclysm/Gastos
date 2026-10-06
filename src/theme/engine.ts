import { contrast, mix, readableOn } from "./colors";
import { FONTS, CSS_CACHE_KEY, type FontKey, type Prefs } from "./prefs";
import { getPreset, PRESETS, type Palette } from "./presets";

export interface Resolved {
  palette: Palette;
  vars: Record<string, string>;
  attrs: Record<string, string>;
  scheme: "light" | "dark";
  themeColor: string;
}

/** Paleta efetiva: "auto" segue o sistema; "custom" usa a paleta do usuário; senão, preset. */
export function resolvePalette(prefs: Prefs, systemDark: boolean): Palette {
  if (prefs.themeId === "custom") return prefs.custom;
  if (prefs.themeId === "auto") return PRESETS[systemDark ? 1 : 0]!.palette;
  return (getPreset(prefs.themeId) ?? PRESETS[0]!).palette;
}

/** Deriva todos os tokens de CSS a partir da paleta + preferências. Função pura (testada). */
export function resolveTheme(prefs: Prefs, systemDark: boolean): Resolved {
  const p = resolvePalette(prefs, systemDark);
  const dark = p.mode === "dark";
  const accentStrong = dark ? mix(p.accent, "#ffffff", 0.25) : mix(p.accent, "#000000", 0.22);
  const warn = dark ? "#fbbf24" : "#a14b08";
  const border = prefs.a11y.strongBorders ? mix(p.border, p.text, 0.65) : p.border;
  const soft = (c: string) => mix(p.surface, c, dark ? 0.22 : 0.14);
  const font = FONTS.find((f) => f.key === prefs.font)?.stack ?? FONTS[0]!.stack;
  const r = prefs.radius;
  const vars: Record<string, string> = {
    "--bg": p.bg,
    "--surface": p.surface,
    "--surface-2": p.surface2,
    "--text": p.text,
    "--muted": p.muted,
    "--border": border,
    "--accent": p.accent,
    "--accent-strong": accentStrong,
    "--accent-soft": soft(p.accent),
    "--on-accent": readableOn(p.accent),
    "--income": p.income,
    "--expense": p.expense,
    "--warn": warn,
    "--warn-soft": soft(warn),
    "--danger-soft": soft(p.expense),
    "--good-soft": soft(p.income),
    "--info-soft": soft("#0ea5e9"),
    "--chart-muted": mix(p.muted, p.bg, 0.55),
    "--bar-income": p.accent,
    "--bar-expense": dark ? "#fb923c" : "#ea580c",
    "--shadow": dark ? "0 1px 2px rgb(0 0 0 / 40%)" : "0 1px 2px rgb(15 27 33 / 6%), 0 4px 16px rgb(15 27 33 / 5%)",
    "--radius": `${r}px`,
    "--radius-sm": `${Math.round(r * 0.65)}px`,
    "--font": font,
    "--font-scale": String(prefs.a11y.textScale),
  };
  const attrs: Record<string, string> = {
    "data-theme": p.mode,
    "data-spacing": prefs.a11y.wideSpacing ? "wide" : "normal",
    "data-focus": prefs.a11y.strongFocus ? "strong" : "normal",
    "data-targets": prefs.a11y.bigTargets ? "big" : "normal",
    "data-motion": prefs.a11y.reduceMotion ? "reduce" : "normal",
  };
  return { palette: p, vars, attrs, scheme: p.mode, themeColor: p.accent };
}

export interface ContrastCheck {
  label: string;
  ratio: number;
  /** mínimo exigido pelo WCAG AA para esse par */
  required: number;
  ok: boolean;
}

/** Pares de cores que precisam ser legíveis; usado pelo editor de tema para avisar o usuário. */
export function checkContrast(p: Palette): ContrastCheck[] {
  const pairs: [string, string, string, number][] = [
    ["Texto sobre fundo", p.text, p.bg, 4.5],
    ["Texto sobre painéis", p.text, p.surface, 4.5],
    ["Texto secundário sobre painéis", p.muted, p.surface, 4.5],
    ["Botão de destaque (texto)", readableOn(p.accent), p.accent, 4.5],
    ["Destaque sobre painéis (links, ícones)", p.accent, p.surface, 3],
    ["Receitas sobre painéis", p.income, p.surface, 4.5],
    ["Despesas sobre painéis", p.expense, p.surface, 4.5],
  ];
  return pairs.map(([label, a, b, required]) => {
    const ratio = contrast(a, b);
    return { label, ratio, required, ok: ratio >= required };
  });
}

/* ------------------------------------------------------------------ Aplicação no DOM */

const loaded = new Set<FontKey>(["inter"]);
const FONT_LOADERS: Partial<Record<FontKey, () => Promise<unknown>>> = {
  atkinson: () => Promise.all([import("@fontsource/atkinson-hyperlegible/latin-400.css"), import("@fontsource/atkinson-hyperlegible/latin-700.css")]),
  roboto: () => Promise.all([import("@fontsource/roboto/latin-400.css"), import("@fontsource/roboto/latin-600.css"), import("@fontsource/roboto/latin-700.css")]),
  poppins: () => Promise.all([import("@fontsource/poppins/latin-400.css"), import("@fontsource/poppins/latin-600.css"), import("@fontsource/poppins/latin-700.css")]),
  nunito: () => Promise.all([import("@fontsource/nunito/latin-400.css"), import("@fontsource/nunito/latin-600.css"), import("@fontsource/nunito/latin-700.css")]),
  montserrat: () => Promise.all([import("@fontsource/montserrat/latin-400.css"), import("@fontsource/montserrat/latin-600.css"), import("@fontsource/montserrat/latin-700.css")]),
  quicksand: () => Promise.all([import("@fontsource/quicksand/latin-400.css"), import("@fontsource/quicksand/latin-600.css"), import("@fontsource/quicksand/latin-700.css")]),
  merriweather: () => Promise.all([import("@fontsource/merriweather/latin-400.css"), import("@fontsource/merriweather/latin-700.css")]),
  "jetbrains-mono": () => Promise.all([import("@fontsource/jetbrains-mono/latin-400.css"), import("@fontsource/jetbrains-mono/latin-600.css"), import("@fontsource/jetbrains-mono/latin-700.css")]),
};

/** Carrega a fonte sob demanda (só quem escolhe paga o download). */
export async function ensureFont(key: FontKey): Promise<void> {
  if (loaded.has(key)) return;
  loaded.add(key);
  try {
    await FONT_LOADERS[key]?.();
  } catch {
    loaded.delete(key); // offline: tenta de novo na próxima vez
  }
}

export function applyTheme(prefs: Prefs, systemDark: boolean): void {
  const r = resolveTheme(prefs, systemDark);
  const root = document.documentElement;
  for (const [k, v] of Object.entries(r.vars)) root.style.setProperty(k, v);
  for (const [k, v] of Object.entries(r.attrs)) root.setAttribute(k, v);
  root.style.colorScheme = r.scheme;
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", r.palette.surface);
  void ensureFont(prefs.font);
  try {
    // cache para o theme-boot.js pintar a cor certa antes do React carregar (sem "flash")
    localStorage.setItem(CSS_CACHE_KEY, JSON.stringify({ vars: r.vars, attrs: r.attrs, scheme: r.scheme, themeColor: r.palette.surface }));
  } catch {
    /* ignora */
  }
}
