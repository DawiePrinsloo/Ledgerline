"use client";

import { useMemo } from "react";
import { Panel, CardHead } from "./card";
import { moneyWhole, pct } from "@/lib/format";
import { useCurrency } from "@/lib/currency-context";
import type { BudgetBucket, CategoryDTO } from "@/lib/types";
import { cn } from "@/lib/utils";

const BUCKETS: Array<{ key: BudgetBucket; label: string; target: number; color: string; desc: string }> = [
  { key: "needs", label: "Needs", target: 50, color: "var(--sky)", desc: "Housing, utilities, groceries, transport, health, insurance" },
  { key: "wants", label: "Wants", target: 30, color: "var(--gold)", desc: "Dining, shopping, leisure, subscriptions" },
  { key: "savings", label: "Savings", target: 20, color: "var(--mint)", desc: "Emergency fund, goals, debt payoff, investments" },
];

/** Default bucket assignment based on category names (best-guess). */
function defaultBucket(name: string): BudgetBucket {
  const lower = name.toLowerCase();
  if (/housing|rent|utilities|groceries|transport|health|insurance|medical/.test(lower)) return "needs";
  if (/saving|emergency|debt|invest|goal/.test(lower)) return "savings";
  return "wants";
}

interface BudgetRuleCardProps {
  categories: CategoryDTO[];
  incomeCents: number;
  expenseCents: number;
  bucketMap: Record<number, BudgetBucket>;
  onChangeBucket: (categoryId: number, bucket: BudgetBucket) => void;
  className?: string;
}

export function BudgetRuleCard({
  categories,
  incomeCents,
  expenseCents,
  bucketMap,
  onChangeBucket,
  className,
}: BudgetRuleCardProps) {
  const { code } = useCurrency();

  const analysis = useMemo(() => {
    const totals: Record<BudgetBucket, number> = { needs: 0, wants: 0, savings: 0 };
    for (const c of categories.filter((c) => c.kind === "expense")) {
      const bucket = bucketMap[c.id] ?? defaultBucket(c.name);
      totals[bucket] += c.spentCents;
    }
    // Savings also includes unspent income
    const saved = Math.max(incomeCents - expenseCents, 0);
    totals.savings += saved;
    return { totals, base: incomeCents || expenseCents || 1 };
  }, [categories, incomeCents, expenseCents, bucketMap]);

  return (
    <Panel className={className}>
      <CardHead
        title="50 / 30 / 20 rule"
        hint="A popular guideline: spend 50% on needs, 30% on wants, and save 20%."
        help="Tap a category name to change which bucket it belongs to. The percentages update immediately. This is a guideline, not a rule — adjust to your life."
      />

      {/* bar */}
      <div className="flex h-6 w-full overflow-hidden rounded-[4px]">
        {BUCKETS.map((b) => {
          const p = pct(analysis.totals[b.key], analysis.base);
          return (
            <div
              key={b.key}
              className="flex items-center justify-center text-[10px] font-semibold text-ink transition-all"
              style={{ width: `${Math.max(p, 3)}%`, backgroundColor: b.color }}
              title={`${b.label}: ${p}% (target ${b.target}%)`}
            >
              {p >= 8 ? `${p}%` : ""}
            </div>
          );
        })}
      </div>

      {/* legend */}
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        {BUCKETS.map((b) => {
          const actual = pct(analysis.totals[b.key], analysis.base);
          const diff = actual - b.target;
          return (
            <div key={b.key} className="border border-line bg-coal p-3">
              <div className="flex items-baseline justify-between">
                <span className="text-[12px] font-semibold text-bone">{b.label}</span>
                <span className="tabular font-mono text-[11px]" style={{ color: b.color }}>{actual}%</span>
              </div>
              <div className="tabular mt-1 font-mono text-[11px] text-mist">
                {moneyWhole(analysis.totals[b.key], code)} of {moneyWhole(analysis.base, code)}
              </div>
              <div className={cn("mt-1 text-[10px]", Math.abs(diff) <= 5 ? "text-lime" : diff > 0 ? "text-ember" : "text-sky")}>
                Target {b.target}% · {diff === 0 ? "on target" : diff > 0 ? `${diff}pp over` : `${Math.abs(diff)}pp under`}
              </div>
              <p className="mt-2 text-[10px] text-mist">{b.desc}</p>
            </div>
          );
        })}
      </div>

      {/* category assignment */}
      <div className="mt-4 border-t border-line/60 pt-3">
        <p className="mb-2 text-[10.5px] text-mist">Category → bucket assignment (tap to change):</p>
        <div className="flex flex-wrap gap-1.5">
          {categories.filter(c => c.kind === "expense").map((c) => {
            const bucket = bucketMap[c.id] ?? defaultBucket(c.name);
            const nextMap: Record<BudgetBucket, BudgetBucket> = { needs: "wants", wants: "savings", savings: "needs" };
            const bDef = BUCKETS.find(b => b.key === bucket)!;
            return (
              <button
                key={c.id}
                onClick={() => onChangeBucket(c.id, nextMap[bucket])}
                title={`${c.name} is in "${bDef.label}". Click to move to "${BUCKETS.find(b=>b.key===nextMap[bucket])!.label}".`}
                className="border border-line px-2 py-1 text-[10px] text-fog transition-colors hover:border-lime"
                style={{ borderLeftColor: bDef.color, borderLeftWidth: 3 }}
              >
                {c.name} → <span style={{ color: bDef.color }}>{bDef.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </Panel>
  );
}
