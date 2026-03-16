# Vercel Static Deployment — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Deploy CMO DB to Vercel as a static site with global CDN caching, tips read-only in production.

**Architecture:** All files served as static assets from Vercel's edge CDN. No serverless functions, no database. `server.js` used for local dev only. Production tip button redirects to GitHub Issues instead of POST.

**Tech Stack:** Vercel (hosting/CDN), GitHub (source), vanilla JS (no build step)

**Design Doc:** `docs/plans/2026-03-15-vercel-deployment-design.md`

---

### Task 1: Make tip submission production-aware

**Files:**
- Modify: `app.js:3353-3360` (renderTips — button HTML)
- Modify: `app.js:3405-3455` (submit button click handler + form submit)

**Step 1: Add production detection helper at top of renderTips**

At `app.js:3312`, inside the `renderTips()` function, after `const tips = await loadTips();`, add:

```javascript
const isProduction = location.hostname !== 'localhost' && location.hostname !== '127.0.0.1';
```

**Step 2: Change the button HTML to be environment-aware**

Replace the button at line ~3358:

```javascript
// Before:
<button class="tips-submit-btn" id="tipsSubmitBtn">
  <svg viewBox="0 0 24 24" width="16" height="16"><path fill="currentColor" d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
  Add a Tip
</button>

// After:
${isProduction
  ? `<a class="tips-submit-btn" href="https://github.com/richykthrowaway-5949/cmodb/issues/new?labels=tip&template=tip.md&title=%5BTip%5D+" target="_blank" rel="noopener">
      <svg viewBox="0 0 24 24" width="16" height="16"><path fill="currentColor" d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
      Suggest a Tip
    </a>`
  : `<button class="tips-submit-btn" id="tipsSubmitBtn">
      <svg viewBox="0 0 24 24" width="16" height="16"><path fill="currentColor" d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
      Add a Tip
    </button>`
}
```

**Step 3: Guard the submit button wiring**

The `getElementById('tipsSubmitBtn')` at line ~3405 already uses `?.addEventListener` (optional chaining), so it won't throw when the button doesn't exist in production. No change needed — just verify.

**Step 4: Test locally**

Run: `node server.js`
- Visit `http://localhost:3000`, go to Tips tab
- Verify "Add a Tip" button appears and opens the modal
- Verify adding a tip still works locally via POST

**Step 5: Commit**

```bash
git add app.js
git commit -m "feat: production-aware tip submission (GitHub Issues link in prod)"
```

---

### Task 2: Update .gitignore for deployment

**Files:**
- Modify: `.gitignore`

**Step 1: Ensure .gitignore allows all necessary files**

Current `.gitignore`:
```
node_modules/
package.json
package-lock.json
.claude/
```

Add `.env` exclusion (future-proofing) and ensure `scripts/` helper files are excluded from production but data files are included:

```
node_modules/
package.json
package-lock.json
.claude/
.env
```

Note: `data/` and `data/details/` must NOT be in `.gitignore` — Vercel needs them.

**Step 2: Commit**

```bash
git add .gitignore
git commit -m "chore: update .gitignore for Vercel deployment"
```

---

### Task 3: Verify vercel.json configuration

**Files:**
- Read: `vercel.json`

**Step 1: Verify the existing vercel.json is complete**

The file should have cache headers for:
- `index.html` → `max-age=0, must-revalidate`
- `app.js`, `charts.js` → `max-age=3600, stale-while-revalidate=86400`
- `styles.css` → `max-age=3600, stale-while-revalidate=86400`
- `data/details/*` → `max-age=86400, stale-while-revalidate=604800`
- `data/*.json` (static categories) → `max-age=86400, stale-while-revalidate=604800`

This is already configured. No changes needed.

**Step 2: Commit vercel.json if not already tracked**

```bash
git add vercel.json
git commit -m "chore: add Vercel deployment config with CDN cache headers"
```

---

### Task 4: Set up GitHub repository and push

**Step 1: Authenticate with GitHub CLI**

```bash
gh auth status
```

If not authenticated:
```bash
gh auth login --web
```
Follow the device code flow in browser.

**Step 2: Create GitHub repository**

```bash
gh repo create cmodb --public --source=. --remote=origin --push
```

This creates the repo, adds the remote, and pushes all commits in one command.

**Step 3: Verify push succeeded**

```bash
git remote -v
git log --oneline -3
gh repo view --web
```

---

### Task 5: Deploy to Vercel

**Step 1: Install Vercel CLI (if not installed)**

```bash
npm i -g vercel
```

**Step 2: Link project and deploy**

```bash
cd "C:/Users/PC/Downloads/CMO DB"
vercel --yes
```

This auto-detects "Other" framework (static), deploys immediately, and gives you a preview URL.

**Step 3: Set up production deployment**

```bash
vercel --prod
```

**Step 4: Verify the deployment**

- Visit the Vercel URL
- Check that the site loads
- Navigate through categories (Aircraft, Ships, etc.)
- Click a card to load detail data (verifies lazy-loading works)
- Go to Tips tab — verify "Suggest a Tip" button appears (not "Add a Tip")
- Check browser DevTools Network tab for Cache-Control headers on data files

**Step 5: Link GitHub for auto-deploy**

If not already linked via `gh repo create`:
```bash
vercel git connect
```

This enables automatic deploys on every `git push`.

---

### Task 6: Verify production performance

**Step 1: Test from browser DevTools**

Open the production URL, open DevTools > Network tab:
- Check that `data/aircraft.json` has `Cache-Control: public, max-age=86400`
- Check that `data/details/aircraft.json` loads with gzip/brotli encoding
- Check that `index.html` has `Cache-Control: public, max-age=0, must-revalidate`

**Step 2: Verify compression**

In Network tab, check Transfer Size vs Size for large files:
- `data/details/aircraft.json`: ~2.2MB raw should transfer as ~40-80KB compressed

**Step 3: Commit any final adjustments**

```bash
git add -A && git commit -m "chore: finalize Vercel deployment" && git push
```

Vercel auto-deploys on push. Done.
