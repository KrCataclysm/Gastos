import { useAvatar } from "@/lib/avatar";
import { readableOn } from "@/lib/contrast";

const initials = (name: string) => name.trim().split(/\s+/).filter(Boolean).slice(0, 2).map((w) => [...w][0] ?? "").join("").toUpperCase() || "?";

export function Avatar({ name, size = 40 }: { name: string; size?: number }) {
  const { emoji, color } = useAvatar();
  return (
    <span className="avatar" aria-hidden style={{ width: size, height: size, background: color, color: readableOn(color), fontSize: size * (emoji ? 0.5 : 0.4) }}>
      {emoji || initials(name)}
    </span>
  );
}
