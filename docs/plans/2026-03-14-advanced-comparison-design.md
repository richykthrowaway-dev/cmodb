# Advanced Comparison System Design

## Overview
Replace the basic comparison table with a full-screen scrollable dashboard combining tabular data with inline D3 comparative visualizations. Every detail field from the card modal should be available in the comparison view.

## Architecture

### Data Flow
1. User selects up to 5 items via card checkboxes (existing)
2. On Compare click, `showCompare()` lazy-loads detail data for all selected items
3. Sections render based on category (aircraft/ships/weapons/sensors/ground)
4. Each item gets a consistent color used across all charts

### Item Colors
- Item 1: `#4a9eff` (blue)
- Item 2: `#4caf50` (green)
- Item 3: `#ff9800` (orange)
- Item 4: `#ef5350` (red)
- Item 5: `#ab47bc` (purple)

## Sections (top to bottom)

### 1. Sticky Header
- Hero thumbnails, item names, type badge, year, operator
- Remove button per item
- Stays visible while scrolling

### 2. General Specifications
- Table: all index fields (Crew, Max Speed, Length, Weight, Displacement, etc.)
- Best-value green highlighting per row
- **Chart**: grouped horizontal bars comparing key numeric specs

### 3. Propulsion Performance
- Table: propulsion name, max speed, engine count, thrust
- **Chart**: grouped bars per throttle setting showing each item's speed
- Submarine depth zones shown if applicable

### 4. Signatures (aircraft/ships)
- Table: max value per signature type (Visual, IR, Radar, Sonar)
- **Chart**: overlaid radar/polar plot of all items' signature profiles

### 5. Sensors
- Table: sensor list per item (name, type, range, generation)
- **Chart**: horizontal bars comparing max sensor ranges
- Sensor count summary

### 6. Weapons & Mounts (ships/facilities/ground)
- Table: mount names, quantities, weapon types
- Total firepower summary

### 7. Loadouts (aircraft)
- Loadout count, top loadouts per item with role classification
- **Chart**: domain reach overlay (radial)

### 8. Magazines (ships)
- Table: magazine names, capacities
- Total capacity comparison bar

### 9. Weapons Detail (weapons category)
- Ranges per domain, PoK values, launch constraints, warhead, CEP
- **Chart**: grouped range bars per domain

### 10. Sensor Detail (sensors category)
- Technical specs: scan interval, beamwidth, power, contacts
- Capabilities, range/altitude envelope

## Layout
- Full-viewport modal, `overflow-y: scroll`
- Sticky header with item names
- Category-aware: only relevant sections render
- D3 charts inline between table sections
- Max 5 items enforced

## Implementation Plan

### Step 1: Restructure comparison modal
- Make modal full-screen scrollable
- Add sticky header with thumbnails/names
- Update CSS for new layout

### Step 2: Lazy-load detail data
- Load detail JSON for all compared items on modal open
- Merge index + detail data per item

### Step 3: Build section renderer framework
- Create `renderCompareSection(title, rows, items)` helper
- Create `renderCompareChart(container, type, data, items)` helper
- Best-value highlighting logic

### Step 4: Implement General Specifications section
- All index fields with best-value highlighting
- Key specs bar chart

### Step 5: Implement Propulsion section
- Propulsion table + speed comparison chart

### Step 6: Implement Signatures section
- Signature table + overlaid polar chart

### Step 7: Implement Sensors section
- Sensor list table + range comparison chart

### Step 8: Implement Weapons/Mounts section
- Mount/weapon table for ships/ground

### Step 9: Implement Loadouts section (aircraft)
- Loadout summary + domain reach overlay

### Step 10: Implement Magazines section (ships)
- Magazine table + capacity chart

### Step 11: Implement Weapons Detail section (weapons cat)
- Full engagement data + range charts

### Step 12: Implement Sensor Detail section (sensors cat)
- Technical specs + capabilities

### Step 13: Polish and verify
- Test across categories and countries
- Responsive scroll behavior
- Color consistency
