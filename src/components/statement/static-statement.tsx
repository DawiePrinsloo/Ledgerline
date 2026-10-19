"use client";

import { useEffect, useMemo, useState } from "react";
import { StatementSheet } from "./statement-sheet";
import { StatementActions } from "./print-button";
import { LOCAL_DATA_KEY, deriveMonth, parseBackup } from "@/lib/local-planner";
import { createDemoStore } from "@/lib/demo-store";
import { currentMonthKey } from "@/lib/months";
import { normalizeCurrency, DEFAULT_CURRENCY, CURRENCY_COOKIE } from "@/lib/currencies";
import type { LocalPlannerStore } from "@/lib/local-planner";

/** Upgrade the very first blank-only static store to the seeded demo. */
function isLegacyBlankStore(store: LocalPlannerStore): boolean {
  return (
    store.transactions.length === 0 &&
    store.goals.length === 2 &&
    store.goals.some((g) => g.name === "Savings goal")
  );
}

export function StaticStatement() {
  // Match the planner: show the seeded demo when there is no saved device data.
  const [store, setStore] = useState<LocalPlannerStore>(createDemoStore);
  const [month, setMonth] = useState(currentMonthKey());
  const [code, setCode] = useState(DEFAULT_CURRENCY);
  const [today, setToday] = useState("");
  const [autoPrint, setAutoPrint] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const m = params.get("month");
    if (m && /^\d{4}-\d{2}$/.test(m)) setMonth(m);
    setAutoPrint(params.get("print") === "1");

    const raw = localStorage.getItem(LOCAL_DATA_KEY);
    if (raw) {
      const saved = parseBackup(raw);
      if (saved) {
        const next = isLegacyBlankStore(saved) ? createDemoStore() : saved;
        setStore(next);
        if (isLegacyBlankStore(saved)) {
          localStorage.setItem(LOCAL_DATA_KEY, JSON.stringify(next));
        }
      }
    }

    const cookieRow = document.cookie.split("; ").find((r) => r.startsWith(`${CURRENCY_COOKIE}=`));
    setCode(normalizeCurrency(cookieRow?.split("=")[1]));

    const d = new Date();
    setToday(
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
    );
    setReady(true);
  }, []);

  const data = useMemo(() => deriveMonth(store, month), [store, month]);

  return (
    <div className="statement-doc min-h-screen bg-[#e9e5dc] py-7 print:bg-white print:py-0">
      <StatementActions autoPrint={autoPrint && ready} />
      {ready && <StatementSheet data={data} code={code} today={today} />}
      <p className="no-print mx-auto mt-5 max-w-[210mm] px-4 text-center font-mono text-[8.5px] leading-relaxed tracking-[0.2em] text-[#6b625c] sm:px-0">
        Set destination to "Save as PDF", portrait, A4 or Letter — margins are preset for one page.
      </p>
    </div>
  );
}
