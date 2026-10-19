"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Menu,
  Plus,
  Printer,
  X,
} from "lucide-react";
import { ThemeSwitcher } from "@/components/ui/theme-switcher";
import { CurrencySelect } from "@/components/ui/currency-select";
import { monthLabel, monthShort } from "@/lib/months";
import { moneyWhole } from "@/lib/format";
import { useCurrency } from "@/lib/currency-context";
import { cn } from "@/lib/utils";

interface PlannerTopbarProps {
  month: string;
  canNext: boolean;
  switching: boolean;
  onPrev: () => void;
  onNext: () => void;
  onAddIncome: () => void;
  onAddSpending: () => void;
}

export function PlannerTopbar({
  month,
  canNext,
  switching,
  onPrev,
  onNext,
  onAddIncome,
  onAddSpending,
}: PlannerTopbarProps) {
  return (
    <header className="sticky top-0 z-50 bg-ink/95 backdrop-blur-md">
      <div className="mx-auto max-w-[1440px] px-3 sm:px-4 md:px-8">
        {/* ——— row 1: Ledgerline (left) · add buttons (right) ——— */}
        <div className="flex h-16 items-center justify-between gap-2">
          {/* left: identity */}
          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            <Link
              href="/"
              title="Back to the story behind this app"
              className="group flex shrink-0 items-center gap-1.5 text-[11px] text-fog transition-colors hover:text-bone"
            >
              <ArrowLeft
                size={14}
                className="transition-transform duration-300 group-hover:-translate-x-0.5"
              />
            </Link>
            <span className="whitespace-nowrap text-[12px] tracking-[0.12em] text-bone sm:text-[14px] sm:tracking-[0.3em]">
              LEDGERLINE
            </span>
          </div>

          <div className="flex shrink-0 items-center gap-2.5">
            <button
              onClick={onAddIncome}
              className="inline-flex items-center gap-1.5 rounded-[20px] bg-[#16a34a] px-4 py-2.5 text-[13px] font-semibold text-white transition-transform duration-200 hover:-translate-y-0.5 sm:px-5 sm:text-[14px]"
            >
              <Plus size={14} strokeWidth={2.75} />
              <span className="hidden sm:inline">Add income</span>
              <span className="sm:hidden">Income</span>
            </button>
            <button
              onClick={onAddSpending}
              className="inline-flex items-center gap-1.5 rounded-[20px] bg-[#111827] px-4 py-2.5 text-[13px] font-semibold text-white transition-transform duration-200 hover:-translate-y-0.5 sm:px-5 sm:text-[14px]"
            >
              <Plus size={14} strokeWidth={2.75} />
              <span className="hidden sm:inline">Add spending</span>
              <span className="sm:hidden">Spend</span>
            </button>
          </div>
        </div>

        {/* ——— row 2: month nav + settings, centered ——— */}
        <div className="flex flex-col items-center justify-center gap-y-3 border-t border-line/70 py-4">
          <div className="flex items-center border border-linebright">
            <MonthNav
              month={month}
              canNext={canNext}
              switching={switching}
              onPrev={onPrev}
              onNext={onNext}
            />
          </div>
          <div className="flex items-center gap-2">
            <PdfLink month={month} />
            <CurrencySelect />
            <ThemeSwitcher />
          </div>
        </div>
      </div>

      <div className="h-px w-full overflow-hidden bg-linebright">
        {switching && (
          <motion.div
            initial={{ x: "-100%" }}
            animate={{ x: "400%" }}
            transition={{ repeat: Infinity, duration: 1.1, ease: "linear" }}
            className="h-full w-1/4 bg-lime"
          />
        )}
      </div>
    </header>
  );
}

function MonthNav({
  month,
  canNext,
  switching,
  onPrev,
  onNext,
  compact = false,
}: {
  month: string;
  canNext: boolean;
  switching: boolean;
  onPrev: () => void;
  onNext: () => void;
  compact?: boolean;
}) {
  return (
    <>
      <button
        onClick={onPrev}
        disabled={switching}
        aria-label="Go to the previous month"
        title="Go to the previous month"
        className="p-2 text-fog transition-colors hover:bg-raise hover:text-bone disabled:opacity-30"
      >
        <ChevronLeft size={15} />
      </button>
      <div
        className={cn(
          "border-x border-line px-2 text-center sm:px-3",
          compact ? "min-w-[92px] sm:min-w-[116px]" : "min-w-[132px] md:min-w-[152px]"
        )}
      >
        <div className="text-[8px] uppercase tracking-[0.16em] text-mist sm:text-[8.5px] sm:tracking-[0.18em]">
          VIEWING MONTH
        </div>
        <div className="font-display text-[13px] leading-tight text-bone sm:text-[14px]">
          <span className="sm:hidden">{monthShort(month)}</span>
          <span className={cn("hidden sm:inline", switching && "opacity-40")}>
            {monthLabel(month)}
          </span>
        </div>
      </div>
      <button
        onClick={onNext}
        disabled={!canNext || switching}
        aria-label="Go to the next month"
        title={canNext ? "Go to the next month" : "This is the current month"}
        className="p-2 text-fog transition-colors hover:bg-raise hover:text-bone disabled:opacity-30"
      >
        <ChevronRight size={15} />
      </button>
    </>
  );
}

function PdfLink({ month, compact = false }: { month: string; compact?: boolean }) {
  return (
    <Link
      href={`/statement?month=${month}&print=1`}
      target="_blank"
      rel="noopener"
      title="Create a clean one-page summary of this month that you can print or save as a PDF"
      className="flex items-center gap-2 border border-linebright px-2.5 py-2 text-[11px] text-fog transition-colors hover:border-lime hover:text-lime"
    >
      <Printer size={13} />
      <span className={cn(compact ? "hidden" : "inline")}>Save as PDF</span>
    </Link>
  );
}
