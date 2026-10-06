import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

export function EmptyState({ icon: Icon, title, description, action }: { icon: LucideIcon; title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="empty-state">
      <span className="empty-state__icon"><Icon size={20} strokeWidth={1.6} aria-hidden /></span>
      <h3 style={{ fontSize: 15, fontWeight: 600, color: "var(--color-text)" }}>{title}</h3>
      {description && <p style={{ fontSize: 13.5, maxWidth: 340, lineHeight: 1.55 }}>{description}</p>}
      {action}
    </div>
  );
}
