/**
 * Replaces the CACHE_VERSION placeholder in out/sw.js with a timestamp-based
 * version so every Vercel deploy busts the old cache automatically.
 *
 * Run automatically after `next build` via the `build:pwa` script.
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { createHash } from "node:crypto";

const swPath = resolve("out", "sw.js");

if (!existsSync(swPath)) {
  console.warn("stamp-sw: out/sw.js not found — skipping.");
  process.exit(0);
}

const version = `ledgerline-v${Date.now()}`;
let sw = readFileSync(swPath, "utf8");
sw = sw.replace(`"ledgerline-v1"`, `"${version}"`);
writeFileSync(swPath, sw);
console.log(`stamp-sw: cache version set to "${version}"`);
