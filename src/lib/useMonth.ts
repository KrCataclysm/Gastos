import { useCallback, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { currentYearMonth, ymKey, type YearMonth } from "./dates";

const RE = /^(\d{4})-(0[1-9]|1[0-2])$/;

/** Mês selecionado vive na URL (?m=2026-10): sobrevive a recarregar e dá para compartilhar o link. */
export function useMonth(): [YearMonth, (ym: YearMonth) => void] {
  const [params, setParams] = useSearchParams();
  const raw = params.get("m");
  const value = useMemo<YearMonth>(() => {
    const m = raw ? RE.exec(raw) : null;
    return m ? { year: Number(m[1]), month: Number(m[2]) } : currentYearMonth();
  }, [raw]);
  const set = useCallback(
    (ym: YearMonth) => setParams((p) => { const n = new URLSearchParams(p); n.set("m", ymKey(ym)); return n; }, { replace: true }),
    [setParams],
  );
  return [value, set];
}
