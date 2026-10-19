"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, ChevronDown, Search } from "lucide-react";
import { CURRENCIES } from "@/lib/currencies";
import { useCurrency } from "@/lib/currency-context";
import { cn } from "@/lib/utils";

export function CurrencySelect({ className }: { className?: string }) {
  const { code, setCode } = useCurrency();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const rootRef = useRef<HTMLDivElement>(null);

  const current = CURRENCIES.find((c) => c.code === code) ?? CURRENCIES[0];

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("mousedown", onDown);
    window.addEventListener("keydown", onEsc);
    return () => {
      window.removeEventListener("mousedown", onDown);
      window.removeEventListener("keydown", onEsc);
    };
  }, [open]);

  const select = (next: string) => {
    setCode(next);
    setOpen(false);
    setQuery("");
  };

  const q = query.trim().toLowerCase();
  const filtered = CURRENCIES.filter(
    (c) =>
      !q ||
      c.code.toLowerCase().includes(q) ||
      c.name.toLowerCase().includes(q) ||
      c.symbol.toLowerCase().includes(q)
  );

  return (
    <div ref={rootRef} className={cn("relative", className)}>
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="Select currency"
        aria-expanded={open}
        className="flex items-center gap-1.5 border border-linebright px-2.5 py-2 font-mono text-[10px] tracking-[0.18em] text-fog transition-colors hover:border-lime hover:text-bone sm:px-3 sm:py-2.5"
      >
        <span className="text-bone">{current.symbol}</span>
        <span>{current.code}</span>
        <ChevronDown
          size={11}
          className={cn("text-mist transition-transform duration-200", open && "rotate-180")}
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            className="absolute right-0 top-full z-[85] mt-2 w-[min(300px,calc(100vw-1.5rem))] border border-linebright bg-panel shadow-2xl shadow-black/50"
          >
            <div className="flex items-baseline justify-between border-b border-line px-4 py-3">
              <span className="font-mono text-[9px] tracking-[0.32em] text-mist">CURRENCY</span>
              <span className="font-mono text-[8px] tracking-[0.18em] text-mist">USD DEFAULT</span>
            </div>

            <div className="relative border-b border-line">
              <Search size={12} className="absolute left-4 top-1/2 -translate-y-1/2 text-mist" />
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="SEARCH — “RAND”, “ZAR”, “€”…"
                className="w-full bg-transparent py-2.5 pl-10 pr-4 font-mono text-[11px] tracking-wide text-bone outline-none placeholder:text-mist/60"
              />
            </div>

            <div className="max-h-[272px] overflow-y-auto scroll-slim py-1">
              {filtered.length === 0 && (
                <p className="px-4 py-6 text-center font-mono text-[9.5px] tracking-[0.2em] text-mist">
                  NO MATCH.
                </p>
              )}
              {filtered.map((c) => {
                const active = c.code === code;
                return (
                  <button
                    key={c.code}
                    onClick={() => select(c.code)}
                    className="flex w-full items-center gap-3.5 px-4 py-2.5 text-left transition-colors hover:bg-raise"
                  >
                    <span className="tabular w-9 shrink-0 font-mono text-[12px] text-lime">
                      {c.symbol}
                    </span>
                    <span className="min-w-0 flex-1 truncate font-mono text-[10px] tracking-[0.18em]">
                      <span className="text-bone">{c.code}</span>
                      <span className="text-mist"> — {c.name.toUpperCase()}</span>
                    </span>
                    {active && <Check size={14} className="shrink-0 text-lime" />}
                  </button>
                );
              })}
            </div>

            <div className="border-t border-line px-4 py-2.5 font-mono text-[8px] leading-relaxed tracking-[0.15em] text-mist">
              DISPLAY ONLY — FIGURES REFORMAT, VALUES NEVER CONVERT.
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
