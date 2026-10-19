import {
  pgTable,
  pgEnum,
  serial,
  text,
  integer,
  date,
  timestamp,
} from "drizzle-orm/pg-core";

export const moneyKind = pgEnum("money_kind", ["expense", "income"]);

export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  icon: text("icon").notNull(),
  color: text("color").notNull(),
  budgetCents: integer("budget_cents").notNull().default(0),
  kind: moneyKind("kind").notNull().default("expense"),
  sort: integer("sort").notNull().default(0),
});

export const transactions = pgTable("transactions", {
  id: serial("id").primaryKey(),
  date: date("date", { mode: "string" }).notNull(),
  note: text("note").notNull(),
  amountCents: integer("amount_cents").notNull(),
  kind: moneyKind("kind").notNull().default("expense"),
  categoryId: integer("category_id")
    .notNull()
    .references(() => categories.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const goals = pgTable("goals", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  color: text("color").notNull(),
  icon: text("icon").notNull().default("plane"),
  targetCents: integer("target_cents").notNull(),
  savedCents: integer("saved_cents").notNull().default(0),
  targetLabel: text("target_label"),
});

export type CategoryRow = typeof categories.$inferSelect;
export type TransactionRow = typeof transactions.$inferSelect;
export type GoalRow = typeof goals.$inferSelect;
