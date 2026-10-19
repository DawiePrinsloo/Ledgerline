export type ThemeId = "organic" | "obsidian" | "midnight";
export type ThemeChoice = ThemeId | "auto";

export const DEFAULT_THEME: ThemeId = "obsidian";
export const LIGHT_THEME: ThemeId = "organic";
export const THEME_STORAGE_KEY = "ll-theme-choice";

export interface ThemeDef {
  id: ThemeId;
  name: string;
  light: boolean;
}

/** System / Light / Dark / Midnight. Charts re-tint from the same CSS vars. */
export const THEMES: ThemeDef[] = [
  { id: "organic", name: "Light", light: true },
  { id: "obsidian", name: "Dark", light: false },
  { id: "midnight", name: "Midnight", light: false },
];

export function isThemeId(value: unknown): value is ThemeId {
  return THEMES.some((t) => t.id === value);
}

/**
 * Category/goal hues are theme-aware CSS vars keyed by the row's icon name
 * (home, cart, coffee… ). SSR-safe: identical strings on server and client.
 */
export function toneVar(iconKey: string): string {
  return `var(--tone-${iconKey}, var(--mist))`;
}

/** Pre-paint bootstrap: reads the saved choice, resolves auto → theme. */
export const THEME_INIT_SCRIPT = `(function(){try{var c=localStorage.getItem("${THEME_STORAGE_KEY}")||"auto";var ids=["organic","obsidian","midnight"];if(c!=="auto"&&ids.indexOf(c)===-1)c="auto";var light=window.matchMedia&&window.matchMedia("(prefers-color-scheme: light)").matches;var t=c==="auto"?(light?"${LIGHT_THEME}":"${DEFAULT_THEME}"):c;document.documentElement.dataset.theme=t;}catch(e){document.documentElement.dataset.theme="${DEFAULT_THEME}"}})();`;
