"use client";

import { useState } from "react";
import { Plus, Trash2, X } from "lucide-react";
import { Panel, CardHead } from "./card";
import { moneyWhole, parseDollarsToCents, moneyExact } from "@/lib/format";
import { symbolFor } from "@/lib/currencies";
import { useCurrency } from "@/lib/currency-context";
import { cn } from "@/lib/utils";

export interface DebtDTO {
  id: number;
  name: string;
  balanceCents: number;
  interestRate: number; // annual % e.g. 18.5
  minimumPaymentCents: number;
}

interface DebtPayoffCardProps {
  debts: DebtDTO[];
  onAdd: (d: Omit<DebtDTO, "id">) => void;
  onDelete: (id: number) => void;
  className?: string;
}

function calcPayoff(balanceCents: number, annualRate: number, monthlyPaymentCents: number) {
  if (monthlyPaymentCents <= 0) return { months: Infinity, totalInterest: 0 };
  const monthly = annualRate / 100 / 12;
  if (monthly === 0) {
    const months = Math.ceil(balanceCents / monthlyPaymentCents);
    return { months, totalInterest: 0 };
  }
  let bal = balanceCents / 100;
  const pay = monthlyPaymentCents / 100;
  let interest = 0;
  let months = 0;
  while (bal > 0 && months < 600) {
    const int = bal * monthly;
    interest += int;
    bal = bal + int - pay;
    months++;
    if (bal < 0.01) { bal = 0; break; }
  }
  return { months, totalInterest: Math.round(interest * 100) };
}

export function DebtPayoffCard({ debts, onAdd, onDelete, className }: DebtPayoffCardProps) {
  const { code } = useCurrency();
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");
  const [balance, setBalance] = useState("");
  const [rate, setRate] = useState("");
  const [minPay, setMinPay] = useState("");
  const [error, setError] = useState("");

  const reset = () => { setAdding(false); setName(""); setBalance(""); setRate(""); setMinPay(""); setError(""); };

  const submit = () => {
    if (!name.trim()) return setError("Give this debt a name.");
    const bal = parseDollarsToCents(balance); if (!bal) return setError("Enter the current balance.");
    const ir = parseFloat(rate.replace(/[^0-9.]/g, "")); if (!isFinite(ir) || ir < 0) return setError("Enter the annual interest rate (e.g. 18.5).");
    const mp = parseDollarsToCents(minPay) ?? 0;
    onAdd({ name: name.trim().slice(0, 40), balanceCents: bal, interestRate: ir, minimumPaymentCents: mp });
    reset();
  };

  const totalBalance = debts.reduce((s, d) => s + d.balanceCents, 0);

  return (
    <Panel className={className}>
      <CardHead
        title="Debt payoff calculator"
        hint="See how long it will take to pay off each debt at the minimum payment."
        help="Enter the current balance, annual interest rate, and your minimum monthly payment. The calculator shows total months to payoff and total interest paid. Increasing your monthly payment dramatically cuts interest."
      />

      {debts.length === 0 && !adding ? (
        <p className="py-8 text-center text-[12px] text-mist">
          No debts added. Add a credit card, loan or any balance you are paying off.
        </p>
      ) : (
        <>
          {totalBalance > 0 && (
            <div className="mb-4 flex items-baseline justify-between border-b border-line pb-3">
              <span className="text-[12px] text-mist">Total debt balance</span>
              <span className="tabular font-mono text-[17px] font-semibold text-rose">{moneyWhole(totalBalance, code)}</span>
            </div>
          )}

          <div className="space-y-3">
            {debts.map((d) => {
              const minResult = calcPayoff(d.balanceCents, d.interestRate, d.minimumPaymentCents);
              const dblResult = calcPayoff(d.balanceCents, d.interestRate, d.minimumPaymentCents * 2);
              return (
                <div key={d.id} className="border border-line bg-coal p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="text-[13.5px] font-semibold text-bone">{d.name}</div>
                      <div className="mt-0.5 text-[11px] text-mist">
                        Balance {moneyWhole(d.balanceCents, code)} · {d.interestRate}% p.a. · Min {moneyWhole(d.minimumPaymentCents, code)}/mo
                      </div>
                    </div>
                    <button onClick={() => { if (window.confirm(`Remove "${d.name}"?`)) onDelete(d.id); }} className="shrink-0 p-1 text-mist hover:text-rose">
                      <Trash2 size={13} />
                    </button>
                  </div>

                  <div className="mt-3 grid gap-2 sm:grid-cols-2">
                    <div className="border border-rose/30 bg-rose/5 px-3 py-2">
                      <div className="text-[9px] uppercase tracking-[0.14em] text-rose/80">At minimum payment</div>
                      <div className="tabular mt-1 font-mono text-[13px] text-bone">
                        {minResult.months >= 600 ? "Never paid off" : `${minResult.months} months`}
                      </div>
                      <div className="tabular mt-0.5 text-[10.5px] text-mist">
                        {minResult.months < 600 ? `${moneyExact(minResult.totalInterest, code)} interest` : "Increase payment"}
                      </div>
                    </div>
                    <div className="border border-lime/30 bg-lime/5 px-3 py-2">
                      <div className="text-[9px] uppercase tracking-[0.14em] text-lime/80">At 2× minimum</div>
                      <div className="tabular mt-1 font-mono text-[13px] text-bone">
                        {dblResult.months >= 600 ? "Still slow" : `${dblResult.months} months`}
                      </div>
                      <div className="tabular mt-0.5 text-[10.5px] text-mist">
                        {dblResult.months < 600 ? `${moneyExact(dblResult.totalInterest, code)} interest` : ""}
                        {minResult.months < 600 && dblResult.months < 600
                          ? ` · saves ${moneyWhole(minResult.totalInterest - dblResult.totalInterest, code)}`
                          : ""}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {adding ? (
        <div className="mt-3 space-y-3 border border-linebright bg-raise/40 p-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-fog">Add a debt</span>
            <button onClick={reset} className="text-mist hover:text-bone"><X size={13} /></button>
          </div>
          <input value={name} onChange={e=>{ setName(e.target.value); setError(""); }} placeholder="e.g. Credit card, Student loan" maxLength={40} className="w-full border-b border-linebright bg-transparent pb-1 text-[14px] text-bone outline-none placeholder:text-mist/50 focus:border-lime" />
          <div className="grid grid-cols-3 gap-2">
            <label className="block">
              <span className="text-[10px] text-mist">Balance</span>
              <span className="flex items-baseline gap-0.5 border-b border-linebright pb-0.5 focus-within:border-lime">
                <span className="font-mono text-sm text-mist">{symbolFor(code)}</span>
                <input value={balance} onChange={e=>setBalance(e.target.value.replace(/[^0-9.,]/g,""))} inputMode="decimal" placeholder="5000" className="tabular w-full bg-transparent font-mono text-[15px] text-bone outline-none placeholder:text-mist/40" />
              </span>
            </label>
            <label className="block">
              <span className="text-[10px] text-mist">Rate % p.a.</span>
              <input value={rate} onChange={e=>setRate(e.target.value.replace(/[^0-9.]/g,""))} inputMode="decimal" placeholder="18.5" className="tabular mt-0.5 w-full border-b border-linebright bg-transparent pb-0.5 font-mono text-[15px] text-bone outline-none placeholder:text-mist/40 focus:border-lime" />
            </label>
            <label className="block">
              <span className="text-[10px] text-mist">Min /month</span>
              <span className="flex items-baseline gap-0.5 border-b border-linebright pb-0.5 focus-within:border-lime">
                <span className="font-mono text-sm text-mist">{symbolFor(code)}</span>
                <input value={minPay} onChange={e=>setMinPay(e.target.value.replace(/[^0-9.,]/g,""))} inputMode="decimal" placeholder="150" className="tabular w-full bg-transparent font-mono text-[15px] text-bone outline-none placeholder:text-mist/40" />
              </span>
            </label>
          </div>
          {error && <p className="text-[11px] text-rose">{error}</p>}
          <button onClick={submit} className="w-full bg-lime py-2 text-[12px] font-semibold text-limedark">Add debt</button>
        </div>
      ) : (
        <button onClick={() => setAdding(true)} className="mt-3 flex w-full items-center justify-center gap-2 border border-dashed border-linebright py-2.5 text-[11.5px] text-mist hover:border-lime hover:text-lime">
          <Plus size={13} /> Add a debt
        </button>
      )}
    </Panel>
  );
}
