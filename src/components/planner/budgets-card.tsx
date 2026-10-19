"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { X } from "lucide-react";
import { Panel, CardHead } from "./card";
import { iconFor } from "@/lib/icons";
import { moneyWhole, parseDollarsToCents, pct } from "@/lib/format";
import { toneVar } from "@/lib/themes";
import { useCurrency } from "@/lib/currency-context";
import type { CategoryDTO } from "@/lib/types";
import { cn } from "@/lib/utils";

interface BudgetsCardProps {
  categories: CategoryDTO[];
  onSaveBudget: (categoryId: number, budgetCents: number) => void;
  onSaveName: (categoryId: number, name: string) => void;
  onFilter: (categoryId: number) => void;
  onRevealInLedger: (categoryId: number) => void;
  onDeleteCategory: (categoryId: number) => void;
  onAddCategory: () => void;
  activeFilter: number | null;
  className?: string;
}

/** Amber once 70% of a budget is used, red once it is passed. */
const WATCH_AT = 70;

function tint(colorVar: string): React.CSSProperties {
  return {
    color: colorVar,
    backgroundColor: `color-mix(in srgb, ${colorVar} 12%, transparent)`,
    border: `1px solid color-mix(in srgb, ${colorVar} 34%, transparent)`,
  };
}

export function BudgetsCard({
  categories,
  onSaveBudget,
  onSaveName,
  onFilter,
  onRevealInLedger,
  onDeleteCategory,
  onAddCategory,
  activeFilter,
  className,
}: BudgetsCardProps) {
  const { code } = useCurrency();
  const [editingId, setEditingId] = useState<number | null>(null);
  const [draft, setDraft] = useState("");
  const [renamingId, setRenamingId] = useState<number | null>(null);
  const [nameDraft, setNameDraft] = useState("");
  const [detailId, setDetailId] = useState<number | null>(null);

  const startRename = (c: CategoryDTO) => {
    setRenamingId(c.id);
    setNameDraft(c.name);
  };

  const commitRename = (c: CategoryDTO) => {
    const name = nameDraft.trim().slice(0, 24);
    if (name && name !== c.name) onSaveName(c.id, name);
    setRenamingId(null);
  };

  const envelopes = categories
    .filter((c) => c.kind === "expense")
    .sort((a, b) => b.budgetCents - a.budgetCents);

  const startEdit = (c: CategoryDTO) => {
    setEditingId(c.id);
    setDraft((c.budgetCents / 100).toString());
  };

  const commit = (c: CategoryDTO) => {
    const parsed = parseDollarsToCents(draft);
    if (parsed !== null && parsed !== c.budgetCents) {
      onSaveBudget(c.id, parsed);
    }
    setEditingId(null);
  };

  return (
    <Panel className={className}>
      <CardHead
        title="Spending by category"
        hint="For each category: what you have spent so far, and the budget you set. Click a row to filter your list of entries, a name to rename it, or a budget figure to change it."
        help="A budget is the amount you plan to spend in a category this month. The bar fills as you spend: amber once you pass 70% of the budget, red once you go over. Tap a status label to see the detail and jump to those entries."
        right={
          activeFilter !== null
            ? "Filtering your list — click the row again to show everything"
            : undefined
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {envelopes.map((c) => {
          const used = pct(c.spentCents, c.budgetCents);
          const over = c.spentCents > c.budgetCents && c.budgetCents > 0;
          const tight = !over && used >= WATCH_AT;
          const filtered = activeFilter === c.id;
          const dimmed = activeFilter !== null && !filtered;
          const Icon = iconFor(c.icon);
          return (
            <div
              key={c.id}
              role="button"
              tabIndex={0}
              title={`Filter the ledger to ${c.name}`}
              onClick={() => onFilter(c.id)}
              onKeyDown={(e) => {
                if (e.key === "Enter") onFilter(c.id);
              }}
              className={cn(
                "flex min-h-[110px] cursor-pointer flex-col gap-1.5 rounded-[4px] border border-line bg-coal p-4 transition-colors duration-300",
                filtered ? "border-lime/70 bg-raise/60" : "hover:border-linebright",
                dimmed && "opacity-45"
              )}
            >
              <div
                className="flex items-center gap-2"
                onClick={(e) => renamingId === c.id && e.stopPropagation()}
              >
              <span
                className={cn(
                  "flex size-7 shrink-0 items-center justify-center border transition-colors",
                  filtered ? "border-lime/70" : "border-line"
                )}
                style={{ color: toneVar(c.icon) }}
              >
                <Icon size={14} strokeWidth={1.75} />
              </span>

              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  {renamingId === c.id ? (
                    <input
                      autoFocus
                      value={nameDraft}
                      maxLength={24}
                      onChange={(e) => setNameDraft(e.target.value)}
                      onBlur={() => commitRename(c)}
                      onKeyDown={(e) => {
                        e.stopPropagation();
                        if (e.key === "Enter") commitRename(c);
                        if (e.key === "Escape") setRenamingId(null);
                      }}
                      onClick={(e) => e.stopPropagation()}
                      className="w-full border-b border-lime bg-transparent pb-0.5 text-[14px] font-bold uppercase tracking-[0.02em] text-lime outline-none"
                    />
                  ) : (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        startRename(c);
                      }}
                      aria-label={`Category: ${c.name}. Click to rename it.`}
                      title="Click to rename this category"
                      className="block truncate text-left text-[14px] font-bold uppercase leading-tight tracking-[0.02em] text-bone underline decoration-transparent decoration-dotted underline-offset-4 transition-colors hover:text-lime hover:decoration-lime"
                    >
                      {c.name}
                    </button>
                  )}
                </div>
                </div>
              </div>

              <div className="mt-auto" onClick={(e) => e.stopPropagation()}>
                <p className="ll-clamp-2 tabular font-mono text-[12.5px] leading-snug text-bone sm:text-[13px]">
                  Spent {moneyWhole(c.spentCents, code)} of{" "}
                  {editingId === c.id ? (
                    <input
                      autoFocus
                      value={draft}
                      aria-label={`Budget amount for ${c.name}`}
                      onChange={(e) => setDraft(e.target.value)}
                      onBlur={() => commit(c)}
                      onKeyDown={(e) => {
                        e.stopPropagation();
                        if (e.key === "Enter") commit(c);
                        if (e.key === "Escape") setEditingId(null);
                      }}
                      className="tabular w-[74px] max-w-full border-b border-lime bg-transparent pb-0.5 text-right font-mono text-[12.5px] text-lime outline-none"
                    />
                  ) : (
                    <button
                      onClick={() => startEdit(c)}
                      aria-label={`Budget for ${c.name} is ${moneyWhole(c.budgetCents, code)}. Click to change it.`}
                      title="Click to change this budget"
                      className="font-semibold text-bone underline decoration-dotted decoration-mist underline-offset-4 transition-colors hover:text-lime hover:decoration-lime"
                    >
                      {moneyWhole(c.budgetCents, code)}
                    </button>
                  )}{" "}
                  budget{" "}
                  <span className="text-mist" aria-hidden="true">•</span>{" "}
                  <span className="relative inline-block">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setDetailId((cur) => (cur === c.id ? null : c.id));
                        onRevealInLedger(c.id);
                      }}
                      aria-expanded={detailId === c.id}
                      title={
                        c.budgetCents === 0
                          ? `No budget set for ${c.name} — click to set one and see the entries`
                          : over
                            ? `Over budget — show the ${c.name} entries`
                            : tight
                              ? `Nearly out of budget — show the ${c.name} entries`
                              : `Show the ${c.name} entries`
                      }
                      className={cn(
                        "px-1.5 py-[1px] text-[10px] font-medium transition-opacity hover:opacity-80",
                        c.budgetCents === 0
                          ? "border border-line text-mist"
                          : !over && !tight
                            ? "border border-line text-mist"
                            : undefined
                      )}
                      style={
                        c.budgetCents === 0
                          ? undefined
                          : over
                            ? tint("var(--rose)")
                            : tight
                              ? tint("var(--ember)")
                              : undefined
                      }
                    >
                      {c.budgetCents === 0
                        ? "no budget"
                        : over
                          ? `${moneyWhole(c.spentCents - c.budgetCents, code)} OVER`
                          : tight
                            ? `${used}% WATCH`
                            : `${used}%`}
                    </button>

                    {detailId === c.id && (
                      <div
                        onClick={(e) => e.stopPropagation()}
                        className="absolute right-0 top-full z-30 mt-2 w-[min(260px,70vw)] border border-linebright bg-raise p-3 text-left shadow-xl shadow-black/60"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <span className="text-[12px] font-semibold text-bone">{c.name}</span>
                          <button
                            onClick={() => setDetailId(null)}
                            aria-label="Close details"
                            className="text-mist transition-colors hover:text-bone"
                          >
                            <X size={12} />
                          </button>
                        </div>
                        <dl className="tabular mt-2 space-y-1 font-mono text-[10.5px] text-fog">
                          <div className="flex justify-between gap-3">
                            <dt className="text-mist">Spent</dt>
                            <dd>{moneyWhole(c.spentCents, code)}</dd>
                          </div>
                          <div className="flex justify-between gap-3">
                            <dt className="text-mist">Budget</dt>
                            <dd>{moneyWhole(c.budgetCents, code)}</dd>
                          </div>
                          <div className="flex justify-between gap-3">
                            <dt className="text-mist">{over ? "Over by" : "Still left"}</dt>
                            <dd className={over ? "text-rose" : "text-lime"}>
                              {moneyWhole(Math.abs(c.budgetCents - c.spentCents), code)}
                            </dd>
                          </div>
                          <div className="flex justify-between gap-3">
                            <dt className="text-mist">Entries</dt>
                            <dd>{c.txCount}</dd>
                          </div>
                        </dl>
                        <p className="mt-2 text-[10px] leading-relaxed text-mist">
                          Your list below is now filtered to {c.name}.
                        </p>
                        <button
                          onClick={() => {
                            setDetailId(null);
                            startEdit(c);
                          }}
                          className="mt-2.5 w-full bg-lime px-3 py-1.5 text-[10.5px] font-semibold text-limedark"
                        >
                          Adjust envelope
                        </button>
                      </div>
                    )}
                  </span>
                </p>

                <div className="mt-2 h-[8px] w-full overflow-hidden rounded-[4px] bg-bone/[0.06]">
                  <motion.div
                    className="h-full rounded-[4px]"
                    style={{ backgroundColor: over ? "var(--rose)" : tight ? "var(--ember)" : toneVar(c.icon) }}
                    initial={false}
                    animate={{ width: `${Math.min(used, 100)}%` }}
                    transition={{ type: "spring", stiffness: 90, damping: 20 }}
                  />
                </div>

                <div className="mt-2 flex justify-end">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onRevealInLedger(c.id);
                    }}
                    title={`Show the ${c.txCount} ${c.txCount === 1 ? "entry" : "entries"} in ${c.name}`}
                    className="tabular rounded-full border border-line px-2 py-0.5 text-[12px] text-mist transition-colors hover:border-lime hover:text-lime"
                  >
                    {c.txCount} {c.txCount === 1 ? "entry" : "entries"}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <button
        onClick={onAddCategory}
        className="mt-3 flex w-full items-center justify-center gap-2 border border-dashed border-linebright py-2.5 text-[11.5px] text-mist transition-colors hover:border-lime hover:text-lime"
      >
        + Add a new category
      </button>

      <div className="mt-4 flex flex-wrap items-center gap-x-2.5 gap-y-2 border-t border-line/60 pt-3 text-[10.5px] text-mist">
        <span className="font-medium text-fog">What the labels mean:</span>
        <span
          className="inline-flex items-center gap-1.5 px-2 py-0.5 text-[10px] font-medium"
          style={tint("var(--rose)")}
        >
          <span className="size-1.5 rounded-full bg-rose" />
          red = over budget
        </span>
        <span
          className="inline-flex items-center gap-1.5 px-2 py-0.5 text-[10px] font-medium"
          style={tint("var(--ember)")}
        >
          <span className="size-1.5 rounded-full bg-ember" />
          amber = nearly gone (70%+)
        </span>
        <span className="inline-flex items-center gap-1.5 border border-line px-2 py-0.5 text-[10px] text-mist">
          <span className="size-1.5 rounded-full border border-mist" />
          grey = on track
        </span>
      </div>
    </Panel>
  );
}
