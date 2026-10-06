import { useState } from "react";
import { ArrowDown, ChevronDown, ChevronUp, Plus, Trash2 } from "lucide-react";
import { useLocalToolState } from "@/lib/localTool";

type StepType = "inicio" | "processo" | "decisao" | "fim";

interface FlowStep {
  id: string;
  type: StepType;
  text: string;
}

const TYPE_LABELS: Record<StepType, string> = {
  inicio: "Início",
  processo: "Processo",
  decisao: "Decisão",
  fim: "Fim",
};

export function FlowchartTool() {
  const [steps, setSteps] = useLocalToolState<FlowStep[]>("flowchart", []);
  const [text, setText] = useState("");
  const [type, setType] = useState<StepType>("processo");

  function addStep() {
    if (!text.trim()) return;
    setSteps((prev) => [...prev, { id: crypto.randomUUID(), type, text: text.trim() }]);
    setText("");
  }

  function removeStep(id: string) {
    setSteps((prev) => prev.filter((s) => s.id !== id));
  }

  function move(id: string, dir: -1 | 1) {
    setSteps((prev) => {
      const idx = prev.findIndex((s) => s.id === id);
      const newIdx = idx + dir;
      if (newIdx < 0 || newIdx >= prev.length) return prev;
      const copy = [...prev];
      [copy[idx], copy[newIdx]] = [copy[newIdx], copy[idx]];
      return copy;
    });
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <input
          className="input"
          style={{ flex: 1, minWidth: 160 }}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addStep()}
          placeholder="Descrição da etapa…"
        />
        <select className="select" style={{ maxWidth: 140 }} value={type} onChange={(e) => setType(e.target.value as StepType)}>
          {Object.entries(TYPE_LABELS).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </select>
        <button className="btn btn--primary btn--icon" onClick={addStep} aria-label="Adicionar etapa">
          <Plus size={18} />
        </button>
      </div>

      {steps.length === 0 ? (
        <div className="text-muted" style={{ fontSize: 13 }}>
          Adicione etapas (início, processo, decisão, fim) para montar o fluxograma do seu processo.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
          {steps.map((step, idx) => (
            <div key={step.id} style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "100%" }}>
              <div
                className="card"
                style={{
                  width: "min(340px, 100%)",
                  textAlign: "center",
                  borderRadius: step.type === "inicio" || step.type === "fim" ? 999 : 12,
                  borderColor: step.type === "decisao" ? "var(--color-warning)" : undefined,
                  padding: "14px 18px",
                }}
              >
                <div className="text-muted" style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 4 }}>
                  {TYPE_LABELS[step.type]}
                </div>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{step.text}</div>
                <div style={{ display: "flex", justifyContent: "center", gap: 4, marginTop: 8 }}>
                  <button className="btn btn--ghost btn--icon" style={{ padding: 4 }} onClick={() => move(step.id, -1)} disabled={idx === 0} aria-label="Mover para cima">
                    <ChevronUp size={14} />
                  </button>
                  <button
                    className="btn btn--ghost btn--icon"
                    style={{ padding: 4 }}
                    onClick={() => move(step.id, 1)}
                    disabled={idx === steps.length - 1}
                    aria-label="Mover para baixo"
                  >
                    <ChevronDown size={14} />
                  </button>
                  <button className="btn btn--ghost btn--icon" style={{ padding: 4 }} onClick={() => removeStep(step.id)} aria-label="Remover etapa">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
              {idx < steps.length - 1 && <ArrowDown size={18} color="var(--color-text-muted)" style={{ margin: "2px 0" }} />}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
