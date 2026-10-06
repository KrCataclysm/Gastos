import {
  Banknote, BookOpen, Briefcase, Bus, Car, Coffee, CirclePlus, Dumbbell, Gamepad2, Gift, GraduationCap, HeartPulse, House, Landmark, Laptop, Music, PiggyBank, Pizza, Plane, Printer, Repeat, Shirt,
  ShoppingBag, Smartphone, Sparkles, Tag, Utensils, Wallet, type LucideIcon,
} from "lucide-react";

/** Nomes gravados no banco -> ícones. Nome desconhecido cai em "tag". */
export const ICONS: Record<string, LucideIcon> = {
  wallet: Wallet, banknote: Banknote, "plus-circle": CirclePlus, home: House, utensils: Utensils, car: Car, "heart-pulse": HeartPulse, book: BookOpen, sparkles: Sparkles,
  repeat: Repeat, tag: Tag, "graduation-cap": GraduationCap, briefcase: Briefcase, printer: Printer, bus: Bus, landmark: Landmark, "piggy-bank": PiggyBank,
  coffee: Coffee, "shopping-bag": ShoppingBag, "gamepad-2": Gamepad2, plane: Plane, laptop: Laptop, gift: Gift, music: Music, dumbbell: Dumbbell, shirt: Shirt, smartphone: Smartphone, pizza: Pizza,
};

export const ICON_NAMES = Object.keys(ICONS);

export function Icon({ name, ...rest }: { name: string; size?: number; "aria-hidden"?: boolean }) {
  const C = ICONS[name] ?? Tag;
  return <C aria-hidden {...rest} />;
}

export function Badge({ icon, color }: { icon: string; color: string }) {
  return (
    <span className="badge" style={{ background: color }}>
      <Icon name={icon} />
    </span>
  );
}
