"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { PlannerTopbar } from "./topbar";
import { KpiRow, type KpiItem } from "./kpi-row";
import { DonutCard } from "./donut-card";
import { DailyChartCard } from "./daily-chart-card";
import { BudgetsCard } from "./budgets-card";
import { LedgerCard } from "./ledger-card";
import { GoalsRow } from "./goals-row";
import { ManageGoalModal } from "./manage-goal-modal";
import { ManageCategoryModal, type NewCategoryPayload } from "./manage-category-modal";
import { TrendCard } from "./trend-card";
import { RecurringCard } from "./recurring-card";
import { BudgetRuleCard } from "./budget-rule-card";
import { NetWorthCard } from "./net-worth-card";
import { AnnualSummaryCard } from "./annual-summary-card";
import { BillCalendarCard } from "./bill-calendar-card";
import { QuarterlyCard } from "./quarterly-card";
import { DebtPayoffCard, type DebtDTO } from "./debt-payoff-card";
import { NoSpendCard } from "./no-spend-card";
import { IrregularExpenseCard, type IrregularExpenseDTO } from "./irregular-expense-card";
import { AddIncomeModal } from "./add-income-modal";
import { AddSpendingModal } from "./add-spending-modal";
import { ToastStack, type ToastItem } from "./toasts";
import { HelpPanel } from "./help-panel";
import { SectionTitle } from "./section-title";
import { OfflineControls } from "./offline-controls";
import { AddSpendingFab } from "./add-spending-fab";
import { FooterSettings } from "./footer-settings";
import { Grain } from "@/components/ui/grain";
import { currentMonthKey, monthLabel, shiftMonth } from "@/lib/months";
import { moneyExact, moneyWhole, pct } from "@/lib/format";
import { buildXlsx, type Row, type Sheet } from "@/lib/xlsx";
import { CURRENCY_COOKIE } from "@/lib/currencies";
import { CurrencyContext } from "@/lib/currency-context";
import {
  applyRecurring,
  LOCAL_DATA_KEY,
  backupFilename,
  deriveMonth,
  LOCAL_DATA_VERSION,
  freshStore,
  mergeMissingCategories,
  nextTransactionId,
  normalizePaydayDay,
  parseBackup,
  type LocalPlannerStore,
} from "@/lib/local-planner";
import type { BudgetBucket, GoalDTO, NetWorthItemDTO, NewTxPayload, RecurringDTO, TxDTO } from "@/lib/types";

interface PlannerDashboardProps {
  starter: LocalPlannerStore;
  today: string;
  currentMonth: string;
  initialCurrency: string;
}

function stamp(store: LocalPlannerStore): LocalPlannerStore {
  return { ...store, updatedAt: new Date().toISOString() };
}

function downloadFile(filename: string, content: string, type: string, existing?: Blob) {
  const blob = existing ?? new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 500);
}

function csvCell(value: string): string {
  return `"${value.replace(/"/g, '""')}"`;
}

export function PlannerDashboard({
  starter,
  today,
  currentMonth,
  initialCurrency,
}: PlannerDashboardProps) {
  const [month, setMonth] = useState(currentMonth);
  const [store, setStore] = useState<LocalPlannerStore>(starter);
  const [storageReady, setStorageReady] = useState(false);
  const [switching, setSwitching] = useState(false);
  const [spendingOpen, setSpendingOpen] = useState(false);
  const [incomeOpen, setIncomeOpen] = useState(false);
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [currencyCode, setCurrencyCode] = useState(initialCurrency);
  const [filterCatId, setFilterCatId] = useState<number | null>(null);
  const [topBarExpanded, setTopBarExpanded] = useState(false);
  const [goalModalOpen, setGoalModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<GoalDTO | null>(null);
  const [catModalOpen, setCatModalOpen] = useState(false);
  const ledgerRef = useRef<HTMLDivElement>(null);

  /** Badge actions filter the ledger and bring it into view. */
  const revealInLedger = useCallback((categoryId: number) => {
    setFilterCatId(categoryId);
    window.requestAnimationFrame(() => {
      ledgerRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }, []);

  const data = useMemo(() => deriveMonth(store, month), [store, month]);

  const pushToast = useCallback(
    (msg: string, action?: { label: string; run: () => void }) => {
      const id = Date.now() + Math.random();
      setToasts((items) => [
        ...items,
        { id, msg, actionLabel: action?.label, onAction: action?.run },
      ]);
      window.setTimeout(
        () => setToasts((items) => items.filter((item) => item.id !== id)),
        4500
      );
    },
    []
  );

  // Load this buyer's private device copy before enabling autosave.
  useEffect(() => {
    const raw = localStorage.getItem(LOCAL_DATA_KEY);
    if (raw) {
      const saved = parseBackup(raw);
      // A planner saved before a category existed gains it here, keeping
      // every existing entry and budget untouched.
      if (saved) setStore(mergeMissingCategories(saved, starter));
    }
    setStorageReady(true);
  }, [starter]);

  // Every local mutation is durable immediately; no internet request follows.
  useEffect(() => {
    if (!storageReady) return;
    localStorage.setItem(LOCAL_DATA_KEY, JSON.stringify(store));
  }, [store, storageReady]);

  const setCode = useCallback((next: string) => {
    setCurrencyCode(next);
    document.cookie = `${CURRENCY_COOKIE}=${next};path=/;max-age=31536000;samesite=lax`;
  }, []);

  const currencyCtx = useMemo(
    () => ({ code: currencyCode, setCode }),
    [currencyCode, setCode]
  );

  const toggleFilter = useCallback((id: number) => {
    setFilterCatId((current) => (current === id ? null : id));
  }, []);

  const filterCat = useMemo(
    () => data.categories.find((category) => category.id === filterCatId) ?? null,
    [data.categories, filterCatId]
  );

  const envelopeTotal = useMemo(
    () =>
      data.categories
        .filter((category) => category.kind === "expense")
        .reduce((sum, category) => sum + category.budgetCents, 0),
    [data.categories]
  );

  const visibleTx = useMemo(
    () =>
      filterCatId === null
        ? data.transactions
        : data.transactions.filter((tx) => tx.categoryId === filterCatId),
    [data.transactions, filterCatId]
  );

  const switchMonth = useCallback(
    (direction: number) => {
      const next = shiftMonth(month, direction);
      const horizon = shiftMonth(currentMonth, 12);
      if (switching || next === month || next > horizon) return;
      setSwitching(true);
      setFilterCatId(null);
      setMonth(next);
      window.setTimeout(() => setSwitching(false), 260);
    },
    [month, currentMonth, switching]
  );

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setSpendingOpen(false);
        setIncomeOpen(false);
        return;
      }
      const element = event.target as HTMLElement | null;
      if (
        element &&
        (element.tagName === "INPUT" ||
          element.tagName === "TEXTAREA" ||
          element.tagName === "SELECT")
      ) {
        return;
      }
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      if (event.key.toLowerCase() === "a") {
        event.preventDefault();
        setSpendingOpen(true);
      } else if (event.key === "[") {
        switchMonth(-1);
      } else if (event.key === "]") {
        switchMonth(1);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [switchMonth]);

  const insertTransaction = useCallback((tx: TxDTO) => {
    setStore((current) =>
      stamp({
        ...current,
        transactions: [tx, ...current.transactions.filter((item) => item.id !== tx.id)],
      })
    );
  }, []);

  const removeTransaction = useCallback((id: number) => {
    setStore((current) =>
      stamp({
        ...current,
        transactions: current.transactions.filter((tx) => tx.id !== id),
      })
    );
  }, []);

  const createTransaction = useCallback(
    async (payload: NewTxPayload): Promise<TxDTO | null> => {
      const tx: TxDTO = { ...payload, id: nextTransactionId(store) };
      insertTransaction(tx);
      pushToast(`Saved “${tx.note}” on this device.`);
      return tx;
    },
    [store, insertTransaction, pushToast]
  );

  const deleteTransaction = useCallback(
    (tx: TxDTO) => {
      removeTransaction(tx.id);
      pushToast("Entry removed.", {
        label: "UNDO",
        run: () => insertTransaction(tx),
      });
    },
    [removeTransaction, insertTransaction, pushToast]
  );

  const saveBudget = useCallback(
    (categoryId: number, budgetCents: number) => {
      setStore((current) =>
        stamp({
          ...current,
          categories: current.categories.map((category) =>
            category.id === categoryId ? { ...category, budgetCents } : category
          ),
        })
      );
      pushToast("Budget updated and saved on this device.");
    },
    [pushToast]
  );

  const renameCategory = useCallback(
    (categoryId: number, name: string) => {
      setStore((current) =>
        stamp({
          ...current,
          categories: current.categories.map((category) =>
            category.id === categoryId ? { ...category, name } : category
          ),
        })
      );
      pushToast("Category renamed.");
    },
    [pushToast]
  );

  const editAmount = useCallback(
    (tx: TxDTO, amountCents: number) => {
      if (amountCents === tx.amountCents) return;
      setStore((current) =>
        stamp({
          ...current,
          transactions: current.transactions.map((item) =>
            item.id === tx.id ? { ...item, amountCents } : item
          ),
        })
      );
      pushToast(
        `Corrected ${moneyExact(tx.amountCents, currencyCode)} → ${moneyExact(amountCents, currencyCode)}`,
        {
          label: "UNDO",
          run: () => {
            setStore((current) =>
              stamp({
                ...current,
                transactions: current.transactions.map((item) =>
                  item.id === tx.id ? { ...item, amountCents: tx.amountCents } : item
                ),
              })
            );
          },
        }
      );
    },
    [pushToast, currencyCode]
  );

  const fundGoal = useCallback(
    (goalId: number, addCents: number) => {
      const goal = store.goals.find((item) => item.id === goalId);
      if (!goal) return;
      const next = Math.min(goal.targetCents, Math.max(0, goal.savedCents + addCents));
      const applied = next - goal.savedCents;
      if (applied === 0) {
        pushToast(
          addCents > 0
            ? "This goal is already fully saved."
            : "There is nothing saved here to take out."
        );
        return;
      }
      setStore((current) =>
        stamp({
          ...current,
          goals: current.goals.map((item) =>
            item.id === goalId ? { ...item, savedCents: next } : item
          ),
        })
      );
      const message =
        applied > 0
          ? `Added ${moneyWhole(applied, currencyCode)} to ${goal.name}.`
          : `Took ${moneyWhole(-applied, currencyCode)} out of ${goal.name}.`;
      pushToast(message, {
        label: "UNDO",
        run: () => {
          setStore((current) =>
            stamp({
              ...current,
              goals: current.goals.map((item) =>
                item.id === goalId
                  ? { ...item, savedCents: Math.max(0, item.savedCents - applied) }
                  : item
              ),
            })
          );
        },
      });
    },
    [store.goals, pushToast, currencyCode]
  );

  const createGoal = useCallback((payload: Omit<GoalDTO,"id"|"savedCents">) => {
    const id = Math.max(Date.now(), ...store.goals.map((g:GoalDTO)=>g.id+1),1);
    const newGoal: GoalDTO = {...payload,id,savedCents:0};
    setStore(c=>stamp({...c,goals:[...c.goals,newGoal]}));
    pushToast(`Savings goal "${payload.name}" created.`);
  },[store.goals,pushToast]);

  const updateGoal = useCallback((goalId: number, payload: Omit<GoalDTO,"id"|"savedCents">) => {
    setStore(c=>stamp({...c,goals:c.goals.map(g=>g.id===goalId?{...g,...payload}:g)}));
    pushToast("Goal updated.");
  },[pushToast]);

  const deleteGoal = useCallback((goalId:number) => {
    setStore(c=>stamp({...c,goals:c.goals.filter(g=>g.id!==goalId)}));
    pushToast("Savings goal deleted.");
  },[pushToast]);

  const createCategory = useCallback((payload: NewCategoryPayload) => {
    const id = Math.max(Date.now(), ...store.categories.map(c=>c.id+1),1);
    const sort = Math.max(...store.categories.map(c=>c.sort),0)+1;
    setStore(c=>stamp({...c,categories:[...c.categories,{...payload,id,sort,spentCents:0,txCount:0}]}));
    pushToast(`Category "${payload.name}" added.`);
  },[store.categories,pushToast]);

  const deleteCategory = useCallback((catId:number) => {
    if (!window.confirm("Delete this category? Entries logged to it will become uncategorised.")) return;
    setStore(c=>stamp({...c,categories:c.categories.filter(cat=>cat.id!==catId)}));
    pushToast("Category deleted.");
  },[pushToast]);

  // ── Recurring transactions ──────────────────────────────────────────
  const addRecurring = useCallback((r: Omit<RecurringDTO,"id">) => {
    const id = Math.max(Date.now(), ...store.recurring.map(x=>x.id+1),1);
    setStore(c=>stamp({...c,recurring:[...c.recurring,{...r,id}]}));
    pushToast(`"${r.name}" will auto-fill each month.`);
  },[store.recurring,pushToast]);

  const toggleRecurring = useCallback((id: number) => {
    setStore(c=>stamp({...c,recurring:c.recurring.map(r=>r.id===id?{...r,active:!r.active}:r)}));
  },[]);

  const deleteRecurring = useCallback((id: number) => {
    setStore(c=>stamp({...c,recurring:c.recurring.filter(r=>r.id!==id)}));
    pushToast("Recurring entry deleted.");
  },[pushToast]);

  // ── Net worth ──────────────────────────────────────────────────────
  const addNetWorthItem = useCallback((item: Omit<NetWorthItemDTO,"id">) => {
    const id = Math.max(Date.now(), ...store.netWorthItems.map(x=>x.id+1),1);
    setStore(c=>stamp({...c,netWorthItems:[...c.netWorthItems,{...item,id}]}));
    pushToast(`${item.type === "asset" ? "Asset" : "Liability"} "${item.name}" added.`);
  },[store.netWorthItems,pushToast]);

  const updateNetWorthItem = useCallback((id: number, amountCents: number) => {
    setStore(c=>stamp({...c,netWorthItems:c.netWorthItems.map(i=>i.id===id?{...i,amountCents}:i)}));
    pushToast("Amount updated.");
  },[pushToast]);

  const deleteNetWorthItem = useCallback((id: number) => {
    setStore(c=>stamp({...c,netWorthItems:c.netWorthItems.filter(i=>i.id!==id)}));
    pushToast("Item removed.");
  },[pushToast]);

  // ── 50/30/20 bucket map ──────────────────────────────────────────
  const changeBucket = useCallback((categoryId: number, bucket: BudgetBucket) => {
    setStore(c=>stamp({...c,bucketMap:{...c.bucketMap,[categoryId]:bucket}}));
  },[]);

  // ── Apply recurring on month switch ──────────────────────────────
  useEffect(() => {
    if (!storageReady) return;
    const updated = applyRecurring(store, month);
    if (updated !== store) {
      setStore(updated);
      pushToast("Recurring entries auto-filled for this month.");
    }
  // Only run when month changes, not on every store mutation
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [month, storageReady]);

  const addDebt = useCallback((d: Omit<DebtDTO,"id">) => {
    const id = Math.max(Date.now(), ...store.debts.map(x=>x.id+1),1);
    setStore(c=>stamp({...c,debts:[...c.debts,{...d,id}]}));
    pushToast(`Debt "${d.name}" added.`);
  },[store.debts,pushToast]);

  const deleteDebt = useCallback((id: number) => {
    setStore(c=>stamp({...c,debts:c.debts.filter(d=>d.id!==id)}));
  },[]);

  const addIrregular = useCallback((item: Omit<IrregularExpenseDTO,"id">) => {
    const id = Math.max(Date.now(), ...store.irregularExpenses.map(x=>x.id+1),1);
    setStore(c=>stamp({...c,irregularExpenses:[...c.irregularExpenses,{...item,id}]}));
    pushToast(`Irregular expense "${item.name}" added.`);
  },[store.irregularExpenses,pushToast]);

  const deleteIrregular = useCallback((id: number) => {
    setStore(c=>stamp({...c,irregularExpenses:c.irregularExpenses.filter(i=>i.id!==id)}));
  },[]);

  const recordNetWorthSnapshot = useCallback((assets: number, liabilities: number) => {
    const snap = { date: new Date().toISOString(), assetsCents: assets, liabilitiesCents: liabilities };
    setStore(c => stamp({...c, netWorthHistory: [...c.netWorthHistory, snap]}));
    pushToast("Net worth snapshot recorded.");
  }, [pushToast]);

  const setPayday = useCallback(
    (day: number) => {
      const safe = normalizePaydayDay(day);
      setStore((current) => stamp({ ...current, paydayDay: safe }));
      pushToast(`Payday set to day ${safe} — your daily allowance now uses this.`);
    },
    [pushToast]
  );

  const wipeAll = useCallback(() => {
    if (
      !window.confirm(
        "Permanently delete everything stored on this device?\n\nAll entries, budgets and savings will be erased. Export first if you may need this data again. This cannot be undone."
      )
    ) {
      return;
    }
    localStorage.removeItem(LOCAL_DATA_KEY);
    setStore({
      version: LOCAL_DATA_VERSION,
      categories: store.categories.map((c) => ({ ...c, spentCents: 0, txCount: 0 })),
      transactions: [],
      goals: store.goals.map((g) => ({ ...g, savedCents: 0 })),
      paydayDay: normalizePaydayDay(store.paydayDay),
      recurring: [],
      netWorthItems: [],
      netWorthHistory: [],
      bucketMap: {},
      debts: [],
      irregularExpenses: [],
      updatedAt: new Date().toISOString(),
    });
    setFilterCatId(null);
    setMonth(currentMonth);
    pushToast("Everything on this device has been erased.");
  }, [store, currentMonth, pushToast]);

  const backup = useCallback(() => {
    downloadFile(backupFilename(), JSON.stringify(store, null, 2), "application/json");
    pushToast("Backup downloaded. Keep it somewhere safe.");
  }, [store, pushToast]);

  const restore = useCallback(
    async (file: File) => {
      const restored = parseBackup(await file.text());
      if (!restored) {
        pushToast("That file is not a valid Ledgerline backup.");
        return;
      }
      if (!window.confirm("Replace this device's planner with the selected backup?")) return;
      setStore(stamp(restored));
      setFilterCatId(null);
      setMonth(currentMonth);
      pushToast("Backup restored on this device.");
    },
    [currentMonth, pushToast]
  );

  const startFresh = useCallback(() => {
    if (
      !window.confirm(
        "Start fresh on this device? This removes all entries and resets saved goal amounts. Download a backup first if you may need this data later."
      )
    ) {
      return;
    }
    setStore((current) => freshStore(current));
    setFilterCatId(null);
    setMonth(currentMonth);
    pushToast("Fresh planner ready. Categories and budgets were kept as a template.");
  }, [currentMonth, pushToast]);

  /**
   * Full workbook export: every entry, a per-month summary and savings goals.
   * Built entirely on-device so it works offline.
   */
  const exportWorkbook = useCallback(() => {
    const categoryMap = new Map(
      data.categories.map((category) => [category.id, category.name])
    );

    // ── Sheet 1: the complete ledger, oldest first ──────────────────────
    const ledgerHeader: Row = [
      { value: "Date", bold: true },
      { value: "Type", bold: true },
      { value: "Category", bold: true },
      { value: "Description", bold: true },
      { value: "Amount", bold: true },
      { value: "Payment Method", bold: true },
      { value: "Notes", bold: true },
    ];

    const ledgerRows: Row[] = [...store.transactions]
      .sort((a, b) => (a.date === b.date ? a.id - b.id : a.date.localeCompare(b.date)))
      .map((tx) => [
        { value: tx.date },
        { value: tx.kind === "income" ? "Income" : "Spending" },
        { value: categoryMap.get(tx.categoryId) ?? "Uncategorised" },
        { value: tx.note },
        {
          // Signed so income and spending both read correctly in Excel.
          value: tx.kind === "income" ? tx.amountCents / 100 : -tx.amountCents / 100,
          signed: true,
        },
        { value: "" },
        { value: "" },
      ]);

    // ── Sheet 2: one row per month that has activity ────────────────────
    const summaryHeader: Row = [
      { value: "Month", bold: true },
      { value: "Money In", bold: true },
      { value: "Money Spent", bold: true },
      { value: "Money Left", bold: true },
      { value: "Budget Planned", bold: true },
      { value: "Budget Left", bold: true },
    ];

    const budgetPlanned = store.categories
      .filter((c) => c.kind === "expense")
      .reduce((sum, c) => sum + c.budgetCents, 0);

    const monthKeys = [...new Set(store.transactions.map((tx) => tx.date.slice(0, 7)))]
      .filter((key) => /^\d{4}-\d{2}$/.test(key))
      .sort();

    const summaryRows: Row[] = monthKeys.map((key) => {
      const month = deriveMonth(store, key);
      return [
        { value: monthLabel(key) },
        { value: month.incomeCents / 100, money: true },
        { value: month.expenseCents / 100, money: true },
        { value: (month.incomeCents - month.expenseCents) / 100, money: true },
        { value: budgetPlanned / 100, money: true },
        { value: (budgetPlanned - month.expenseCents) / 100, money: true },
      ];
    });

    // ── Sheet 3: savings goals ──────────────────────────────────────────
    const goalsHeader: Row = [
      { value: "Goal", bold: true },
      { value: "Saved", bold: true },
      { value: "Target", bold: true },
      { value: "Left", bold: true },
    ];

    const goalRows: Row[] = store.goals.map((goal) => [
      { value: goal.name },
      { value: goal.savedCents / 100, money: true },
      { value: goal.targetCents / 100, money: true },
      { value: (goal.targetCents - goal.savedCents) / 100, money: true },
    ]);

    const sheets: Sheet[] = [
      {
        name: "Ledger",
        rows: [ledgerHeader, ...ledgerRows],
        widths: [12, 10, 18, 34, 14, 16, 24],
      },
      {
        name: "Monthly Summary",
        rows: [summaryHeader, ...summaryRows],
        widths: [14, 14, 14, 14, 16, 14],
      },
      {
        name: "Savings Goals",
        rows: [goalsHeader, ...goalRows],
        widths: [24, 12, 12, 12],
      },
    ];

    downloadFile(
      `ledgerline-${currentMonthKey()}.xlsx`,
      "",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      buildXlsx(sheets)
    );
    pushToast("Spreadsheet downloaded with 3 sheets: Ledger, Monthly Summary, Savings Goals.");
  }, [store, data.categories, pushToast]);

  const kpis: KpiItem[] = useMemo(() => {
    const income = data.incomeCents;
    const spent = data.expenseCents;
    const left = income - spent;
    const budgetTotal = data.categories
      .filter((category) => category.kind === "expense")
      .reduce((sum, category) => sum + category.budgetCents, 0);
    const budgetLeft = budgetTotal - spent;
    const deposits = data.transactions.filter((tx) => tx.kind === "income").length;
    return [
      {
        label: "Money in",
        value: income,
        format: "money",
        dot: "var(--mint)",
        valueClass: "text-mint",
        sub: `From ${deposits} payment${deposits === 1 ? "" : "s"} received this month`,
        help: "Everything you were paid this month — salary, freelance work, refunds, or anything marked as income.",
      },
      {
        label: "Money spent",
        value: spent,
        format: "money",
        dot: "var(--bone)",
        valueClass: "text-bone",
        sub:
          budgetTotal > 0
            ? `${pct(Math.min(spent, budgetTotal), budgetTotal)}% of the ${moneyWhole(budgetTotal, currencyCode)} you planned`
            : "You have not set any budgets yet",
        help: "Everything that went out this month, added up across all categories.",
      },
      {
        label: "Money left",
        value: left,
        format: "money",
        dot: left >= 0 ? "var(--lime)" : "var(--rose)",
        valueClass: left >= 0 ? "text-lime" : "text-rose",
        sub:
          income > 0
            ? `You still have ${pct(Math.max(left, 0), income)}% of what you earned`
            : "Add some income to see this",
        help: "Money in minus money spent — the money actually left in your pocket.",
      },
      {
        label: "Budget left",
        value: budgetLeft,
        format: "money",
        dot: budgetLeft >= 0 ? "var(--gold)" : "var(--rose)",
        valueClass: budgetLeft >= 0 ? "text-gold" : "text-rose",
        sub:
          budgetTotal === 0
            ? "Set budgets by category to use this figure"
            : budgetLeft >= 0
              ? `${moneyWhole(budgetTotal, currencyCode)} planned − ${moneyWhole(spent, currencyCode)} spent`
              : `${moneyWhole(spent, currencyCode)} spent against ${moneyWhole(budgetTotal, currencyCode)} planned`,
        help: "All category budgets added together, minus what you spent. This measures your plan, not your bank balance.",
      },
    ];
  }, [data, currencyCode]);

  return (
    <CurrencyContext.Provider value={currencyCtx}>
      <div className="min-h-screen bg-ink">
        <Grain />
        <PlannerTopbar
          month={month}
          canNext={month < shiftMonth(currentMonth, 12)}
          switching={switching}
          onPrev={() => switchMonth(-1)}
          onNext={() => switchMonth(1)}
          onAddIncome={() => setIncomeOpen(true)}
          onAddSpending={() => setSpendingOpen(true)}
          expanded={topBarExpanded}
          onToggleExpanded={() => setTopBarExpanded(v => !v)}
        />

        <main className="mx-auto max-w-[1440px] space-y-3 px-3 pb-14 pt-4 sm:px-4 sm:pt-5 md:px-8 md:pb-16">
          <div className={cn("mb-4", !topBarExpanded && "landscape:hidden md:hidden portrait:max-md:block")}>
            <OfflineControls saved={storageReady} onStartFresh={startFresh} />
          </div>
          <div className={cn(!topBarExpanded && "landscape:hidden md:hidden portrait:max-md:block")}>
            <HelpPanel />
          </div>

          <div>
            <SectionTitle
              className="mb-3"
              title="Your month at a glance"
              help="Money in minus money spent equals money left. Budget left is all category budgets together, minus what you spent. Every figure comes from your entries below."
            />
            <KpiRow items={kpis} />
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={month}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              className="space-y-3"
            >
              {/* 1 — hero: where your money went */}
              <DonutCard
                hero
                categories={data.categories}
                expenseCents={data.expenseCents}
                month={month}
                onFilter={toggleFilter}
              />

              {/* 2 — what you spent each day */}
              <DailyChartCard
                transactions={data.transactions}
                categories={data.categories}
                month={month}
                today={today}
                expenseCents={data.expenseCents}
                budgetCents={envelopeTotal}
                paydayDay={normalizePaydayDay(store.paydayDay)}
              />

              {/* 3 — spending by category */}
              <BudgetsCard
                categories={data.categories}
                onSaveBudget={saveBudget}
                onSaveName={renameCategory}
                onFilter={toggleFilter}
                onRevealInLedger={revealInLedger}
                onDeleteCategory={deleteCategory}
                onAddCategory={() => setCatModalOpen(true)}
                activeFilter={filterCatId}
              />

              {/* 4 — everything you logged */}
              <LedgerCard
                ref={ledgerRef}
                transactions={visibleTx}
                totalCount={data.transactions.length}
                categories={data.categories}
                today={today}
                filter={filterCat}
                onClearFilter={() => setFilterCatId(null)}
                onDelete={deleteTransaction}
                onEditAmount={editAmount}
                onExportCsv={exportWorkbook}
              />

              {/* 5 — things you are saving for */}
              <GoalsRow
                goals={data.goals}
                onFund={fundGoal}
                onAdd={() => { setEditingGoal(null); setGoalModalOpen(true); }}
                onEdit={(g) => { setEditingGoal(g); setGoalModalOpen(true); }}
                onDelete={deleteGoal}
              />
              <TrendCard store={store} currentMonth={currentMonth} />

              {/* ── Recurring transactions ── */}
              <RecurringCard
                recurring={store.recurring}
                categories={data.categories}
                onAdd={addRecurring}
                onToggle={toggleRecurring}
                onDelete={deleteRecurring}
              />

              {/* ── 50/30/20 budget rule ── */}
              <BudgetRuleCard
                categories={data.categories}
                incomeCents={data.incomeCents}
                expenseCents={data.expenseCents}
                bucketMap={store.bucketMap}
                onChangeBucket={changeBucket}
              />

              {/* ── Net worth tracker ── */}
              <NetWorthCard
                items={store.netWorthItems}
                history={store.netWorthHistory}
                onAdd={addNetWorthItem}
                onUpdate={updateNetWorthItem}
                onDelete={deleteNetWorthItem}
                onRecordSnapshot={recordNetWorthSnapshot}
              />

              {/* ── Annual summary ── */}
              <AnnualSummaryCard store={store} currentMonth={currentMonth} />

              {/* Bill calendar */}
              <BillCalendarCard
                store={store}
                month={month}
                today={today}
                onPayBill={(bill, date) => {
                  const tx = {
                    id: nextTransactionId(store),
                    date,
                    note: bill.name,
                    amountCents: bill.amountCents,
                    kind: bill.kind,
                    categoryId: bill.categoryId,
                  };
                  insertTransaction(tx);
                  pushToast(`Payment recorded for ${bill.name}.`);
                }}
              />

              {/* Quarterly overview */}
              <QuarterlyCard store={store} currentMonth={currentMonth} />

              {/* Debt payoff calculator */}
              <DebtPayoffCard
                debts={store.debts}
                onAdd={addDebt}
                onDelete={deleteDebt}
              />

              {/* No-spend challenge */}
              <NoSpendCard
                transactions={data.transactions}
                month={month}
                today={today}
              />

              {/* Irregular expense planner */}
              <IrregularExpenseCard
                items={store.irregularExpenses}
                onAdd={addIrregular}
                onDelete={deleteIrregular}
              />
            </motion.div>
          </AnimatePresence>
        </main>

        <FooterSettings
          paydayDay={normalizePaydayDay(store.paydayDay)}
          onPaydayChange={setPayday}
          onExportJson={backup}
          onRestore={(file) => void restore(file)}
          onWipe={wipeAll}
        />

        <AddSpendingModal
          open={spendingOpen}
          onClose={() => setSpendingOpen(false)}
          onSubmit={createTransaction}
          categories={data.categories}
          month={month}
          today={today}
        />
        <AddIncomeModal
          open={incomeOpen}
          onClose={() => setIncomeOpen(false)}
          onSubmit={createTransaction}
          categories={data.categories}
          month={month}
          today={today}
        />
        <AddSpendingFab onOpen={() => setSpendingOpen(true)} />
        <ManageGoalModal
          open={goalModalOpen}
          editing={editingGoal}
          onClose={() => setGoalModalOpen(false)}
          onSave={(payload) => editingGoal ? updateGoal(editingGoal.id, payload) : createGoal(payload)}
          onDelete={deleteGoal}
        />
        <ManageCategoryModal
          open={catModalOpen}
          onClose={() => setCatModalOpen(false)}
          onSave={createCategory}
        />
        <ToastStack
          toasts={toasts}
          onDismiss={(id) =>
            setToasts((items) => items.filter((item) => item.id !== id))
          }
        />
      </div>
    </CurrencyContext.Provider>
  );
}
