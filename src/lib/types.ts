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
}

export interface PlannerData {
  month: string;
  categories: CategoryDTO[];
  transactions: TxDTO[];
  goals: GoalDTO[];
  incomeCents: number;
  expenseCents: number;
}
