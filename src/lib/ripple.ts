/** Onda de toque nos botões: feedback tátil visual. Não roda com "menos animação" nem com prefers-reduced-motion. */
export function installRipple(): void {
  if (typeof window === "undefined" || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  document.addEventListener(
    "pointerdown",
    (e) => {
      if (document.documentElement.dataset.motion === "reduce") return;
      const el = (e.target as HTMLElement | null)?.closest<HTMLElement>(".btn, .fab, .chip, .seg button");
      if (!el || (el as HTMLButtonElement).disabled) return;
      const rect = el.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height) * 1.6;
      const wave = document.createElement("span");
      wave.className = "ripple";
      wave.style.cssText = `width:${size}px;height:${size}px;left:${e.clientX - rect.left - size / 2}px;top:${e.clientY - rect.top - size / 2}px`;
      if (getComputedStyle(el).position === "static") el.style.position = "relative";
      el.style.overflow = el.style.overflow || "hidden";
      el.appendChild(wave);
      wave.addEventListener("animationend", () => wave.remove(), { once: true });
    },
    { passive: true },
  );
}
