/**
 * Estatística básica para as ferramentas da qualidade (gráfico de controle I-MR, histograma).
 * Funções puras, sem dependências.
 */

export const mean = (xs: readonly number[]) => (xs.length ? xs.reduce((s, x) => s + x, 0) / xs.length : 0);

/** Desvio-padrão amostral (n-1). */
export function stdev(xs: readonly number[]): number {
  if (xs.length < 2) return 0;
  const m = mean(xs);
  return Math.sqrt(xs.reduce((s, x) => s + (x - m) ** 2, 0) / (xs.length - 1));
}

export interface ControlChart {
  center: number;
  ucl: number;
  lcl: number;
  /** Índices dos pontos fora dos limites. */
  outOfControl: number[];
  /** Índices em que 7 pontos seguidos ficam do mesmo lado da linha central (tendência). */
  runs: number[];
  movingRange: number;
}

/**
 * Gráfico de valores individuais (I-MR). Limites = média ± 2,66 · amplitude móvel média
 * (2,66 = 3 / d2, com d2 = 1,128). LCL nunca fica abaixo de zero: gasto não é negativo.
 */
export function controlChart(values: readonly number[]): ControlChart | null {
  if (values.length < 5) return null;
  const center = mean(values);
  const mr = values.slice(1).map((v, i) => Math.abs(v - values[i]));
  const movingRange = mean(mr);
  const ucl = center + 2.66 * movingRange;
  const lcl = Math.max(0, center - 2.66 * movingRange);
  const outOfControl = values.flatMap((v, i) => (v > ucl || v < lcl ? [i] : []));
  const runs: number[] = [];
  let side = 0;
  let len = 0;
  values.forEach((v, i) => {
    const s = v > center ? 1 : v < center ? -1 : 0;
    if (s !== 0 && s === side) len += 1;
    else {
      side = s;
      len = s === 0 ? 0 : 1;
    }
    if (len >= 7) runs.push(i);
  });
  return { center, ucl, lcl, outOfControl, runs, movingRange };
}

export interface HistogramBin {
  from: number;
  to: number;
  count: number;
}

/** Número de classes pela regra de Sturges: k = 1 + 3,322 · log10(n). */
export const sturges = (n: number) => (n < 2 ? 1 : Math.ceil(1 + 3.322 * Math.log10(n)));

export function histogram(values: readonly number[], bins = sturges(values.length)): HistogramBin[] {
  if (values.length === 0) return [];
  const min = Math.min(...values);
  const max = Math.max(...values);
  if (min === max) return [{ from: min, to: max, count: values.length }];
  const width = (max - min) / bins;
  const out: HistogramBin[] = Array.from({ length: bins }, (_, i) => ({ from: min + i * width, to: min + (i + 1) * width, count: 0 }));
  for (const v of values) out[Math.min(bins - 1, Math.floor((v - min) / width))].count += 1;
  return out;
}

export interface Correlation {
  r: number;
  slope: number;
  intercept: number;
  n: number;
  strength: "nenhuma" | "fraca" | "moderada" | "forte";
}

/**
 * Coeficiente de correlação de Pearson e reta de mínimos quadrados (y = a·x + b).
 * Retorna null com menos de 5 pontos ou sem variação em x ou y (r indefinido).
 */
export function correlation(xs: readonly number[], ys: readonly number[]): Correlation | null {
  const n = Math.min(xs.length, ys.length);
  if (n < 5) return null;
  const mx = mean(xs.slice(0, n));
  const my = mean(ys.slice(0, n));
  let sxx = 0, syy = 0, sxy = 0;
  for (let i = 0; i < n; i++) {
    sxx += (xs[i] - mx) ** 2;
    syy += (ys[i] - my) ** 2;
    sxy += (xs[i] - mx) * (ys[i] - my);
  }
  if (sxx === 0 || syy === 0) return null;
  const r = sxy / Math.sqrt(sxx * syy);
  const slope = sxy / sxx;
  const a = Math.abs(r);
  return { r, slope, intercept: my - slope * mx, n, strength: a < 0.3 ? "nenhuma" : a < 0.5 ? "fraca" : a < 0.7 ? "moderada" : "forte" };
}
