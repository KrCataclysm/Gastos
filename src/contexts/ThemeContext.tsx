import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { shade } from "@/lib/color";
import { mix, normalizeHex, readableOn } from "@/lib/contrast";
import { CHOICE_COLORS } from "@/lib/palette";
import { getPreset, PRESETS, type Palette } from "@/lib/themePresets";

export type ThemeMode = "dark" | "light";
export type FontChoice =
  | "inter"
  | "roboto"
  | "poppins"
  | "nunito"
  | "montserrat"
  | "jetbrains-mono"
  | "merriweather"
  | "quicksand"
  | "lato"
  | "dm-sans"
  | "work-sans"
  | "space-grotesk"
  | "playfair-display"
  | "fira-code"
  | "raleway"
  | "oswald"
  | "ibm-plex-sans"
  | "atkinson-hyperlegible";

export interface ThemeState {
  mode: ThemeMode;
  fontFamily: FontChoice;
  accentColor: string;
  radius: number;
  bgColor: string;
  panelColor: string;
  panelAltColor: string;
  borderColor: string;
  fontColor: string;
  mutedColor: string;
  incomeColor: string;
  expenseColor: string;
  /** id de um tema pronto, ou "custom" quando o usuário editou cores manualmente */
  presetId: string;
  /** segue o claro/escuro do aparelho (usa os temas Claro/Escuro) */
  followSystem: boolean;
  a11y: A11y;
}

export interface A11y {
  /** escala da interface (0.9 – 1.3) */
  uiScale: number;
  wideSpacing: boolean;
  strongBorders: boolean;
  strongFocus: boolean;
  bigTargets: boolean;
  reduceMotion: boolean;
}

export const DEFAULT_A11Y: A11y = { uiScale: 1, wideSpacing: false, strongBorders: false, strongFocus: false, bigTargets: false, reduceMotion: false };

const FONT_STACKS: Record<FontChoice, string> = {
  "ibm-plex-sans": '"IBM Plex Sans", system-ui, sans-serif',
  inter: '"Inter", system-ui, sans-serif',
  roboto: '"Roboto", system-ui, sans-serif',
  poppins: '"Poppins", system-ui, sans-serif',
  nunito: '"Nunito", system-ui, sans-serif',
  montserrat: '"Montserrat", system-ui, sans-serif',
  "jetbrains-mono": '"JetBrains Mono", ui-monospace, monospace',
  merriweather: '"Merriweather", Georgia, serif',
  quicksand: '"Quicksand", system-ui, sans-serif',
  lato: '"Lato", system-ui, sans-serif',
  "dm-sans": '"DM Sans", system-ui, sans-serif',
  "work-sans": '"Work Sans", system-ui, sans-serif',
  "space-grotesk": '"Space Grotesk", system-ui, sans-serif',
  "playfair-display": '"Playfair Display", Georgia, serif',
  "fira-code": '"Fira Code", ui-monospace, monospace',
  raleway: '"Raleway", system-ui, sans-serif',
  oswald: '"Oswald", system-ui, sans-serif',
  "atkinson-hyperlegible": '"Atkinson Hyperlegible", system-ui, sans-serif',
};

export const FONT_OPTIONS: { value: FontChoice; label: string }[] = [
  { value: "ibm-plex-sans", label: "IBM Plex Sans (padrão)" },
  { value: "inter", label: "Inter" },
  { value: "roboto", label: "Roboto" },
  { value: "poppins", label: "Poppins" },
  { value: "nunito", label: "Nunito" },
  { value: "montserrat", label: "Montserrat" },
  { value: "lato", label: "Lato" },
  { value: "dm-sans", label: "DM Sans" },
  { value: "work-sans", label: "Work Sans" },
  { value: "space-grotesk", label: "Space Grotesk" },
  { value: "raleway", label: "Raleway" },
  { value: "oswald", label: "Oswald" },
  { value: "atkinson-hyperlegible", label: "Atkinson Hyperlegible (alta legibilidade)" },
  { value: "quicksand", label: "Quicksand" },
  { value: "playfair-display", label: "Playfair Display" },
  { value: "merriweather", label: "Merriweather" },
  { value: "jetbrains-mono", label: "JetBrains Mono" },
  { value: "fira-code", label: "Fira Code" },
];

export const ACCENT_PRESETS: readonly string[] = CHOICE_COLORS;

interface ModeDefaults {
  accentColor: string;
  bgColor: string;
  panelColor: string;
  panelAltColor: string;
  borderColor: string;
  fontColor: string;
  mutedColor: string;
  incomeColor: string;
  expenseColor: string;
}

function modeDefaults(mode: ThemeMode): ModeDefaults {
  const p = getPreset(mode === "dark" ? "escuro" : "claro")!.palette;
  return { accentColor: p.accent, bgColor: p.bg, panelColor: p.panel, panelAltColor: p.panelAlt, borderColor: p.border, fontColor: p.text, mutedColor: p.muted, incomeColor: p.income, expenseColor: p.expense };
}

function buildTheme(mode: ThemeMode, accentColor: string, radius: number, fontFamily: FontChoice): ThemeState {
  return {
    ...modeDefaults(mode),
    mode,
    fontFamily,
    accentColor,
    radius,
    presetId: "custom",
    followSystem: false,
    a11y: DEFAULT_A11Y,
  };
}

function fromPalette(p: Palette, presetId: string, keep: Pick<ThemeState, "fontFamily" | "radius" | "a11y" | "followSystem">): ThemeState {
  return {
    mode: p.mode,
    fontFamily: keep.fontFamily,
    radius: keep.radius,
    accentColor: p.accent,
    bgColor: p.bg,
    panelColor: p.panel,
    panelAltColor: p.panelAlt,
    borderColor: p.border,
    fontColor: p.text,
    mutedColor: p.muted,
    incomeColor: p.income,
    expenseColor: p.expense,
    presetId,
    followSystem: keep.followSystem,
    a11y: keep.a11y,
  };
}

export function toPalette(t: ThemeState): Palette {
  return { mode: t.mode, bg: t.bgColor, panel: t.panelColor, panelAlt: t.panelAltColor, text: t.fontColor, muted: t.mutedColor, border: t.borderColor, accent: t.accentColor, income: t.incomeColor, expense: t.expenseColor };
}

/** Padrão do app: Prumo claro/noturno conforme o aparelho. */
export function defaultTheme(): ThemeState {
  const base = buildTheme("light", modeDefaults("light").accentColor, 10, "ibm-plex-sans");
  return { ...base, presetId: "claro", followSystem: true };
}

const clampN = (n: unknown, min: number, max: number, d: number) => (typeof n === "number" && Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : d);
const flag = (v: unknown) => v === true;
const hexOr = (v: unknown, d: string) => (typeof v === "string" ? normalizeHex(v) : null) ?? d;

export function sanitizeA11y(raw: unknown): A11y {
  const a = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  return { uiScale: clampN(a.uiScale, 0.9, 1.3, 1), wideSpacing: flag(a.wideSpacing), strongBorders: flag(a.strongBorders), strongFocus: flag(a.strongFocus), bigTargets: flag(a.bigTargets), reduceMotion: flag(a.reduceMotion) };
}

/** Nunca confia no que veio do localStorage ou de um tema importado. */
export function sanitizeTheme(raw: unknown): ThemeState {
  const p = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const mode: ThemeMode = p.mode === "dark" ? "dark" : "light";
  const font = FONT_OPTIONS.some((f) => f.value === p.fontFamily) ? (p.fontFamily as FontChoice) : "ibm-plex-sans";
  const base = buildTheme(mode, hexOr(p.accentColor, modeDefaults(mode).accentColor), clampN(p.radius, 4, 28, 10), font);
  return {
    ...base,
    bgColor: hexOr(p.bgColor, base.bgColor),
    panelColor: hexOr(p.panelColor, base.panelColor),
    panelAltColor: hexOr(p.panelAltColor, base.panelAltColor),
    borderColor: hexOr(p.borderColor, base.borderColor),
    fontColor: hexOr(p.fontColor, base.fontColor),
    mutedColor: hexOr(p.mutedColor, base.mutedColor),
    incomeColor: hexOr(p.incomeColor, base.incomeColor),
    expenseColor: hexOr(p.expenseColor, base.expenseColor),
    presetId: typeof p.presetId === "string" && (p.presetId === "custom" || getPreset(p.presetId)) ? p.presetId : "custom",
    followSystem: flag(p.followSystem),
    a11y: sanitizeA11y(p.a11y),
  };
}

const STORAGE_KEY = "gastos:theme:v2";

function loadStored(): ThemeState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return sanitizeTheme(JSON.parse(raw));
  } catch {
    /* tema corrompido: volta ao padrão */
  }
  return defaultTheme();
}

export const CSS_CACHE_KEY = "gastos:css:v2";

/** Tokens de CSS derivados do tema. Função pura, usada também pelo cache do boot (sem piscar no carregamento). */
export function themeVars(theme: ThemeState): { vars: Record<string, string>; attrs: Record<string, string> } {
  const dark = theme.mode === "dark";
  const border = theme.a11y.strongBorders ? mix(theme.borderColor, theme.fontColor, 0.65) : theme.borderColor;
  const vars: Record<string, string> = {
    "--color-bg": theme.bgColor,
    "--color-panel": theme.panelColor,
    "--color-panel-alt": theme.panelAltColor,
    "--color-border": border,
    "--color-text": theme.fontColor,
    "--color-text-muted": theme.mutedColor,
    "--color-accent": theme.accentColor,
    "--color-accent-strong": dark ? mix(theme.accentColor, "#ffffff", 0.2) : mix(theme.accentColor, "#000000", 0.2),
    "--color-accent-soft": `${theme.accentColor}29`,
    "--color-on-accent": readableOn(theme.accentColor),
    "--color-income": theme.incomeColor,
    "--color-income-soft": `${theme.incomeColor}24`,
    "--color-expense": theme.expenseColor,
    "--color-expense-soft": `${theme.expenseColor}24`,
    "--chart-muted": mix(theme.mutedColor, theme.bgColor, 0.55),
    "--color-radius": `${theme.radius}px`,
    "--color-radius-sm": `${Math.max(6, theme.radius - 6)}px`,
    "--color-radius-lg": `${theme.radius + 6}px`,
    "--font-family": FONT_STACKS[theme.fontFamily],
    "--ui-scale": String(theme.a11y.uiScale),
  };
  const attrs: Record<string, string> = {
    "data-mode": theme.mode,
    "data-spacing": theme.a11y.wideSpacing ? "wide" : "normal",
    "data-focus": theme.a11y.strongFocus ? "strong" : "normal",
    "data-targets": theme.a11y.bigTargets ? "big" : "normal",
    "data-motion": theme.a11y.reduceMotion ? "reduce" : "normal",
    "data-scaled": theme.a11y.uiScale > 1 ? "true" : "false",
  };
  return { vars, attrs };
}

const fontLoaders = import.meta.glob("/node_modules/@fontsource/*/latin-{400,600,700}.css");
const fontLoaded = new Set<string>(["ibm-plex-sans"]);

/** Baixa a fonte escolhida sob demanda (a padrão já vem no CSS inicial). */
async function ensureFont(key: FontChoice): Promise<void> {
  if (fontLoaded.has(key)) return;
  fontLoaded.add(key);
  try {
    await Promise.all([400, 600, 700].map((w) => fontLoaders[`/node_modules/@fontsource/${key}/latin-${w}.css`]?.()));
  } catch {
    fontLoaded.delete(key);
  }
}

function applyTheme(theme: ThemeState) {
  const root = document.documentElement;
  const { vars, attrs } = themeVars(theme);
  for (const [k, v] of Object.entries(vars)) root.style.setProperty(k, v);
  for (const [k, v] of Object.entries(attrs)) root.setAttribute(k, v);
  root.style.colorScheme = theme.mode;
  void ensureFont(theme.fontFamily);
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", theme.panelColor);
  try {
    localStorage.setItem(CSS_CACHE_KEY, JSON.stringify({ vars, attrs, scheme: theme.mode, themeColor: theme.panelColor }));
  } catch {
    /* ignora */
  }
}

interface ThemeContextValue {
  theme: ThemeState;
  setMode: (mode: ThemeMode) => void;
  setAccentColor: (color: string) => void;
  setRadius: (radius: number) => void;
  setFontFamily: (font: FontChoice) => void;
  setBgColor: (color: string) => void;
  setPanelColor: (color: string) => void;
  resetBgColor: () => void;
  resetPanelColor: () => void;
  applyPreset: (id: string) => void;
  setFollowSystem: () => void;
  setColor: (key: "fontColor" | "mutedColor" | "borderColor" | "panelAltColor" | "incomeColor" | "expenseColor", color: string) => void;
  setA11y: (patch: Partial<A11y>) => void;
  importTheme: (raw: unknown) => void;
  resetAll: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<ThemeState>(loadStored);
  const [systemDark, setSystemDark] = useState(() => matchMedia("(prefers-color-scheme: dark)").matches);
  const [systemReduce, setSystemReduce] = useState(() => matchMedia("(prefers-reduced-motion: reduce)").matches);

  useEffect(() => {
    const dark = matchMedia("(prefers-color-scheme: dark)");
    const motion = matchMedia("(prefers-reduced-motion: reduce)");
    const a = (e: MediaQueryListEvent) => setSystemDark(e.matches);
    const b = (e: MediaQueryListEvent) => setSystemReduce(e.matches);
    dark.addEventListener("change", a);
    motion.addEventListener("change", b);
    return () => {
      dark.removeEventListener("change", a);
      motion.removeEventListener("change", b);
    };
  }, []);

  // Tema efetivo: no modo automático, o claro/escuro vem do aparelho; "reduzir movimento" do sistema também vale.
  const effective = useMemo<ThemeState>(() => {
    let t = theme;
    if (t.followSystem) {
      const p = getPreset(systemDark ? "escuro" : "claro")!;
      t = fromPalette(p.palette, p.id, { fontFamily: t.fontFamily, radius: t.radius, a11y: t.a11y, followSystem: true });
    }
    if (systemReduce && !t.a11y.reduceMotion) t = { ...t, a11y: { ...t.a11y, reduceMotion: true } };
    return t;
  }, [theme, systemDark, systemReduce]);

  useEffect(() => {
    applyTheme(effective);
  }, [effective]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(theme));
    } catch {
      /* armazenamento bloqueado: vale só nesta sessão */
    }
  }, [theme]);

  const keep = (t: ThemeState) => ({ fontFamily: t.fontFamily, radius: t.radius, a11y: t.a11y, followSystem: false });
  // Edição manual de qualquer cor: vira "custom" e desliga o modo automático.
  const edit = useCallback((patch: Partial<ThemeState>) => setTheme((t) => ({ ...t, ...patch, presetId: "custom", followSystem: false })), []);

  const setMode = useCallback((mode: ThemeMode) => {
    setTheme((t) => {
      const p = getPreset(mode === "dark" ? "escuro" : "claro")!;
      return { ...fromPalette(p.palette, p.id, keep(t)), accentColor: t.accentColor };
    });
  }, []);
  const setAccentColor = useCallback((accentColor: string) => edit({ accentColor }), [edit]);
  const setRadius = useCallback((radius: number) => setTheme((t) => ({ ...t, radius })), []);
  const setFontFamily = useCallback((fontFamily: FontChoice) => setTheme((t) => ({ ...t, fontFamily })), []);
  const setBgColor = useCallback((bgColor: string) => edit({ bgColor }), [edit]);
  const setPanelColor = useCallback(
    (panelColor: string) => setTheme((t) => ({ ...t, panelColor, panelAltColor: shade(panelColor, t.mode === "dark" ? 0.08 : -0.06), presetId: "custom", followSystem: false })),
    [],
  );
  const resetBgColor = useCallback(() => setTheme((t) => ({ ...t, bgColor: modeDefaults(t.mode).bgColor, presetId: "custom" })), []);
  const resetPanelColor = useCallback(
    () => setTheme((t) => ({ ...t, panelColor: modeDefaults(t.mode).panelColor, panelAltColor: modeDefaults(t.mode).panelAltColor, presetId: "custom" })),
    [],
  );
  const applyPreset = useCallback((id: string) => {
    const p = getPreset(id);
    if (p) setTheme((t) => fromPalette(p.palette, p.id, keep(t)));
  }, []);
  const setFollowSystem = useCallback(() => setTheme((t) => ({ ...t, followSystem: true, presetId: "custom" })), []);
  const setColor = useCallback<ThemeContextValue["setColor"]>((key, color) => {
    const hex = normalizeHex(color);
    if (hex) edit({ [key]: hex } as Partial<ThemeState>);
  }, [edit]);
  const setA11y = useCallback((patch: Partial<A11y>) => setTheme((t) => ({ ...t, a11y: sanitizeA11y({ ...t.a11y, ...patch }) })), []);
  const importTheme = useCallback((raw: unknown) => setTheme((t) => ({ ...sanitizeTheme(raw), a11y: t.a11y, fontFamily: t.fontFamily, radius: t.radius, followSystem: false })), []);
  const resetAll = useCallback(() => setTheme(defaultTheme()), []);

  const value = useMemo(
    () => ({ theme: effective, setMode, setAccentColor, setRadius, setFontFamily, setBgColor, setPanelColor, resetBgColor, resetPanelColor, applyPreset, setFollowSystem, setColor, setA11y, importTheme, resetAll }),
    [effective, setMode, setAccentColor, setRadius, setFontFamily, setBgColor, setPanelColor, resetBgColor, resetPanelColor, applyPreset, setFollowSystem, setColor, setA11y, importTheme, resetAll],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export { PRESETS };

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme deve ser usado dentro de ThemeProvider");
  return ctx;
}
