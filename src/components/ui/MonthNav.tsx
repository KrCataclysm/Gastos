import { ChevronLeft, ChevronRight } from "lucide-react";
import { monthLabel } from "@/lib/format";

export function MonthNav({ cursor, onChange }: { cursor: Date; onChange: (next: Date) => void }) {
  const shift = (delta: number) => onChange(new Date(cursor.getFullYear(), cursor.getMonth() + delta, 1));
  return (
    <div className="month-nav no-print" role="group" aria-label="Escolher mês">
      <button type="button" className="btn btn--ghost btn--icon btn--sm" onClick={() => shift(-1)} aria-label="Mês anterior">
        <ChevronLeft size={16} />
      </button>
      <span className="month-nav__label" aria-live="polite">{monthLabel(cursor.getFullYear(), cursor.getMonth() + 1)}</span>
      <button type="button" className="btn btn--ghost btn--icon btn--sm" onClick={() => shift(1)} aria-label="Próximo mês">
        <ChevronRight size={16} />
      </button>
    </div>
  );
}
