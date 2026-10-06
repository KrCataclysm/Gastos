import { useEffect, useState } from "react";

const PREFIX = "gastos:tool:";

export function useLocalToolState<T>(key: string, initial: T): [T, (value: T | ((prev: T) => T)) => void] {
  const storageKey = PREFIX + key;
  const [state, setState] = useState<T>(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      return raw ? (JSON.parse(raw) as T) : initial;
    } catch {
      return initial;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(state));
    } catch {
      // localStorage indisponível ou cheio: segue apenas em memória
    }
  }, [storageKey, state]);

  return [state, setState];
}
