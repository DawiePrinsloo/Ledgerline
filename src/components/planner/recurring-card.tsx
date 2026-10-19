"use client";

import { useState } from "react";
import { Check, Pause, Plus, Repeat, Trash2, X } from "lucide-react";
import { Panel, CardHead } from "./card";
import { moneyWhole, parseDollarsToCents } from "@/lib/format";
import { symbolFor } from "@/lib/currencies";
import { useCurrency } from "@/lib/currency-context";
import type { CategoryDTO, Kind, RecurringDTO } from "@/lib/types";
import { cn } from "@/lib/utils";

interface RecurringCardProps {
  recurring: RecurringDTO[];
  categories: CategoryDTO[];
  onAdd: (r: Omit<RecurringDTO, "id">) => void;
  onToggle: (id: number) => void;
  onDelete: (id: number) => void;
  className?: string;
}

export function RecurringCard({
  recurring,
  categories,
  onAdd,
  onToggle,
  onDelete,
  className,
}: RecurringCardProps) {
  const { code } = useCurrency();
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [kind, setKind] = useState<Kind>("expense");
  const [catId, setCatId] = useState(0);
  const [day, setDay] = useState("1");
  const [error, setError] = useState("");

  const expenseCats = categories.filter((c) => c.kind === "expense");
  const incomeCats = categories.filter((c) => c.kind === "income");

  const reset = () => {
    setAdding(false); setName(""); setAmount(""); setKind("expense");
    setCatId(0); setDay("1"); setError("");
  };

  const submit = () => {
    if (!name.trim()) return setError("Name this recurring entry.");
    const cents = parseDollarsToCents(amount);
    if (cents === null) return setError("Enter an amount.");
    const pool = kind === "expense" ? expenseCats : incomeCats;
    const finalCat = catId || pool[0]?.id;
    if (!finalCat) return setError("Pick a category.");
    const d = Math.max(1, Math.min(31, Math.round(Number(day)) || 1));
    onAdd({ name: name.trim().slice(0, 40), amountCents: cents, kind, categoryId: finalCat, dayOfMonth: d, active: true });
    reset();
  };

  return (
    <Panel className={className}>
      <CardHead
        title="Recurring transactions"
        hint="Subscriptions, rent, salary — things that repeat every month."
        help="Set a recurring entry once and it auto-fills into each new month. Toggle it off to pause without deleting."
      />

      {recurring.length === 0 && !adding && (
        <p className="py-8 text-center text-[12px] text-mist">
          No recurring entries yet. Add subscriptions, rent or salary so they auto-fill each month.
        </p>
      )}

      <div className="space-y-1">
        {recurring.map((r) => {
          const cat = categories.find((c) => c.id === r.categoryId);
          return (
            <div
              key={r.id}
              className={cn("flex items-center gap-3 border-b border-line/40 py-2.5 last:border-0", !r.active && "opacity-40")}
            >
              <Repeat size={13} className="shrink-0 text-mist" />
              <div className="min-w-0 flex-1">
                <div className="truncate text-[13px] text-bone">{r.name}</div>
                <div className="mt-0.5 text-[10px] text-mist">
                  Day {r.dayOfMonth} · {cat?.name ?? "—"} · {r.kind === "income" ? "income" : "expense"}
                </div>
              </div>
              <span className={cn("tabular font-mono text-[12px]", r.kind === "income" ? "text-mint" : "text-fog")}>
                {r.kind === "income" ? "+" : "−"}{moneyWhole(r.amountCents, code)}
              </span>
              <button onClick={() => onToggle(r.id)} title={r.active ? "Pause" : "Resume"} className="p-1 text-mist hover:text-lime">
                {r.active ? <Pause size={13} /> : <Check size={13} />}
              </button>
              <button onClick={() => { if (window.confirm(`Delete "${r.name}"?`)) onDelete(r.id); }} title="Delete" className="p-1 text-mist hover:text-rose">
                <Trash2 size={13} />
              </button>
            </div>
          );
        })}
      </div>

      {adding ? (
        <div className="mt-3 space-y-3 border border-linebright bg-raise/40 p-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-fog">New recurring entry</span>
            <button onClick={reset} className="text-mist hover:text-bone"><X size={13} /></button>
          </div>
          <div className="grid grid-cols-2 gap-[2px] border border-linebright p-[2px]">
            {(["expense","income"] as Kind[]).map(k=>(
              <button key={k} onClick={()=>setKind(k)} className={cn("py-1.5 text-[11px] font-medium",kind===k?(k==="expense"?"bg-lime text-limedark":"bg-mint text-ink"):"text-mist hover:text-fog")}>{k==="expense"?"Spending":"Income"}</button>
            ))}
          </div>
          <input value={name} onChange={e=>{setName(e.target.value);setError("");}} placeholder="e.g. Netflix, Rent, Salary" maxLength={40} className="w-full border-b border-linebright bg-transparent pb-1 text-[14px] text-bone outline-none placeholder:text-mist/50 focus:border-lime" />
          <div className="flex gap-2">
            <span className="flex items-baseline gap-1 border-b border-linebright pb-1 focus-within:border-lime">
              <span className="font-mono text-mist">{symbolFor(code)}</span>
              <input value={amount} onChange={e=>setAmount(e.target.value.replace(/[^0-9.,]/g,""))} inputMode="decimal" placeholder="0.00" className="tabular w-20 bg-transparent font-mono text-[16px] text-bone outline-none placeholder:text-mist/40" />
            </span>
            <span className="flex items-baseline gap-1.5 border-b border-linebright pb-1 focus-within:border-lime">
              <span className="text-[11px] text-mist">Day</span>
              <input type="number" min={1} max={31} value={day} onChange={e=>setDay(e.target.value)} className="tabular w-10 bg-transparent text-center font-mono text-[14px] text-bone outline-none" />
            </span>
          </div>
          <select value={catId||""} onChange={e=>setCatId(Number(e.target.value))} className="w-full border border-line bg-coal px-3 py-2 text-[13px] text-bone outline-none focus:border-lime">
            {(kind==="expense"?expenseCats:incomeCats).map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          {error && <p className="text-[11px] text-rose">{error}</p>}
          <button onClick={submit} className="w-full bg-lime py-2 text-[12px] font-semibold text-limedark">Add recurring</button>
        </div>
      ) : (
        <button onClick={()=>setAdding(true)} className="mt-3 flex w-full items-center justify-center gap-2 border border-dashed border-linebright py-2.5 text-[11.5px] text-mist hover:border-lime hover:text-lime">
          <Plus size={13} /> Add a recurring entry
        </button>
      )}
    </Panel>
  );
}
