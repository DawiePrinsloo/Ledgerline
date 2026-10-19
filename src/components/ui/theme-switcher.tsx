"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Moon, Stars, Sun, SunMoon, type LucideIcon } from "lucide-react";
import {
  DEFAULT_THEME,
  LIGHT_THEME,
  THEME_STORAGE_KEY,
  isThemeId,
  type ThemeChoice,
} from "@/lib/themes";
import { cn } from "@/lib/utils";

const OPTIONS: Array<{ id: ThemeChoice; label: string; icon: LucideIcon }> = [
  { id: "auto", label: "System", icon: SunMoon },
  { id: "organic", label: "Light", icon: Sun },
  { id: "obsidian", label: "Dark", icon: Moon },
  { id: "midnight", label: "Midnight", icon: Stars },
];

function resolve(choice: ThemeChoice): string {
  if (choice === "auto") {
    return window.matchMedia?.("(prefers-color-scheme: light)").matches
      ? LIGHT_THEME
      : DEFAULT_THEME;
  }
  return choice;
}

export function ThemeSwitcher({ className }: { className?: string }) {
  const [choice, setChoice] = useState<ThemeChoice>("auto");

  const apply = (next: ThemeChoice) => {
    setChoice(next);
    localStorage.setItem(THEME_STORAGE_KEY, next);
    document.documentElement.dataset.theme = resolve(next);
  };

  useEffect(() => {
    const raw = localStorage.getItem(THEME_STORAGE_KEY) ?? "auto";
    const saved: ThemeChoice = raw === "auto" || isThemeId(raw) ? raw : "auto";
    setChoice(saved);
    document.documentElement.dataset.theme = resolve(saved);

    const mq = window.matchMedia("(prefers-color-scheme: light)");
    const onChange = () => {
      const c = localStorage.getItem(THEME_STORAGE_KEY) ?? "auto";
      if (c === "auto") document.documentElement.dataset.theme = resolve("auto");
    };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  return (
    <div
      role="radiogroup"
      aria-label="Colour theme"
      className={cn("flex items-center gap-[2px] border border-linebright p-[2px]", className)}
    >
      {OPTIONS.map((o) => {
        const active = choice === o.id;
        const Icon = o.icon;
        return (
          <button
            key={o.id}
            role="radio"
            aria-checked={active}
            aria-label={`${o.label} theme`}
            title={`${o.label} theme`}
            onClick={() => apply(o.id)}
            className="relative flex items-center gap-1.5 px-1.5 py-[7px] text-[10px] sm:px-2"
          >
            {active && (
              <motion.span
                layoutId="ll-theme-pill"
                className="absolute inset-0 bg-lime"
                transition={{ type: "spring", stiffness: 420, damping: 34 }}
              />
            )}
            <Icon
              size={12}
              className={cn("relative", active ? "text-limedark" : "text-mist")}
            />
            <span
              className={cn(
                "relative hidden lg:inline",
                active ? "font-medium text-limedark" : "text-mist"
              )}
            >
              {o.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
