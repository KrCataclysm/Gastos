import type { ReactNode } from "react";
import { ShieldCheck, Sparkles, TrendingUp } from "lucide-react";

export function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="auth-screen">
      <div className="auth-hero">
        <div className="auth-hero__brand">
          <Sparkles size={22} /> Gastos
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <h1 className="auth-hero__headline">Sua planilha de custos profissional, na palma da mão.</h1>
          <p className="auth-hero__sub">
            Contas, categorias, orçamento e projeções em um só lugar — com a seriedade de uma ferramenta
            financeira de verdade, não de um app de anotar gasto.
          </p>
          <div className="auth-hero__glass" style={{ maxWidth: 420 }}>
            <div className="trust-row" style={{ marginBottom: 10 }}>
              <ShieldCheck size={16} /> Seus dados são só seus — protegidos por autenticação e regras de acesso por linha (RLS) no banco.
            </div>
            <div className="trust-row">
              <TrendingUp size={16} /> Projeções, orçamento por categoria e relatórios estilo DRE.
            </div>
          </div>
        </div>

        <div className="auth-hero__stats">
          <div className="auth-hero__stat">
            <b>100%</b>
            <span>controle manual dos dados</span>
          </div>
          <div className="auth-hero__stat">
            <b>Offline</b>
            <span>funciona sem internet</span>
          </div>
          <div className="auth-hero__stat">
            <b>Multi</b>
            <span>dispositivos sincronizados</span>
          </div>
        </div>
      </div>

      <div className="auth-panel">{children}</div>
    </div>
  );
}
