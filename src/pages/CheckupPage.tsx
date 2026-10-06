import { useMemo } from "react";
import { Link } from "react-router-dom";
import { useData } from "@/contexts/DataContext";
import { PageHeader } from "@/components/ui/PageHeader";
import { RadarChart } from "@/components/charts/RadarChart";
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
        <div className="radar-wrap">
          <div>
            <div className="eyebrow">Nota geral</div>
            <div className="score-big" style={{ margin: "10px 0 14px" }}>{total ?? "—"}<span className="text-muted" style={{ fontSize: "1.1rem", letterSpacing: 0 }}>{total != null ? " / 100" : ""}</span></div>
            {total != null && <Ruler value={total / 100} tone={tone(total)} label="Nota geral do check-up 5S" />}
            <p className="text-muted" style={{ fontSize: 13.5, lineHeight: 1.6, marginTop: 14, maxWidth: "46ch" }}>
              Calculado só com os seus lançamentos dos últimos 90 dias. Quanto mais você registra, mais fiel fica. Sensos sem dados suficientes não entram na média.
            </p>
          </div>
          <RadarChart axes={sensos.map((s) => ({ label: s.name.split(" ")[0], score: s.score }))} label={`Radar dos 5 sensos. ${sensos.map((s) => `${s.name}: ${s.score ?? "sem dados"}`).join("; ")}`} />
        </div>
      </section>

      <section className="card" aria-label="Detalhe por senso">
        <div className="senso-list">
          {sensos.map((s) => (
            <div key={s.id} className="senso">
              <div>
                <div className="senso__head">
                  <h2 style={{ fontSize: "1.02rem", fontWeight: 600 }}>{s.name}</h2>
                  <span className="senso__score">{s.score ?? "—"}</span>
                </div>
                <div className="eyebrow" style={{ margin: "2px 0 8px" }}>{s.jp}</div>
                {s.score != null ? <Ruler value={s.score / 100} tone={tone(s.score)} label={`Nota de ${s.name}`} /> : <div className="text-muted" style={{ fontSize: 12.5 }}>Dados insuficientes ainda.</div>}
              </div>
              <div>
                <p style={{ fontSize: 14, lineHeight: 1.55 }}>{s.detail}</p>
                <p className="text-muted" style={{ fontSize: 13.5, lineHeight: 1.55, marginTop: 6 }}><b>Próximo passo:</b> {s.tip}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
