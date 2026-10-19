import type { Metadata } from "next";
import { StaticStatement } from "@/components/statement/static-statement";

export const metadata: Metadata = {
  title: "Mindful Financial Statement — Ledgerline",
  description: "A single-page summary generated from data saved on your device.",
};

export default function StatementPage() {
  return <StaticStatement />;
}
