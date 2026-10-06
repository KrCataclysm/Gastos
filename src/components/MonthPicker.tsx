import { ChevronLeft, ChevronRight } from "lucide-react";
import { addMonths, monthLabel, type YearMonth } from "../lib/dates";

export function MonthPicker({ value, onChange }: { value: YearMonth; onChange: (v: YearMonth) => void }) {
  return (
    <div className="month-picker no-print" role="group" aria-label="Escolher mês">
      <button type="button" className="icon-btn" onClick={() => onChange(addMonths(value, -1))} aria-label="Mês anterior"><ChevronLeft /></button>
      <span className="label" aria-live="polite">{monthLabel(value)}</span>
      <button type="button" className="icon-btn" onClick={() => onChange(addMonths(value, 1))} aria-label="Próximo mês"><ChevronRight /></button>
    </div>
  );
}
