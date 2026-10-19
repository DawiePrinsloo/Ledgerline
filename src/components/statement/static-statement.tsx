"use client";

import { useEffect, useMemo, useState } from "react";
import { StatementSheet } from "./statement-sheet";
import { StatementActions } from "./print-button";
import { LOCAL_DATA_KEY, deriveMonth, parseBackup } from "@/lib/local-planner";
import { currentMonthKey } from "@/lib/months";
import { normalizeCurrency, DEFAULT_CURRENCY, CURRENCY_COOKIE } from "@/lib/currencies";
import type { LocalPlannerStore } from "@/lib/local-planner";

const BLANK: LocalPlannerStore = {
  version: 1,
  categories: [],
  transactions: [],
  goals: [],
  paydayDay: 1,
  updatedAt: new Date().toISOString(),
};

export function StaticStatement() {
  const [store, setStore] = useState<LocalPlannerStore>(BLANK);
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
      if (saved) setStore(saved);
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
