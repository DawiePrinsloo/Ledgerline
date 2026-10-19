import { Magnet, Sigma, Brain, Unplug, type LucideIcon } from "lucide-react";
import { SectionHead } from "@/components/ui/section-head";
import { Reveal } from "@/components/ui/reveal";

interface Part {
  icon: LucideIcon;
  title: string;
  body: string;
  extracted: string;
}

const PARTS: Part[] = [
  {
    icon: Magnet,
    title: "The Hook",
    body: "“One sheet to run your entire money life.” The thumbnail screams AUTOMATIC BUDGETING in 90pt type. The promise is seductive because it's tiny: type numbers in, clarity falls out. Nobody is buying cells — they're buying the feeling of being the kind of person who budgets.",
    extracted: "a dashboard that explains itself in five seconds",
  },
  {
    icon: Sigma,
    title: "The Engine",
    body: "Underneath: a transactions table, categorized envelopes, SUMIF spaghetti and a donut chart that recalculates when it feels like it. It is, genuinely, a decent product — a tight loop of log, categorize, watch. The loop is the asset. The spreadsheet is just its cheapest possible container.",
    extracted: "the loop — log, categorize, watch it move",
  },
  {
    icon: Brain,
    title: "The Psychology",
    body: "$24.80 struck through to $12.40 — a sale that has run since 2023. Instant download removes the last excuse. 38,214 reviews stand in for trust. None of this is accidental; it's a conversion machine wearing a pastel cardigan.",
    extracted: "nothing. we kept the clarity, left the theater",
  },
  {
    icon: Unplug,
    title: "The Decay",
    body: "It's still a spreadsheet. Manual entry on a phone breaks the habit, one stray keystroke summons #REF!, and Sheets recalculates charts with the urgency of continental drift. Every friction point in the original is an opening — and the brief — for the rebuild.",
    extracted: "the mandate — same promise, living spine",
  },
];

export function Anatomy() {
  return (
    <section className="border-b border-line">
      <div className="mx-auto max-w-[1500px] px-5 py-24 md:px-10 md:py-32">
        <SectionHead
          index="02 — THE ANATOMY"
          title="Why it works."
          sub="FOUR ORGANS REMOVED, TAGGED AND PRESERVED FOR STUDY"
        />

        <div className="mt-16 grid gap-3 lg:grid-cols-2">
          {PARTS.map((part, i) => (
            <Reveal key={part.title} delay={(i % 2) * 0.1}>
              <article className="group relative h-full border border-line bg-coal p-7 transition-colors duration-500 hover:border-linebright hover:bg-panel md:p-10">
                <div className="flex items-start justify-between">
                  <span className="font-mono text-[11px] tracking-[0.3em] text-lime">
                    {`${i + 1}`.padStart(2, "0")}
                  </span>
                  <span className="flex size-11 items-center justify-center border border-line text-fog transition-colors duration-500 group-hover:border-lime group-hover:text-lime">
                    <part.icon size={18} strokeWidth={1.75} />
                  </span>
                </div>
                <h3 className="mt-8 font-display text-3xl tracking-tight text-bone md:text-4xl">
                  {part.title}
                </h3>
                <p className="mt-4 max-w-xl text-[14px] leading-relaxed text-fog">
                  {part.body}
                </p>
                <div className="dashline mt-8" />
                <div className="mt-4 flex items-baseline gap-3 font-mono text-[10px] tracking-[0.2em]">
                  <span className="text-mist">EXTRACTED →</span>
                  <span className="text-bone">{part.extracted.toUpperCase()}</span>
                </div>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
