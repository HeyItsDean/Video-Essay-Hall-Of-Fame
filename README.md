# Video Essay Hall of Fame (PWA)

A fast, minimal, offline-first web app for finding your next video essay.

## What you get (in this starter)
- **One search bar** (Fuse.js relevance ranking across title/channel/topic/tags/summary)
- **Filter chips** for Topic + Duration buckets
- **Two result layouts**: Cards vs Compact list
- **Watch flags**: Watched / Watch later / Favorite (persisted in IndexedDB via Dexie)
- **PWA + offline**: app shell + cached archive + runtime-cached thumbnails (Workbox via `vite-plugin-pwa`)
- **GitHub Pages friendly**: `base: "./"` + `HashRouter` (no server rewrites needed)

---

## Run locally (VS Code)
1. Install deps:
   ```bash
   npm install
   ```
2. Start dev server:
   ```bash
   npm run dev
   ```

## Build
```bash
npm run build
npm run preview
```

---

## Deploy to GitHub Pages (simple approach)
- Push this repo to GitHub.
- Build locally (`npm run build`).
- Deploy the `dist/` folder using your preferred GH Pages method (Actions or manual).

> Tip: if you use a GitHub Actions Pages workflow, keep `vite.config.ts` `base: "./"` (already set) so assets resolve correctly under any repo name.

---

## Data source
The app imports `public/archive.csv` into IndexedDB the first time it runs (and then uses the cached DB after that).

To update the archive:
- Replace `public/archive.csv`
- Then click **Reset** in the UI to re-import.

---

## Next upgrades (easy wins)
- Topic “More…” drawer (if you want the chip row shorter)
- Extra filters: year, format, channel size, view count ranges
- Export/import flags backup (JSON)
- Channel avatar fetching (YouTube API or scraping proxy)
