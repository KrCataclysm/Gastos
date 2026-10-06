export interface Palette {
  mode: "light" | "dark";
  bg: string;
  panel: string;
  panelAlt: string;
  text: string;
  muted: string;
  border: string;
  accent: string;
  income: string;
  expense: string;
}

export interface Preset {
  id: string;
  name: string;
  description: string;
  palette: Palette;
}

/** Todos os temas prontos atendem WCAG AA nos pares essenciais (verificado em tests/themes.test.ts). */
export const PRESETS: Preset[] = [
  { id: "escuro", name: "Escuro", description: "Padrão do app, confortável à noite", palette: { mode: "dark", bg: "#0d1120", panel: "#151b30", panelAlt: "#1b2340", text: "#f1f3fb", muted: "#93a0c2", border: "#2a3457", accent: "#6064f0", income: "#22c55e", expense: "#f43f5e" } },
  { id: "claro", name: "Claro", description: "Equilibrado para o dia", palette: { mode: "light", bg: "#f3f5fb", panel: "#ffffff", panelAlt: "#edf0f9", text: "#12172b", muted: "#556080", border: "#d3daea", accent: "#4f46e5", income: "#15803d", expense: "#be123c" } },
  { id: "oled", name: "Preto OLED", description: "Fundo preto, economiza bateria", palette: { mode: "dark", bg: "#000000", panel: "#0b0b0b", panelAlt: "#161616", text: "#ececec", muted: "#a3a3a3", border: "#2b2b2b", accent: "#818cf8", income: "#4ade80", expense: "#fb7185" } },
  { id: "oceano", name: "Oceano", description: "Azul profundo", palette: { mode: "dark", bg: "#0a1624", panel: "#10223a", panelAlt: "#16304f", text: "#e6f0fa", muted: "#a2b8ce", border: "#2a4a70", accent: "#38bdf8", income: "#34d399", expense: "#fb923c" } },
  { id: "sepia", name: "Sépia", description: "Tom de papel, leitura longa", palette: { mode: "light", bg: "#f4ecd8", panel: "#fbf6e8", panelAlt: "#efe5cc", text: "#3b2f1d", muted: "#665636", border: "#d9ccaa", accent: "#8a4b0f", income: "#3f6212", expense: "#9a3412" } },
  { id: "contraste-claro", name: "Alto contraste (claro)", description: "Máxima legibilidade, bordas fortes", palette: { mode: "light", bg: "#ffffff", panel: "#ffffff", panelAlt: "#f0f0f0", text: "#000000", muted: "#333333", border: "#000000", accent: "#1e1b8f", income: "#00642a", expense: "#a30000" } },
  { id: "contraste-escuro", name: "Alto contraste (escuro)", description: "Máxima legibilidade em fundo preto", palette: { mode: "dark", bg: "#000000", panel: "#000000", panelAlt: "#141414", text: "#ffffff", muted: "#d9d9d9", border: "#ffffff", accent: "#ffd60a", income: "#5dff8f", expense: "#ff8a8a" } },
];

export const getPreset = (id: string): Preset | undefined => PRESETS.find((p) => p.id === id);
