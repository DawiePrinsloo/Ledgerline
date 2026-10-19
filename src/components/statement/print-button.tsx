"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { ArrowLeft, Printer } from "lucide-react";

/**
 * Renders the on-screen action bar for the statement document and, when the
 * page is opened with ?print=1, automatically raises the browser's
 * Print / Save-as-PDF dialog once fonts have settled.
 */
export function StatementActions({ autoPrint }: { autoPrint: boolean }) {
  const fired = useRef(false);

  useEffect(() => {
    if (!autoPrint || fired.current) return;
    fired.current = true;

    let cancelled = false;
    const run = () => {
      if (!cancelled) window.print();
    };

    const ready =
      typeof document !== "undefined" && "fonts" in document
        ? (document as Document & { fonts: FontFaceSet }).fonts.ready
        : Promise.resolve();

    ready.then(() => window.setTimeout(run, 350));
    return () => {
      cancelled = true;
    };
  }, [autoPrint]);

  return (
    <div className="no-print mx-auto mb-5 flex w-full max-w-[210mm] flex-wrap items-center justify-between gap-x-4 gap-y-3 px-4 sm:px-0">
      <Link
        href="/planner"
        className="group flex items-center gap-2 font-mono text-[10px] tracking-[0.25em] text-[#6b625c] transition-colors hover:text-[#1d1917]"
      >
        <ArrowLeft size={13} className="transition-transform duration-300 group-hover:-translate-x-0.5" />
        BACK TO PLANNER
      </Link>

      <button
        onClick={() => window.print()}
        className="group flex items-center gap-2.5 bg-[#1d1917] px-5 py-3 font-mono text-[10.5px] font-semibold tracking-[0.22em] text-white transition-transform duration-300 hover:-translate-y-0.5"
      >
        <Printer size={14} />
        PRINT / SAVE AS PDF
      </button>
    </div>
  );
}
