import { SectionHead } from "@/components/ui/section-head";
import { Reveal } from "@/components/ui/reveal";
import { CountUp } from "@/components/ui/count-up";

const STATS = [
  {
    value: 620,
    format: "int" as const,
    label: "EST. SALES / MONTH",
    note: "review velocity × 4 buyer rate",
  },
  {
    value: 1240,
    format: "moneyExact" as const,
    label: "AVERAGE ORDER",
    note: "listed at $24.80 — permanently “on sale”",
  },
  {
    value: 768800,
    format: "money" as const,
    label: "GROSS / MONTH",
    note: "one file, made once, sold forever",
  },
  {
    value: 38214,
    format: "int" as const,
    label: "REVIEWS ON THE WALL",
    note: "roughly 1 in 4 buyers leave one",
  },
];

export function Evidence() {
  return (
    <section className="border-b border-line">
      <div className="mx-auto max-w-[1500px] px-5 py-24 md:px-10 md:py-32">
        <SectionHead
          index="01 — THE EVIDENCE"
          title="First, the numbers."
          sub="TRIANGULATED FROM PUBLIC SIGNALS — REVIEW VELOCITY, LISTING AGE, CATEGORY RANK"
        />

        <div className="mt-16 grid gap-y-12 sm:grid-cols-2 lg:grid-cols-4">
          {STATS.map((s, i) => (
            <Reveal key={s.label} delay={i * 0.08} className="border-l border-line pl-6">
              <CountUp
                value={s.value}
                format={s.format}
                className="font-display text-5xl leading-none tracking-tight text-bone md:text-6xl"
              />
              <div className="mt-4 font-mono text-[10.5px] tracking-[0.25em] text-lime">
                {s.label}
              </div>
              <div className="mt-2 max-w-[220px] font-mono text-[10px] leading-relaxed tracking-wider text-mist">
                {s.note}
              </div>
            </Reveal>
          ))}
        </div>

        {/* the receipt */}
        <Reveal delay={0.15} className="mx-auto mt-20 max-w-2xl">
          <div className="rotate-[-0.6deg] transition-transform duration-500 hover:rotate-0">
            <div className="perf" />
            <div className="bg-paper px-7 py-8 text-paperink shadow-2xl shadow-black/50 md:px-10">
              <div className="text-center font-mono text-[10px] tracking-[0.35em] text-paperink/60">
                *** MONTHLY TAKE — ONE LISTING ***
              </div>
              <div className="mt-5 space-y-2.5 font-mono text-[13px] tracking-wide md:text-sm">
                <div className="flex justify-between border-b border-dashed border-paperink/25 pb-2.5">
                  <span>620 ORDERS × $12.40</span>
                  <span className="tabular">$7,688.00</span>
                </div>
                <div className="flex justify-between border-b border-dashed border-paperink/25 pb-2.5">
                  <span>ETSY FEES ≈ 9.5%</span>
                  <span className="tabular">– $730.36</span>
                </div>
                <div className="flex justify-between pt-1 text-[15px] font-semibold md:text-base">
                  <span>TAKE-HOME / MO</span>
                  <span className="tabular">$6,957.64</span>
                </div>
              </div>
              <div className="mt-6 text-center font-mono text-[9.5px] leading-relaxed tracking-[0.28em] text-paperink/50">
                MARGINAL COST OF COPY Nº 621: $0.00 — THANK YOU FOR SHOPPING
              </div>
            </div>
            <div className="perf" />
          </div>
        </Reveal>

        <p className="mx-auto mt-10 max-w-md text-center font-mono text-[9.5px] leading-relaxed tracking-[0.2em] text-mist">
          FIGURES ARE ESTIMATES FROM PUBLIC REVIEW COUNTS AND CATEGORY
          STANDING — NOT SUBPOENAS.
        </p>
      </div>
    </section>
  );
}
