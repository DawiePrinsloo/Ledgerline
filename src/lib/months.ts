/** Month helpers. A MonthKey is "YYYY-MM" in local time. */

export function monthKeyOf(d: Date): string {
  const y = d.getFullYear();
  const m = `${d.getMonth() + 1}`.padStart(2, "0");
  return `${y}-${m}`;
}

export function currentMonthKey(): string {
  return monthKeyOf(new Date());
}

export function todayISO(): string {
  const d = new Date();
  return `${monthKeyOf(d)}-${`${d.getDate()}`.padStart(2, "0")}`;
}

export function shiftMonth(key: string, delta: number): string {
  const [y, m] = key.split("-").map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return monthKeyOf(d);
}

export function daysInMonth(key: string): number {
  const [y, m] = key.split("-").map(Number);
  return new Date(y, m, 0).getDate();
}

export function monthRange(key: string): { start: string; end: string } {
  const end = `${key}-${`${daysInMonth(key)}`.padStart(2, "0")}`;
  return { start: `${key}-01`, end };
}

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const MONTHS_SHORT = [
  "JAN", "FEB", "MAR", "APR", "MAY", "JUN",
  "JUL", "AUG", "SEP", "OCT", "NOV", "DEC",
];

export function monthLabel(key: string): string {
  const [y, m] = key.split("-").map(Number);
  return `${MONTHS[m - 1]} ${y}`;
}

export function monthShort(key: string): string {
  const [y, m] = key.split("-").map(Number);
  return `${MONTHS_SHORT[m - 1]} ’${`${y}`.slice(2)}`;
}

export function isFutureMonth(key: string): boolean {
  return key > currentMonthKey();
}

export function isCurrentMonth(key: string): boolean {
  return key === currentMonthKey();
}

/** "SAT, FEB 14" or "TODAY" / "YESTERDAY" */
export function dayLabel(iso: string, today: string): string {
  if (iso === today) return "TODAY";
  const t = new Date(`${today}T12:00:00`);
  const d = new Date(`${iso}T12:00:00`);
  const diff = Math.round((t.getTime() - d.getTime()) / 86_400_000);
  if (diff === 1) return "YESTERDAY";
  const dow = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"][d.getDay()];
  return `${dow}, ${MONTHS_SHORT[d.getMonth()]} ${d.getDate()}`;
}

/** Latest selectable day inside a month (never in the future). */
export function maxDayFor(key: string, today: string): string {
  const { end } = monthRange(key);
  return today < end ? today : end;
}

const SHORT_NAMES = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

/** "Oct 1" — readable on a chart axis in any month. */
export function dayLabelShort(key: string, day: number): string {
  const m = Number(key.slice(5, 7));
  return `${SHORT_NAMES[m - 1] ?? key} ${day}`;
}

/**
 * Whole days from `todayIso` to the next occurrence of `paydayDay`.
 * Month-agnostic: rolls into the following month and clamps to that month's
 * length, so a payday of 31 still resolves in February.
 */
export function daysUntilPayday(todayIso: string, paydayDay: number): number {
  const year = Number(todayIso.slice(0, 4));
  const monthIndex = Number(todayIso.slice(5, 7)) - 1;
  const day = Number(todayIso.slice(8, 10));
  const thisMonthLength = new Date(year, monthIndex + 1, 0).getDate();
  const target = Math.min(Math.max(Math.round(paydayDay) || 1, 1), 31);

  const payThisMonth = Math.min(target, thisMonthLength);
  if (payThisMonth > day) return payThisMonth - day;

  const nextMonthLength = new Date(year, monthIndex + 2, 0).getDate();
  return thisMonthLength - day + Math.min(target, nextMonthLength);
}
