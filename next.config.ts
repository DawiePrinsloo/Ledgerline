import type { NextConfig } from "next";

const isPagesExport = process.env.GITHUB_PAGES === "true";

const nextConfig: NextConfig = {
  output: "export",
  // GitHub Pages needs true, Vercel needs false/undefined - set dynamically
  trailingSlash: isPagesExport ? true : false,
  images: {
    unoptimized: true,
  },
  // GitHub Pages serves from /repo-name/ not /
  ...(isPagesExport && {
    basePath: "/Ledgerline",
    assetPrefix: "/Ledgerline/",
  }),
};

export default nextConfig;
