"use client";

import { motion } from "framer-motion";
import { CountUp } from "@/components/ui/count-up";
import { InfoTip } from "@/components/ui/info-tip";
import { cn } from "@/lib/utils";

export interface KpiItem {
  /** Plain-language name, e.g. "Money left" */
  label: string;
  value: number;
  format: "money" | "percent";
  dot: string;
  valueClass: string;
  /** One short line of context under the number */
  sub: string;
  /** Full explanation of how this number is worked out */
  help: string;
}

/**
 * The four headline totals. Values are correct at rest — CountUp renders the
 * settled figure immediately; the spring only animates between changes.
 */
export function KpiRow({ items }: { items: KpiItem[] }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4">
      {items.map((kpi, i) => (
        <motion.div
          key={kpi.label}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 + i * 0.07, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="group border border-line bg-coal p-5 transition-colors duration-300 hover:border-linebright md:p-6"
        >
          <div className="flex items-center justify-between gap-2">
            <span className="flex items-center gap-1.5 text-[12px] font-medium text-fog">
              {kpi.label}
              <InfoTip text={kpi.help} label={kpi.label} />
            </span>
            <span
              className="size-1.5 shrink-0 rounded-full transition-transform duration-500 group-hover:scale-150"
              style={{ backgroundColor: kpi.dot }}
            />
          </div>
          <CountUp
            value={kpi.value}
            format={kpi.format}
            startOnView={false}
            className={cn(
              "mt-3.5 block font-mono text-[26px] leading-none tracking-tight md:text-[32px]",
              kpi.valueClass
            )}
          />
          <div className="mt-3 text-[11px] leading-relaxed text-mist">{kpi.sub}</div>

        </motion.div>
      ))}
    </div>
  );
}
