import { and, asc, desc, gte, lte } from "drizzle-orm";
import { db } from "@/db";
import { categories, goals, transactions } from "@/db/schema";
import { ensureSeed } from "@/db/seed";
import { monthRange, currentMonthKey } from "@/lib/months";
import type { PlannerData, CategoryDTO } from "@/lib/types";

const MONTH_RE = /^\d{4}-\d{2}$/;

export function normalizeMonth(key: string | null | undefined): string {
  if (key && MONTH_RE.test(key)) return key;
  return currentMonthKey();
}

/** Everything the planner needs for one month, aggregated server-side. */
export async function getPlannerData(rawMonth?: string | null): Promise<PlannerData> {
  await ensureSeed();
  const month = normalizeMonth(rawMonth);
  const { start, end } = monthRange(month);

  const [cats, txs, goalRows] = await Promise.all([
    db.select().from(categories).orderBy(asc(categories.sort)),
    db
      .select()
      .from(transactions)
      .where(and(gte(transactions.date, start), lte(transactions.date, end)))
      .orderBy(desc(transactions.date), desc(transactions.id)),
    db.select().from(goals).orderBy(asc(goals.id)),
  ]);

  const spentByCat = new Map<number, { cents: number; count: number }>();
  let incomeCents = 0;
  let expenseCents = 0;

  for (const t of txs) {
    if (t.kind === "income") {
      incomeCents += t.amountCents;
    } else {
      expenseCents += t.amountCents;
      const agg = spentByCat.get(t.categoryId) ?? { cents: 0, count: 0 };
      agg.cents += t.amountCents;
      agg.count += 1;
      spentByCat.set(t.categoryId, agg);
    }
  }

  const catDTOs: CategoryDTO[] = cats.map((c) => ({
    id: c.id,
    name: c.name,
    icon: c.icon,
    color: c.color,
    budgetCents: c.budgetCents,
    kind: c.kind,
    sort: c.sort,
    spentCents: spentByCat.get(c.id)?.cents ?? 0,
    txCount: spentByCat.get(c.id)?.count ?? 0,
  }));

  return {
    month,
    categories: catDTOs,
    transactions: txs.map((t) => ({
      id: t.id,
      date: t.date,
      note: t.note,
      amountCents: t.amountCents,
      kind: t.kind,
      categoryId: t.categoryId,
    })),
    goals: goalRows.map((g) => ({
      id: g.id,
      name: g.name,
      color: g.color,
      icon: g.icon,
      targetCents: g.targetCents,
      savedCents: g.savedCents,
      targetLabel: g.targetLabel,
    })),
    incomeCents,
    expenseCents,
  };
}
