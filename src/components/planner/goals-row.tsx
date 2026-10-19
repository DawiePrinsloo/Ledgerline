"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Check, Minus, Plus, X } from "lucide-react";
import { Panel } from "./card";
import { SectionTitle } from "./section-title";
import { iconFor } from "@/lib/icons";
import { moneyWhole, parseDollarsToCents, pct } from "@/lib/format";
import { toneVar } from "@/lib/themes";
import { useCurrency } from "@/lib/currency-context";
import type { GoalDTO } from "@/lib/types";
import { cn } from "@/lib/utils";

const R = 30;
const C = 2 * Math.PI * R;
type AdjustmentMode = "add" | "remove";

interface GoalsRowProps {
  goals: GoalDTO[];
  onFund: (goalId: number, addCents: number) => void;
  onAdd: () => void;
  onEdit: (goal: GoalDTO) => void;
  onDelete: (goalId: number) => void;
  className?: string;
}

export function GoalsRow({ goals, onFund, onAdd, onEdit, onDelete, className }: GoalsRowProps) {
  const { code } = useCurrency();
  const quickAmounts = [2500, 10000];
  const [customId, setCustomId] = useState<number | null>(null);
  const [customDraft, setCustomDraft] = useState("");
  const [customMode, setCustomMode] = useState<AdjustmentMode>("add");

  const openCustom = (goalId: number, mode: AdjustmentMode) => {
    setCustomId(goalId);
    setCustomMode(mode);
    setCustomDraft("");
  };

  const closeCustom = () => {
    setCustomId(null);
    setCustomDraft("");
  };

  const commitCustom = (goalId: number) => {
    // Always parse a positive number. The visible Add / Take out control
    // applies the direction, so a mobile keyboard never needs a minus key.
    const amount = parseDollarsToCents(customDraft);
    if (amount !== null) {
      onFund(goalId, customMode === "remove" ? -amount : amount);
    }
    closeCustom();
  };

  return (
    <div className={className}>
      <div className="mb-3 flex items-center justify-between gap-3">
        <SectionTitle
          title="Things you are saving for"
          help="Put money aside towards a goal. The ring fills up as you get closer to the target."
        />
        <button
          onClick={onAdd}
          className="shrink-0 rounded-full bg-lime px-3 py-2 text-[11px] font-semibold text-limedark transition-transform hover:-translate-y-0.5"
        >
          + New goal
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {goals.map((g) => {
          const p = Math.min(pct(g.savedCents, g.targetCents), 100);
          const funded = g.savedCents >= g.targetCents;
          const editing = customId === g.id;
          const Icon = iconFor(g.icon);

          return (
            <Panel
              key={g.id}
              className="group transition-colors duration-300 hover:border-linebright"
            >
              <div className="flex items-center gap-4">
                <div className="relative size-[72px] shrink-0">
                  <svg viewBox="0 0 72 72" className="size-full -rotate-90">
                    <circle
                      cx="36"
                      cy="36"
                      r={R}
                      fill="none"
                      stroke="var(--track)"
                      strokeWidth="6"
                    />
                    <motion.circle
                      cx="36"
                      cy="36"
                      r={R}
                      fill="none"
                      stroke={toneVar(g.icon)}
                      strokeWidth="6"
                      strokeLinecap="butt"
                      strokeDasharray={C}
                      initial={false}
                      animate={{ strokeDashoffset: C * (1 - p / 100) }}
                      transition={{ type: "spring", stiffness: 60, damping: 16 }}
                    />
                  </svg>
                  <span
                    aria-hidden="true"
                    className="tabular absolute inset-0 flex items-center justify-center font-mono text-[12px] text-bone"
                  >
                    {p}%
                  </span>
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <Icon size={13} style={{ color: toneVar(g.icon) }} />
                    <h4 className="truncate font-display text-[19px] tracking-tight text-bone">
                      {g.name}
                    </h4>
                  </div>
                  <div className="mt-1 font-mono text-[8.5px] tracking-[0.3em] text-mist">
                    {g.targetLabel ?? "SAVINGS GOAL"}
                  </div>
                  <div className="tabular mt-2 font-mono text-[11px] text-fog">
                    <span className="text-bone">{moneyWhole(g.savedCents, code)}</span>
                    <span className="text-mist"> of {moneyWhole(g.targetCents, code)}</span>
                  </div>
                  <div className="mt-1 text-[10.5px] text-mist">
                    <span className="font-medium text-fog">{p}% saved</span> towards{" "}
                    {g.name}
                  </div>
                </div>
              </div>

              <div className="mb-2 flex justify-end">
                <button
                  onClick={() => onEdit(g)}
                  className="text-[10px] text-mist/60 underline decoration-dotted underline-offset-2 hover:text-lime"
                >
                  Edit
                </button>
              </div>
            <div className="mt-0">
                {editing ? (
                  <div className="border border-linebright bg-raise/40 p-3">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-[11px] font-medium text-fog">
                        What do you want to do?
                      </span>
                      <button
                        onClick={closeCustom}
                        aria-label="Cancel this adjustment"
                        title="Cancel"
                        className="p-1 text-mist transition-colors hover:text-bone"
                      >
                        <X size={13} />
                      </button>
                    </div>

                    <div
                      className="mt-2 grid grid-cols-2 gap-[2px] border border-linebright p-[2px]"
                      role="radiogroup"
                      aria-label="Savings adjustment type"
                    >
                      <button
                        role="radio"
                        aria-checked={customMode === "add"}
                        disabled={funded}
                        onClick={() => setCustomMode("add")}
                        title={funded ? "This goal is already fully saved" : "Add money to this goal"}
                        className={cn(
                          "flex items-center justify-center gap-1.5 px-3 py-2 text-[11px] font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-35",
                          customMode === "add" && !funded
                            ? "bg-lime text-limedark"
                            : "text-mist hover:text-fog"
                        )}
                      >
                        <Plus size={12} /> Add
                      </button>
                      <button
                        role="radio"
                        aria-checked={customMode === "remove"}
                        disabled={g.savedCents === 0}
                        onClick={() => setCustomMode("remove")}
                        title="Take money back out of this goal"
                        className={cn(
                          "flex items-center justify-center gap-1.5 px-3 py-2 text-[11px] font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-35",
                          customMode === "remove"
                            ? "bg-ember text-ink"
                            : "text-mist hover:text-fog"
                        )}
                      >
                        <Minus size={12} /> Take out
                      </button>
                    </div>

                    <label className="mt-3 block">
                      <span className="text-[11px] text-fog">
                        {customMode === "remove" ? "How much should come out?" : "How much should be added?"}
                      </span>
                      <div className="mt-1.5 flex items-center gap-2">
                        <input
                          autoFocus
                          value={customDraft}
                          inputMode="decimal"
                          placeholder="0.00"
                          aria-label={
                            customMode === "remove"
                              ? "Amount to take out"
                              : "Amount to add"
                          }
                          onChange={(e) =>
                            setCustomDraft(e.target.value.replace(/[^0-9.,]/g, ""))
                          }
                          onKeyDown={(e) => {
                            if (e.key === "Enter") commitCustom(g.id);
                            if (e.key === "Escape") closeCustom();
                          }}
                          className="tabular min-w-0 flex-1 border-b border-lime bg-transparent pb-1 font-mono text-[15px] text-bone outline-none placeholder:text-mist/40"
                        />
                        <button
                          onClick={() => commitCustom(g.id)}
                          disabled={parseDollarsToCents(customDraft) === null}
                          className={cn(
                            "shrink-0 px-4 py-2 text-[11px] font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-35",
                            customMode === "remove"
                              ? "bg-ember text-ink"
                              : "bg-lime text-limedark"
                          )}
                        >
                          {customMode === "remove" ? "Take out" : "Add money"}
                        </button>
                      </div>
                    </label>

                    <p className="mt-2 text-[10.5px] leading-relaxed text-mist">
                      Type numbers only — no minus sign needed. You can undo the
                      change from the message shown afterwards.
                    </p>
                  </div>
                ) : funded ? (
                  <div className="flex w-full flex-wrap items-center gap-2">
                    <span className="flex items-center gap-2 border border-lime/50 px-3.5 py-2 text-[11px] font-medium text-lime">
                      <Check size={12} /> Fully saved — well done
                    </span>
                    <span className="ml-auto flex flex-wrap items-center justify-end gap-1.5">
                      {quickAmounts.map((amt) => (
                        <button
                          key={amt}
                          onClick={() => onFund(g.id, -amt)}
                          title={`Take ${moneyWhole(amt, code)} back out of this goal`}
                          className="border border-line px-3 py-1.5 font-mono text-[10px] tracking-[0.12em] text-fog transition-colors hover:border-ember hover:text-ember"
                        >
                          −{moneyWhole(amt, code)}
                        </button>
                      ))}
                      <button
                        onClick={() => openCustom(g.id, "remove")}
                        title="Take out a different amount — useful if you added too much by accident"
                        className="border border-line px-3 py-1.5 text-[10.5px] font-medium text-fog transition-colors hover:border-ember hover:text-ember"
                      >
                        Take out…
                      </button>
                    </span>
                  </div>
                ) : (
                  <div className="flex flex-wrap items-center gap-2">
                    {quickAmounts.map((amt) => (
                      <button
                        key={amt}
                        onClick={() => onFund(g.id, amt)}
                        className="border border-line px-3.5 py-2 font-mono text-[10px] tracking-[0.15em] text-fog transition-colors hover:border-lime hover:text-lime"
                      >
                        +{moneyWhole(amt, code)}
                      </button>
                    ))}
                    <button
                      onClick={() => openCustom(g.id, "add")}
                      title="Add any amount, or switch to Take out to correct a mistake"
                      className="border border-line px-3.5 py-2 text-[10.5px] font-medium text-fog transition-colors hover:border-lime hover:text-lime"
                    >
                      Add / take out…
                    </button>
                    <span className="tabular ml-auto text-[10.5px] text-mist">
                      {moneyWhole(g.targetCents - g.savedCents, code)} to go
                    </span>
                  </div>
                )}
              </div>
            </Panel>
          );
        })}
      </div>
    </div>
  );
}
