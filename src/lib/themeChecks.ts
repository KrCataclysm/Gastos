import { contrast, readableOn } from "@/lib/contrast";
import type { Palette } from "@/lib/themePresets";

export interface ContrastCheck {
  label: string;
  ratio: number;
  required: number;
  ok: boolean;
}

/** Pares de cores que precisam ser legíveis (WCAG AA: 4.5:1 para texto; 3:1 para ícones e destaques). */
export function checkContrast(p: Palette): ContrastCheck[] {
  const pairs: [string, string, string, number][] = [
    ["Texto sobre fundo", p.text, p.bg, 4.5],
    ["Texto sobre painéis", p.text, p.panel, 4.5],
    ["Texto secundário sobre painéis", p.muted, p.panel, 4.5],
    ["Texto dos botões de destaque", readableOn(p.accent), p.accent, 4.5],
    ["Destaque sobre painéis (links, ícones)", p.accent, p.panel, 3],
    ["Receitas sobre painéis", p.income, p.panel, 4.5],
    ["Despesas sobre painéis", p.expense, p.panel, 4.5],
  ];
  return pairs.map(([label, a, b, required]) => {
    const ratio = contrast(a, b);
    return { label, ratio, required, ok: ratio >= required };
  });
}
