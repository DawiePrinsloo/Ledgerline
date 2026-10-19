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
import { LOCAL_DATA_KEY, parseBackup } from "@/lib/local-planner";
import { createDemoStore } from "@/lib/demo-store";
import { normalizeCurrency, DEFAULT_CURRENCY, CURRENCY_COOKIE } from "@/lib/currencies";
import { currentMonthKey, todayISO } from "@/lib/months";
import type { LocalPlannerStore } from "@/lib/local-planner";

function readCurrencyFromCookie(): string {
  if (typeof document === "undefined") return DEFAULT_CURRENCY;
  const row = document.cookie.split("; ").find((r) => r.startsWith(`${CURRENCY_COOKIE}=`));
  return normalizeCurrency(row?.split("=")[1]);
}

export function PlannerBootstrap() {
  const [ready, setReady] = useState(false);
  // First launch uses the seeded demo; after that the buyer's local copy wins.
  const [store, setStore] = useState<LocalPlannerStore>(createDemoStore);
  const [currency, setCurrency] = useState(DEFAULT_CURRENCY);

  useEffect(() => {
    // Load the buyer's saved device copy if it exists; otherwise keep the demo.
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
