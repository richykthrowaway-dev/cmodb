# CMO DB Visualizations Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add 10 D3.js-powered visualizations — 6 per-item charts in detail modals + 4 aggregate charts in a new Analytics tab.

**Architecture:** All chart rendering lives in a new `charts.js` file that exports pure functions receiving a container element + data and rendering D3 SVGs into it. `app.js` wires these into the existing detail modal flow and a new Analytics tab. D3 v7 is loaded async via CDN on first chart need.

**Tech Stack:** D3.js v7 (CDN), vanilla JS, SVG rendering, existing CSS variable system for dark theme.

---

## Task 1: D3 Lazy Loader + charts.js Scaffold

**Files:**
- Modify: `index.html` (add D3 script tag + Analytics nav button)
- Create: `charts.js` (empty scaffold with D3 ready gate)
- Modify: `app.js:1-22` (add `d3Ready` state field, analytics state)

**Step 1: Add D3 CDN and charts.js to index.html**

In `index.html`, before the closing `</body>` tag (line 154), add the D3 script and charts.js BEFORE app.js:

```html
<script src="https://d3js.org/d3.v7.min.js" defer></script>
<script src="charts.js"></script>
<script src="app.js"></script>
```

Remove the existing `<script src="app.js"></script>` on line 153.

Also add the Analytics nav button after the Radar button (after line 76):

```html
<button class="nav-btn" data-category="analytics">
  <svg viewBox="0 0 24 24" width="20" height="20"><path fill="currentColor" d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z"/></svg>
  Analytics
</button>
```

**Step 2: Create charts.js scaffold**

Create `charts.js` with a module structure and D3 readiness check:

```javascript
/* ============================================
   CMO DB — Chart Visualizations (D3.js)
   ============================================ */

const Charts = (() => {
  // ── Shared constants ──
  const COLORS = {
    accent: '#4a9eff',
    air: '#4a9eff',
    surface: '#4caf50',
    land: '#c6893a',
    sub: '#9c27b0',
    radar: '#4a9eff',
    esm: '#ffc107',
    sonar: '#00bcd4',
    eo: '#ff9800',
    visual: '#8bc34a',
    ir: '#f44336',
    grid: 'rgba(255,255,255,0.08)',
    text: 'rgba(255,255,255,0.7)',
    textBright: 'rgba(255,255,255,0.95)',
  };

  function d3Ready() {
    return typeof d3 !== 'undefined';
  }

  // Shared tooltip singleton
  let _tooltip = null;
  function getTooltip() {
    if (!_tooltip) {
      _tooltip = document.createElement('div');
      _tooltip.className = 'chart-tooltip';
      document.body.appendChild(_tooltip);
    }
    return _tooltip;
  }

  function showTooltip(evt, html) {
    const tip = getTooltip();
    tip.innerHTML = html;
    tip.style.display = 'block';
    tip.style.left = (evt.pageX + 12) + 'px';
    tip.style.top = (evt.pageY - 12) + 'px';
  }

  function hideTooltip() {
    const tip = getTooltip();
    tip.style.display = 'none';
  }

  // ── Escape HTML ──
  function esc(s) { const d = document.createElement('div'); d.textContent = s; return d.innerHTML; }

  // ── Per-Item Charts ──

  function renderRadarChart(container, item, cat, allItems) {
    // Task 2
  }

  function renderRangeRings(container, item) {
    // Task 3
  }

  function renderSensorBars(container, item) {
    // Task 4
  }

  function renderSignaturePolar(container, item) {
    // Task 5
  }

  function renderPerfCurves(container, item) {
    // Task 6
  }

  function renderLoadoutAnalysis(container, item) {
    // Task 7
  }

  // ── Aggregate Charts ──

  function renderScatter(container, data, cat) {
    // Task 9
  }

  function renderDonut(container, data, cat) {
    // Task 9
  }

  function renderTimeline(container, data, cat) {
    // Task 9
  }

  function renderDomainHeatmap(container, data) {
    // Task 9
  }

  return {
    d3Ready,
    renderRadarChart,
    renderRangeRings,
    renderSensorBars,
    renderSignaturePolar,
    renderPerfCurves,
    renderLoadoutAnalysis,
    renderScatter,
    renderDonut,
    renderTimeline,
    renderDomainHeatmap,
  };
})();
```

**Step 3: Add analytics state to app.js**

In `app.js:8-22`, inside the `state` object, add:

```javascript
analytics: { category: 'aircraft' },  // Analytics tab state
chartCache: new Map(),                 // item ID -> rendered chart DOM nodes
```

**Step 4: Add chart tooltip CSS to styles.css**

Append to `styles.css`:

```css
/* ── Chart Styles ── */
.chart-tooltip {
  display: none;
  position: absolute;
  z-index: 10000;
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 8px 12px;
  font-size: 12px;
  color: var(--text-primary);
  pointer-events: none;
  max-width: 260px;
  box-shadow: 0 4px 16px rgba(0,0,0,0.4);
}

.chart-container {
  width: 100%;
  margin: 8px 0;
}

.chart-container svg {
  width: 100%;
  height: auto;
}

.chart-legend {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 16px;
  padding: 8px 0;
  font-size: 11px;
  color: var(--text-secondary);
}

.chart-legend-item {
  display: flex;
  align-items: center;
  gap: 4px;
}

.chart-legend-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}
```

**Step 5: Verify syntax and page loads**

Run: `node -c app.js && node -c charts.js`
Expected: No errors.

Reload the live site. Verify the Analytics tab button appears in nav. Verify D3 is loaded (`typeof d3` in console should return `'object'`).

**Step 6: Commit**

```bash
git add index.html charts.js app.js styles.css
git commit -m "feat: scaffold charts.js, add D3 CDN, Analytics nav tab"
```

---

## Task 2: Radar/Spider Chart (Aircraft + Ships Detail)

**Files:**
- Modify: `charts.js` — implement `renderRadarChart()`
- Modify: `app.js:1369` — call chart render after `modalBody.innerHTML = html`

**Step 1: Implement renderRadarChart in charts.js**

Replace the stub in `charts.js`:

```javascript
function renderRadarChart(container, item, cat, allItems) {
  if (!d3Ready()) return;
  container.innerHTML = '';

  let axes;
  if (cat === 'aircraft') {
    axes = [
      { key: 'maxSpeed', label: 'Speed' },
      { key: 'agility', label: 'Agility' },
      { key: 'climbRate', label: 'Climb' },
      { key: 'maxPayload', label: 'Payload' },
      { key: 'maxWeight', label: 'Max Weight' },
    ];
  } else if (cat === 'ships') {
    axes = [
      { key: 'maxSpeed', label: 'Speed' },
      { key: 'displacementFull', label: 'Displacement' },
      { key: 'beam', label: 'Beam' },
      { key: 'draft', label: 'Draft' },
      { key: 'sensorCount', label: 'Sensors' },
      { key: 'weaponCount', label: 'Weapons' },
    ];
  } else return;

  // Normalize 0-1 against max in allItems
  const maxVals = {};
  axes.forEach(a => {
    maxVals[a.key] = Math.max(...allItems.map(i => parseFloat(i[a.key]) || 0), 1);
  });

  const values = axes.map(a => ({
    label: a.label,
    value: (parseFloat(item[a.key]) || 0) / maxVals[a.key],
    raw: parseFloat(item[a.key]) || 0,
  }));

  const W = 300, H = 300, cx = W / 2, cy = H / 2, R = 110;
  const n = values.length;
  const angleSlice = (2 * Math.PI) / n;

  const svg = d3.select(container).append('svg')
    .attr('viewBox', `0 0 ${W} ${H}`)
    .attr('preserveAspectRatio', 'xMidYMid meet');

  const g = svg.append('g').attr('transform', `translate(${cx},${cy})`);

  // Grid circles
  [0.25, 0.5, 0.75, 1].forEach(level => {
    g.append('circle')
      .attr('r', R * level)
      .attr('fill', 'none')
      .attr('stroke', COLORS.grid)
      .attr('stroke-width', 1);
  });

  // Axis lines + labels
  values.forEach((d, i) => {
    const angle = angleSlice * i - Math.PI / 2;
    const x = R * Math.cos(angle);
    const y = R * Math.sin(angle);
    g.append('line')
      .attr('x1', 0).attr('y1', 0)
      .attr('x2', x).attr('y2', y)
      .attr('stroke', COLORS.grid).attr('stroke-width', 1);
    g.append('text')
      .attr('x', (R + 18) * Math.cos(angle))
      .attr('y', (R + 18) * Math.sin(angle))
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'central')
      .attr('fill', COLORS.text)
      .attr('font-size', '10px')
      .text(d.label);
  });

  // Data polygon
  const points = values.map((d, i) => {
    const angle = angleSlice * i - Math.PI / 2;
    return [R * d.value * Math.cos(angle), R * d.value * Math.sin(angle)];
  });

  g.append('polygon')
    .attr('points', points.map(p => p.join(',')).join(' '))
    .attr('fill', COLORS.accent)
    .attr('fill-opacity', 0.25)
    .attr('stroke', COLORS.accent)
    .attr('stroke-width', 2);

  // Data dots with tooltip
  values.forEach((d, i) => {
    const angle = angleSlice * i - Math.PI / 2;
    const x = R * d.value * Math.cos(angle);
    const y = R * d.value * Math.sin(angle);
    g.append('circle')
      .attr('cx', x).attr('cy', y).attr('r', 4)
      .attr('fill', COLORS.accent)
      .attr('stroke', '#fff').attr('stroke-width', 1.5)
      .style('cursor', 'pointer')
      .on('mouseover', (evt) => showTooltip(evt, `<b>${esc(d.label)}</b><br>${d.raw.toLocaleString()}`))
      .on('mouseout', hideTooltip);
  });
}
```

**Step 2: Wire into showDetail in app.js**

After line 1369 (`modalBody.innerHTML = html;`), add a chart container and render call. Insert these lines:

```javascript
// Render per-item charts
if (Charts.d3Ready() && (cat === 'aircraft' || cat === 'ships')) {
  const radarDiv = document.createElement('div');
  radarDiv.className = 'detail-section';
  radarDiv.innerHTML = '<div class="detail-section-title">Performance Profile</div><div class="detail-section-body"><div class="chart-container" id="detailRadarChart"></div></div>';
  modalBody.appendChild(radarDiv);
  const allItems = state.data[cat] || [];
  Charts.renderRadarChart(document.getElementById('detailRadarChart'), d, cat, allItems);
}
```

**Step 3: Verify**

Reload the site. Click any aircraft card. Scroll down in the detail modal. Verify a radar/spider chart appears with 5 axes (Speed, Agility, Climb, Payload, Max Weight). Hover a dot to see the tooltip with the raw value.

**Step 4: Commit**

```bash
git add charts.js app.js
git commit -m "feat: add radar/spider chart in aircraft & ship detail modals"
```

---

## Task 3: Range Ring Diagram (Weapons Detail)

**Files:**
- Modify: `charts.js` — implement `renderRangeRings()`
- Modify: `app.js` — add range ring container for weapons in showDetail

**Step 1: Implement renderRangeRings in charts.js**

Replace the stub:

```javascript
function renderRangeRings(container, item) {
  if (!d3Ready()) return;
  container.innerHTML = '';

  const domains = [
    { key: 'airRange', minKey: 'airRangeMin', label: 'Air', color: COLORS.air },
    { key: 'surfaceRange', minKey: 'surfaceRangeMin', label: 'Surface', color: COLORS.surface },
    { key: 'landRange', minKey: 'landRangeMin', label: 'Land', color: COLORS.land },
    { key: 'subRange', minKey: 'subRangeMin', label: 'Sub', color: COLORS.sub },
  ].filter(d => item[d.key]);

  if (domains.length === 0) return;

  const maxRange = Math.max(...domains.map(d => item[d.key]));
  const W = 400, H = 220, cx = W / 2, cy = H - 20;
  const maxR = 160;
  const scale = d3.scaleLinear().domain([0, maxRange]).range([0, maxR]);

  const svg = d3.select(container).append('svg')
    .attr('viewBox', `0 0 ${W} ${H}`)
    .attr('preserveAspectRatio', 'xMidYMid meet');

  const g = svg.append('g').attr('transform', `translate(${cx},${cy})`);

  // Grid arcs
  const gridSteps = 4;
  for (let i = 1; i <= gridSteps; i++) {
    const r = maxR * (i / gridSteps);
    const rangeVal = Math.round(maxRange * (i / gridSteps));
    g.append('path')
      .attr('d', d3.arc()({ innerRadius: r - 0.5, outerRadius: r, startAngle: -Math.PI / 2, endAngle: Math.PI / 2 }))
      .attr('fill', COLORS.grid);
    g.append('text')
      .attr('x', r + 4).attr('y', 4)
      .attr('fill', COLORS.text).attr('font-size', '9px')
      .text(rangeVal + ' km');
  }

  // Domain arcs
  const bandWidth = Math.PI / (domains.length + 1);
  domains.forEach((dom, i) => {
    const startAngle = -Math.PI / 2 + bandWidth * i + bandWidth * 0.1;
    const endAngle = startAngle + bandWidth * 0.8;
    const outerR = scale(item[dom.key]);
    const innerR = item[dom.minKey] ? scale(item[dom.minKey]) : 0;

    g.append('path')
      .attr('d', d3.arc()({ innerRadius: innerR, outerRadius: outerR, startAngle, endAngle }))
      .attr('fill', dom.color)
      .attr('fill-opacity', 0.5)
      .attr('stroke', dom.color)
      .attr('stroke-width', 1.5)
      .style('cursor', 'pointer')
      .on('mouseover', (evt) => {
        const minR = item[dom.minKey] || 0;
        showTooltip(evt, `<b>${esc(dom.label)}</b><br>Range: ${minR}–${item[dom.key]} km`);
      })
      .on('mouseout', hideTooltip);

    // Label
    const midAngle = (startAngle + endAngle) / 2;
    const labelR = outerR + 12;
    g.append('text')
      .attr('x', labelR * Math.sin(midAngle))
      .attr('y', -labelR * Math.cos(midAngle))
      .attr('text-anchor', 'middle')
      .attr('fill', dom.color)
      .attr('font-size', '10px')
      .attr('font-weight', 'bold')
      .text(dom.label);
  });

  // Origin dot
  g.append('circle').attr('r', 3).attr('fill', COLORS.textBright);
}
```

**Step 2: Wire into showDetail for weapons**

In app.js, in the chart-rendering section after `modalBody.innerHTML = html`, add:

```javascript
if (Charts.d3Ready() && cat === 'weapons') {
  const ringDiv = document.createElement('div');
  ringDiv.className = 'detail-section';
  ringDiv.innerHTML = '<div class="detail-section-title">Engagement Ranges</div><div class="detail-section-body"><div class="chart-container" id="detailRangeRings"></div></div>';
  modalBody.appendChild(ringDiv);
  Charts.renderRangeRings(document.getElementById('detailRangeRings'), d);
}
```

**Step 3: Verify**

Click a weapon with multiple ranges (e.g. a bomb with air+land, or a torpedo with surface+sub). Verify arcs appear colored by domain. Hover to see range tooltip.

**Step 4: Commit**

```bash
git add charts.js app.js
git commit -m "feat: add range ring diagram in weapon detail modals"
```

---

## Task 4: Sensor/Weapon Bars (Aircraft + Ships Detail)

**Files:**
- Modify: `charts.js` — implement `renderSensorBars()`
- Modify: `app.js` — add sensor bars container in showDetail

**Step 1: Implement renderSensorBars in charts.js**

Replace the stub:

```javascript
function renderSensorBars(container, item) {
  if (!d3Ready() || !item.sensors || item.sensors.length === 0) return;
  container.innerHTML = '';

  const sensors = item.sensors.filter(s => s.rangeMax > 0);
  if (sensors.length === 0) return;

  const typeColor = (type) => {
    const t = (type || '').toLowerCase();
    if (t.includes('radar')) return COLORS.radar;
    if (t.includes('esm') || t.includes('ecm') || t.includes('rwr')) return COLORS.esm;
    if (t.includes('sonar')) return COLORS.sonar;
    if (t.includes('eo') || t.includes('visual') || t.includes('ir') || t.includes('tv')) return COLORS.eo;
    return COLORS.text;
  };

  const maxRange = Math.max(...sensors.map(s => s.rangeMax));
  const barH = 22, gap = 4, labelW = 140, pad = 8;
  const W = 500;
  const H = pad * 2 + sensors.length * (barH + gap);
  const barW = W - labelW - pad * 2;
  const scale = d3.scaleLinear().domain([0, maxRange]).range([0, barW]);

  const svg = d3.select(container).append('svg')
    .attr('viewBox', `0 0 ${W} ${H}`)
    .attr('preserveAspectRatio', 'xMidYMid meet');

  sensors.forEach((s, i) => {
    const y = pad + i * (barH + gap);
    const color = typeColor(s.type);
    const w = scale(s.rangeMax);

    // Label
    svg.append('text')
      .attr('x', labelW - 4).attr('y', y + barH / 2)
      .attr('text-anchor', 'end')
      .attr('dominant-baseline', 'central')
      .attr('fill', COLORS.text)
      .attr('font-size', '10px')
      .text(s.name.length > 20 ? s.name.substring(0, 18) + '...' : s.name);

    // Bar background
    svg.append('rect')
      .attr('x', labelW).attr('y', y)
      .attr('width', barW).attr('height', barH)
      .attr('fill', COLORS.grid).attr('rx', 3);

    // Bar fill
    svg.append('rect')
      .attr('x', labelW).attr('y', y)
      .attr('width', w).attr('height', barH)
      .attr('fill', color).attr('fill-opacity', 0.6)
      .attr('rx', 3)
      .style('cursor', 'pointer')
      .on('mouseover', (evt) => showTooltip(evt, `<b>${esc(s.name)}</b><br>${esc(s.role || s.type)}<br>Range: ${s.rangeMax} km`))
      .on('mouseout', hideTooltip);

    // Range label
    svg.append('text')
      .attr('x', labelW + w + 4).attr('y', y + barH / 2)
      .attr('dominant-baseline', 'central')
      .attr('fill', COLORS.textBright)
      .attr('font-size', '9px')
      .text(s.rangeMax + ' km');
  });
}
```

**Step 2: Wire into showDetail for aircraft/ships**

Add after the radar chart block in app.js:

```javascript
if (Charts.d3Ready() && (cat === 'aircraft' || cat === 'ships') && d.sensors && d.sensors.length > 0) {
  const sensorDiv = document.createElement('div');
  sensorDiv.className = 'detail-section';
  sensorDiv.innerHTML = '<div class="detail-section-title">Sensor Ranges</div><div class="detail-section-body"><div class="chart-container" id="detailSensorBars"></div></div>';
  modalBody.appendChild(sensorDiv);
  Charts.renderSensorBars(document.getElementById('detailSensorBars'), d);
}
```

**Step 3: Verify**

Click an aircraft card. Scroll to "Sensor Ranges" section. Verify horizontal bars colored by type (blue for Radar, yellow for ESM, etc.). Hover for tooltip.

**Step 4: Commit**

```bash
git add charts.js app.js
git commit -m "feat: add sensor range bars in aircraft & ship detail modals"
```

---

## Task 5: Signature Polar Plot (Aircraft, Ships, Facilities Detail)

**Files:**
- Modify: `charts.js` — implement `renderSignaturePolar()`
- Modify: `app.js` — add signature polar container in showDetail

**Step 1: Implement renderSignaturePolar in charts.js**

Replace the stub:

```javascript
function renderSignaturePolar(container, item) {
  if (!d3Ready() || !item.signatures || item.signatures.length === 0) return;
  container.innerHTML = '';

  // Group signatures by detection method
  const groups = {
    'Visual': { det: null, cls: null, color: COLORS.visual },
    'Infrared': { det: null, cls: null, color: COLORS.ir },
    'Radar E-M': { det: null, cls: null, color: COLORS.radar },
  };

  item.signatures.forEach(s => {
    const t = s.type || '';
    if (t.includes('Visual') && t.includes('Detection')) groups['Visual'].det = s;
    else if (t.includes('Visual') && t.includes('Classification')) groups['Visual'].cls = s;
    else if (t.includes('Infrared') && t.includes('Detection')) groups['Infrared'].det = s;
    else if (t.includes('Infrared') && t.includes('Classification')) groups['Infrared'].cls = s;
    else if (t.includes('E-M') || (t.includes('Radar') && !t.includes('A-D'))) groups['Radar E-M'].det = s;
  });

  const dirs = ['front', 'side', 'rear', 'top'];
  const dirAngles = [0, Math.PI / 2, Math.PI, 3 * Math.PI / 2]; // top, right, bottom, left
  const dirLabels = ['Front', 'Side', 'Rear', 'Top'];

  // Find global max for scale
  let globalMax = 0;
  Object.values(groups).forEach(g => {
    if (g.det) dirs.forEach(d => { globalMax = Math.max(globalMax, g.det[d] || 0); });
  });
  if (globalMax === 0) return;

  const W = 320, H = 320, cx = W / 2, cy = H / 2, R = 110;

  const svg = d3.select(container).append('svg')
    .attr('viewBox', `0 0 ${W} ${H}`)
    .attr('preserveAspectRatio', 'xMidYMid meet');

  const g = svg.append('g').attr('transform', `translate(${cx},${cy})`);

  // Grid circles
  [0.25, 0.5, 0.75, 1].forEach(level => {
    g.append('circle')
      .attr('r', R * level)
      .attr('fill', 'none').attr('stroke', COLORS.grid).attr('stroke-width', 1);
  });

  // Direction labels
  dirLabels.forEach((label, i) => {
    const angle = dirAngles[i] - Math.PI / 2;
    g.append('text')
      .attr('x', (R + 16) * Math.cos(angle))
      .attr('y', (R + 16) * Math.sin(angle))
      .attr('text-anchor', 'middle').attr('dominant-baseline', 'central')
      .attr('fill', COLORS.text).attr('font-size', '10px')
      .text(label);
  });

  // Signature polygons (detection only — cleaner)
  Object.entries(groups).forEach(([name, grp]) => {
    if (!grp.det) return;
    const pts = dirs.map((d, i) => {
      const val = (grp.det[d] || 0) / globalMax;
      const angle = dirAngles[i] - Math.PI / 2;
      return [R * val * Math.cos(angle), R * val * Math.sin(angle)];
    });

    g.append('polygon')
      .attr('points', pts.map(p => p.join(',')).join(' '))
      .attr('fill', grp.color).attr('fill-opacity', 0.15)
      .attr('stroke', grp.color).attr('stroke-width', 2)
      .style('cursor', 'pointer')
      .on('mouseover', (evt) => {
        const vals = dirs.map(d => `${d}: ${grp.det[d]} km`).join('<br>');
        showTooltip(evt, `<b>${esc(name)} Detection</b><br>${vals}`);
      })
      .on('mouseout', hideTooltip);
  });

  // Legend
  const legend = d3.select(container).append('div').attr('class', 'chart-legend');
  Object.entries(groups).forEach(([name, grp]) => {
    if (!grp.det) return;
    const item = legend.append('span').attr('class', 'chart-legend-item');
    item.append('span').attr('class', 'chart-legend-dot').style('background', grp.color);
    item.append('span').text(name);
  });
}
```

**Step 2: Wire into showDetail**

Add in the chart section for aircraft/ships + facilities:

```javascript
if (Charts.d3Ready() && d.signatures && d.signatures.length > 0) {
  const sigDiv = document.createElement('div');
  sigDiv.className = 'detail-section';
  sigDiv.innerHTML = '<div class="detail-section-title">Signature Profile</div><div class="detail-section-body"><div class="chart-container" id="detailSigPolar"></div></div>';
  modalBody.appendChild(sigDiv);
  Charts.renderSignaturePolar(document.getElementById('detailSigPolar'), d);
}
```

**Step 3: Verify**

Click an aircraft (e.g. F-16). Verify a polar plot with 3 overlaid polygons (Visual=green, IR=red, Radar=blue). Verify IR rear lobe is much larger than front (exhaust plume effect). Hover for directional values.

**Step 4: Commit**

```bash
git add charts.js app.js
git commit -m "feat: add signature polar plot in detail modals"
```

---

## Task 6: Performance Curves (Aircraft + Ships Detail)

**Files:**
- Modify: `charts.js` — implement `renderPerfCurves()`
- Modify: `app.js` — add perf curves container

**Step 1: Implement renderPerfCurves in charts.js**

Replace the stub:

```javascript
function renderPerfCurves(container, item) {
  if (!d3Ready()) return;
  const perf = item.propulsion?.performances;
  if (!perf || perf.length === 0) return;
  container.innerHTML = '';

  const isAircraft = perf[0].altBand != null;

  if (isAircraft) {
    // Group by altitude band
    const bands = {};
    perf.forEach(p => {
      const b = p.altBand || 1;
      if (!bands[b]) bands[b] = [];
      bands[b].push(p);
    });
    const bandKeys = Object.keys(bands).sort((a, b) => a - b);
    const bandColors = ['#4a9eff', '#ffc107', '#f44336', '#4caf50'];

    const allSpeeds = perf.map(p => p.speed);
    const allConsumption = perf.map(p => p.consumption);

    const W = 420, H = 240, pad = { top: 20, right: 20, bottom: 35, left: 50 };
    const plotW = W - pad.left - pad.right;
    const plotH = H - pad.top - pad.bottom;

    const xScale = d3.scaleLinear().domain([0, Math.max(...allSpeeds) * 1.05]).range([0, plotW]);
    const yScale = d3.scaleLinear().domain([0, Math.max(...allConsumption) * 1.1]).range([plotH, 0]);

    const svg = d3.select(container).append('svg')
      .attr('viewBox', `0 0 ${W} ${H}`)
      .attr('preserveAspectRatio', 'xMidYMid meet');

    const g = svg.append('g').attr('transform', `translate(${pad.left},${pad.top})`);

    // Grid
    const yTicks = yScale.ticks(5);
    yTicks.forEach(t => {
      g.append('line')
        .attr('x1', 0).attr('x2', plotW)
        .attr('y1', yScale(t)).attr('y2', yScale(t))
        .attr('stroke', COLORS.grid);
      g.append('text')
        .attr('x', -6).attr('y', yScale(t))
        .attr('text-anchor', 'end').attr('dominant-baseline', 'central')
        .attr('fill', COLORS.text).attr('font-size', '9px')
        .text(t);
    });

    // X axis label
    svg.append('text')
      .attr('x', W / 2).attr('y', H - 4)
      .attr('text-anchor', 'middle')
      .attr('fill', COLORS.text).attr('font-size', '10px')
      .text('Speed (kt)');

    // Y axis label
    svg.append('text')
      .attr('transform', `translate(12,${H / 2}) rotate(-90)`)
      .attr('text-anchor', 'middle')
      .attr('fill', COLORS.text).attr('font-size', '10px')
      .text('Fuel (kg/hr)');

    // Lines per altitude band
    const line = d3.line()
      .x(d => xScale(d.speed))
      .y(d => yScale(d.consumption))
      .curve(d3.curveMonotoneX);

    bandKeys.forEach((bk, i) => {
      const data = bands[bk].sort((a, b) => a.speed - b.speed);
      const color = bandColors[i % bandColors.length];
      const altLabel = data[0].altMin != null
        ? `${Math.round(data[0].altMin / 304.8) * 1000}–${Math.round(data[0].altMax / 304.8) * 1000} ft`
        : `Band ${bk}`;

      g.append('path')
        .datum(data)
        .attr('d', line)
        .attr('fill', 'none')
        .attr('stroke', color)
        .attr('stroke-width', 2);

      // Dots
      data.forEach(p => {
        g.append('circle')
          .attr('cx', xScale(p.speed)).attr('cy', yScale(p.consumption))
          .attr('r', 3).attr('fill', color)
          .style('cursor', 'pointer')
          .on('mouseover', (evt) => showTooltip(evt, `<b>${altLabel}</b><br>Speed: ${p.speed} kt<br>Fuel: ${p.consumption} kg/hr`))
          .on('mouseout', hideTooltip);
      });
    });

    // Legend
    const legend = d3.select(container).append('div').attr('class', 'chart-legend');
    bandKeys.forEach((bk, i) => {
      const data = bands[bk];
      const altLabel = data[0].altMin != null
        ? `${Math.round(data[0].altMin)}–${Math.round(data[0].altMax)} m`
        : `Band ${bk}`;
      const el = legend.append('span').attr('class', 'chart-legend-item');
      el.append('span').attr('class', 'chart-legend-dot').style('background', bandColors[i % bandColors.length]);
      el.append('span').text(altLabel);
    });

  } else {
    // Ship: simple speed vs consumption
    const data = perf.sort((a, b) => a.speed - b.speed);
    const W = 420, H = 200, pad = { top: 20, right: 20, bottom: 35, left: 50 };
    const plotW = W - pad.left - pad.right;
    const plotH = H - pad.top - pad.bottom;

    const xScale = d3.scaleLinear().domain([0, Math.max(...data.map(d => d.speed)) * 1.05]).range([0, plotW]);
    const yScale = d3.scaleLinear().domain([0, Math.max(...data.map(d => d.consumption)) * 1.1]).range([plotH, 0]);

    const svg = d3.select(container).append('svg')
      .attr('viewBox', `0 0 ${W} ${H}`)
      .attr('preserveAspectRatio', 'xMidYMid meet');

    const g = svg.append('g').attr('transform', `translate(${pad.left},${pad.top})`);

    // Grid
    yScale.ticks(4).forEach(t => {
      g.append('line').attr('x1', 0).attr('x2', plotW).attr('y1', yScale(t)).attr('y2', yScale(t)).attr('stroke', COLORS.grid);
      g.append('text').attr('x', -6).attr('y', yScale(t)).attr('text-anchor', 'end').attr('dominant-baseline', 'central').attr('fill', COLORS.text).attr('font-size', '9px').text(t);
    });

    svg.append('text').attr('x', W / 2).attr('y', H - 4).attr('text-anchor', 'middle').attr('fill', COLORS.text).attr('font-size', '10px').text('Speed (kt)');
    svg.append('text').attr('transform', `translate(12,${H / 2}) rotate(-90)`).attr('text-anchor', 'middle').attr('fill', COLORS.text).attr('font-size', '10px').text('Fuel (kg/hr)');

    const line = d3.line().x(d => xScale(d.speed)).y(d => yScale(d.consumption)).curve(d3.curveMonotoneX);
    g.append('path').datum(data).attr('d', line).attr('fill', 'none').attr('stroke', COLORS.accent).attr('stroke-width', 2);

    data.forEach(p => {
      g.append('circle')
        .attr('cx', xScale(p.speed)).attr('cy', yScale(p.consumption))
        .attr('r', 4).attr('fill', COLORS.accent)
        .style('cursor', 'pointer')
        .on('mouseover', (evt) => showTooltip(evt, `Speed: ${p.speed} kt<br>Fuel: ${p.consumption} kg/hr`))
        .on('mouseout', hideTooltip);
    });
  }
}
```

**Step 2: Wire into showDetail**

Add after signature polar block in app.js:

```javascript
if (Charts.d3Ready() && (cat === 'aircraft' || cat === 'ships') && d.propulsion?.performances?.length > 0) {
  const perfDiv = document.createElement('div');
  perfDiv.className = 'detail-section';
  perfDiv.innerHTML = '<div class="detail-section-title">Performance Curves</div><div class="detail-section-body"><div class="chart-container" id="detailPerfCurves"></div></div>';
  modalBody.appendChild(perfDiv);
  Charts.renderPerfCurves(document.getElementById('detailPerfCurves'), d);
}
```

**Step 3: Verify**

Click an aircraft. Verify multi-line speed-vs-fuel chart with 4 altitude band curves in different colors. Legend shows altitude ranges. Hover dots for values.

**Step 4: Commit**

```bash
git add charts.js app.js
git commit -m "feat: add performance curves in aircraft & ship detail modals"
```

---

## Task 7: Loadout Picker (Aircraft Detail)

**Files:**
- Modify: `charts.js` — implement `renderLoadoutAnalysis()`
- Modify: `app.js` — add loadout container in showDetail

**Step 1: Implement renderLoadoutAnalysis in charts.js**

Replace the stub:

```javascript
function renderLoadoutAnalysis(container, item) {
  if (!d3Ready() || !item.loadouts || item.loadouts.length === 0) return;
  container.innerHTML = '';

  // Dropdown
  const select = document.createElement('select');
  select.className = 'filter-select';
  select.style.marginBottom = '8px';
  select.style.maxWidth = '100%';
  item.loadouts.forEach((lo, i) => {
    const opt = document.createElement('option');
    opt.value = i;
    opt.textContent = lo.name.length > 70 ? lo.name.substring(0, 68) + '...' : lo.name;
    select.appendChild(opt);
  });
  container.appendChild(select);

  const chartDiv = document.createElement('div');
  container.appendChild(chartDiv);

  function renderLoadout(idx) {
    chartDiv.innerHTML = '';
    const lo = item.loadouts[idx];
    if (!lo || !lo.weapons || lo.weapons.length === 0) {
      chartDiv.innerHTML = '<div style="color:var(--text-secondary);font-size:12px;padding:8px">No weapon data for this loadout</div>';
      return;
    }

    const weapons = lo.weapons.filter(w => w.weight > 0);
    if (weapons.length === 0) return;

    const maxWeight = Math.max(...weapons.map(w => w.weight * (w.qty || 1)));
    const barH = 22, gap = 4, labelW = 140, pad = 8;
    const W = 500;
    const H = pad * 2 + weapons.length * (barH + gap);
    const barW = W - labelW - pad * 2;
    const scale = d3.scaleLinear().domain([0, maxWeight]).range([0, barW]);

    const svg = d3.select(chartDiv).append('svg')
      .attr('viewBox', `0 0 ${W} ${H}`)
      .attr('preserveAspectRatio', 'xMidYMid meet');

    weapons.forEach((w, i) => {
      const y = pad + i * (barH + gap);
      const totalW = w.weight * (w.qty || 1);
      const barLen = scale(totalW);
      const color = w.type === 'Guided Weapon' ? COLORS.air
        : w.type === 'Gun' ? COLORS.land
        : w.type === 'Torpedo' ? COLORS.sub
        : COLORS.surface;

      svg.append('text')
        .attr('x', labelW - 4).attr('y', y + barH / 2)
        .attr('text-anchor', 'end').attr('dominant-baseline', 'central')
        .attr('fill', COLORS.text).attr('font-size', '10px')
        .text(w.name.length > 20 ? w.name.substring(0, 18) + '...' : w.name);

      svg.append('rect')
        .attr('x', labelW).attr('y', y)
        .attr('width', barW).attr('height', barH)
        .attr('fill', COLORS.grid).attr('rx', 3);

      svg.append('rect')
        .attr('x', labelW).attr('y', y)
        .attr('width', barLen).attr('height', barH)
        .attr('fill', color).attr('fill-opacity', 0.6).attr('rx', 3)
        .style('cursor', 'pointer')
        .on('mouseover', (evt) => {
          const ranges = [w.airRange ? `Air: ${w.airRange} km` : '', w.surfaceRange ? `Surface: ${w.surfaceRange} km` : '', w.landRange ? `Land: ${w.landRange} km` : '', w.subRange ? `Sub: ${w.subRange} km` : ''].filter(Boolean).join('<br>');
          showTooltip(evt, `<b>${esc(w.name)}</b><br>Qty: ${w.qty || 1} x ${w.weight} kg = ${totalW} kg<br>${ranges || 'No range data'}`);
        })
        .on('mouseout', hideTooltip);

      svg.append('text')
        .attr('x', labelW + barLen + 4).attr('y', y + barH / 2)
        .attr('dominant-baseline', 'central')
        .attr('fill', COLORS.textBright).attr('font-size', '9px')
        .text(`${w.qty || 1}x ${w.weight} kg`);
    });
  }

  renderLoadout(0);
  select.addEventListener('change', () => renderLoadout(parseInt(select.value)));
}
```

**Step 2: Wire into showDetail for aircraft**

Add in app.js:

```javascript
if (Charts.d3Ready() && cat === 'aircraft' && d.loadouts && d.loadouts.length > 0) {
  const loDiv = document.createElement('div');
  loDiv.className = 'detail-section';
  loDiv.innerHTML = '<div class="detail-section-title">Loadout Analysis</div><div class="detail-section-body"><div class="chart-container" id="detailLoadout"></div></div>';
  modalBody.appendChild(loDiv);
  Charts.renderLoadoutAnalysis(document.getElementById('detailLoadout'), d);
}
```

**Step 3: Verify**

Click an aircraft with loadouts (any fighter). Verify a dropdown with loadout names, and stacked weight bars below. Switch loadouts in the dropdown — bars update. Hover for qty x weight and range info.

**Step 4: Commit**

```bash
git add charts.js app.js
git commit -m "feat: add loadout picker/analysis in aircraft detail modals"
```

---

## Task 8: Analytics Tab — UI Shell + Category Switcher

**Files:**
- Modify: `app.js` — handle Analytics nav tab click, show/hide analytics view, add category dropdown
- Modify: `styles.css` — analytics layout grid

**Step 1: Add analytics view container in app.js**

In the `render()` function, detect when `state.currentCategory === 'analytics'` and render the analytics dashboard instead of cards. Find the `render()` function and add a branch at the top:

In the nav-btn click handler (search for `data-category` click listener), add handling for `analytics`:

```javascript
// When analytics is clicked, show the analytics view
if (cat === 'analytics') {
  state.currentCategory = 'analytics';
  // Hide card-related toolbar, show analytics container
  document.querySelector('.toolbar').classList.add('hidden');
  const content = document.getElementById('content');
  content.innerHTML = `
    <div class="analytics-view">
      <div class="analytics-toolbar">
        <div class="filter-group">
          <label>Category:</label>
          <select id="analyticsCatSelect" class="filter-select">
            <option value="aircraft">Aircraft</option>
            <option value="ships">Ships</option>
            <option value="weapons">Weapons</option>
            <option value="sensors">Sensors</option>
            <option value="infantry">Infantry</option>
            <option value="armor">Armor</option>
            <option value="artillery">Artillery</option>
            <option value="airdefense">Air Defense</option>
            <option value="radar">Radar</option>
          </select>
        </div>
      </div>
      <div class="analytics-grid">
        <div class="analytics-panel" id="analyticsDonut"></div>
        <div class="analytics-panel analytics-panel-wide" id="analyticsScatter"></div>
        <div class="analytics-panel" id="analyticsHeatmap"></div>
        <div class="analytics-panel analytics-panel-wide" id="analyticsTimeline"></div>
      </div>
    </div>`;
  renderAnalytics(state.analytics.category);
  document.getElementById('analyticsCatSelect').value = state.analytics.category;
  document.getElementById('analyticsCatSelect').addEventListener('change', (e) => {
    state.analytics.category = e.target.value;
    renderAnalytics(e.target.value);
  });
  return;
}
// Otherwise restore toolbar if hidden
document.querySelector('.toolbar').classList.remove('hidden');
```

Add the `renderAnalytics` function:

```javascript
async function renderAnalytics(cat) {
  const data = await loadCategory(cat);
  Charts.renderDonut(document.getElementById('analyticsDonut'), data, cat);
  Charts.renderScatter(document.getElementById('analyticsScatter'), data, cat);
  Charts.renderTimeline(document.getElementById('analyticsTimeline'), data, cat);
  if (cat === 'weapons') {
    Charts.renderDomainHeatmap(document.getElementById('analyticsHeatmap'), data);
  } else {
    document.getElementById('analyticsHeatmap').innerHTML = '';
  }
}
```

**Step 2: Add analytics CSS to styles.css**

```css
/* ── Analytics Tab ── */
.analytics-view {
  padding: 0 16px;
}

.analytics-toolbar {
  display: flex;
  gap: 16px;
  padding: 12px 0;
  border-bottom: 1px solid var(--border);
  margin-bottom: 16px;
}

.analytics-grid {
  display: grid;
  grid-template-columns: 1fr 2fr;
  gap: 16px;
}

.analytics-panel {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 16px;
  min-height: 280px;
}

.analytics-panel-wide {
  /* Takes the wider column */
}

@media (max-width: 768px) {
  .analytics-grid {
    grid-template-columns: 1fr;
  }
}
```

**Step 3: Verify**

Click the Analytics tab. Verify the 2-column grid appears with a category dropdown. Panels are empty but styled. Switching categories doesn't error.

**Step 4: Commit**

```bash
git add app.js styles.css
git commit -m "feat: add Analytics tab shell with category switcher"
```

---

## Task 9: Analytics Charts — Scatter, Donut, Timeline, Heatmap

**Files:**
- Modify: `charts.js` — implement all 4 aggregate chart functions

**Step 1: Implement renderDonut**

```javascript
function renderDonut(container, data, cat) {
  if (!d3Ready()) return;
  container.innerHTML = '<div style="font-size:12px;color:var(--text-secondary);margin-bottom:8px;font-weight:600">Force Composition</div>';

  // Count by type (or name prefix for ground units)
  const counts = {};
  data.forEach(item => {
    let group = item.type || 'Unknown';
    // For ground units, use name prefix grouping
    if (['infantry','armor','artillery','airdefense','radar'].includes(cat)) {
      if (item.name.startsWith('SAM')) group = 'SAM';
      else if (item.name.startsWith('AAA')) group = 'AAA';
      else if (item.name.startsWith('SSM')) group = 'SSM';
      else if (item.name.startsWith('Armored')) group = 'Armored';
      else if (item.name.startsWith('Mech Inf')) group = 'Mech Infantry';
      else if (item.name.startsWith('Inf')) group = 'Infantry';
      else if (item.name.startsWith('Arty') && item.name.includes('MLRS')) group = 'MLRS';
      else if (item.name.startsWith('Arty') && item.name.includes('Howitzer')) group = 'Howitzer';
      else if (item.name.startsWith('Mortar')) group = 'Mortar';
      else if (item.name.startsWith('Radar')) group = 'Radar';
      else if (item.name.startsWith('Vehicle')) group = 'EW Vehicle';
      else if (item.name.startsWith('Sensor')) group = 'Sensor';
    }
    counts[group] = (counts[group] || 0) + 1;
  });

  const entries = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  const colorScale = d3.scaleOrdinal(d3.schemeTableau10);

  const W = 280, H = 240, cx = W / 2, cy = H / 2 - 10, outerR = 90, innerR = 50;

  const svg = d3.select(container).append('svg')
    .attr('viewBox', `0 0 ${W} ${H}`)
    .attr('preserveAspectRatio', 'xMidYMid meet');

  const g = svg.append('g').attr('transform', `translate(${cx},${cy})`);

  const pie = d3.pie().value(d => d[1]).sort(null);
  const arc = d3.arc().innerRadius(innerR).outerRadius(outerR);

  g.selectAll('path')
    .data(pie(entries))
    .join('path')
    .attr('d', arc)
    .attr('fill', (d, i) => colorScale(i))
    .attr('stroke', 'var(--bg-primary)')
    .attr('stroke-width', 2)
    .style('cursor', 'pointer')
    .on('mouseover', (evt, d) => showTooltip(evt, `<b>${esc(d.data[0])}</b><br>${d.data[1]} items (${Math.round(d.data[1] / data.length * 100)}%)`))
    .on('mouseout', hideTooltip);

  // Center label
  g.append('text')
    .attr('text-anchor', 'middle').attr('dominant-baseline', 'central')
    .attr('fill', COLORS.textBright).attr('font-size', '22px').attr('font-weight', 'bold')
    .text(data.length);
  g.append('text')
    .attr('text-anchor', 'middle').attr('y', 18)
    .attr('fill', COLORS.text).attr('font-size', '10px')
    .text('total');

  // Legend (top 8)
  const legend = d3.select(container).append('div').attr('class', 'chart-legend');
  entries.slice(0, 8).forEach(([name, count], i) => {
    const el = legend.append('span').attr('class', 'chart-legend-item');
    el.append('span').attr('class', 'chart-legend-dot').style('background', colorScale(i));
    el.append('span').text(`${name} (${count})`);
  });
  if (entries.length > 8) {
    legend.append('span').attr('class', 'chart-legend-item').text(`+${entries.length - 8} more`);
  }
}
```

**Step 2: Implement renderScatter**

```javascript
function renderScatter(container, data, cat) {
  if (!d3Ready()) return;
  container.innerHTML = '';

  // Axis config per category
  const axes = {
    aircraft: { x: 'maxSpeed', xLabel: 'Max Speed (kt)', y: 'maxWeight', yLabel: 'Max Weight (kg)' },
    ships: { x: 'maxSpeed', xLabel: 'Max Speed (kt)', y: 'displacementFull', yLabel: 'Displacement (t)' },
    weapons: { x: 'maxRange', xLabel: 'Max Range (km)', y: 'weight', yLabel: 'Weight (kg)' },
    sensors: { x: 'rangeMax', xLabel: 'Max Range (km)', y: 'rangeMin', yLabel: 'Min Range (km)' },
  };
  const cfg = axes[cat] || { x: 'sensorCount', xLabel: 'Sensors', y: 'weaponCount', yLabel: 'Weapons' };

  const filtered = data.filter(d => d[cfg.x] > 0 || d[cfg.y] > 0);
  if (filtered.length === 0) {
    container.innerHTML = '<div style="padding:40px;text-anchor:center;color:var(--text-secondary)">No plottable data</div>';
    return;
  }

  container.innerHTML = '<div style="font-size:12px;color:var(--text-secondary);margin-bottom:8px;font-weight:600">Scatter Plot</div>';

  const types = [...new Set(filtered.map(d => d.type || 'Unknown'))];
  const colorScale = d3.scaleOrdinal(d3.schemeTableau10);

  const W = 500, H = 320, pad = { top: 20, right: 20, bottom: 40, left: 60 };
  const plotW = W - pad.left - pad.right;
  const plotH = H - pad.top - pad.bottom;

  const xScale = d3.scaleLinear()
    .domain([0, d3.max(filtered, d => d[cfg.x]) * 1.05])
    .range([0, plotW]);
  const yScale = d3.scaleLinear()
    .domain([0, d3.max(filtered, d => d[cfg.y]) * 1.05])
    .range([plotH, 0]);

  const svg = d3.select(container).append('svg')
    .attr('viewBox', `0 0 ${W} ${H}`)
    .attr('preserveAspectRatio', 'xMidYMid meet');

  const g = svg.append('g').attr('transform', `translate(${pad.left},${pad.top})`);

  // Grid
  xScale.ticks(6).forEach(t => {
    g.append('line').attr('x1', xScale(t)).attr('x2', xScale(t)).attr('y1', 0).attr('y2', plotH).attr('stroke', COLORS.grid);
  });
  yScale.ticks(6).forEach(t => {
    g.append('line').attr('x1', 0).attr('x2', plotW).attr('y1', yScale(t)).attr('y2', yScale(t)).attr('stroke', COLORS.grid);
    g.append('text').attr('x', -6).attr('y', yScale(t)).attr('text-anchor', 'end').attr('dominant-baseline', 'central').attr('fill', COLORS.text).attr('font-size', '9px').text(t.toLocaleString());
  });

  // Axis labels
  svg.append('text').attr('x', W / 2).attr('y', H - 4).attr('text-anchor', 'middle').attr('fill', COLORS.text).attr('font-size', '10px').text(cfg.xLabel);
  svg.append('text').attr('transform', `translate(12,${H / 2}) rotate(-90)`).attr('text-anchor', 'middle').attr('fill', COLORS.text).attr('font-size', '10px').text(cfg.yLabel);

  // Dots
  filtered.forEach(item => {
    const x = xScale(item[cfg.x] || 0);
    const y = yScale(item[cfg.y] || 0);
    const typeIdx = types.indexOf(item.type || 'Unknown');

    g.append('circle')
      .attr('cx', x).attr('cy', y).attr('r', 4)
      .attr('fill', colorScale(typeIdx))
      .attr('fill-opacity', 0.7)
      .attr('stroke', colorScale(typeIdx))
      .attr('stroke-width', 1)
      .style('cursor', 'pointer')
      .on('mouseover', (evt) => showTooltip(evt, `<b>${esc(item.name)}</b><br>${esc(item.type || '')}<br>${cfg.xLabel}: ${(item[cfg.x] || 0).toLocaleString()}<br>${cfg.yLabel}: ${(item[cfg.y] || 0).toLocaleString()}`))
      .on('mouseout', hideTooltip);
  });
}
```

**Step 3: Implement renderTimeline**

```javascript
function renderTimeline(container, data, cat) {
  if (!d3Ready()) return;
  container.innerHTML = '';

  const yearField = cat === 'weapons' ? null : 'commissioned';
  const withYear = yearField ? data.filter(d => d[yearField] > 1900) : [];
  if (withYear.length === 0) {
    container.innerHTML = '<div style="padding:40px;color:var(--text-secondary);font-size:12px">No timeline data for this category</div>';
    return;
  }

  container.innerHTML = '<div style="font-size:12px;color:var(--text-secondary);margin-bottom:8px;font-weight:600">Commissioning Timeline</div>';

  const types = [...new Set(withYear.map(d => d.type || 'Unknown'))];
  const colorScale = d3.scaleOrdinal(d3.schemeTableau10);

  const years = withYear.map(d => d[yearField]);
  const minY = Math.min(...years);
  const maxY = Math.max(...years);

  const W = 700, H = 200, pad = { top: 20, right: 20, bottom: 30, left: 40 };
  const plotW = W - pad.left - pad.right;
  const plotH = H - pad.top - pad.bottom;

  const xScale = d3.scaleLinear().domain([minY - 1, maxY + 1]).range([0, plotW]);

  // Stack dots vertically per year to avoid overlap
  const yearCounts = {};

  const svg = d3.select(container).append('svg')
    .attr('viewBox', `0 0 ${W} ${H}`)
    .attr('preserveAspectRatio', 'xMidYMid meet');

  const g = svg.append('g').attr('transform', `translate(${pad.left},${pad.top})`);

  // X axis ticks
  const step = maxY - minY > 40 ? 10 : maxY - minY > 20 ? 5 : 2;
  for (let yr = Math.ceil(minY / step) * step; yr <= maxY; yr += step) {
    g.append('line').attr('x1', xScale(yr)).attr('x2', xScale(yr)).attr('y1', 0).attr('y2', plotH).attr('stroke', COLORS.grid);
    g.append('text').attr('x', xScale(yr)).attr('y', plotH + 14).attr('text-anchor', 'middle').attr('fill', COLORS.text).attr('font-size', '9px').text(yr);
  }

  // Dots
  withYear.forEach(item => {
    const yr = item[yearField];
    if (!yearCounts[yr]) yearCounts[yr] = 0;
    const stack = yearCounts[yr]++;
    const x = xScale(yr);
    const y = plotH - 8 - stack * 7;
    const typeIdx = types.indexOf(item.type || 'Unknown');

    g.append('circle')
      .attr('cx', x).attr('cy', Math.max(4, y)).attr('r', 3.5)
      .attr('fill', colorScale(typeIdx))
      .attr('fill-opacity', 0.8)
      .style('cursor', 'pointer')
      .on('mouseover', (evt) => showTooltip(evt, `<b>${esc(item.name)}</b><br>${esc(item.type || '')}<br>Commissioned: ${yr}`))
      .on('mouseout', hideTooltip);
  });
}
```

**Step 4: Implement renderDomainHeatmap**

```javascript
function renderDomainHeatmap(container, data) {
  if (!d3Ready()) return;
  container.innerHTML = '<div style="font-size:12px;color:var(--text-secondary);margin-bottom:8px;font-weight:600">Weapon Domain Coverage</div>';

  const domains = ['airRange', 'surfaceRange', 'landRange', 'subRange'];
  const domainLabels = ['Air', 'Surface', 'Land', 'Sub'];
  const domainColors = [COLORS.air, COLORS.surface, COLORS.land, COLORS.sub];

  // Count weapons per domain
  const counts = domains.map(d => data.filter(item => item[d]).length);
  const maxCount = Math.max(...counts, 1);

  const W = 260, H = 180, pad = 20, barH = 28, gap = 8;

  const svg = d3.select(container).append('svg')
    .attr('viewBox', `0 0 ${W} ${H}`)
    .attr('preserveAspectRatio', 'xMidYMid meet');

  const barW = W - pad * 2 - 60;
  const scale = d3.scaleLinear().domain([0, maxCount]).range([0, barW]);

  domains.forEach((dom, i) => {
    const y = pad + i * (barH + gap);

    svg.append('text')
      .attr('x', 50).attr('y', y + barH / 2)
      .attr('text-anchor', 'end').attr('dominant-baseline', 'central')
      .attr('fill', COLORS.text).attr('font-size', '11px')
      .text(domainLabels[i]);

    svg.append('rect')
      .attr('x', 60).attr('y', y)
      .attr('width', barW).attr('height', barH)
      .attr('fill', COLORS.grid).attr('rx', 4);

    svg.append('rect')
      .attr('x', 60).attr('y', y)
      .attr('width', scale(counts[i])).attr('height', barH)
      .attr('fill', domainColors[i]).attr('fill-opacity', 0.6).attr('rx', 4);

    svg.append('text')
      .attr('x', 60 + scale(counts[i]) + 6).attr('y', y + barH / 2)
      .attr('dominant-baseline', 'central')
      .attr('fill', COLORS.textBright).attr('font-size', '11px').attr('font-weight', 'bold')
      .text(counts[i]);
  });
}
```

**Step 5: Verify**

Go to Analytics tab. Select Aircraft — verify donut + scatter + timeline all render. Switch to Weapons — verify heatmap appears in bottom-left. Hover dots in scatter for tooltips. Check donut shows type breakdown with percentages.

**Step 6: Commit**

```bash
git add charts.js
git commit -m "feat: add scatter plot, donut, timeline, and heatmap to Analytics tab"
```

---

## Task 10: Final Polish + Responsive + Cache

**Files:**
- Modify: `app.js` — add chart cache clear on country switch
- Modify: `styles.css` — responsive tweaks, chart sizing
- Modify: `charts.js` — minor polish

**Step 1: Clear chart cache on country switch**

In `app.js`, inside `switchCountry()` (around line 1860), add:

```javascript
state.chartCache.clear();
```

**Step 2: Add responsive chart styles**

Append to styles.css:

```css
/* Chart detail sections in modal */
.detail-section .chart-container svg {
  max-height: 320px;
}

/* Analytics responsive */
@media (max-width: 600px) {
  .analytics-grid {
    grid-template-columns: 1fr;
  }
  .analytics-panel {
    min-height: 200px;
  }
}

/* Analytics title styling */
.analytics-view h2 {
  color: var(--text-primary);
  font-size: 20px;
  margin: 0 0 16px;
}
```

**Step 3: Ensure toolbar hidden class works**

Add to styles.css if not present:

```css
.hidden { display: none !important; }
```

**Step 4: Full verification**

Reload the site. Test each flow:
1. Click Aircraft tab → click a card → verify radar chart, sensor bars, signature polar, perf curves, loadout picker all appear in detail modal
2. Click Ships tab → click a card → verify radar chart, sensor bars, signature polar, perf curves appear
3. Click Weapons tab → click a missile → verify range rings appear
4. Click Analytics tab → verify donut, scatter, timeline render for Aircraft
5. Switch to Ships in analytics dropdown → charts update
6. Switch to Weapons → heatmap appears
7. Switch country to Russia → verify analytics loads with new data
8. Switch back to a regular tab → verify toolbar reappears, cards render normally

**Step 5: Commit**

```bash
git add app.js styles.css charts.js
git commit -m "feat: final polish, responsive, and cache management for visualizations"
```
