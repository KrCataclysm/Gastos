import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { useLocalToolState } from "@/lib/localTool";
import { ProgressBar } from "@/components/ui/ProgressBar";

export interface ChecklistSection {
  id: string;
  label: string;
  description?: string;
}

interface ChecklistItem {
  id: string;
  text: string;
  done: boolean;
  sectionId: string;
}

export function ChecklistTool({ storageKey, sections }: { storageKey: string; sections: ChecklistSection[] }) {
  const [items, setItems] = useLocalToolState<ChecklistItem[]>(storageKey, []);
  const [drafts, setDrafts] = useState<Record<string, string>>({});

  function addItem(sectionId: string) {
    const text = (drafts[sectionId] ?? "").trim();
    if (!text) return;
    setItems((prev) => [...prev, { id: crypto.randomUUID(), text, done: false, sectionId }]);
    setDrafts((d) => ({ ...d, [sectionId]: "" }));
  }

  function toggleItem(id: string) {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, done: !i.done } : i)));
  }

  function removeItem(id: string) {
    setItems((prev) => prev.filter((i) => i.id !== id));
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {sections.map((section) => {
        const sectionItems = items.filter((i) => i.sectionId === section.id);
        const done = sectionItems.filter((i) => i.done).length;
        const pct = sectionItems.length > 0 ? done / sectionItems.length : 0;
        return (
          <div key={section.id} className="card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 4 }}>
              <div style={{ fontWeight: 700, fontSize: 14 }}>{section.label}</div>
              <span className="text-muted mono" style={{ fontSize: 12 }}>
                {done}/{sectionItems.length}
              </span>
            </div>
            {section.description && (
              <div className="text-muted" style={{ fontSize: 12, marginBottom: 10 }}>
                {section.description}
              </div>
            )}
            <ProgressBar pct={pct} color={pct >= 1 ? "var(--color-income)" : undefined} />
            <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 12 }}>
              {sectionItems.map((item) => (
                <label key={item.id} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, cursor: "pointer" }}>
                  <input type="checkbox" checked={item.done} onChange={() => toggleItem(item.id)} />
                  <span style={{ flex: 1, textDecoration: item.done ? "line-through" : "none", opacity: item.done ? 0.6 : 1 }}>{item.text}</span>
                  <button
                    type="button"
                    className="btn btn--ghost btn--icon"
                    style={{ padding: 4 }}
                    onClick={() => removeItem(item.id)}
                    aria-label="Remover item"
                  >
                    <Trash2 size={13} />
                  </button>
                </label>
              ))}
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
              <input
                className="input"
                style={{ fontSize: 13 }}
                value={drafts[section.id] ?? ""}
                onChange={(e) => setDrafts((d) => ({ ...d, [section.id]: e.target.value }))}
                onKeyDown={(e) => e.key === "Enter" && addItem(section.id)}
                placeholder="Adicionar item…"
              />
              <button className="btn btn--secondary btn--sm" onClick={() => addItem(section.id)}>
                <Plus size={14} />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
