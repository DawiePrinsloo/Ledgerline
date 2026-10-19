"use client";

import { useState } from "react";
import { CalendarClock, Download, Trash2, Upload } from "lucide-react";
import { cn } from "@/lib/utils";

interface FooterSettingsProps {
  paydayDay: number;
  onPaydayChange: (day: number) => void;
  onExportJson: () => void;
  onRestore: (file: File) => void;
  onWipe: () => void;
}

function ordinal(day: number): string {
  const suffix =
    day % 10 === 1 && day !== 11
      ? "st"
      : day % 10 === 2 && day !== 12
        ? "nd"
        : day % 10 === 3 && day !== 13
          ? "rd"
          : "th";
  return `${day}${suffix}`;
}

export function FooterSettings({
  paydayDay,
  onPaydayChange,
  onExportJson,
  onRestore,
  onWipe,
}: FooterSettingsProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(String(paydayDay));

  const commit = () => {
    const n = Math.round(Number(draft));
    if (Number.isFinite(n) && n >= 1 && n <= 31) onPaydayChange(n);
    setEditing(false);
  };

  return (
    <div className="border-t border-line px-4 py-6">
      <div className="mx-auto flex max-w-[1440px] flex-col gap-4 md:flex-row md:items-center md:justify-between">
        {/* payday — drives the pace allowance */}
        <div className="flex items-center gap-2.5">
          <CalendarClock size={14} className="shrink-0 text-mist" />
          {editing ? (
            <span className="flex items-center gap-2">
              <label className="text-[11.5px] text-fog" htmlFor="payday-input">
                Paid on day
              </label>
              <input
                id="payday-input"
                autoFocus
                type="number"
                min={1}
                max={31}
                inputMode="numeric"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onBlur={commit}
                onKeyDown={(e) => {
                  if (e.key === "Enter") commit();
                  if (e.key === "Escape") setEditing(false);
                }}
                className="tabular w-16 border-b border-lime bg-transparent pb-0.5 text-[12px] text-lime outline-none"
              />
              <span className="text-[11px] text-mist">of each month (1–31)</span>
            </span>
          ) : (
            <button
              onClick={() => {
                setDraft(String(paydayDay));
                setEditing(true);
              }}
              title="Set the day you are usually paid — this is used to work out what you can still afford each day"
              className="text-[11.5px] text-fog underline decoration-dotted decoration-mist underline-offset-4 transition-colors hover:text-lime hover:decoration-lime"
            >
              Payday: {ordinal(paydayDay)} of the month
            </button>
          )}
        </div>

        {/* ownership controls */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={onExportJson}
            title="Download your whole planner as a ledger.json file"
            className="inline-flex items-center gap-1.5 border border-linebright px-2.5 py-1.5 text-[11px] text-fog transition-colors hover:border-lime hover:text-lime"
          >
            <Download size={12} />
            Export JSON
          </button>
          <label
            title="Restore a previously exported ledger.json"
            className="inline-flex cursor-pointer items-center gap-1.5 border border-linebright px-2.5 py-1.5 text-[11px] text-fog transition-colors hover:border-lime hover:text-lime"
          >
            <Upload size={12} />
            Import
            <input
              type="file"
              accept="application/json,.json"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) onRestore(file);
                e.currentTarget.value = "";
              }}
            />
          </label>
          <button
            onClick={onWipe}
            title="Permanently delete everything stored on this device"
            className={cn(
              "inline-flex items-center gap-1.5 border border-line px-2.5 py-1.5 text-[11px] text-mist transition-colors",
              "hover:border-rose hover:text-rose"
            )}
          >
            <Trash2 size={12} />
            Wipe all
          </button>
        </div>
      </div>

      <p className="mx-auto mt-4 max-w-[1440px] text-[10.5px] leading-relaxed text-mist">
        Everything is stored on this device only — no account, no cloud, no bank
        connection. Export regularly so you can move devices or recover after
        clearing your browser.
      </p>
    </div>
  );
}
