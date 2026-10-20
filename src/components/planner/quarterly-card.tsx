"use client";

import { useMemo } from "react";
import { Panel, CardHead } from "./card";
import { moneyWhole } from "@/lib/format";
import { shiftMonth } from "@/lib/months";
import { deriveMonth } from "@/lib/local-planner";
import { useCurrency } from "@/lib/currency-context";
import type { LocalPlannerStore } from "@/lib/local-planner";
import { cn } from "@/lib/utils";

interface QuarterlyCardProps {
  store: LocalPlannerStore;
  currentMonth: string;
  className?: string;
}

/** Groups the last 12 months into 4 quarters and shows totals. */
export function QuarterlyCard({ store, currentMonth, className }: QuarterlyCardProps) {
  const { code } = useCurrency();

  const quarters = useMemo(() => {
    // Build 4 quarters of 3 months each, ending at currentMonth
    return [3, 2, 1, 0].map((qOffset) => {
      const endIdx = qOffset * 3;
      const months = [2, 1, 0].map((i) => shiftMonth(currentMonth, -(endIdx + i)));
      const data = months.map((m) => deriveMonth(store, m));
      const income = data.reduce((s, d) => s + d.incomeCents, 0);
      const expense = data.reduce((s, d) => s + d.expenseCents, 0);
      const net = income - expense;
      const [y, m] = months[2].split("-").map(Number);
      const qNum = Math.ceil(m / 3);
      return { label: `Q${qNum} ${y}`, months, income, expense, net, hasData: income > 0 || expense > 0 };
    }).reverse();
  }, [store, currentMonth]);

  const hasAny = quarters.some((q) => q.hasData);

  return (
    <Panel className={className}>
      <CardHead
        title="Quarterly overview"
        hint="Income, spending and net savings grouped by quarter."
        help="Each quarter covers 3 months. Q1 = Jan–Mar, Q2 = Apr–Jun, Q3 = Jul–Sep, Q4 = Oct–Dec. The current quarter uses whatever months have data so far."
      />

      {!hasAny ? (
        <p className="py-10 text-center text-[12px] text-mist">Add entries across multiple months to see quarterly totals here.</p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {quarters.map((q) => (
            <div key={q.label} className={cn("border bg-coal p-4", q.hasData ? "border-line" : "border-line/30 opacity-40")}>
              <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-mist">{q.label}</div>
              <div className="mt-3 space-y-2">
                <div className="flex justify-between">
                  <span className="text-[11px] text-mist">Income</span>
                  <span className="tabular font-mono text-[12px] text-mint">{moneyWhole(q.income, code)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[11px] text-mist">Spent</span>
                  <span className="tabular font-mono text-[12px] text-bone">{moneyWhole(q.expense, code)}</span>
                </div>
                <div className="dashline" />
                <div className="flex justify-between">
                  <span className="text-[11px] font-medium text-bone">Net</span>
                  <span className={cn("tabular font-mono text-[13px] font-semibold", q.net >= 0 ? "text-lime" : "text-rose")}>
                    {q.net >= 0 ? "+" : "−"}{moneyWhole(Math.abs(q.net), code)}
                  </span>
                </div>
              </div>
              <div className="mt-3 text-[9.5px] text-mist">{q.months.map(m => m.slice(0, 7)).join(" · ")}</div>
            </div>
          ))}
        </div>
      )}
    </Panel>
  );
}
