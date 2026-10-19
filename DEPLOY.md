# Ledgerline — Deploy to Vercel (or any static host)

## What is in this package

| File/folder | What it is |
|---|---|
| `out/` | The complete static build — deploy this folder |
| `out/planner.html` | The full offline budget planner |
| `out/statement.html` | The printable monthly statement |
| `out/sw.js` | Service worker — makes the app installable and offline |
| `out/manifest.webmanifest` | PWA install metadata |
| `out/icons/` | App icons (192, 512, SVG) |
| `vercel.json` | Route and cache-header config for Vercel |

Everything in `out/_next/static/` is the hashed JS + CSS bundle.  
**Do not modify any of those filenames** — they are content-addressed.

---

## Option A — Vercel (recommended, free tier works)

### 1. Create a Vercel account

Go to https://vercel.com and sign up (free).

### 2. Install the Vercel CLI

```bash
npm i -g vercel
```

### 3. Deploy

Unzip `ledgerline-deploy.zip`, then from inside the unzipped folder:

```bash
vercel --prod --yes
```

Vercel will detect the `out/` folder, read `vercel.json`, and deploy in ~30 seconds.  
Your live URL will be something like `https://ledgerline-xyz.vercel.app`.

### 4. Custom domain

In the Vercel dashboard → your project → Settings → Domains, add your own domain and follow the DNS instructions.

---

## Option B — Netlify (also free)

1. Go to https://app.netlify.com → "Add new site → Deploy manually"
2. Drag the `out/` folder into the upload box
3. Done. Add your domain in Site settings → Domain management

For the service worker to work correctly on Netlify, add a `netlify.toml` at the root of `out/`:

```toml
[[headers]]
  for = "/sw.js"
  [headers.values]
    Cache-Control = "public, max-age=0, must-revalidate"
    Service-Worker-Allowed = "/"
```

---

## Option C — Cloudflare Pages

1. Log in to Cloudflare → Pages → Create application → Upload assets
2. Upload the `out/` folder
3. Cloudflare Pages automatically serves everything statically

---

## Option D — Any plain web server / VPS

Copy the entire `out/` folder to your web root. Set these HTTP response headers:

```
/sw.js                  Cache-Control: public, max-age=0, must-revalidate
                        Service-Worker-Allowed: /
/manifest.webmanifest   Cache-Control: public, max-age=0, must-revalidate
/_next/static/**        Cache-Control: public, max-age=31536000, immutable
```

The service worker requires **HTTPS** (or `localhost`). On HTTP the install prompt will not appear.

---

## PWA install — buyer instructions

### iPhone / iPad (Safari)
1. Open the site in Safari
2. Tap the Share icon (square with arrow)
3. Scroll down and tap **Add to Home Screen**
4. Tap **Add**

### Android (Chrome)
1. Open the site in Chrome
2. Tap the three-dot menu → **Add to Home screen** (or look for the install banner)
3. Tap **Install**

### Desktop (Chrome / Edge)
1. Open the site
2. Click the install icon in the address bar (looks like a monitor with a down arrow), or go to the browser menu → **Install Ledgerline**

After installation, the app opens in its own window with no browser chrome, and works completely offline. All data is saved privately on that device.

---

## Data — localStorage only

All ledger entries, budgets, categories and savings goals are stored in the browser's `localStorage` under the key `ledgerline-local-planner-v1`. Nothing is sent to any server.

**Back up regularly** using the **Export JSON** button in the footer. To move to a new device, export on the old device, import on the new one.

---

## Re-deploying after updates

When you receive a new `ledgerline-deploy.zip`:

1. Unzip it (it replaces the old `out/` folder)
2. Run `vercel --prod --yes` again from the same folder

The service worker version string is automatically stamped with a new timestamp on every build, so users' devices will pick up the update within 24 hours (or immediately on their next visit while online).

---

## Rebuilding from source

If you want to rebuild from the source code yourself:

```bash
# Install dependencies
npm install

# Build the static export
npm run build:pwa

# The ready-to-deploy output is in out/
```

Requirements: Node 18+, npm 9+. No database is needed — the app is fully client-side.
