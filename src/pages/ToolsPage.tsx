import { useState } from "react";
import {
  ArrowLeft,
  BarChart3,
  CheckSquare,
  Fish,
  GanttChart,
  Kanban,
  LayoutGrid,
  ListChecks,
  RefreshCw,
  ShieldCheck,
  Workflow,
  type LucideIcon,
} from "lucide-react";
import { BoardTool, type BoardColumn } from "@/components/tools/BoardTool";
import { ChecklistTool, type ChecklistSection } from "@/components/tools/ChecklistTool";
import { FlowchartTool } from "@/components/tools/FlowchartTool";
import { GanttTool } from "@/components/tools/GanttTool";
import { ParetoTool } from "@/components/tools/ParetoTool";

const PDCA_SECTIONS: ChecklistSection[] = [
  { id: "plan", label: "Planejar (Plan)", description: "Identifique o problema e planeje as ações." },
  { id: "do", label: "Fazer (Do)", description: "Execute o que foi planejado, em pequena escala se possível." },
  { id: "check", label: "Checar (Check)", description: "Avalie os resultados frente ao que foi planejado." },
  { id: "act", label: "Agir (Act)", description: "Padronize o que funcionou e corrija o que não funcionou." },
];

const FIVE_S_SECTIONS: ChecklistSection[] = [
  { id: "seiri", label: "Seiri · Utilização", description: "Separe o necessário do desnecessário." },
  { id: "seiton", label: "Seiton · Organização", description: "Um lugar para cada coisa, cada coisa em seu lugar." },
  { id: "seiso", label: "Seiso · Limpeza", description: "Mantenha o ambiente limpo e identifique fontes de sujeira." },
  { id: "seiketsu", label: "Seiketsu · Padronização", description: "Crie padrões para manter os 3 primeiros S." },
  { id: "shitsuke", label: "Shitsuke · Disciplina", description: "Transforme os padrões em hábito." },
];

const EISENHOWER_COLUMNS: BoardColumn[] = [
  { id: "urgent-important", label: "Urgente e importante", color: "var(--color-expense)", hint: "Faça agora" },
  { id: "not-urgent-important", label: "Importante, não urgente", color: "var(--color-accent-strong)", hint: "Planeje" },
  { id: "urgent-not-important", label: "Urgente, não importante", color: "var(--color-warning)", hint: "Delegue" },
  { id: "not-urgent-not-important", label: "Nem urgente, nem importante", color: "var(--color-text-muted)", hint: "Elimine" },
];

const ISHIKAWA_COLUMNS: BoardColumn[] = [
  { id: "metodo", label: "Método" },
  { id: "mao-de-obra", label: "Mão de obra" },
  { id: "maquina", label: "Máquina" },
  { id: "material", label: "Material" },
  { id: "meio-ambiente", label: "Meio ambiente" },
  { id: "medida", label: "Medida" },
];

const KANBAN_COLUMNS: BoardColumn[] = [
  { id: "todo", label: "A fazer" },
  { id: "doing", label: "Em andamento" },
  { id: "done", label: "Concluído" },
];

const GTD_COLUMNS: BoardColumn[] = [
  { id: "inbox", label: "Caixa de entrada" },
  { id: "next", label: "Próximas ações" },
  { id: "waiting", label: "Aguardando" },
  { id: "someday", label: "Algum dia / Talvez" },
  { id: "reference", label: "Referência" },
  { id: "done", label: "Concluído" },
];

const SWOT_COLUMNS: BoardColumn[] = [
  { id: "strengths", label: "Forças", color: "var(--color-income)" },
  { id: "weaknesses", label: "Fraquezas", color: "var(--color-expense)" },
  { id: "opportunities", label: "Oportunidades", color: "var(--color-accent-strong)" },
  { id: "threats", label: "Ameaças", color: "var(--color-warning)" },
];

interface ToolDef {
  id: string;
  label: string;
  description: string;
  icon: LucideIcon;
  render: () => React.ReactNode;
}

const TOOLS: ToolDef[] = [
  {
    id: "pareto",
    label: "Diagrama de Pareto (80/20)",
    description: "Descubra quais categorias concentram a maior parte dos seus gastos.",
    icon: BarChart3,
    render: () => <ParetoTool />,
  },
  {
    id: "pdca",
    label: "Ciclo PDCA",
    description: "Planejar, Fazer, Checar, Agir — melhoria contínua.",
    icon: RefreshCw,
    render: () => <ChecklistTool storageKey="pdca" sections={PDCA_SECTIONS} />,
  },
  {
    id: "eisenhower",
    label: "Matriz de Eisenhower",
    description: "Priorize tarefas por urgência e importância.",
    icon: LayoutGrid,
    render: () => <BoardTool storageKey="eisenhower" columns={EISENHOWER_COLUMNS} />,
  },
  {
    id: "5s",
    label: "Metodologia 5S",
    description: "Utilização, organização, limpeza, padronização e disciplina.",
    icon: CheckSquare,
    render: () => <ChecklistTool storageKey="5s" sections={FIVE_S_SECTIONS} />,
  },
  {
    id: "ishikawa",
    label: "Diagrama de Ishikawa",
    description: "Analise causas raiz de um problema (espinha de peixe).",
    icon: Fish,
    render: () => <BoardTool storageKey="ishikawa" columns={ISHIKAWA_COLUMNS} allowMove={false} />,
  },
  {
    id: "kanban",
    label: "Método Kanban",
    description: "Organize tarefas em A fazer, Em andamento e Concluído.",
    icon: Kanban,
    render: () => <BoardTool storageKey="kanban" columns={KANBAN_COLUMNS} />,
  },
  {
    id: "gtd",
    label: "GTD (Getting Things Done)",
    description: "Capture, organize e execute suas tarefas sem sobrecarga mental.",
    icon: ListChecks,
    render: () => <BoardTool storageKey="gtd" columns={GTD_COLUMNS} />,
  },
  {
    id: "flowchart",
    label: "Fluxograma",
    description: "Monte a sequência de etapas de um processo.",
    icon: Workflow,
    render: () => <FlowchartTool />,
  },
  {
    id: "gantt",
    label: "Gráfico de Gantt",
    description: "Visualize tarefas e prazos em uma linha do tempo.",
    icon: GanttChart,
    render: () => <GanttTool />,
  },
  {
    id: "swot",
    label: "Análise SWOT",
    description: "Forças, fraquezas, oportunidades e ameaças.",
    icon: ShieldCheck,
    render: () => <BoardTool storageKey="swot" columns={SWOT_COLUMNS} allowMove={false} />,
  },
];

export function ToolsPage() {
  const [activeId, setActiveId] = useState<string | null>(null);
  const active = TOOLS.find((t) => t.id === activeId) ?? null;

  if (active) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div className="topbar">
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <button className="btn btn--ghost btn--icon" onClick={() => setActiveId(null)} aria-label="Voltar">
              <ArrowLeft size={18} />
            </button>
            <div>
              <div className="topbar__title" style={{ fontSize: 18 }}>{active.label}</div>
              <div className="text-muted" style={{ fontSize: 12 }}>{active.description}</div>
            </div>
          </div>
        </div>
        {active.render()}
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div className="topbar">
        <div className="topbar__title">Ferramentas</div>
      </div>
      <div className="text-muted" style={{ fontSize: 13, marginTop: -8 }}>
        Métodos de produtividade e gestão para organizar tarefas, processos e decisões.
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 }}>
        {TOOLS.map((tool) => (
          <button
            key={tool.id}
            className="card card--interactive"
            style={{ textAlign: "left", cursor: "pointer", display: "flex", flexDirection: "column", gap: 10 }}
            onClick={() => setActiveId(tool.id)}
          >
            <div className="panel-alt" style={{ width: 38, height: 38, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--color-accent-strong)" }}>
              <tool.icon size={18} />
            </div>
            <div style={{ fontWeight: 700, fontSize: 14 }}>{tool.label}</div>
            <div className="text-muted" style={{ fontSize: 12 }}>{tool.description}</div>
          </button>
        ))}
      </div>
    </div>
  );
}
