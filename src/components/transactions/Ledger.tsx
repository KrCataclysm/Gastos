import { useMemo } from "react";
import { formatCurrency, formatDayHeader } from "@/lib/format";
import type { Account, Category, Transaction } from "@/types";

interface Props {
  items: Transaction[];
  categories: Category[];
  accounts: Account[];
  onOpen?: (t: Transaction) => void;
}

/** Extrato: lançamentos agrupados por dia, valores alinhados à direita em fonte monoespaçada. */
export function Ledger({ items, categories, accounts, onOpen }: Props) {
  const catMap = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories]);
  const accMap = useMemo(() => new Map(accounts.map((a) => [a.id, a])), [accounts]);
  const days = useMemo(() => {
    const map = new Map<string, Transaction[]>();
    for (const t of items) map.set(t.date, [...(map.get(t.date) ?? []), t]);
    return [...map].sort((a, b) => b[0].localeCompare(a[0]));
  }, [items]);

  return (
    <div className="ledger">
      {days.map(([date, list]) => {
        const net = list.filter((t) => t.status === "cleared").reduce((s, t) => s + (t.type === "income" ? t.amount : t.type === "expense" ? -t.amount : 0), 0);
        return (
          <section key={date} aria-label={formatDayHeader(date)}>
            <div className="ledger__day">
              <span className="eyebrow">{formatDayHeader(date)}</span>
              <span className="eyebrow mono">{net === 0 ? "" : `${net > 0 ? "+" : "−"} ${formatCurrency(Math.abs(net))}`}</span>
            </div>
            {list.map((t) => {
              const cat = t.category_id ? catMap.get(t.category_id) : undefined;
              const acc = accMap.get(t.account_id)?.name ?? "";
              const to = t.transfer_account_id ? accMap.get(t.transfer_account_id)?.name : undefined;
              const title = t.description || cat?.name || (t.type === "transfer" ? "Transferência" : "Lançamento");
              const sign = t.type === "expense" ? "−" : t.type === "income" ? "+" : "";
              const tone = t.type === "income" ? "text-income" : t.type === "expense" ? "text-expense" : "";
              const meta = t.type === "transfer" ? `${acc} → ${to ?? "outra conta"}` : `${cat?.name ?? "Sem categoria"}${acc ? ` · ${acc}` : ""}`;
              const Tag = onOpen ? "button" : "div";
              return (
                <Tag key={t.id} className="ledger__row" {...(onOpen ? { type: "button" as const, onClick: () => onOpen(t) } : {})}>
                  <span className="ledger__dot" style={{ background: t.type === "transfer" ? "var(--color-text-muted)" : (cat?.color ?? "var(--color-text-muted)") }} aria-hidden />
                  <span style={{ minWidth: 0 }}>
                    <div className="ledger__title">{title}</div>
                    <div className="ledger__meta">{meta}{t.status === "pending" && <> · <span className="badge badge--warning">pendente</span></>}</div>
                  </span>
                  <span className={`ledger__amount ${tone}`}>{sign} {formatCurrency(t.amount)}</span>
                </Tag>
              );
            })}
          </section>
        );
      })}
    </div>
  );
}
