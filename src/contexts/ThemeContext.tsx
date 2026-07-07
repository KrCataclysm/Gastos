import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type ThemeMode = "dark" | "light";
export type FontChoice =
  | "inter"
  | "roboto"
  | "poppins"
  | "nunito"
  | "montserrat"
  | "jetbrains-mono"
  | "merriweather"
  | "quicksand";

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
};

export const FONT_OPTIONS: { value: FontChoice; label: string }[] = [
  { value: "inter", label: "Inter" },
  { value: "roboto", label: "Roboto" },
  { value: "poppins", label: "Poppins" },
  { value: "nunito", label: "Nunito" },
  { value: "montserrat", label: "Montserrat" },
  { value: "jetbrains-mono", label: "JetBrains Mono" },
  { value: "merriweather", label: "Merriweather" },
  { value: "quicksand", label: "Quicksand" },
];

export const ACCENT_PRESETS = [
  "#6366f1",
  "#4f46e5",
  "#0ea5e9",
  "#22c55e",
  "#f59e0b",
  "#ec4899",
  "#ef4444",
  "#14b8a6",
];

function buildTheme(mode: ThemeMode, accentColor: string, radius: number, fontFamily: FontChoice): ThemeState {
  const dark = mode === "dark";
  return {
    mode,
    fontFamily,
    accentColor,
    radius,
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

const STORAGE_KEY = "gastos:theme";

function loadStored(): ThemeState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return buildTheme(parsed.mode ?? "dark", parsed.accentColor ?? "#6366f1", parsed.radius ?? 16, parsed.fontFamily ?? "inter");
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

  const value = useMemo(
    () => ({ theme, setMode, setAccentColor, setRadius, setFontFamily }),
    [theme, setMode, setAccentColor, setRadius, setFontFamily],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme deve ser usado dentro de ThemeProvider");
  return ctx;
}
