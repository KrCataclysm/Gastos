import { formatCurrency, formatPercent } from "@/lib/format";

export interface RankItem {
  id: string;
  name: string;
  color: string;
  total: number;
}

/** Distribuição por categoria em barras ranqueadas (mais legível que pizza e ordena o que importa). */
export function CategoryBars({ items }: { items: RankItem[] }) {
  const sum = items.reduce((s, i) => s + i.total, 0) || 1;
  const max = Math.max(...items.map((i) => i.total), 1);
  return (
    <div className="rank">
      {items.map((i, n) => (
        <div key={i.id} className="rank__item">
          <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{i.name}</span>
          <span className="mono">{formatCurrency(i.total)} <span className="text-muted" style={{ fontSize: 12 }}>· {formatPercent(i.total / sum)}</span></span>
          <div className="rank__bar" aria-hidden><span style={{ width: `${(i.total / max) * 100}%`, background: i.color, ["--i" as string]: n }} /></div>
        </div>
      ))}
    </div>
  );
}
