"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Panel, CardHead } from "./card";
import { moneyWhole, pct } from "@/lib/format";
import { monthShort } from "@/lib/months";
import { toneVar } from "@/lib/themes";
import { useCurrency } from "@/lib/currency-context";
import type { CategoryDTO } from "@/lib/types";
import { cn } from "@/lib/utils";

const R = 84;
const C = 2 * Math.PI * R;

interface DonutCardProps {
  categories: CategoryDTO[];
  expenseCents: number;
  month: string;
  onFilter?: (categoryId: number) => void;
  /** Renders as the page's lead infographic: wider ring, side-by-side layout. */
  hero?: boolean;
  className?: string;
}

export function DonutCard({
  categories,
  expenseCents,
  month,
  onFilter,
  hero = false,
  className,
}: DonutCardProps) {
  const { code } = useCurrency();
  const [hovered, setHovered] = useState<number | null>(null);

  const segments = useMemo(() => {
    const cats = categories
      .filter((c) => c.kind === "expense" && c.spentCents > 0)
      .sort((a, b) => b.spentCents - a.spentCents);
    let acc = 0;
    return cats.map((c) => {
      const frac = expenseCents > 0 ? c.spentCents / expenseCents : 0;
      const len = frac * C;
      const seg = { cat: c, offset: acc, len: Math.max(len - 2.5, 0), frac };
      acc += len;
      return seg;
    });
  }, [categories, expenseCents]);

  const active = segments.find((s) => s.cat.id === hovered);
  const budgetTotal = categories
    .filter((c) => c.kind === "expense")
    .reduce((sum, c) => sum + c.budgetCents, 0);
  const budgetDelta = budgetTotal - expenseCents;

  return (
    <Panel className={cn("flex flex-col", className)}>
      <CardHead
        title="Where your money went"
        hint="Each slice is one spending category. Hover a slice to see its total, or click a row below to show only those entries in your list."
        help="The ring shows how this month's spending splits across your categories. The biggest spender sits at the top of the list. Income is not included here — only money going out."
        right={monthShort(month)}
      />

      {segments.length === 0 ? (
        <p className="py-16 text-center font-mono text-[11px] tracking-[0.2em] text-mist">
          NOTHING LOGGED YET.
        </p>
      ) : (
        <div className={cn(hero && "md:flex md:items-start md:gap-8")}>
          <div className={cn("relative mx-auto w-full", hero ? "max-w-[280px] md:mx-0" : "max-w-[240px]")}>
            <svg viewBox="0 0 220 220" className="w-full -rotate-90">
              <circle
                cx="110"
                cy="110"
                r={R}
                fill="none"
                stroke="var(--track)"
                strokeWidth="24"
              />
              {segments.map((s, i) => (
                <motion.circle
                  key={`${month}-${s.cat.id}`}
                  cx="110"
                  cy="110"
                  r={R}
                  fill="none"
                  stroke={toneVar(s.cat.icon)}
                  strokeDasharray={`${s.len} ${C - s.len}`}
                  strokeDashoffset={-s.offset}
                  initial={{ opacity: 0 }}
                  animate={{
                    opacity: 1,
                    strokeWidth: hovered === s.cat.id ? 31 : 24,
                  }}
                  transition={{
                    opacity: { delay: i * 0.06, duration: 0.5 },
                    strokeWidth: { type: "spring", stiffness: 300, damping: 20 },
                  }}
                  onMouseEnter={() => setHovered(s.cat.id)}
                  onMouseLeave={() => setHovered(null)}
                  className="cursor-pointer"
                />
              ))}
            </svg>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
              {active ? (
                <>
                  <span className="max-w-[110px] truncate font-mono text-[9px] tracking-[0.25em] text-mist">
                    {active.cat.name.toUpperCase()}
                  </span>
                  <span className="tabular mt-1.5 font-mono text-[24px] leading-none text-bone">
                    {moneyWhole(active.cat.spentCents, code)}
                  </span>
                  <span className="tabular mt-1.5 font-mono text-[10px] tracking-[0.2em]" style={{ color: toneVar(active.cat.icon) }}>
                    {pct(active.cat.spentCents, expenseCents)}% OF SPENDING
                  </span>
                </>
              ) : (
                <>
                  <span className="font-mono text-[9px] tracking-[0.25em] text-mist">TOTAL SPENT</span>
                  <span className="tabular mt-1.5 font-mono text-[26px] leading-none text-bone">
                    {moneyWhole(expenseCents, code)}
                  </span>
                  <span className="mt-1.5 font-mono text-[10px] tracking-[0.2em] text-mist">
                    IN {segments.length} CATEGORIES
                  </span>
                </>
              )}
            </div>
          </div>

          <div className={cn(hero && "md:min-w-0 md:flex-1")}>
          <div className="mt-6 space-y-1 md:mt-0">
            {segments.map((s) => (
              <button
                key={s.cat.id}
                onMouseEnter={() => setHovered(s.cat.id)}
                onMouseLeave={() => setHovered(null)}
                onClick={() => onFilter?.(s.cat.id)}
                title={onFilter ? `Filter the ledger to ${s.cat.name}` : undefined}
                className={cn(
                  "flex w-full items-center gap-3 px-2 py-1.5 text-left transition-colors",
                  hovered === s.cat.id ? "bg-raise" : "hover:bg-raise/60"
                )}
              >
                <span className="size-2 shrink-0 rounded-full" style={{ backgroundColor: toneVar(s.cat.icon) }} />
                <span className="truncate font-mono text-[11px] text-fog">{s.cat.name}</span>
                <span className="tabular ml-auto font-mono text-[11px] text-bone">
                  {moneyWhole(s.cat.spentCents, code)}
                </span>
                <span className="tabular w-9 text-right font-mono text-[10px] text-mist">
                  {pct(s.cat.spentCents, expenseCents)}%
                </span>
              </button>
            ))}
          </div>

          <div className="mt-4 space-y-1.5 border-t border-line/60 pt-3 text-[11px] leading-relaxed text-mist">
            <p>
              {segments[0]
                ? `Your biggest cost is ${segments[0].cat.name.toLowerCase()} — ${pct(segments[0].cat.spentCents, expenseCents)}% of everything you spent.`
                : "No spending recorded yet."}
            </p>
            <p className={cn(budgetDelta < 0 && "text-rose")}>
              {budgetDelta >= 0
                ? `You still have ${moneyWhole(budgetDelta, code)} left in your overall budget.`
                : `You are ${moneyWhole(-budgetDelta, code)} over your overall budget.`}
            </p>
          </div>
          </div>
        </div>
      )}
    </Panel>
  );
}
