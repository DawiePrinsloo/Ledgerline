"use client";

import { useMemo } from "react";
import { Panel, CardHead } from "./card";
import { moneyWhole } from "@/lib/format";
import { shiftMonth, monthLabel } from "@/lib/months";
import { deriveMonth } from "@/lib/local-planner";
import { useCurrency } from "@/lib/currency-context";
import type { LocalPlannerStore } from "@/lib/local-planner";
import { cn } from "@/lib/utils";

interface AnnualSummaryCardProps {
  store: LocalPlannerStore;
  currentMonth: string;
  className?: string;
}

/** 12-month annual totals — income, spending, savings, month by month. */
export function AnnualSummaryCard({ store, currentMonth, className }: AnnualSummaryCardProps) {
  const { code } = useCurrency();

  const months = useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => {
      const key = shiftMonth(currentMonth, -(11 - i));
      const d = deriveMonth(store, key);
      return {
        key,
        short: monthLabel(key).slice(0, 3),
        income: d.incomeCents,
        expense: d.expenseCents,
        saved: d.incomeCents - d.expenseCents,
      };
    });
  }, [store, currentMonth]);

  const totals = months.reduce(
    (acc, m) => ({
      income: acc.income + m.income,
      expense: acc.expense + m.expense,
      saved: acc.saved + m.saved,
    }),
    { income: 0, expense: 0, saved: 0 }
  );

  const hasData = months.some((m) => m.income > 0 || m.expense > 0);

  return (
    <Panel className={className}>
      <CardHead
        title="Annual summary"
        hint="12-month totals: income, spending, and how much you kept."
        help="This shows the last 12 months from today. Scroll right to see all months. The totals row at the bottom adds everything up."
      />

      {!hasData ? (
        <p className="py-10 text-center text-[12px] text-mist">
          Add entries across a few months to see your annual totals here.
        </p>
      ) : (
        <div className="-mx-1 overflow-x-auto px-1">
          <table className="w-full min-w-[600px] text-left">
            <thead>
              <tr className="border-b border-line text-[10px] uppercase tracking-[0.12em] text-mist">
                <th className="py-2 pr-3 font-normal">Month</th>
                <th className="py-2 pr-3 text-right font-normal">Income</th>
                <th className="py-2 pr-3 text-right font-normal">Spent</th>
                <th className="py-2 text-right font-normal">Saved</th>
              </tr>
            </thead>
            <tbody>
              {months.map((m) => {
                const active = m.income > 0 || m.expense > 0;
                return (
                  <tr key={m.key} className={cn("border-b border-line/40", !active && "opacity-30")}>
                    <td className="py-1.5 pr-3 text-[11.5px] text-bone">{m.short}</td>
                    <td className="tabular py-1.5 pr-3 text-right font-mono text-[11.5px] text-mint">
                      {active ? moneyWhole(m.income, code) : "—"}
                    </td>
                    <td className="tabular py-1.5 pr-3 text-right font-mono text-[11.5px] text-bone">
                      {active ? moneyWhole(m.expense, code) : "—"}
                    </td>
                    <td className={cn("tabular py-1.5 text-right font-mono text-[11.5px]", m.saved >= 0 ? "text-lime" : "text-rose")}>
                      {active ? (m.saved >= 0 ? "+" : "−") + moneyWhole(Math.abs(m.saved), code) : "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-bone/30 font-semibold">
                <td className="py-2 pr-3 text-[12px] text-bone">Year total</td>
                <td className="tabular py-2 pr-3 text-right font-mono text-[12px] text-mint">{moneyWhole(totals.income, code)}</td>
                <td className="tabular py-2 pr-3 text-right font-mono text-[12px] text-bone">{moneyWhole(totals.expense, code)}</td>
                <td className={cn("tabular py-2 text-right font-mono text-[12px]", totals.saved >= 0 ? "text-lime" : "text-rose")}>
                  {totals.saved >= 0 ? "+" : "−"}{moneyWhole(Math.abs(totals.saved), code)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </Panel>
  );
}
