import type { Account, Category, Transaction } from "@/types";
import { formatDate } from "@/lib/format";

function escapeCsv(value: string): string {
  if (/[";\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

export function transactionsToCsv(
  transactions: Transaction[],
  accounts: Account[],
  categories: Category[],
): string {
  const accountMap = new Map(accounts.map((a) => [a.id, a.name]));
  const categoryMap = new Map(categories.map((c) => [c.id, c.name]));
  const header = ["Data", "Tipo", "Descrição", "Categoria", "Conta", "Valor", "Status"];
  const rows = transactions
    .filter((t) => !t.deleted_at)
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((t) => {
      const signed = t.type === "expense" ? -t.amount : t.amount;
      return [
        formatDate(t.date),
        t.type === "income" ? "Receita" : t.type === "expense" ? "Despesa" : "Transferência",
        t.description,
        t.category_id ? categoryMap.get(t.category_id) ?? "" : "",
        accountMap.get(t.account_id) ?? "",
        signed.toFixed(2).replace(".", ","),
        t.status === "cleared" ? "Efetivado" : "Pendente",
      ];
    });
  const lines = [header, ...rows].map((r) => r.map((c) => escapeCsv(String(c))).join(";"));
  return "﻿" + lines.join("\n");
}

export function downloadCsv(filename: string, csv: string): void {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
