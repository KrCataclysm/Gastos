import { Ruler } from "@/components/ui/Ruler";

/** Compatibilidade: telas antigas continuam usando <ProgressBar pct />, agora desenhado como régua. */
export function ProgressBar({ pct, color, marker }: { pct: number; color?: string; marker?: number | null }) {
  const tone = color ? undefined : pct >= 1 ? "over" : pct >= 0.8 ? "warn" : "ok";
  return (
    <div style={color ? ({ ["--ruler-tone" as string]: color } as React.CSSProperties) : undefined}>
      <Ruler value={pct} marker={marker} tone={tone} label="Progresso" />
    </div>
  );
}
