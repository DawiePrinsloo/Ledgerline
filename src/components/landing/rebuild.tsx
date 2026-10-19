import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight } from "lucide-react";
import { SectionHead } from "@/components/ui/section-head";
import { Reveal } from "@/components/ui/reveal";

const SPECS = [
  "POSTGRES-BACKED LEDGER",
  "MONTH NAVIGATION",
  "EDITABLE ENVELOPES",
  "SAVINGS GOALS",
  "ONE-KEY ENTRY",
  "LIGHT + DARK + SYSTEM AUTO",
];

export function Rebuild() {
  return (
    <section className="relative overflow-hidden border-b border-line">
      <Image
        src="/images/rebuild-texture.jpg"
        alt=""
        fill
        sizes="100vw"
        className="object-cover opacity-35"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-ink via-ink/70 to-ink" />

      <div className="relative mx-auto max-w-[1500px] px-5 py-28 md:px-10 md:py-40">
        <SectionHead
          index="03 — THE REBUILD"
          title="So we rebuilt it."
          sub="EVERYTHING THAT SELLS, NONE OF WHAT BREAKS"
        />

        <Reveal className="mt-14 max-w-3xl">
          <p className="font-display text-2xl leading-snug tracking-tight text-bone md:text-4xl">
            Same promise — <em className="text-lime">run your money in one
            place</em> — but the spine is Postgres, the charts move when you
            do, and no keystroke can summon{" "}
            <span className="font-mono text-rose">#REF!</span> ever again.
          </p>
        </Reveal>

        <Reveal delay={0.1} className="mt-10 flex flex-wrap gap-2.5">
          {SPECS.map((spec) => (
            <span
              key={spec}
              className="border border-linebright px-3.5 py-2 font-mono text-[10px] tracking-[0.22em] text-fog transition-colors duration-300 hover:border-lime hover:text-lime"
            >
              {spec}
            </span>
          ))}
        </Reveal>

        <Reveal delay={0.2} className="mt-14">
          <Link
            href="/planner"
            className="group inline-flex items-center gap-3 bg-lime px-8 py-4.5 font-mono text-[12px] font-medium tracking-[0.25em] text-limedark transition-transform duration-300 hover:-translate-y-0.5 md:px-10"
          >
            OPEN THE REBUILD
            <ArrowUpRight
              size={16}
              className="transition-transform duration-300 group-hover:translate-x-1 group-hover:-translate-y-1"
            />
          </Link>
          <p className="mt-5 font-mono text-[10px] tracking-[0.22em] text-mist">
            NO SIGNUP · SEEDED WITH TWO MONTHS OF REAL-ISH LIFE · PRESS “A” TO LOG
          </p>
        </Reveal>
      </div>
    </section>
  );
}
