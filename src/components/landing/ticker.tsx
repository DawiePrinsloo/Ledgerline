const ITEMS = [
  "620 SALES / MO (EST.)",
  "RATED 4.9 — 38,214 REVIEWS",
  "$12.40 AVG. ORDER",
  "INSTANT DOWNLOAD",
  "GOOGLE SHEETS + EXCEL",
  "TOP 0.1% OF DIGITAL LISTINGS",
  "$7.6K GROSS / MO",
  "BUILT IN A WEEKEND",
];

export function Ticker() {
  return (
    <div className="overflow-hidden border-y border-ink bg-lime py-3 text-limedark">
      <div className="flex w-max animate-marquee whitespace-nowrap">
        {[0, 1].map((copy) => (
          <div key={copy} className="flex shrink-0 items-center">
            {ITEMS.map((item) => (
              <span
                key={`${copy}-${item}`}
                className="flex items-center font-mono text-[11.5px] font-medium tracking-[0.22em]"
              >
                <span className="px-6">{item}</span>
                <span className="text-limedark/40">//</span>
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
