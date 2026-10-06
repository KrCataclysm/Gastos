import { useState } from "react";
import { Landmark, Plus } from "lucide-react";
import { useData } from "@/contexts/DataContext";
import { AccountForm } from "@/components/accounts/AccountForm";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { accountBalance, creditCardInvoiceTotal } from "@/lib/calc";
import { formatCurrency } from "@/lib/format";
import type { Account } from "@/types";

const TYPE_LABEL: Record<string, string> = { checking: "Conta corrente", cash: "Dinheiro", savings: "Poupança", investment: "Investimento", other: "Outra" };

export function AccountsPage() {
  const { accounts, transactions } = useData();
  const [editing, setEditing] = useState<Account | null>(null);
  const [showNew, setShowNew] = useState(false);

  return (
    <div className="stack">
      <PageHeader eyebrow="Organização" title="Contas e carteiras">
        <button className="btn btn--primary btn--sm" onClick={() => setShowNew(true)}><Plus size={15} /> Nova conta</button>
      </PageHeader>

      {accounts.length === 0 ? (
        <section className="card"><EmptyState icon={Landmark} title="Nenhuma conta" description="Crie sua primeira conta ou carteira." /></section>
      ) : (
        <section className="card card--flush" aria-label="Contas">
          {accounts.map((a) => {
            const card = a.type === "credit_card";
            const value = card ? creditCardInvoiceTotal(a, transactions) : accountBalance(a, transactions);
            return (
              <button key={a.id} type="button" className="menu-row" onClick={() => setEditing(a)} aria-label={`Editar conta ${a.name}`}>
                <i className="ledger__dot" style={{ background: a.color }} aria-hidden />
                <span className="menu-row__text">
                  {a.name}
                  <span className="menu-row__hint">{card ? `Cartão · fecha dia ${a.closing_day} · vence dia ${a.due_day}` : (TYPE_LABEL[a.type] ?? "Outra")}</span>
                </span>
                <span style={{ textAlign: "right" }}>
                  <span className="mono" style={{ fontWeight: 500 }}>{formatCurrency(value)}</span>
                  {card && a.credit_limit ? <span className="menu-row__hint mono">fatura · limite {formatCurrency(a.credit_limit)}</span> : null}
                </span>
              </button>
            );
          })}
        </section>
      )}

      {editing && <AccountForm initial={editing} onClose={() => setEditing(null)} />}
      {showNew && <AccountForm onClose={() => setShowNew(false)} />}
    </div>
  );
}
