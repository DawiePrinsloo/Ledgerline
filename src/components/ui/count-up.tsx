"use client";

import { useEffect, useRef } from "react";
import { useMotionValue, useSpring, useInView } from "framer-motion";
import { moneyWhole, moneyExact, moneyCompact } from "@/lib/format";
import { useCurrency } from "@/lib/currency-context";
import { cn } from "@/lib/utils";

type Fmt = "int" | "money" | "moneyExact" | "compact" | "percent" | "decimal";

function formatter(format: Fmt, code: string): (v: number) => string {
  switch (format) {
    case "money":
      return (v) => moneyWhole(v, code);
    case "moneyExact":
      return (v) => moneyExact(v, code);
    case "compact":
      return (v) => moneyCompact(v, code);
    case "percent":
      return (v) => `${Math.round(v)}%`;
    case "decimal":
      return (v) => v.toFixed(1);
    default:
      return (v) => Math.round(v).toLocaleString("en-US");
  }
}

interface CountUpProps {
  value: number;
  format?: Fmt;
  className?: string;
  /** ms before the spring starts */
  delay?: number;
  /** wait until scrolled into view (default true) */
  startOnView?: boolean;
}

export function CountUp({
  value,
  format = "int",
  className,
  delay = 0,
  startOnView = true,
}: CountUpProps) {
  const { code } = useCurrency();
  // startOnView=false (finance figures) must be correct at rest from the
  // first paint — initialize settled at the value; springs only fire on
  // subsequent value changes. startOnView=true (decorative stats) still
  // sweeps up from zero when scrolled into view.
  const mv = useMotionValue(startOnView ? 0 : value);
  const spring = useSpring(mv, { stiffness: 60, damping: 17, mass: 0.9 });
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });

  useEffect(() => {
    if (!startOnView || inView) {
      const t = window.setTimeout(() => mv.set(value), delay);
      return () => window.clearTimeout(t);
    }
  }, [inView, value, startOnView, delay, mv]);

  useEffect(
    () =>
      spring.on("change", (v) => {
        if (ref.current) ref.current.textContent = formatter(format, code)(v);
      }),
    [spring, format, code]
  );

  // Reformat when the currency changes without spring movement.
  useEffect(() => {
    if (ref.current) ref.current.textContent = formatter(format, code)(spring.get());
  }, [code, format, spring]);

  return (
    <span ref={ref} className={cn("tabular", className)}>
      {formatter(format, code)(startOnView ? 0 : value)}
    </span>
  );
}
