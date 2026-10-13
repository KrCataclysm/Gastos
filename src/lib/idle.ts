import { useEffect } from "react";

const KEY = "gastos:idle-minutes";

export const IDLE_OPTIONS = [0, 5, 15, 30, 60] as const;

export function getIdleMinutes(): number {
  try {
    const n = Number(localStorage.getItem(KEY));
    return (IDLE_OPTIONS as readonly number[]).includes(n) ? n : 0;
  } catch {
    return 0;
  }
}

export function setIdleMinutes(n: number): void {
  try {
    localStorage.setItem(KEY, String(n));
    window.dispatchEvent(new Event("gastos:idle-changed"));
  } catch {
    /* sem armazenamento: ignora */
  }
}

/** Encerra a sessão após N minutos sem toque/teclado (opcional; útil em aparelho compartilhado). */
export function useIdleSignOut(onIdle: () => void): void {
  useEffect(() => {
    let timer: number | undefined;
    const arm = () => {
      window.clearTimeout(timer);
      const m = getIdleMinutes();
      if (m > 0) timer = window.setTimeout(onIdle, m * 60_000);
    };
    const events = ["pointerdown", "keydown", "scroll", "touchstart"] as const;
    events.forEach((e) => window.addEventListener(e, arm, { passive: true }));
    window.addEventListener("gastos:idle-changed", arm);
    document.addEventListener("visibilitychange", arm);
    arm();
    return () => {
      window.clearTimeout(timer);
      events.forEach((e) => window.removeEventListener(e, arm));
      window.removeEventListener("gastos:idle-changed", arm);
      document.removeEventListener("visibilitychange", arm);
    };
  }, [onIdle]);
}
