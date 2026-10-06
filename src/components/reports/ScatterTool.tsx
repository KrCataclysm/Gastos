import { useMemo, useState } from "react";
import { ScatterView } from "@/components/charts/ScatterView";
import { weeklySpending } from "@/lib/dmaic";
import { correlation } from "@/lib/stats";
import type { Category, Transaction } from "@/types";

const WEEKS = 16;

/** Diagrama de dispersão: duas categorias semana a semana. O r de Pearson diz se uma sobe quando a outra sobe. */
export function ScatterTool({ transactions, categories }: { transactions: Transaction[]; categories: Category[] }) {
  const cats = useMemo(() => categories.filter((c) => c.kind === "expense" && !c.archived_at), [categories]);
  const [a, setA] = useState(cats[0]?.id ?? "");
  const [b, setB] = useState(cats[1]?.id ?? "");
  const ca = cats.find((c) => c.id === a);
  const cb = cats.find((c) => c.id === b);
  const xs = useMemo(() => weeklySpending(transactions, WEEKS, a || null).map((w) => w.total), [transactions, a]);
  const ys = useMemo(() => weeklySpending(transactions, WEEKS, b || null).map((w) => w.total), [transactions, b]);
  const fit = useMemo(() => correlation(xs, ys), [xs, ys]);

  if (cats.length < 2) return null;

  const dir = fit && fit.r > 0 ? "sobem juntos" : "andam em sentido oposto";
  return (
    <section className="card" aria-label="Dispersão entre categorias">
      <div className="panel-head">
        <h2 className="panel-title">Dispersão: uma categoria puxa a outra?</h2>
        <span className="panel-note">{WEEKS} semanas completas</span>
      </div>
      <div className="grid grid--2" style={{ marginBottom: 12 }}>
        <div className="field"><label htmlFor="sc-a">Eixo horizontal</label><select id="sc-a" className="select" value={a} onChange={(e) => setA(e.target.value)}>{cats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
        <div className="field"><label htmlFor="sc-b">Eixo vertical</label><select id="sc-b" className="select" value={b} onChange={(e) => setB(e.target.value)}>{cats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
      </div>
      {a === b ? (
        <p className="text-muted" style={{ fontSize: 13.5 }}>Escolha duas categorias diferentes.</p>
      ) : (
        <>
          <ScatterView xs={xs} ys={ys} fit={fit} xLabel={ca?.name ?? ""} yLabel={cb?.name ?? ""} />
          <p style={{ fontSize: 13.5, lineHeight: 1.6, marginTop: 8 }}>
            {fit ? (
              <>
                Correlação de Pearson <b className="mono">r = {fit.r.toFixed(2).replace(".", ",")}</b>: relação <b>{fit.strength}</b>
                {fit.strength !== "nenhuma" ? <>; {ca?.name} e {cb?.name} {dir}. </> : ". Uma categoria não explica a outra. "}
                <span className="text-muted">Correlação não prova causa: dois gastos podem subir juntos porque dependem de um terceiro fator (ex.: semana de provas ou de saída).</span>
              </>
            ) : (
              <span className="text-muted">Precisa de pelo menos 5 semanas com variação nas duas categorias para calcular a correlação.</span>
            )}
          </p>
        </>
      )}
    </section>
  );
}
