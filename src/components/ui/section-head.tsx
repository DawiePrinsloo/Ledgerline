import { cn } from "@/lib/utils";

interface SectionHeadProps {
  index: string;
  title: string;
  sub?: string;
  className?: string;
}

export function SectionHead({ index, title, sub, className }: SectionHeadProps) {
  return (
    <div className={cn("flex items-end justify-between gap-8", className)}>
      <div>
        <div className="font-mono text-[11px] tracking-[0.35em] text-lime">
          {index}
        </div>
        <h2 className="mt-4 font-display text-4xl leading-[0.95] tracking-tight md:text-6xl">
          {title}
        </h2>
      </div>
      {sub && (
        <p className="hidden max-w-[240px] pb-1 text-right font-mono text-[10.5px] leading-relaxed tracking-wider text-mist md:block">
          {sub}
        </p>
      )}
    </div>
  );
}
