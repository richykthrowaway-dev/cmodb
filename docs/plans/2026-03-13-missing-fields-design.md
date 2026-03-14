# Missing Database Fields — Detail Modal Enhancement Design

**Goal:** Surface all unused CMO database fields in the detail modal so players see every data point when clicking an item.

**Architecture:** Add new rows/sections to the existing `showDetail()` HTML templates in `app.js`. No new files, CSS, or dependencies. Each section is conditionally rendered only when data exists.

## Changes by Category

### Weapons
- **Accuracy rows:** CEP (air), CEP (surface) — meters
- **Minimum Ranges rows:** Air Min, Surface Min, Land Min, Sub Min — only when non-null
- **Torpedo Profile section:** Cruise Speed/Range, Full Speed/Range — only when torpedo fields exist
- **Flight Profile rows:** Cruise Altitude (ft), Max Flight Time (s), Burnout Weight (kg)
- **Warhead enhancement:** Add numWarheads to existing warhead section

### Sensors
- **Altitude Limits rows:** Alt Max, Alt Min
- **Frequency Bands section:** List of frequency strings — only when frequencies[] non-empty

### Ground Units (Infantry, Armor, Artillery, Air Defense, Radar)
- **Signatures table:** Same polar chart + table already used for aircraft/ships — only when signatures[] exists
- **Mount weapon ranges:** Show airRange/surfaceRange/landRange/subRange values in mounts table

### Ships
- **Codes section:** Comma-separated capability codes — only when codes[] non-empty
- **Fuel consumption column:** Add consumption to propulsion performance table

## Technical Notes
- Only `app.js` modified (showDetail function)
- Uses existing CSS classes (detail-specs, detail-table, etc.)
- All new sections conditionally rendered — no empty sections shown
- Existing per-item charts (signature polar) already handle signatures[] data, just need to be wired for ground units
