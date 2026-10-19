/**
 * Ledgerline service worker — dependency-free, cache-first for static assets,
 * network-first for navigation so fresh deployments land immediately.
 *
 * CACHE_VERSION is replaced at build time by scripts/stamp-sw.mjs.
 * When it changes, the old cache is deleted and everything is re-cached.
 */
const CACHE_VERSION = "ledgerline-v1";

// Pre-cache URLs relative to the service worker's location.
// This allows the PWA to work whether hosted at / or a subfolder like /Ledgerline/
const PRECACHE = [
  "./",
  "./planner",
  "./statement",
  "./manifest.webmanifest",
  "./icons/ledgerline.svg",
  "./icons/ledgerline-192.png",
  "./icons/ledgerline-512.png",
];

// ── Install: pre-cache the app shell ──────────────────────────────────────
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then(async (cache) => {
      // Cache each URL individually; a single miss must not abort the install.
      await Promise.all(
        PRECACHE.map((url) =>
          fetch(url, { cache: "no-store" })
            .then((r) => { if (r.ok) return cache.put(url, r); })
            .catch(() => {})
        )
      );
      self.skipWaiting();
    })
  );
});

// ── Activate: delete stale caches ─────────────────────────────────────────
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_VERSION).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// ── Fetch strategy ────────────────────────────────────────────────────────
self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // _next/static assets are content-hashed — cache forever, no revalidation.
  if (url.pathname.startsWith("/_next/static/")) {
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ||
          fetch(request).then((r) => {
            if (r.ok) {
              const clone = r.clone();
              caches.open(CACHE_VERSION).then((c) => c.put(request, clone));
            }
            return r;
          })
      )
    );
    return;
  }

  // Navigation: network-first so updated deployments land without a cache clear.
  // Falls back to the cached shell so the app opens offline.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then(async (r) => {
          if (r.ok) {
            const clone = r.clone();
            const cache = await caches.open(CACHE_VERSION);
            cache.put(request, clone);
          }
          return r;
        })
        .catch(async () => {
          // Offline fallback: land on the planner, never the landing page.
          const base = self.location.pathname.replace(/sw\.js$/, "");
          const cached =
            (await caches.match(request)) ||
            (await caches.match(base + "planner")) ||
            (await caches.match(base + "planner.html")) ||
            (await caches.match(base));
          return cached ?? Response.error();
        })
    );
    return;
  }

  // Everything else: cache-first.
  event.respondWith(
    caches.match(request).then((cached) => cached || fetch(request))
  );
});
