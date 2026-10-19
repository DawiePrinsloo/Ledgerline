"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { HelpCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface InfoTipProps {
  text: string;
  /** Accessible name, e.g. the thing being explained */
  label?: string;
  className?: string;
}

/**
 * "?" button that reveals a plain-English explanation. The bubble measures
 * itself against the viewport and flips (above/below) and clamps (left/right)
 * so it always sits fully on-screen — phones, tablets and desktop.
 */
export function InfoTip({ text, label, className }: InfoTipProps) {
  const [open, setOpen] = useState(false);
  const [placement, setPlacement] = useState<{ left: number; below: boolean } | null>(null);
  const rootRef = useRef<HTMLSpanElement>(null);
  const tipRef = useRef<HTMLSpanElement>(null);

  const place = () => {
    const root = rootRef.current;
    const tip = tipRef.current;
    if (!root || !tip) return;
    const icon = root.getBoundingClientRect();
    const rect = tip.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const M = 10;

    // vertical — prefer above the icon, flip below if there's no room above
    const below = icon.top < rect.height + M && vh - icon.bottom > rect.height + M;

    // horizontal — align the bubble's left edge with the icon, clamped to
    // the viewport so it can never hang off either side
    const maxX = vw - M - rect.width;
    const x = Math.min(Math.max(icon.left, M), Math.max(M, maxX));

    setPlacement({ left: x - icon.left, below });
  };

  useLayoutEffect(() => {
    if (!open) return;
    setPlacement(null); // hidden until measured — never paints off-screen
    place();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, text]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    const onResize = () => place();
    window.addEventListener("pointerdown", onDown);
    window.addEventListener("keydown", onKey);
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", onResize);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  return (
    <span ref={rootRef} className={cn("relative inline-flex shrink-0 align-middle", className)}>
      <button
        type="button"
        aria-label={label ? `What does “${label}” mean?` : "Show explanation"}
        aria-expanded={open}
        onClick={(e) => {
          e.stopPropagation();
          setOpen((o) => !o);
        }}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        className={cn(
          "flex size-5 items-center justify-center rounded-full transition-colors",
          open ? "text-lime" : "text-mist hover:text-lime"
        )}
      >
        <HelpCircle size={13} />
      </button>
      {open && (
        <span
          ref={tipRef}
          role="tooltip"
          onClick={(e) => e.stopPropagation()}
          style={
            placement
              ? { left: placement.left }
              : { visibility: "hidden", left: 0 }
          }
          className={cn(
            "absolute z-[70] w-[min(280px,calc(100vw-2rem))] border border-linebright bg-raise px-3 py-2.5 text-[11.5px] font-normal normal-case leading-relaxed tracking-normal text-bone shadow-xl shadow-black/60",
            placement?.below ? "top-full mt-2" : "bottom-full mb-2"
          )}
        >
          {text}
        </span>
      )}
    </span>
  );
}
