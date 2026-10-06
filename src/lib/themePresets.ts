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
  { id: "escuro", name: "Prumo noturno", description: "Verde-petróleo sobre carvão, para a noite", palette: { mode: "dark", bg: "#0d1311", panel: "#141c19", panelAlt: "#1b2521", text: "#e8eeea", muted: "#9fada6", border: "#2a3731", accent: "#4fc3ae", income: "#6ccb8a", expense: "#f0866a" } },
  { id: "claro", name: "Prumo claro", description: "Papel quente e tinta, o visual padrão", palette: { mode: "light", bg: "#f3f1eb", panel: "#ffffff", panelAlt: "#ece9e1", text: "#15211d", muted: "#56635d", border: "#d6d2c7", accent: "#0e6b62", income: "#2a7a46", expense: "#b1432a" } },
  { id: "oled", name: "Preto OLED", description: "Fundo preto, economiza bateria", palette: { mode: "dark", bg: "#000000", panel: "#0b0b0b", panelAlt: "#161616", text: "#ececec", muted: "#a3a3a3", border: "#2b2b2b", accent: "#4fc3ae", income: "#4ade80", expense: "#fb7185" } },
  { id: "oceano", name: "Oceano", description: "Azul profundo", palette: { mode: "dark", bg: "#0a1624", panel: "#10223a", panelAlt: "#16304f", text: "#e6f0fa", muted: "#a2b8ce", border: "#2a4a70", accent: "#38bdf8", income: "#34d399", expense: "#fb923c" } },
  { id: "sepia", name: "Sépia", description: "Tom de papel, leitura longa", palette: { mode: "light", bg: "#f4ecd8", panel: "#fbf6e8", panelAlt: "#efe5cc", text: "#3b2f1d", muted: "#665636", border: "#d9ccaa", accent: "#8a4b0f", income: "#3f6212", expense: "#9a3412" } },
  { id: "contraste-claro", name: "Alto contraste (claro)", description: "Máxima legibilidade, bordas fortes", palette: { mode: "light", bg: "#ffffff", panel: "#ffffff", panelAlt: "#f0f0f0", text: "#000000", muted: "#333333", border: "#000000", accent: "#1e1b8f", income: "#00642a", expense: "#a30000" } },
  { id: "contraste-escuro", name: "Alto contraste (escuro)", description: "Máxima legibilidade em fundo preto", palette: { mode: "dark", bg: "#000000", panel: "#000000", panelAlt: "#141414", text: "#ffffff", muted: "#d9d9d9", border: "#ffffff", accent: "#ffd60a", income: "#5dff8f", expense: "#ff8a8a" } },
];

export const getPreset = (id: string): Preset | undefined => PRESETS.find((p) => p.id === id);
