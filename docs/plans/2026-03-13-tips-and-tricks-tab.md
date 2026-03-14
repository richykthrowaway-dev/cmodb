# Tips & Tricks Tab Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a "Tips & Tricks" nav tab with a card grid of curated game tips and a mailto-based submission form for user suggestions.

**Architecture:** Static `data/tips.json` stores all published tips. The tab renders cards with a 150-char excerpt; clicking opens a scrollable modal for full content. A "Submit a Tip" button at the top opens a second modal with a simple form (name + tip body) that fires a `mailto:` link. All wired inside the existing `initEvents()` nav handler pattern in `app.js`.

**Tech Stack:** Vanilla JS, CSS (existing design system), no new dependencies.

---

### Task 1: Create `data/tips.json` with sample content

**Files:**
- Create: `data/tips.json`

**Step 1: Create the file with 3 sample tips**

```json
[
  {
    "id": 1,
    "category": "Tactics",
    "title": "Using Emissions Control (EMCON) Effectively",
    "body": "Emissions Control (EMCON) is one of the most powerful — and most overlooked — tools in CMO. When a unit is set to EMCON, it stops broadcasting radar and radio signals, making it invisible to enemy ESM sensors.\n\nWhy it matters: Modern warfare is largely about detection. The side that detects first, shoots first. If your ships or aircraft are broadcasting radar, enemy ESM platforms (aircraft, ships, satellites) will detect them at ranges far beyond your own radar coverage.\n\nHow to use it:\n1. Keep high-value units (carriers, command ships, SSBNs) on EMCON at all times unless actively needed.\n2. Use passive sensors (ESM, sonar) to build your picture without emitting.\n3. Only go active (radar on) when you need to prosecute a contact — and accept that you will now be detected.\n4. Aircraft performing CAP can stay on EMCON until they get a datalink track from an AWACS.\n\nCommon mistake: New players leave radar on everything at all times. This telegraphs your entire order of battle to the enemy within minutes of scenario start.",
    "image": null,
    "link": "https://www.matrixgames.com/forums/viewforum.php?f=10153"
  },
  {
    "id": 2,
    "category": "Aircraft",
    "title": "How to Set Up a CAP Station",
    "body": "A Combat Air Patrol (CAP) station is a defined patrol area where fighters orbit waiting to intercept incoming threats. Setting one up correctly in CMO makes a huge difference in how quickly your fighters respond.\n\nSteps:\n1. Select your fighter and assign a Patrol mission (Mission Editor > Add Mission > Patrol/CAP).\n2. Draw the patrol zone well forward of your assets — you want to intercept threats before they reach weapons release range.\n3. Set the patrol altitude high (25,000–40,000 ft) for maximum radar coverage and fuel efficiency.\n4. Assign at least 2 aircraft per station so one is always on station while the other refuels.\n5. Enable 'Maintain CAP' so the game automatically cycles replacements.\n\nTip: Position your CAP station so the fighters have a tail-wind when intercepting — this extends their effective range and shortens intercept time.",
    "image": null,
    "link": null
  },
  {
    "id": 3,
    "category": "Ships",
    "title": "Why Submarines Win: Staying Undetected",
    "body": "Submarines are the most powerful platforms in CMO when used correctly — and completely useless when used wrong. The single most important rule: never go fast.\n\nSpeed and noise: A submarine moving above 5–7 knots generates enormous cavitation noise, detectable by enemy sonar at long range. Stay below 5 knots when in contested waters.\n\nDepth: Use layer depth to your advantage. The thermocline (a temperature boundary layer in the ocean) refracts sound and creates a 'shadow zone' that hides you from surface sonars. Dive below the layer when evading, come above it when hunting surface ships.\n\nAttack procedure:\n1. Detect a surface contact passively (towed array or hull sonar).\n2. Slowly maneuver to a firing position — ideally within 10–15 nm.\n3. Fire torpedoes or anti-ship missiles and immediately go deep and change course.\n4. Sprint away at full speed after firing — you have ~2 minutes before the enemy locates you.\n\nCommon mistake: Using active sonar to find targets. Active sonar tells every ship and aircraft in 50nm exactly where you are.",
    "image": null,
    "link": null
  }
]
```

**Step 2: Verify file is valid JSON**

```bash
node -e "require('./data/tips.json'); console.log('OK')"
```

Expected: `OK`

**Step 3: Commit**

```bash
git add data/tips.json
git commit -m "feat: add tips.json with 3 sample tips"
```

---

### Task 2: Add CSS for Tips & Tricks tab

**Files:**
- Modify: `styles.css` (append after `.analytics-panel-hidden` block, before the `@media` block)

**Step 1: Add the CSS**

Append the following block in `styles.css` after the `.analytics-panel-hidden` rule and before the `@media (max-width: 768px)` block:

```css
/* ── Tips & Tricks ── */
.tips-view {
  padding: 0 16px;
}

.tips-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 0 16px;
  border-bottom: 1px solid var(--border);
  margin-bottom: 20px;
}

.tips-header h2 {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
}

.tips-submit-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  background: var(--accent);
  color: #fff;
  border: none;
  border-radius: var(--radius);
  padding: 8px 16px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: background var(--transition);
}

.tips-submit-btn:hover {
  background: var(--accent-hover, #3a8ee0);
}

.tips-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}

.tip-card {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 16px;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  gap: 8px;
  transition: background var(--transition), border-color var(--transition);
}

.tip-card:hover {
  background: var(--bg-card-hover);
  border-color: var(--accent);
}

.tip-category-badge {
  display: inline-block;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  padding: 2px 8px;
  border-radius: 20px;
  align-self: flex-start;
}

.tip-category-badge.tactics  { background: rgba(239,68,68,0.15);  color: #ef4444; }
.tip-category-badge.aircraft { background: rgba(74,158,255,0.15); color: #4a9eff; }
.tip-category-badge.ships    { background: rgba(34,197,94,0.15);  color: #22c55e; }
.tip-category-badge.weapons  { background: rgba(249,115,22,0.15); color: #f97316; }
.tip-category-badge.sensors  { background: rgba(168,85,247,0.15); color: #a855f7; }
.tip-category-badge.general  { background: rgba(148,163,184,0.15); color: #94a3b8; }

.tip-card-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
  line-height: 1.4;
}

.tip-card-excerpt {
  font-size: 12px;
  color: var(--text-secondary);
  line-height: 1.6;
  flex: 1;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 4;
  -webkit-box-orient: vertical;
}

.tip-card-footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  margin-top: 4px;
}

.tip-read-more {
  font-size: 12px;
  color: var(--accent);
  font-weight: 600;
}

/* Tip detail modal body */
.tip-modal-category {
  margin-bottom: 12px;
}

.tip-modal-body {
  font-size: 14px;
  color: var(--text-secondary);
  line-height: 1.8;
  white-space: pre-wrap;
  word-break: break-word;
}

.tip-modal-link {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin-top: 20px;
  padding: 8px 16px;
  background: var(--bg-input);
  border: 1px solid var(--border-light);
  border-radius: var(--radius);
  color: var(--accent);
  font-size: 13px;
  font-weight: 600;
  text-decoration: none;
  transition: background var(--transition);
}

.tip-modal-link:hover {
  background: var(--bg-card-hover);
}

/* Submit tip modal */
.submit-tip-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding-top: 8px;
}

.submit-tip-form label {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  display: block;
  margin-bottom: 4px;
}

.submit-tip-form input,
.submit-tip-form textarea {
  width: 100%;
  background: var(--bg-input);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 10px 12px;
  color: var(--text-primary);
  font-size: 13px;
  font-family: inherit;
  box-sizing: border-box;
  transition: border-color var(--transition);
}

.submit-tip-form input:focus,
.submit-tip-form textarea:focus {
  outline: none;
  border-color: var(--accent);
}

.submit-tip-form textarea {
  min-height: 180px;
  resize: vertical;
}

.submit-tip-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding-top: 4px;
}

.submit-tip-cancel {
  padding: 8px 16px;
  border-radius: var(--radius);
  border: 1px solid var(--border-light);
  background: transparent;
  color: var(--text-secondary);
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
}

.submit-tip-send {
  padding: 8px 16px;
  border-radius: var(--radius);
  border: none;
  background: var(--accent);
  color: #fff;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: background var(--transition);
}

.submit-tip-send:hover {
  background: var(--accent-hover, #3a8ee0);
}

@media (max-width: 900px) {
  .tips-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 600px) {
  .tips-grid {
    grid-template-columns: 1fr;
  }
  .tips-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }
}
```

**Step 2: Verify CSS parses without errors** — open browser, check devtools console shows no CSS errors.

**Step 3: Commit**

```bash
git add styles.css
git commit -m "feat: add Tips & Tricks CSS"
```

---

### Task 3: Add "Tips & Tricks" nav button to `index.html`

**Files:**
- Modify: `index.html` — add button after the analytics button (around line 81)

**Step 1: Add the nav button**

After the closing `</button>` of the analytics nav button, add:

```html
    <button class="nav-btn" data-category="tips">
      <svg viewBox="0 0 24 24" width="20" height="20"><path fill="currentColor" d="M9 21c0 .55.45 1 1 1h4c.55 0 1-.45 1-1v-1H9v1zm3-19C8.14 2 5 5.14 5 9c0 2.38 1.19 4.47 3 5.74V17c0 .55.45 1 1 1h6c.55 0 1-.45 1-1v-2.26c1.81-1.27 3-3.36 3-5.74 0-3.86-3.14-7-7-7zm2.85 11.1l-.85.6V16h-4v-2.3l-.85-.6A4.997 4.997 0 017 9c0-2.76 2.24-5 5-5s5 2.24 5 5c0 1.68-.82 3.17-2.15 4.1z"/></svg>
      Tips & Tricks
    </button>
```

**Step 2: Add the submit modal HTML**

Add this before the closing `</body>` tag (after the compare modal):

```html
  <!-- Tips & Tricks Submit Modal -->
  <div id="tipSubmitModal" class="modal hidden">
    <div class="modal-overlay"></div>
    <div class="modal-content">
      <button class="modal-close">&times;</button>
      <h2 class="modal-title">Submit a Tip or Trick</h2>
      <p style="font-size:13px;color:var(--text-secondary);margin:0 0 16px">Share your knowledge! The developer will review your submission and may add it to the site.</p>
      <div class="submit-tip-form" id="submitTipForm">
        <div>
          <label for="tipAuthorName">Your Name</label>
          <input type="text" id="tipAuthorName" placeholder="e.g. John S." maxlength="80">
        </div>
        <div>
          <label for="tipBody">Your Tip or Trick</label>
          <textarea id="tipBody" placeholder="Describe your tip in as much detail as you like..."></textarea>
        </div>
        <div class="submit-tip-actions">
          <button class="submit-tip-cancel" id="tipCancelBtn">Cancel</button>
          <button class="submit-tip-send" id="tipSendBtn">Send via Email</button>
        </div>
      </div>
    </div>
  </div>
```

**Step 3: Commit**

```bash
git add index.html
git commit -m "feat: add Tips & Tricks nav button and submit modal HTML"
```

---

### Task 4: Wire Tips tab logic in `app.js`

**Files:**
- Modify: `app.js`

This task has 3 sub-steps: (A) load tips data, (B) render the tips view, (C) wire up the nav handler and submit modal.

**Step 1: Add `loadTips()` helper**

Find the `loadDetails` function (around line 497) and add this immediately after it:

```javascript
  async function loadTips() {
    if (state._tipsCache) return state._tipsCache;
    try {
      const res = await fetch('data/tips.json');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      state._tipsCache = await res.json();
      return state._tipsCache;
    } catch (e) {
      console.error('Failed to load tips:', e);
      return [];
    }
  }
```

**Step 2: Add `renderTips()` function**

Find the `renderAnalytics` function and add this immediately before it:

```javascript
  // ── Tips & Tricks Rendering ──────────────
  async function renderTips() {
    const tips = await loadTips();
    const content = document.getElementById('content');
    const MAIL = 'tips@example.com'; // TODO: replace with real address

    content.className = 'content';
    content.innerHTML = `
      <div class="tips-view">
        <div class="tips-header">
          <h2>Tips &amp; Tricks</h2>
          <button class="tips-submit-btn" id="tipsSubmitBtn">
            <svg viewBox="0 0 24 24" width="16" height="16"><path fill="currentColor" d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
            Submit a Tip
          </button>
        </div>
        ${tips.length === 0
          ? '<p style="color:var(--text-secondary);padding:40px 0;text-align:center">No tips yet — be the first to submit one!</p>'
          : `<div class="tips-grid">${tips.map(tip => renderTipCard(tip)).join('')}</div>`
        }
      </div>`;

    // Wire tip card clicks → detail modal
    content.querySelectorAll('.tip-card').forEach(card => {
      card.addEventListener('click', () => {
        const id = parseInt(card.dataset.tipId, 10);
        const tip = tips.find(t => t.id === id);
        if (!tip) return;
        openTipDetail(tip);
      });
    });

    // Wire submit button → submit modal
    document.getElementById('tipsSubmitBtn')?.addEventListener('click', () => {
      document.getElementById('tipSubmitModal').classList.remove('hidden');
      document.getElementById('tipAuthorName').focus();
    });

    // Wire submit modal cancel + send
    document.getElementById('tipCancelBtn').onclick = () => {
      document.getElementById('tipSubmitModal').classList.add('hidden');
    };
    document.getElementById('tipSubmitModal').querySelector('.modal-overlay').onclick = () => {
      document.getElementById('tipSubmitModal').classList.add('hidden');
    };
    document.getElementById('tipSubmitModal').querySelector('.modal-close').onclick = () => {
      document.getElementById('tipSubmitModal').classList.add('hidden');
    };
    document.getElementById('tipSendBtn').onclick = () => {
      const name = document.getElementById('tipAuthorName').value.trim() || 'Anonymous';
      const body = document.getElementById('tipBody').value.trim();
      if (!body) {
        document.getElementById('tipBody').focus();
        return;
      }
      const subject = encodeURIComponent(`CMO DB Tip Submission from ${name}`);
      const bodyEnc = encodeURIComponent(`Name: ${name}\n\nTip:\n${body}`);
      window.location.href = `mailto:${MAIL}?subject=${subject}&body=${bodyEnc}`;
      document.getElementById('tipSubmitModal').classList.add('hidden');
    };
  }

  function renderTipCard(tip) {
    const cat = (tip.category || 'General').toLowerCase();
    const excerpt = tip.body.length > 150 ? tip.body.slice(0, 147) + '…' : tip.body;
    return `
      <div class="tip-card" data-tip-id="${tip.id}" tabindex="0" role="button" aria-label="Read tip: ${esc(tip.title)}">
        <span class="tip-category-badge ${cat}">${esc(tip.category || 'General')}</span>
        <div class="tip-card-title">${esc(tip.title)}</div>
        <div class="tip-card-excerpt">${esc(excerpt)}</div>
        <div class="tip-card-footer"><span class="tip-read-more">Read More →</span></div>
      </div>`;
  }

  function openTipDetail(tip) {
    const cat = (tip.category || 'General').toLowerCase();
    const linkHtml = tip.link
      ? `<a class="tip-modal-link" href="${esc(tip.link)}" target="_blank" rel="noopener">
           <svg viewBox="0 0 24 24" width="14" height="14"><path fill="currentColor" d="M19 19H5V5h7V3H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7h-2v7zM14 3v2h3.59l-9.83 9.83 1.41 1.41L19 6.41V10h2V3h-7z"/></svg>
           Open Reference Link
         </a>`
      : '';
    const imgHtml = tip.image
      ? `<img src="${esc(tip.image)}" alt="${esc(tip.title)}" style="width:100%;border-radius:8px;margin-bottom:16px">`
      : '';
    const modalBody = document.getElementById('modalBody');
    modalBody.innerHTML = `
      <div class="tip-modal-category">
        <span class="tip-category-badge ${cat}">${esc(tip.category || 'General')}</span>
      </div>
      <h2 class="detail-name" style="margin-bottom:16px">${esc(tip.title)}</h2>
      ${imgHtml}
      <div class="tip-modal-body">${esc(tip.body)}</div>
      ${linkHtml}`;
    document.getElementById('detailModal').classList.remove('hidden');
    document.getElementById('detailModal').querySelector('.modal-close').focus();
  }
```

**Step 3: Wire the nav handler**

In `initEvents()`, find the block `if (cat === 'analytics') {` and add a new block immediately before it:

```javascript
        // Tips & Tricks tab
        if (cat === 'tips') {
          document.querySelector('.toolbar').classList.add('hidden');
          renderTips();
          return;
        }
```

**Step 4: Verify no console errors**

Open browser, click Tips & Tricks tab. Expected: 3 tip cards render, no JS errors.

**Step 5: Commit**

```bash
git add app.js
git commit -m "feat: implement Tips & Tricks tab with card grid and mailto submit form"
```

---

### Task 5: Keyboard accessibility for tip cards

**Files:**
- Modify: `app.js` — inside `renderTips()`, after the card click listener

**Step 1: Add keyboard handler**

After the `content.querySelectorAll('.tip-card').forEach(card => { ... })` block, add:

```javascript
    // Keyboard: Enter/Space opens tip detail
    content.querySelectorAll('.tip-card').forEach(card => {
      card.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          card.click();
        }
      });
    });
```

**Step 2: Commit**

```bash
git add app.js
git commit -m "feat: add keyboard accessibility for tip cards"
```

---

### Task 6: Final verification pass

**Step 1: Visual check — tips tab**
- Open browser, click Tips & Tricks
- Verify 3 cards render with correct category badges, titles, and excerpts

**Step 2: Visual check — tip modal**
- Click a card → detail modal opens with full body text scrollable
- Click × or overlay → modal closes

**Step 3: Visual check — submit flow**
- Click "Submit a Tip" button
- Fill in name + tip text
- Click "Send via Email" → mailto opens pre-filled
- Click Cancel → modal closes without action

**Step 4: Verify toolbar restored on tab switch**
- Click Analytics tab → no toolbar
- Click Aircraft tab → toolbar reappears

**Step 5: Verify empty body validation**
- Open submit modal, leave body empty, click Send → focus jumps to textarea, no mailto fires

**Step 6: Final commit (if any touch-ups needed)**

```bash
git add -p
git commit -m "fix: tips tab polish"
```
