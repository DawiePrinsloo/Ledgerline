/** Money is stored as integer hundredths everywhere; currency is display-only. */

import { DEFAULT_CURRENCY, localeFor, symbolFor } from "./currencies";

export function moneyExact(cents: number, code: string = DEFAULT_CURRENCY): string {
  return new Intl.NumberFormat(localeFor(code), {
    style: "currency",
    currency: code,
  }).format(cents / 100);
}

export function moneyWhole(cents: number, code: string = DEFAULT_CURRENCY): string {
  return new Intl.NumberFormat(localeFor(code), {
    style: "currency",
    currency: code,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Math.round(cents / 100));
}

/** Compact: $7.6k / R12.4k */
export function moneyCompact(cents: number, code: string = DEFAULT_CURRENCY): string {
  const abs = Math.abs(cents);
  if (abs >= 100_000) {
    return `${symbolFor(code)}${(cents / 100 / 1000).toFixed(1)}k`;
  }
  return moneyWhole(cents, code);
}

/**
 * Tolerant amount parser: "$6,400", "6400", "12,50", "12.50", "1 234,56" —
 * handles both decimal conventions. Returns integer hundredths.
 * With `signed`, a leading minus is kept (for adjustments like −100).
 */
export function parseDollarsToCents(raw: string, signed = false): number | null {
  let s = raw.replace(signed ? /[^0-9.,-]/g : /[^0-9.,]/g, "");
  if (!s) return null;
  const negative = signed && s.startsWith("-");
  if (negative) s = s.replace(/^-+/, "");
  if (!s) return null;

  const hasDot = s.includes(".");
  const hasComma = s.includes(",");

  if (hasDot && hasComma) {
    // Rightmost separator is the decimal one.
    const dec = s.lastIndexOf(".") > s.lastIndexOf(",") ? "." : ",";
    const thou = dec === "." ? "," : ".";
    s = s.split(thou).join("");
    if (dec === ",") s = s.replace(",", ".");
  } else if (hasComma) {
    const parts = s.split(",");
    // "12,50" → decimal; "1,234" → thousands
    s = parts.length === 2 && parts[1].length !== 3 ? parts.join(".") : parts.join("");
  }

  const n = Number(s);
  if (!Number.isFinite(n) || n <= 0) return null;
  return Math.round(n * 100);
}

export function pct(part: number, whole: number): number {
  if (whole <= 0) return 0;
  return Math.round((part / whole) * 100);
}
