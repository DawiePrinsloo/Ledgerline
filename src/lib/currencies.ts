export interface CurrencyDef {
  code: string;
  symbol: string;
  name: string;
  locale: string;
}

export const DEFAULT_CURRENCY = "USD";
export const CURRENCY_COOKIE = "ll-currency";

/** The majors — USD first (default), ZAR explicitly on board. */
export const CURRENCIES: CurrencyDef[] = [
  { code: "USD", symbol: "$", name: "US Dollar", locale: "en-US" },
  { code: "ZAR", symbol: "R", name: "South African Rand", locale: "en-ZA" },
  { code: "EUR", symbol: "€", name: "Euro", locale: "de-DE" },
  { code: "GBP", symbol: "£", name: "British Pound", locale: "en-GB" },
  { code: "JPY", symbol: "¥", name: "Japanese Yen", locale: "ja-JP" },
  { code: "CHF", symbol: "CHF", name: "Swiss Franc", locale: "de-CH" },
  { code: "CAD", symbol: "$", name: "Canadian Dollar", locale: "en-CA" },
  { code: "AUD", symbol: "A$", name: "Australian Dollar", locale: "en-AU" },
  { code: "NZD", symbol: "$", name: "New Zealand Dollar", locale: "en-NZ" },
  { code: "CNY", symbol: "¥", name: "Chinese Yuan", locale: "zh-CN" },
  { code: "HKD", symbol: "$", name: "Hong Kong Dollar", locale: "en-HK" },
  { code: "SGD", symbol: "$", name: "Singapore Dollar", locale: "en-SG" },
  { code: "INR", symbol: "₹", name: "Indian Rupee", locale: "en-IN" },
  { code: "BRL", symbol: "R$", name: "Brazilian Real", locale: "pt-BR" },
  { code: "MXN", symbol: "$", name: "Mexican Peso", locale: "es-MX" },
  { code: "SEK", symbol: "kr", name: "Swedish Krona", locale: "sv-SE" },
  { code: "NOK", symbol: "kr", name: "Norwegian Krone", locale: "nb-NO" },
  { code: "KRW", symbol: "₩", name: "South Korean Won", locale: "ko-KR" },
];

export function isCurrencyCode(value: unknown): value is string {
  return CURRENCIES.some((c) => c.code === value);
}

export function normalizeCurrency(value: string | null | undefined): string {
  return isCurrencyCode(value) ? value : DEFAULT_CURRENCY;
}

export function localeFor(code: string): string {
  return CURRENCIES.find((c) => c.code === code)?.locale ?? "en-US";
}

export function symbolFor(code: string): string {
  return CURRENCIES.find((c) => c.code === code)?.symbol ?? "$";
}
