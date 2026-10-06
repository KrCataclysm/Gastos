import { describe, expect, it } from "vitest";
import { safeText, transactionsToCsv } from "@/lib/csv";
import type { Account, Category, Transaction } from "@/types";

const base = { user_id: "u", profile_id: "p", created_at: "", updated_at: "", deleted_at: null } as const;
const acc = { ...base, id: "a1", name: "=Conta", type: "cash", initial_balance: 0, color: "#000", icon: "wallet", credit_limit: null, closing_day: null, due_day: null, archived_at: null } as Account;
const cat = { ...base, id: "c1", parent_id: null, name: "Alimentação", kind: "expense", nature: "variable", color: "#000", icon: "tag", monthly_budget: null, archived_at: null } as Category;
const tx = (over: Partial<Transaction>): Transaction => ({ ...base, id: "t", account_id: "a1", category_id: "c1", transfer_account_id: null, recurring_id: null, type: "expense", amount: 12.5, description: "", notes: null, date: "2026-10-05", status: "cleared", ...over });

describe("csv", () => {
  it("neutraliza injeção de fórmula em textos", () => {
    expect(safeText("=HYPERLINK(1)")).toBe("'=HYPERLINK(1)");
    expect(safeText("+1")).toBe("'+1");
    expect(safeText("-cmd")).toBe("'-cmd");
    expect(safeText("@SUM(A1)")).toBe("'@SUM(A1)");
    expect(safeText("Bandejão")).toBe("Bandejão");
  });
  it("aplica a proteção em descrição, categoria e conta, sem estragar o valor negativo", () => {
    const csv = transactionsToCsv([tx({ description: '=HYPERLINK("http://x","y")' })], [acc], [cat]);
    const row = csv.split("\n")[1]!;
    expect(row).toContain(`"'=HYPERLINK(""http://x"",""y"")"`);
    expect(row).toContain(";'=Conta;");
    expect(row).toContain(";-12,50;"); // valor continua numérico
  });
  it("inclui BOM para o Excel reconhecer UTF-8", () => {
    expect(transactionsToCsv([], [], []).startsWith("﻿")).toBe(true);
  });
});
