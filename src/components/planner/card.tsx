import { forwardRef, type ReactNode } from "react";
import { InfoTip } from "@/components/ui/info-tip";
import { cn } from "@/lib/utils";

export const Panel = forwardRef<
  HTMLDivElement,
  { className?: string; children: ReactNode }
>(function Panel({ className, children }, ref) {
  return (
    <div
      ref={ref}
      className={cn("border border-line bg-coal p-4 sm:p-5 md:p-6", className)}
    >
      {children}
    </div>
  );
});

/**
 * Card header. The title is always visible; the explanation stays hidden
 * behind the "?" so the interface reads clean, but help is one tap away.
 */
export function CardHead({
  title,
  hint,
  help,
  right,
  className,
}: {
  /** Plain-language name, e.g. "Where your money went" */
  title: string;
  /** What this panel shows / how to use it — revealed by the "?" */
  hint?: string;
  /** Extra detail, appended after the hint inside the same tooltip */
  help?: string;
  right?: ReactNode;
  className?: string;
}) {
  const explanation = [hint, help].filter(Boolean).join(" ");

  return (
    <div className={cn("mb-4 sm:mb-5", className)}>
      <div className="flex flex-col items-start gap-2.5 sm:flex-row sm:justify-between sm:gap-3">
        <h3 className="flex w-full min-w-0 items-center gap-1 text-[14px] font-semibold leading-tight text-bone sm:w-auto sm:text-[15px]">
          <span className="min-w-0 break-words">{title}</span>
          {explanation && <InfoTip text={explanation} label={title} />}
        </h3>
        {right && (
          <div className="w-full min-w-0 pt-0.5 text-left text-[11px] text-fog sm:w-auto sm:shrink-0 sm:text-right">
            {right}
          </div>
        )}
      </div>
    </div>
  );
}
