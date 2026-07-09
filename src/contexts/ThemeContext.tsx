import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { shade } from "@/lib/color";

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
  | "oswald";

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
}

const FONT_STACKS: Record<FontChoice, string> = {
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
};

export const FONT_OPTIONS: { value: FontChoice; label: string }[] = [
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
  { value: "quicksand", label: "Quicksand" },
  { value: "playfair-display", label: "Playfair Display" },
  { value: "merriweather", label: "Merriweather" },
  { value: "jetbrains-mono", label: "JetBrains Mono" },
  { value: "fira-code", label: "Fira Code" },
];

export const ACCENT_PRESETS = [
  "#6366f1",
  "#4f46e5",
  "#3b82f6",
  "#0ea5e9",
  "#06b6d4",
  "#14b8a6",
  "#10b981",
  "#22c55e",
  "#84cc16",
  "#eab308",
  "#f59e0b",
  "#f97316",
  "#ef4444",
  "#ec4899",
  "#d946ef",
  "#8b5cf6",
];

interface ModeDefaults {
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
  const dark = mode === "dark";
  return {
    bgColor: dark ? "#0d1120" : "#f3f5fb",
    panelColor: dark ? "#151b30" : "#ffffff",
    panelAltColor: dark ? "#1b2340" : "#edf0f9",
    borderColor: dark ? "#262f4d" : "#dde3f0",
    fontColor: dark ? "#f1f3fb" : "#12172b",
    mutedColor: dark ? "#93a0c2" : "#5b6684",
    incomeColor: dark ? "#22c55e" : "#15803d",
    expenseColor: dark ? "#f43f5e" : "#be123c",
  };
}

function buildTheme(mode: ThemeMode, accentColor: string, radius: number, fontFamily: FontChoice): ThemeState {
  return {
    mode,
    fontFamily,
    accentColor,
    radius,
    ...modeDefaults(mode),
  };
}

const STORAGE_KEY = "gastos:theme";

function loadStored(): ThemeState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      const base = buildTheme(parsed.mode ?? "dark", parsed.accentColor ?? "#6366f1", parsed.radius ?? 16, parsed.fontFamily ?? "inter");
      return {
        ...base,
        bgColor: parsed.bgColor ?? base.bgColor,
        panelColor: parsed.panelColor ?? base.panelColor,
        panelAltColor: parsed.panelAltColor ?? base.panelAltColor,
      };
    }
  } catch {
    /* ignore corrupted theme */
  }
  return buildTheme("dark", "#6366f1", 16, "inter");
}

function applyTheme(theme: ThemeState) {
  const root = document.documentElement;
  root.style.setProperty("--color-bg", theme.bgColor);
  root.style.setProperty("--color-panel", theme.panelColor);
  root.style.setProperty("--color-panel-alt", theme.panelAltColor);
  root.style.setProperty("--color-border", theme.borderColor);
  root.style.setProperty("--color-text", theme.fontColor);
  root.style.setProperty("--color-text-muted", theme.mutedColor);
  root.style.setProperty("--color-accent", theme.accentColor);
  root.style.setProperty("--color-accent-strong", theme.accentColor);
  root.style.setProperty("--color-accent-soft", `${theme.accentColor}29`);
  root.style.setProperty("--color-income", theme.incomeColor);
  root.style.setProperty("--color-expense", theme.expenseColor);
  root.style.setProperty("--color-radius", `${theme.radius}px`);
  root.style.setProperty("--color-radius-sm", `${Math.max(6, theme.radius - 6)}px`);
  root.style.setProperty("--color-radius-lg", `${theme.radius + 6}px`);
  root.style.setProperty("--font-family", FONT_STACKS[theme.fontFamily]);
  root.style.colorScheme = theme.mode;
  root.setAttribute("data-mode", theme.mode);
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
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<ThemeState>(loadStored);

  useEffect(() => {
    applyTheme(theme);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(theme));
  }, [theme]);

  const setMode = useCallback((mode: ThemeMode) => {
    setTheme((t) => buildTheme(mode, t.accentColor, t.radius, t.fontFamily));
  }, []);
  const setAccentColor = useCallback((accentColor: string) => {
    setTheme((t) => ({ ...t, accentColor }));
  }, []);
  const setRadius = useCallback((radius: number) => {
    setTheme((t) => ({ ...t, radius }));
  }, []);
  const setFontFamily = useCallback((fontFamily: FontChoice) => {
    setTheme((t) => ({ ...t, fontFamily }));
  }, []);
  const setBgColor = useCallback((bgColor: string) => {
    setTheme((t) => ({ ...t, bgColor }));
  }, []);
  const setPanelColor = useCallback((panelColor: string) => {
    setTheme((t) => ({
      ...t,
      panelColor,
      panelAltColor: shade(panelColor, t.mode === "dark" ? 0.08 : -0.06),
    }));
  }, []);
  const resetBgColor = useCallback(() => {
    setTheme((t) => ({ ...t, bgColor: modeDefaults(t.mode).bgColor }));
  }, []);
  const resetPanelColor = useCallback(() => {
    setTheme((t) => ({
      ...t,
      panelColor: modeDefaults(t.mode).panelColor,
      panelAltColor: modeDefaults(t.mode).panelAltColor,
    }));
  }, []);

  const value = useMemo(
    () => ({ theme, setMode, setAccentColor, setRadius, setFontFamily, setBgColor, setPanelColor, resetBgColor, resetPanelColor }),
    [theme, setMode, setAccentColor, setRadius, setFontFamily, setBgColor, setPanelColor, resetBgColor, resetPanelColor],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme deve ser usado dentro de ThemeProvider");
  return ctx;
}
