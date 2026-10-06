import { readableOn } from "../theme/colors";
import { useTheme } from "../theme/ThemeProvider";

const initials = (name: string) => name.trim().split(/\s+/).filter(Boolean).slice(0, 2).map((w) => [...w][0] ?? "").join("").toUpperCase() || "?";

export function Avatar({ name, size = 40 }: { name: string; size?: number }) {
  const { prefs } = useTheme();
  const { emoji, color } = prefs.avatar;
  return (
    <span className="avatar" aria-hidden style={{ width: size, height: size, background: color, color: readableOn(color), fontSize: size * (emoji ? 0.5 : 0.4) }}>
      {emoji || initials(name)}
    </span>
  );
}
