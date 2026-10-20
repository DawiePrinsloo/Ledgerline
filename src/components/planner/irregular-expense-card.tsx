"use client";

import { useState } from "react";
import { Plus, Trash2, X } from "lucide-react";
import { Panel, CardHead } from "./card";
import { moneyWhole, parseDollarsToCents } from "@/lib/format";
import { symbolFor } from "@/lib/currencies";
import { useCurrency } from "@/lib/currency-context";

export interface IrregularExpenseDTO {
  id: number;
  name: string;
  annualCents: number;
}

interface IrregularExpenseCardProps {
  items: IrregularExpenseDTO[];
  onAdd: (item: Omit<IrregularExpenseDTO, "id">) => void;
  onDelete: (id: number) => void;
  className?: string;
}

/**
 * Irregular expenses — large annual or infrequent costs broken into a
 * monthly saving amount (annual total ÷ 12). Car insurance, Christmas gifts,
 * annual subscriptions, vet bills, etc.
 */
export function IrregularExpenseCard({
  items,
  onAdd,
  onDelete,
  className,
}: IrregularExpenseCardProps) {
  const { code } = useCurrency();
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");
  const [annual, setAnnual] = useState("");
  const [error, setError] = useState("");

  const reset = () => { setAdding(false); setName(""); setAnnual(""); setError(""); };

  const submit = () => {
    if (!name.trim()) return setError("Name this irregular expense.");
    const annualCents = parseDollarsToCents(annual);
    if (!annualCents) return setError("Enter the total annual or expected cost.");
    onAdd({ name: name.trim().slice(0, 40), annualCents });
    reset();
  };

  const totalAnnual = items.reduce((s, i) => s + i.annualCents, 0);
  const totalMonthly = Math.ceil(totalAnnual / 12);

  return (
    <Panel className={className}>
      <CardHead
        title="Irregular expense planner"
        hint="Large infrequent costs broken down into monthly savings amounts."
        help="Enter the full annual (or expected) cost of things that don't come monthly — car insurance, Christmas, annual subscriptions, home repairs. The monthly column shows how much to set aside each month so you're never caught short."
      />

      {items.length === 0 && !adding ? (
        <p className="py-8 text-center text-[12px] text-mist">
          No irregular expenses added yet. Try: car insurance, Christmas, annual subscriptions, holidays.
        </p>
      ) : (
        <>
          {items.length > 0 && (
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-line text-[10px] uppercase tracking-[0.12em] text-mist">
                  <th className="py-1.5 pr-3 font-normal">Expense</th>
                  <th className="py-1.5 pr-3 text-right font-normal">Annual</th>
                  <th className="py-1.5 text-right font-normal">Monthly saving</th>
                  <th className="py-1.5 w-6" />
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id} className="border-b border-line/40 text-[12.5px]">
                    <td className="py-2 pr-3 text-bone">{item.name}</td>
                    <td className="tabular py-2 pr-3 text-right font-mono text-fog">{moneyWhole(item.annualCents, code)}</td>
                    <td className="tabular py-2 text-right font-mono font-semibold text-lime">{moneyWhole(Math.ceil(item.annualCents / 12), code)}</td>
                    <td className="py-2 pl-2">
                      <button onClick={() => { if (window.confirm(`Remove "${item.name}"?`)) onDelete(item.id); }} className="text-mist hover:text-rose">
                        <Trash2 size={12} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-bone/30 text-[12.5px] font-semibold">
                  <td className="py-2 pr-3 text-bone">Total</td>
                  <td className="tabular py-2 pr-3 text-right font-mono text-fog">{moneyWhole(totalAnnual, code)}</td>
                  <td className="tabular py-2 text-right font-mono text-lime">{moneyWhole(totalMonthly, code)}</td>
                  <td />
                </tr>
              </tfoot>
            </table>
          )}
          <p className="mt-2 text-[10.5px] text-mist">
            Set aside <span className="font-semibold text-lime">{moneyWhole(totalMonthly, code)}/month</span> to cover all irregular expenses — add it as a savings goal to track it.
          </p>
        </>
      )}

      {adding ? (
        <div className="mt-3 space-y-3 border border-linebright bg-raise/40 p-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-fog">Add irregular expense</span>
            <button onClick={reset} className="text-mist hover:text-bone"><X size={13} /></button>
          </div>
          <input value={name} onChange={e=>{ setName(e.target.value); setError(""); }} placeholder="e.g. Car insurance, Christmas, Annual vet" maxLength={40} className="w-full border-b border-linebright bg-transparent pb-1 text-[14px] text-bone outline-none placeholder:text-mist/50 focus:border-lime" />
          <label className="block">
            <span className="text-[10px] text-mist">Total annual / expected cost</span>
            <span className="flex items-baseline gap-1 border-b border-linebright pb-0.5 focus-within:border-lime">
              <span className="font-mono text-mist">{symbolFor(code)}</span>
              <input value={annual} onChange={e=>setAnnual(e.target.value.replace(/[^0-9.,]/g,""))} inputMode="decimal" placeholder="1200" className="tabular w-full bg-transparent font-mono text-[18px] text-bone outline-none placeholder:text-mist/40" />
            </span>
          </label>
          {error && <p className="text-[11px] text-rose">{error}</p>}
          <button onClick={submit} className="w-full bg-lime py-2 text-[12px] font-semibold text-limedark">Add expense</button>
        </div>
      ) : (
        <button onClick={() => setAdding(true)} className="mt-3 flex w-full items-center justify-center gap-2 border border-dashed border-linebright py-2.5 text-[11.5px] text-mist hover:border-lime hover:text-lime">
          <Plus size={13} /> Add an irregular expense
        </button>
      )}
    </Panel>
  );
}
