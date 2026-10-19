const SPECS: Array<[string, string]> = [
  ["PRODUCT", "Ledgerline — the rebuild, v1"],
  ["SUBJECT", "Top-10 Etsy digital budget listing"],
  ["STACK", "Next.js 16 · PostgreSQL · Drizzle"],
  ["MOTION", "framer-motion springs, no easing crutches"],
  ["THEMES", "Organic light · Obsidian dark · system auto"],
  ["TYPE", "Fraunces / Inter / IBM Plex Mono"],
  ["FILED", "Case Nº 047 — Est. 2026"],
];

export function Footer() {
  return (
    <footer className="mx-auto max-w-[1500px] px-5 py-16 md:px-10 md:py-20">
      <div className="grid gap-x-10 gap-y-6 sm:gap-y-8 md:grid-cols-2 lg:grid-cols-3">
        {SPECS.map(([k, v]) => (
          <div key={k} className="flex flex-col gap-1.5 sm:flex-row sm:items-baseline sm:gap-4 sm:font-mono sm:text-[11px] sm:tracking-[0.18em]">
            <span className="font-mono text-[10px] tracking-[0.18em] text-mist sm:shrink-0 sm:text-[11px]">{k}</span>
            <span className="dashline hidden sm:block sm:grow" />
            <span className="font-mono text-[10px] leading-relaxed tracking-[0.14em] text-fog sm:shrink-0 sm:text-right sm:text-[11px]">
              {v.toUpperCase()}
            </span>
          </div>
        ))}
      </div>

      <div className="dashline mt-14" />

      <div className="mt-8 flex flex-col items-start justify-between gap-6 font-mono text-[10px] tracking-[0.25em] text-mist md:flex-row md:items-center">
        <span>© 2026 LEDGERLINE® — CASE FILE Nº 047</span>
        <span className="rotate-[-1.5deg] border border-linebright px-3 py-1.5 text-fog">
          BUILT AS A TEARDOWN · SHIPPED AS A PRODUCT
        </span>
      </div>
    </footer>
  );
}
