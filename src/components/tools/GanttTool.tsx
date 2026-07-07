import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { useLocalToolState } from "@/lib/localTool";
import { formatDate, todayISO } from "@/lib/format";

interface GanttTask {
  id: string;
  name: string;
  start: string;
  end: string;
  color: string;
}

const GANTT_COLORS = ["#6366f1", "#22c55e", "#f59e0b", "#ef4444", "#3b82f6", "#ec4899", "#06b6d4"];

function dayDiff(a: string, b: string): number {
  return Math.round((new Date(`${b}T00:00:00`).getTime() - new Date(`${a}T00:00:00`).getTime()) / 86400000);
}

export function GanttTool() {
  const [tasks, setTasks] = useLocalToolState<GanttTask[]>("gantt", []);
  const [name, setName] = useState("");
  const [start, setStart] = useState(todayISO());
  const [end, setEnd] = useState(todayISO());

  function addTask() {
    if (!name.trim() || !start || !end || end < start) return;
    setTasks((prev) => [
      ...prev,
      { id: crypto.randomUUID(), name: name.trim(), start, end, color: GANTT_COLORS[prev.length % GANTT_COLORS.length] },
    ]);
    setName("");
  }

  function removeTask(id: string) {
    setTasks((prev) => prev.filter((t) => t.id !== id));
  }

  const minDate = tasks.reduce((min, t) => (t.start < min ? t.start : min), tasks[0]?.start ?? todayISO());
  const maxDate = tasks.reduce((max, t) => (t.end > max ? t.end : max), tasks[0]?.end ?? todayISO());
  const totalDays = Math.max(1, dayDiff(minDate, maxDate));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "flex-end" }}>
        <div className="field" style={{ flex: 1, minWidth: 140 }}>
          <label>Tarefa</label>
          <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Nome da tarefa" />
        </div>
        <div className="field">
          <label>Início</label>
          <input className="input" type="date" value={start} onChange={(e) => setStart(e.target.value)} />
        </div>
        <div className="field">
          <label>Fim</label>
          <input className="input" type="date" value={end} onChange={(e) => setEnd(e.target.value)} />
        </div>
        <button className="btn btn--primary btn--icon" onClick={addTask} aria-label="Adicionar tarefa">
          <Plus size={18} />
        </button>
      </div>

      {tasks.length === 0 ? (
        <div className="text-muted" style={{ fontSize: 13 }}>
          Adicione tarefas com datas de início e fim para visualizar a linha do tempo.
        </div>
      ) : (
        <div className="card" style={{ overflowX: "auto" }}>
          <div style={{ minWidth: 480 }}>
            {tasks.map((t) => {
              const offset = dayDiff(minDate, t.start);
              const span = Math.max(1, dayDiff(t.start, t.end));
              return (
                <div key={t.id} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                  <div
                    style={{
                      width: 120,
                      fontSize: 12,
                      fontWeight: 600,
                      flexShrink: 0,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {t.name}
                  </div>
                  <div style={{ flex: 1, position: "relative", height: 20, background: "var(--color-panel-alt)", borderRadius: 6 }}>
                    <div
                      style={{
                        position: "absolute",
                        left: `${(offset / totalDays) * 100}%`,
                        width: `${Math.max((span / totalDays) * 100, 3)}%`,
                        height: "100%",
                        background: t.color,
                        borderRadius: 6,
                      }}
                      title={`${formatDate(t.start)} – ${formatDate(t.end)}`}
                    />
                  </div>
                  <button className="btn btn--ghost btn--icon" style={{ padding: 4, flexShrink: 0 }} onClick={() => removeTask(t.id)} aria-label="Remover tarefa">
                    <Trash2 size={13} />
                  </button>
                </div>
              );
            })}
          </div>
          <div className="text-muted" style={{ fontSize: 11, marginTop: 4 }}>
            {formatDate(minDate)} — {formatDate(maxDate)}
          </div>
        </div>
      )}
    </div>
  );
}
