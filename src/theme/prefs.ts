import { normalizeHex } from "./colors";
import { PRESETS, type Palette } from "./presets";

export type FontKey = "inter" | "atkinson" | "roboto" | "poppins" | "nunito" | "montserrat" | "jetbrains-mono" | "merriweather" | "quicksand";

export const FONTS: { key: FontKey; label: string; stack: string; note?: string }[] = [
  { key: "inter", label: "Inter", stack: '"Inter Variable", system-ui, sans-serif', note: "Padrão" },
  { key: "atkinson", label: "Atkinson Hyperlegible", stack: '"Atkinson Hyperlegible", system-ui, sans-serif', note: "Feita para baixa visão" },
  { key: "roboto", label: "Roboto", stack: '"Roboto", system-ui, sans-serif' },
  { key: "poppins", label: "Poppins", stack: '"Poppins", system-ui, sans-serif' },
  { key: "nunito", label: "Nunito", stack: '"Nunito", system-ui, sans-serif' },
  { key: "montserrat", label: "Montserrat", stack: '"Montserrat", system-ui, sans-serif' },
  { key: "quicksand", label: "Quicksand", stack: '"Quicksand", system-ui, sans-serif' },
  { key: "merriweather", label: "Merriweather", stack: '"Merriweather", Georgia, serif', note: "Serifada" },
  { key: "jetbrains-mono", label: "JetBrains Mono", stack: '"JetBrains Mono", ui-monospace, monospace', note: "Monoespaçada" },
];

export interface A11y {
  textScale: number; // 0.9 – 1.5
  wideSpacing: boolean;
  strongBorders: boolean;
  strongFocus: boolean;
  bigTargets: boolean;
  reduceMotion: boolean;
}

export interface Avatar {
  emoji: string;
  color: string;
}

export interface Prefs {
  v: 1;
  /** "auto" segue o sistema; id de preset; ou "custom". */
  themeId: string;
  custom: Palette;
  font: FontKey;
  radius: number; // 0 – 24 px
  a11y: A11y;
  avatar: Avatar;
}

export const DEFAULT_PREFS: Prefs = {
  v: 1,
  themeId: "auto",
  custom: PRESETS[0]!.palette,
  font: "inter",
  radius: 14,
  a11y: { textScale: 1, wideSpacing: false, strongBorders: false, strongFocus: false, bigTargets: false, reduceMotion: false },
  avatar: { emoji: "", color: "#0f766e" },
};

export const STORAGE_KEY = "gastos:prefs";
export const CSS_CACHE_KEY = "gastos:css";

const clamp = (n: unknown, min: number, max: number, fallback: number) => (typeof n === "number" && Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : fallback);
const bool = (v: unknown, fallback: boolean) => (typeof v === "boolean" ? v : fallback);

/** Sanitiza qualquer coisa vinda do localStorage ou de um tema importado: nunca confia no formato. */
export function sanitizePalette(raw: unknown, fallback: Palette): Palette {
  const o = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const hex = (k: keyof Palette) => (typeof o[k] === "string" ? normalizeHex(o[k] as string) : null) ?? (fallback[k] as string);
  return {
    mode: o.mode === "dark" ? "dark" : o.mode === "light" ? "light" : fallback.mode,
    bg: hex("bg"), surface: hex("surface"), surface2: hex("surface2"), text: hex("text"), muted: hex("muted"), border: hex("border"), accent: hex("accent"), income: hex("income"), expense: hex("expense"),
  };
}

export function sanitizePrefs(raw: unknown): Prefs {
  const o = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const a = (o.a11y && typeof o.a11y === "object" ? o.a11y : {}) as Record<string, unknown>;
  const av = (o.avatar && typeof o.avatar === "object" ? o.avatar : {}) as Record<string, unknown>;
  const d = DEFAULT_PREFS;
  const themeId = typeof o.themeId === "string" && (o.themeId === "auto" || o.themeId === "custom" || PRESETS.some((p) => p.id === o.themeId)) ? o.themeId : d.themeId;
  const font = FONTS.some((f) => f.key === o.font) ? (o.font as FontKey) : d.font;
  return {
    v: 1,
    themeId,
    custom: sanitizePalette(o.custom, d.custom),
    font,
    radius: clamp(o.radius, 0, 24, d.radius),
    a11y: {
      textScale: clamp(a.textScale, 0.9, 1.5, 1),
      wideSpacing: bool(a.wideSpacing, false),
      strongBorders: bool(a.strongBorders, false),
      strongFocus: bool(a.strongFocus, false),
      bigTargets: bool(a.bigTargets, false),
      reduceMotion: bool(a.reduceMotion, false),
    },
    avatar: {
      emoji: typeof av.emoji === "string" ? [...av.emoji].slice(0, 2).join("") : "",
      color: (typeof av.color === "string" ? normalizeHex(av.color) : null) ?? d.avatar.color,
    },
  };
}

export function loadPrefs(): Prefs {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? sanitizePrefs(JSON.parse(raw)) : DEFAULT_PREFS;
  } catch {
    return DEFAULT_PREFS;
  }
}

export function savePrefs(p: Prefs): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(p));
  } catch {
    /* armazenamento bloqueado: o tema vale só nesta sessão */
  }
}
