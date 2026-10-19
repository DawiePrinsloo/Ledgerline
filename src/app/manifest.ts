export const dynamic = "force-static";

import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Ledgerline — Offline Budget Planner",
    short_name: "Ledgerline",
    description: "A private monthly budget planner that works without internet.",
    start_url: "./",
    scope: "./",
    display: "standalone",
    orientation: "any",
    background_color: "#0a0a0c",
    theme_color: "#0a0a0c",
    categories: ["finance", "productivity", "utilities"],
    icons: [
      {
        src: "/icons/ledgerline-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/ledgerline-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/ledgerline-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icons/ledgerline.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
    ],
  };
}
