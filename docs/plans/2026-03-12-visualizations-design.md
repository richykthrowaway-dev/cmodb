# CMO DB Visualizations Design

## Overview
Add 10 D3.js-powered visualizations: 6 per-item charts in detail modals + 4 aggregate charts in a new Analytics tab.

## Library
D3.js v7 via CDN, loaded async on first use.

## Per-Item Visualizations (Detail Modal)

### 1. Radar/Spider Chart — Aircraft, Ships
- Aircraft axes: speed, agility, climbRate, payload, endurance (normalized 0-1 vs category max)
- Ship axes: speed, displacement, beam, draft, depth
- ~300x300px SVG polygon with semi-transparent accent fill

### 2. Range Ring Diagram — Weapons
- Concentric arcs: air (blue), surface (green), land (brown), sub (purple)
- Min-range inner boundary, max-range outer
- Scale adapts to longest range, ~350x200px

### 3. Sensor/Weapon Bars — Aircraft, Ships
- Horizontal bars per sensor, length=rangeMax, colored by type (Radar=blue, ESM=yellow, Sonar=cyan, EO=orange)
- For aircraft: stacked bars per loadout showing weapon weight distribution

### 4. Signature Polar Plot — Aircraft, Ships, Facilities
- Directional front/side/rear/top values as polar polygon
- Toggle: Detection vs Classification, Visual vs IR vs Radar
- Normalized 0-1 vs category max for relative comparison

### 5. Performance Curves — Aircraft, Ships
- Aircraft: multi-line chart, speed vs fuel consumption at each altitude band (4 lines typically)
- Ships: single line, throttle-speed-consumption curve
- D3 curveMonotoneX interpolation, ~300px wide

### 6. Loadout Picker — Aircraft only
- Dropdown to select loadout (avg 8.28 per aircraft, max 77)
- Stacked weight bars per weapon + range capability dots
- Updates on dropdown change

## Aggregate Visualizations (Analytics Tab)

### 7. Scatter Plot — All categories
- Aircraft: maxSpeed(x) vs maxWeight(y), Ships: maxSpeed vs displacement, Weapons: range vs weight
- Colored by type, D3 zoom/pan, tooltip on hover

### 8. Force Composition Donut — All categories
- Item count per type, animated arc transitions on category switch
- Ground units group by name prefix (same logic as icon filter buttons)

### 9. Commissioning Timeline — All categories
- Horizontal axis by commissioned year (1938-2027)
- Items as dots colored by type, brush selection for year zoom

### 10. Weapon Domain Heatmap — Weapons only
- Counts by range type (air/surface/land/sub) per weapon type
- Color intensity by count, replaces bottom-left panel when viewing weapons

## Analytics Tab Layout
```
+---------------+--------------------------------------+
| Force Comp.   |         Scatter Plot                 |
| (Donut)       |    axis varies by category           |
+---------------+--------------------------------------+
| Domain        |     Commissioning Timeline           |
| Heatmap /     |     brushable year range             |
| Cap Summary   |                                      |
+---------------+--------------------------------------+
```

## Optimizations
- Lazy D3 loading: async script, ready promise, load on first chart need
- Chart render caching: Map keyed by item ID, cleared on country switch
- ResizeObserver per chart container, debounced 200ms
- Single shared tooltip div reused across all charts
- state.analytics persists category + options across tab switches
- Detail data prefetch when Analytics tab loads

## File Structure
- `charts.js` — All D3 render functions
- `app.js` — Wire charts into detail modal + Analytics tab
- `styles.css` — Chart styles matching dark theme
- `index.html` — D3 CDN script, Analytics nav tab

## Data Available
- 2,703 aircraft (268 with full details: sensors, 30 loadouts avg, 16 perf points, 6 signatures)
- 1,980 ships (232 with details: mounts, magazines, 11 signatures, 4.7 perf points avg)
- 7,679 weapons (575 with details: warheads, launch envelopes, PoK values)
- 9,132 sensors (575 with details: radar specs, ESM/ECM, sonar, capabilities)
- 94 countries, commissioned years 1938-2027
