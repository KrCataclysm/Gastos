import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { applyTheme, resolvePalette } from "./engine";
import { DEFAULT_PREFS, loadPrefs, savePrefs, type Prefs } from "./prefs";

interface ThemeApi {
  prefs: Prefs;
  isDark: boolean;
  update: (patch: Partial<Prefs> | ((p: Prefs) => Prefs)) => void;
  reset: () => void;
  /** alterna rapidamente entre claro e escuro (atalho do menu) */
  quickToggle: () => void;
}

const Ctx = createContext<ThemeApi | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [prefs, setPrefs] = useState<Prefs>(loadPrefs);
  const [systemDark, setSystemDark] = useState(() => matchMedia("(prefers-color-scheme: dark)").matches);
  const [systemReduce, setSystemReduce] = useState(() => matchMedia("(prefers-reduced-motion: reduce)").matches);

  useEffect(() => {
    const dark = matchMedia("(prefers-color-scheme: dark)");
    const motion = matchMedia("(prefers-reduced-motion: reduce)");
    const a = (e: MediaQueryListEvent) => setSystemDark(e.matches);
    const b = (e: MediaQueryListEvent) => setSystemReduce(e.matches);
    dark.addEventListener("change", a);
    motion.addEventListener("change", b);
    return () => { dark.removeEventListener("change", a); motion.removeEventListener("change", b); };
  }, []);

  useEffect(() => {
    // o sistema pedindo menos movimento vale mesmo que a opção manual esteja desligada
    applyTheme(systemReduce && !prefs.a11y.reduceMotion ? { ...prefs, a11y: { ...prefs.a11y, reduceMotion: true } } : prefs, systemDark);
  }, [prefs, systemDark, systemReduce]);

  const update = useCallback<ThemeApi["update"]>((patch) => {
    setPrefs((cur) => {
      const next = typeof patch === "function" ? patch(cur) : { ...cur, ...patch };
      savePrefs(next);
      return next;
    });
  }, []);

  const api = useMemo<ThemeApi>(() => {
    const isDark = resolvePalette(prefs, systemDark).mode === "dark";
    return {
      prefs,
      isDark,
      update,
      reset: () => update(() => ({ ...DEFAULT_PREFS, avatar: prefs.avatar })),
      quickToggle: () => update((p) => ({ ...p, themeId: isDark ? "claro" : "escuro" })),
    };
  }, [prefs, systemDark, update]);

  return <Ctx.Provider value={api}>{children}</Ctx.Provider>;
}

export function useTheme(): ThemeApi {
  const v = useContext(Ctx);
  if (!v) throw new Error("useTheme fora do ThemeProvider");
  return v;
}
