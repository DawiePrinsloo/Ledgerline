"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { BookOpen, X } from "lucide-react";

const STORAGE_KEY = "ll-guide-dismissed";

const STEPS = [
  {
    n: "1",
    title: "Install it once",
    body: "While online, press “Install app” or choose “Add to Home Screen” in your browser. After that, open Ledgerline like any other app — internet is not required.",
  },
  {
    n: "2",
    title: "Make it yours",
    body: "The planner starts with example entries. Press “Start fresh” to remove them, or explore the example first. Your categories and budget template are kept.",
  },
  {
    n: "3",
    title: "Record your money",
    body: "Press the green “Add entry” button. Enter what you spent or received, then choose the closest category. It saves immediately on this device.",
  },
  {
    n: "4",
    title: "Set your plan",
    body: "In “Spending by category”, tap any budget amount to change it. The totals and charts update automatically from your entries.",
  },
  {
    n: "5",
    title: "Use it every month",
    body: "Use the ‹ › arrows beside the month name to move through months. You can add entries to any past month, even while completely offline.",
  },
  {
    n: "6",
    title: "Protect your data",
    body: "Download a backup regularly. Restore that file on a new device, export a spreadsheet, or save a clean one-page PDF whenever you need it.",
  },
];

export function HelpPanel() {
  // Rendered open by default so the guide is present in the very first paint;
  // returning visitors who dismissed it have it closed on mount.
  const [open, setOpen] = useState(true);

  useEffect(() => {
    if (localStorage.getItem(STORAGE_KEY) === "1") setOpen(false);
  }, []);

  const close = () => {
    setOpen(false);
    localStorage.setItem(STORAGE_KEY, "1");
  };

  return (
    <>
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="flex items-center gap-2 border border-line px-3 py-2 font-mono text-[9.5px] tracking-[0.18em] text-mist transition-colors hover:border-lime hover:text-lime"
        >
          <BookOpen size={12} />
          HOW THIS PAGE WORKS
        </button>
      )}

      <AnimatePresence>
        {open && (
          <motion.aside
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <div className="border border-line bg-coal p-4 sm:p-5 md:p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="flex items-center gap-2 text-[17px] font-semibold text-bone">
                    <BookOpen size={15} className="text-lime" />
                    How this page works
                  </h2>
                  <p className="mt-1.5 max-w-[70ch] text-[12.5px] leading-relaxed text-fog">
                    This is your monthly money planner. You write down what you earn
                    and spend, and every chart below updates itself. Nothing is
                    shared, and you can change or delete anything at any time.
                  </p>
                </div>
                <button
                  onClick={close}
                  aria-label="Close the guide"
                  title="Close this guide (you can reopen it any time)"
                  className="shrink-0 p-1 text-mist transition-colors hover:text-bone"
                >
                  <X size={15} />
                </button>
              </div>

              <ol className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
                {STEPS.map((s) => (
                  <li key={s.n} className="border-t border-line pt-3">
                    <div className="flex items-center gap-2">
                      <span className="flex size-5 items-center justify-center bg-lime font-mono text-[10px] font-semibold text-limedark">
                        {s.n}
                      </span>
                      <h3 className="text-[12.5px] font-semibold text-bone">{s.title}</h3>
                    </div>
                    <p className="mt-2 text-[11.5px] leading-relaxed text-mist">{s.body}</p>
                  </li>
                ))}
              </ol>

              <button
                onClick={close}
                className="mt-5 bg-lime px-5 py-2.5 font-mono text-[10px] font-semibold tracking-[0.2em] text-limedark transition-transform hover:-translate-y-0.5"
              >
                GOT IT — HIDE THIS GUIDE
              </button>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  );
}
