import { InfoTip } from "@/components/ui/info-tip";
import { cn } from "@/lib/utils";

/** Section heading whose explanation is tucked behind the "?" icon. */
export function SectionTitle({
  title,
  help,
  className,
}: {
  title: string;
  help: string;
  className?: string;
}) {
  return (
    <h2
      className={cn(
        "flex items-center gap-1 text-[14px] font-semibold text-bone sm:text-[15px]",
        className
      )}
    >
      {title}
      <InfoTip text={help} label={title} />
    </h2>
  );
}
