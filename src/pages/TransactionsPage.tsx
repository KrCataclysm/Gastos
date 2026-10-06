import { useMemo, useState } from "react";
import { Repeat, Search } from "lucide-react";
import { useData } from "@/contexts/DataContext";
import { TransactionForm } from "@/components/transactions/TransactionForm";
import { RecurringForm } from "@/components/recurring/RecurringForm";
import { Ledger } from "@/components/transactions/Ledger";
import { AddFab } from "@/components/ui/AddFab";
import { EmptyState } from "@/components/ui/EmptyState";
import { MonthNav } from "@/components/ui/MonthNav";
import { PageHeader } from "@/components/ui/PageHeader";
import { formatCurrency, formatDate } from "@/lib/format";
import { parseDate } from "@/lib/calc";
import type { Transaction, TransactionType } from "@/types";

type Filter = "all" | TransactionType;
const FILTERS: [Filter, string][] = [["all", "Todos"], ["expense", "Despesas"], ["income", "Receitas"], ["transfer", "Transferências"]];
const FREQ: Record<string, string> = { monthly: "Mensal", weekly: "Semanal", biweekly: "Quinzenal", yearly: "Anual" };

export function TransactionsPage() {
  const { transactions, categories, accounts, recurringTransactions } = useData();
  const [cursor, setCursor] = useState(new Date());
  const [filter, setFilter] = useState<Filter>("all");
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<Transaction | null>(null);
  const [showNew, setShowNew] = useState(false);
  const [tab, setTab] = useState<"transacoes" | "recorrencias">("transacoes");
  const [editingRecurring, setEditingRecurring] = useState<string | null>(null);
  const [showNewRecurring, setShowNewRecurring] = useState(false);

  const monthItems = useMemo(() => {
    const y = cursor.getFullYear();
    const m = cursor.getMonth();
    const needle = search.trim().toLowerCase();
    return transactions.filter((t) => {
      const d = parseDate(t.date);
      if (d.getFullYear() !== y || d.getMonth() !== m) return false;
      if (filter !== "all" && t.type !== filter) return false;
      return !needle || t.description.toLowerCase().includes(needle);
    });
  }, [transactions, cursor, filter, search]);

  const totals = useMemo(() => {
    let income = 0;
    let expense = 0;
    for (const t of monthItems) {
      if (t.status !== "cleared") continue;
      if (t.type === "income") income += t.amount;
      else if (t.type === "expense") expense += t.amount;
    }
    return { income, expense, result: income - expense };
  }, [monthItems]);

  return (
    <div className="stack">
      <PageHeader eyebrow="Extrato" title="Lançamentos">
        <div className="seg" role="group" aria-label="Seção">
          <button type="button" aria-pressed={tab === "transacoes"} onClick={() => setTab("transacoes")}>Lançamentos</button>
          <button type="button" aria-pressed={tab === "recorrencias"} onClick={() => setTab("recorrencias")}><Repeat size={13} /> Recorrências</button>
        </div>
      </PageHeader>

      {tab === "transacoes" ? (
        <>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center", justifyContent: "space-between" }}>
            <MonthNav cursor={cursor} onChange={setCursor} />
            <div className="seg" role="group" aria-label="Filtrar por tipo">
              {FILTERS.map(([f, label]) => (
                <button key={f} type="button" aria-pressed={filter === f} onClick={() => setFilter(f)}>{label}</button>
              ))}
            </div>
          </div>

          <div style={{ position: "relative" }}>
            <label htmlFor="busca" className="sr-only">Buscar por descrição</label>
            <Search size={16} aria-hidden style={{ position: "absolute", left: 13, top: 13, color: "var(--color-text-muted)" }} />
            <input id="busca" className="input" style={{ paddingLeft: 38 }} placeholder="Buscar por descrição…" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>

          <section className="card" aria-label="Lançamentos do mês">
            {monthItems.length === 0 ? (
              <EmptyState icon={Search} title="Nada por aqui" description={search || filter !== "all" ? "Nenhum lançamento com esses filtros. Tente limpar a busca." : "Nenhum lançamento neste mês."} />
            ) : (
              <>
                <Ledger items={monthItems} categories={categories} accounts={accounts} onOpen={setEditing} />
                <div className="statement__row statement__row--total" style={{ marginTop: 14, flexWrap: "wrap" }}>
                  <span className="mono text-income" style={{ fontWeight: 500 }}>+ {formatCurrency(totals.income)}</span>
                  <span className="mono text-expense" style={{ fontWeight: 500 }}>− {formatCurrency(totals.expense)}</span>
                  <span className="mono">= {formatCurrency(totals.result)}</span>
                </div>
              </>
            )}
          </section>
          <AddFab onClick={() => setShowNew(true)} />
        </>
      ) : (
        <>
          <section className="card" aria-label="Recorrências">
            {recurringTransactions.length === 0 ? (
              <EmptyState icon={Repeat} title="Nenhuma recorrência" description="Cadastre assinaturas, aluguel e outros lançamentos fixos." />
            ) : (
              <div className="ledger">
                {recurringTransactions.map((r) => {
                  const cat = categories.find((c) => c.id === r.category_id);
                  return (
                    <button key={r.id} type="button" className="ledger__row" onClick={() => setEditingRecurring(r.id)}>
                      <span className="ledger__dot" style={{ background: cat?.color ?? "var(--color-text-muted)" }} aria-hidden />
                      <span style={{ minWidth: 0 }}>
                        <div className="ledger__title">{r.description}</div>
                        <div className="ledger__meta">{FREQ[r.frequency] ?? r.frequency} · próxima em {formatDate(r.next_run_date)}</div>
                      </span>
                      <span className={`ledger__amount ${r.type === "income" ? "text-income" : "text-expense"}`}>{r.type === "expense" ? "−" : "+"} {formatCurrency(r.amount)}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </section>
          <AddFab label="Nova recorrência" onClick={() => setShowNewRecurring(true)} />
        </>
      )}

      {editing && <TransactionForm initial={editing} onClose={() => setEditing(null)} />}
      {showNew && <TransactionForm onClose={() => setShowNew(false)} />}
      {editingRecurring && <RecurringForm initial={recurringTransactions.find((r) => r.id === editingRecurring)} onClose={() => setEditingRecurring(null)} />}
      {showNewRecurring && <RecurringForm onClose={() => setShowNewRecurring(false)} />}
    </div>
  );
}
