import { useSyncExternalStore } from "react";
import { normalizeHex } from "@/lib/contrast";

export interface AvatarPrefs {
  emoji: string;
  color: string;
}

const KEY = "gastos:avatar";
const DEFAULT: AvatarPrefs = { emoji: "", color: "#6366f1" };
const listeners = new Set<() => void>();
let cache: AvatarPrefs | null = null;

function read(): AvatarPrefs {
  if (cache) return cache;
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) ?? "null") as Partial<AvatarPrefs> | null;
    cache = {
      emoji: typeof raw?.emoji === "string" ? [...raw.emoji].slice(0, 2).join("") : "",
      color: (typeof raw?.color === "string" ? normalizeHex(raw.color) : null) ?? DEFAULT.color,
    };
  } catch {
    cache = DEFAULT;
  }
  return cache;
}

export function setAvatar(patch: Partial<AvatarPrefs>): void {
  cache = { ...read(), ...patch };
  try {
    localStorage.setItem(KEY, JSON.stringify(cache));
  } catch {
    /* vale só nesta sessão */
  }
  listeners.forEach((l) => l());
}

export function useAvatar(): AvatarPrefs {
  return useSyncExternalStore((cb) => { listeners.add(cb); return () => listeners.delete(cb); }, read, () => DEFAULT);
}
