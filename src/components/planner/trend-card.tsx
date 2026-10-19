"use client";

import { useMemo } from "react";
import { Panel, CardHead } from "./card";
import { moneyWhole } from "@/lib/format";
import { shiftMonth, monthLabel } from "@/lib/months";
import { deriveMonth } from "@/lib/local-planner";
import { useCurrency } from "@/lib/currency-context";
import type { LocalPlannerStore } from "@/lib/local-planner";
import { cn } from "@/lib/utils";

interface TrendCardProps {
  store: LocalPlannerStore;
  currentMonth: string;
  className?: string;
}

/** Last 6 months of income vs spending — the pattern that matters over time. */
export function TrendCard({ store, currentMonth, className }: TrendCardProps) {
  const { code } = useCurrency();

  const months = useMemo(() => {
    return Array.from({ length: 6 }, (_, i) => {
      const key = shiftMonth(currentMonth, -(5 - i));
      const data = deriveMonth(store, key);
      return { key, label: monthLabel(key).slice(0, 3), income: data.incomeCents, expense: data.expenseCents, net: data.incomeCents - data.expenseCents };
    });
  }, [store, currentMonth]);

  const maxVal = Math.max(...months.flatMap((m) => [m.income, m.expense]), 1);
  const BAR_H = 80;

  const hasData = months.some((m) => m.income > 0 || m.expense > 0);

  return (
    <Panel className={cn("flex flex-col", className)}>
      <CardHead
        title="6-month trend"
        hint="Income and spending side by side for the last 6 months."
        help="Green bars are money you received. Dark bars are money you spent. The number below each month is the net — positive means you kept more than you spent."
      />

      {!hasData ? (
        <p className="py-10 text-center text-[12px] text-mist">Add entries across a few months to see your trend here.</p>
      ) : (
        <>
          <div className="mt-4 flex items-end justify-between gap-2">
            {months.map((m) => (
              <div key={m.key} className="flex flex-1 flex-col items-center gap-1">
                {/* income bar */}
                <div className="flex w-full items-end justify-center gap-[2px]" style={{ height: BAR_H }}>
                  <div
                    className="w-[10px] rounded-t-[2px] bg-mint/70 transition-all"
                    style={{ height: `${Math.max((m.income / maxVal) * BAR_H, m.income > 0 ? 4 : 0)}px` }}
                    title={`Income: ${moneyWhole(m.income, code)}`}
                  />
                  <div
                    className="w-[10px] rounded-t-[2px] bg-bone/70 transition-all"
                    style={{ height: `${Math.max((m.expense / maxVal) * BAR_H, m.expense > 0 ? 4 : 0)}px` }}
                    title={`Spent: ${moneyWhole(m.expense, code)}`}
                  />
                </div>

                {/* net */}
                <span className={cn("tabular font-mono text-[9px] leading-none", m.net >= 0 ? "text-mint" : "text-rose")}>
                  {m.net >= 0 ? "+" : "−"}
                  {moneyWhole(Math.abs(m.net), code).replace(/[^0-9k.]/g, m.net < 0 ? "−" : "").slice(0, 6)}
                </span>

                <span className="text-[9px] text-mist">{m.label}</span>
              </div>
            ))}
          </div>

          <div className="mt-4 flex items-center gap-4 border-t border-line/60 pt-3 text-[10.5px] text-mist">
            <span className="flex items-center gap-1.5"><span className="inline-block h-2 w-2 rounded-[1px] bg-mint/70" /> Income</span>
            <span className="flex items-center gap-1.5"><span className="inline-block h-2 w-2 rounded-[1px] bg-bone/70" /> Spending</span>
            <span className="flex items-center gap-1.5"><span className="inline-block h-2 w-2 rounded-[1px] bg-mint" /> Net saved</span>
          </div>
        </>
      )}
    </Panel>
  );
}
