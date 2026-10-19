import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BarChart3, Download, Globe, Lock, Smartphone, Sparkles } from "lucide-react";
import { Grain } from "@/components/ui/grain";

export const metadata: Metadata = {
  title: "Ledgerline — Private Budget Planner",
  description:
    "A beautiful, private budget planner that works on any device, even without internet. Track spending, set budgets, save for goals.",
};

const FEATURES = [
  {
    icon: Lock,
    title: "Completely private",
    body: "Your numbers never leave your device. No account, no cloud, no subscription. Your finances are nobody's business but yours.",
  },
  {
    icon: Smartphone,
    title: "Works on any device",
    body: "Install it on your iPhone, Android, tablet or desktop. Use it like an app — even with no internet connection.",
  },
  {
    icon: BarChart3,
    title: "Real-time budget tracking",
    body: "See exactly where your money goes the moment you log it. Category budgets, daily spending bars and savings goals all update instantly.",
  },
  {
    icon: Globe,
    title: "18 currencies supported",
    body: "Works in USD, EUR, GBP, ZAR, JPY, AUD and 12 more. Switch anytime — your numbers stay, only the format changes.",
  },
  {
    icon: Download,
    title: "Export your data",
    body: "Download a full Excel workbook, a CSV for Google Sheets, or a clean one-page PDF statement. Your data, your format.",
  },
  {
    icon: Sparkles,
    title: "Savings goals",
    body: "Set targets for travel, emergencies, or anything else. Watch the ring fill up as you save. Every change can be undone.",
  },
];

const HOW = [
  { n: "1", title: "Open the planner", body: "Visit the link below. No sign-up needed." },
  { n: "2", title: "Install it on your device", body: "Tap 'Add to Home Screen' (iPhone) or 'Install app' (Android / Chrome). It now opens like a native app." },
  { n: "3", title: "Set your budgets", body: "Nine categories are ready to go. Rename them, adjust the monthly limits, or add your own." },
  { n: "4", title: "Log income and spending", body: "Use the green and black buttons at the top, or the quick-add shortcut. Takes two taps per entry." },
  { n: "5", title: "Watch your money make sense", body: "The charts and summaries update the moment you save an entry. Navigate months with the arrows at the top." },
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-ink text-bone">
      <Grain />

      {/* ── nav ── */}
      <nav className="sticky top-0 z-50 flex items-center justify-between border-b border-line bg-ink/90 px-5 py-4 backdrop-blur-md md:px-10">
        <span className="font-mono text-[11px] tracking-[0.25em] text-bone">LEDGERLINE®</span>
        <Link
          href="/planner"
          className="inline-flex items-center gap-2 rounded-full bg-lime px-4 py-2 text-[12px] font-semibold text-limedark transition-transform hover:-translate-y-0.5"
        >
          Open planner <ArrowRight size={14} />
        </Link>
      </nav>

      {/* ── hero ── */}
      <section className="mx-auto max-w-[1200px] px-5 pb-20 pt-20 text-center md:px-10 md:pt-28">
        <p className="font-mono text-[11px] tracking-[0.3em] text-lime">PRIVATE · OFFLINE · BEAUTIFUL</p>
        <h1 className="mt-5 font-display text-[48px] leading-[0.95] tracking-tight sm:text-[64px] md:text-[80px]">
          Your budget.<br />
          <span className="text-lime">Your device.</span><br />
          Nobody else.
        </h1>
        <p className="mx-auto mt-7 max-w-xl text-[16px] leading-relaxed text-fog md:text-[18px]">
          Ledgerline is a beautiful monthly budget planner that installs on your phone like an app and works without internet.
          No account. No subscription. Just your money, tracked properly.
        </p>
        <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/planner"
            className="inline-flex items-center gap-2 rounded-full bg-lime px-7 py-3.5 text-[14px] font-semibold text-limedark transition-transform hover:-translate-y-0.5"
          >
            Try it free — no sign up <ArrowRight size={15} />
          </Link>
          <Link
            href="/planner"
            className="inline-flex items-center gap-2 rounded-full border border-linebright px-7 py-3.5 text-[14px] text-fog transition-colors hover:border-lime hover:text-lime"
          >
            See the demo
          </Link>
        </div>
        <p className="mt-4 text-[11.5px] text-mist">
          Works on iPhone, Android, iPad, tablet, laptop and desktop · Free forever · No card required
        </p>
      </section>

      {/* ── social proof strip ── */}
      <div className="border-y border-line bg-coal py-6">
        <div className="mx-auto flex max-w-[1200px] flex-wrap items-center justify-center gap-x-10 gap-y-3 px-5 font-mono text-[11px] tracking-[0.2em] text-mist">
          {["PRIVATE — NO ACCOUNT NEEDED", "WORKS OFFLINE", "18 CURRENCIES", "EXPORT TO EXCEL", "INSTALL ON ANY DEVICE", "ALL DATA STAYS ON YOUR DEVICE"].map((t) => (
            <span key={t} className="flex items-center gap-2">
              <span className="size-1 rounded-full bg-lime" />
              {t}
            </span>
          ))}
        </div>
      </div>

      {/* ── features ── */}
      <section className="mx-auto max-w-[1200px] px-5 py-20 md:px-10">
        <h2 className="text-center font-display text-[36px] tracking-tight md:text-[48px]">Everything you need.<br />Nothing you don't.</h2>
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <div key={f.title} className="border border-line bg-coal p-6 transition-colors hover:border-linebright">
              <f.icon size={22} className="text-lime" />
              <h3 className="mt-4 text-[15px] font-semibold text-bone">{f.title}</h3>
              <p className="mt-2 text-[13px] leading-relaxed text-fog">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── how it works ── */}
      <section className="border-t border-line bg-coal">
        <div className="mx-auto max-w-[1200px] px-5 py-20 md:px-10">
          <h2 className="text-center font-display text-[36px] tracking-tight md:text-[48px]">Up and running in 5 minutes.</h2>
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {HOW.map((h) => (
              <div key={h.n} className="border border-line bg-ink p-5">
                <span className="flex size-8 items-center justify-center bg-lime font-mono text-[12px] font-semibold text-limedark">{h.n}</span>
                <h3 className="mt-4 text-[13.5px] font-semibold text-bone">{h.title}</h3>
                <p className="mt-1.5 text-[12px] leading-relaxed text-fog">{h.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── what's inside ── */}
      <section className="mx-auto max-w-[1200px] px-5 py-20 md:px-10">
        <div className="grid gap-12 md:grid-cols-2 md:items-center">
          <div>
            <p className="font-mono text-[11px] tracking-[0.25em] text-lime">WHAT'S INCLUDED</p>
            <h2 className="mt-4 font-display text-[36px] tracking-tight md:text-[48px]">A complete<br />budgeting system.</h2>
            <ul className="mt-8 space-y-3">
              {[
                "9 spending categories — rename or add your own",
                "Income and spending forms with optional notes",
                "Monthly budget envelopes with OVER/WATCH alerts",
                "Daily spending bar chart with rent excluded view",
                "6-month trend chart to see patterns over time",
                "Savings goals with progress rings and undo",
                "One-page monthly statement you can print or save as PDF",
                "Full Excel export with ledger, summary and goals tabs",
                "Import / export JSON backup to move between devices",
                "Light, Dark and Midnight colour themes",
              ].map((item) => (
                <li key={item} className="flex items-start gap-3 text-[13.5px] text-fog">
                  <span className="mt-[3px] size-1.5 shrink-0 rounded-full bg-lime" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="space-y-3 rounded-[4px] border border-line bg-coal p-6">
            {[
              ["Money In", "$6,400.00", "text-mint"],
              ["Money Spent", "$2,293.00", "text-bone"],
              ["Money Left", "$4,107.00", "text-lime"],
              ["Budget Left", "$1,173.00", "text-gold"],
            ].map(([label, value, cls]) => (
              <div key={label} className="flex items-baseline justify-between border-b border-line/60 pb-3 last:border-0 last:pb-0">
                <span className="text-[12px] text-mist">{label}</span>
                <span className={`tabular font-mono text-[20px] font-semibold ${cls}`}>{value}</span>
              </div>
            ))}
            <div className="mt-4 rounded-[2px] bg-ink p-3">
              <div className="font-mono text-[10px] tracking-[0.2em] text-mist">YOUR PACE</div>
              <div className="tabular mt-1 font-mono text-[13px] text-bone">
                Allowed <span className="text-lime">$84/day</span> · Spending <span className="text-ember">$127/day</span> · <span className="text-rose">52% over</span>
              </div>
              <div className="mt-1 text-[10.5px] text-mist">$1,173 left ÷ 14 days until payday</div>
            </div>
          </div>
        </div>
      </section>

      {/* ── privacy callout ── */}
      <section className="border-t border-line">
        <div className="mx-auto max-w-[1200px] px-5 py-16 text-center md:px-10">
          <Lock size={32} className="mx-auto text-lime" />
          <h2 className="mt-5 font-display text-[32px] tracking-tight md:text-[44px]">Your finances stay yours.</h2>
          <p className="mx-auto mt-4 max-w-xl text-[14px] leading-relaxed text-fog">
            Ledgerline stores everything in your device's browser — no server, no database, no account.
            We never see your numbers. When you delete the app, the data goes with it. Export a backup anytime to keep a personal copy.
          </p>
        </div>
      </section>

      {/* ── final CTA ── */}
      <section className="border-t border-line bg-coal">
        <div className="mx-auto max-w-[1200px] px-5 py-20 text-center md:px-10">
          <h2 className="font-display text-[40px] tracking-tight md:text-[56px]">Start in 30 seconds.<br />No sign-up required.</h2>
          <p className="mx-auto mt-5 max-w-lg text-[15px] leading-relaxed text-fog">
            Open the planner, explore the demo data, then press "Start fresh" to make it yours.
            Install it on your phone and it works offline from that point on.
          </p>
          <Link
            href="/planner"
            className="mt-8 inline-flex items-center gap-2 rounded-full bg-lime px-8 py-4 text-[15px] font-semibold text-limedark transition-transform hover:-translate-y-0.5"
          >
            Open Ledgerline — it's free <ArrowRight size={16} />
          </Link>
          <p className="mt-4 text-[11.5px] text-mist">No account · No credit card · Works offline · Private by design</p>
        </div>
      </section>

      {/* ── footer ── */}
      <footer className="border-t border-line px-5 py-8 md:px-10">
        <div className="mx-auto flex max-w-[1200px] flex-wrap items-center justify-between gap-4">
          <span className="font-mono text-[10px] tracking-[0.22em] text-mist">LEDGERLINE® — PRIVATE OFFLINE BUDGET PLANNER</span>
          <div className="flex items-center gap-6 font-mono text-[10px] tracking-[0.18em] text-mist">
            <Link href="/planner" className="transition-colors hover:text-lime">OPEN PLANNER</Link>
            <Link href="/statement" className="transition-colors hover:text-lime">STATEMENT</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
