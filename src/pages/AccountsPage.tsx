import { useState } from "react";
import { Plus } from "lucide-react";
import { useData } from "@/contexts/DataContext";
import { AccountForm } from "@/components/accounts/AccountForm";
import { EmptyState } from "@/components/ui/EmptyState";
import { getIcon } from "@/components/ui/icons";
import { Landmark } from "lucide-react";
import { accountBalance, creditCardInvoiceTotal } from "@/lib/calc";
import { formatCurrency, formatDate } from "@/lib/format";
import type { Account } from "@/types";

export function AccountsPage() {
  const { accounts, transactions } = useData();
  const [editing, setEditing] = useState<Account | null>(null);
  const [showNew, setShowNew] = useState(false);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div className="topbar">
        <div className="topbar__title">Contas e carteiras</div>
        <button className="btn btn--primary btn--sm" onClick={() => setShowNew(true)}>
          <Plus size={16} /> Nova conta
        </button>
      </div>

      {accounts.length === 0 ? (
        <EmptyState icon={Landmark} title="Nenhuma conta" description="Crie sua primeira conta ou carteira." />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {accounts.map((a) => {
            const Icon = getIcon(a.icon);
            const balance = accountBalance(a, transactions);
            const invoice = creditCardInvoiceTotal(a, transactions);
            return (
              <button key={a.id} className="card card--interactive" style={{ textAlign: "left", cursor: "pointer" }} onClick={() => setEditing(a)}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div className="panel-alt" style={{ width: 44, height: 44, display: "flex", alignItems: "center", justifyContent: "center", color: a.color, flexShrink: 0 }}>
                    <Icon size={20} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 15 }}>{a.name}</div>
                    {a.type === "credit_card" ? (
                      <div className="text-muted" style={{ fontSize: 12 }}>
                        Fecha dia {a.closing_day} · vence dia {a.due_day}
                      </div>
                    ) : (
                      <div className="text-muted" style={{ fontSize: 12 }}>
                        {a.type === "checking" ? "Conta corrente" : a.type === "cash" ? "Dinheiro" : a.type === "savings" ? "Poupança" : a.type === "investment" ? "Investimento" : "Outro"}
                      </div>
                    )}
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div className="mono" style={{ fontWeight: 700, fontSize: 16 }}>
                      {formatCurrency(a.type === "credit_card" ? invoice : balance)}
                    </div>
                    {a.type === "credit_card" && a.credit_limit && (
                      <div className="text-muted" style={{ fontSize: 11 }}>
                        de {formatCurrency(a.credit_limit)}
                      </div>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}

      <div className="text-muted" style={{ fontSize: 12, textAlign: "center" }}>
        Toque em uma conta para editar · atualizado em {formatDate(new Date().toISOString().slice(0, 10))}
      </div>

      {editing && <AccountForm initial={editing} onClose={() => setEditing(null)} />}
      {showNew && <AccountForm onClose={() => setShowNew(false)} />}
    </div>
  );
}
