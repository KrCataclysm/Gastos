import { useEffect, useRef, useState } from "react";

const reduce = () => typeof window !== "undefined" && (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches || document.documentElement.dataset.motion === "reduce");

/** Número que sobe até o valor (ease-out). Sem animação quando o usuário pediu menos movimento. */
export function CountUp({ value, format, duration = 900 }: { value: number; format: (n: number) => string; duration?: number }) {
  const [shown, setShown] = useState(reduce() ? value : 0);
  const from = useRef(0);
  useEffect(() => {
    if (reduce()) { setShown(value); return; }
    const start = performance.now();
    const origin = from.current;
    let raf = 0;
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / duration);
      const e = 1 - Math.pow(1 - p, 3);
      setShown(origin + (value - origin) * e);
      if (p < 1) raf = requestAnimationFrame(tick);
      else from.current = value;
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, duration]);
  return <span aria-label={format(value)}>{format(shown)}</span>;
}
