import {
  Home,
  ShoppingCart,
  ShoppingBag,
  Coffee,
  CarFront,
  Zap,
  Repeat,
  HeartPulse,
  Sparkles,
  Briefcase,
  Plane,
  ShieldCheck,
  Armchair,
  Tag,
  type LucideIcon,
} from "lucide-react";

export const CATEGORY_ICONS: Record<string, LucideIcon> = {
  home: Home,
  cart: ShoppingCart,
  bag: ShoppingBag,
  coffee: Coffee,
  car: CarFront,
  zap: Zap,
  repeat: Repeat,
  heart: HeartPulse,
  sparkles: Sparkles,
  briefcase: Briefcase,
  plane: Plane,
  shield: ShieldCheck,
  armchair: Armchair,
};

export function iconFor(key: string): LucideIcon {
  return CATEGORY_ICONS[key] ?? Tag;
}
