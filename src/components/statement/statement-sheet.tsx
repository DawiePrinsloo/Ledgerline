import { iconFor } from "@/lib/icons";
import { moneyWhole, moneyExact, pct } from "@/lib/format";
import { monthLabel, daysInMonth, monthShort } from "@/lib/months";
import { toneVar } from "@/lib/themes";
import type { PlannerData } from "@/lib/types";

interface StatementSheetProps {
  data: PlannerData;
  code: string;
  today: string;
}

/** A single-page, print-ready financial statement. Server component. */
export function StatementSheet({ data, code, today }: StatementSheetProps) {
  const income = data.incomeCents;
  const spent = data.expenseCents;
  const cashLeft = income - spent;
  const envelopes = data.categories
    .filter((c) => c.kind === "expense")
    .sort((a, b) => b.spentCents - a.spentCents);
  const budgetTotal = envelopes.reduce((s, c) => s + c.budgetCents, 0);
  const envelopeLeft = budgetTotal - spent;

  const isCurrent = data.month === today.slice(0, 7);
  const totalDays = daysInMonth(data.month);
  const elapsed = isCurrent ? Number(today.slice(8, 10)) : totalDays;

  // daily series for the rhythm strip
  const spendByDay = new Array<number>(totalDays + 1).fill(0);
  const incomeDays = new Set<number>();
  for (const t of data.transactions) {
    const d = Number(t.date.slice(8, 10));
    if (t.kind === "expense") spendByDay[d] += t.amountCents;
    else incomeDays.add(d);
  }
  const days = Array.from({ length: elapsed }, (_, i) => i + 1);
  const maxDay = Math.max(...days.map((d) => spendByDay[d]), 1);
  const avgDay = days.length > 0 ? spent / days.length : 0;
  const peakDay = days.reduce((best, d) => (spendByDay[d] > spendByDay[best] ? d : best), 1);
  const restDays = days.filter((d) => spendByDay[d] === 0).length;

  const savedTotal = data.goals.reduce((s, g) => s + g.savedCents, 0);
  const targetTotal = data.goals.reduce((s, g) => s + g.targetCents, 0);

  const figures = [
    { label: "MONEY IN", value: income, note: `from ${data.transactions.filter((t) => t.kind === "income").length} payments received` },
    { label: "MONEY SPENT", value: spent, note: `across ${data.transactions.filter((t) => t.kind === "expense").length} entries` },
    { label: "MONEY LEFT", value: cashLeft, note: income > 0 ? `${pct(Math.max(cashLeft, 0), income)}% of what you earned` : "—" },
    { label: "BUDGET LEFT", value: envelopeLeft, note: `of ${moneyWhole(budgetTotal, code)} planned` },
  ];

  return (
    <article className="statement-sheet mx-auto w-full max-w-[210mm] bg-white px-5 py-7 shadow-[0_18px_60px_rgba(0,0,0,0.35)] sm:px-8 md:px-10 md:py-9 print:shadow-none">
      {/* masthead */}
      <header className="statement-block flex flex-col gap-3 border-b-2 border-[#1d1917] pb-4 sm:flex-row sm:items-end sm:justify-between sm:gap-6">
        <div>
          <div className="font-mono text-[8.5px] tracking-[0.42em] text-[#6b625c]">
            LEDGERLINE® — PERSONAL LEDGER
          </div>
          <h1 className="mt-2 font-display text-[34px] leading-[0.95] tracking-tight text-[#1d1917]">
            Mindful Financial Statement
          </h1>
        </div>
        <div className="shrink-0 text-left sm:text-right">
          <div className="font-display text-[19px] leading-none text-[#1d1917]">
            {monthLabel(data.month)}
          </div>
          <div className="mt-1.5 font-mono text-[8px] tracking-[0.22em] text-[#6b625c]">
            {isCurrent ? `THROUGH DAY ${elapsed} OF ${totalDays}` : `FULL MONTH · ${totalDays} DAYS`}
          </div>
          <div className="mt-0.5 font-mono text-[8px] tracking-[0.22em] text-[#6b625c]">
            CURRENCY {code}
          </div>
        </div>
      </header>

      {/* headline figures */}
      <section className="statement-block statement-figures mt-5 grid grid-cols-2 gap-px bg-[rgba(44,37,35,0.14)] sm:grid-cols-4">
        {figures.map((f) => (
          <div key={f.label} className="bg-white px-3 py-3.5">
            <div className="font-mono text-[7.5px] tracking-[0.26em] text-[#6b625c]">{f.label}</div>
            <div
              className="tabular mt-2 font-mono text-[17px] leading-none"
              style={{ color: f.value < 0 ? "#b4442c" : "#1d1917" }}
            >
              {moneyWhole(f.value, code)}
            </div>
            <div className="mt-1.5 font-mono text-[7.5px] tracking-[0.14em] text-[#8c827b]">
              {f.note}
            </div>
          </div>
        ))}
      </section>
      <p className="mt-2 font-mono text-[7px] tracking-[0.16em] text-[#8c827b]">
        Money in − money spent = money left. Budget left = all category budgets added together, minus money spent.
      </p>

      {/* rhythm strip */}
      <section className="statement-block mt-5">
        <div className="flex items-baseline justify-between">
          <h2 className="font-mono text-[8.5px] tracking-[0.3em] text-[#6b625c]">WHAT YOU SPENT EACH DAY</h2>
          <span className="tabular font-mono text-[8px] tracking-[0.16em] text-[#8c827b]">
            average {moneyWhole(avgDay, code)} a day · biggest day {monthShort(data.month)} {peakDay} · {restDays} days with no spending
          </span>
        </div>
        <svg viewBox={`0 0 ${totalDays * 10} 112`} className="mt-2 block h-[66px] w-full" preserveAspectRatio="none">
          <line x1="0" x2={totalDays * 10} y1="100" y2="100" stroke="rgba(44,37,35,0.3)" strokeWidth="1" />
          {[0.5].map((f) => (
            <line
              key={f}
              x1="0"
              x2={totalDays * 10}
              y1={100 - f * 92}
              y2={100 - f * 92}
              stroke="rgba(44,37,35,0.12)"
              strokeWidth="1"
              strokeDasharray="2 4"
            />
          ))}
          {days.map((d) => {
            const v = spendByDay[d];
            const h = v > 0 ? Math.max((v / maxDay) * 92, 2) : 1.5;
            return (
              <rect
                key={d}
                x={(d - 1) * 10 + 2}
                y={100 - h}
                width="6"
                height={h}
                fill={v > 0 ? "#4f7357" : "rgba(44,37,35,0.2)"}
                fillOpacity={v > 0 ? 0.35 + (v / maxDay) * 0.65 : 1}
              />
            );
          })}
          {[...incomeDays].map((d) => (
            <rect
              key={`i-${d}`}
              x={(d - 1) * 10 + 3.5}
              y="104"
              width="3.5"
              height="3.5"
              fill="#3f7a53"
              transform={`rotate(45 ${(d - 1) * 10 + 5.25} 105.75)`}
            />
          ))}
        </svg>
        <div className="mt-1 flex justify-between font-mono text-[7px] tracking-[0.2em] text-[#8c827b]">
          <span>{monthShort(data.month)} 01</span>
          <span>■ money spent&nbsp;&nbsp;·&nbsp;&nbsp;◆ money received</span>
          <span>
            {monthShort(data.month)} {elapsed}
          </span>
        </div>
      </section>

      {/* envelopes */}
      <section className="statement-block mt-5">
        <h2 className="font-mono text-[8.5px] tracking-[0.3em] text-[#6b625c]">
          SPENDING BY CATEGORY — {envelopes.length} CATEGORIES
        </h2>
        <table className="mt-2.5 w-full border-collapse">
          <thead>
            <tr className="border-y border-[rgba(44,37,35,0.18)] font-mono text-[7.5px] tracking-[0.2em] text-[#8c827b]">
              <th className="py-1.5 text-left font-normal">CATEGORY</th>
              <th className="py-1.5 text-right font-normal">SPENT</th>
              <th className="py-1.5 text-right font-normal">PLANNED</th>
              <th className="w-[86px] py-1.5 text-right font-normal">USED</th>
              <th className="py-1.5 text-right font-normal">LEFT</th>
            </tr>
          </thead>
          <tbody>
            {envelopes.map((c) => {
              const used = pct(c.spentCents, c.budgetCents);
              const rem = c.budgetCents - c.spentCents;
              const over = rem < 0;
              const Icon = iconFor(c.icon);
              return (
                <tr key={c.id} className="border-b border-[rgba(44,37,35,0.09)]">
                  <td className="py-[5px]">
                    <span className="flex items-center gap-2">
                      <Icon size={10} style={{ color: toneVar(c.icon) }} />
                      <span className="text-[10.5px] text-[#1d1917]">{c.name}</span>
                      <span className="font-mono text-[7px] tracking-[0.14em] text-[#a39a93]">
                        {c.txCount}×
                      </span>
                    </span>
                  </td>
                  <td className="tabular py-[5px] text-right font-mono text-[10px] text-[#1d1917]">
                    {moneyWhole(c.spentCents, code)}
                  </td>
                  <td className="tabular py-[5px] text-right font-mono text-[10px] text-[#6b625c]">
                    {moneyWhole(c.budgetCents, code)}
                  </td>
                  <td className="py-[5px] pl-3">
                    <span className="flex items-center gap-1.5">
                      <span className="h-[4px] flex-1 bg-[rgba(44,37,35,0.1)]">
                        <span
                          className="block h-full"
                          style={{
                            width: `${Math.min(used, 100)}%`,
                            backgroundColor: over ? "#b4442c" : toneVar(c.icon),
                          }}
                        />
                      </span>
                      <span className="tabular w-7 text-right font-mono text-[8px] text-[#6b625c]">
                        {used}%
                      </span>
                    </span>
                  </td>
                  <td
                    className="tabular py-[5px] text-right font-mono text-[10px]"
                    style={{ color: over ? "#b4442c" : "#1d1917" }}
                  >
                    {over ? `(${moneyWhole(-rem, code)})` : moneyWhole(rem, code)}
                  </td>
                </tr>
              );
            })}
            <tr className="border-t-2 border-[#1d1917] font-mono">
              <td className="py-2 text-[9px] tracking-[0.2em] text-[#1d1917]">TOTAL</td>
              <td className="tabular py-2 text-right text-[11px] text-[#1d1917]">
                {moneyExact(spent, code)}
              </td>
              <td className="tabular py-2 text-right text-[11px] text-[#6b625c]">
                {moneyExact(budgetTotal, code)}
              </td>
              <td className="tabular py-2 pr-1 text-right text-[9px] text-[#6b625c]">
                {budgetTotal > 0 ? `${pct(Math.min(spent, budgetTotal), budgetTotal)}%` : "—"}
              </td>
              <td
                className="tabular py-2 text-right text-[11px]"
                style={{ color: envelopeLeft < 0 ? "#b4442c" : "#1d1917" }}
              >
                {envelopeLeft < 0
                  ? `(${moneyExact(-envelopeLeft, code)})`
                  : moneyExact(envelopeLeft, code)}
              </td>
            </tr>
          </tbody>
        </table>
      </section>

      {/* goals */}
      {data.goals.length > 0 && (
        <section className="statement-block mt-5">
          <div className="flex items-baseline justify-between">
            <h2 className="font-mono text-[8.5px] tracking-[0.3em] text-[#6b625c]">THINGS YOU ARE SAVING FOR</h2>
            <span className="tabular font-mono text-[8px] tracking-[0.16em] text-[#8c827b]">
              {moneyWhole(savedTotal, code)} OF {moneyWhole(targetTotal, code)} ·{" "}
              {pct(savedTotal, targetTotal)}% saved so far
            </span>
          </div>
          <div className="statement-goals mt-2.5 grid grid-cols-1 gap-3 sm:grid-cols-3">
            {data.goals.map((g) => {
              const p = Math.min(pct(g.savedCents, g.targetCents), 100);
              return (
                <div key={g.id} className="border border-[rgba(44,37,35,0.16)] px-3 py-2.5">
                  <div className="truncate text-[10.5px] text-[#1d1917]">{g.name}</div>
                  <div className="mt-2 h-[4px] bg-[rgba(44,37,35,0.1)]">
                    <div
                      className="h-full"
                      style={{ width: `${p}%`, backgroundColor: toneVar(g.icon) }}
                    />
                  </div>
                  <div className="tabular mt-1.5 flex justify-between font-mono text-[8px] text-[#6b625c]">
                    <span>
                      {moneyWhole(g.savedCents, code)} / {moneyWhole(g.targetCents, code)}
                    </span>
                    <span>{p}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* footer */}
      <footer className="statement-block mt-6 flex flex-col gap-2 border-t border-[rgba(44,37,35,0.18)] pt-3 sm:flex-row sm:items-end sm:justify-between">
        <p className="max-w-[110mm] font-mono text-[7px] leading-relaxed tracking-[0.14em] text-[#8c827b]">
          PREPARED FROM {data.transactions.length} LEDGER ENTRIES FOR{" "}
          {monthLabel(data.month).toUpperCase()}. FIGURES ARE DISPLAY-FORMATTED IN {code} AND ARE
          NOT CURRENCY-CONVERTED. THIS STATEMENT IS A PERSONAL RECORD, NOT A TAX DOCUMENT.
        </p>
        <div className="shrink-0 text-left font-mono text-[7px] tracking-[0.2em] text-[#8c827b] sm:text-right">
          <div>LEDGERLINE® — CASE FILE Nº 047</div>
          <div className="mt-0.5">ISSUED {today}</div>
        </div>
      </footer>
    </article>
  );
}
