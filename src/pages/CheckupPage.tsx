import { useMemo } from "react";
import { Link } from "react-router-dom";
import { useData } from "@/contexts/DataContext";
import { PageHeader } from "@/components/ui/PageHeader";
import { Ruler } from "@/components/ui/Ruler";
import { fiveS, overallScore } from "@/lib/fiveS";

const tone = (s: number): "ok" | "warn" | "over" => (s >= 70 ? "ok" : s >= 40 ? "warn" : "over");

export function CheckupPage() {
  const { transactions, categories, accounts, recurringTransactions } = useData();
  const sensos = useMemo(() => fiveS({ transactions, categories, accounts, recurring: recurringTransactions }), [transactions, categories, accounts, recurringTransactions]);
  const total = overallScore(sensos);

  return (
    <div className="stack">
      <PageHeader eyebrow="Programa 5S" title="Check-up das finanças">
        <Link to="/projetos" className="btn btn--secondary btn--sm">Projetos</Link>
      </PageHeader>

      <section className="card" aria-label="Nota geral">
        <div className="eyebrow">Nota geral</div>
        <div className="mono" style={{ fontSize: "2.4rem", fontWeight: 500, letterSpacing: "-0.03em", margin: "6px 0 10px" }}>{total ?? "—"}<span className="text-muted" style={{ fontSize: "1rem" }}>{total != null ? " / 100" : ""}</span></div>
        {total != null && <Ruler value={total / 100} tone={tone(total)} label="Nota geral do check-up 5S" />}
        <p className="text-muted" style={{ fontSize: 13.5, lineHeight: 1.5, marginTop: 12, maxWidth: "60ch" }}>
          Calculado só com os seus lançamentos dos últimos 90 dias. Quanto mais você registra, mais fiel fica. Sensos sem dados suficientes não entram na média.
        </p>
      </section>

      <div className="grid grid--2">
        {sensos.map((s) => (
          <section key={s.id} className="card" aria-label={s.name}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12 }}>
              <h2 style={{ fontSize: "1.05rem", fontWeight: 600 }}>{s.name} <span className="eyebrow" style={{ marginLeft: 6 }}>{s.jp}</span></h2>
              <span className="mono" style={{ fontSize: "1.3rem" }}>{s.score ?? "—"}</span>
            </div>
            <div style={{ margin: "10px 0" }}>
              {s.score != null ? <Ruler value={s.score / 100} tone={tone(s.score)} label={`Nota de ${s.name}`} /> : <div className="text-muted" style={{ fontSize: 12.5 }}>Dados insuficientes ainda.</div>}
            </div>
            <p style={{ fontSize: 13.5, lineHeight: 1.5 }}>{s.detail}</p>
            <p className="text-muted" style={{ fontSize: 13.5, lineHeight: 1.5, marginTop: 6 }}><b>Próximo passo:</b> {s.tip}</p>
          </section>
        ))}
      </div>
    </div>
  );
}
