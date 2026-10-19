"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { ArrowUpRight, ChevronDown } from "lucide-react";
import { ThemeSwitcher } from "@/components/ui/theme-switcher";

const EASE = [0.16, 1, 0.3, 1] as const;

const LINES = [
  <span key="l1" className="block">One spreadsheet.</span>,
  <span key="l2" className="block">
    <em className="text-lime not-italic font-display italic">620 sales</em> a month.
  </span>,
  <span key="l3" className="block">Zero code.</span>,
];

const META = [
  "SUBJECT — ULTIMATE BUDGET SPREADSHEET",
  "CATEGORY — DIGITAL DOWNLOADS",
  "PRICE — $12.40, FOREVER “50% OFF”",
];

export function Hero() {
  return (
    <header className="relative overflow-hidden">
      {/* top bar */}
      <nav className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3 px-5 pt-6 font-mono text-[10.5px] tracking-[0.28em] text-fog md:px-10">
        <span className="text-bone">LEDGERLINE®</span>
        <span className="hidden md:inline">CASE FILE Nº 047 — EVIDENCE-BASED TEARDOWN</span>
        <span className="flex items-center gap-3">
          <ThemeSwitcher />
          <Link
            href="/planner"
          className="group flex items-center gap-1.5 border border-linebright px-3.5 py-2 text-[10px] tracking-[0.22em] text-bone transition-colors duration-300 hover:border-lime hover:bg-lime hover:text-limedark"
        >
          OPEN THE REBUILD
            <ArrowUpRight size={13} className="transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </Link>
        </span>
      </nav>

      <div className="mx-auto grid max-w-[1500px] items-end gap-12 px-5 pb-24 pt-16 md:px-10 md:pt-24 lg:grid-cols-12 lg:gap-8">
        {/* headline */}
        <div className="lg:col-span-7">
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.15 }}
            className="font-mono text-[11px] tracking-[0.3em] text-fog"
          >
            AUTOPSY OF A BEST-SELLER
            <span className="ml-1 inline-block animate-blink text-lime">▌</span>
          </motion.p>

          <h1 className="mt-6 font-display text-[15vw] leading-[0.9] tracking-[-0.02em] sm:text-[11vw] lg:text-[6.6vw] xl:text-[7.4rem]">
            {LINES.map((line, i) => (
              <span key={i} className="block overflow-hidden pb-1">
                <motion.span
                  className="block"
                  initial={{ y: "112%" }}
                  animate={{ y: 0 }}
                  transition={{ duration: 1.05, delay: 0.2 + i * 0.13, ease: EASE }}
                >
                  {line}
                </motion.span>
              </span>
            ))}
          </h1>

          <motion.p
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.75, ease: EASE }}
            className="mt-8 max-w-xl text-[15px] leading-relaxed text-fog md:text-base"
          >
            Every month, a single $12 file quietly outsells funded startups on
            Etsy. We tore the listing apart — the math, the psychology, the
            formula engine — then rebuilt the whole thing as a living product
            with a spine. This is the teardown, and the rebuild.
          </motion.p>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.9, delay: 1 }}
            className="mt-10 flex flex-wrap items-center gap-x-7 gap-y-3 font-mono text-[10px] tracking-[0.2em] text-mist"
          >
            {META.map((m) => (
              <span key={m}>{m}</span>
            ))}
            <span className="rotate-[-2deg] border border-lime/70 px-2.5 py-1 text-lime">
              STATUS — REVERSED ✓
            </span>
          </motion.div>
        </div>

        {/* evidence figure */}
        <motion.figure
          initial={{ opacity: 0, y: 44, rotate: 3 }}
          animate={{ opacity: 1, y: 0, rotate: 1.25 }}
          transition={{ duration: 1.2, delay: 0.5, ease: EASE }}
          className="relative lg:col-span-5"
        >
          <div className="relative border border-linebright bg-panel p-2.5 shadow-2xl shadow-black/60">
            <div className="relative aspect-[4/5] overflow-hidden">
              <Image
                src="/images/hero-ledger.jpg"
                alt="Evidence — floating ledger receipts"
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 40vw"
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-ink/50 via-transparent to-transparent" />
            </div>
            {/* corner ticks */}
            <span className="absolute -left-px -top-px h-3.5 w-3.5 border-l-2 border-t-2 border-lime" />
            <span className="absolute -right-px -top-px h-3.5 w-3.5 border-r-2 border-t-2 border-lime" />
            <span className="absolute -bottom-px -left-px h-3.5 w-3.5 border-b-2 border-l-2 border-lime" />
            <span className="absolute -bottom-px -right-px h-3.5 w-3.5 border-b-2 border-r-2 border-lime" />
          </div>
          <figcaption className="mt-4 flex items-center justify-between font-mono text-[10px] tracking-[0.22em] text-mist">
            <span>FIG. 01 — THE SUBJECT, IN ITS HABITAT</span>
            <span className="hidden sm:inline">SCORED / TAGGED / FILED</span>
          </figcaption>
        </motion.figure>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.4, duration: 1 }}
        className="pointer-events-none absolute bottom-7 left-1/2 hidden -translate-x-1/2 items-center gap-2 font-mono text-[9.5px] tracking-[0.3em] text-mist lg:flex"
      >
        SCROLL FOR THE AUTOPSY
        <ChevronDown size={13} className="animate-bounce" />
      </motion.div>
    </header>
  );
}
