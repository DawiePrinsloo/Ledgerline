"use client";

import { useMemo, useState } from "react";
import { Check, X } from "lucide-react";
import { Panel, CardHead } from "./card";
import { moneyWhole } from "@/lib/format";
import { daysInMonth } from "@/lib/months";
import { useCurrency } from "@/lib/currency-context";
import type { LocalPlannerStore } from "@/lib/local-planner";
import { cn } from "@/lib/utils";

interface BillCalendarCardProps {
  store: LocalPlannerStore;
  month: string;
  today: string;
  onMarkPaid: (recurringId: number, month: string) => void;
  className?: string;
}

/** Bill calendar — shows recurring bills for the month with paid/unpaid status. */
export function BillCalendarCard({
  store,
  month,
  today,
  onMarkPaid,
  className,
}: BillCalendarCardProps) {
  const { code } = useCurrency();
  const todayDay = today.startsWith(month) ? Number(today.slice(8, 10)) : 32;

  // Bills = active recurring expenses
  const bills = useMemo(() => {
    const active = store.recurring.filter((r) => r.kind === "expense" && r.active);
    return active
      .map((r) => {
        const day = Math.min(r.dayOfMonth, daysInMonth(month));
        // A bill is "paid" if a matching transaction exists in this month
        const paid = store.transactions.some(
          (tx) =>
            tx.date.startsWith(`${month}-`) &&
            tx.categoryId === r.categoryId &&
            tx.amountCents === r.amountCents &&
            tx.note === r.name
        );
        const overdue = !paid && day < todayDay;
        return { ...r, day, paid, overdue };
      })
      .sort((a, b) => a.day - b.day);
  }, [store.recurring, store.transactions, month, todayDay]);

  const totalBills = bills.reduce((s, b) => s + b.amountCents, 0);
  const paidTotal = bills.filter((b) => b.paid).reduce((s, b) => s + b.amountCents, 0);
  const unpaidTotal = totalBills - paidTotal;

  if (bills.length === 0) {
    return (
      <Panel className={className}>
        <CardHead
          title="Bill calendar"
          hint="A monthly view of your recurring bills and whether they've been paid."
          help="Bills are pulled from your recurring transactions. Add a recurring expense to see it here. A bill is marked paid when a matching transaction appears in the ledger."
        />
        <p className="py-8 text-center text-[12px] text-mist">
          No recurring bills set up yet. Add a recurring expense and it will appear here.
        </p>
      </Panel>
    );
  }

  return (
    <Panel className={className}>
      <CardHead
        title="Bill calendar"
        hint="Monthly bills in date order — green when paid, amber when due soon, red when overdue."
        help="A bill shows as paid when a matching transaction is found in the ledger. The matching is done by category, amount and name from your recurring list."
      />

      {/* summary strip */}
      <div className="mb-4 grid grid-cols-3 gap-2 text-center">
        <div className="border border-line bg-coal px-2 py-2">
          <div className="text-[9px] uppercase tracking-[0.15em] text-mist">Total bills</div>
          <div className="tabular mt-1 font-mono text-[14px] text-bone">{moneyWhole(totalBills, code)}</div>
        </div>
        <div className="border border-lime/40 bg-coal px-2 py-2">
          <div className="text-[9px] uppercase tracking-[0.15em] text-mist">Paid</div>
          <div className="tabular mt-1 font-mono text-[14px] text-mint">{moneyWhole(paidTotal, code)}</div>
        </div>
        <div className="border border-ember/40 bg-coal px-2 py-2">
          <div className="text-[9px] uppercase tracking-[0.15em] text-mist">Still due</div>
          <div className="tabular mt-1 font-mono text-[14px] text-ember">{moneyWhole(unpaidTotal, code)}</div>
        </div>
      </div>

      <div className="space-y-1.5">
        {bills.map((b) => {
          const cat = store.categories.find((c) => c.id === b.categoryId);
          return (
            <div
              key={b.id}
              className={cn(
                "flex items-center gap-3 rounded-[3px] border px-3 py-2.5",
                b.paid
                  ? "border-mint/30 bg-mint/5"
                  : b.overdue
                    ? "border-rose/40 bg-rose/5"
                    : "border-line bg-coal"
              )}
            >
              {/* day badge */}
              <div
                className={cn(
                  "flex w-8 shrink-0 flex-col items-center rounded-[3px] py-1",
                  b.paid ? "bg-mint/20 text-mint" : b.overdue ? "bg-rose/20 text-rose" : "bg-raise text-mist"
                )}
              >
                <span className="font-mono text-[13px] font-semibold leading-none">{b.day}</span>
                <span className="text-[8px] uppercase tracking-[0.1em]">
                  {new Date(`${month}-${String(b.day).padStart(2, "0")}T12:00:00`).toLocaleDateString("en-US", { weekday: "short" }).slice(0, 2)}
                </span>
              </div>

              <div className="min-w-0 flex-1">
                <div className="truncate text-[13px] text-bone">{b.name}</div>
                <div className="text-[10px] text-mist">{cat?.name ?? "—"}</div>
              </div>

              <span className={cn("tabular shrink-0 font-mono text-[13px]", b.paid ? "text-mint" : "text-fog")}>
                {moneyWhole(b.amountCents, code)}
              </span>

              <div className="shrink-0">
                {b.paid ? (
                  <span className="flex size-6 items-center justify-center rounded-full bg-mint/20 text-mint">
                    <Check size={13} />
                  </span>
                ) : (
                  <span className={cn(
                    "flex size-6 items-center justify-center rounded-full font-mono text-[8px] font-semibold",
                    b.overdue ? "bg-rose/20 text-rose" : "bg-raise text-mist"
                  )}>
                    {b.overdue ? "!" : "—"}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
      <p className="mt-3 text-[10.5px] text-mist">
        Bills are matched to ledger entries automatically. Log the transaction to mark a bill paid.
      </p>
    </Panel>
  );
}
