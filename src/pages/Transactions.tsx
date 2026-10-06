import { Download, Search, Receipt } from "lucide-react";
import { useMemo, useState } from "react";
import { useQuickAdd } from "../components/AppShell";
import { MonthPicker } from "../components/MonthPicker";
import { GroupedTransactions } from "../components/TransactionList";
import { Banner, Empty, Loading } from "../components/ui";
import { useAccounts, useCategories, useTransactions } from "../data/api";
import { summarize } from "../domain/analytics";
import type { TxType } from "../domain/types";
import { toCSV, downloadText } from "../lib/csv";
import { dateBR, monthRange, ymKey } from "../lib/dates";
import { formatBRL } from "../lib/money";
import { useMonth } from "../lib/useMonth";

const norm = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

export function Transactions() {
  const [ym, setYm] = useMonth();
  const r = monthRange(ym);
  const txs = useTransactions(r.from, r.to);
  const accounts = useAccounts();
  const categories = useCategories();
  const { openEdit } = useQuickAdd();
  const [q, setQ] = useState("");
  const [type, setType] = useState<TxType | "all">("all");
  const [cat, setCat] = useState("");

  const filtered = useMemo(() => {
    const needle = norm(q.trim());
    return (txs.data ?? []).filter((t) => (type === "all" || t.type === type) && (!cat || t.category_id === cat) && (!needle || norm(`${t.description} ${t.notes ?? ""}`).includes(needle)));
  }, [txs.data, q, type, cat]);

  if (txs.isLoading) return <Loading />;
  if (txs.error) return <Banner tone="danger">Não foi possível carregar os lançamentos.</Banner>;
  const s = summarize(filtered);

  const exportCSV = () => {
    const accName = new Map((accounts.data ?? []).map((a) => [a.id, a.name]));
    const catName = new Map((categories.data ?? []).map((c) => [c.id, c.name]));
    const label = { income: "Receita", expense: "Despesa", transfer: "Transferência" } as const;
    downloadText(`lancamentos-${ymKey(ym)}.csv`, toCSV(["Data", "Tipo", "Descrição", "Categoria", "Conta", "Valor", "Status"], filtered.map((t) => [dateBR(t.date), label[t.type], t.description, catName.get(t.category_id ?? "") ?? "", accName.get(t.account_id) ?? "", t.type === "expense" ? -t.amount : t.amount, t.status === "pending" ? "Pendente" : "Efetivado"])));
  };

  return (
    <div className="stack">
      <div className="page-head"><h1>Lançamentos</h1><MonthPicker value={ym} onChange={setYm} /></div>
      <div className="card stack" style={{ gap: 12 }}>
        <div className="field">
          <label htmlFor="busca" className="sr-only">Buscar</label>
          <div style={{ position: "relative" }}>
            <Search size={18} aria-hidden style={{ position: "absolute", left: 12, top: 14, color: "var(--muted)" }} />
            <input id="busca" className="input" style={{ paddingLeft: 38 }} placeholder="Buscar por descrição…" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
        </div>
        <div className="row wrap">
          <div className="chips" role="group" aria-label="Filtrar por tipo">
            {([["all", "Todos"], ["expense", "Despesas"], ["income", "Receitas"], ["transfer", "Transferências"]] as const).map(([v, l]) => <button key={v} type="button" className="chip" aria-pressed={type === v} onClick={() => setType(v)}>{l}</button>)}
          </div>
          <span className="spacer" />
          <label className="sr-only" htmlFor="fcat">Categoria</label>
          <select id="fcat" className="input" style={{ width: "auto", minHeight: 36 }} value={cat} onChange={(e) => setCat(e.target.value)}>
            <option value="">Todas as categorias</option>
            {(categories.data ?? []).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <button type="button" className="btn sm" onClick={exportCSV} disabled={filtered.length === 0}><Download aria-hidden />CSV</button>
        </div>
        <div className="row between wrap muted"><span>{filtered.length} lançamento{filtered.length === 1 ? "" : "s"}</span><span className="num"><span className="income">+ {formatBRL(s.income)}</span> · <span className="expense">− {formatBRL(s.expense)}</span> · <strong>{formatBRL(s.balance)}</strong></span></div>
      </div>
      <section className="card">
        {filtered.length === 0 ? <Empty icon={Receipt} title={txs.data?.length ? "Nada encontrado com esses filtros" : "Nenhum lançamento neste mês"}>{txs.data?.length ? "Tente limpar a busca ou os filtros." : "Toque em “Lançar” para registrar."}</Empty> : <GroupedTransactions items={filtered} onOpen={openEdit} />}
      </section>
    </div>
  );
}
