"use client";

import { useMemo, useState } from "react";
import { History, Landmark, Plus, Trash2, X } from "lucide-react";
import { Panel, CardHead } from "./card";
import { moneyWhole, parseDollarsToCents } from "@/lib/format";
import { symbolFor } from "@/lib/currencies";
import { useCurrency } from "@/lib/currency-context";
import type { NetWorthItemDTO, NetWorthSnapshotDTO } from "@/lib/types";
import { cn } from "@/lib/utils";

interface NetWorthCardProps {
  items: NetWorthItemDTO[];
  history: NetWorthSnapshotDTO[];
  onAdd: (item: Omit<NetWorthItemDTO, "id">) => void;
  onUpdate: (id: number, amountCents: number) => void;
  onDelete: (id: number) => void;
  onRecordSnapshot: (assets: number, liabilities: number) => void;
  className?: string;
}

export function NetWorthCard({
  items,
  history,
  onAdd,
  onUpdate,
  onDelete,
  onRecordSnapshot,
  className,
}: NetWorthCardProps) {
  const { code } = useCurrency();
  const [adding, setAdding] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [type, setType] = useState<"asset" | "liability">("asset");
  const [editId, setEditId] = useState<number | null>(null);
  const [editDraft, setEditDraft] = useState("");

  const assets = items.filter((i) => i.type === "asset");
  const liabilities = items.filter((i) => i.type === "liability");
  const totalAssets = assets.reduce((s, i) => s + i.amountCents, 0);
  const totalLiabilities = liabilities.reduce((s, i) => s + i.amountCents, 0);
  const netWorth = totalAssets - totalLiabilities;

  const reset = () => {
    setAdding(false);
    setName("");
    setAmount("");
    setType("asset");
  };

  const submit = () => {
    if (!name.trim()) return;
    const cents = parseDollarsToCents(amount);
    if (cents === null) return;
    onAdd({ name: name.trim().slice(0, 40), amountCents: cents, type });
    reset();
  };

  const commitEdit = (item: NetWorthItemDTO) => {
    const cents = parseDollarsToCents(editDraft);
    if (cents !== null && cents !== item.amountCents) onUpdate(item.id, cents);
    setEditId(null);
  };

  const renderList = (
    list: NetWorthItemDTO[],
    label: string,
    total: number,
    color: string
  ) => (
    <div>
      <div className="flex items-baseline justify-between">
        <span className="text-[11px] font-medium text-fog">{label}</span>
        <span className={cn("tabular font-mono text-[13px] font-semibold", color)}>
          {moneyWhole(total, code)}
        </span>
      </div>
      {list.length === 0 ? (
        <p className="mt-2 text-[11px] text-mist">None added yet.</p>
      ) : (
        <div className="mt-2 space-y-1">
          {list.map((item) => (
            <div
              key={item.id}
              className="flex items-center gap-2 border-b border-line/40 py-1.5 last:border-0"
            >
              <span className="min-w-0 flex-1 truncate text-[12px] text-bone">
                {item.name}
              </span>
              {editId === item.id ? (
                <input
                  autoFocus
                  value={editDraft}
                  onChange={(e) => setEditDraft(e.target.value)}
                  onBlur={() => commitEdit(item)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") commitEdit(item);
                    if (e.key === "Escape") setEditId(null);
                  }}
                  className="tabular w-24 border-b border-lime bg-transparent pb-0.5 text-right font-mono text-[12px] text-lime outline-none"
                />
              ) : (
                <button
                  onClick={() => {
                    setEditId(item.id);
                    setEditDraft((item.amountCents / 100).toString());
                  }}
                  className="tabular font-mono text-[12px] text-fog underline decoration-dotted decoration-mist underline-offset-2 hover:text-lime"
                >
                  {moneyWhole(item.amountCents, code)}
                </button>
              )}
              <button
                onClick={() => {
                  if (window.confirm(`Remove "${item.name}"?`)) onDelete(item.id);
                }}
                className="p-0.5 text-mist hover:text-rose"
              >
                <Trash2 size={12} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <Panel className={className}>
      <CardHead
        title="Net worth"
        hint="Everything you own minus everything you owe — the number that matters long-term."
        help="Add bank balances, property and investments as assets. Add mortgage, loans and credit cards as liabilities. Tap amounts to edit. Use 'Record snapshot' to save the current totals to your history."
        right={
          <div className="flex gap-2">
            <button
              onClick={() => setShowHistory(!showHistory)}
              className={cn(
                "flex items-center gap-1.5 border border-line px-2 py-1 transition-colors hover:border-lime hover:text-lime",
                showHistory && "border-lime text-lime"
              )}
            >
              <History size={13} />
              {showHistory ? "Hide history" : "History"}
            </button>
            <button
              onClick={() => onRecordSnapshot(totalAssets, totalLiabilities)}
              title="Save current totals to history"
              className="flex items-center gap-1.5 border border-lime/50 px-2 py-1 text-lime transition-colors hover:bg-lime/10"
            >
              Record snapshot
            </button>
          </div>
        }
      />

      <div className="text-center">
        <div className="text-[10px] uppercase tracking-[0.18em] text-mist">Total net worth</div>
        <div
          className={cn(
            "tabular mt-1 font-mono text-[28px] font-semibold",
            netWorth >= 0 ? "text-lime" : "text-rose"
          )}
        >
          {netWorth < 0 ? "−" : ""}
          {moneyWhole(Math.abs(netWorth), code)}
        </div>
      </div>

      {showHistory && history.length > 0 && (
        <div className="mt-5 border-y border-line py-4">
          <div className="text-[11px] font-medium text-fog">Net worth history</div>
          <div className="scroll-slim mt-3 max-h-[140px] overflow-y-auto pr-1">
            <table className="w-full text-left">
              <thead>
                <tr className="text-[9px] uppercase tracking-wider text-mist">
                  <th className="pb-1 font-normal">Date</th>
                  <th className="pb-1 text-right font-normal">Assets</th>
                  <th className="pb-1 text-right font-normal">Debt</th>
                  <th className="pb-1 text-right font-normal">Net</th>
                </tr>
              </thead>
              <tbody className="tabular font-mono text-[10.5px]">
                {[...history]
                  .sort((a, b) => b.date.localeCompare(a.date))
                  .map((h, i) => {
                    const nw = h.assetsCents - h.liabilitiesCents;
                    return (
                      <tr key={i} className="border-b border-line/30 last:border-0">
                        <td className="py-1 text-mist">
                          {new Date(h.date).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "2-digit",
                          })}
                        </td>
                        <td className="py-1 text-right text-fog">
                          {moneyWhole(h.assetsCents, code)}
                        </td>
                        <td className="py-1 text-right text-rose/70">
                          {moneyWhole(h.liabilitiesCents, code)}
                        </td>
                        <td
                          className={cn(
                            "py-1 text-right font-semibold",
                            nw >= 0 ? "text-lime" : "text-rose"
                          )}
                        >
                          {moneyWhole(nw, code)}
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        {renderList(assets, "Assets (what you own)", totalAssets, "text-mint")}
        {renderList(liabilities, "Liabilities (what you owe)", totalLiabilities, "text-rose")}
      </div>

      {adding ? (
        <div className="mt-4 space-y-3 border border-linebright bg-raise/40 p-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-fog">Add {type}</span>
            <button onClick={reset} className="text-mist hover:text-bone">
              <X size={13} />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-[2px] border border-linebright p-[2px]">
            {(["asset", "liability"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setType(t)}
                className={cn(
                  "py-1.5 text-[11px] font-medium",
                  type === t
                    ? t === "asset"
                      ? "bg-mint text-ink"
                      : "bg-rose text-white"
                    : "text-mist hover:text-fog"
                )}
              >
                {t === "asset" ? "Asset" : "Liability"}
              </button>
            ))}
          </div>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={
              type === "asset"
                ? "e.g. Savings account, Car, Pension"
                : "e.g. Student loan, Credit card, Mortgage"
            }
            maxLength={40}
            className="w-full border-b border-linebright bg-transparent pb-1 text-[14px] text-bone outline-none placeholder:text-mist/50 focus:border-lime"
          />
          <span className="flex items-baseline gap-1 border-b border-linebright pb-1 focus-within:border-lime">
            <span className="font-mono text-mist">{symbolFor(code)}</span>
            <input
              value={amount}
              onChange={(e) => setAmount(e.target.value.replace(/[^0-9.,]/g, ""))}
              inputMode="decimal"
              placeholder="0.00"
              className="tabular w-full bg-transparent font-mono text-[18px] text-bone outline-none placeholder:text-mist/40"
            />
          </span>
          <button
            onClick={submit}
            className="w-full bg-lime py-2 text-[12px] font-semibold text-limedark"
          >
            Add {type}
          </button>
        </div>
      ) : (
        <button
          onClick={() => setAdding(true)}
          className="mt-4 flex w-full items-center justify-center gap-2 border border-dashed border-linebright py-2.5 text-[11.5px] text-mist hover:border-lime hover:text-lime"
        >
          <Plus size={13} /> Add an asset or liability
        </button>
      )}
    </Panel>
  );
}
