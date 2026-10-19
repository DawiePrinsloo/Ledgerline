/**
 * /planner — static shell.
 *
 * All data lives in the browser's localStorage. This page renders a thin
 * shell; PlannerBootstrap hydrates from localStorage on mount, so no server
 * DB call is needed and the page exports as a static file.
 */
import type { Metadata } from "next";
import { PlannerBootstrap } from "@/components/planner/planner-bootstrap";

export const metadata: Metadata = {
  title: "Ledgerline — Private Offline Budget Planner",
  description:
    "An installable monthly budget planner that saves privately on your device and works without internet.",
};

export default function PlannerPage() {
  return <PlannerBootstrap />;
}
