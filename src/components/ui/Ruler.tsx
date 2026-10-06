import { PACE_TONE, type PaceStatus } from "@/lib/pace";

/**
 * Régua: barra de progresso com graduação e, opcionalmente, a linha de prumo
 * (onde você deveria estar hoje). Substitui a barra de progresso genérica.
 */
export function Ruler({ value, marker, status, tone, label }: { value: number; marker?: number | null; status?: PaceStatus; tone?: "ok" | "warn" | "over" | "done"; label: string }) {
  const fill = Math.max(0, Math.min(1, value));
  const t = tone ?? (status ? PACE_TONE[status] : value > 1 ? "over" : "ok");
  return (
    <div className={`ruler ruler--${t}`} role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(fill * 100)}>
      <div className="ruler__track">
        <div className="ruler__fill" style={{ width: `${fill * 100}%` }} />
      </div>
      <div className="ruler__ticks" aria-hidden />
      {marker != null && marker > 0 && marker < 1 && <div className="ruler__plumb" style={{ left: `${marker * 100}%` }} aria-hidden />}
    </div>
  );
}
