"use client";

import { useEffect, useMemo, useState } from "react";
import { StatementSheet } from "./statement-sheet";
import { StatementActions } from "./print-button";
import {
  LOCAL_DATA_KEY,
  deriveMonth,
  makeStarterStore,
  parseBackup,
} from "@/lib/local-planner";
import { currentMonthKey } from "@/lib/months";
import { CURRENCY_COOKIE, normalizeCurrency } from "@/lib/currencies";
import type { PlannerData } from "@/lib/types";

interface LocalStatementProps {
  starter: PlannerData;
  code: string;
  today: string;
  requestedMonth: string;
  autoPrint: boolean;
}

/** Statement shell that replaces server demo figures with this device's data. */
export function LocalStatement({
  starter,
  code,
  today,
  requestedMonth,
  autoPrint,
}: LocalStatementProps) {
  const [month, setMonth] = useState(requestedMonth);
  const [store, setStore] = useState(() => makeStarterStore([starter]));
  const [currentCode, setCurrentCode] = useState(code);
  const [shouldPrint, setShouldPrint] = useState(autoPrint);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // When an offline navigation falls back to the cached /statement shell,
    // the URL still carries the month selected in the planner.
    const params = new URLSearchParams(window.location.search);
    const fromUrl = params.get("month");
    setMonth(fromUrl && /^\d{4}-\d{2}$/.test(fromUrl) ? fromUrl : currentMonthKey());
    setShouldPrint(params.get("print") === "1");
    const cookieCurrency = document.cookie
      .split("; ")
      .find((row) => row.startsWith(`${CURRENCY_COOKIE}=`))
      ?.split("=")[1];
    setCurrentCode(normalizeCurrency(cookieCurrency));
    const raw = localStorage.getItem(LOCAL_DATA_KEY);
    if (raw) {
      const saved = parseBackup(raw);
      if (saved) setStore(saved);
    }
    setReady(true);
  }, []);

  const data = useMemo(() => deriveMonth(store, month), [store, month]);

  return (
    <>
      <StatementActions autoPrint={shouldPrint && ready} />
      <StatementSheet data={data} code={currentCode} today={today} />
    </>
  );
}
