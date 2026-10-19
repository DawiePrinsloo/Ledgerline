"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Briefcase, X } from "lucide-react";
import { parseDollarsToCents } from "@/lib/format";
import { monthRange, monthLabel } from "@/lib/months";
import { symbolFor } from "@/lib/currencies";
import { useCurrency } from "@/lib/currency-context";
import type { CategoryDTO, NewTxPayload, TxDTO } from "@/lib/types";

interface AddIncomeModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (payload: NewTxPayload) => Promise<TxDTO | null>;
  categories: CategoryDTO[];
  month: string;
  today: string;
}

/** Common sources, offered as one-tap chips rather than a category picker. */
const INCOME_TYPES = ["Salary", "Freelance", "Other"];

function defaultDateFor(month: string, today: string): string {
  return today.startsWith(`${month}-`) ? today : `${month}-01`;
}

/**
 * Money coming in. Income has no spending category, so this form asks only
 * what actually differs between deposits: how much, from where, and when.
 */
export function AddIncomeModal({
  open,
  onClose,
  onSubmit,
  categories,
  month,
  today,
}: AddIncomeModalProps) {
  const { code } = useCurrency();
  const [amount, setAmount] = useState("");
  const [source, setSource] = useState("");
  const [type, setType] = useState<string>("Salary");
  const [date, setDate] = useState(today);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  const incomeCategory = categories.find((c) => c.kind === "income");

  useEffect(() => {
    if (open) {
      setAmount("");
      setSource("");
      setType("Salary");
      setDate(defaultDateFor(month, today));
      setError("");
      setPending(false);
    }
  }, [open, month, today]);

  const submit = async () => {
    const amountCents = parseDollarsToCents(amount);
    if (amountCents === null) return setError("Enter how much you received, for example 2400.");
    if (!source.trim()) return setError("Say where it came from, for example Salary — Field & Form Co.");
    if (!incomeCategory) return setError("No income category exists on this device.");

    setPending(true);
    setError("");
    const from = source.trim();
    const note =
      type === "Other" || from.toLowerCase().startsWith(type.toLowerCase())
        ? from
        : `${type} — ${from}`;

    const created = await onSubmit({
      note: note.slice(0, 80),
      amountCents,
      kind: "income",
      categoryId: incomeCategory.id,
      date,
    });
    setPending(false);
    if (created) onClose();
    else setError("That did not save. Please try again.");
  };

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[90] flex items-end justify-center p-3 sm:items-center sm:p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={onClose}
            className="absolute inset-0 bg-ink/70 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, y: 32, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 320, damping: 30 }}
            className="scroll-slim relative max-h-[92vh] w-full max-w-[440px] overflow-y-auto border border-mint/40 bg-panel p-5 shadow-2xl shadow-black/70 sm:p-6"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="flex items-center gap-2 text-[15px] font-semibold text-mint">
                  <Briefcase size={15} />
                  Add income
                </h2>
                <p className="mt-1 text-[11.5px] text-mist">
                  Money you received in {monthLabel(month)}.
                </p>
              </div>
              <button
                onClick={onClose}
                aria-label="Close"
                className="shrink-0 p-1 text-mist transition-colors hover:text-bone"
              >
                <X size={15} />
              </button>
            </div>

            {/* amount */}
            <label className="mt-5 block">
              <span className="text-[11px] font-medium text-fog">How much did you receive?</span>
              <span className="mt-1.5 flex items-baseline gap-2 border-b border-linebright pb-1.5 transition-colors focus-within:border-mint">
                <span className="font-mono text-xl text-mist">{symbolFor(code)}</span>
                <input
                  autoFocus
                  value={amount}
                  onChange={(e) => {
                    setAmount(e.target.value.replace(/[^0-9.,]/g, ""));
                    if (error) setError("");
                  }}
                  onKeyDown={(e) => e.key === "Enter" && submit()}
                  inputMode="decimal"
                  placeholder="0.00"
                  aria-label="Income amount"
                  className="tabular w-full bg-transparent font-mono text-[30px] leading-tight text-bone outline-none placeholder:text-mist/40"
                />
              </span>
            </label>

            {/* FROM — free text naming the payer. Income comes FROM somewhere,
                it is never FOR a spending category. */}
            <label className="mt-5 block">
              <span className="text-[11px] font-medium text-fog">From</span>
              <input
                value={source}
                onChange={(e) => {
                  setSource(e.target.value);
                  if (error) setError("");
                }}
                onKeyDown={(e) => e.key === "Enter" && submit()}
                maxLength={80}
                placeholder="e.g. Salary — Field & Form Co."
                aria-label="Who or what this income came from"
                className="mt-1.5 w-full border-b border-linebright bg-transparent pb-1.5 text-[15px] text-bone outline-none transition-colors placeholder:text-mist/50 focus:border-mint"
              />
            </label>

            {/* TYPE — a real dropdown, income types only */}
            <label className="mt-5 block">
              <span className="text-[11px] font-medium text-fog">Type</span>
              <select
                value={type}
                onChange={(e) => {
                  setType(e.target.value);
                  if (error) setError("");
                }}
                aria-label="Type of income"
                className="mt-1.5 w-full border border-line bg-coal px-3 py-2.5 text-[14px] text-bone outline-none transition-colors focus:border-mint"
              >
                {INCOME_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </label>

            {/* date */}
            <label className="mt-5 block">
              <span className="text-[11px] font-medium text-fog">What date?</span>
              <input
                type="date"
                value={date}
                min={`${month}-01`}
                max={monthRange(month).end}
                onChange={(e) => setDate(e.target.value)}
                className="tabular mt-1.5 w-full border border-line bg-coal px-3 py-2.5 font-mono text-[13px] text-bone outline-none transition-colors focus:border-mint"
              />
            </label>

            <div className="mt-4 min-h-4 text-[11.5px] text-rose">{error}</div>

            <div className="mt-2 flex items-center justify-end gap-3">
              <button
                onClick={onClose}
                className="px-4 py-3 text-[12px] text-mist transition-colors hover:text-bone"
              >
                Cancel
              </button>
              <button
                onClick={submit}
                disabled={pending}
                className="bg-mint px-6 py-3 text-[12px] font-semibold text-ink transition-transform duration-200 hover:-translate-y-0.5 disabled:translate-y-0 disabled:opacity-50"
              >
                {pending ? "Saving…" : "Save income"}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
