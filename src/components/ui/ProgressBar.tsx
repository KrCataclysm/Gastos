export function ProgressBar({ pct, color }: { pct: number; color?: string }) {
  const clamped = Math.max(0, Math.min(1, pct));
  const tone = color ?? (pct >= 1 ? "var(--color-expense)" : pct >= 0.8 ? "var(--color-warning)" : "var(--color-accent)");
  return (
    <div className="progress">
      <div className="progress__fill" style={{ width: `${clamped * 100}%`, background: tone }} />
    </div>
  );
}
