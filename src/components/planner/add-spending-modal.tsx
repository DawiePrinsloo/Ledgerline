"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ShoppingBag, X } from "lucide-react";
import { iconFor } from "@/lib/icons";
import { parseDollarsToCents } from "@/lib/format";
import { monthRange, monthLabel } from "@/lib/months";
import { toneVar } from "@/lib/themes";
import { symbolFor } from "@/lib/currencies";
import { useCurrency } from "@/lib/currency-context";
import type { CategoryDTO, NewTxPayload, TxDTO } from "@/lib/types";
import { cn } from "@/lib/utils";

interface AddSpendingModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (payload: NewTxPayload) => Promise<TxDTO | null>;
  categories: CategoryDTO[];
  month: string;
  today: string;
}

function defaultDateFor(month: string, today: string): string {
  return today.startsWith(`${month}-`) ? today : `${month}-01`;
}

/**
 * Money going out. Spending needs a category so the envelopes and charts can
 * account for it; the note stays optional because the category already says
 * most of what matters.
 */
export function AddSpendingModal({
  open,
  onClose,
  onSubmit,
  categories,
  month,
  today,
}: AddSpendingModalProps) {
  const { code } = useCurrency();
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [categoryId, setCategoryId] = useState<number>(0);
  const [date, setDate] = useState(today);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  const spendingCats = useMemo(
    () => categories.filter((c) => c.kind === "expense"),
    [categories]
  );

  useEffect(() => {
    if (open) {
      setAmount("");
      setNote("");
      setDate(defaultDateFor(month, today));
      setError("");
      setPending(false);
      setCategoryId(spendingCats[0]?.id ?? 0);
    }
  }, [open, month, today, spendingCats]);

  const chosen = spendingCats.find((c) => c.id === categoryId);

  const submit = async () => {
    const amountCents = parseDollarsToCents(amount);
    if (amountCents === null) return setError("Enter how much you spent, for example 45.");
    if (!categoryId) return setError("Choose a category.");

    setPending(true);
    setError("");
    const created = await onSubmit({
      // The note is optional — fall back to the category name so the ledger
      // never shows a blank row.
      note: (note.trim() || chosen?.name || "Spending").slice(0, 80),
      amountCents,
      kind: "expense",
      categoryId,
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
            className="scroll-slim relative max-h-[92vh] w-full max-w-[470px] overflow-y-auto border border-linebright bg-panel p-5 shadow-2xl shadow-black/70 sm:p-6"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="flex items-center gap-2 text-[15px] font-semibold text-bone">
                  <ShoppingBag size={15} className="text-lime" />
                  Add spending
                </h2>
                <p className="mt-1 text-[11.5px] text-mist">
                  Money you spent in {monthLabel(month)}. Only the amount and
                  category are required.
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
              <span className="text-[11px] font-medium text-fog">How much did you spend?</span>
              <span className="mt-1.5 flex items-baseline gap-2 border-b border-linebright pb-1.5 transition-colors focus-within:border-lime">
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
                  aria-label="Spending amount"
                  className="tabular w-full bg-transparent font-mono text-[30px] leading-tight text-bone outline-none placeholder:text-mist/40"
                />
              </span>
            </label>

            {/* category — icon chips, one tap to choose */}
            <div className="mt-5">
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-[11px] font-medium text-fog">Which category?</span>
                <span className="text-[10.5px] text-mist">Pick the closest match</span>
              </div>
              <div className="mt-2 grid grid-cols-2 gap-1.5">
                {spendingCats.map((c) => {
                  const Icon = iconFor(c.icon);
                  const selected = c.id === categoryId;
                  return (
                    <button
                      key={c.id}
                      onClick={() => {
                        setCategoryId(c.id);
                        if (error) setError("");
                      }}
                      aria-pressed={selected}
                      style={
                        selected
                          ? {
                              borderColor: toneVar(c.icon),
                              backgroundColor: `color-mix(in srgb, ${toneVar(c.icon)} 10%, transparent)`,
                            }
                          : undefined
                      }
                      className={cn(
                        "flex items-center gap-2.5 border px-3 py-2.5 text-left transition-colors",
                        selected ? "text-bone" : "border-line text-fog hover:border-linebright"
                      )}
                    >
                      <Icon size={14} className="shrink-0" style={{ color: toneVar(c.icon) }} />
                      <span className="truncate text-[12px]">{c.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* optional note */}
            <label className="mt-5 block">
              <span className="flex items-baseline justify-between gap-2">
                <span className="text-[11px] font-medium text-fog">What was it for?</span>
                <span className="text-[10.5px] text-mist">Optional</span>
              </span>
              <input
                value={note}
                onChange={(e) => setNote(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && submit()}
                maxLength={80}
                placeholder={
                  chosen?.name === "Groceries"
                    ? "Trader Joe's"
                    : chosen?.name === "Transport"
                      ? "Shell station"
                      : "Shell station, Trader Joe's…"
                }
                aria-label="Note, optional"
                className="mt-1.5 w-full border-b border-linebright bg-transparent pb-1.5 text-[15px] text-bone outline-none transition-colors placeholder:text-mist/50 focus:border-lime"
              />
              <span className="mt-1.5 block text-[10.5px] text-mist">
                Leave this blank and it will be saved as “{chosen?.name ?? "Spending"}”.
              </span>
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
                className="tabular mt-1.5 w-full border border-line bg-coal px-3 py-2.5 font-mono text-[13px] text-bone outline-none transition-colors focus:border-lime"
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
                className="bg-lime px-6 py-3 text-[12px] font-semibold text-limedark transition-transform duration-200 hover:-translate-y-0.5 disabled:translate-y-0 disabled:opacity-50"
              >
                {pending ? "Saving…" : "Save spending"}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
