import type { ReactNode } from "react";

export function PageHeader({ eyebrow, title, children }: { eyebrow?: string; title: string; children?: ReactNode }) {
  return (
    <header className="topbar">
      <div>
        {eyebrow && <div className="eyebrow topbar__eyebrow">{eyebrow}</div>}
        <h1 className="topbar__title">{title}</h1>
      </div>
      {children && <div className="topbar__actions no-print">{children}</div>}
    </header>
  );
}
