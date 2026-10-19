"use client";

import { forwardRef, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowUpToLine, Download, Trash2, X } from "lucide-react";
import { Panel, CardHead } from "./card";
import { moneyExact, parseDollarsToCents } from "@/lib/format";
import { dayLabel } from "@/lib/months";
import { toneVar } from "@/lib/themes";
import { useCurrency } from "@/lib/currency-context";
import type { CategoryDTO, TxDTO } from "@/lib/types";
import { cn } from "@/lib/utils";

interface LedgerCardProps {
  transactions: TxDTO[];
  totalCount: number;
  categories: CategoryDTO[];
  today: string;
  filter: CategoryDTO | null;
  onClearFilter: () => void;
  onDelete: (tx: TxDTO) => void;
  onEditAmount: (tx: TxDTO, amountCents: number) => void;
  onExportCsv: () => void;
  className?: string;
}

interface DayGroup {
  date: string;
  items: TxDTO[];
  net: number;
}

export const LedgerCard = forwardRef<HTMLDivElement, LedgerCardProps>(function LedgerCard(
  {
    transactions,
    totalCount,
    categories,
    today,
    filter,
    onClearFilter,
    onDelete,
    onEditAmount,
    onExportCsv,
    className,
  },
  ref
) {
  const { code } = useCurrency();
  const listRef = useRef<HTMLDivElement>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [draft, setDraft] = useState("");
  const [editError, setEditError] = useState("");
  const catById = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories]);

  const startEdit = (tx: TxDTO) => {
    setEditingId(tx.id);
    setDraft((tx.amountCents / 100).toString());
    setEditError("");
  };

  const MAX_CENTS = 100_000_000; // a single entry above 1,000,000 is a typo

  const validate = (raw: string): { cents: number | null; error: string } => {
    const trimmed = raw.trim();
    if (!trimmed) return { cents: null, error: "" };
    if (/^-/.test(trimmed)) {
      return { cents: null, error: "Amounts cannot be negative. Delete this entry and add it as income instead." };
    }
    const parsed = parseDollarsToCents(trimmed);
    if (parsed === null) {
      return /^0*([.,]0*)?$/.test(trimmed)
        ? { cents: null, error: "Zero is not a valid amount. Use the bin icon to delete this entry." }
        : { cents: null, error: "Enter a number, for example 12.50" };
    }
    if (parsed > MAX_CENTS) {
      return { cents: null, error: "That amount looks too large. Check for an extra digit." };
    }
    return { cents: parsed, error: "" };
  };

  const commit = (tx: TxDTO) => {
    const { cents, error } = validate(draft);
    if (error) {
      setEditError(error);
      return; // keep the field open so the correction is not silently lost
    }
    if (cents !== null && cents !== tx.amountCents) onEditAmount(tx, cents);
    setEditingId(null);
    setEditError("");
  };

  const groups = useMemo<DayGroup[]>(() => {
    const map = new Map<string, DayGroup>();
    for (const tx of transactions) {
      const g = map.get(tx.date) ?? { date: tx.date, items: [], net: 0 };
      g.items.push(tx);
      g.net += tx.kind === "income" ? tx.amountCents : -tx.amountCents;
      map.set(tx.date, g);
    }
    return [...map.values()];
  }, [transactions]);

  return (
    <Panel ref={ref} className={className}>
      <CardHead
        title="Everything you logged"
        hint="Your entries, newest first, grouped by day. Click any amount to correct it, or use the bin icon to delete an entry."
        help="Money coming in is shown in green with a + sign. Money going out is shown with a − sign. “Left after this day” is that day's income minus its spending. Deleting an entry can be undone straight afterwards."
        right={
          <span className="flex items-center gap-3">
            <button
              onClick={() => listRef.current?.scrollTo({ top: 0, behavior: "smooth" })}
              title="Scroll back to the newest entry"
              className="flex items-center gap-1 border border-line px-2 py-1 text-[10px] text-mist transition-colors hover:border-linebright hover:text-bone"
            >
              <ArrowUpToLine size={10} />
              Back to top
            </button>
            <span className="text-[11px] text-mist">
              <span className="tabular text-bone">{transactions.length}</span>
              {filter ? ` of ${totalCount} shown` : " entries"}
            </span>
          </span>
        }
      />

      {filter && (
        <div className="mb-3 flex items-center gap-2.5">
          <span className="flex items-center gap-2 border border-lime/60 px-2.5 py-1 text-[11px] text-lime">
            <span className="size-1.5 rounded-full" style={{ backgroundColor: toneVar(filter.icon) }} />
            Filtering: <strong className="font-semibold">{filter.name}</strong>
            <button
              onClick={onClearFilter}
              aria-label="Show all entries again"
              title="Show all entries again"
              className="text-lime/60 transition-colors hover:text-lime"
            >
              <X size={11} />
            </button>
          </span>
          {filter.budgetCents > 0 && (
            <span className="tabular text-[11px] text-mist">
              {filter.spentCents > filter.budgetCents
                ? `${moneyExact(filter.spentCents - filter.budgetCents, code)} over this budget`
                : `${moneyExact(filter.budgetCents - filter.spentCents, code)} still left in this budget`}
            </span>
          )}
        </div>
      )}

      {groups.length === 0 ? (
        <p className="py-16 text-center font-mono text-[11px] leading-relaxed tracking-[0.2em] text-mist">
          {filter ? (
            <>
              You have not logged anything in this category yet.
              <br />
              <button onClick={onClearFilter} className="mt-2 text-lime underline decoration-dotted underline-offset-4">
                Show all entries again
              </button>
            </>
          ) : (
            <>
              Nothing logged yet for this month.
              <br />
              Use the green “Add entry” button above to record your first one.
            </>
          )}
        </p>
      ) : (
        <div ref={listRef} className="scroll-slim max-h-[520px] overflow-y-auto pr-1.5">
          {groups.map((g) => (
            <div key={g.date}>
              <div className="sticky top-0 z-10 flex items-baseline justify-between bg-coal pb-1.5 pt-4 font-mono text-[9px] tracking-[0.3em] text-mist first:pt-0">
                <span className={cn(g.date === today && "text-lime")}>{dayLabel(g.date, today)}</span>
                <span className="tabular" title="This day's income minus this day's spending">
                  {g.net >= 0 ? "+" : "−"}
                  {moneyExact(Math.abs(g.net), code)}
                  <span className="hidden sm:inline"> on this day</span>
                </span>
              </div>
              <div>
                <AnimatePresence initial={false}>
                  {g.items.map((tx) => {
                    const cat = catById.get(tx.categoryId);
                    return (
                      <motion.div
                        key={tx.id}
                        layout
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0, x: -18, height: 0, marginTop: 0, marginBottom: 0 }}
                        transition={{ duration: 0.25 }}
                        className="group flex items-center gap-3 overflow-hidden border-b border-line/40 py-2.5 last:border-0"
                      >
                        <span
                          className="size-1.5 shrink-0 rounded-full"
                          style={{ backgroundColor: cat ? toneVar(cat.icon) : "var(--mist)" }}
                        />
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-[13px] text-bone">{tx.note}</div>
                          <div className="mt-0.5 font-mono text-[8.5px] tracking-[0.25em] text-mist">
                            {(cat?.name ?? "Uncategorised").toUpperCase()}
                          </div>
                        </div>
                        {editingId === tx.id ? (
                          <span className="relative flex shrink-0 flex-col items-end">
                            <input
                              autoFocus
                              value={draft}
                              inputMode="decimal"
                              aria-label={`Correct the amount for ${tx.note}`}
                              aria-invalid={editError ? true : undefined}
                              onChange={(e) => {
                                setDraft(e.target.value);
                                if (editError) setEditError("");
                              }}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") commit(tx);
                                if (e.key === "Escape") {
                                  setEditingId(null);
                                  setEditError("");
                                }
                              }}
                              className={cn(
                                "tabular w-[84px] border-b bg-transparent pb-0.5 text-right font-mono text-[12.5px] outline-none",
                                editError ? "border-rose text-rose" : "border-lime text-lime"
                              )}
                            />
                            {editError && (
                              <span className="absolute right-0 top-full z-20 mt-1 w-[min(230px,62vw)] border border-rose/60 bg-raise px-2.5 py-1.5 text-left text-[10.5px] leading-relaxed text-rose shadow-lg shadow-black/50">
                                {editError}
                              </span>
                            )}
                          </span>
                        ) : (
                          <button
                            onClick={() => startEdit(tx)}
                            title="Edit amount"
                            className={cn(
                              "tabular shrink-0 font-mono text-[12.5px] underline decoration-transparent decoration-dotted underline-offset-4 transition-colors hover:decoration-lime",
                              tx.kind === "income" ? "text-mint hover:decoration-mint" : "text-fog hover:text-bone"
                            )}
                          >
                            {tx.kind === "income" ? "+" : "−"}
                            {moneyExact(tx.amountCents, code)}
                          </button>
                        )}
                        <button
                          onClick={() => onDelete(tx)}
                          aria-label={`Delete ${tx.note}`}
                          title="Delete this entry"
                          className="shrink-0 p-1 text-mist transition-all hover:text-rose md:opacity-0 md:group-hover:opacity-100"
                        >
                          <Trash2 size={13} />
                        </button>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-line/60 pt-3 text-[10.5px] text-mist">
        <span>Tap an amount to correct it</span>
        <button
          onClick={onExportCsv}
          title="Download every entry for this month as a CSV file you can open in Excel or Google Sheets"
          className="inline-flex items-center gap-1.5 border border-linebright px-2.5 py-1.5 text-[10.5px] font-medium text-fog transition-colors hover:border-lime hover:text-lime"
        >
          <Download size={12} />
          Download spreadsheet
        </button>
      </div>
    </Panel>
  );
});
