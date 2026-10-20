import type { BudgetBucket, CategoryDTO, DebtDTO, GoalDTO, IrregularExpenseDTO, NetWorthItemDTO, NetWorthSnapshotDTO, PlannerData, RecurringDTO, TxDTO } from "./types";
import { currentMonthKey, daysInMonth } from "./months";

export const LOCAL_DATA_KEY = "ledgerline-local-planner-v1";
export const LOCAL_DATA_VERSION = 1;

export interface LocalPlannerStore {
  version: 1;
  categories: CategoryDTO[];
  transactions: TxDTO[];
  goals: GoalDTO[];
  /** Day of the month the buyer is normally paid — drives the pace allowance. */
  paydayDay: number;
  /** Transactions that repeat every month — subscriptions, rent, salary. */
  recurring: RecurringDTO[];
  /** Assets and liabilities for net worth tracking. */
  netWorthItems: NetWorthItemDTO[];
  /** Historical net worth snapshots. */
  netWorthHistory: import("./types").NetWorthSnapshotDTO[];
  /** Maps category id → 50/30/20 bucket. Missing = "wants" by default. */
  bucketMap: Record<number, BudgetBucket>;
  /** Debt payoff entries */
  debts: DebtDTO[];
  /** Irregular annual expenses with monthly saving targets */
  irregularExpenses: IrregularExpenseDTO[];
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
    recurring: [],
    netWorthItems: [],
    netWorthHistory: [],
    bucketMap: {},
    debts: [],
    irregularExpenses: [],
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
    // Restore new fields that were added after v1 — safe fallback to empty for
    // old backups that pre-date these fields.
    const recurring = Array.isArray(value.recurring)
      ? (value.recurring as RecurringDTO[]).filter(
          (r) => typeof r.id === "number" && typeof r.name === "string"
        )
      : [];
    const netWorthItems = Array.isArray(value.netWorthItems)
      ? (value.netWorthItems as NetWorthItemDTO[]).filter(
          (i) => typeof i.id === "number" && typeof i.name === "string"
        )
      : [];
    const bucketMap =
      typeof value.bucketMap === "object" &&
      value.bucketMap !== null &&
      !Array.isArray(value.bucketMap)
        ? (value.bucketMap as Record<number, BudgetBucket>)
        : {};

    return {
      version: LOCAL_DATA_VERSION,
      categories,
      transactions,
      goals,
      paydayDay: normalizePaydayDay(value.paydayDay),
      recurring,
      netWorthItems,
      netWorthHistory: Array.isArray(value.netWorthHistory) ? value.netWorthHistory as NetWorthSnapshotDTO[] : [],
      bucketMap,
      debts: Array.isArray(value.debts) ? value.debts as DebtDTO[] : [],
      irregularExpenses: Array.isArray(value.irregularExpenses) ? value.irregularExpenses as IrregularExpenseDTO[] : [],
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
 * Auto-fill recurring transactions for a given month if they haven't been
 * added yet. Returns the store with new entries appended (or unchanged if
 * all recurrings were already present).
 */
export function applyRecurring(store: LocalPlannerStore, month: string): LocalPlannerStore {
  const active = store.recurring.filter((r) => r.active);
  if (active.length === 0) return store;

  const maxDay = daysInMonth(month);
  const existingKeys = new Set(
    store.transactions
      .filter((tx) => tx.date.startsWith(`${month}-`))
      .map((tx) => `${tx.categoryId}:${tx.amountCents}:${tx.note}`)
  );

  const newTx: TxDTO[] = [];
  let nextId = Math.max(Date.now(), ...store.transactions.map((tx) => tx.id + 1), 1);

  for (const r of active) {
    const key = `${r.categoryId}:${r.amountCents}:${r.name}`;
    if (existingKeys.has(key)) continue;

    const day = Math.min(r.dayOfMonth, maxDay);
    newTx.push({
      id: nextId++,
      date: `${month}-${String(day).padStart(2, "0")}`,
      note: r.name,
      amountCents: r.amountCents,
      kind: r.kind,
      categoryId: r.categoryId,
    });
  }

  if (newTx.length === 0) return store;

  return {
    ...store,
    transactions: [...store.transactions, ...newTx],
    updatedAt: new Date().toISOString(),
  };
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
