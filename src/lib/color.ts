function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace("#", "");
  const full = clean.length === 3 ? clean.split("").map((c) => c + c).join("") : clean;
  const n = parseInt(full, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function clampChannel(v: number): number {
  return Math.min(255, Math.max(0, Math.round(v)));
}

function rgbToHex(r: number, g: number, b: number): string {
  return `#${[r, g, b].map((v) => clampChannel(v).toString(16).padStart(2, "0")).join("")}`;
}

/** Mistura a cor com branco (amount > 0) ou preto (amount < 0). amount vai de -1 a 1. */
export function shade(hex: string, amount: number): string {
  const [r, g, b] = hexToRgb(hex);
  const target = amount >= 0 ? 255 : 0;
  const p = Math.min(1, Math.abs(amount));
  return rgbToHex(r + (target - r) * p, g + (target - g) * p, b + (target - b) * p);
}
