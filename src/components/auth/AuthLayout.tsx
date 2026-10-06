import type { ReactNode } from "react";
import { BRAND } from "@/brand";
import { Logo } from "@/components/brand/Logo";

const POINTS = [
  { title: "Ritmo do mês", text: "Veja se o seu gasto está no prumo do orçamento, dia a dia." },
  { title: "Pareto e Ishikawa", text: "Descubra as poucas categorias que explicam a maior parte dos seus gastos." },
  { title: "Funciona sem internet", text: "Os lançamentos ficam no aparelho e sincronizam quando a conexão volta." },
];

/** Linha de prumo e régua: motivo gráfico da marca (decorativo). */
function PlumbArt() {
  return (
    <svg className="auth-hero__art" aria-hidden focusable="false">
      <defs>
        <pattern id="auth-ticks" width="120" height="24" patternUnits="userSpaceOnUse">
          <line x1="86" y1="0" x2="106" y2="0" stroke="currentColor" strokeWidth="1" opacity="0.28" />
          <line x1="96" y1="12" x2="106" y2="12" stroke="currentColor" strokeWidth="1" opacity="0.18" />
        </pattern>
      </defs>
      <rect width="120" height="100%" fill="url(#auth-ticks)" />
      <line x1="30" y1="0" x2="30" y2="62%" stroke="currentColor" strokeWidth="1.25" opacity="0.7" />
      <circle cx="30" cy="62%" r="7" fill="currentColor" />
    </svg>
  );
}

export function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="auth-screen">
      <div className="auth-hero">
        <PlumbArt />
        <div className="auth-hero__brand"><Logo size={36} />{BRAND.name}</div>

        <div className="auth-hero__body">
          <h1 className="auth-hero__headline">{BRAND.tagline}</h1>
          <p className="auth-hero__sub">Controle de gastos pensado para universitários, com as ferramentas da Gestão da Qualidade aplicadas ao seu dinheiro.</p>
        </div>

        <ol className="auth-hero__list" aria-label="O que o app entrega">
          {POINTS.map((p, i) => (
            <li key={p.title}>
              <span className="eyebrow">{String(i + 1).padStart(2, "0")}</span>
              <span><b>{p.title}</b><span>{p.text}</span></span>
            </li>
          ))}
        </ol>
      </div>

      <div className="auth-panel">{children}</div>
    </div>
  );
}
