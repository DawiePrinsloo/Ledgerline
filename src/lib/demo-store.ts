import { daysInMonth, currentMonthKey, shiftMonth } from "./months";
import { mulberry32 } from "./utils";
import type { LocalPlannerStore } from "./local-planner";

/**
 * Client-side demo data.
 *
 * This mirrors the old server seed so the static PWA still opens with a fully
 * populated planner on first launch. The moment the buyer edits anything, that
 * copy becomes their own local data in localStorage.
 */

const CATS = [
  { key: "housing", name: "Housing", icon: "home", color: "#E8E3D5", budget: 185000, kind: "expense" as const, sort: 1 },
  { key: "utilities", name: "Utilities", icon: "zap", color: "#FFD84D", budget: 18000, kind: "expense" as const, sort: 2 },
  { key: "groceries", name: "Groceries", icon: "cart", color: "#C6F24E", budget: 62000, kind: "expense" as const, sort: 3 },
  { key: "dining", name: "Dining & coffee", icon: "coffee", color: "#FF9E6B", budget: 34000, kind: "expense" as const, sort: 4 },
  { key: "transport", name: "Transport", icon: "car", color: "#7EC8E3", budget: 26000, kind: "expense" as const, sort: 5 },
  { key: "shopping", name: "Shopping", icon: "bag", color: "#FFB3C7", budget: 20000, kind: "expense" as const, sort: 6 },
  { key: "health", name: "Health", icon: "heart", color: "#FF6B81", budget: 12000, kind: "expense" as const, sort: 7 },
  { key: "subs", name: "Subscriptions", icon: "repeat", color: "#B79CFF", budget: 9600, kind: "expense" as const, sort: 8 },
  { key: "leisure", name: "Leisure", icon: "sparkles", color: "#FFD84D", budget: 18000, kind: "expense" as const, sort: 9 },
  { key: "income", name: "Income", icon: "briefcase", color: "#8FE3B0", budget: 0, kind: "income" as const, sort: 10 },
];

const GOALS = [
  { id: 1, name: "Kyoto in October", icon: "plane", color: "#7EC8E3", targetCents: 420000, savedCents: 288500, targetLabel: "FLIGHTS + 9 NIGHTS" },
  { id: 2, name: "Emergency fund", icon: "shield", color: "#C6F24E", targetCents: 1000000, savedCents: 990000, targetLabel: "6-MONTH BUFFER" },
  { id: 3, name: "Oak studio desk", icon: "armchair", color: "#FF9E6B", targetCents: 120000, savedCents: 117500, targetLabel: "STUDIO REBOOT" },
];

const POOLS: Record<string, string[]> = {
  groceries: ["Marlow & Sons", "Trader Joe's", "Union Market", "Farmers market", "Whole Foods"],
  dining: ["Blue Bottle", "Sweetgreen", "Lucali", "Chipotle", "Diner on 9th", "Katz's Deli", "Verlaine"],
  transport: ["Citi Bike", "Uber", "Lyft", "Shell station", "MTA card top-up"],
  leisure: ["MoMA tickets", "Steam", "Book Club Books", "AMC Theatres"],
  shopping: ["Uniqlo", "Zara", "Dr. Martens", "Muji homeware", "Birthday gift — Maya"],
};

type TxSeed = {
  date: string;
  cat: string;
  note: string;
  amountCents: number;
  kind: "expense" | "income";
};

function seedFor(key: string): number {
  const [y, m] = key.split("-").map(Number);
  return y * 100 + m * 7 + 13;
}

function generateMonth(key: string, uptoDay: number): TxSeed[] {
  const rand = mulberry32(seedFor(key));
  const out: TxSeed[] = [];
  const iso = (day: number) => `${key}-${`${day}`.padStart(2, "0")}`;
  const push = (
    day: number,
    cat: string,
    note: string,
    amountCents: number,
    kind: "expense" | "income" = "expense"
  ) => {
    if (day >= 1 && day <= uptoDay) out.push({ date: iso(day), cat, note, amountCents, kind });
  };
  const dollars = (min: number, max: number) =>
    (min + Math.floor(rand() * (max - min))) * 100;

  // Fixed anchors
  push(1, "income", "Salary — Field & Form Co.", 640000, "income");
  push(1, "housing", "Rent — Unit 4B", 185000);
  push(2, "subs", "Figma", 1500);
  push(3, "health", "Equinox", 8800);
  push(4, "subs", "Netflix", 1549);
  push(6, "utilities", "ConEd electric", dollars(52, 89));
  push(9, "utilities", "Verizon WiFi", 6500);
  push(9, "subs", "Spotify", 1199);
  push(11, "subs", "iCloud+", 299);
  push(13, "health", "Therapy copay", 4000);
  push(14, "income", "Freelance — Studio Nova", dollars(78, 95), "income");
  push(15, "subs", "NYTimes", 2000);
  push(21, "utilities", "Water & sewer", dollars(28, 44));
  push(27, "health", "Therapy copay", 4000);

  const spread = (
    cat: string,
    gapMin: number,
    gapMax: number,
    min: number,
    max: number
  ) => {
    const pool = POOLS[cat];
    let day = 2 + Math.floor(rand() * gapMax);
    while (day <= uptoDay) {
      push(day, cat, pool[Math.floor(rand() * pool.length)], dollars(min, max));
      day += gapMin + Math.floor(rand() * (gapMax - gapMin + 1));
    }
  };

  spread("groceries", 3, 5, 34, 92);
  spread("dining", 2, 4, 9, 52);
  spread("transport", 2, 4, 3, 26);
  spread("leisure", 5, 9, 14, 62);
  spread("shopping", 8, 13, 18, 95);

  return out;
}

/** Build the two-month seeded demo store entirely on the client. */
export function createDemoStore(): LocalPlannerStore {
  const current = currentMonthKey();
  const previous = shiftMonth(current, -1);
  const todayDay = new Date().getDate();

  const categories = CATS.map((c, i) => ({
    id: i + 1,
    name: c.name,
    icon: c.icon,
    color: c.color,
    budgetCents: c.budget,
    kind: c.kind,
    sort: c.sort,
    spentCents: 0,
    txCount: 0,
  }));

  const idByKey = new Map(CATS.map((c, i) => [c.key, i + 1]));
  const seeds = [
    ...generateMonth(previous, daysInMonth(previous)),
    ...generateMonth(current, todayDay),
  ];

  const transactions = seeds.map((s, i) => ({
    id: i + 1,
    date: s.date,
    note: s.note,
    amountCents: s.amountCents,
    kind: s.kind,
    categoryId: idByKey.get(s.cat)!,
  }));

  // Main salary lands on the 1st, so the buyer's allowance is worked from there.
  return {
    version: 1,
    categories,
    transactions,
    goals: GOALS,
    paydayDay: 1,
    recurring: [],
    netWorthItems: [],
    bucketMap: {},
    debts: [],
    irregularExpenses: [],
    updatedAt: new Date().toISOString(),
  };
}
