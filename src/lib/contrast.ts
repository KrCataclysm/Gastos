/** Utilidades de cor (sem dependências). Todas as funções trabalham com hex "#rrggbb". */

export function normalizeHex(input: string): string | null {
  const m = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(input.trim());
  if (!m) return null;
  let h = m[1]!.toLowerCase();
  if (h.length === 3) h = [...h].map((c) => c + c).join("");
  return `#${h}`;
}

type RGB = [number, number, number];
const toRGB = (hex: string): RGB => {
  const h = hex.slice(1);
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
};
const toHex = ([r, g, b]: RGB) => `#${[r, g, b].map((v) => Math.round(Math.min(255, Math.max(0, v))).toString(16).padStart(2, "0")).join("")}`;

/** Mistura `a` com `b`: weight=0 -> a, weight=1 -> b. */
export function mix(a: string, b: string, weight: number): string {
  const [ar, ag, ab] = toRGB(a);
  const [br, bg, bb] = toRGB(b);
  return toHex([ar + (br - ar) * weight, ag + (bg - ag) * weight, ab + (bb - ab) * weight]);
}

/** Luminância relativa (WCAG 2.x). */
export function luminance(hex: string): number {
  const lin = (c: number) => {
    const s = c / 255;
    return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  const [r, g, b] = toRGB(hex);
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

/** Razão de contraste WCAG (1 a 21). AA texto normal exige >= 4.5; texto grande/ícones >= 3. */
export function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [number, number];
  return (hi + 0.05) / (lo + 0.05);
}

/** Preto ou branco, o que tiver mais contraste sobre `bg`. */
export const readableOn = (bg: string): string => (contrast(bg, "#ffffff") >= contrast(bg, "#0b0b0b") ? "#ffffff" : "#0b0b0b");

export function wcagLevel(ratio: number): "AAA" | "AA" | "AA grande" | "falha" {
  if (ratio >= 7) return "AAA";
  if (ratio >= 4.5) return "AA";
  if (ratio >= 3) return "AA grande";
  return "falha";
}
