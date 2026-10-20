import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { Fraunces, Inter, IBM_Plex_Mono } from "next/font/google";
import { THEME_INIT_SCRIPT } from "@/lib/themes";
import { PwaRegister } from "@/components/pwa-register";
import "./globals.css";

const display = Fraunces({
  subsets: ["latin"],
  style: ["normal", "italic"],
  variable: "--font-fraunces",
});

const sans = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const mono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-plexmono",
});

export const metadata: Metadata = {
  title: "Ledgerline — Etsy's best-selling budget, reverse-engineered",
  description:
    "One Etsy spreadsheet sells 620 times a month with zero code. We tore it down cell by cell — then rebuilt it as a living product.",
};

export const viewport: Viewport = {
  themeColor: "#0a0a0c",
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="en"
      data-theme="obsidian"
      suppressHydrationWarning
      className={`${display.variable} ${sans.variable} ${mono.variable}`}
    >
      <body className="bg-ink text-bone font-sans antialiased">
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
        <PwaRegister />
        {children}
      </body>
    </html>
  );
}
