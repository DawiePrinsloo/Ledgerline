"use client";

import { useMemo } from "react";
import { Panel, CardHead } from "./card";
import { daysInMonth } from "@/lib/months";
import { cn } from "@/lib/utils";
import type { TxDTO } from "@/lib/types";

interface NoSpendCardProps {
  transactions: TxDTO[];
  month: string;
  today: string;
  className?: string;
}

/** No-spend challenge — shows which days had zero spending. */
export function NoSpendCard({ transactions, month, today, className }: NoSpendCardProps) {
  const { days, noSpendDays, streak, bestStreak } = useMemo(() => {
    const total = daysInMonth(month);
    const isCurrent = month === today.slice(0, 7);
    const lastDay = isCurrent ? Number(today.slice(8, 10)) : total;

    const spendDays = new Set(
      transactions
        .filter((tx) => tx.kind === "expense" && tx.date.startsWith(`${month}-`))
        .map((tx) => Number(tx.date.slice(8, 10)))
    );

    const days = Array.from({ length: lastDay }, (_, i) => i + 1);
    const noSpendDays = days.filter((d) => !spendDays.has(d));

    // Current streak (from today backwards)
    let streak = 0;
    for (let d = lastDay; d >= 1; d--) {
      if (!spendDays.has(d)) streak++;
      else break;
    }

    // Best streak
    let best = 0, cur = 0;
    for (const d of days) {
      if (!spendDays.has(d)) { cur++; if (cur > best) best = cur; }
      else cur = 0;
    }

    return { days, noSpendDays, streak, bestStreak: best };
  }, [transactions, month, today]);

  return (
    <Panel className={className}>
      <CardHead
        title="No-spend challenge"
        hint="Days this month where you spent nothing — try to grow your streak."
        help="A no-spend day means zero spending transactions that day. Income entries don't count. Every grey square is a win. See if you can beat your best streak."
      />

      <div className="mt-2 grid grid-cols-3 gap-2 text-center sm:grid-cols-3">
        <div className="border border-line bg-coal px-2 py-2">
          <div className="text-[9px] uppercase tracking-[0.12em] text-mist">No-spend days</div>
          <div className="tabular mt-1 font-mono text-[20px] font-semibold text-lime">{noSpendDays.length}</div>
          <div className="text-[9px] text-mist">of {days.length} days</div>
        </div>
        <div className="border border-line bg-coal px-2 py-2">
          <div className="text-[9px] uppercase tracking-[0.12em] text-mist">Current streak</div>
          <div className="tabular mt-1 font-mono text-[20px] font-semibold text-gold">{streak}</div>
          <div className="text-[9px] text-mist">day{streak !== 1 ? "s" : ""} in a row</div>
        </div>
        <div className="border border-line bg-coal px-2 py-2">
          <div className="text-[9px] uppercase tracking-[0.12em] text-mist">Best streak</div>
          <div className="tabular mt-1 font-mono text-[20px] font-semibold text-sky">{bestStreak}</div>
          <div className="text-[9px] text-mist">day{bestStreak !== 1 ? "s" : ""} this month</div>
        </div>
      </div>

      {/* calendar grid */}
      <div className="mt-4 grid grid-cols-7 gap-[3px]">
        {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => (
          <div key={i} className="text-center font-mono text-[9px] text-mist">{d}</div>
        ))}
        {/* offset for first day */}
        {(() => {
          const firstDow = new Date(`${month}-01T12:00:00`).getDay(); // 0=Sun
          const offset = firstDow === 0 ? 6 : firstDow - 1; // Mon-start
          return Array.from({ length: offset }, (_, i) => <div key={`off-${i}`} />);
        })()}
        {Array.from({ length: daysInMonth(month) }, (_, i) => i + 1).map((d) => {
          const past = d <= days.length;
          const noSpend = past && !transactions.some(
            (tx) => tx.kind === "expense" && tx.date === `${month}-${String(d).padStart(2, "0")}`
          );
          const isToday = month === today.slice(0, 7) && d === Number(today.slice(8, 10));
          return (
            <div
              key={d}
              className={cn(
                "flex aspect-square items-center justify-center rounded-[3px] font-mono text-[10px]",
                !past ? "bg-bone/5 text-mist/30" :
                noSpend ? "bg-lime/20 text-lime font-semibold" : "bg-rose/10 text-rose/70",
                isToday && "ring-1 ring-lime"
              )}
              title={!past ? `${d}` : noSpend ? `${d}: No spend ✓` : `${d}: Spent today`}
            >
              {d}
            </div>
          );
        })}
      </div>

      <div className="mt-3 flex flex-wrap gap-3 text-[10.5px] text-mist">
        <span className="flex items-center gap-1.5"><span className="size-2.5 rounded-[2px] bg-lime/20" /> No-spend day</span>
        <span className="flex items-center gap-1.5"><span className="size-2.5 rounded-[2px] bg-rose/10" /> Spending day</span>
      </div>
    </Panel>
  );
}
