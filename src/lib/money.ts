const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const brlCompact = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
const pct = new Intl.NumberFormat("pt-BR", { style: "percent", maximumFractionDigits: 0 });

/** Toda soma é feita em centavos inteiros para evitar erro de ponto flutuante. */
export const toCents = (value: number): number => Math.round(value * 100);
export const fromCents = (cents: number): number => cents / 100;

export const formatBRL = (value: number): string => brl.format(value);
export const formatBRLCompact = (value: number): string => brlCompact.format(value);
export const formatPercent = (ratio: number): string => pct.format(ratio);

/**
 * Converte o que o usuário digitou ("1.234,56", "12,5", "R$ 8") em número.
 * Retorna null quando não é um valor monetário válido.
 */
export function parseMoneyInput(raw: string): number | null {
  const cleaned = raw.replace(/[^\d.,-]/g, "").trim();
  if (!cleaned || cleaned === "-") return null;
  const lastComma = cleaned.lastIndexOf(",");
  const lastDot = cleaned.lastIndexOf(".");
  let normalized: string;
  if (lastComma > -1) {
    normalized = cleaned.replace(/\./g, "").replace(",", ".");
  } else if (lastDot > -1 && cleaned.length - lastDot - 1 !== 3) {
    normalized = cleaned; // "12.5" -> decimal
  } else {
    normalized = cleaned.replace(/\./g, ""); // "1.234" -> milhar
  }
  const n = Number(normalized);
  return Number.isFinite(n) ? Math.round(n * 100) / 100 : null;
}
