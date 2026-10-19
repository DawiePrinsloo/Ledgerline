import type { NextConfig } from "next";

const isPagesExport = process.env.GITHUB_PAGES === "true";

const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: false,
  images: {
    unoptimized: true,
  },
  /**
   * GitHub Pages serves from /repo-name/ not /.
   * Set GITHUB_PAGES=true in the CI workflow to activate this.
   * For Vercel or your own domain, leave it off.
   */
  ...(isPagesExport && {
    basePath: "/Ledgerline",
    assetPrefix: "/Ledgerline/",
  }),
};

export default nextConfig;
