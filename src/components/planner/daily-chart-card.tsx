"use client";

import { useMemo, useState } from "react";
import { Panel, CardHead } from "./card";
import { moneyWhole } from "@/lib/format";
import { daysInMonth, daysUntilPayday, dayLabelShort } from "@/lib/months";
import { useCurrency } from "@/lib/currency-context";
import type { CategoryDTO, TxDTO } from "@/lib/types";
import { cn } from "@/lib/utils";

interface DailyChartCardProps {
  transactions: TxDTO[];
  categories: CategoryDTO[];
  month: string;
  today: string;
  expenseCents: number;
  budgetCents: number;
  paydayDay: number;
  className?: string;
}

/** Chart geometry: the tallest day fills the area; small days stay tiny. */
const AREA_PX = 168;
const MIN_BAR_PX = 4;

export function DailyChartCard({
  transactions,
  categories,
  month,
  today,
  expenseCents,
  budgetCents,
  paydayDay,
  className,
}: DailyChartCardProps) {
  const { code } = useCurrency();
  const categoryName = (id: number) =>
    categories.find((c) => c.id === id)?.name ?? "Uncategorised";
  const [activeDay, setActiveDay] = useState<number | null>(null);

  const model = useMemo(() => {
    // ---- month-agnostic frame --------------------------------------------
    const totalDays = daysInMonth(month);
    const isCurrent = month === today.slice(0, 7);
    const dayOfMonth = isCurrent ? Number(today.slice(8, 10)) : totalDays;
    const days = Array.from({ length: totalDays }, (_, i) => i + 1);

    // ---- per-day totals, everything included, nothing hidden -------------
    const spend = new Array<number>(totalDays + 1).fill(0);
    const income = new Array<number>(totalDays + 1).fill(0);
    const entriesByDay = new Map<number, TxDTO[]>();
    for (const tx of transactions) {
      const d = Number(tx.date.slice(8, 10));
      if (d < 1 || d > totalDays) continue;
      if (tx.kind === "expense") {
        spend[d] += tx.amountCents;
        entriesByDay.set(d, [...(entriesByDay.get(d) ?? []), tx]);
      } else {
        income[d] += tx.amountCents;
      }
    }

    const daysWithSpend = days.filter((d) => spend[d] > 0);

    // ---- one honest, linear scale: the biggest day's total is the ceiling -
    const maxDay =
      daysWithSpend.reduce((max, d) => Math.max(max, spend[d]), 0) || 1;
    const biggestDay = daysWithSpend.reduce<{ day: number; cents: number } | null>(
      (best, d) => (best === null || spend[d] > best.cents ? { day: d, cents: spend[d] } : best),
      null
    );

    // ---- simple average: everything counted, nothing excluded ------------
    const avgPerDay = dayOfMonth > 0 ? expenseCents / dayOfMonth : 0;

    // ---- forward-looking allowance ---------------------------------------
    const envelopeLeft = budgetCents - expenseCents;
    const untilPayday = isCurrent ? daysUntilPayday(today, paydayDay) : 0;
    const allowanceDays =
      untilPayday > 0 ? untilPayday : Math.max(totalDays - dayOfMonth, 0) || totalDays;
    const allowedPerDay = budgetCents > 0 ? envelopeLeft / allowanceDays : null;

    return {
      totalDays, isCurrent, dayOfMonth, days, spend, income, entriesByDay,
      daysWithSpend, maxDay, biggestDay, avgPerDay,
      envelopeLeft, allowedPerDay, allowanceDays, untilPayday,
    };
  }, [transactions, month, today, expenseCents, budgetCents, paydayDay]);

  const allowed = model.allowedPerDay;
  const overPct =
    allowed !== null && allowed > 0
      ? Math.round(((model.avgPerDay - allowed) / allowed) * 100)
      : null;
  const overspent = model.envelopeLeft < 0;

  /**
   * True proportion: height = (day amount ÷ biggest day) × area.
   * A $1,850 rent day fills the chart; a $109 day is ~6%; an $11 day is a
   * 4px sliver. Nothing is stretched to look equal.
   */
  const barHeight = (value: number): number => {
    if (value <= 0) return 0;
    return Math.max(MIN_BAR_PX, (value / model.maxDay) * AREA_PX);
  };

  return (
    <Panel className={cn("flex flex-col", className)}>
      <CardHead
        title="What you spent each day"
        hint="One bar for each day of the month — the taller the bar, the more you spent that day. Tap or hover any day for the exact amount."
        help="Every payment is shown, including big ones like rent, so the biggest day really is the biggest bar and everything else is to scale beneath it. Days you were paid are marked with a small green diamond, and days with no spending are small grey dots."
      />

      {model.daysWithSpend.length === 0 ? (
        <p className="py-16 text-center text-[12px] text-mist">
          Nothing spent yet in this month.
        </p>
      ) : (
        <>
          {/* plot sits on the card background, centres on wide screens, scrolls
              when the month is wider than the card */}
          <div className="ll-chart -mx-1 overflow-x-auto overscroll-x-contain px-1 pb-1">
            <div className="ll-chart-plot min-w-[480px]">
              <div className="flex items-end gap-4" style={{ height: AREA_PX + 40 }}>
                {model.days.map((d) => {
                  const value = model.spend[d];
                  const future = model.isCurrent && d > model.dayOfMonth;
                  const isToday = model.isCurrent && d === model.dayOfMonth;
                  const isBiggest = model.biggestDay !== null && d === model.biggestDay.day;
                  const height = barHeight(value);
                  const weekend = [0, 6].includes(
                    new Date(`${month}-${`${d}`.padStart(2, "0")}T12:00:00`).getDay()
                  );

                  return (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setActiveDay((cur) => (cur === d ? null : d))}
                      onMouseEnter={() => setActiveDay(d)}
                      onMouseLeave={() => setActiveDay(null)}
                      aria-label={`${dayLabelShort(month, d)}: ${
                        value > 0 ? moneyWhole(value, code) : "nothing spent"
                      }`}
                      className={cn(
                        "bar-container group",
                        isBiggest && "tallest",
                        weekend && "bg-bone/[0.03]",
                        future && "opacity-40"
                      )}
                      style={{ height: AREA_PX + 40 }}
                    >
                      {/* amount ON TOP of the bar, black, on every screen size.
                          Nothing is ever written inside the bar. */}
                      {value > 0 && (
                        <span className="bar-amount-label">{moneyWhole(value, code)}</span>
                      )}

                      {/* the bar — fixed width, proportional height, dark */}
                      {value > 0 ? (
                        <span
                          className={cn(
                            "rounded-t-[3px] transition-opacity",
                            /* 24px mobile · 32px desktop · 40px on 1440px+ */
                            "w-6 sm:w-8 min-[1440px]:w-10",
                            isToday || isBiggest || activeDay === d ? "bg-bone" : "bg-bone/70"
                          )}
                          style={{ height }}
                        />
                      ) : (
                        <span
                          className="mx-auto mb-[2px] h-[4px] w-[4px] rounded-full bg-bone/25"
                          aria-hidden="true"
                        />
                      )}

                      {/* payday marker — green diamond for money received */}
                      <span className="mt-1 flex h-[6px] items-center justify-center">
                        {model.income[d] > 0 && (
                          <span className="size-[5px] rotate-45 bg-mint" />
                        )}
                      </span>

                      {/* date */}
                      <span
                        className={cn(
                          "tabular mt-0.5 text-center text-[8.5px] leading-none",
                          isToday ? "font-semibold text-bone" : "text-mist"
                        )}
                      >
                        {d}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* legend */}
          <div className="ll-chart-legend mt-2 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[10.5px] text-mist">
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-2 w-2 rounded-[1px] bg-bone/70" /> money spent
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block size-1.5 rotate-45 bg-mint" /> money received
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block size-[4px] rounded-full bg-bone/25" /> no spending
            </span>
          </div>

          {/* one honest average — everything counted */}
          <div className="mt-3 border border-line bg-coal px-3 py-2">
            <div className="tabular font-mono text-[12.5px] text-bone">
              Everyday spending {moneyWhole(model.avgPerDay, code)} a day
            </div>
            <div className="tabular mt-0.5 text-[11px] text-mist">
              {moneyWhole(expenseCents, code)} over {model.dayOfMonth} day
              {model.dayOfMonth === 1 ? "" : "s"} of the month
            </div>
          </div>

          {/* pace — measured against what is still affordable */}
          <div
            className={cn(
              "mt-px border px-3 py-2.5",
              allowed === null
                ? "border-line bg-coal"
                : overspent || (overPct !== null && overPct > 0)
                  ? "border-ember/50"
                  : "border-lime/50"
            )}
            style={
              allowed !== null
                ? {
                    backgroundColor:
                      overspent || (overPct !== null && overPct > 0)
                        ? "color-mix(in srgb, var(--ember) 12%, transparent)"
                        : "color-mix(in srgb, var(--lime) 12%, transparent)",
                  }
                : undefined
            }
          >
            <div className="text-[9px] uppercase tracking-[0.18em] text-mist">Your pace</div>
            {allowed === null ? (
              <p className="mt-1 text-[11.5px] text-fog">
                Set budgets by category to see whether your spending is affordable.
              </p>
            ) : overspent ? (
              <p className="tabular mt-1 text-[12px] font-medium text-ember">
                Budget already used up by {moneyWhole(-model.envelopeLeft, code)} — nothing
                left for the next {model.allowanceDays} day
                {model.allowanceDays === 1 ? "" : "s"}.
              </p>
            ) : (
              <p className="tabular mt-1 text-[12px] font-medium text-bone">
                Allowed {moneyWhole(allowed, code)}/day · Spending{" "}
                {moneyWhole(model.avgPerDay, code)}/day ·{" "}
                <span className={overPct !== null && overPct > 0 ? "text-ember" : "text-lime"}>
                  {overPct === null
                    ? "nothing left to spread"
                    : overPct > 0
                      ? `${overPct}% over`
                      : `${Math.abs(overPct)}% under`}
                </span>
              </p>
            )}
            {allowed !== null && !overspent && (
              <p className="mt-1 text-[10px] leading-relaxed text-mist">
                {moneyWhole(model.envelopeLeft, code)} left ÷ {model.allowanceDays} day
                {model.allowanceDays === 1 ? "" : "s"}{" "}
                {model.untilPayday > 0 ? "until payday" : "left in this month"}
              </p>
            )}
          </div>
        </>
      )}
    </Panel>
  );
}
