import { ArrowLeftRight } from "lucide-react";
import { useMemo } from "react";
import { useAccounts, useCategories } from "../data/api";
import type { Account, Category, Transaction } from "../domain/types";
import { dayLabel } from "../lib/dates";
import { formatBRL } from "../lib/money";
import { Badge } from "./Icon";

export function useLookups() {
  const accounts = useAccounts();
  const categories = useCategories();
  return useMemo(() => ({
    accounts: new Map<string, Account>((accounts.data ?? []).map((a) => [a.id, a])),
    categories: new Map<string, Category>((categories.data ?? []).map((c) => [c.id, c])),
    loading: accounts.isLoading || categories.isLoading,
  }), [accounts.data, accounts.isLoading, categories.data, categories.isLoading]);
}

export function TransactionRow({ t, onOpen }: { t: Transaction; onOpen: (t: Transaction) => void }) {
  const { accounts, categories } = useLookups();
  const cat = t.category_id ? categories.get(t.category_id) : undefined;
  const acc = accounts.get(t.account_id);
  const title = t.description || cat?.name || (t.type === "transfer" ? "Transferência" : "Sem descrição");
  const sign = t.type === "income" ? "+" : t.type === "expense" ? "−" : "";
  const cls = t.type === "income" ? "income" : t.type === "expense" ? "expense" : "";
  return (
    <button type="button" className="item" onClick={() => onOpen(t)} aria-label={`${title}, ${sign}${formatBRL(t.amount)}. Editar.`}>
      {t.type === "transfer" ? <span className="badge" style={{ background: "#64748b" }}><ArrowLeftRight aria-hidden /></span> : <Badge icon={cat?.icon ?? "tag"} color={cat?.color ?? "#94a3b8"} />}
      <span className="main">
        <span className="title" style={{ display: "block" }}>{title}</span>
        <span className="meta">{cat?.name ?? (t.type === "transfer" ? `→ ${accounts.get(t.transfer_account_id ?? "")?.name ?? "outra conta"}` : "Sem categoria")} · {acc?.name ?? "Conta"}{t.status === "pending" && <> · <span className="tag warn">pendente</span></>}</span>
      </span>
      <span className={`amount num ${cls}`}>{sign} {formatBRL(t.amount)}</span>
    </button>
  );
}

/** Agrupa por dia (mais recente primeiro), com o saldo do dia ao lado. */
export function GroupedTransactions({ items, onOpen }: { items: Transaction[]; onOpen: (t: Transaction) => void }) {
  const groups = useMemo(() => {
    const m = new Map<string, Transaction[]>();
    for (const t of items) m.set(t.date, [...(m.get(t.date) ?? []), t]);
    return [...m].sort((a, b) => b[0].localeCompare(a[0]));
  }, [items]);
  return (
    <div className="list">
      {groups.map(([date, list]) => {
        const net = list.reduce((s, t) => s + (t.type === "income" ? t.amount : t.type === "expense" ? -t.amount : 0), 0);
        return (
          <section key={date} aria-label={dayLabel(date)}>
            <div className="list-group-title"><span>{dayLabel(date)}</span><span className="num">{net === 0 ? "" : formatBRL(net)}</span></div>
            {list.map((t) => <TransactionRow key={t.id} t={t} onOpen={onOpen} />)}
          </section>
        );
      })}
    </div>
  );
}
