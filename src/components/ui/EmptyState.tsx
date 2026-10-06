import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="empty-state">
      <Icon size={36} strokeWidth={1.5} />
      <h3 style={{ fontSize: 16, fontWeight: 700, color: "var(--color-text)" }}>{title}</h3>
      {description && <p style={{ fontSize: 14, maxWidth: 320 }}>{description}</p>}
      {action}
    </div>
  );
}
