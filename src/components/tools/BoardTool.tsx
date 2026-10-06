import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { useLocalToolState } from "@/lib/localTool";

export interface BoardColumn {
  id: string;
  label: string;
  color?: string;
  hint?: string;
}

interface BoardItem {
  id: string;
  text: string;
  columnId: string;
}

export function BoardTool({
  storageKey,
  columns,
  allowMove = true,
}: {
  storageKey: string;
  columns: BoardColumn[];
  allowMove?: boolean;
}) {
  const [items, setItems] = useLocalToolState<BoardItem[]>(storageKey, []);
  const [newText, setNewText] = useState("");
  const [newColumn, setNewColumn] = useState(columns[0]?.id ?? "");

  function addItem() {
    if (!newText.trim()) return;
    setItems((prev) => [...prev, { id: crypto.randomUUID(), text: newText.trim(), columnId: newColumn || columns[0].id }]);
    setNewText("");
  }

  function removeItem(id: string) {
    setItems((prev) => prev.filter((i) => i.id !== id));
  }

  function moveItem(id: string, columnId: string) {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, columnId } : i)));
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <input
          className="input"
          style={{ flex: 1, minWidth: 160 }}
          value={newText}
          onChange={(e) => setNewText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addItem()}
          placeholder="Novo item…"
        />
        <select className="select" style={{ maxWidth: 170 }} value={newColumn} onChange={(e) => setNewColumn(e.target.value)}>
          {columns.map((c) => (
            <option key={c.id} value={c.id}>
              {c.label}
            </option>
          ))}
        </select>
        <button className="btn btn--primary btn--icon" onClick={addItem} aria-label="Adicionar item">
          <Plus size={18} />
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: 12, alignItems: "start" }}>
        {columns.map((col) => {
          const colItems = items.filter((i) => i.columnId === col.id);
          return (
            <div key={col.id} className="card" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <div style={{ fontWeight: 700, fontSize: 13, color: col.color ?? "var(--color-text)" }}>{col.label}</div>
              {col.hint && (
                <div className="text-muted" style={{ fontSize: 11, marginTop: -6 }}>
                  {col.hint}
                </div>
              )}
              {colItems.length === 0 && (
                <div className="text-muted" style={{ fontSize: 12 }}>
                  Vazio
                </div>
              )}
              {colItems.map((item) => (
                <div key={item.id} className="panel-alt" style={{ padding: 10, borderRadius: 10, display: "flex", flexDirection: "column", gap: 6 }}>
                  <div style={{ fontSize: 13 }}>{item.text}</div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 6 }}>
                    {allowMove && columns.length > 1 ? (
                      <select
                        className="select"
                        style={{ fontSize: 11, padding: "4px 6px" }}
                        value={item.columnId}
                        onChange={(e) => moveItem(item.id, e.target.value)}
                      >
                        {columns.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.label}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <span />
                    )}
                    <button className="btn btn--ghost btn--icon" style={{ padding: 4 }} onClick={() => removeItem(item.id)} aria-label="Remover item">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}
