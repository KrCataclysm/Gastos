import { AlertTriangle, CheckCircle2, Info, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

export function Banner({ tone, children }: { tone: "good" | "warn" | "info" | "danger"; children: ReactNode }) {
  const I: LucideIcon = tone === "good" ? CheckCircle2 : tone === "info" ? Info : AlertTriangle;
  return <div className={`banner ${tone}`}><I aria-hidden /><div>{children}</div></div>;
}

export function Progress({ ratio, label }: { ratio: number; label: string }) {
  const clamped = Math.min(1, Math.max(0, ratio));
  const cls = ratio > 1 ? "over" : ratio >= 0.85 ? "warn" : "";
  return (
    <div className={`progress ${cls}`} role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(clamped * 100)}>
      <span style={{ width: `${clamped * 100}%` }} />
    </div>
  );
}

export function Empty({ icon: I, title, children }: { icon: LucideIcon; title: string; children?: ReactNode }) {
  return <div className="empty"><I aria-hidden /><strong>{title}</strong>{children && <p>{children}</p>}</div>;
}

export function Loading({ rows = 4 }: { rows?: number }) {
  return <div className="stack" aria-busy="true" aria-label="Carregando">{Array.from({ length: rows }, (_, i) => <div key={i} className="skeleton" style={{ height: 52 }} />)}</div>;
}

export function CardTitle({ title, hint }: { title: string; hint?: string }) {
  return <div className="card-title"><h2>{title}</h2>{hint && <span className="hint">{hint}</span>}</div>;
}
