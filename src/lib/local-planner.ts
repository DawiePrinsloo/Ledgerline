import type { CategoryDTO, GoalDTO, PlannerData, TxDTO } from "./types";
import { currentMonthKey } from "./months";

export const LOCAL_DATA_KEY = "ledgerline-local-planner-v1";
export const LOCAL_DATA_VERSION = 1;

export interface LocalPlannerStore {
  version: 1;
  categories: CategoryDTO[];
  transactions: TxDTO[];
  goals: GoalDTO[];
  /** Day of the month the buyer is normally paid — drives the pace allowance. */
  paydayDay: number;
  updatedAt: string;
}

export const DEFAULT_PAYDAY_DAY = 1;

export function normalizePaydayDay(value: unknown): number {
  const n = Math.round(Number(value));
  return Number.isFinite(n) && n >= 1 && n <= 31 ? n : DEFAULT_PAYDAY_DAY;
}

/** Combine one or more server demo months into the first-device starter store. */
export function makeStarterStore(months: PlannerData[]): LocalPlannerStore {
  const first = months[0];
  const txById = new Map<number, TxDTO>();
  for (const month of months) {
    for (const tx of month.transactions) txById.set(tx.id, tx);
  }
  // Infer the usual payday from the largest income entry on record.
  const biggestIncome = [...txById.values()]
    .filter((tx) => tx.kind === "income")
    .reduce<TxDTO | null>(
      (best, tx) => (best === null || tx.amountCents > best.amountCents ? tx : best),
      null
    );
  const inferredPayday = biggestIncome ? Number(biggestIncome.date.slice(8, 10)) : null;

  return {
    version: LOCAL_DATA_VERSION,
    categories: first.categories.map((c) => ({ ...c, spentCents: 0, txCount: 0 })),
    transactions: [...txById.values()],
    goals: first.goals.map((g) => ({ ...g })),
    paydayDay: normalizePaydayDay(inferredPayday),
    updatedAt: new Date().toISOString(),
  };
}

/** Build one month's totals from the single local ledger. */
export function deriveMonth(store: LocalPlannerStore, month: string): PlannerData {
  const transactions = store.transactions
    .filter((tx) => tx.date.startsWith(`${month}-`))
    .sort((a, b) => (a.date === b.date ? b.id - a.id : a.date < b.date ? 1 : -1));

  const agg = new Map<number, { cents: number; count: number }>();
  let incomeCents = 0;
  let expenseCents = 0;
  for (const tx of transactions) {
    if (tx.kind === "income") {
      incomeCents += tx.amountCents;
    } else {
      expenseCents += tx.amountCents;
      const row = agg.get(tx.categoryId) ?? { cents: 0, count: 0 };
      row.cents += tx.amountCents;
      row.count += 1;
      agg.set(tx.categoryId, row);
    }
  }

  return {
    month,
    categories: store.categories.map((c) => ({
      ...c,
      spentCents: agg.get(c.id)?.cents ?? 0,
      txCount: agg.get(c.id)?.count ?? 0,
    })),
    transactions,
    goals: store.goals,
    incomeCents,
    expenseCents,
  };
}

export function touchStore(store: Omit<LocalPlannerStore, "updatedAt">): LocalPlannerStore {
  return { ...store, updatedAt: new Date().toISOString() };
}

export function nextTransactionId(store: LocalPlannerStore): number {
  return Math.max(Date.now(), ...store.transactions.map((tx) => tx.id + 1), 1);
}

/** Remove personal activity while retaining useful category/budget templates. */
export function freshStore(store: LocalPlannerStore): LocalPlannerStore {
  return {
    ...store,
    transactions: [],
    goals: store.goals.map((goal) => ({ ...goal, savedCents: 0 })),
    updatedAt: new Date().toISOString(),
  };
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** Strict-enough validation for a backup selected by the buyer. */
export function parseBackup(raw: string): LocalPlannerStore | null {
  try {
    const value: unknown = JSON.parse(raw);
    if (!isObject(value) || value.version !== LOCAL_DATA_VERSION) return null;
    if (!Array.isArray(value.categories) || !Array.isArray(value.transactions) || !Array.isArray(value.goals)) {
      return null;
    }
    const categories = value.categories as CategoryDTO[];
    const transactions = value.transactions as TxDTO[];
    const goals = value.goals as GoalDTO[];
    if (
      categories.some((c) => !Number.isInteger(c.id) || typeof c.name !== "string") ||
      transactions.some(
        (tx) =>
          !Number.isInteger(tx.id) ||
          typeof tx.date !== "string" ||
          typeof tx.note !== "string" ||
          !Number.isFinite(tx.amountCents)
      ) ||
      goals.some((g) => !Number.isInteger(g.id) || typeof g.name !== "string")
    ) {
      return null;
    }
    return {
      version: LOCAL_DATA_VERSION,
      categories,
      transactions,
      goals,
      paydayDay: normalizePaydayDay(value.paydayDay),
      updatedAt: typeof value.updatedAt === "string" ? value.updatedAt : new Date().toISOString(),
    };
  } catch {
    return null;
  }
}

export function backupFilename(): string {
  return `ledgerline-backup-${currentMonthKey()}.json`;
}

/**
 * Merge any categories that exist in the starter set but are missing from a
 * buyer's saved device copy — so a planner installed before a category was
 * introduced (e.g. Utilities, Shopping) gains it without losing any entries.
 */
export function mergeMissingCategories(
  saved: LocalPlannerStore,
  starter: LocalPlannerStore
): LocalPlannerStore {
  const existing = new Set(saved.categories.map((c) => c.name.toLowerCase()));
  const missing = starter.categories.filter((c) => !existing.has(c.name.toLowerCase()));
  if (missing.length === 0) return saved;

  return {
    ...saved,
    categories: [...saved.categories, ...missing].sort((a, b) => a.sort - b.sort),
    updatedAt: new Date().toISOString(),
  };
}
