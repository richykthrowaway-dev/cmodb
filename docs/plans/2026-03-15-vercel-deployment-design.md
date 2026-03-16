# Vercel Static Deployment Design

**Date:** 2026-03-15
**Status:** Approved

## Goal

Deploy CMO DB as a static site on Vercel's global CDN for fast, efficient delivery to online users. No server, no database, no build step.

## Architecture

```
User (browser)
  |
  v
Vercel Edge CDN (global, ~50ms worldwide)
  +-- index.html            (no-cache, always fresh on deploy)
  +-- app.js / charts.js    (1hr cache, SWR 24hr)
  +-- styles.css             (1hr cache, SWR 24hr)
  +-- data/*.json            (24hr cache, SWR 7 days)
  +-- data/details/*.json    (24hr cache, SWR 7 days)
```

- `server.js` is NOT used in production — Vercel serves everything as static files
- `server.js` remains for local development (`node server.js` on port 3000)
- `data/tips.json` ships as a static file — read-only in production
- No serverless functions, no database, no env vars

## Cache Strategy (vercel.json)

| Asset | max-age | stale-while-revalidate | Rationale |
|-------|---------|------------------------|-----------|
| index.html | 0 (must-revalidate) | — | Always get latest markup on deploy |
| app.js, charts.js | 1 hour | 24 hours | Code changes on deploy, SWR covers gap |
| styles.css | 1 hour | 24 hours | Same as JS |
| data/*.json (indexes) | 24 hours | 7 days | Static data, rarely changes |
| data/details/*.json | 24 hours | 7 days | Large files (up to 2.2MB), heavily cached |

Vercel applies automatic gzip/brotli compression (~65MB raw -> ~5MB transferred).

## Code Changes Required

### 1. Production-aware tip submission
- Detect production via `window.location.hostname !== 'localhost'`
- In production: change "Submit a Tip" button to "Suggest a Tip" linking to mailto or GitHub Issues
- In development: POST /api/tips continues to work as-is via server.js

### 2. vercel.json — already configured
- Cache headers for all asset types already in place
- No additional configuration needed

### 3. Git + GitHub
- Push repo to GitHub (no remote currently configured)
- Link GitHub repo to Vercel (auto-deploy on push)

### 4. No build step
- Vercel auto-detects "no framework" and serves files as static assets
- No package.json build script needed

## Deployment Workflow

1. Edit data locally (add tips, update JSON files)
2. `git commit && git push`
3. Vercel auto-deploys in ~30 seconds
4. CDN cache invalidates automatically on new deploy

## Local vs Production

| Feature | Local (server.js) | Production (Vercel) |
|---------|-------------------|---------------------|
| Static files | Node HTTP server | Vercel CDN edge |
| POST /api/tips | Writes to tips.json | Not available |
| Tip button | "Add Tip" (functional) | "Suggest a Tip" (mailto) |
| Cache | no-cache (dev) | Aggressive per vercel.json |
| Compression | gzip via zlib | Automatic brotli/gzip |

## Performance Expectations

- First load: ~200ms from nearest edge node
- Detail file load: ~100ms (cached at edge after first request)
- Zero cold starts (no serverless)
- Global coverage via Vercel's 50+ edge locations
