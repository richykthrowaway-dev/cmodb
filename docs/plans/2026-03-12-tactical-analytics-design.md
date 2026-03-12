# Tactical Analytics Visualizations — Design

## Goal
Add 7 new CMO-gamer-focused analytics charts that leverage unused data fields (PoK, warhead, launch/target envelopes, armor, magazines, sensor capabilities) to help players plan engagements and compare platforms.

## New Charts

### 1. Weapon Engagement Envelope (`renderEngagementEnvelope`)
- **Category**: weapons
- **Data**: launchAltMin/Max, launchSpeedMin/Max, targetAltMin/Max, targetSpeedMin/Max
- **Viz**: Rectangular area plot — each weapon is a shaded rectangle showing its engagement box (altitude range × speed range). Overlapping envelopes highlight coverage gaps.
- **Panel**: analytics-panel-wide

### 2. Kill Probability Matrix (`renderPokMatrix`)
- **Category**: weapons
- **Data**: airPoK, surfacePoK, landPoK, subPoK
- **Viz**: Heatmap grid — rows = weapons (sorted by max PoK), columns = domains. Color intensity maps PoK 0–1. Tooltip shows exact %.
- **Panel**: analytics-panel-full

### 3. Sensor Coverage Comparison (`renderSensorCoverage`)
- **Category**: aircraft, ships
- **Data**: detail.sensors[].rangeMax grouped by sensor type
- **Viz**: Grouped horizontal bars per platform — bars colored by sensor type (Radar, ESM, Sonar, E/O). Top 10 platforms by total sensor range.
- **Panel**: analytics-panel-wide

### 4. Weapon Weight-Range Tradeoff (`renderWeaponBubble`)
- **Category**: weapons
- **Data**: maxRange (x), weight (y), warhead.damage (bubble size), warhead.type (color)
- **Viz**: Bubble scatter — log scale on range axis. Tooltip shows weapon name, warhead name, explosive weight.
- **Panel**: analytics-panel-wide

### 5. Platform Survivability (`renderSurvivability`)
- **Category**: aircraft, ships
- **Data**: damagePoints, engineArmor, fuselageArmor, cockpitArmor (aircraft); damagePoints, armorGeneral (ships/facilities)
- **Viz**: Horizontal grouped bars — top 10 by damagePoints. Each bar segment = armor component. Color scale from green (high) to red (low).
- **Panel**: analytics-panel-wide

### 6. Magazine Depth (`renderMagazineDepth`)
- **Category**: ships
- **Data**: detail.magazines[].qty, detail.mounts[].qty, detail.mounts[].weapons[]
- **Viz**: Stacked horizontal bars per ship — segments = weapon categories from magazines + mounts. Total count label. Sorted by total capacity.
- **Panel**: analytics-panel-wide

### 7. Sensor Capability Matrix (`renderCapabilityMatrix`)
- **Category**: sensors
- **Data**: detail.capabilities[] array
- **Viz**: Dot matrix — rows = sensors, columns = unique capabilities. Filled dot = has capability. Sorted by capability count descending.
- **Panel**: analytics-panel-full

## Layout Addition
New panels appended below existing 9 panels in analytics grid:
- Row 6: (empty 1fr) | Engagement Envelope (2fr)
- Row 7: PoK Matrix (full width)
- Row 8: (empty 1fr) | Sensor Coverage (2fr)
- Row 9: (empty 1fr) | Weapon Bubble (2fr)
- Row 10: (empty 1fr) | Survivability (2fr)
- Row 11: (empty 1fr) | Magazine Depth (2fr)
- Row 12: Capability Matrix (full width)

Charts show contextual empty states when category doesn't apply.

## Technical Notes
- All charts follow existing IIFE pattern in charts.js
- Use shared tooltip singleton
- SVG viewBox for responsive scaling
- Detail data lazy-loaded via existing loadDetail() in app.js
- Charts needing detail data will call loadDetail() internally and cache results
