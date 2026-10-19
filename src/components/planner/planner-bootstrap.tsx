"use client";

/**
 * Bootstraps the planner entirely from localStorage — no server DB call.
 *
 * On first ever load the store is empty; the user presses "Start fresh" or
 * uses the seeded demo data the landing page installs. Currency is read from
 * the cookie the CurrencySelect writes, so no server cookie read is needed.
 */

import { useEffect, useState } from "react";
import { PlannerDashboard } from "./dashboard";
import { LOCAL_DATA_KEY, parseBackup, DEFAULT_PAYDAY_DAY } from "@/lib/local-planner";
import { normalizeCurrency, DEFAULT_CURRENCY, CURRENCY_COOKIE } from "@/lib/currencies";
import { currentMonthKey, todayISO } from "@/lib/months";
import type { LocalPlannerStore } from "@/lib/local-planner";

/** Nine default expense categories + one income category. */
const DEFAULT_CATEGORIES = [
  { id: 1,  name: "Housing",        icon: "home",      color: "#E8E3D5", budgetCents: 185000, kind: "expense" as const, sort: 1,  spentCents: 0, txCount: 0 },
  { id: 2,  name: "Utilities",      icon: "zap",       color: "#FFD84D", budgetCents: 18000,  kind: "expense" as const, sort: 2,  spentCents: 0, txCount: 0 },
  { id: 3,  name: "Groceries",      icon: "cart",      color: "#C6F24E", budgetCents: 62000,  kind: "expense" as const, sort: 3,  spentCents: 0, txCount: 0 },
  { id: 4,  name: "Dining & coffee",icon: "coffee",    color: "#FF9E6B", budgetCents: 34000,  kind: "expense" as const, sort: 4,  spentCents: 0, txCount: 0 },
  { id: 5,  name: "Transport",      icon: "car",       color: "#7EC8E3", budgetCents: 26000,  kind: "expense" as const, sort: 5,  spentCents: 0, txCount: 0 },
  { id: 6,  name: "Shopping",       icon: "bag",       color: "#FFB3C7", budgetCents: 20000,  kind: "expense" as const, sort: 6,  spentCents: 0, txCount: 0 },
  { id: 7,  name: "Health",         icon: "heart",     color: "#FF6B81", budgetCents: 12000,  kind: "expense" as const, sort: 7,  spentCents: 0, txCount: 0 },
  { id: 8,  name: "Subscriptions",  icon: "repeat",    color: "#B79CFF", budgetCents: 9600,   kind: "expense" as const, sort: 8,  spentCents: 0, txCount: 0 },
  { id: 9,  name: "Leisure",        icon: "sparkles",  color: "#FFD84D", budgetCents: 18000,  kind: "expense" as const, sort: 9,  spentCents: 0, txCount: 0 },
  { id: 10, name: "Income",         icon: "briefcase", color: "#8FE3B0", budgetCents: 0,      kind: "income"  as const, sort: 10, spentCents: 0, txCount: 0 },
];

const DEFAULT_GOALS = [
  { id: 1, name: "Emergency fund",   icon: "shield",   color: "#C6F24E", targetCents: 600000,  savedCents: 0,  targetLabel: "3-MONTH BUFFER" },
  { id: 2, name: "Savings goal",     icon: "plane",    color: "#7EC8E3", targetCents: 200000,  savedCents: 0,  targetLabel: "YOUR GOAL" },
];

function blankStore(): LocalPlannerStore {
  return {
    version: 1,
    categories: DEFAULT_CATEGORIES,
    transactions: [],
    goals: DEFAULT_GOALS,
    paydayDay: DEFAULT_PAYDAY_DAY,
    updatedAt: new Date().toISOString(),
  };
}

function readCurrencyFromCookie(): string {
  if (typeof document === "undefined") return DEFAULT_CURRENCY;
  const row = document.cookie.split("; ").find((r) => r.startsWith(`${CURRENCY_COOKIE}=`));
  return normalizeCurrency(row?.split("=")[1]);
}

export function PlannerBootstrap() {
  const [ready, setReady] = useState(false);
  const [store, setStore] = useState<LocalPlannerStore>(blankStore);
  const [currency, setCurrency] = useState(DEFAULT_CURRENCY);

  useEffect(() => {
    // Load saved store from localStorage, or start fresh.
    const raw = localStorage.getItem(LOCAL_DATA_KEY);
    if (raw) {
      const saved = parseBackup(raw);
      if (saved) setStore(saved);
    }
    setCurrency(readCurrencyFromCookie());
    setReady(true);
  }, []);

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-ink">
        <span className="font-mono text-[11px] tracking-[0.3em] text-mist">
          LOADING…
        </span>
      </div>
    );
  }

  return (
    <PlannerDashboard
      starter={store}
      today={todayISO()}
      currentMonth={currentMonthKey()}
      initialCurrency={currency}
    />
  );
}
