"use client";

import { useMemo, useState } from "react";
import { Check, Clock, X } from "lucide-react";
import { Panel, CardHead } from "./card";
import { moneyWhole } from "@/lib/format";
import { daysInMonth } from "@/lib/months";
import { useCurrency } from "@/lib/currency-context";
import type { LocalPlannerStore } from "@/lib/local-planner";
import type { RecurringDTO } from "@/lib/types";
import { cn } from "@/lib/utils";

interface BillCalendarCardProps {
  store: LocalPlannerStore;
  month: string;
  today: string;
  onPayBill: (bill: RecurringDTO, date: string) => void;
  className?: string;
}

/**
 * Detailed bill calendar with "Tick-to-pay" automation.
 * Matches recurring bills to ledger entries and allows one-tap payment logging.
 */
export function BillCalendarCard({
  store,
  month,
  today,
  onPayBill,
  className,
}: BillCalendarCardProps) {
  const { code } = useCurrency();
  const todayDay = today.startsWith(month) ? Number(today.slice(8, 10)) : 32;

  const bills = useMemo(() => {
    const active = store.recurring.filter((r) => r.kind === "expense" && r.active);
    return active
      .map((r) => {
        const day = Math.min(r.dayOfMonth, daysInMonth(month));
        const paid = store.transactions.some(
          (tx) =>
            tx.date.startsWith(`${month}-`) &&
            tx.categoryId === r.categoryId &&
            tx.amountCents === r.amountCents &&
            tx.note === r.name
        );
        const overdue = !paid && day < todayDay;
        const dueSoon = !paid && !overdue && day <= todayDay + 3;
        return { ...r, day, paid, overdue, dueSoon };
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
          title="Bills & payments"
          hint="Track your monthly bills and their payment status."
          help="Bills are pulled from your recurring list. Tap 'Pay' on any bill to automatically add a matching entry to your ledger."
        />
        <p className="py-8 text-center text-[12px] text-mist">
          No recurring bills set up. Add them in the recurring section to track payments here.
        </p>
      </Panel>
    );
  }

  return (
    <Panel className={className}>
      <CardHead
        title="Bills & payments"
        hint="Track paid and unpaid bills. Tap any bill to record it in your ledger."
        help="A bill is marked paid when a matching entry (category, amount, name) exists in this month's ledger. Tap 'Record payment' to add that entry in one click."
      />

      <div className="mb-4 grid grid-cols-3 gap-2 text-center">
        <div className="border border-line bg-coal px-2 py-2">
          <div className="text-[9px] uppercase tracking-[0.15em] text-mist">Bills total</div>
          <div className="tabular mt-1 font-mono text-[14px] text-bone">
            {moneyWhole(totalBills, code)}
          </div>
        </div>
        <div className="border border-mint/40 bg-coal px-2 py-2">
          <div className="text-[9px] uppercase tracking-[0.15em] text-mist">Paid</div>
          <div className="tabular mt-1 font-mono text-[14px] text-mint">
            {moneyWhole(paidTotal, code)}
          </div>
        </div>
        <div className="border border-ember/40 bg-coal px-2 py-2">
          <div className="text-[9px] uppercase tracking-[0.15em] text-mist">Unpaid</div>
          <div className={cn("tabular mt-1 font-mono text-[14px]", unpaidTotal > 0 ? "text-ember" : "text-mist")}>
            {moneyWhole(unpaidTotal, code)}
          </div>
        </div>
      </div>

      <div className="space-y-1.5">
        {bills.map((b) => {
          const cat = store.categories.find((c) => c.id === b.categoryId);
          const dateStr = `${month}-${String(b.day).padStart(2, "0")}`;

          return (
            <div
              key={b.id}
              className={cn(
                "group flex items-center gap-3 rounded-[3px] border px-3 py-2.5 transition-colors",
                b.paid
                  ? "border-mint/20 bg-mint/5"
                  : b.overdue
                    ? "border-rose/30 bg-rose/5"
                    : b.dueSoon
                      ? "border-gold/30 bg-gold/5"
                      : "border-line bg-coal"
              )}
            >
              <div
                className={cn(
                  "flex w-8 shrink-0 flex-col items-center rounded-[3px] py-1",
                  b.paid ? "bg-mint/20 text-mint" : b.overdue ? "bg-rose/20 text-rose" : "bg-raise text-mist"
                )}
              >
                <span className="font-mono text-[13px] font-semibold leading-none">{b.day}</span>
                <span className="text-[8px] uppercase tracking-[0.1em]">
                  {new Date(dateStr + "T12:00:00").toLocaleDateString("en-US", { weekday: "short" }).slice(0, 2)}
                </span>
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="truncate text-[13.5px] font-medium text-bone">{b.name}</span>
                  {b.dueSoon && !b.paid && (
                    <span className="flex items-center gap-1 text-[9px] font-semibold uppercase text-gold">
                      <Clock size={10} /> Due
                    </span>
                  )}
                </div>
                <div className="truncate text-[10px] text-mist">
                  {cat?.name ?? "—"} · Due {b.day === todayDay ? "today" : `on the ${b.day}${b.day === 1 ? "st" : b.day === 2 ? "nd" : b.day === 3 ? "rd" : "th"}`}
                </div>
              </div>

              <div className="text-right">
                <div className={cn("tabular font-mono text-[13px]", b.paid ? "text-mint" : "text-fog")}>
                  {moneyWhole(b.amountCents, code)}
                </div>
                {!b.paid && (
                  <button
                    onClick={() => onPayBill(b, dateStr)}
                    className="mt-1 text-[10px] font-medium text-lime underline decoration-lime/40 underline-offset-4 hover:decoration-lime"
                  >
                    Record payment
                  </button>
                )}
                {b.paid && (
                  <span className="mt-1 block text-[10px] font-medium text-mint/60">
                    Paid ✓
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </Panel>
  );
}
