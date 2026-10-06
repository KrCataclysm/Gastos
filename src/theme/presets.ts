export interface Palette {
  mode: "light" | "dark";
  bg: string;
  surface: string;
  surface2: string;
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

export const PRESETS: Preset[] = [
  { id: "claro", name: "Claro", description: "Padrão, equilibrado para o dia", palette: { mode: "light", bg: "#f4f7f8", surface: "#ffffff", surface2: "#eef3f5", text: "#0f1b21", muted: "#4f606c", border: "#d3dde3", accent: "#0f766e", income: "#15803d", expense: "#b91c1c" } },
  { id: "escuro", name: "Escuro", description: "Confortável à noite", palette: { mode: "dark", bg: "#0c1317", surface: "#131d23", surface2: "#1a262d", text: "#e8eff2", muted: "#9fb0ba", border: "#2a3a43", accent: "#2dd4bf", income: "#4ade80", expense: "#f87171" } },
  { id: "oled", name: "Preto OLED", description: "Fundo preto, economiza bateria", palette: { mode: "dark", bg: "#000000", surface: "#0b0b0b", surface2: "#161616", text: "#ececec", muted: "#a3a3a3", border: "#2b2b2b", accent: "#2dd4bf", income: "#4ade80", expense: "#f87171" } },
  { id: "oceano", name: "Oceano", description: "Azul profundo", palette: { mode: "dark", bg: "#0a1624", surface: "#10223a", surface2: "#16304f", text: "#e6f0fa", muted: "#a2b8ce", border: "#2a4a70", accent: "#38bdf8", income: "#34d399", expense: "#fb923c" } },
  { id: "sepia", name: "Sépia", description: "Tom de papel, leitura longa", palette: { mode: "light", bg: "#f4ecd8", surface: "#fbf6e8", surface2: "#efe5cc", text: "#3b2f1d", muted: "#665636", border: "#d9ccaa", accent: "#8a4b0f", income: "#3f6212", expense: "#9a3412" } },
  { id: "contraste-claro", name: "Alto contraste (claro)", description: "Máxima legibilidade, bordas fortes", palette: { mode: "light", bg: "#ffffff", surface: "#ffffff", surface2: "#f0f0f0", text: "#000000", muted: "#333333", border: "#000000", accent: "#00504a", income: "#00642a", expense: "#a30000" } },
  { id: "contraste-escuro", name: "Alto contraste (escuro)", description: "Máxima legibilidade em fundo preto", palette: { mode: "dark", bg: "#000000", surface: "#000000", surface2: "#141414", text: "#ffffff", muted: "#d9d9d9", border: "#ffffff", accent: "#ffd60a", income: "#5dff8f", expense: "#ff8a8a" } },
];

export const PRESET_IDS = PRESETS.map((p) => p.id);
export const getPreset = (id: string): Preset | undefined => PRESETS.find((p) => p.id === id);
