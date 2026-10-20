export type Kind = "expense" | "income";

export interface CategoryDTO {
  id: number;
  name: string;
  icon: string;
  color: string;
  budgetCents: number;
  kind: Kind;
  sort: number;
  /** Aggregated for the active month */
  spentCents: number;
  txCount: number;
}

export interface TxDTO {
  id: number;
  date: string;
  note: string;
  amountCents: number;
  kind: Kind;
  categoryId: number;
}

/** A new entry before it is given an id. Shared by both add forms. */
export type NewTxPayload = Omit<TxDTO, "id">;

export interface GoalDTO {
  id: number;
  name: string;
  color: string;
  icon: string;
  targetCents: number;
  savedCents: number;
  targetLabel: string | null;
  /** ISO date YYYY-MM-DD by which the goal should be reached (optional). */
  targetDate?: string | null;
}

/** Calculate the monthly contribution needed to reach a goal by its target date. */
export function monthlyContribution(goal: GoalDTO, todayISO: string): number | null {
  if (!goal.targetDate) return null;
  const remaining = goal.targetCents - goal.savedCents;
  if (remaining <= 0) return 0;
  const [ty, tm] = goal.targetDate.split("-").map(Number);
  const [cy, cm] = todayISO.slice(0, 7).split("-").map(Number);
  const months = (ty - cy) * 12 + (tm - cm);
  if (months <= 0) return remaining; // overdue — need it all now
  return Math.ceil(remaining / months);
}

export interface PlannerData {
  month: string;
  categories: CategoryDTO[];
  transactions: TxDTO[];
  goals: GoalDTO[];
  incomeCents: number;
  expenseCents: number;
}

/** A transaction that repeats every month on a fixed day. */
export interface RecurringDTO {
  id: number;
  name: string;
  amountCents: number;
  kind: Kind;
  categoryId: number;
  dayOfMonth: number;
  /** If false the recurring is paused, not deleted. */
  active: boolean;
}

/** A single asset or liability for net worth tracking. */
export interface NetWorthItemDTO {
  id: number;
  name: string;
  amountCents: number;
  /** "asset" = savings, property, investments; "liability" = debts, loans */
  type: "asset" | "liability";
}

/** Which 50/30/20 bucket a category belongs to: needs, wants, or savings. */
export type BudgetBucket = "needs" | "wants" | "savings";

export interface DebtDTO {
  id: number;
  name: string;
  balanceCents: number;
  interestRate: number;
  minimumPaymentCents: number;
}

export interface IrregularExpenseDTO {
  id: number;
  name: string;
  annualCents: number;
}
