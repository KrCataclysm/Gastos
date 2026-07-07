import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Plus, Repeat, Search } from "lucide-react";
import { addMonths } from "date-fns";
import { useData } from "@/contexts/DataContext";
import { TransactionForm } from "@/components/transactions/TransactionForm";
import { RecurringForm } from "@/components/recurring/RecurringForm";
import { EmptyState } from "@/components/ui/EmptyState";
import { getIcon } from "@/components/ui/icons";
import { formatCurrency, formatDate, monthLabel } from "@/lib/format";
import type { Transaction, TransactionType } from "@/types";
import { parseDate } from "@/lib/calc";

type Filter = "all" | TransactionType;

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
    return transactions.filter((t) => {
      const d = parseDate(t.date);
      if (d.getFullYear() !== y || d.getMonth() !== m) return false;
      if (filter !== "all" && t.type !== filter) return false;
      if (search && !t.description.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [transactions, cursor, filter, search]);

  const accountMap = new Map(accounts.map((a) => [a.id, a]));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div className="topbar">
        <div className="topbar__title">Lançamentos</div>
      </div>

      <div style={{ display: "flex", gap: 8 }}>
        <button className={`chip${tab === "transacoes" ? " chip--active" : ""}`} onClick={() => setTab("transacoes")}>
          Lançamentos
        </button>
        <button className={`chip${tab === "recorrencias" ? " chip--active" : ""}`} onClick={() => setTab("recorrencias")}>
          <Repeat size={14} /> Recorrências
        </button>
      </div>

      {tab === "transacoes" ? (
        <>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <button className="btn btn--ghost btn--icon" onClick={() => setCursor((c) => addMonths(c, -1))}>
              <ChevronLeft size={18} />
            </button>
            <div style={{ fontWeight: 700 }}>{monthLabel(cursor.getFullYear(), cursor.getMonth() + 1)}</div>
            <button className="btn btn--ghost btn--icon" onClick={() => setCursor((c) => addMonths(c, 1))}>
              <ChevronRight size={18} />
            </button>
          </div>

          <div style={{ display: "flex", gap: 8, overflowX: "auto" }}>
            {(["all", "expense", "income", "transfer"] as Filter[]).map((f) => (
              <button key={f} className={`chip${filter === f ? " chip--active" : ""}`} onClick={() => setFilter(f)}>
                {f === "all" ? "Todos" : f === "expense" ? "Despesas" : f === "income" ? "Receitas" : "Transferências"}
              </button>
            ))}
          </div>

          <div style={{ position: "relative" }}>
            <Search size={16} style={{ position: "absolute", left: 14, top: 14, color: "var(--color-text-muted)" }} />
            <input
              className="input"
              style={{ paddingLeft: 38 }}
              placeholder="Buscar por descrição…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="card" style={{ padding: 8 }}>
            {monthItems.length === 0 ? (
              <EmptyState icon={Search} title="Nada por aqui" description="Nenhum lançamento encontrado com esses filtros." />
            ) : (
              monthItems.map((t) => {
                const category = categories.find((c) => c.id === t.category_id);
                const Icon = getIcon(category?.icon ?? "wallet");
                return (
                  <button
                    key={t.id}
                    onClick={() => setEditing(t)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      padding: "12px 8px",
                      width: "100%",
                      background: "none",
                      border: "none",
                      borderBottom: "1px solid var(--color-border)",
                      textAlign: "left",
                      cursor: "pointer",
                    }}
                  >
                    <div
                      className="panel-alt"
                      style={{ width: 40, height: 40, display: "flex", alignItems: "center", justifyContent: "center", color: category?.color ?? "var(--color-accent)", flexShrink: 0 }}
                    >
                      <Icon size={18} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {t.description || category?.name || "Lançamento"}
                      </div>
                      <div className="text-muted" style={{ fontSize: 12 }}>
                        {formatDate(t.date)} · {accountMap.get(t.account_id)?.name ?? ""}
                        {t.status === "pending" ? " · pendente" : ""}
                      </div>
                    </div>
                    <div
                      className={t.type === "income" ? "text-income mono" : t.type === "expense" ? "text-expense mono" : "mono"}
                      style={{ fontWeight: 700, fontSize: 14, flexShrink: 0 }}
                    >
                      {t.type === "expense" ? "-" : t.type === "income" ? "+" : ""}
                      {formatCurrency(t.amount)}
                    </div>
                  </button>
                );
              })
            )}
          </div>

          <button className="fab" onClick={() => setShowNew(true)} aria-label="Adicionar lançamento">
            <Plus size={26} />
          </button>
        </>
      ) : (
        <>
          <div className="card" style={{ padding: 8 }}>
            {recurringTransactions.length === 0 ? (
              <EmptyState icon={Repeat} title="Nenhuma recorrência" description="Cadastre assinaturas, aluguel e outros lançamentos fixos." />
            ) : (
              recurringTransactions.map((r) => {
                const category = categories.find((c) => c.id === r.category_id);
                const Icon = getIcon(category?.icon ?? "repeat");
                return (
                  <button
                    key={r.id}
                    onClick={() => setEditingRecurring(r.id)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      padding: "12px 8px",
                      width: "100%",
                      background: "none",
                      border: "none",
                      borderBottom: "1px solid var(--color-border)",
                      textAlign: "left",
                      cursor: "pointer",
                    }}
                  >
                    <div className="panel-alt" style={{ width: 40, height: 40, display: "flex", alignItems: "center", justifyContent: "center", color: category?.color ?? "var(--color-accent)" }}>
                      <Icon size={18} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 600 }}>{r.description}</div>
                      <div className="text-muted" style={{ fontSize: 12 }}>
                        {r.frequency === "monthly" ? "Mensal" : r.frequency === "weekly" ? "Semanal" : r.frequency === "biweekly" ? "Quinzenal" : "Anual"} · próxima em {formatDate(r.next_run_date)}
                      </div>
                    </div>
                    <div className={r.type === "income" ? "text-income mono" : "text-expense mono"} style={{ fontWeight: 700, fontSize: 14 }}>
                      {r.type === "expense" ? "-" : "+"}
                      {formatCurrency(r.amount)}
                    </div>
                  </button>
                );
              })
            )}
          </div>
          <button className="fab" onClick={() => setShowNewRecurring(true)} aria-label="Nova recorrência">
            <Plus size={26} />
          </button>
        </>
      )}

      {editing && <TransactionForm initial={editing} onClose={() => setEditing(null)} />}
      {showNew && <TransactionForm onClose={() => setShowNew(false)} />}
      {editingRecurring && (
        <RecurringForm
          initial={recurringTransactions.find((r) => r.id === editingRecurring)}
          onClose={() => setEditingRecurring(null)}
        />
      )}
      {showNewRecurring && <RecurringForm onClose={() => setShowNewRecurring(false)} />}
    </div>
  );
}
