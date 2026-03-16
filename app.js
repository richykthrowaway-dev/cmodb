/* ============================================
   CMO DB — Application Logic
   Lazy-loaded JSON data with in-memory cache
   ============================================ */

const App = (() => {
  // ── State ──────────────────────────────
  const state = {
    country: 'us',     // active country: 'us' | 'cn' | etc.
    currentCategory: 'aircraft',
    data: {},          // cache: { aircraft: [...], ships: [...], ... }
    details: {},       // cache: { aircraft: { "1": {...}, ... }, ... }
    compareList: [],   // [{ category, id, name }]
    viewMode: 'grid',  // 'grid' | 'list'
    filters: { type: '', operator: '', search: '' },
    sort: 'name-asc',
    imageMap: null,        // loaded from data/{country}/images.json
    imageCache: new Map(), // wiki title -> thumbnail URL (shared across countries)
    imageObserver: null,
    imgQueue: [],          // queued image load tasks
    imgActive: 0,          // currently loading image count
    analytics: { category: 'aircraft' },  // Analytics tab state
    chartCache: new Map(),                 // item ID -> rendered chart DOM nodes
  };

  // Category placeholder SVGs (reused from nav icons)
  const catIcons = {
    aircraft: '<svg viewBox="0 0 24 24" width="48" height="48" opacity="0.3"><path fill="currentColor" d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"/></svg>',
    ships: '<svg viewBox="0 0 24 24" width="48" height="48" opacity="0.3"><path fill="currentColor" d="M20 21c-1.39 0-2.78-.47-4-1.32-2.44 1.71-5.56 1.71-8 0C6.78 20.53 5.39 21 4 21H2v2h2c1.38 0 2.74-.35 4-.99 2.52 1.29 5.48 1.29 8 0 1.26.65 2.62.99 4 .99h2v-2h-2zM3.95 19H4c1.6 0 3.02-.88 4-2 .98 1.12 2.4 2 4 2s3.02-.88 4-2c.98 1.12 2.4 2 4 2h.05l1.89-6.68c.08-.26.06-.54-.06-.78s-.34-.42-.6-.5L20 10.62V6c0-1.1-.9-2-2-2h-3V1H9v3H6c-1.1 0-2 .9-2 2v4.62l-1.29.42c-.26.08-.48.26-.6.5s-.14.52-.05.78L3.95 19zM6 6h12v3.97L12 8 6 9.97V6z"/></svg>',
    weapons: '<svg viewBox="0 0 24 24" width="48" height="48" opacity="0.3"><path fill="currentColor" d="M7 5h10v2h2V3c0-1.1-.9-2-2-2H7c-1.1 0-2 .9-2 2v4h2V5zm8.41 11.59L20 12l-4.59-4.59L14 8.83 17.17 12 14 15.17l1.41 1.42zM10 15.17L6.83 12 10 8.83 8.59 7.41 4 12l4.59 4.59L10 15.17zM17 19H7v-2H5v4c0 1.1.9 2 2 2h10c1.1 0 2-.9 2-2v-4h-2v2z"/></svg>',
    sensors: '<svg viewBox="0 0 24 24" width="48" height="48" opacity="0.3"><path fill="currentColor" d="M1 9l2 2c4.97-4.97 13.03-4.97 18 0l2-2C16.93 2.93 7.08 2.93 1 9zm8 8l3 3 3-3c-1.65-1.66-4.34-1.66-6 0zm-4-4l2 2c2.76-2.76 7.24-2.76 10 0l2-2C15.14 9.14 8.87 9.14 5 13z"/></svg>',
    infantry: '<svg viewBox="0 0 24 24" width="48" height="48" opacity="0.3"><path fill="currentColor" d="M12 2C13.1 2 14 2.9 14 4S13.1 6 12 6 10 5.1 10 4 10.9 2 12 2zM21 9h-6v13h-2v-6h-2v6H9V9H3V7h18v2z"/></svg>',
    armor: '<svg viewBox="0 0 24 24" width="48" height="48" opacity="0.3"><path fill="currentColor" d="M18 3H6C3.79 3 2 4.79 2 7v4c0 2.21 1.79 4 4 4h1l-1.5 3h2l1.5-3h6l1.5 3h2L16 15h2c2.21 0 4-1.79 4-4V7c0-2.21-1.79-4-4-4zm-1 9H7c-.55 0-1-.45-1-1V8c0-.55.45-1 1-1h10c.55 0 1 .45 1 1v3c0 .55-.45 1-1 1zM4 19h16v2H4v-2z"/></svg>',
    artillery: '<svg viewBox="0 0 24 24" width="48" height="48" opacity="0.3"><path fill="currentColor" d="M7 19h10v2H7v-2zm14.4-8.2L17 4h-2l-1 3H10L9 4H7L2.6 10.8 4 12l3-2v5h10v-5l3 2 1.4-1.2zM12 2c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2z"/></svg>',
    airdefense: '<svg viewBox="0 0 24 24" width="48" height="48" opacity="0.3"><path fill="currentColor" d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71L12 2zm0 4.8L16.14 18H12v-3h-.01L7.86 18 12 6.8z"/></svg>',
    radar: '<svg viewBox="0 0 24 24" width="48" height="48" opacity="0.3"><path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm-5.5-2.5l7.51-3.49L17.5 6.5 9.99 9.99 6.5 17.5zm5.5-6.6c.61 0 1.1.49 1.1 1.1s-.49 1.1-1.1 1.1-1.1-.49-1.1-1.1.49-1.1 1.1-1.1z"/></svg>',
  };

  // Category display config — file paths are now built dynamically per country
  const categories = {
    aircraft: { title: 'Aircraft', yearField: 'commissioned' },
    ships:    { title: 'Ships & Submarines', yearField: 'commissioned' },
    weapons:  { title: 'Weapons', yearField: 'yearIntroduced' },
    sensors:  { title: 'Sensors', yearField: 'yearIntroduced' },
    infantry:    { title: 'Infantry', yearField: 'commissioned' },
    armor:       { title: 'Armor', yearField: 'commissioned' },
    artillery:   { title: 'Artillery', yearField: 'commissioned' },
    airdefense:  { title: 'Air Defense', yearField: 'commissioned' },
    radar:       { title: 'Radar & Sensors', yearField: 'commissioned' },
  };
  function catFile(cat) { return `data/${state.country}/${cat}.json`; }
  function detailFile(cat) { return `data/${state.country}/details/${cat}.json`; }
  function imageFile() { return `data/${state.country}/images.json`; }

  // ── Aircraft Type Icon SVGs ────────────────
  // Plan-view (top-down) aircraft silhouettes, identification chart style
  // viewBox 64×64, nose pointing UP, fill="currentColor"
  const TYPE_ICON_DEFS = {
    // ── Fighter (F-15 Eagle): swept wings, twin close vertical tails ──
    'Fighter': { short: 'Fighter',
      svg: '<svg viewBox="0 0 64 64" width="46" height="46"><path fill="currentColor" d="M32,1 L29,6 L28,16 L12,27 L3,32 L3,36 L28,30 L28,44 L22,51 L22,55 L29,49 L31,59 L32,63 L33,59 L35,49 L42,55 L42,51 L36,44 L36,30 L61,36 L61,32 L52,27 L36,16 L35,6Z"/></svg>' },

    // ── Multirole (F/A-18): wider LERX body, canted tails splay outward ──
    'Multirole (Fighter/Attack)': { short: 'Multirole',
      svg: '<svg viewBox="0 0 64 64" width="46" height="46"><path fill="currentColor" d="M32,1 L28,8 L26,16 L24,22 L10,32 L2,38 L2,42 L25,34 L26,44 L18,54 L14,60 L14,63 L27,54 L31,62 L32,63 L33,62 L37,54 L50,63 L50,60 L46,54 L38,44 L39,34 L62,42 L62,38 L54,32 L40,22 L38,16 L36,8Z"/></svg>' },

    // ── Attack (A-10): straight wings, twin engine pods, wide-set twin tails ──
    'Attack': { short: 'Attack',
      svg: '<svg viewBox="0 0 64 64" width="46" height="46"><path fill="currentColor" d="M32,2 L30,7 L30,24 L2,30 L1,32 L1,36 L30,31 L30,44 L23,52 L23,57 L30,50 L32,61 L34,50 L41,57 L41,52 L34,44 L34,31 L63,36 L63,32 L62,30 L34,24 L34,7Z"/><rect fill="currentColor" x="22" y="25" width="4" height="9" rx="1"/><rect fill="currentColor" x="38" y="25" width="4" height="9" rx="1"/></svg>' },

    // ── Bomber (B-52): massive swept wings, 4 engine pod pairs, small tail ──
    'Bomber': { short: 'Bomber',
      svg: '<svg viewBox="0 0 64 64" width="46" height="46"><path fill="currentColor" d="M32,4 L30.5,8 L30,18 L8,30 L1,36 L1,40 L30,33 L30,42 L28,46 L31,44 L32,50 L33,44 L36,46 L34,42 L34,33 L63,40 L63,36 L56,30 L34,18 L33.5,8Z"/><rect fill="currentColor" x="14" y="28" width="3" height="5" rx="0.7"/><rect fill="currentColor" x="9" y="31" width="3" height="5" rx="0.7"/><rect fill="currentColor" x="47" y="28" width="3" height="5" rx="0.7"/><rect fill="currentColor" x="52" y="31" width="3" height="5" rx="0.7"/></svg>' },

    // ── Stealth Bomber (B-2): flying wing boomerang, no tail ──
    'Bomber (Stealth)': { short: 'Stealth',
      svg: '<svg viewBox="0 0 64 64" width="46" height="46"><path fill="currentColor" d="M32,8 L26,16 L16,24 L2,34 L1,36 L8,44 L18,46 L28,48 L31,50 L32,58 L33,50 L36,48 L46,46 L56,44 L63,36 L62,34 L48,24 L38,16Z"/></svg>' },

    // ── Transport (C-17): wide body, T-tail crossbar, 4 engines, swept wings ──
    'Transport': { short: 'Transport',
      svg: '<svg viewBox="0 0 64 64" width="46" height="46"><path fill="currentColor" d="M33,1 L31,1 L29,6 L28,16 L12,27 L4,32 L4,36 L28,30 L28,44 L25,49 L25,53 L29,50 L30,55 L34,55 L35,50 L39,53 L39,49 L36,44 L36,30 L60,36 L60,32 L52,27 L36,16 L35,6Z"/><rect fill="currentColor" x="25" y="54" width="14" height="2.5" rx="0.5"/><rect fill="currentColor" x="17" y="28" width="3" height="4.5" rx="0.7"/><rect fill="currentColor" x="44" y="28" width="3" height="4.5" rx="0.7"/></svg>' },

    // ── Tanker (KC-135): 4 engines, swept wings, refueling boom extending below tail ──
    'Tanker (Air Refueling)': { short: 'Tanker',
      svg: '<svg viewBox="0 0 64 68" width="46" height="46"><path fill="currentColor" d="M32,1 L30,6 L29,16 L12,27 L4,32 L4,36 L29,30 L29,44 L25,50 L25,54 L30,49 L31,56 L32,58 L33,56 L34,49 L39,54 L39,50 L35,44 L35,30 L60,36 L60,32 L52,27 L35,16 L34,6Z"/><rect fill="currentColor" x="17" y="28" width="3" height="4.5" rx="0.7"/><rect fill="currentColor" x="44" y="28" width="3" height="4.5" rx="0.7"/><path fill="currentColor" d="M31,58 L29.5,65 L32,68 L34.5,65 L33,58Z"/></svg>' },

    // ── Command Post (E-4B): widest body (747), 4 engines ──
    'Airborne Command Post (ACP)': { short: 'Command\nPost',
      svg: '<svg viewBox="0 0 64 64" width="46" height="46"><path fill="currentColor" d="M35,1 L29,1 L26,6 L25,16 L12,27 L4,32 L4,36 L25,30 L25,44 L22,50 L22,54 L27,49 L30,56 L26,58 L38,58 L34,56 L37,49 L42,54 L42,50 L39,44 L39,30 L60,36 L60,32 L52,27 L39,16 L38,6Z"/><rect fill="currentColor" x="16" y="28" width="3" height="4.5" rx="0.7"/><rect fill="currentColor" x="45" y="28" width="3" height="4.5" rx="0.7"/></svg>' },

    // ── SAR/Special Ops (AC-130J / HC-130J): fixed-wing SAR + special ops transports ──
    'Search And Rescue (SAR)': { short: 'SAR',
      svg: '<svg viewBox="0 0 64 64" width="46" height="46"><ellipse cx="32" cy="28" rx="26" ry="26" fill="currentColor" opacity="0.1"/><path fill="currentColor" d="M31,6 L29,10 L28,16 L27,20 L23,23 L20,24 L20,27 L27,26 L28,30 L28,46 L26,50 L22,52 L22,56 L27,53 L29,50 L31,56 L32,62 L33,56 L35,50 L37,53 L42,56 L42,52 L38,50 L36,46 L36,30 L37,26 L44,27 L44,24 L41,23 L37,20 L36,16 L35,10 L33,6Z"/><line x1="6" y1="28" x2="58" y2="28" stroke="currentColor" stroke-width="2.5" opacity="0.3"/><line x1="32" y1="2" x2="32" y2="54" stroke="currentColor" stroke-width="2.5" opacity="0.3"/><circle cx="32" cy="28" r="3.5" fill="currentColor"/></svg>' },

    // ── AEW (E-3 Sentry): airplane body + large thick rotodome ring ──
    'Airborne Early Warning (AEW)': { short: 'Early\nWarning',
      svg: '<svg viewBox="0 0 64 64" width="46" height="46"><path fill="currentColor" d="M32,1 L30,6 L29,16 L14,27 L4,32 L4,36 L29,30 L29,42 L25,48 L25,52 L30,47 L31,56 L32,60 L33,56 L34,47 L39,52 L39,48 L35,42 L35,30 L60,36 L60,32 L50,27 L35,16 L34,6Z"/><circle cx="32" cy="24" r="12" fill="none" stroke="currentColor" stroke-width="5"/></svg>' },

    // ── ASW (P-3 Orion): STRAIGHT wings, 4 engines, long MAD boom spike below tail ──
    'Anti-Submarine Warfare (ASW)': { short: 'Anti-Sub',
      svg: '<svg viewBox="0 0 64 70" width="46" height="46"><path fill="currentColor" d="M32,1 L30,5 L30,16 L2,27 L1,29 L1,33 L30,28 L30,42 L26,48 L26,52 L31,47 L32,55 L33,47 L38,52 L38,48 L34,42 L34,28 L63,33 L63,29 L62,27 L34,16 L34,5Z"/><rect fill="currentColor" x="13" y="25" width="3" height="4.5" rx="0.7"/><rect fill="currentColor" x="7" y="27" width="3" height="4.5" rx="0.7"/><rect fill="currentColor" x="48" y="25" width="3" height="4.5" rx="0.7"/><rect fill="currentColor" x="54" y="27" width="3" height="4.5" rx="0.7"/><path fill="currentColor" d="M31.2,55 L31,63 L32,70 L33,63 L32.8,55Z"/></svg>' },

    // ── Maritime Patrol (P-8): swept wings, 2 engines only, no MAD boom ──
    'Maritime Patrol Aircraft (MPA)': { short: 'Maritime\nPatrol',
      svg: '<svg viewBox="0 0 64 64" width="46" height="46"><path fill="currentColor" d="M32,1 L30,6 L29,16 L14,27 L5,32 L5,36 L29,30 L29,44 L25,50 L25,54 L30,49 L31,58 L32,62 L33,58 L34,49 L39,54 L39,50 L35,44 L35,30 L59,36 L59,32 L50,27 L35,16 L34,6Z"/><rect fill="currentColor" x="20" y="27" width="3" height="5" rx="0.7"/><rect fill="currentColor" x="41" y="27" width="3" height="5" rx="0.7"/></svg>' },

    // ── Surveillance (E-8C JSTARS): airplane + long belly canoe radar pod ──
    'Area Surveillance': { short: 'Surveillance',
      svg: '<svg viewBox="0 0 64 64" width="46" height="46"><path fill="currentColor" d="M32,1 L30,6 L29,16 L14,27 L4,32 L4,36 L29,30 L29,42 L25,48 L25,52 L30,47 L31,55 L32,60 L33,55 L34,47 L39,52 L39,48 L35,42 L35,30 L60,36 L60,32 L50,27 L35,16 L34,6Z"/><rect fill="currentColor" x="17" y="28" width="3" height="4.5" rx="0.7"/><rect fill="currentColor" x="44" y="28" width="3" height="4.5" rx="0.7"/><ellipse cx="32" cy="34" rx="3" ry="14" fill="currentColor" opacity="0.45"/></svg>' },

    // ── Electronic Warfare (EA-18G): multirole body + wingtip jamming pods ──
    'Electronic Warfare': { short: 'Elec.\nWarfare',
      svg: '<svg viewBox="0 0 64 64" width="46" height="46"><path fill="currentColor" d="M32,1 L28,8 L26,16 L24,22 L10,32 L2,38 L2,42 L25,34 L26,44 L18,54 L14,60 L14,63 L27,54 L31,62 L32,63 L33,62 L37,54 L50,63 L50,60 L46,54 L38,44 L39,34 L62,42 L62,38 L54,32 L40,22 L38,16 L36,8Z"/><circle cx="2" cy="39" r="4" fill="currentColor"/><circle cx="62" cy="39" r="4" fill="currentColor"/></svg>' },

    // ── Recon (U-2 Dragon Lady): extremely wide straight wings, tiny narrow body ──
    'Recon': { short: 'Recon',
      svg: '<svg viewBox="0 0 64 64" width="46" height="46"><path fill="currentColor" d="M32.5,1 L31.5,1 L31,5 L31,20 L1,25 L1,29 L31,27 L31,44 L28,50 L28,54 L31.5,48 L32,58 L32.5,48 L36,54 L36,50 L33,44 L33,27 L63,29 L63,25 L33,20 L33,5Z"/></svg>' },

    // ── UAV (RQ-4 Global Hawk): bulbous nose, long thin wings, V-tail ──
    'Unmanned Aerial Vehicle (UAV)': { short: 'Drone',
      svg: '<svg viewBox="0 0 64 64" width="46" height="46"><ellipse cx="32" cy="5" rx="4.5" ry="5" fill="currentColor"/><path fill="currentColor" d="M31,10 L30.5,18 L5,26 L3,28 L3,32 L30.5,28 L30.5,42 L26,50 L26,54 L31,47 L32,58 L33,47 L38,54 L38,50 L33.5,42 L33.5,28 L61,32 L61,28 L59,26 L33.5,18 L33,10Z"/></svg>' },

    // ── UCAV (MQ-9 Reaper): sensor ball nose, slender body, long wings ──
    'Unmanned Combat Aerial Vehicle (UCAV)': { short: 'Combat\nDrone',
      svg: '<svg viewBox="0 0 64 64" width="46" height="46"><circle cx="32" cy="5" r="3.5" fill="currentColor"/><path fill="currentColor" d="M31.5,8 L31,18 L7,27 L5,29 L5,33 L31,29 L31,44 L26,52 L26,56 L31,49 L32,60 L33,49 L38,56 L38,52 L33,44 L33,29 L59,33 L59,29 L57,27 L33,18 L32.5,8Z"/></svg>' },
  }

  // ── Aircraft Group Definitions (cross-type groups matched by name prefix) ──
  // Helicopters appear across Attack / Transport / ASW / SAR types — unify by designation
  const AIRCRAFT_GROUP_DEFS = {
    'helicopter': {
      short: 'Helicopter',
      svg: '<svg viewBox="0 0 64 64" width="46" height="46"><ellipse cx="32" cy="28" rx="26" ry="26" fill="currentColor" opacity="0.1"/><path fill="currentColor" d="M31,6 L29,10 L28,16 L27,20 L23,23 L20,24 L20,27 L27,26 L28,30 L28,46 L26,50 L22,52 L22,56 L27,53 L29,50 L31,56 L32,62 L33,56 L35,50 L37,53 L42,56 L42,52 L38,50 L36,46 L36,30 L37,26 L44,27 L44,24 L41,23 L37,20 L36,16 L35,10 L33,6Z"/><line x1="6" y1="28" x2="58" y2="28" stroke="currentColor" stroke-width="2.5" opacity="0.3"/><line x1="32" y1="2" x2="32" y2="54" stroke="currentColor" stroke-width="2.5" opacity="0.3"/><circle cx="32" cy="28" r="3.5" fill="currentColor"/></svg>',
      match: name =>
        /^(AH|CH|HH|MH|OH|SH|TH|UH)-/.test(name) ||
        /^Mi-\d/.test(name) ||
        /^Ka-\d/.test(name) ||
        /^Z-\d/.test(name) ||
        /^WZ-/.test(name) ||
        /^AW\./.test(name) ||
        /^(SA|AS)\.\d/.test(name) ||
        /^(W-3|PZL W)/.test(name) ||
        /\b(Lynx|Merlin|Wildcat|Gazelle|Sea.?King|Dauphin|Alouette|NH.?90|Chinook|Apache|Puma|Super.?Puma|Cougar|Fennec)\b/i.test(name),
    },
  };

  // ── Ship Type Icon Definitions (grouped by hull classification) ──
  const SHIP_TYPE_ICON_DEFS = {
    'carrier': {
      short: 'Carrier',
      types: ['CVN - Nuclear Powered Aircraft Carrier', 'CVA - Attack Carrier'],
      svg: '<svg viewBox="0 0 96 48" width="58" height="30"><path fill="currentColor" d="M4,32 L6,28 L8,26 L88,24 L92,26 L94,30 L94,32 L88,38 L48,42 L10,38Z"/><path fill="currentColor" d="M6,26 L88,24 L88,22 L4,24Z"/><path fill="currentColor" d="M56,22 L55,14 L58,12 L66,12 L68,14 L68,22Z"/><line x1="61" y1="12" x2="61" y2="6" stroke="currentColor" stroke-width="1.8"/><line x1="64" y1="12" x2="64" y2="8" stroke="currentColor" stroke-width="1.2"/></svg>'
    },
    'battleship': {
      short: 'Battleship',
      types: ['BB - Battleship'],
      svg: '<svg viewBox="0 0 96 48" width="58" height="30"><path fill="currentColor" d="M4,30 L8,26 L14,24 L80,24 L86,26 L92,30 L94,32 L86,38 L48,42 L10,38Z"/><path fill="currentColor" d="M18,24 L18,20 L28,20 L28,24Z"/><path fill="currentColor" d="M30,24 L30,22 L36,22 L36,24Z"/><path fill="currentColor" d="M40,24 L40,12 L58,12 L58,24Z"/><path fill="currentColor" d="M62,24 L62,20 L72,20 L72,24Z"/><line x1="46" y1="12" x2="46" y2="5" stroke="currentColor" stroke-width="2"/><line x1="54" y1="12" x2="54" y2="7" stroke="currentColor" stroke-width="1.5"/><line x1="22" y1="20" x2="12" y2="16" stroke="currentColor" stroke-width="2.5" opacity="0.55"/><line x1="66" y1="20" x2="76" y2="16" stroke="currentColor" stroke-width="2.5" opacity="0.55"/></svg>'
    },
    'cruiser': {
      short: 'Cruiser',
      types: ['CG - Guided Missile Cruiser', 'CGN - Nuclear Powered Guided Missile Cruiser'],
      svg: '<svg viewBox="0 0 96 48" width="58" height="30"><path fill="currentColor" d="M4,32 L8,28 L12,24 L78,24 L84,26 L90,30 L94,32 L86,38 L48,42 L10,38Z"/><path fill="currentColor" d="M16,24 L16,22 L30,22 L30,24Z"/><path fill="currentColor" d="M32,24 L32,14 L38,12 L52,12 L54,14 L54,24Z"/><path fill="currentColor" d="M56,24 L56,22 L64,22 L64,24Z"/><path fill="currentColor" d="M68,24 L68,20 L78,20 L78,24Z"/><line x1="42" y1="12" x2="42" y2="5" stroke="currentColor" stroke-width="2"/><rect fill="currentColor" x="36" y="13" width="4" height="6" opacity="0.35"/><rect fill="currentColor" x="48" y="13" width="4" height="6" opacity="0.35"/></svg>'
    },
    'destroyer': {
      short: 'Destroyer',
      types: ['DDG - Guided Missile Destroyer', 'DD - Destroyer'],
      svg: '<svg viewBox="0 0 96 48" width="58" height="30"><path fill="currentColor" d="M6,32 L10,28 L16,24 L72,24 L78,26 L84,30 L88,32 L80,38 L46,42 L14,38Z"/><path fill="currentColor" d="M20,24 L20,22 L30,22 L30,24Z"/><path fill="currentColor" d="M32,24 L30,14 L36,12 L50,12 L54,14 L54,24Z"/><path fill="currentColor" d="M58,24 L58,22 L72,22 L72,24Z"/><line x1="40" y1="12" x2="40" y2="5" stroke="currentColor" stroke-width="1.8"/><rect fill="currentColor" x="34" y="13" width="4" height="5" opacity="0.35"/><rect fill="currentColor" x="46" y="13" width="4" height="5" opacity="0.35"/></svg>'
    },
    'frigate': {
      short: 'Frigate',
      types: ['FFG - Guided Missile Frigate', 'FF - Frigate', 'LCS - Littoral Combat Ship'],
      svg: '<svg viewBox="0 0 96 48" width="58" height="30"><path fill="currentColor" d="M12,32 L18,28 L24,24 L66,24 L72,26 L78,30 L82,32 L74,38 L46,42 L20,38Z"/><path fill="currentColor" d="M30,24 L28,16 L44,14 L48,16 L48,24Z"/><path fill="currentColor" d="M52,24 L52,22 L66,22 L66,24Z"/><path fill="currentColor" d="M36,14 L35,7 L39,5 L42,7 L42,14Z"/></svg>'
    },
    'submarine': {
      short: 'Submarine',
      types: ['SSN - Nuclear Powered Attack Submarine', 'SS - Attack/Fleet Submarine', 'SSBN - Nuclear Powered Ballistic Missile Submarine', 'SDV - Swimmer Delivery Vehicle'],
      svg: '<svg viewBox="0 0 96 48" width="58" height="30"><path fill="currentColor" d="M6,32 L2,30 L6,26 L14,24 L80,24 L88,26 L94,30 L92,32 L88,36 L80,38 L14,38 L6,36Z"/><path fill="currentColor" d="M32,24 L30,16 L34,14 L42,14 L44,16 L44,24Z"/><line x1="36" y1="14" x2="36" y2="8" stroke="currentColor" stroke-width="1.5"/><line x1="40" y1="14" x2="40" y2="10" stroke="currentColor" stroke-width="1"/><path fill="currentColor" d="M88,22 L94,18 L92,24Z" opacity="0.45"/><path fill="currentColor" d="M88,40 L94,44 L92,38Z" opacity="0.45"/></svg>'
    },
    'amphibious': {
      short: 'Amphibious',
      types: ['LPD - Amphibious Transport Dock Vessel', 'LSD - Dock Landing Ship ', 'LHD - Amphibious Assault Ship, Multi-purpose', 'LHA - Amphibious Assault Ship, General Purpose', 'LST - Tank Landing Ship', 'LPH - Amphibious Assault Helicopter Carrier', 'LCC - Amphibious Command Vessel', 'LKA - Amphibious Cargo Vessel', 'EPF - Expeditionary Fast Transport', 'ESB - Expeditionary Mobile Base', 'ESD - Expeditionary Transfer Dock'],
      svg: '<svg viewBox="0 0 96 48" width="58" height="30"><path fill="currentColor" d="M4,32 L6,28 L10,26 L12,24 L86,24 L90,26 L94,32 L86,38 L48,42 L10,38Z"/><path fill="currentColor" d="M10,24 L86,24 L86,22 L8,24Z"/><path fill="currentColor" d="M16,24 L16,16 L22,14 L30,14 L32,16 L32,24Z"/><line x1="24" y1="14" x2="24" y2="7" stroke="currentColor" stroke-width="1.5"/><line x1="28" y1="14" x2="28" y2="9" stroke="currentColor" stroke-width="1"/></svg>'
    },
    'landing-craft': {
      short: 'Landing\nCraft',
      types: ['LCU - Utility Landing Craft', 'LCM - Mechanized Landing Craft', 'LCAC - Air Cushion Landing Craft', 'LCP - Personnel Landing Craft', 'LCVP - Vehicle and Personnel Landing Craft', 'LSV - Vehicle Landing Ship '],
      svg: '<svg viewBox="0 0 96 48" width="58" height="30"><path fill="currentColor" d="M10,34 L8,32 L8,24 L12,20 L78,20 L82,24 L82,32 L80,34 L78,38 L12,38Z"/><path fill="currentColor" d="M8,34 L10,36 L80,36 L82,34Z" opacity="0.35"/><path fill="currentColor" d="M66,20 L66,12 L76,12 L76,20Z"/><circle cx="72" cy="16" r="4" fill="currentColor" opacity="0.3"/></svg>'
    },
    'patrol': {
      short: 'Patrol',
      types: ['PB - Patrol Boat', 'WHEC - Coast Guard High Endurance Cutter', 'WMEC - Coast Guard Medium Endurance Cutter', 'PC - Coastal Patrol Boat', 'WPB - Coast Guard Patrol Boat', 'PHM - Missile Hydrofoil ', 'OPV - Offshore Patrol Vessel'],
      svg: '<svg viewBox="0 0 96 48" width="58" height="30"><path fill="currentColor" d="M16,32 L22,28 L30,24 L62,24 L68,26 L74,30 L78,32 L70,38 L46,40 L22,38Z"/><path fill="currentColor" d="M36,24 L36,18 L50,18 L50,24Z"/><line x1="42" y1="18" x2="42" y2="10" stroke="currentColor" stroke-width="1.5"/></svg>'
    },
    'mine-warfare': {
      short: 'Mine\nWarfare',
      types: ['MCM - Mine Countermeasures Ship ', 'MSO - Ocean Minesweeper ', 'MHC - Coastal Minehunter '],
      svg: '<svg viewBox="0 0 96 48" width="58" height="30"><path fill="currentColor" d="M14,32 L20,28 L26,24 L64,24 L70,26 L76,30 L80,32 L72,38 L46,40 L22,38Z"/><path fill="currentColor" d="M34,24 L34,18 L48,18 L48,24Z"/><line x1="40" y1="18" x2="40" y2="10" stroke="currentColor" stroke-width="1.5"/><line x1="72" y1="26" x2="86" y2="30" stroke="currentColor" stroke-width="2" opacity="0.3"/><line x1="72" y1="28" x2="88" y2="34" stroke="currentColor" stroke-width="2" opacity="0.3"/></svg>'
    },
    'supply': {
      short: 'Supply',
      types: ['AO - Fleet Oiler ', 'AOE - Fast Combat Support Ship ', 'T-AO - MSC Fleet Oiler', 'AOR - Replenishment Oiler ', 'AE - Ammunition Ship ', 'AFS - Combat Stores Ship', 'T-AKE - MSC Dry Cargo Ship', 'T-AH  - MSC Hospital Ship', 'AS - Submarine Tender ', 'A - Auxiliary ', 'Platform'],
      svg: '<svg viewBox="0 0 96 48" width="58" height="30"><path fill="currentColor" d="M4,32 L8,28 L12,24 L80,24 L86,26 L92,30 L94,32 L86,38 L48,42 L10,38Z"/><path fill="currentColor" d="M68,24 L68,14 L80,14 L80,24Z"/><line x1="74" y1="14" x2="74" y2="6" stroke="currentColor" stroke-width="1.5"/><line x1="32" y1="24" x2="32" y2="12" stroke="currentColor" stroke-width="2"/><line x1="32" y1="12" x2="26" y2="18" stroke="currentColor" stroke-width="1.5" opacity="0.4"/><line x1="32" y1="12" x2="38" y2="18" stroke="currentColor" stroke-width="1.5" opacity="0.4"/><line x1="52" y1="24" x2="52" y2="14" stroke="currentColor" stroke-width="2"/><line x1="52" y1="14" x2="46" y2="20" stroke="currentColor" stroke-width="1.5" opacity="0.4"/><line x1="52" y1="14" x2="58" y2="20" stroke="currentColor" stroke-width="1.5" opacity="0.4"/></svg>'
    },
    'cargo': {
      short: 'Cargo',
      types: ['T-AKR - MSC Roll-on/Roll-off Cargo Ship', 'T-AK - Cargo Ship', 'Merchant', 'Civilian'],
      svg: '<svg viewBox="0 0 96 48" width="58" height="30"><path fill="currentColor" d="M4,32 L6,28 L12,24 L82,24 L88,26 L92,30 L94,32 L86,38 L48,42 L10,38Z"/><path fill="currentColor" d="M70,24 L70,14 L84,14 L84,24Z"/><line x1="76" y1="14" x2="76" y2="6" stroke="currentColor" stroke-width="1.5"/><line x1="30" y1="24" x2="30" y2="12" stroke="currentColor" stroke-width="2"/><line x1="30" y1="12" x2="24" y2="18" stroke="currentColor" stroke-width="1.5" opacity="0.4"/><line x1="50" y1="24" x2="50" y2="12" stroke="currentColor" stroke-width="2"/><line x1="50" y1="12" x2="44" y2="18" stroke="currentColor" stroke-width="1.5" opacity="0.4"/></svg>'
    },
    'surveillance': {
      short: 'Surveillance',
      types: ['T-AGOS - MSC Ocean Surveillance Ship', 'AGM - Missile Range instrumentation Ship'],
      svg: '<svg viewBox="0 0 96 48" width="58" height="30"><path fill="currentColor" d="M10,32 L16,28 L22,24 L68,24 L74,26 L80,30 L84,32 L76,38 L46,40 L18,38Z"/><path fill="currentColor" d="M30,24 L30,16 L48,16 L48,24Z"/><circle cx="39" cy="10" r="7" fill="currentColor" opacity="0.35"/><line x1="39" y1="16" x2="39" y2="10" stroke="currentColor" stroke-width="1.5"/><line x1="78" y1="29" x2="94" y2="34" stroke="currentColor" stroke-width="2" stroke-dasharray="3,2" opacity="0.3"/></svg>'
    },
    'unmanned': {
      short: 'Unmanned',
      types: ['ROV - Remotely Operated Vehicle', 'UUV - Unmanned Underwater Vehicle'],
      svg: '<svg viewBox="0 0 96 48" width="58" height="30"><path fill="currentColor" d="M8,33 L14,28 L78,28 L86,33 L78,38 L14,38Z"/><circle cx="14" cy="33" r="3.5" fill="currentColor" opacity="0.35"/><path fill="currentColor" d="M80,26 L88,22 L86,28Z" opacity="0.45"/><path fill="currentColor" d="M80,40 L88,44 L86,38Z" opacity="0.45"/></svg>'
    },
  };


  // ── Sensor Type Icon Definitions (grouped, front/top-view silhouettes) ──
  const SENSOR_TYPE_ICON_DEFS = {
    // ── Radar: rotating dish antenna on pedestal, signal arcs ──
    'radar': {
      short: 'Radar',
      types: ['Radar'],
      svg: '<svg viewBox="0 0 64 64" width="46" height="46"><path fill="currentColor" d="M18,18 L32,8 L46,18 L44,22 L20,22Z"/><rect fill="currentColor" x="30" y="22" width="4" height="22" rx="1"/><rect fill="currentColor" x="22" y="44" width="20" height="6" rx="2"/><path fill="none" stroke="currentColor" stroke-width="1.5" stroke-dasharray="3,2" opacity="0.3" d="M14,14 Q32,0 50,14"/><path fill="none" stroke="currentColor" stroke-width="1.5" stroke-dasharray="3,2" opacity="0.2" d="M8,10 Q32,-8 56,10"/></svg>'
    },
    // ── Sonar: concentric ripple rings from a transducer dome ──
    'sonar': {
      short: 'Sonar',
      types: ['Hull Sonar, Active/Passive', 'Hull Sonar, Active-Only', 'Hull Sonar, Passive-Only', 'Dipping Sonar, Active/Passive', 'Dipping Sonar, Active-Only', 'VDS, Active/Passive Sonar', 'VDS, Active Only Sonar', 'TASS, Passive-Only Towed Array Sonar System', 'TASS, Active/Passive Towed Array Sonar System', 'TASS, Active Towed Array Sonar System', 'Bottom Fixed Sonar, Passive-Only', 'Acoustic Intercept (Active Sonar Warning)'],
      svg: '<svg viewBox="0 0 64 64" width="46" height="46"><ellipse cx="32" cy="32" rx="6" ry="8" fill="currentColor"/><ellipse cx="32" cy="32" rx="14" ry="18" fill="none" stroke="currentColor" stroke-width="2" opacity="0.35"/><ellipse cx="32" cy="32" rx="22" ry="26" fill="none" stroke="currentColor" stroke-width="1.5" opacity="0.2"/><ellipse cx="32" cy="32" rx="30" ry="31" fill="none" stroke="currentColor" stroke-width="1" opacity="0.12"/></svg>'
    },
    // ── ECM: jamming pod with antenna fins radiating waves ──
    'ecm': {
      short: 'ECM',
      types: ['ECM'],
      svg: '<svg viewBox="0 0 64 64" width="46" height="46"><rect fill="currentColor" x="20" y="26" width="24" height="12" rx="3"/><path fill="currentColor" d="M16,28 L20,30 L20,34 L16,36Z"/><path fill="currentColor" d="M48,28 L44,30 L44,34 L48,36Z"/><line x1="14" y1="22" x2="8" y2="16" stroke="currentColor" stroke-width="2" opacity="0.35"/><line x1="14" y1="32" x2="4" y2="32" stroke="currentColor" stroke-width="2" opacity="0.35"/><line x1="14" y1="42" x2="8" y2="48" stroke="currentColor" stroke-width="2" opacity="0.35"/><line x1="50" y1="22" x2="56" y2="16" stroke="currentColor" stroke-width="2" opacity="0.35"/><line x1="50" y1="32" x2="60" y2="32" stroke="currentColor" stroke-width="2" opacity="0.35"/><line x1="50" y1="42" x2="56" y2="48" stroke="currentColor" stroke-width="2" opacity="0.35"/></svg>'
    },
    // ── ESM: passive receiver antenna array, no emission lines ──
    'esm': {
      short: 'ESM',
      types: ['ESM'],
      svg: '<svg viewBox="0 0 64 64" width="46" height="46"><path fill="currentColor" d="M32,10 L38,18 L38,28 L26,28 L26,18Z"/><rect fill="currentColor" x="28" y="28" width="8" height="16" rx="1"/><rect fill="currentColor" x="22" y="44" width="20" height="5" rx="2"/><line x1="26" y1="16" x2="18" y2="10" stroke="currentColor" stroke-width="2.5" opacity="0.3"/><line x1="38" y1="16" x2="46" y2="10" stroke="currentColor" stroke-width="2.5" opacity="0.3"/><line x1="22" y1="12" x2="14" y2="14" stroke="currentColor" stroke-width="1.5" opacity="0.2"/><line x1="42" y1="12" x2="50" y2="14" stroke="currentColor" stroke-width="1.5" opacity="0.2"/></svg>'
    },
    // ── Infrared/EO: targeting ball turret with lens ──
    'infrared': {
      short: 'IR / EO',
      types: ['Infrared'],
      svg: '<svg viewBox="0 0 64 64" width="46" height="46"><circle cx="32" cy="28" r="16" fill="currentColor"/><circle cx="28" cy="24" r="8" fill="currentColor" opacity="0.2"/><circle cx="28" cy="24" r="4.5" fill="currentColor" opacity="0.35"/><rect fill="currentColor" x="26" y="44" width="12" height="8" rx="2"/><rect fill="currentColor" x="29" y="42" width="6" height="4" rx="1"/></svg>'
    },
    // ── Visual: binocular / optical sight ──
    'visual': {
      short: 'Visual',
      types: ['Visual'],
      svg: '<svg viewBox="0 0 64 64" width="46" height="46"><circle cx="22" cy="28" r="12" fill="none" stroke="currentColor" stroke-width="3"/><circle cx="42" cy="28" r="12" fill="none" stroke="currentColor" stroke-width="3"/><circle cx="22" cy="28" r="5" fill="currentColor" opacity="0.3"/><circle cx="42" cy="28" r="5" fill="currentColor" opacity="0.3"/><rect fill="currentColor" x="30" y="22" width="4" height="12" rx="1"/><rect fill="currentColor" x="18" y="42" width="28" height="6" rx="2" opacity="0.35"/></svg>'
    },
    // ── MAD: magnetometer boom extending from aircraft tail ──
    'mad': {
      short: 'MAD',
      types: ['MAD'],
      svg: '<svg viewBox="0 0 64 64" width="46" height="46"><rect fill="currentColor" x="30" y="6" width="4" height="40" rx="1.5"/><circle cx="32" cy="6" r="5" fill="currentColor" opacity="0.4"/><circle cx="32" cy="6" r="2.5" fill="currentColor"/><rect fill="currentColor" x="22" y="46" width="20" height="6" rx="2"/><path fill="none" stroke="currentColor" stroke-width="1.5" opacity="0.25" d="M20,16 Q26,22 20,28 Q14,34 20,40"/><path fill="none" stroke="currentColor" stroke-width="1.5" opacity="0.25" d="M44,16 Q38,22 44,28 Q50,34 44,40"/></svg>'
    },
    // ── Laser: beam emitter housing with converging beam lines ──
    'laser': {
      short: 'Laser',
      types: ['Laser Designator', 'Laser Rangefinder', 'Laser Spot Tracker (LST)'],
      svg: '<svg viewBox="0 0 64 64" width="46" height="46"><rect fill="currentColor" x="18" y="22" width="28" height="20" rx="3"/><circle cx="32" cy="32" r="6" fill="currentColor" opacity="0.35"/><circle cx="32" cy="32" r="2.5" fill="currentColor" opacity="0.6"/><line x1="32" y1="16" x2="32" y2="4" stroke="currentColor" stroke-width="2.5" opacity="0.5"/><line x1="28" y1="16" x2="22" y2="4" stroke="currentColor" stroke-width="1.5" opacity="0.25"/><line x1="36" y1="16" x2="42" y2="4" stroke="currentColor" stroke-width="1.5" opacity="0.25"/><rect fill="currentColor" x="26" y="42" width="12" height="6" rx="2" opacity="0.4"/></svg>'
    },
    // ── Mine Countermeasures: swept cable with cutter and influence gear ──
    'mine': {
      short: 'Mine\nCounter',
      types: ['Mine Sweep, Mechanical Cable Cutter', 'Mine Sweep, Magnetic & Acoustic Multi-Influence', 'Mine Sweep, Magnetic Influence', 'Mine Sweep, Acoustic Influence', 'Mine Neutralization, Diver-deployed Explosive Charge', 'Mine Neutralization, Explosive Charge Mine Disposal', 'Mine Neutralization, Moored Mine Cable Cutter'],
      svg: '<svg viewBox="0 0 64 64" width="46" height="46"><circle cx="32" cy="20" r="10" fill="currentColor"/><circle cx="32" cy="10" r="2.5" fill="currentColor" opacity="0.4"/><circle cx="24" cy="16" r="2.5" fill="currentColor" opacity="0.4"/><circle cx="40" cy="16" r="2.5" fill="currentColor" opacity="0.4"/><line x1="32" y1="30" x2="32" y2="42" stroke="currentColor" stroke-width="2" opacity="0.3"/><line x1="22" y1="40" x2="42" y2="40" stroke="currentColor" stroke-width="3"/><path fill="currentColor" d="M20,44 L24,40 L20,36Z" opacity="0.5"/><path fill="currentColor" d="M44,44 L40,40 L44,36Z" opacity="0.5"/><line x1="32" y1="42" x2="32" y2="56" stroke="currentColor" stroke-width="1.5" stroke-dasharray="3,2" opacity="0.2"/></svg>'
    },
    // ── Sensor Group: cluster of multiple sensor icons ──
    'sensor-group': {
      short: 'Sensor\nGroup',
      types: ['Sensor Group'],
      svg: '<svg viewBox="0 0 64 64" width="46" height="46"><circle cx="20" cy="20" r="8" fill="currentColor" opacity="0.5"/><circle cx="44" cy="20" r="8" fill="currentColor" opacity="0.5"/><circle cx="32" cy="40" r="8" fill="currentColor" opacity="0.5"/><line x1="26" y1="24" x2="28" y2="34" stroke="currentColor" stroke-width="1.5" opacity="0.25"/><line x1="38" y1="24" x2="36" y2="34" stroke="currentColor" stroke-width="1.5" opacity="0.25"/><line x1="28" y1="20" x2="36" y2="20" stroke="currentColor" stroke-width="1.5" opacity="0.25"/></svg>'
    },
  };

  // ── Infantry Name-Prefix Icon Definitions ──
  // These filter by name prefix (not the `type` field which is generic)
  const INFANTRY_TYPE_ICON_DEFS = {
    // ── Infantry Platoon: standing soldiers in formation ──
    'inf-plt': {
      short: 'Infantry\nPlatoon',
      prefixes: ['Inf Plt'],
      svg: '<svg viewBox="0 0 64 64" width="46" height="46"><path fill="currentColor" d="M20,14 A6,6 0 1,1 20,14.01Z"/><path fill="currentColor" d="M16,22 L24,22 L26,42 L22,42 L21,32 L20,42 L19,32 L18,42 L14,42Z"/><path fill="currentColor" d="M44,14 A6,6 0 1,1 44,14.01Z"/><path fill="currentColor" d="M40,22 L48,22 L50,42 L46,42 L45,32 L44,42 L43,32 L42,42 L38,42Z"/><path fill="currentColor" d="M32,18 A6,6 0 1,1 32,18.01Z"/><path fill="currentColor" d="M28,26 L36,26 L38,46 L34,46 L33,36 L32,46 L31,36 L30,46 L26,46Z"/><rect fill="currentColor" x="6" y="48" width="52" height="4" rx="1" opacity="0.15"/></svg>'
    },
    // ── Infantry Section: smaller fire team ──
    'inf-sec': {
      short: 'Infantry\nSection',
      prefixes: ['Inf Sec'],
      svg: '<svg viewBox="0 0 64 64" width="46" height="46"><path fill="currentColor" d="M22,16 A6,6 0 1,1 22,16.01Z"/><path fill="currentColor" d="M18,24 L26,24 L28,44 L24,44 L23,34 L22,44 L21,34 L20,44 L16,44Z"/><path fill="currentColor" d="M42,16 A6,6 0 1,1 42,16.01Z"/><path fill="currentColor" d="M38,24 L46,24 L48,44 L44,44 L43,34 L42,44 L41,34 L40,44 L36,44Z"/><line x1="26" y1="30" x2="36" y2="30" stroke="currentColor" stroke-width="1.5" opacity="0.2"/><rect fill="currentColor" x="10" y="48" width="44" height="4" rx="1" opacity="0.15"/></svg>'
    },
    // ── Mechanized Infantry: IFV/APC with troops ──
    'mech-inf': {
      short: 'Mech\nInfantry',
      prefixes: ['Mech Inf'],
      svg: '<svg viewBox="0 0 64 64" width="46" height="46"><path fill="currentColor" d="M8,28 L12,22 L52,22 L56,28 L56,40 L8,40Z"/><path fill="currentColor" d="M36,22 L36,14 L48,14 L48,22Z"/><line x1="42" y1="14" x2="42" y2="8" stroke="currentColor" stroke-width="2"/><circle cx="16" cy="44" r="5" fill="currentColor" opacity="0.5"/><circle cx="32" cy="44" r="5" fill="currentColor" opacity="0.5"/><circle cx="48" cy="44" r="5" fill="currentColor" opacity="0.5"/><rect fill="currentColor" x="10" y="24" width="4" height="4" rx="1" opacity="0.3"/><rect fill="currentColor" x="16" y="24" width="4" height="4" rx="1" opacity="0.3"/><rect fill="currentColor" x="22" y="24" width="4" height="4" rx="1" opacity="0.3"/></svg>'
    },
    // ── SAM: man-portable air defense (shoulder-launched missile) ──
    'sam': {
      short: 'MANPADS',
      prefixes: ['SAM'],
      svg: '<svg viewBox="0 0 64 64" width="46" height="46"><path fill="currentColor" d="M32,16 A5,5 0 1,1 32,16.01Z"/><path fill="currentColor" d="M28,22 L36,22 L38,44 L34,44 L33,34 L32,44 L31,34 L30,44 L26,44Z"/><path fill="currentColor" d="M36,24 L56,12 L58,14 L40,28Z" opacity="0.7"/><path fill="currentColor" d="M56,12 L62,8 L60,14Z" opacity="0.45"/></svg>'
    },
    // ── SSM: anti-tank missile team ──
    'ssm': {
      short: 'Anti-Tank',
      prefixes: ['SSM'],
      svg: '<svg viewBox="0 0 64 64" width="46" height="46"><path fill="currentColor" d="M32,20 A5,5 0 1,1 32,20.01Z"/><path fill="currentColor" d="M28,26 L36,26 L38,46 L34,46 L33,38 L32,46 L31,38 L30,46 L26,46Z"/><rect fill="currentColor" x="14" y="28" width="16" height="6" rx="2"/><path fill="currentColor" d="M14,31 L6,31 L4,29 L4,33Z" opacity="0.5"/><line x1="4" y1="28" x2="2" y2="26" stroke="currentColor" stroke-width="1.5" opacity="0.3"/><line x1="4" y1="31" x2="0" y2="31" stroke="currentColor" stroke-width="1.5" opacity="0.3"/><line x1="4" y1="34" x2="2" y2="36" stroke="currentColor" stroke-width="1.5" opacity="0.3"/></svg>'
    },
    // ── Mortar: mortar tube on baseplate ──
    'mortar': {
      short: 'Mortar',
      prefixes: ['Mortar'],
      svg: '<svg viewBox="0 0 64 64" width="46" height="46"><path fill="currentColor" d="M30,8 L34,8 L38,40 L26,40Z"/><path fill="currentColor" d="M20,40 L44,40 L48,48 L16,48Z" opacity="0.5"/><circle cx="32" cy="6" r="4" fill="currentColor" opacity="0.35"/><line x1="38" y1="28" x2="48" y2="36" stroke="currentColor" stroke-width="2.5" opacity="0.3"/></svg>'
    },
    // ── Radar (in infantry context): ground surveillance ──
    'inf-radar': {
      short: 'Radar',
      prefixes: ['Radar'],
      svg: '<svg viewBox="0 0 64 64" width="46" height="46"><path fill="currentColor" d="M18,18 L32,8 L46,18 L44,22 L20,22Z"/><rect fill="currentColor" x="30" y="22" width="4" height="22" rx="1"/><rect fill="currentColor" x="22" y="44" width="20" height="6" rx="2"/></svg>'
    },
  };

  // ── Armor Name-Prefix Icon Definitions ──
  const ARMOR_TYPE_ICON_DEFS = {
    // ── Armored Platoon (MBT): tank with turret and gun barrel ──
    'armored': {
      short: 'Tank',
      prefixes: ['Armored'],
      svg: '<svg viewBox="0 0 64 64" width="46" height="46"><path fill="currentColor" d="M10,30 L54,30 L56,36 L56,44 L8,44 L8,36Z"/><path fill="currentColor" d="M24,30 L24,20 L44,20 L44,30Z"/><path fill="currentColor" d="M44,24 L60,18 L62,20 L44,28Z"/><circle cx="14" cy="48" r="5" fill="currentColor" opacity="0.45"/><circle cx="26" cy="48" r="5" fill="currentColor" opacity="0.45"/><circle cx="38" cy="48" r="5" fill="currentColor" opacity="0.45"/><circle cx="50" cy="48" r="5" fill="currentColor" opacity="0.45"/></svg>'
    },
    // ── Mechanized Infantry (IFV/APC): lower-profile vehicle with autocannon ──
    'mech-inf': {
      short: 'IFV / APC',
      prefixes: ['Mech Inf'],
      svg: '<svg viewBox="0 0 64 64" width="46" height="46"><path fill="currentColor" d="M8,30 L12,24 L52,24 L56,30 L56,42 L8,42Z"/><path fill="currentColor" d="M30,24 L30,18 L42,18 L42,24Z"/><path fill="currentColor" d="M42,20 L56,14 L58,16 L42,24Z" opacity="0.7"/><circle cx="14" cy="46" r="5" fill="currentColor" opacity="0.45"/><circle cx="26" cy="46" r="5" fill="currentColor" opacity="0.45"/><circle cx="38" cy="46" r="5" fill="currentColor" opacity="0.45"/><circle cx="50" cy="46" r="5" fill="currentColor" opacity="0.45"/><rect fill="currentColor" x="10" y="26" width="4" height="4" rx="1" opacity="0.25"/><rect fill="currentColor" x="16" y="26" width="4" height="4" rx="1" opacity="0.25"/><rect fill="currentColor" x="22" y="26" width="4" height="4" rx="1" opacity="0.25"/></svg>'
    },
  };

  // ── Artillery Name-Prefix Icon Definitions ──
  const ARTILLERY_TYPE_ICON_DEFS = {
    // ── Howitzer: self-propelled or towed gun battery ──
    'howitzer': {
      short: 'Howitzer',
      prefixes: ['howitzer'],
      match: n => /Howitzer|Light Gun/.test(n),
      svg: '<svg viewBox="0 0 64 64" width="46" height="46"><path fill="currentColor" d="M10,32 L54,32 L56,38 L56,44 L8,44 L8,38Z"/><path fill="currentColor" d="M26,32 L26,24 L42,24 L42,32Z"/><path fill="currentColor" d="M42,27 L62,16 L64,18 L42,31Z"/><circle cx="14" cy="48" r="5" fill="currentColor" opacity="0.45"/><circle cx="28" cy="48" r="5" fill="currentColor" opacity="0.45"/><circle cx="42" cy="48" r="5" fill="currentColor" opacity="0.45"/></svg>'
    },
    // ── MLRS: multiple rocket launcher truck ──
    'mlrs': {
      short: 'MLRS',
      prefixes: ['mlrs'],
      match: n => /MLRS|Arty Plt|Arty Bn|Arty Sec/.test(n),
      svg: '<svg viewBox="0 0 64 64" width="46" height="46"><path fill="currentColor" d="M10,34 L54,34 L56,40 L56,44 L8,44 L8,40Z"/><path fill="currentColor" d="M18,34 L18,20 L46,14 L46,34Z"/><line x1="22" y1="18" x2="22" y2="32" stroke="currentColor" stroke-width="2" opacity="0.25"/><line x1="28" y1="17" x2="28" y2="32" stroke="currentColor" stroke-width="2" opacity="0.25"/><line x1="34" y1="16" x2="34" y2="32" stroke="currentColor" stroke-width="2" opacity="0.25"/><line x1="40" y1="15" x2="40" y2="32" stroke="currentColor" stroke-width="2" opacity="0.25"/><circle cx="14" cy="48" r="5" fill="currentColor" opacity="0.45"/><circle cx="28" cy="48" r="5" fill="currentColor" opacity="0.45"/><circle cx="42" cy="48" r="5" fill="currentColor" opacity="0.45"/></svg>'
    },
    // ── SSM: ballistic/cruise missile TEL ──
    'ssm': {
      short: 'SSM',
      prefixes: ['ssm'],
      match: n => n.startsWith('SSM'),
      svg: '<svg viewBox="0 0 64 64" width="46" height="46"><path fill="currentColor" d="M8,36 L56,36 L58,40 L58,44 L6,44 L6,40Z"/><path fill="currentColor" d="M14,36 L14,28 L22,22 L50,22 L50,36Z"/><path fill="currentColor" d="M22,22 L18,14 L20,12 L24,20Z" opacity="0.5"/><circle cx="14" cy="48" r="5" fill="currentColor" opacity="0.45"/><circle cx="30" cy="48" r="5" fill="currentColor" opacity="0.45"/><circle cx="46" cy="48" r="5" fill="currentColor" opacity="0.45"/></svg>'
    },
    // ── Mortar: self-propelled mortar ──
    'mortar': {
      short: 'Mortar',
      prefixes: ['mortar'],
      match: n => /Mortar/.test(n),
      svg: '<svg viewBox="0 0 64 64" width="46" height="46"><path fill="currentColor" d="M10,34 L54,34 L56,40 L56,44 L8,44 L8,40Z"/><path fill="currentColor" d="M26,34 L26,22 L34,18 L34,34Z"/><circle cx="30" cy="16" r="4" fill="currentColor" opacity="0.35"/><circle cx="14" cy="48" r="5" fill="currentColor" opacity="0.45"/><circle cx="28" cy="48" r="5" fill="currentColor" opacity="0.45"/><circle cx="42" cy="48" r="5" fill="currentColor" opacity="0.45"/></svg>'
    },
  };

  // ── Air Defense Name-Prefix Icon Definitions ──
  const AIRDEFENSE_TYPE_ICON_DEFS = {
    // ── SAM: surface-to-air missile launcher/battery ──
    'sam': {
      short: 'SAM',
      prefixes: ['sam'],
      match: n => n.startsWith('SAM'),
      svg: '<svg viewBox="0 0 64 64" width="46" height="46"><path fill="currentColor" d="M8,38 L56,38 L58,42 L58,46 L6,46 L6,42Z"/><path fill="currentColor" d="M20,38 L20,28 L44,28 L44,38Z"/><path fill="currentColor" d="M24,28 L22,14 L26,12 L28,26Z"/><path fill="currentColor" d="M36,28 L34,14 L38,12 L40,26Z"/><path fill="currentColor" d="M22,14 L20,8 L24,6Z" opacity="0.5"/><path fill="currentColor" d="M34,14 L32,8 L36,6Z" opacity="0.5"/><circle cx="14" cy="50" r="4.5" fill="currentColor" opacity="0.45"/><circle cx="28" cy="50" r="4.5" fill="currentColor" opacity="0.45"/><circle cx="42" cy="50" r="4.5" fill="currentColor" opacity="0.45"/></svg>'
    },
    // ── AAA: anti-aircraft artillery (gun systems) ──
    'aaa': {
      short: 'AAA',
      prefixes: ['aaa'],
      match: n => n.startsWith('AAA'),
      svg: '<svg viewBox="0 0 64 64" width="46" height="46"><path fill="currentColor" d="M10,38 L54,38 L56,42 L56,46 L8,46 L8,42Z"/><path fill="currentColor" d="M26,38 L26,28 L38,28 L38,38Z"/><path fill="currentColor" d="M30,28 L20,10 L24,8 L32,24Z"/><path fill="currentColor" d="M34,28 L44,10 L40,8 L32,24Z"/><circle cx="14" cy="50" r="4.5" fill="currentColor" opacity="0.45"/><circle cx="28" cy="50" r="4.5" fill="currentColor" opacity="0.45"/><circle cx="42" cy="50" r="4.5" fill="currentColor" opacity="0.45"/><line x1="22" y1="12" x2="18" y2="6" stroke="currentColor" stroke-width="1" opacity="0.3"/><line x1="42" y1="12" x2="46" y2="6" stroke="currentColor" stroke-width="1" opacity="0.3"/></svg>'
    },
  };

  // ── Radar Tab Name-Prefix Icon Definitions ──
  const RADAR_TYPE_ICON_DEFS = {
    // ── Radar: ground-based radar installation ──
    'radar': {
      short: 'Radar',
      prefixes: ['radar'],
      match: n => n.startsWith('Radar'),
      svg: '<svg viewBox="0 0 64 64" width="46" height="46"><path fill="currentColor" d="M16,20 L32,8 L48,20 L46,24 L18,24Z"/><rect fill="currentColor" x="30" y="24" width="4" height="20" rx="1"/><rect fill="currentColor" x="22" y="44" width="20" height="6" rx="2"/><path fill="none" stroke="currentColor" stroke-width="1.5" stroke-dasharray="3,2" opacity="0.3" d="M12,16 Q32,0 52,16"/><path fill="none" stroke="currentColor" stroke-width="1.5" stroke-dasharray="3,2" opacity="0.2" d="M6,12 Q32,-8 58,12"/></svg>'
    },
    // ── Vehicle: EW/ELINT/jammer vehicle ──
    'vehicle': {
      short: 'EW\nVehicle',
      prefixes: ['vehicle'],
      match: n => n.startsWith('Vehicle'),
      svg: '<svg viewBox="0 0 64 64" width="46" height="46"><path fill="currentColor" d="M10,30 L54,30 L56,36 L56,42 L8,42 L8,36Z"/><path fill="currentColor" d="M22,30 L22,20 L42,20 L42,30Z"/><circle cx="14" cy="46" r="5" fill="currentColor" opacity="0.45"/><circle cx="32" cy="46" r="5" fill="currentColor" opacity="0.45"/><circle cx="50" cy="46" r="5" fill="currentColor" opacity="0.45"/><line x1="32" y1="20" x2="32" y2="10" stroke="currentColor" stroke-width="2"/><line x1="28" y1="12" x2="36" y2="12" stroke="currentColor" stroke-width="2"/><line x1="26" y1="8" x2="38" y2="8" stroke="currentColor" stroke-width="1.5" opacity="0.3"/></svg>'
    },
    // ── Sensor: passive optical/IR sensor ──
    'sensor': {
      short: 'Sensor',
      prefixes: ['sensor'],
      match: n => n.startsWith('Sensor'),
      svg: '<svg viewBox="0 0 64 64" width="46" height="46"><circle cx="32" cy="24" r="14" fill="currentColor"/><circle cx="30" cy="22" r="6" fill="currentColor" opacity="0.2"/><circle cx="30" cy="22" r="3" fill="currentColor" opacity="0.35"/><rect fill="currentColor" x="28" y="38" width="8" height="12" rx="2"/><rect fill="currentColor" x="22" y="50" width="20" height="5" rx="2" opacity="0.4"/></svg>'
    },
    // ── HF/DF: high-frequency direction finding ──
    'hfdf': {
      short: 'HF/DF',
      prefixes: ['hfdf'],
      match: n => n.startsWith('HF/DF'),
      svg: '<svg viewBox="0 0 64 64" width="46" height="46"><circle cx="32" cy="32" r="22" fill="none" stroke="currentColor" stroke-width="2.5" opacity="0.25"/><circle cx="32" cy="32" r="14" fill="none" stroke="currentColor" stroke-width="2" opacity="0.35"/><circle cx="32" cy="32" r="6" fill="currentColor"/><line x1="32" y1="32" x2="32" y2="6" stroke="currentColor" stroke-width="2.5"/><line x1="32" y1="32" x2="50" y2="48" stroke="currentColor" stroke-width="2" opacity="0.4"/></svg>'
    },
    // ── Fixed: bottom-fixed array (SOSUS etc.) ──
    'fixed': {
      short: 'Fixed\nArray',
      prefixes: ['fixed'],
      match: n => n.startsWith('Bottom Fixed') || n.startsWith('Support'),
      svg: '<svg viewBox="0 0 64 64" width="46" height="46"><rect fill="currentColor" x="12" y="28" width="40" height="16" rx="3"/><circle cx="22" cy="36" r="4" fill="currentColor" opacity="0.3"/><circle cx="32" cy="36" r="4" fill="currentColor" opacity="0.3"/><circle cx="42" cy="36" r="4" fill="currentColor" opacity="0.3"/><line x1="20" y1="28" x2="20" y2="18" stroke="currentColor" stroke-width="1.5" opacity="0.3"/><line x1="32" y1="28" x2="32" y2="16" stroke="currentColor" stroke-width="1.5" opacity="0.3"/><line x1="44" y1="28" x2="44" y2="18" stroke="currentColor" stroke-width="1.5" opacity="0.3"/><path fill="currentColor" d="M8,44 L56,44 L60,50 L4,50Z" opacity="0.15"/></svg>'
    },
  };

  // ── Weapon Type Icon Definitions (side-profile silhouettes) ──
  const WEAPON_TYPE_ICON_DEFS = {
    // ── Guided Weapon (missile): pointed seeker, cylindrical body, cruciform fins, nozzle ──
    'Guided Weapon': { short: 'Missile',
      svg: '<svg viewBox="0 0 96 48" width="58" height="30"><path fill="currentColor" d="M2,24 L14,19 L76,19 L76,29 L14,29Z"/><path fill="currentColor" d="M72,19 L82,10 L84,19Z"/><path fill="currentColor" d="M72,29 L82,38 L84,29Z"/><path fill="currentColor" d="M76,20 L86,22 L86,26 L76,28Z" opacity="0.45"/></svg>' },

    // ── Gun: long barrel, turret housing, mount base ──
    'Gun': { short: 'Gun',
      svg: '<svg viewBox="0 0 96 48" width="58" height="30"><path fill="currentColor" d="M2,22 L56,22 L56,26 L2,26Z"/><path fill="currentColor" d="M52,16 L60,14 L78,14 L82,18 L82,30 L78,34 L60,34 L52,32Z"/><path fill="currentColor" d="M58,34 L58,40 L82,40 L82,34Z" opacity="0.4"/></svg>' },

    // ── Bomb: fat teardrop body, tail fins, nose fuse ──
    'Bomb': { short: 'Bomb',
      svg: '<svg viewBox="0 0 96 48" width="58" height="30"><path fill="currentColor" d="M8,24 L16,16 L68,16 L74,20 L74,28 L68,32 L16,32Z"/><path fill="currentColor" d="M70,16 L82,8 L84,16Z"/><path fill="currentColor" d="M70,32 L82,40 L84,32Z"/><circle cx="12" cy="24" r="3.5" fill="currentColor" opacity="0.35"/></svg>' },

    // ── Decoy: small body, chaff/flare dispersion lines ──
    'Decoy (Expendable)': { short: 'Decoy',
      svg: '<svg viewBox="0 0 96 48" width="58" height="30"><path fill="currentColor" d="M28,24 L34,19 L68,19 L74,22 L74,26 L68,29 L34,29Z"/><line x1="28" y1="22" x2="14" y2="14" stroke="currentColor" stroke-width="2" opacity="0.3"/><line x1="28" y1="24" x2="10" y2="24" stroke="currentColor" stroke-width="2" opacity="0.3"/><line x1="28" y1="26" x2="14" y2="34" stroke="currentColor" stroke-width="2" opacity="0.3"/><path fill="currentColor" d="M68,19 L76,16 L76,19Z" opacity="0.4"/><path fill="currentColor" d="M68,29 L76,32 L76,29Z" opacity="0.4"/></svg>' },

    // ── Torpedo: fat cigar body, propeller blades at tail, sonar nose ──
    'Torpedo': { short: 'Torpedo',
      svg: '<svg viewBox="0 0 96 48" width="58" height="30"><path fill="currentColor" d="M6,24 L14,16 L74,16 L82,24 L74,32 L14,32Z"/><circle cx="12" cy="24" r="4" fill="currentColor" opacity="0.3"/><path fill="currentColor" d="M78,14 L88,10 L84,20Z" opacity="0.45"/><path fill="currentColor" d="M78,34 L88,38 L84,28Z" opacity="0.45"/></svg>' },

    // ── RV/MRV/MIRV: cone-shaped reentry vehicle, ablative nose, heat shield base ──
    'RV / MRV/ MIRV': { short: 'Warhead',
      svg: '<svg viewBox="0 0 96 48" width="58" height="30"><path fill="currentColor" d="M4,24 L48,12 L76,12 L80,16 L80,32 L76,36 L48,36Z"/><rect fill="currentColor" x="78" y="14" width="8" height="20" rx="2" opacity="0.4"/></svg>' },

    // ── Helicopter-Towed Package: cable from above, sensor pod body, transducer ──
    'Helicopter-Towed Package': { short: 'Towed\nPackage',
      svg: '<svg viewBox="0 0 96 48" width="58" height="30"><line x1="48" y1="2" x2="48" y2="18" stroke="currentColor" stroke-width="2" stroke-dasharray="4,3" opacity="0.4"/><path fill="currentColor" d="M22,26 L30,20 L66,20 L72,26 L66,32 L30,32Z"/><circle cx="28" cy="26" r="4" fill="currentColor" opacity="0.35"/></svg>' },

    // ── Depth Charge: cylindrical barrel, flat ends ──
    'Depth Charge': { short: 'Depth\nCharge',
      svg: '<svg viewBox="0 0 96 48" width="58" height="30"><path fill="currentColor" d="M22,14 L26,12 L70,12 L74,14 L74,34 L70,36 L26,36 L22,34Z"/><line x1="22" y1="16" x2="22" y2="32" stroke="currentColor" stroke-width="2.5" opacity="0.3"/><line x1="74" y1="16" x2="74" y2="32" stroke="currentColor" stroke-width="2.5" opacity="0.3"/><line x1="36" y1="12" x2="36" y2="36" stroke="currentColor" stroke-width="1" opacity="0.2"/><line x1="48" y1="12" x2="48" y2="36" stroke="currentColor" stroke-width="1" opacity="0.2"/><line x1="60" y1="12" x2="60" y2="36" stroke="currentColor" stroke-width="1" opacity="0.2"/></svg>' },

    // ── Bottom Mine: spherical body, contact horns, anchor chain ──
    'Bottom Mine': { short: 'Bottom\nMine',
      svg: '<svg viewBox="0 0 96 48" width="58" height="30"><circle cx="48" cy="22" r="15" fill="currentColor"/><circle cx="48" cy="6" r="3" fill="currentColor" opacity="0.4"/><circle cx="34" cy="14" r="3" fill="currentColor" opacity="0.4"/><circle cx="62" cy="14" r="3" fill="currentColor" opacity="0.4"/><circle cx="36" cy="32" r="3" fill="currentColor" opacity="0.4"/><circle cx="60" cy="32" r="3" fill="currentColor" opacity="0.4"/><line x1="48" y1="37" x2="48" y2="46" stroke="currentColor" stroke-width="2" opacity="0.25"/></svg>' },

    // ── Rising Mine: vertical torpedo/rocket body, fins, upward launch ──
    'Rising Mine': { short: 'Rising\nMine',
      svg: '<svg viewBox="0 0 96 48" width="58" height="30"><path fill="currentColor" d="M42,6 L48,2 L54,6 L56,16 L56,34 L52,38 L44,38 L40,34 L40,16Z"/><path fill="currentColor" d="M40,30 L34,36 L40,34Z"/><path fill="currentColor" d="M56,30 L62,36 L56,34Z"/><path fill="currentColor" d="M44,38 L46,44 L48,42 L50,44 L52,38Z" opacity="0.35"/></svg>' },
  };

  // ── DOM refs ───────────────────────────
  const $ = id => document.getElementById(id);
  const content = $('content');
  const categoryTitle = $('categoryTitle');
  const itemCount = $('itemCount');
  const filterType = $('filterType');
  const filterOperator = $('filterOperator');
  const sortBy = $('sortBy');
  const globalSearch = $('globalSearch');
  const compareBtn = $('compareBtn');
  const compareCount = $('compareCount');
  const detailModal = $('detailModal');
  const compareModal = $('compareModal');
  const compareHeader = $('compareHeader');
  const modalBody = $('modalBody');
  const compareBody = $('compareBody');
  const viewToggle = $('viewToggle');
  const typeIconFiltersEl = $('typeIconFilters');

  // ── Data Loading ───────────────────────
  async function loadCategory(cat) {
    if (state.data[cat]) return state.data[cat];
    try {
      const res = await fetch(catFile(cat));
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      state.data[cat] = await res.json();
      return state.data[cat];
    } catch (e) {
      console.error(`Failed to load ${cat}:`, e);
      return [];
    }
  }

  // ── Detail Loading (lazy, on card click) ──
  async function loadDetails(cat) {
    if (state.details[cat]) return state.details[cat];
    try {
      const res = await fetch(detailFile(cat));
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      state.details[cat] = await res.json();
      return state.details[cat];
    } catch (e) {
      console.error(`Failed to load ${cat} details:`, e);
      return {};
    }
  }

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

  // ── Image Loading ──────────────────────
  let _imageMapPromise = null;
  async function loadImageMap() {
    if (state.imageMap) return;
    if (!_imageMapPromise) {
      _imageMapPromise = (async () => {
        try {
          const res = await fetch(imageFile());
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          state.imageMap = await res.json();
        } catch (e) {
          console.error('Failed to load image map:', e);
          state.imageMap = {};
        }
      })();
    }
    return _imageMapPromise;
  }

  function getWikiTitle(cat, id) {
    if (!state.imageMap || !state.imageMap[cat]) return null;
    return state.imageMap[cat][String(id)] || null;
  }

  // Resize a Wikimedia Commons URL to a given width (px)
  function wikiThumbUrl(originalUrl, width) {
    if (!originalUrl) return null;
    // Convert commons/X/XX/File.ext → commons/thumb/X/XX/File.ext/{width}px-File.ext[.png]
    const m = originalUrl.match(/\/commons\/([0-9a-f]\/[0-9a-f]{2}\/([^/?#]+))/);
    if (m) {
      const fname = m[2];
      const suffix = fname.toLowerCase().endsWith('.svg') ? '.png' : '';
      return `https://upload.wikimedia.org/wikipedia/commons/thumb/${m[1]}/${width}px-${fname}${suffix}`;
    }
    // Already a thumb URL — replace width
    const tm = originalUrl.match(/(\/thumb\/.*\/)(\d+)(px-)/);
    if (tm) return originalUrl.replace(tm[0], `${tm[1]}${width}${tm[3]}`);
    return originalUrl;
  }

  // SessionStorage key for wiki image cache
  const SS_IMG_KEY = 'cmodb_imgcache_v2';
  function loadSessionCache() {
    try {
      const raw = sessionStorage.getItem(SS_IMG_KEY);
      if (raw) {
        const obj = JSON.parse(raw);
        for (const [k, v] of Object.entries(obj)) state.imageCache.set(k, v);
      }
    } catch (e) { /* ignore */ }
  }
  function saveSessionCache() {
    try {
      const obj = {};
      state.imageCache.forEach((v, k) => { obj[k] = v; });
      sessionStorage.setItem(SS_IMG_KEY, JSON.stringify(obj));
    } catch (e) { /* ignore quota errors */ }
  }
  loadSessionCache();

  // Batch-fetch thumbnails for up to 50 wiki titles at once
  async function fetchWikiBatch(titles, width) {
    if (!titles.length) return;
    const toFetch = titles.filter(t => !state.imageCache.has(t));
    if (!toFetch.length) return;

    // Wikipedia query API: up to 50 titles per request
    const fetches = [];
    for (let i = 0; i < toFetch.length; i += 50) {
      const batch = toFetch.slice(i, i + 50);
      fetches.push((async () => {
        try {
          const params = new URLSearchParams({
            action: 'query', format: 'json', origin: '*',
            redirects: '', titles: batch.join('|'),
            prop: 'pageimages', piprop: 'original', pilimit: '50'
          });
          const res = await fetch(`https://en.wikipedia.org/w/api.php?${params}`);
          if (!res.ok) return;
          const data = await res.json();
          // Build title-resolution chain (normalize → redirect → final)
          const normMap = {}, redirMap = {};
          if (data.query?.normalized)
            for (const n of data.query.normalized) normMap[n.from] = n.to;
          if (data.query?.redirects)
            for (const r of data.query.redirects) redirMap[r.from] = r.to;
          const resolve = t => {
            let r = normMap[t] || t;
            return redirMap[r] || r;
          };
          const titleToUrl = {};
          if (data.query?.pages) {
            for (const page of Object.values(data.query.pages)) {
              if (page.original?.source) {
                titleToUrl[page.title] = wikiThumbUrl(page.original.source, width);
              }
            }
          }
          batch.forEach(t => {
            const resolved = resolve(t);
            state.imageCache.set(t, titleToUrl[resolved] || null);
          });
        } catch (e) {
          batch.forEach(t => state.imageCache.set(t, null));
        }
      })());
    }
    await Promise.all(fetches);
    saveSessionCache();
  }

  // Single-title fallback (used by detail hero)
  async function fetchWikiThumbnail(wikiTitle, width = 800) {
    if (state.imageCache.has(wikiTitle)) return state.imageCache.get(wikiTitle);
    await fetchWikiBatch([wikiTitle], width);
    return state.imageCache.get(wikiTitle) || null;
  }

  // Fetch hi-res thumbnail directly from Wikipedia API (bypasses imageCache)
  // Used by detail hero to upgrade from cached 400px → 800px
  async function fetchHiResThumb(wikiTitle, width = 800) {
    try {
      const params = new URLSearchParams({
        action: 'query', format: 'json', origin: '*',
        redirects: '', titles: wikiTitle,
        prop: 'pageimages', piprop: 'thumbnail', pithumbsize: String(width)
      });
      const res = await fetch(`https://en.wikipedia.org/w/api.php?${params}`);
      if (!res.ok) return null;
      const data = await res.json();
      const pages = data.query?.pages;
      if (!pages) return null;
      for (const page of Object.values(pages)) {
        if (page.thumbnail?.source) return page.thumbnail.source;
      }
    } catch (e) { /* fall back to cached */ }
    return null;
  }

  // Pre-fetch all images for the current category in one batch
  async function prefetchCategoryImages(cat) {
    await loadImageMap(); // ensure image map loaded
    if (!state.imageMap || !state.imageMap[cat]) return;
    const titles = Object.values(state.imageMap[cat]).filter(Boolean);
    await fetchWikiBatch(titles, 400);
  }

  // Concurrency-limited image loader (max 6 parallel downloads)
  const IMG_MAX_CONCURRENT = 6;
  function enqueueImageLoad(el, imgUrl) {
    state.imgQueue.push({ el, imgUrl });
    drainImageQueue();
  }
  function drainImageQueue() {
    while (state.imgActive < IMG_MAX_CONCURRENT && state.imgQueue.length) {
      const { el, imgUrl } = state.imgQueue.shift();
      state.imgActive++;
      const img = document.createElement('img');
      img.alt = el.dataset.alt || '';
      img.decoding = 'async';
      img.onload = () => {
        state.imgActive--;
        el.dataset.loaded = 'true';
        el.appendChild(img);
        requestAnimationFrame(() => img.classList.add('img-loaded'));
        const ph = el.querySelector('.card-image-placeholder, .card-image-placeholder-sm');
        if (ph) ph.style.opacity = '0';
        drainImageQueue();
      };
      img.onerror = () => {
        state.imgActive--;
        el.dataset.loaded = 'failed';
        drainImageQueue();
      };
      img.src = imgUrl;
    }
  }

  function initImageObserver() {
    if (state.imageObserver) state.imageObserver.disconnect();
    state.imageObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        const wiki = el.dataset.wiki;
        if (!wiki || el.dataset.loaded) return;
        // Image should already be in cache from batch prefetch
        const imgUrl = state.imageCache.get(wiki);
        if (imgUrl === undefined) { el.dataset.loaded = 'pending'; return; }
        if (!imgUrl) { el.dataset.loaded = 'failed'; state.imageObserver.unobserve(el); return; }
        el.dataset.loaded = 'pending';
        state.imageObserver.unobserve(el);
        enqueueImageLoad(el, imgUrl);
      });
    }, { rootMargin: '200px 0px', threshold: 0.01 });
  }

  function observeImages() {
    if (!state.imageObserver) return;
    document.querySelectorAll('.card-image[data-wiki]:not([data-loaded]), .card-list-thumb[data-wiki]:not([data-loaded])').forEach(el => {
      state.imageObserver.observe(el);
    });
  }

  // ── Filtering & Sorting ────────────────
  function getFilteredData(data) {
    const cat = state.currentCategory;
    const yearField = categories[cat].yearField;
    let filtered = [...data];

    // Text search
    if (state.filters.search) {
      const q = state.filters.search.toLowerCase();
      filtered = filtered.filter(item =>
        item.name.toLowerCase().includes(q) ||
        (item.type && item.type.toLowerCase().includes(q)) ||
        (item.description && item.description.toLowerCase().includes(q)) ||
        (item.operator && item.operator.toLowerCase().includes(q))
      );
    }

    // Type filter (supports ship/sensor group keys and name-prefix groups)
    if (state.filters.type) {
      const groupDef = SHIP_TYPE_ICON_DEFS[state.filters.type] || SENSOR_TYPE_ICON_DEFS[state.filters.type];
      if (groupDef && groupDef.types) {
        // Ship/sensor: filter by type field
        const typeSet = new Set(groupDef.types.map(t => t.trim()));
        filtered = filtered.filter(item => typeSet.has((item.type || '').trim()));
      } else {
        // Check name-prefix group defs (aircraft groups, infantry, armor, artillery, airdefense, radar)
        const prefixDefs = { ...AIRCRAFT_GROUP_DEFS, ...INFANTRY_TYPE_ICON_DEFS, ...ARMOR_TYPE_ICON_DEFS, ...ARTILLERY_TYPE_ICON_DEFS, ...AIRDEFENSE_TYPE_ICON_DEFS, ...RADAR_TYPE_ICON_DEFS };
        const prefixDef = prefixDefs[state.filters.type];
        if (prefixDef && (prefixDef.match || prefixDef.prefixes)) {
          filtered = filtered.filter(item => prefixDef.match ? prefixDef.match(item.name) : prefixDef.prefixes.some(p => item.name.startsWith(p)));
        } else {
          filtered = filtered.filter(item =>
            (item.type || item.category || '') === state.filters.type
          );
        }
      }
    }

    // Operator filter
    if (state.filters.operator) {
      filtered = filtered.filter(item =>
        (item.operator || '').includes(state.filters.operator)
      );
    }

    // Sorting
    const [field, dir] = state.sort.split('-');
    filtered.sort((a, b) => {
      let va, vb;
      if (field === 'name') {
        va = a.name.toLowerCase();
        vb = b.name.toLowerCase();
        return dir === 'asc' ? va.localeCompare(vb) : vb.localeCompare(va);
      }
      if (field === 'year') {
        va = a[yearField] || 0;
        vb = b[yearField] || 0;
        return dir === 'asc' ? va - vb : vb - va;
      }
      if (field === 'speed') {
        va = a.maxSpeed || 0;
        vb = b.maxSpeed || 0;
        return dir === 'asc' ? va - vb : vb - va;
      }
      if (field === 'range') {
        va = a.maxRange || a.rangeMax || 0;
        vb = b.maxRange || b.rangeMax || 0;
        return dir === 'asc' ? va - vb : vb - va;
      }
      if (field === 'weight') {
        va = a.weight || a.displacementFull || a.maxWeight || 0;
        vb = b.weight || b.displacementFull || b.maxWeight || 0;
        return dir === 'asc' ? va - vb : vb - va;
      }
      return 0;
    });

    return filtered;
  }

  // ── Populate Filters ───────────────────
  function populateFilters(data) {
    const cat = state.currentCategory;
    const types = new Set();
    const operators = new Set();

    data.forEach(item => {
      if (item.type) types.add(item.type);
      if (item.category) types.add(item.category);
      if (item.operator) {
        item.operator.split(',').map(o => o.trim()).forEach(o => operators.add(o));
      }
    });

    filterType.innerHTML = '<option value="">All Types</option>' +
      [...types].sort().map(t => `<option value="${t}">${t}</option>`).join('');

    filterOperator.innerHTML = '<option value="">All Branches</option>' +
      [...operators].sort().map(o => `<option value="${o}">${o}</option>`).join('');

    // Update sort options based on category
    let extraSorts = '';
    if (cat === 'aircraft') {
      extraSorts = `
        <option value="speed-desc">Speed (Fastest)</option>
        <option value="speed-asc">Speed (Slowest)</option>
        <option value="weight-desc">Weight (Heaviest)</option>
        <option value="weight-asc">Weight (Lightest)</option>`;
    } else if (cat === 'ships') {
      extraSorts = `
        <option value="speed-desc">Speed (Fastest)</option>
        <option value="weight-desc">Displacement (Largest)</option>
        <option value="weight-asc">Displacement (Smallest)</option>`;
    } else if (cat === 'weapons') {
      extraSorts = `
        <option value="range-desc">Range (Longest)</option>
        <option value="range-asc">Range (Shortest)</option>
        <option value="weight-desc">Weight (Heaviest)</option>`;
    } else if (cat === 'sensors') {
      extraSorts = `
        <option value="range-desc">Range (Longest)</option>
        <option value="range-asc">Range (Shortest)</option>`;
    }

    sortBy.innerHTML = `
      <option value="name-asc">Name (A-Z)</option>
      <option value="name-desc">Name (Z-A)</option>
      <option value="year-asc">Year (Oldest)</option>
      <option value="year-desc">Year (Newest)</option>
      ${extraSorts}`;
  }

  // ── Operator Badge ─────────────────────
  function operatorClass(op) {
    if (!op) return 'operator-default';
    const l = op.toLowerCase();
    if (l.includes('navy')) return 'operator-navy';
    if (l.includes('army')) return 'operator-army';
    if (l.includes('air force')) return 'operator-air-force';
    if (l.includes('marine')) return 'operator-marine-corps';
    return 'operator-default';
  }

  // ── Type Icon Filter Buttons ───────────
  function renderTypeIconFilters(data, cat) {
    if (!typeIconFiltersEl) return;

    // Aircraft: group buttons first, then direct type → icon buttons
    if (cat === 'aircraft') {
      const groupBtns = Object.entries(AIRCRAFT_GROUP_DEFS).map(([groupKey, def]) => {
        const count = data.filter(d => def.match(d.name)).length;
        if (count === 0) return '';
        const active = state.filters.type === groupKey;
        return `<button class="type-icon-btn${active ? ' active' : ''}" data-type-group="${esc(groupKey)}" title="${esc(def.short)} (${count})">
          <span class="type-icon-symbol">${def.svg}</span>
          <span>${def.short}</span>
        </button>`;
      }).join('');
      const types = [...new Set(data.map(d => d.type).filter(Boolean))].sort();
      const typeBtns = types.map(type => {
        const def = TYPE_ICON_DEFS[type];
        if (!def) return '';
        const active = state.filters.type === type;
        return `<button class="type-icon-btn${active ? ' active' : ''}" data-type="${esc(type)}" title="${esc(type)}">
          <span class="type-icon-symbol">${def.svg || ''}</span>
          <span>${def.short}</span>
        </button>`;
      }).join('');
      typeIconFiltersEl.innerHTML = groupBtns + typeBtns;
      return;
    }

    // Ships: grouped type → icon mapping
    if (cat === 'ships') {
      const dataTypes = new Set(data.map(d => (d.type || '').trim()).filter(Boolean));
      typeIconFiltersEl.innerHTML = Object.entries(SHIP_TYPE_ICON_DEFS).map(([groupKey, def]) => {
        // Only show groups that have matching data
        const trimmedTypes = def.types.map(t => t.trim());
        if (!trimmedTypes.some(t => dataTypes.has(t))) return '';
        const active = state.filters.type === groupKey;
        const count = data.filter(d => trimmedTypes.includes((d.type || '').trim())).length;
        return `<button class="type-icon-btn${active ? ' active' : ''}" data-type-group="${esc(groupKey)}" title="${esc(def.short.replace(/\\n/g, ' '))} (${count})">
          <span class="type-icon-symbol">${def.svg}</span>
          <span>${def.short}</span>
        </button>`;
      }).join('');
      return;
    }

    // Sensors: grouped type → icon mapping
    if (cat === 'sensors') {
      const dataTypes = new Set(data.map(d => (d.type || '').trim()).filter(Boolean));
      typeIconFiltersEl.innerHTML = Object.entries(SENSOR_TYPE_ICON_DEFS).map(([groupKey, def]) => {
        const trimmedTypes = def.types.map(t => t.trim());
        if (!trimmedTypes.some(t => dataTypes.has(t))) return '';
        const active = state.filters.type === groupKey;
        const count = data.filter(d => trimmedTypes.includes((d.type || '').trim())).length;
        return `<button class="type-icon-btn${active ? ' active' : ''}" data-type-group="${esc(groupKey)}" title="${esc(def.short.replace(/\\n/g, ' '))} (${count})">
          <span class="type-icon-symbol">${def.svg}</span>
          <span>${def.short}</span>
        </button>`;
      }).join('');
      return;
    }

    // Weapons: direct type → icon mapping
    if (cat === 'weapons') {
      const types = [...new Set(data.map(d => d.type).filter(Boolean))].sort();
      typeIconFiltersEl.innerHTML = types.map(type => {
        const def = WEAPON_TYPE_ICON_DEFS[type];
        if (!def) return '';
        const active = state.filters.type === type;
        return `<button class="type-icon-btn${active ? ' active' : ''}" data-type="${esc(type)}" title="${esc(type)}">
          <span class="type-icon-symbol">${def.svg}</span>
          <span>${def.short}</span>
        </button>`;
      }).join('');
      return;
    }

    // Name-prefix based categories: infantry, armor, artillery, airdefense, radar
    const PREFIX_DEFS = {
      infantry: INFANTRY_TYPE_ICON_DEFS,
      armor: ARMOR_TYPE_ICON_DEFS,
      artillery: ARTILLERY_TYPE_ICON_DEFS,
      airdefense: AIRDEFENSE_TYPE_ICON_DEFS,
      radar: RADAR_TYPE_ICON_DEFS,
    };
    const prefixDef = PREFIX_DEFS[cat];
    if (prefixDef) {
      typeIconFiltersEl.innerHTML = Object.entries(prefixDef).map(([groupKey, def]) => {
        const count = data.filter(d => def.match ? def.match(d.name) : def.prefixes.some(p => d.name.startsWith(p))).length;
        if (count === 0) return '';
        const active = state.filters.type === groupKey;
        return `<button class="type-icon-btn${active ? ' active' : ''}" data-type-group="${esc(groupKey)}" title="${esc(def.short.replace(/\\n/g, ' '))} (${count})">
          <span class="type-icon-symbol">${def.svg}</span>
          <span>${def.short}</span>
        </button>`;
      }).join('');
      return;
    }

    typeIconFiltersEl.innerHTML = '';
  }

  // ── Card Rendering ─────────────────────
  function renderCards(data) {
    const cat = state.currentCategory;
    const yearField = categories[cat].yearField;

    if (data.length === 0) {
      content.innerHTML = `<div class="no-results"><h3>No results found</h3><p>Try adjusting your filters or search terms.</p></div>`;
      itemCount.textContent = '(0 items)';
      return;
    }

    itemCount.textContent = `(${data.length} items)`;

    content.innerHTML = data.map(item => {
      const isCompared = state.compareList.some(c => c.id === item.id && c.category === cat);
      const meta = getCardMeta(item, cat);
      const tags = getCardTags(item, cat);
      const year = item[yearField] || '—';
      const wikiTitle = getWikiTitle(cat, item.id);
      const cachedImg = wikiTitle ? state.imageCache.get(wikiTitle) : null;
      const icon = catIcons[cat] || '';

      return `
        <div class="card" data-id="${item.id}" data-category="${cat}" tabindex="0" role="button" aria-label="${esc(item.name)}">
          ${state.viewMode === 'grid' ? `
            <div class="card-image" data-wiki="${esc(wikiTitle || '')}" data-alt="${esc(item.name)}" ${cachedImg ? 'data-loaded="true"' : ''}>
              <div class="card-image-placeholder" ${cachedImg ? 'style="opacity:0"' : ''}>${icon}</div>
              ${cachedImg ? `<img src="${cachedImg}" alt="${esc(item.name)}" class="img-loaded">` : ''}
            </div>
          ` : `
            <div class="card-list-thumb" data-wiki="${esc(wikiTitle || '')}" data-alt="${esc(item.name)}" ${cachedImg ? 'data-loaded="true"' : ''}>
              <div class="card-image-placeholder-sm" ${cachedImg ? 'style="opacity:0"' : ''}>${icon}</div>
              ${cachedImg ? `<img src="${cachedImg}" alt="${esc(item.name)}" class="img-loaded">` : ''}
            </div>
          `}
          <div class="card-header">
            <div>
              <div class="card-name">${esc(item.name)}</div>
              <span class="card-type">${esc(item.type || item.category || '')}</span>
            </div>
            <span class="card-year">${year}</span>
          </div>
          <div class="card-meta">
            ${meta.map(m => `
              <div class="card-meta-item">
                <span class="card-meta-label">${m.label}</span>
                <span class="card-meta-value">${m.value}</span>
              </div>
            `).join('')}
          </div>
          <div class="card-desc">${esc(item.description || '')}</div>
          <div class="card-footer">
            <div class="card-tags">
              <span class="card-operator ${operatorClass(item.operator)}">${esc(item.operator || '—')}</span>
              ${tags.map(t => `<span class="card-tag">${esc(t)}</span>`).join('')}
            </div>
            <button class="card-compare ${isCompared ? 'selected' : ''}" data-id="${item.id}" title="Add to compare">&nbsp;</button>
          </div>
          ${state.viewMode === 'list' ? `
            <div class="card-list-stats">
              ${meta.slice(0, 4).map(m => `<span><span class="card-list-stat-label">${m.label}:</span> ${m.value}</span>`).join('')}
            </div>
            <span class="card-operator ${operatorClass(item.operator)}">${esc(item.operator || '')}</span>
            <span class="card-year">${year}</span>
            <button class="card-compare ${isCompared ? 'selected' : ''}" data-id="${item.id}" title="Add to compare">&nbsp;</button>
          ` : ''}
        </div>`;
    }).join('');

    requestAnimationFrame(() => observeImages());
  }

  function getCardMeta(item, cat) {
    switch (cat) {
      case 'aircraft':
        return [
          { label: 'Max Speed', value: item.maxSpeed ? `${item.maxSpeed.toLocaleString()} kt` : '—' },
          { label: 'Crew', value: item.crew ?? '—' },
          { label: 'Max Weight', value: item.maxWeight ? `${item.maxWeight.toLocaleString()} kg` : '—' },
          { label: 'Sensors', value: item.sensorCount || 0 },
          { label: 'Weapons', value: item.weaponCount || 0 },
          { label: 'Propulsion', value: truncate(item.propulsion || '', 28) },
        ];
      case 'ships':
        return [
          { label: 'Max Speed', value: item.maxSpeed ? `${item.maxSpeed} kt` : '—' },
          { label: 'Crew', value: item.crew ? item.crew.toLocaleString() : '—' },
          { label: 'Displacement', value: item.displacementFull ? `${item.displacementFull.toLocaleString()} t` : '—' },
          { label: 'Length', value: item.length ? `${item.length} m` : '—' },
          { label: 'Weapons', value: item.weaponCount || 0 },
          { label: 'Sensors', value: item.sensorCount || 0 },
        ];
      case 'weapons': {
        const primaryRange = item.airRange != null ? { label: 'Air Range', value: `${item.airRange.toLocaleString()} km` }
          : item.surfaceRange != null ? { label: 'Surface Range', value: `${item.surfaceRange.toLocaleString()} km` }
          : item.landRange != null ? { label: 'Land Range', value: `${item.landRange.toLocaleString()} km` }
          : item.subRange != null ? { label: 'Sub Range', value: `${item.subRange.toLocaleString()} km` }
          : { label: 'Max Range', value: item.maxRange ? `${item.maxRange.toLocaleString()} km` : '—' };
        return [
          primaryRange,
          { label: 'Weight', value: item.weight ? `${item.weight.toLocaleString()} kg` : '—' },
          { label: 'Length', value: item.length ? `${item.length} m` : '—' },
          { label: 'Diameter', value: item.diameter ? `${item.diameter} m` : '—' },
        ];
      }
      case 'sensors':
        return [
          { label: 'Max Range', value: `${item.rangeMax || '—'} km` },
          { label: 'Role', value: truncate(item.role || '', 36) },
          { label: 'Type', value: item.type || '—' },
          { label: 'Generation', value: item.generation || '—' },
        ];
      case 'infantry':
      case 'armor':
      case 'artillery':
      case 'airdefense':
      case 'radar':
        return [
          { label: 'Type', value: truncate(item.type || '', 28) },
          { label: 'Crew', value: item.crew ?? '—' },
          { label: 'Size', value: item.length && item.width ? `${item.length}×${item.width} m` : '—' },
          { label: 'Sensors', value: item.sensorCount || 0 },
          { label: 'Weapons', value: item.weaponCount || 0 },
        ];
      case 'facilities':
        return [
          { label: 'Type', value: truncate(item.type || '', 28) },
          { label: 'Crew', value: item.crew ?? '—' },
          { label: 'Size', value: item.length && item.width ? `${item.length}×${item.width} m` : '—' },
          { label: 'Sensors', value: item.sensorCount || 0 },
          { label: 'Weapons', value: item.weaponCount || 0 },
          { label: 'HP', value: item.damagePoints || '—' },
        ];
      default:
        return [];
    }
  }

  function getCardTags(item, cat) {
    const tags = [];
    if (cat === 'weapons') {
      // Show which domains this weapon can target
      if (item.airRange) tags.push('Air');
      if (item.surfaceRange) tags.push('Surface');
      if (item.landRange) tags.push('Land');
      if (item.subRange) tags.push('Sub');
    }
    if (cat === 'ships' && item.maxDepth != null) {
      tags.push('Submarine');
    }
    return tags;
  }

  // ── Detail Modal ───────────────────────
  async function showDetail(item, cat) {
    // Show modal immediately with index data + loading indicator
    const yearField = categories[cat].yearField;
    const year = item[yearField] || '—';
    const wikiTitle = getWikiTitle(cat, item.id);
    const cachedImg = wikiTitle ? state.imageCache.get(wikiTitle) : null;

    // Lazy-load detail data for this category
    const allDetails = await loadDetails(cat);
    const detail = allDetails[String(item.id)] || {};
    // Merge index + detail into one object
    const d = { ...item, ...detail };

    // ── Shared peer-rank infrastructure (used by Signatures + Propulsion) ──
    const _detailsMap   = state.details[cat] || {};
    const _unitType     = item.type || '';
    const _sameTypeIds  = new Set(
      (state.data[cat] || []).filter(i => i.type === _unitType).map(i => String(i.id))
    );
    const _typeShort = _unitType
      .replace('Unmanned Combat Aerial Vehicle', 'UCAV')
      .replace('Unmanned Aerial Vehicle', 'UAV')
      .replace('Electronic Intelligence', 'ELINT')
      .replace('Airborne Early Warning', 'AEW')
      .replace('Anti-Submarine Warfare', 'ASW')
      .replace('Maritime Patrol Aircraft', 'MPA')
      .replace('Airborne Command Post', 'ACP')
      .replace('Signals Intelligence', 'SIGINT')
      .replace('Tanker (Air Refueling)', 'Tanker')
      .replace(' (Fighter/Attack)', '')
      .replace(/\s*\([^)]*\)/g, '');
    function _buildRank(arr, val, higherIsBetter) {
      if (!arr || arr.length < 2) return null;
      const total = arr.length;
      const rank  = arr.filter(v => v < val).length + 1;
      const pct   = rank / total;
      let color;
      if (higherIsBetter) color = pct >= 0.67 ? '#4caf50' : pct >= 0.33 ? '#ff9800' : '#f44336';
      else                 color = pct <= 0.33 ? '#4caf50' : pct <= 0.67 ? '#ff9800' : '#f44336';
      return { rank, total, color };
    }
    const _rankBadge = (r, suffix) => r
      ? `<span class="sig-rank-badge" style="color:${r.color};border-color:${r.color}"><span class="sig-rank-num">#${r.rank}/${r.total}</span><span class="sig-rank-prefix">${suffix}</span></span>`
      : '';

    let html = '';

    // Hero image — show cached 400px immediately, async-upgrade to 800px via API
    if (wikiTitle) {
      if (cachedImg) {
        html += `<div class="detail-hero"><img id="detailHeroImg" src="${cachedImg}" alt="${esc(d.name)}" class="img-loaded"></div>`;
      } else {
        html += `<div class="detail-hero" id="detailHeroContainer" data-wiki="${esc(wikiTitle)}">
          <div class="card-image-placeholder detail-hero-placeholder">${catIcons[cat] || ''}</div>
        </div>`;
      }
    }

    // DB variant info
    const dbInfo = d.dbName && d.dbName !== d.name ? `<div class="detail-desc" style="font-size:12px">CMO DB: ${esc(d.dbName)}${d.comments && d.comments !== '-' ? ' [' + esc(d.comments) + ']' : ''}</div>` : '';

    html += `
      <div class="detail-header">
        <div class="detail-name">${esc(d.name)}</div>
        <div class="detail-badges">
          <span class="detail-badge card-type">${esc(d.type || d.category || '')}</span>
          <span class="detail-badge card-operator ${operatorClass(d.operator)}">${esc(d.operator || '')}</span>
          <span class="detail-badge card-year">${year}</span>
        </div>
      </div>${dbInfo}`;

    // General specs
    html += `<div class="detail-section">
      <div class="detail-section-title">General Specifications</div>
      <div class="detail-section-body">
        <div class="detail-grid">${getDetailFields(d, cat).map(f =>
          `<div class="detail-field">
            <span class="detail-field-label">${f.label}</span>
            <span class="detail-field-value">${f.value}</span>
          </div>`
        ).join('')}</div>
      </div>
    </div>`;

    // Sensors table (from detail data) — accordion with descriptions
    if (d.sensors && d.sensors.length > 0) {
      const maxRange = Math.max(...d.sensors.map(s => s.rangeMax || s.maxRange || 0));
      html += `<div class="detail-section">
        <div class="detail-section-title">Sensors & EW (${d.sensors.length})</div>
        <div class="detail-section-body">
          <div class="loadout-list">${d.sensors.map((s, idx) => {
            const rng = s.rangeMax || s.maxRange || 0;
            const role = s.role || s.type || '';
            const sensorType = role.toLowerCase();
            const typeClass = sensorType.includes('radar') ? 'air' : sensorType.includes('sonar') ? 'surf' : sensorType.includes('esm') || sensorType.includes('ecm') ? 'land' : '';
            const sDesc = describeSensor(s.name, s.role, s.type);
            return `<div class="loadout-item" data-sensor="${idx}">
              <div class="loadout-header loadout-header-desc" onclick="this.parentElement.classList.toggle('open')">
                <div class="loadout-top-row">
                  <div class="loadout-chevron"></div>
                  <div class="loadout-name" title="${esc(s.name)}">${esc(s.name)}</div>
                  <div class="loadout-badges">
                    ${rng ? `<span class="loadout-badge">${rng} km</span>` : ''}
                    ${role ? `<span class="loadout-badge sensor-role ${typeClass}">${esc(role)}</span>` : ''}
                  </div>
                </div>
                ${sDesc ? `<div class="loadout-desc">${esc(sDesc)}</div>` : ''}
              </div>
              <div class="loadout-body"><div class="loadout-body-inner">
                <div class="detail-grid">
                  <div class="detail-field"><span class="detail-field-label">Role</span><span class="detail-field-value">${esc(role) || '—'}</span></div>
                  <div class="detail-field"><span class="detail-field-label">Max Range</span><span class="detail-field-value">${rng ? rng + ' km' : '—'}</span></div>
                </div>
                ${rng ? `<div style="margin-top:8px"><div class="range-bar" style="height:8px" title="${rng} km"><div class="range-bar-fill" style="width:${maxRange ? (rng / maxRange * 100) : 0}%"></div></div></div>` : ''}
              </div></div>
            </div>`;
          }).join('')}
          </div>
        </div>
      </div>`;
    }

    // Aircraft: Loadouts — with sort dropdown, mission role badges, descriptions, and clickable weapons
    if (d.loadouts && d.loadouts.length > 0) {
      html += `<div class="detail-section">
        <div class="detail-section-title" style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px">
          <span>Loadouts (${d.loadouts.length} configurations)</span>
          <select class="loadout-sort-sel" onchange="window._sortLoadouts(this.value)" title="Sort loadouts">
            <option value="default">Default Order</option>
            <option value="role">By Role / Mission</option>
            <option value="range-desc">Max Range ↓</option>
            <option value="range-asc">Max Range ↑</option>
            <option value="weight-desc">Heaviest Payload ↓</option>
            <option value="count-desc">Most Weapons ↓</option>
            <option value="alpha">A → Z Name</option>
            <option value="aa-first">Air-to-Air First</option>
          </select>
        </div>
        <div class="detail-section-body">
          <div id="loadoutListBody" class="loadout-list">${_applyLoadoutSort(d.loadouts, 'default').map(buildLoadoutItemHTML).join('')}</div>
        </div>
      </div>`;
    }

    // Ships/Facilities: Mounts — accordion with descriptions
    if (d.mounts && d.mounts.length > 0) {
      html += `<div class="detail-section">
        <div class="detail-section-title">Weapons Mounts (${d.mounts.length})</div>
        <div class="detail-section-body">
          <div class="loadout-list">${d.mounts.map((m, idx) => {
            const wpnNames = m.weapons.map(w => w.name);
            const wpnCount = m.weapons.length;
            const mountDesc = describeMount(m.name);
            return `<div class="loadout-item" data-mount="${idx}">
              <div class="loadout-header loadout-header-desc" onclick="this.parentElement.classList.toggle('open')">
                <div class="loadout-top-row">
                  <div class="loadout-chevron"></div>
                  <div class="loadout-name" title="${esc(m.name)}">${esc(m.name)}</div>
                  <div class="loadout-badges">
                    <span class="loadout-badge">${m.qty}x</span>
                    ${wpnCount > 0 ? `<span class="loadout-badge air">${wpnCount} wpn${wpnCount > 1 ? 's' : ''}</span>` : '<span class="loadout-badge">no wpns</span>'}
                  </div>
                </div>
                ${mountDesc ? `<div class="loadout-desc">${esc(mountDesc)}</div>` : ''}
              </div>
              <div class="loadout-body"><div class="loadout-body-inner">
                ${wpnCount > 0 ? `<div class="wpn-chips">${m.weapons.map(w =>
                  `<span class="wpn-chip" data-wpn-name="${esc(w.name)}" title="${esc(w.name)}${w.type ? ' (' + w.type + ')' : ''}">${esc(w.name)}</span>`
                ).join('')}</div>` : '<div style="color:var(--text-secondary);font-size:12px;padding:4px 0">No weapons loaded</div>'}
              </div></div>
            </div>`;
          }).join('')}
          </div>
        </div>
      </div>`;
    }

    // Ships: Magazines — accordion
    if (d.magazines && d.magazines.length > 0) {
      html += `<div class="detail-section">
        <div class="detail-section-title">Magazines (${d.magazines.length})</div>
        <div class="detail-section-body">
          <div class="loadout-list">${d.magazines.map((m, idx) => {
            const wpnCount = m.weapons.length;
            const magDesc = describeMount(m.name);
            return `<div class="loadout-item" data-mag="${idx}">
              <div class="loadout-header loadout-header-desc" onclick="this.parentElement.classList.toggle('open')">
                <div class="loadout-top-row">
                  <div class="loadout-chevron"></div>
                  <div class="loadout-name" title="${esc(m.name)}">${esc(m.name)}</div>
                  <div class="loadout-badges">
                    <span class="loadout-badge">${m.qty}x</span>
                    ${m.capacity != null ? `<span class="loadout-badge surf">${m.capacity} cap</span>` : ''}
                    ${wpnCount > 0 ? `<span class="loadout-badge air">${wpnCount} type${wpnCount > 1 ? 's' : ''}</span>` : ''}
                  </div>
                </div>
                ${magDesc ? `<div class="loadout-desc">${esc(magDesc)}</div>` : ''}
              </div>
              <div class="loadout-body"><div class="loadout-body-inner">
                <div class="detail-grid">
                  <div class="detail-field"><span class="detail-field-label">Quantity</span><span class="detail-field-value">${m.qty}x</span></div>
                  ${m.capacity != null ? `<div class="detail-field"><span class="detail-field-label">Capacity</span><span class="detail-field-value">${m.capacity}</span></div>` : ''}
                </div>
                ${wpnCount > 0 ? `<div class="wpn-chips" style="margin-top:8px">${m.weapons.map(w =>
                  `<span class="wpn-chip" data-wpn-name="${esc(w.name)}" title="${esc(w.name)}${w.type ? ' (' + w.type + ')' : ''}">${esc(w.name)}</span>`
                ).join('')}</div>` : '<div style="color:var(--text-secondary);font-size:12px;padding:4px 0;margin-top:4px">No weapons loaded</div>'}
              </div></div>
            </div>`;
          }).join('')}
          </div>
        </div>
      </div>`;
    }

    // Old-style weapons (for backward compat) — accordion
    if (d.weapons && d.weapons.length > 0 && !d.loadouts && !d.mounts) {
      const allRanges = d.weapons.flatMap(w => [w.airRange, w.surfaceRange, w.landRange, w.maxRange].filter(r => r != null));
      const maxR = allRanges.length ? Math.max(...allRanges) : 0;
      html += `<div class="detail-section">
        <div class="detail-section-title">Weapons (${d.weapons.length})</div>
        <div class="detail-section-body">
          <div class="loadout-list">${d.weapons.map((w, idx) => {
            const hasAir = w.airRange != null;
            const hasSurf = w.surfaceRange != null;
            const hasLand = w.landRange != null;
            const best = w.airRange || w.surfaceRange || w.landRange || w.maxRange || 0;
            return `<div class="loadout-item" data-wpn="${idx}">
              <div class="loadout-header" onclick="this.parentElement.classList.toggle('open')">
                <div class="loadout-chevron"></div>
                <div class="loadout-name wpn-link-name" data-wpn-name="${esc(w.name)}" title="${esc(w.name)}">${esc(w.name)}</div>
                <div class="loadout-badges">
                  ${best ? `<span class="loadout-badge">${best} km</span>` : ''}
                  ${hasAir ? '<span class="loadout-badge air">AIR</span>' : ''}
                  ${hasSurf ? '<span class="loadout-badge surf">SUR</span>' : ''}
                  ${hasLand ? '<span class="loadout-badge land">LND</span>' : ''}
                </div>
              </div>
              <div class="loadout-body"><div class="loadout-body-inner">
                <div class="detail-grid">
                  <div class="detail-field"><span class="detail-field-label">Type</span><span class="detail-field-value">${esc(w.type)}</span></div>
                  ${hasAir ? `<div class="detail-field"><span class="detail-field-label">Air Range</span><span class="detail-field-value">${w.airRange} km</span></div>` : ''}
                  ${hasSurf ? `<div class="detail-field"><span class="detail-field-label">Surface Range</span><span class="detail-field-value">${w.surfaceRange} km</span></div>` : ''}
                  ${hasLand ? `<div class="detail-field"><span class="detail-field-label">Land Range</span><span class="detail-field-value">${w.landRange} km</span></div>` : ''}
                  ${!hasAir && !hasSurf && !hasLand && w.maxRange ? `<div class="detail-field"><span class="detail-field-label">Max Range</span><span class="detail-field-value">${w.maxRange} km</span></div>` : ''}
                </div>
                ${best ? `<div style="margin-top:8px"><div class="range-bar" style="height:8px"><div class="range-bar-fill" style="width:${maxR ? (best / maxR * 100) : 0}%"></div></div></div>` : ''}
              </div></div>
            </div>`;
          }).join('')}
          </div>
        </div>
      </div>`;
    }

    // Signatures — accordion
    if (d.signatures && d.signatures.length > 0) {
      // Bucket config
      const sigBuckets = [
        { key: 'Visual',   label: 'Visual',   color: '#8bc34a', match: t => t.includes('Visual') },
        { key: 'Infrared', label: 'Infrared', color: '#ff9800', match: t => t.includes('Infrared') || t.includes('IR') },
        { key: 'Radar',    label: 'Radar',    color: '#4a9eff', match: t => t.includes('Radar') },
        { key: 'Sonar',    label: 'Sonar',    color: '#00bcd4', match: t => t.includes('Sonar') },
        { key: 'Other',    label: 'Other',    color: '#9e9e9e', match: () => true },
      ];
      function getSigBucket(type) {
        return sigBuckets.find(b => b.match(type)) || sigBuckets[sigBuckets.length - 1];
      }
      // Build per-sigType rank lookup using shared peer maps
      const rankMap = {}, typeRankMap = {};
      Object.entries(_detailsMap).forEach(([id, peer]) => {
        (peer.signatures || []).forEach(ps => {
          const t = ps.type || '';
          const v = Math.max(ps.front || 0, ps.side || 0, ps.rear || 0, ps.top || 0);
          if (!rankMap[t]) rankMap[t] = [];
          rankMap[t].push(v);
          if (_sameTypeIds.has(id)) {
            if (!typeRankMap[t]) typeRankMap[t] = [];
            typeRankMap[t].push(v);
          }
        });
      });
      [rankMap, typeRankMap].forEach(m => Object.keys(m).forEach(t => m[t].sort((a, b) => a - b)));
      function getSigRank(type, maxVal)     { return _buildRank(rankMap[type]     || null, maxVal, false); }
      function getSigTypeRank(type, maxVal) { return _buildRank(typeRankMap[type] || null, maxVal, false); }
      // Group by bucket
      const bucketMap = new Map();
      d.signatures.forEach((s, idx) => {
        const bk = getSigBucket(s.type || '').key;
        if (!bucketMap.has(bk)) bucketMap.set(bk, []);
        bucketMap.get(bk).push({ s, idx });
      });
      const sigGroupsHtml = sigBuckets
        .filter(b => bucketMap.has(b.key))
        .map(b => {
          const entries = bucketMap.get(b.key);
          const unit = b.key === 'Sonar' ? ' dB' : ' km';
          const rows = entries.map(({ s, idx }) => {
            const maxVal = Math.max(s.front || 0, s.side || 0, s.rear || 0, s.top || 0);
            const shortType = (s.type || '').replace(/\s*\([^)]*\)/g, '');
            const allRank  = getSigRank(s.type || '', maxVal);
            const typeRank = getSigTypeRank(s.type || '', maxVal);
            return `<div class="loadout-item perf-band-item" data-sig="${idx}">
              <div class="loadout-header" onclick="this.parentElement.classList.toggle('open')">
                <div class="loadout-chevron"></div>
                <div class="loadout-name" title="${esc(s.type)}">${esc(shortType)}</div>
                <div class="loadout-badges">
                  <span class="sig-rank-group">
                    ${_rankBadge(allRank, ' ALL')}
                    ${typeRank && typeRank.total !== allRank?.total ? _rankBadge(typeRank, ' ' + esc(_typeShort)) : ''}
                  </span>
                  <span class="loadout-badge" style="color:${b.color}">max ${maxVal}${unit}</span>
                </div>
              </div>
              <div class="loadout-body"><div class="loadout-body-inner">
                <div class="detail-grid">
                  <div class="detail-field"><span class="detail-field-label">Front</span><span class="detail-field-value">${s.front}${unit}</span></div>
                  <div class="detail-field"><span class="detail-field-label">Side</span><span class="detail-field-value">${s.side}${unit}</span></div>
                  <div class="detail-field"><span class="detail-field-label">Rear</span><span class="detail-field-value">${s.rear}${unit}</span></div>
                  <div class="detail-field"><span class="detail-field-label">Top</span><span class="detail-field-value">${s.top}${unit}</span></div>
                </div>
              </div></div>
            </div>`;
          }).join('');
          return `<div class="perf-band-group" style="--band-color:${b.color}">
            <div class="perf-band-header">
              <span class="perf-band-bucket">${b.label}</span>
            </div>
            <div class="perf-band-rows">${rows}</div>
          </div>`;
        }).join('');
      html += `<div class="detail-section">
        <div class="detail-section-title">Signatures (${d.signatures.length} types)</div>
        <div class="detail-section-body">
          <div class="loadout-list">${sigGroupsHtml}</div>
        </div>
      </div>`;
    }

    // Propulsion Performance — accordion
    if (d.propulsion && typeof d.propulsion === 'object' && d.propulsion.performances && d.propulsion.performances.length > 0) {
      const throttleMap = { 1: 'Cruise', 2: 'Military', 3: 'Afterburner' };
      const hasAlt = d.propulsion.performances[0].altBand != null;
      const thrustInfo = d.propulsion.thrustMil ? ` (${d.propulsion.engines || ''}x, ${d.propulsion.thrustMil} kgf mil${d.propulsion.thrustAB ? ', ' + d.propulsion.thrustAB + ' kgf AB' : ''})` : '';
      const maxSpd = Math.max(...d.propulsion.performances.map(p => p.speed || 0));
      // Rank max speed vs all peers and same-type peers
      const _propAllSpeeds = [], _propTypeSpeeds = [];
      Object.entries(_detailsMap).forEach(([id, peer]) => {
        if (!peer.propulsion?.performances?.length) return;
        const spd = Math.max(...peer.propulsion.performances.map(p => p.speed || 0));
        _propAllSpeeds.push(spd);
        if (_sameTypeIds.has(id)) _propTypeSpeeds.push(spd);
      });
      const _propAllRank  = _buildRank(_propAllSpeeds,  maxSpd, true);
      const _propTypeRank = _buildRank(_propTypeSpeeds, maxSpd, true);
      const _propRankHtml = `<span class="sig-rank-group" style="margin-left:8px">
        ${_rankBadge(_propAllRank, ' ALL')}
        ${_propTypeRank && _propTypeRank.total !== _propAllRank?.total ? _rankBadge(_propTypeRank, ' ' + esc(_typeShort)) : ''}
      </span>`;
      html += `<div class="detail-section">
        <div class="detail-section-title" style="display:flex;align-items:center">Propulsion Performance${_propRankHtml}</div>
        <div class="detail-section-body">
          <div style="font-size:12px;color:var(--text-secondary);margin-bottom:8px">${esc(d.propulsion.name || '')}${thrustInfo}</div>
          ${(() => {
            const bandBuckets = { 1: 'Low', 2: 'Med-Low', 3: 'Med-High', 4: 'High' };
            const bandColors  = { 1: '#6ba3d4', 2: '#5a9e5e', 3: '#c9a84e', 4: '#c45454' };
            const fmtM  = v => v >= 1000 ? (v / 1000).toFixed(1).replace(/\.0$/, '') + 'k' : Math.round(v);
            const fmtFt = v => Math.round(v / 1000) + 'k';
            // Group performances by altBand
            const groups = d.propulsion.performances.reduce((acc, p, idx) => {
              const key = p.altBand ?? 0;
              if (!acc.has(key)) acc.set(key, []);
              acc.get(key).push({ ...p, idx });
              return acc;
            }, new Map());
            // --- Band accordion rows ---
            const bandGroupsHtml = `<div class="loadout-list">${[...groups.entries()].map(([bandNum, perfs]) => {
              const first  = perfs[0];
              const mStr   = hasAlt ? `${fmtM(first.altMin)}–${fmtM(first.altMax)} m` : '';
              const ftStr  = hasAlt ? `${fmtFt(first.altMin * 3.28084)}–${fmtFt(first.altMax * 3.28084)} ft` : '';
              const bucket = bandBuckets[bandNum] || '';
              const color  = bandColors[bandNum]  || 'var(--accent)';
              const rows = perfs.map(p => {
                const throttleName  = throttleMap[p.throttle] || p.throttle;
                const throttleClass = p.throttle === 3 ? 'land' : p.throttle === 2 ? 'air' : 'surf';
                return `<div class="loadout-item perf-band-item" data-perf="${p.idx}">
                  <div class="loadout-header" onclick="this.parentElement.classList.toggle('open')">
                    <div class="loadout-chevron"></div>
                    <div class="loadout-name">${throttleName}</div>
                    <div class="loadout-badges">
                      <span class="loadout-badge ${throttleClass}">${p.speed} kt</span>
                      <span class="loadout-badge">${p.consumption} kg/hr</span>
                    </div>
                  </div>
                  <div class="loadout-body"><div class="loadout-body-inner">
                    <div class="detail-grid">
                      <div class="detail-field"><span class="detail-field-label">Throttle</span><span class="detail-field-value">${throttleName}</span></div>
                      <div class="detail-field"><span class="detail-field-label">Speed</span><span class="detail-field-value">${p.speed} kt</span></div>
                      ${hasAlt ? `<div class="detail-field"><span class="detail-field-label">Alt Range</span><span class="detail-field-value">${Math.round(p.altMin)} – ${Math.round(p.altMax)} m</span></div>` : ''}
                      <div class="detail-field"><span class="detail-field-label">Consumption</span><span class="detail-field-value">${p.consumption} kg/hr</span></div>
                    </div>
                    <div style="margin-top:8px"><div class="range-bar" style="height:8px"><div class="range-bar-fill" style="width:${maxSpd ? (p.speed / maxSpd * 100) : 0}%"></div></div></div>
                  </div></div>
                </div>`;
              }).join('');
              return `<div class="perf-band-group">
                <div class="perf-band-header" style="--band-color:${color}">
                  <span class="perf-band-num">Band ${bandNum}</span>
                  <span class="perf-band-bucket">${bucket}</span>
                  ${hasAlt ? `<span class="band-alt-range">${mStr}</span><span class="band-alt-ft">${ftStr}</span>` : ''}
                </div>
                <div class="perf-band-rows">${rows}</div>
              </div>`;
            }).join('')}</div>`;
            // --- Altitude visualization SVG ---
            const vizHtml = (() => {
              if (!hasAlt) return '';
              const W = 540, H = 310;
              const lPadM = 50, lPadFt = 84;       // dual axis: m | ft | chart
              const tPad = 18, bPad = 28;
              const chartBot = H - bPad, chartTop = tPad;
              const chartH = chartBot - chartTop;
              const barX = lPadFt + 4;
              const barW = W - barX - 10;
              // Split scale: bottom 78% = 0–15km (detail), top 22% = 15–100km (context)
              const splitY = chartBot - chartH * 0.78;       // Y pixel where 15km sits
              const yAlt = alt => {
                if (alt <= 15000) return chartBot - (alt / 15000) * (chartBot - splitY);
                return splitY - ((alt - 15000) / 85000) * (splitY - chartTop);
              };
              const bandData = [...groups.entries()].map(([bn, ps]) => ({
                num: bn, altMin: ps[0].altMin, altMax: ps[0].altMax,
                cruise: ps.find(p => p.throttle === 1)?.speed,
                mil:    ps.find(p => p.throttle === 2)?.speed,
                ab:     ps.find(p => p.throttle === 3)?.speed,
                color:  bandColors[bn] || '#888',
                bucket: bandBuckets[bn] || '',
              }));
              const absMaxSpd = Math.max(...bandData.map(b => b.ab || b.mil || b.cruise || 1));
              const spdBarW = spd => spd ? (spd / absMaxSpd) * barW * 0.68 : 0;
              const mToFt = m => Math.round(m * 3.28084);
              const fmtM  = v => v >= 1000 ? (v / 1000).toFixed(1).replace(/\.0$/, '') + ' km' : Math.round(v) + ' m';
              const fmtFt = v => { const ft = mToFt(v); return ft >= 1000 ? Math.round(ft / 1000) + 'k ft' : ft + ' ft'; };
              const F = 'system-ui,sans-serif';
              let s = `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" class="perf-alt-viz">`;
              // Defs
              s += `<defs>
                <linearGradient id="skyGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stop-color="#020408"/>
                  <stop offset="20%" stop-color="#06101e"/>
                  <stop offset="60%" stop-color="#0b1a30"/>
                  <stop offset="85%" stop-color="#0f2240"/>
                  <stop offset="100%" stop-color="#122848"/>
                </linearGradient>
              </defs>`;
              s += `<rect width="${W}" height="${H}" fill="url(#skyGrad)" rx="6"/>`;
              // Atmosphere layers (subtle fills)
              // Troposphere: 0–11km
              const tropoY = yAlt(11000);
              s += `<rect x="${barX}" y="${tropoY}" width="${barW}" height="${chartBot - tropoY}" fill="rgba(80,140,220,0.04)" rx="0"/>`;
              // Stratosphere: 11–50km
              const stratoY = yAlt(50000);
              s += `<rect x="${barX}" y="${stratoY}" width="${barW}" height="${tropoY - stratoY}" fill="rgba(60,80,160,0.03)"/>`;
              // Tropopause line
              s += `<line x1="${barX}" y1="${tropoY}" x2="${barX + barW}" y2="${tropoY}" stroke="rgba(130,190,255,0.2)" stroke-width="0.75" stroke-dasharray="6,4"/>`;
              s += `<text x="${lPadM}" y="${tropoY + 14}" text-anchor="end" font-size="7" fill="rgba(130,190,255,0.45)" font-family="${F}">Tropopause</text>`;
              // Kármán line (space) at 100km — right at chartTop
              s += `<line x1="${barX}" y1="${chartTop}" x2="${barX + barW}" y2="${chartTop}" stroke="rgba(160,200,255,0.25)" stroke-width="0.75"/>`;
              s += `<text x="${barX + barW - 4}" y="${chartTop - 3}" text-anchor="end" font-size="7.5" fill="rgba(160,200,255,0.3)" font-family="${F}">Kármán Line · 100 km / 328k ft — Space</text>`;
              // Scale break indicator
              s += `<line x1="${lPadFt - 3}" y1="${splitY}" x2="${barX + barW}" y2="${splitY}" stroke="rgba(255,255,255,0.08)" stroke-width="0.75" stroke-dasharray="2,4"/>`;
              // Axis lines
              s += `<line x1="${lPadFt}" y1="${chartTop}" x2="${lPadFt}" y2="${chartBot}" stroke="rgba(255,255,255,0.1)" stroke-width="0.75"/>`;
              // Ground
              s += `<rect x="${barX}" y="${chartBot}" width="${barW}" height="2" fill="rgba(90,80,50,0.5)" rx="1"/>`;
              // Altitude ticks: 0m + each band boundary + 50km + 100km
              const tickAlts = [0];
              bandData.forEach(b => { tickAlts.push(b.altMin); tickAlts.push(b.altMax); });
              tickAlts.push(50000, 100000);
              const uniqueTicks = [...new Set(tickAlts)].sort((a, b) => a - b);
              uniqueTicks.forEach(alt => {
                const y = yAlt(alt);
                // Tick mark
                s += `<line x1="${lPadFt - 3}" y1="${y}" x2="${lPadFt}" y2="${y}" stroke="rgba(255,255,255,0.2)" stroke-width="0.75"/>`;
                // Metre label
                s += `<text x="${lPadM}" y="${y + 3}" text-anchor="end" font-size="8.5" fill="rgba(255,255,255,0.5)" font-family="${F}">${fmtM(alt)}</text>`;
                // Feet label
                s += `<text x="${lPadFt - 6}" y="${y + 3}" text-anchor="end" font-size="7.5" fill="rgba(255,255,255,0.25)" font-family="${F}">${fmtFt(alt)}</text>`;
              });
              // Band zones + speed bars
              bandData.forEach(b => {
                const y1 = yAlt(b.altMax), y2 = yAlt(b.altMin);
                const bh = y2 - y1;
                const midY = (y1 + y2) / 2;
                // Band zone — full-width subtle fill
                s += `<rect x="${barX}" y="${y1}" width="${barW}" height="${bh}" fill="${b.color}" opacity="0.06" rx="2"/>`;
                // Left color strip on axis
                s += `<rect x="${lPadFt}" y="${y1}" width="3" height="${bh}" fill="${b.color}" opacity="0.6" rx="1"/>`;
                // Bucket label
                s += `<text x="${barX + 4}" y="${midY + 3}" font-size="8" fill="${b.color}" opacity="0.5" font-family="${F}" font-weight="700" letter-spacing="0.04em">${b.bucket.toUpperCase()}</text>`;
                // Speed bars — 3 per band
                const barH = Math.max(5, Math.min(8, (bh - 8) / 3.5));
                const totalH = barH * 3 + 3 * 2;
                const startY = midY - totalH / 2;
                const bStartX = barX + 50;
                const bMaxW = barW - 50 - 50;
                const bSpdW = spd => spd ? (spd / absMaxSpd) * bMaxW : 0;
                [
                  { spd: b.cruise, col: '#5a9e5e', lbl: 'Cruise' },
                  { spd: b.mil,    col: '#6ba3d4', lbl: 'Military' },
                  { spd: b.ab,     col: '#c45454', lbl: 'AB' },
                ].forEach((bar, j) => {
                  if (!bar.spd) return;
                  const by = startY + j * (barH + 3);
                  const bw = bSpdW(bar.spd);
                  // Track
                  s += `<rect x="${bStartX}" y="${by}" width="${bMaxW}" height="${barH}" fill="rgba(255,255,255,0.035)" rx="${barH / 2}"/>`;
                  // Fill
                  s += `<rect x="${bStartX}" y="${by}" width="${bw}" height="${barH}" fill="${bar.col}" opacity="0.6" rx="${barH / 2}"/>`;
                  // Speed label
                  s += `<text x="${bStartX + bw + 5}" y="${by + barH - 1}" font-size="8.5" fill="${bar.col}" opacity="0.85" font-family="${F}" font-weight="500">${bar.spd} kt</text>`;
                });
              });
              // Legend
              const legY = H - 9;
              const legX = barX + 50;
              [['Cruise', '#5a9e5e'], ['Military', '#6ba3d4'], ['Afterburner', '#c45454']].forEach(([lbl, col], i) => {
                const lx = legX + i * 120;
                s += `<rect x="${lx}" y="${legY - 7}" width="12" height="6" fill="${col}" opacity="0.6" rx="2"/>`;
                s += `<text x="${lx + 16}" y="${legY}" font-size="8.5" fill="rgba(255,255,255,0.35)" font-family="${F}">${lbl}</text>`;
              });
              s += `</svg>`;
              return `<div class="perf-alt-viz-wrap">${s}</div>`;
            })();
            return bandGroupsHtml + vizHtml;
          })()}
        </div>
      </div>`;
    }

    // Codes / Capabilities
    if (d.codes && d.codes.length > 0) {
      html += `<div class="detail-section">
        <div class="detail-section-title">Capabilities & Codes</div>
        <div class="detail-section-body">
          <div style="display:flex;gap:6px;flex-wrap:wrap">
            ${d.codes.map(c => `<span class="card-type">${esc(c)}</span>`).join('')}
          </div>
        </div>
      </div>`;
    }

    // Sensor detail: capabilities & frequencies
    if (d.capabilities && d.capabilities.length > 0) {
      html += `<div class="detail-section">
        <div class="detail-section-title">Capabilities</div>
        <div class="detail-section-body">
          <div style="display:flex;gap:6px;flex-wrap:wrap">
            ${d.capabilities.map(c => `<span class="card-type">${esc(c)}</span>`).join('')}
          </div>
        </div>
      </div>`;
    }
    if (d.frequencies && d.frequencies.length > 0) {
      html += `<div class="detail-section">
        <div class="detail-section-title">Frequencies</div>
        <div class="detail-section-body">
          <div style="display:flex;gap:6px;flex-wrap:wrap">
            ${d.frequencies.map(f => `<span class="card-tag" style="font-size:12px;padding:4px 10px">${esc(f)}</span>`).join('')}
          </div>
        </div>
      </div>`;
    }

    // Weapon detail: warhead, envelope
    if (d.warhead) {
      html += `<div class="detail-section">
        <div class="detail-section-title">Warhead</div>
        <div class="detail-section-body">
          <div class="detail-grid">
            <div class="detail-field"><span class="detail-field-label">Name</span><span class="detail-field-value">${esc(d.warhead.name)}</span></div>
            <div class="detail-field"><span class="detail-field-label">Type</span><span class="detail-field-value">${esc(d.warhead.type)}</span></div>
            <div class="detail-field"><span class="detail-field-label">Damage</span><span class="detail-field-value">${d.warhead.damage}</span></div>
            <div class="detail-field"><span class="detail-field-label">Explosive</span><span class="detail-field-value">${d.warhead.explosiveWeight} kg</span></div>
            ${d.warhead.numWarheads > 1 ? `<div class="detail-field"><span class="detail-field-label">Warheads</span><span class="detail-field-value">${d.warhead.numWarheads}</span></div>` : ''}
          </div>
        </div>
      </div>`;
    }

    if (d.targetSpeedMax || d.launchAltMax) {
      html += `<div class="detail-section">
        <div class="detail-section-title">Launch / Target Envelope</div>
        <div class="detail-section-body">
          <div class="detail-grid">
            ${d.launchSpeedMin != null || d.launchSpeedMax ? `<div class="detail-field"><span class="detail-field-label">Launch Speed</span><span class="detail-field-value">${d.launchSpeedMin || 0} – ${d.launchSpeedMax || '—'} kt</span></div>` : ''}
            ${d.launchAltMin != null || d.launchAltMax ? `<div class="detail-field"><span class="detail-field-label">Launch Altitude</span><span class="detail-field-value">${Math.round(d.launchAltMin || 0)} – ${Math.round(d.launchAltMax || 0)} m</span></div>` : ''}
            ${d.targetSpeedMax ? `<div class="detail-field"><span class="detail-field-label">Target Speed</span><span class="detail-field-value">${d.targetSpeedMin || 0} – ${d.targetSpeedMax} kt</span></div>` : ''}
            ${d.targetAltMax ? `<div class="detail-field"><span class="detail-field-label">Target Altitude</span><span class="detail-field-value">${Math.round(d.targetAltMin || 0)} – ${Math.round(d.targetAltMax)} m</span></div>` : ''}
            ${d.maxFlightTime ? `<div class="detail-field"><span class="detail-field-label">Max Flight Time</span><span class="detail-field-value">${d.maxFlightTime} s</span></div>` : ''}
          </div>
        </div>
      </div>`;
    }

    // Probability of Kill
    if (d.airPoK || d.surfacePoK || d.landPoK || d.subPoK) {
      html += `<div class="detail-section">
        <div class="detail-section-title">Probability of Kill</div>
        <div class="detail-section-body">
          <div class="detail-grid">
            ${d.airPoK ? `<div class="detail-field"><span class="detail-field-label">Air</span><span class="detail-field-value">${d.airPoK}%</span></div>` : ''}
            ${d.surfacePoK ? `<div class="detail-field"><span class="detail-field-label">Surface</span><span class="detail-field-value">${d.surfacePoK}%</span></div>` : ''}
            ${d.landPoK ? `<div class="detail-field"><span class="detail-field-label">Land</span><span class="detail-field-value">${d.landPoK}%</span></div>` : ''}
            ${d.subPoK ? `<div class="detail-field"><span class="detail-field-label">Subsurface</span><span class="detail-field-value">${d.subPoK}%</span></div>` : ''}
          </div>
        </div>
      </div>`;
    }

    // Weapon "Used By" placeholder (populated async)
    if (cat === 'weapons') {
      html += `<div class="detail-section" id="weaponUsedBySection" style="display:none">
        <div class="detail-section-title">Used By</div>
        <div class="detail-section-body" id="weaponUsedByBody">
          <div style="color:var(--text-secondary);font-size:12px">Scanning platforms…</div>
        </div>
      </div>`;
    }

    state.currentDetail = d;
    modalBody.innerHTML = html;
    detailModal.classList.remove('hidden');
    detailModal.querySelector('.modal-close')?.focus();

    // ── Clickable weapon chips → navigate to weapon detail card (event delegation) ──
    modalBody.addEventListener('click', async (e) => {
      const el = e.target.closest('.wpn-chip, .wpn-link-name');
      if (!el) return;
      e.stopPropagation();
      const wpnName = el.dataset.wpnName;
      if (!wpnName) return;
      if (!state.data.weapons || !state.data.weapons.length) {
        await loadCategory('weapons');
      }
      const weapon = findWeaponByName(wpnName);
      if (weapon) {
        showDetail(weapon, 'weapons');
      }
    });

    // ── Weapon: populate "Used By" async ──
    if (cat === 'weapons') {
      buildWeaponUsedBy(d.name).then(users => {
        const section = document.getElementById('weaponUsedBySection');
        const body = document.getElementById('weaponUsedByBody');
        if (!section || !body || !section.isConnected) return;
        if (users.length === 0) {
          section.style.display = 'none';
          return;
        }
        section.style.display = '';
        // Group by category
        const grouped = {};
        for (const u of users) {
          (grouped[u.cat] = grouped[u.cat] || []).push(u);
        }
        let usedHtml = '';
        for (const [uCat, units] of Object.entries(grouped)) {
          const catTitle = categories[uCat]?.title || { facilities: 'Facilities' }[uCat] || uCat.charAt(0).toUpperCase() + uCat.slice(1);
          const icon = catIcons[uCat] || '';
          usedHtml += `<div class="used-by-group">
            <div class="used-by-cat">${icon} ${esc(catTitle)}</div>
            <div class="used-by-units">${units.map(u =>
              `<span class="used-by-unit" data-cat="${esc(uCat)}" data-id="${u.id}" title="${esc(u.name)}">${esc(u.name)}</span>`
            ).join('')}</div>
          </div>`;
        }
        body.innerHTML = usedHtml;
        // Click handler — open that unit's detail card
        body.querySelectorAll('.used-by-unit').forEach(el => {
          el.addEventListener('click', () => {
            const uCat = el.dataset.cat;
            const uId = parseInt(el.dataset.id);
            const uItem = (state.data[uCat] || []).find(i => i.id === uId);
            if (uItem) showDetail(uItem, uCat);
          });
        });
      });
    }

    // ── Render per-item D3 charts ──
    if (typeof Charts !== 'undefined' && Charts.d3Ready()) {
      // Radar chart: aircraft + ships
      if (cat === 'aircraft' || cat === 'ships') {
        const radarDiv = document.createElement('div');
        radarDiv.className = 'detail-section';
        radarDiv.innerHTML = '<div class="detail-section-title">Performance Profile</div><div class="detail-section-body"><div class="chart-container" id="detailRadarChart"></div></div>';
        modalBody.appendChild(radarDiv);
        const allItems = state.data[cat] || [];
        Charts.renderRadarChart(document.getElementById('detailRadarChart'), d, cat, allItems);
      }

      // Sensor bars: aircraft + ships with sensors
      if ((cat === 'aircraft' || cat === 'ships') && d.sensors && d.sensors.length > 0) {
        const sensorDiv = document.createElement('div');
        sensorDiv.className = 'detail-section';
        sensorDiv.innerHTML = '<div class="detail-section-title">Sensor Ranges</div><div class="detail-section-body"><div class="chart-container" id="detailSensorBars"></div></div>';
        modalBody.appendChild(sensorDiv);
        Charts.renderSensorBars(document.getElementById('detailSensorBars'), d);
      }

      // Signature polar: any category with signatures
      if (d.signatures && d.signatures.length > 0) {
        const sigDiv = document.createElement('div');
        sigDiv.className = 'detail-section';
        sigDiv.innerHTML = '<div class="detail-section-title">Signature Profile</div><div class="detail-section-body"><div class="chart-container" id="detailSigPolar"></div></div>';
        modalBody.appendChild(sigDiv);
        Charts.renderSignaturePolar(document.getElementById('detailSigPolar'), d);
      }

      // Performance curves: aircraft + ships
      if ((cat === 'aircraft' || cat === 'ships') && d.propulsion?.performances?.length > 0) {
        const perfDiv = document.createElement('div');
        perfDiv.className = 'detail-section';
        perfDiv.innerHTML = '<div class="detail-section-title">Performance Curves</div><div class="detail-section-body"><div class="chart-container" id="detailPerfCurves"></div></div>';
        modalBody.appendChild(perfDiv);
        Charts.renderPerfCurves(document.getElementById('detailPerfCurves'), d);
      }

      // Range rings: weapons
      if (cat === 'weapons') {
        const ringDiv = document.createElement('div');
        ringDiv.className = 'detail-section';
        ringDiv.innerHTML = '<div class="detail-section-title">Engagement Ranges</div><div class="detail-section-body"><div class="chart-container" id="detailRangeRings"></div></div>';
        modalBody.appendChild(ringDiv);
        Charts.renderRangeRings(document.getElementById('detailRangeRings'), d);
      }

      // Loadout analysis: aircraft
      if (cat === 'aircraft' && d.loadouts && d.loadouts.length > 0) {
        const loDiv = document.createElement('div');
        loDiv.className = 'detail-section';
        loDiv.innerHTML = '<div class="detail-section-title">Loadout Analysis</div><div class="detail-section-body"><div class="chart-container" id="detailLoadout"></div></div>';
        modalBody.appendChild(loDiv);
        Charts.renderLoadoutAnalysis(document.getElementById('detailLoadout'), d);
      }

      // Weapon Domain Reach: aircraft + ships
      if ((cat === 'aircraft' || cat === 'ships') && Charts.renderDomainReach) {
        const drDiv = document.createElement('div');
        drDiv.className = 'detail-section';
        drDiv.innerHTML = '<div class="detail-section-title">Weapon Domain Reach</div><div class="detail-section-body"><div class="chart-container" id="detailDomainReach"></div></div>';
        modalBody.appendChild(drDiv);
        Charts.renderDomainReach(document.getElementById('detailDomainReach'), d, cat);
      }

      // Flight Envelope: aircraft only
      if (cat === 'aircraft' && d.propulsion?.performances?.length && Charts.renderFlightEnvelope) {
        const feDiv = document.createElement('div');
        feDiv.className = 'detail-section';
        feDiv.innerHTML = '<div class="detail-section-title">Flight Envelope</div><div class="detail-section-body"><div class="chart-container" id="detailFlightEnv"></div></div>';
        modalBody.appendChild(feDiv);
        Charts.renderFlightEnvelope(document.getElementById('detailFlightEnv'), d);
      }

      // Depth–Speed Profile: submarines only (ships with maxDepth)
      if (cat === 'ships' && d.maxDepth && d.propulsion?.performances?.length && Charts.renderDepthSpeedProfile) {
        const dsDiv = document.createElement('div');
        dsDiv.className = 'detail-section';
        dsDiv.innerHTML = '<div class="detail-section-title">Depth–Speed Profile</div><div class="detail-section-body"><div class="chart-container" id="detailDepthSpeed"></div></div>';
        modalBody.appendChild(dsDiv);
        Charts.renderDepthSpeedProfile(document.getElementById('detailDepthSpeed'), d);
      }

      // Magazine Capacity: ships only
      if (cat === 'ships' && d.magazines?.length && Charts.renderMagazineCapacity) {
        const mcDiv = document.createElement('div');
        mcDiv.className = 'detail-section';
        mcDiv.innerHTML = '<div class="detail-section-title">Magazine Capacity</div><div class="detail-section-body"><div class="chart-container" id="detailMagCap"></div></div>';
        modalBody.appendChild(mcDiv);
        Charts.renderMagazineCapacity(document.getElementById('detailMagCap'), d);
      }
    }

    // Lazy-fetch hero image if not cached
    const heroContainer = document.getElementById('detailHeroContainer');
    if (heroContainer) {
      fetchHiResThumb(heroContainer.dataset.wiki, 800).then(imgUrl => {
        if (imgUrl && heroContainer.isConnected) {
          const img = document.createElement('img');
          img.src = imgUrl;
          img.alt = d.name;
          img.onload = () => {
            heroContainer.appendChild(img);
            requestAnimationFrame(() => img.classList.add('img-loaded'));
            const ph = heroContainer.querySelector('.detail-hero-placeholder');
            if (ph) ph.style.opacity = '0';
          };
        }
      });
    }

    // Async-upgrade cached hero image to higher resolution via API
    const heroImg = document.getElementById('detailHeroImg');
    if (heroImg && wikiTitle) {
      fetchHiResThumb(wikiTitle, 800).then(hiResUrl => {
        if (hiResUrl && heroImg.isConnected && hiResUrl !== heroImg.src) {
          const upgraded = new Image();
          upgraded.onload = () => { heroImg.src = hiResUrl; };
          upgraded.src = hiResUrl;
        }
      });
    }
  }

  // ── Find a weapon in the weapons index by name (fuzzy match) ──
  function findWeaponByName(name) {
    const weapons = state.data.weapons || [];
    if (!weapons.length || !name) return null;
    const nLower = name.toLowerCase();
    // 1. Exact match on name or dbName
    let match = weapons.find(w => w.name.toLowerCase() === nLower || (w.dbName && w.dbName.toLowerCase() === nLower));
    if (match) return match;
    // 2. Substring: weapon index name contained in detail name (detail names are longer with brackets)
    match = weapons.find(w => nLower.includes(w.name.toLowerCase()));
    if (match) return match;
    // 3. Reverse substring: detail name contained in weapon index name
    match = weapons.find(w => w.name.toLowerCase().includes(nLower));
    if (match) return match;
    // 4. Prefix/family match: strip trailing version/variant info and match the base designation
    //    e.g. "RIM-66L 2 SM-2MR Blk IIIA" should match "RIM-66L-1 SM-2MR Blk III"
    const baseDesig = nLower.replace(/\s*\[.*$/, '').split(/\s+/).slice(0, 2).join(' ');
    if (baseDesig.length >= 5) {
      // Score by longest common prefix
      let bestScore = 0;
      let bestMatch = null;
      for (const w of weapons) {
        const wBase = w.name.toLowerCase().replace(/\s*\[.*$/, '');
        // Both must start with same weapon family (first token)
        const nFamily = nLower.split(/[\s-]/)[0];
        const wFamily = wBase.split(/[\s-]/)[0];
        if (nFamily !== wFamily && nFamily.length > 2) continue;
        // Find common prefix length
        let i = 0;
        while (i < nLower.length && i < wBase.length && nLower[i] === wBase[i]) i++;
        if (i > bestScore && i >= 5) {
          bestScore = i;
          bestMatch = w;
        }
      }
      if (bestMatch) return bestMatch;
    }
    return null;
  }

  // ── Build "Used By" cross-reference for a weapon name ──
  // Scans all platform categories for units that carry this weapon
  async function buildWeaponUsedBy(weaponName) {
    const users = [];
    const wLower = weaponName.toLowerCase();
    const platformCats = ['aircraft', 'ships', 'armor', 'artillery', 'airdefense', 'infantry', 'facilities', 'radar'];

    // Load all index + detail files in parallel
    const detailEntries = await Promise.all(platformCats.map(async c => {
      try {
        const index = await loadCategory(c);
        const details = await loadDetails(c);
        return { cat: c, details, index };
      } catch (e) {
        return { cat: c, details: {}, index: [] };
      }
    }));

    for (const { cat: c, details, index } of detailEntries) {
      for (const unit of index) {
        const det = details[String(unit.id)] || {};
        let found = false;

        // Check loadouts (aircraft) — check both loadout name and individual weapons
        if (det.loadouts) {
          for (const lo of det.loadouts) {
            if (lo.name && lo.name.toLowerCase().includes(wLower)) { found = true; break; }
            if (lo.weapons) {
              for (const w of lo.weapons) {
                if (w.name && w.name.toLowerCase().includes(wLower)) { found = true; break; }
              }
            }
            if (found) break;
          }
        }

        // Check mounts (ships, armor, airdefense, facilities, etc.)
        if (!found && det.mounts) {
          for (const mt of det.mounts) {
            if (mt.weapons) {
              for (const w of mt.weapons) {
                if (w.name && w.name.toLowerCase().includes(wLower)) { found = true; break; }
              }
            }
            if (found) break;
            // Also check mount name itself
            if (mt.name && mt.name.toLowerCase().includes(wLower)) { found = true; break; }
          }
        }

        // Check magazines (ships)
        if (!found && det.magazines) {
          for (const mg of det.magazines) {
            if (mg.weapons) {
              for (const w of mg.weapons) {
                if (w.name && w.name.toLowerCase().includes(wLower)) { found = true; break; }
              }
            }
            if (found) break;
          }
        }

        if (found) {
          users.push({ cat: c, id: unit.id, name: unit.name });
        }
      }
    }

    // Sort by category priority then by name
    const catOrder = { aircraft: 0, ships: 1, armor: 2, airdefense: 3, artillery: 4, infantry: 5, facilities: 6, radar: 7 };
    users.sort((a, b) => (catOrder[a.cat] ?? 99) - (catOrder[b.cat] ?? 99) || a.name.localeCompare(b.name));
    return users;
  }

  function getDetailFields(item, cat) {
    const propName = typeof item.propulsion === 'object' ? item.propulsion.name : item.propulsion;
    switch (cat) {
      case 'aircraft':
        return [
          { label: 'Crew', value: item.crew ?? '—' },
          { label: 'Max Speed', value: item.maxSpeed ? `${item.maxSpeed.toLocaleString()} kt` : '—' },
          { label: 'Wingspan', value: item.span ? `${item.span} m` : '—' },
          { label: 'Length', value: item.length ? `${item.length} m` : '—' },
          { label: 'Height', value: item.height ? `${item.height} m` : '—' },
          { label: 'Empty Weight', value: item.emptyWeight ? `${item.emptyWeight.toLocaleString()} kg` : '—' },
          { label: 'Max Weight', value: item.maxWeight ? `${item.maxWeight.toLocaleString()} kg` : '—' },
          { label: 'Max Payload', value: item.maxPayload ? `${item.maxPayload.toLocaleString()} kg` : '—' },
          { label: 'Propulsion', value: propName || '—' },
          item.agility ? { label: 'Agility', value: item.agility } : null,
          item.climbRate ? { label: 'Climb Rate', value: `${item.climbRate} m/s` } : null,
          item.totalEndurance ? { label: 'Endurance', value: `${item.totalEndurance} hrs` } : null,
          item.damagePoints ? { label: 'Damage Points', value: item.damagePoints } : null,
          item.fuselageArmor ? { label: 'Fuselage Armor', value: item.fuselageArmor } : null,
          item.engineArmor ? { label: 'Engine Armor', value: item.engineArmor } : null,
          item.cockpitArmor ? { label: 'Cockpit Armor', value: item.cockpitArmor } : null,
        ].filter(Boolean);
      case 'ships':
        return [
          { label: 'Crew', value: item.crew ? item.crew.toLocaleString() : '—' },
          { label: 'Max Speed', value: item.maxSpeed ? `${item.maxSpeed} kt` : '—' },
          { label: 'Length', value: item.length ? `${item.length} m` : '—' },
          { label: 'Beam', value: item.beam ? `${item.beam} m` : '—' },
          { label: 'Draft', value: item.draft ? `${item.draft} m` : '—' },
          { label: 'Height', value: item.height ? `${item.height} m` : '—' },
          item.displacementEmpty ? { label: 'Empty Displacement', value: `${item.displacementEmpty.toLocaleString()} t` } : null,
          item.displacementStandard ? { label: 'Standard Disp.', value: `${item.displacementStandard.toLocaleString()} t` } : null,
          { label: 'Full Displacement', value: item.displacementFull ? `${item.displacementFull.toLocaleString()} t` : '—' },
          item.maxDepth != null && item.maxDepth > 0 ? { label: 'Max Depth', value: `${item.maxDepth} m` } : null,
          item.damagePoints ? { label: 'Damage Points', value: item.damagePoints.toLocaleString() } : null,
          propName ? { label: 'Propulsion', value: propName } : null,
        ].filter(Boolean);
      case 'weapons': {
        const ranges = [
          item.airRange != null ? { label: 'Air Range', value: `${item.airRange} km` } : null,
          item.surfaceRange != null ? { label: 'Surface Range', value: `${item.surfaceRange} km` } : null,
          item.landRange != null ? { label: 'Land Range', value: `${item.landRange} km` } : null,
          item.subRange != null ? { label: 'Subsurface Range', value: `${item.subRange} km` } : null,
        ].filter(Boolean);
        const minRanges = [
          item.airRangeMin ? { label: 'Air Min Range', value: `${item.airRangeMin} km` } : null,
          item.surfaceRangeMin ? { label: 'Surface Min Range', value: `${item.surfaceRangeMin} km` } : null,
          item.landRangeMin ? { label: 'Land Min Range', value: `${item.landRangeMin} km` } : null,
          item.subRangeMin ? { label: 'Sub Min Range', value: `${item.subRangeMin} km` } : null,
        ].filter(Boolean);
        return [
          { label: 'Weight', value: item.weight ? `${item.weight.toLocaleString()} kg` : '—' },
          item.burnoutWeight ? { label: 'Burnout Weight', value: `${item.burnoutWeight.toLocaleString()} kg` } : null,
          { label: 'Length', value: item.length ? `${item.length} m` : '—' },
          { label: 'Diameter', value: item.diameter ? `${item.diameter} m` : '—' },
          { label: 'Span', value: item.span ? `${item.span} m` : '—' },
          ...ranges,
          ...minRanges,
          item.climbRate ? { label: 'Climb Rate', value: `${item.climbRate} m/s` } : null,
          item.cruiseAltitude ? { label: 'Cruise Altitude', value: `${Math.round(item.cruiseAltitude).toLocaleString()} m` } : null,
          item.cep ? { label: 'CEP (Air)', value: `${item.cep} m` } : null,
          item.cepSurface ? { label: 'CEP (Surface)', value: `${item.cepSurface} m` } : null,
          item.torpSpeedCruise ? { label: 'Torpedo Speed (Cruise)', value: `${item.torpSpeedCruise} kt` } : null,
          item.torpRangeCruise ? { label: 'Torpedo Range (Cruise)', value: `${item.torpRangeCruise} km` } : null,
          item.torpSpeedFull ? { label: 'Torpedo Speed (Full)', value: `${item.torpSpeedFull} kt` } : null,
          item.torpRangeFull ? { label: 'Torpedo Range (Full)', value: `${item.torpRangeFull} km` } : null,
        ].filter(Boolean);
      }
      case 'sensors':
        return [
          { label: 'Role', value: item.role || '—' },
          { label: 'Max Range', value: `${item.rangeMax || '—'} km` },
          { label: 'Min Range', value: `${item.rangeMin || '—'} km` },
          item.altitudeMax ? { label: 'Alt. Max', value: `${item.altitudeMax.toLocaleString()} m` } : null,
          item.altitudeMin ? { label: 'Alt. Min', value: `${item.altitudeMin.toLocaleString()} m` } : null,
          { label: 'Generation', value: item.generation || '—' },
          item.scanInterval ? { label: 'Scan Interval', value: `${item.scanInterval} s` } : null,
          item.maxContactsAir ? { label: 'Max Contacts (Air)', value: item.maxContactsAir } : null,
          item.maxContactsSurface ? { label: 'Max Contacts (Surface)', value: item.maxContactsSurface } : null,
          item.maxContactsSub ? { label: 'Max Contacts (Sub)', value: item.maxContactsSub } : null,
          // Radar specs
          item.radarPeakPower ? { label: 'Peak Power', value: `${item.radarPeakPower} kW` } : null,
          item.radarHBeamwidth ? { label: 'H Beamwidth', value: `${item.radarHBeamwidth}°` } : null,
          item.radarVBeamwidth ? { label: 'V Beamwidth', value: `${item.radarVBeamwidth}°` } : null,
          item.radarPulseWidth ? { label: 'Pulse Width', value: `${item.radarPulseWidth} μs` } : null,
          item.radarPRF ? { label: 'PRF', value: `${item.radarPRF} Hz` } : null,
          item.radarNoiseLevel ? { label: 'Noise Level', value: `${item.radarNoiseLevel} dB` } : null,
          item.radarProcessingGL ? { label: 'Processing G/L', value: `${item.radarProcessingGL} dB` } : null,
          item.radarBlindTime ? { label: 'Blind Time', value: `${item.radarBlindTime} s` } : null,
          // Resolution
          item.resolutionRange ? { label: 'Range Resolution', value: `${item.resolutionRange} m` } : null,
          item.resolutionHeight ? { label: 'Height Resolution', value: `${item.resolutionHeight} m` } : null,
          item.resolutionAngle ? { label: 'Angle Resolution', value: `${item.resolutionAngle}°` } : null,
          item.directionFindingAccuracy ? { label: 'DF Accuracy', value: `${item.directionFindingAccuracy}°` } : null,
          // ESM/ECM
          item.esmSensitivity ? { label: 'ESM Sensitivity', value: `${item.esmSensitivity} dBm` } : null,
          item.esmChannels ? { label: 'ESM Channels', value: item.esmChannels } : null,
          item.ecmGain ? { label: 'ECM Gain', value: `${item.ecmGain} dB` } : null,
          item.ecmPeakPower ? { label: 'ECM Peak Power', value: `${item.ecmPeakPower} kW` } : null,
          item.ecmTargets ? { label: 'ECM Max Targets', value: item.ecmTargets } : null,
          // Sonar
          item.sonarSourceLevel ? { label: 'Sonar Source Level', value: `${item.sonarSourceLevel} dB` } : null,
          item.sonarDirectivity ? { label: 'Sonar Directivity', value: `${item.sonarDirectivity} dB` } : null,
        ].filter(Boolean);
      case 'infantry':
      case 'armor':
      case 'artillery':
      case 'airdefense':
      case 'radar':
      case 'facilities':
        return [
          { label: 'Crew', value: item.crew ?? '—' },
          { label: 'Length', value: item.length ? `${item.length} m` : '—' },
          { label: 'Width', value: item.width ? `${item.width} m` : '—' },
          item.area ? { label: 'Area', value: `${item.area.toLocaleString()} m²` } : null,
          item.damagePoints ? { label: 'Damage Points', value: item.damagePoints } : null,
          item.armorGeneral ? { label: 'Armor', value: item.armorGeneral } : null,
          item.mastHeight ? { label: 'Mast Height', value: `${item.mastHeight} m` } : null,
        ].filter(Boolean);
      default:
        return [];
    }
  }

  // ── Compare View (Advanced Full-Screen) ───────────────────────
  const COMPARE_COLORS = ['#6ba3d4', '#5a9e5e', '#c48a4a', '#c45454', '#8a6aad'];

  async function showCompare() {
    if (state.compareList.length < 2) return;

    // Show modal immediately with loading
    compareHeader.innerHTML = '';
    compareBody.innerHTML = '<div class="compare-loading">Loading detailed data…</div>';
    compareModal.classList.remove('hidden');

    // Group by category
    const byCat = {};
    state.compareList.forEach(c => {
      if (!byCat[c.category]) byCat[c.category] = [];
      byCat[c.category].push(c);
    });

    // Lazy-load detail data for all relevant categories
    const catKeys = Object.keys(byCat);
    await Promise.all(catKeys.map(cat => loadDetails(cat)));

    // Build merged items (index + detail)
    const allMerged = {};
    for (const cat of catKeys) {
      const data = state.data[cat] || [];
      const details = state.details[cat] || {};
      allMerged[cat] = byCat[cat]
        .map(c => {
          const idx = data.find(d => d.id === c.id);
          if (!idx) return null;
          return { ...idx, ...(details[String(c.id)] || {}) };
        })
        .filter(Boolean);
    }

    // Find the primary category (most items, or first)
    const primaryCat = catKeys.reduce((a, b) =>
      (allMerged[b] || []).length > (allMerged[a] || []).length ? b : a
    , catKeys[0]);
    const primaryItems = allMerged[primaryCat] || [];
    if (primaryItems.length < 2) {
      compareBody.innerHTML = '<p style="color:var(--text-muted);padding:40px;text-align:center">Select at least 2 items from the same category to compare.</p>';
      return;
    }

    // ── Sticky Header ──
    const yearField = categories[primaryCat].yearField;
    let headerHtml = '';
    primaryItems.forEach((item, i) => {
      const col = COMPARE_COLORS[i];
      const year = item[yearField] || '';
      const wikiTitle = getWikiTitle(primaryCat, item.id);
      const imgUrl = wikiTitle ? state.imageCache.get(wikiTitle) : null;
      const thumbHtml = imgUrl
        ? `<img class="compare-header-thumb" src="${imgUrl}" alt="${esc(item.name)}" style="border-color:${col}">`
        : `<div class="compare-header-thumb-placeholder" style="border-color:${col}">${catIcons[primaryCat] || '?'}</div>`;
      headerHtml += `<div class="compare-header-item">
        <button class="compare-header-remove" data-idx="${i}" title="Remove">&times;</button>
        ${thumbHtml}
        <div class="compare-header-name" title="${esc(item.name)}">${esc(item.name)}</div>
        <div class="compare-header-meta">${esc(item.type || '')}${year ? ' · ' + year : ''}</div>
        <div class="compare-header-color" style="background:${col}"></div>
      </div>`;
    });
    compareHeader.innerHTML = headerHtml;

    // Remove button handlers
    compareHeader.querySelectorAll('.compare-header-remove').forEach(btn => {
      btn.onclick = () => {
        const idx = parseInt(btn.dataset.idx);
        const item = primaryItems[idx];
        if (item) {
          toggleCompare(item.id, primaryCat);
          if (state.compareList.length >= 2) showCompare();
          else compareModal.classList.add('hidden');
        }
      };
    });

    // ── Build Sections ──
    let bodyHtml = '';

    for (const [cat, items] of Object.entries(allMerged)) {
      if (items.length < 2) continue;

      bodyHtml += `<h2 style="color:var(--accent);font-size:16px;margin:0 0 20px;text-transform:uppercase;letter-spacing:1px">${categories[cat].title} Comparison</h2>`;

      // §1 General Specifications table
      const specFields = getCompareFieldsFull(cat);
      if (specFields.length) {
        bodyHtml += renderCompareTable('General Specifications', specFields, items, `cmpSpecs-${cat}`);
      }

      // §2 Propulsion Performance
      if (items.some(it => it.propulsion && typeof it.propulsion === 'object' && it.propulsion.performances?.length)) {
        const propFields = [
          { label: 'Propulsion', getValue: i => (typeof i.propulsion === 'object' ? i.propulsion.name : i.propulsion) || '—' },
          { label: 'Max Speed (kt)', getValue: i => {
            const perfs = i.propulsion?.performances || [];
            return perfs.length ? Math.max(...perfs.map(p => p.speed || 0)) : (i.maxSpeed || 0);
          }, higherIsBetter: true },
          { label: 'Engine Count', getValue: i => i.propulsion?.engines ?? '—' },
          { label: 'Thrust (Mil)', getValue: i => i.propulsion?.thrustMil ? i.propulsion.thrustMil + ' kgf' : '—', higherIsBetter: true },
          { label: 'Thrust (AB)', getValue: i => i.propulsion?.thrustAB ? i.propulsion.thrustAB + ' kgf' : '—', higherIsBetter: true },
        ];
        bodyHtml += renderCompareTable('Propulsion Performance', propFields, items);
        bodyHtml += `<div class="compare-chart" id="cmpSpeedChart-${cat}"><div class="compare-chart-title">Speed Comparison by Throttle</div></div>`;
      }

      // §3 Signatures
      if (items.some(it => it.signatures?.length)) {
        const sigTypes = ['Visual', 'Infrared', 'Radar', 'Sonar'];
        const sigFields = sigTypes.map(st => ({
          label: `${st} (max)`,
          getValue: i => {
            let max = 0;
            (i.signatures || []).forEach(s => {
              if ((s.type || '').includes(st)) {
                const v = Math.max(s.front || 0, s.side || 0, s.rear || 0, s.top || 0);
                if (v > max) max = v;
              }
            });
            return max || '—';
          },
          higherIsBetter: false,
        }));
        bodyHtml += renderCompareTable('Signatures', sigFields, items);
        bodyHtml += `<div class="compare-chart" id="cmpSigChart-${cat}"><div class="compare-chart-title">Signature Profile Overlay</div></div>`;
      }

      // §4 Sensors
      if (items.some(it => it.sensors?.length)) {
        const sensorSummaryFields = [
          { label: 'Total Sensors', getValue: i => (i.sensors || []).length, higherIsBetter: true },
          { label: 'Max Sensor Range (km)', getValue: i => {
            const ranges = (i.sensors || []).map(s => s.rangeMax || s.maxRange || 0);
            return ranges.length ? Math.max(...ranges) : 0;
          }, higherIsBetter: true },
        ];
        bodyHtml += renderCompareTable('Sensors', sensorSummaryFields, items);

        // Sensor list per item
        bodyHtml += `<div class="compare-list-section" style="grid-template-columns:repeat(${items.length}, 1fr)">`;
        items.forEach((item, i) => {
          const col = COMPARE_COLORS[i];
          const sensors = (item.sensors || []).sort((a, b) => (b.rangeMax || b.maxRange || 0) - (a.rangeMax || a.maxRange || 0));
          bodyHtml += `<div class="compare-list-column">
            <div class="compare-list-column-title"><span style="color:${col}">${esc(item.name)}</span> <span class="compare-list-badge">${sensors.length}</span></div>
            ${sensors.map(s => {
              const rng = s.rangeMax || s.maxRange || 0;
              const role = s.role || s.type || '';
              return `<div class="compare-list-item"><span>${esc(s.name)}</span><span class="compare-list-badge">${rng ? rng + ' km' : role}</span></div>`;
            }).join('')}
          </div>`;
        });
        bodyHtml += `</div>`;
        bodyHtml += `<div class="compare-chart" id="cmpSensorChart-${cat}"><div class="compare-chart-title">Sensor Range Comparison</div></div>`;
      }

      // §5 Weapons/Mounts (ships/facilities/ground)
      if (items.some(it => it.mounts?.length)) {
        const mountFields = [
          { label: 'Total Mounts', getValue: i => (i.mounts || []).length, higherIsBetter: true },
          { label: 'Total Weapons', getValue: i => (i.mounts || []).reduce((s, m) => s + m.weapons.length, 0), higherIsBetter: true },
        ];
        bodyHtml += renderCompareTable('Weapons Mounts', mountFields, items);

        bodyHtml += `<div class="compare-list-section" style="grid-template-columns:repeat(${items.length}, 1fr)">`;
        items.forEach((item, i) => {
          const col = COMPARE_COLORS[i];
          bodyHtml += `<div class="compare-list-column">
            <div class="compare-list-column-title"><span style="color:${col}">${esc(item.name)}</span> <span class="compare-list-badge">${(item.mounts || []).length} mounts</span></div>
            ${(item.mounts || []).map(m => `<div class="compare-list-item"><span>${esc(m.name)}</span><span class="compare-list-badge">${m.qty}x · ${m.weapons.length} wpns</span></div>`).join('')}
          </div>`;
        });
        bodyHtml += `</div>`;
      }

      // §6 Loadouts (aircraft)
      if (items.some(it => it.loadouts?.length)) {
        const loadoutFields = [
          { label: 'Total Loadouts', getValue: i => (i.loadouts || []).length, higherIsBetter: true },
        ];
        bodyHtml += renderCompareTable('Loadouts', loadoutFields, items);

        bodyHtml += `<div class="compare-list-section" style="grid-template-columns:repeat(${items.length}, 1fr)">`;
        items.forEach((item, i) => {
          const col = COMPARE_COLORS[i];
          const loadouts = (item.loadouts || []).slice(0, 8);
          bodyHtml += `<div class="compare-list-column">
            <div class="compare-list-column-title"><span style="color:${col}">${esc(item.name)}</span> <span class="compare-list-badge">${(item.loadouts || []).length}</span></div>
            ${loadouts.map(l => {
              const wpnCount = (l.weapons || l.loads || []).length;
              return `<div class="compare-list-item"><span>${esc(l.name || 'Unnamed')}</span><span class="compare-list-badge">${wpnCount} wpns</span></div>`;
            }).join('')}
            ${(item.loadouts || []).length > 8 ? `<div class="compare-list-item" style="color:var(--text-muted);font-style:italic">+${(item.loadouts || []).length - 8} more…</div>` : ''}
          </div>`;
        });
        bodyHtml += `</div>`;
      }

      // §7 Magazines (ships)
      if (items.some(it => it.magazines?.length)) {
        const magFields = [
          { label: 'Magazine Count', getValue: i => (i.magazines || []).length, higherIsBetter: true },
          { label: 'Total Capacity', getValue: i => (i.magazines || []).reduce((s, m) => s + ((m.capacity || 0) * (m.qty || 1)), 0), higherIsBetter: true },
        ];
        bodyHtml += renderCompareTable('Magazines', magFields, items);
        bodyHtml += `<div class="compare-chart" id="cmpMagChart-${cat}"><div class="compare-chart-title">Total Magazine Capacity</div></div>`;

        bodyHtml += `<div class="compare-list-section" style="grid-template-columns:repeat(${items.length}, 1fr)">`;
        items.forEach((item, i) => {
          const col = COMPARE_COLORS[i];
          bodyHtml += `<div class="compare-list-column">
            <div class="compare-list-column-title"><span style="color:${col}">${esc(item.name)}</span></div>
            ${(item.magazines || []).map(m => `<div class="compare-list-item"><span>${esc(m.name)}</span><span class="compare-list-badge">${m.qty}x · cap ${m.capacity || '?'}</span></div>`).join('')}
          </div>`;
        });
        bodyHtml += `</div>`;
      }

      // §8 Weapons Detail (weapons category)
      if (cat === 'weapons') {
        const wpnFields = [
          { label: 'Weight (kg)', getValue: i => i.weight ? i.weight.toLocaleString() : '—', higherIsBetter: false },
          { label: 'Length (m)', getValue: i => i.length || '—' },
          { label: 'Diameter (m)', getValue: i => i.diameter || '—' },
          { label: 'Span (m)', getValue: i => i.span || '—' },
          { label: 'Air Range (km)', getValue: i => i.airRange ?? '—', higherIsBetter: true },
          { label: 'Surface Range (km)', getValue: i => i.surfaceRange ?? '—', higherIsBetter: true },
          { label: 'Land Range (km)', getValue: i => i.landRange ?? '—', higherIsBetter: true },
          { label: 'Sub Range (km)', getValue: i => i.subRange ?? '—', higherIsBetter: true },
          { label: 'CEP Air (m)', getValue: i => i.cep ?? '—', higherIsBetter: false },
          { label: 'CEP Surface (m)', getValue: i => i.cepSurface ?? '—', higherIsBetter: false },
          { label: 'Cruise Alt. (m)', getValue: i => i.cruiseAltitude ? Math.round(i.cruiseAltitude).toLocaleString() : '—' },
          { label: 'Climb Rate (m/s)', getValue: i => i.climbRate ?? '—', higherIsBetter: true },
        ];
        bodyHtml += renderCompareTable('Weapons Detail', wpnFields, items);
        bodyHtml += `<div class="compare-chart" id="cmpWpnRangeChart-${cat}"><div class="compare-chart-title">Range Comparison by Domain</div></div>`;
      }

      // §9 Sensor Detail (sensors category)
      if (cat === 'sensors') {
        const sensorFields = [
          { label: 'Role', getValue: i => i.role || '—' },
          { label: 'Max Range (km)', getValue: i => i.rangeMax || 0, higherIsBetter: true },
          { label: 'Min Range (km)', getValue: i => i.rangeMin || 0, higherIsBetter: false },
          { label: 'Alt. Max (m)', getValue: i => i.altitudeMax ? i.altitudeMax.toLocaleString() : '—', higherIsBetter: true },
          { label: 'Alt. Min (m)', getValue: i => i.altitudeMin ? i.altitudeMin.toLocaleString() : '—' },
          { label: 'Generation', getValue: i => i.generation || '—' },
          { label: 'Scan Interval (s)', getValue: i => i.scanInterval ?? '—', higherIsBetter: false },
          { label: 'Peak Power (kW)', getValue: i => i.radarPeakPower ?? '—', higherIsBetter: true },
          { label: 'H Beamwidth (°)', getValue: i => i.radarHBeamwidth ?? '—', higherIsBetter: false },
          { label: 'V Beamwidth (°)', getValue: i => i.radarVBeamwidth ?? '—', higherIsBetter: false },
          { label: 'Max Contacts (Air)', getValue: i => i.maxContactsAir ?? '—', higherIsBetter: true },
          { label: 'Max Contacts (Surface)', getValue: i => i.maxContactsSurface ?? '—', higherIsBetter: true },
        ];
        bodyHtml += renderCompareTable('Sensor Technical Detail', sensorFields, items);
      }
    }

    compareBody.innerHTML = bodyHtml || '<p style="color:var(--text-muted);padding:40px;text-align:center">Select at least 2 items from the same category to compare.</p>';

    // ── Wire up D3 charts after DOM insertion ──
    requestAnimationFrame(() => {
      for (const [cat, citems] of Object.entries(allMerged)) {
        if (citems.length < 2) continue;
        try {
          // Specs bar chart
          const specsChartEl = document.getElementById(`cmpSpecs-${cat}Chart`);
          if (specsChartEl && Charts.renderCompareSpecs) {
            const chartFields = getCompareChartFields(cat);
            Charts.renderCompareSpecs(specsChartEl, citems, chartFields);
          }

          // Speed comparison chart
          const speedEl = document.getElementById(`cmpSpeedChart-${cat}`);
          if (speedEl && Charts.renderCompareSpeeds) {
            Charts.renderCompareSpeeds(speedEl, citems);
          }

          // Signatures polar chart
          const sigEl = document.getElementById(`cmpSigChart-${cat}`);
          if (sigEl && Charts.renderCompareSignatures) {
            Charts.renderCompareSignatures(sigEl, citems);
          }

          // Sensor range chart
          const sensorEl = document.getElementById(`cmpSensorChart-${cat}`);
          if (sensorEl && Charts.renderCompareSensorRanges) {
            Charts.renderCompareSensorRanges(sensorEl, citems);
          }

          // Magazine capacity chart
          const magEl = document.getElementById(`cmpMagChart-${cat}`);
          if (magEl && Charts.renderCompareMagazines) {
            Charts.renderCompareMagazines(magEl, citems);
          }

          // Weapon range chart
          const wpnRangeEl = document.getElementById(`cmpWpnRangeChart-${cat}`);
          if (wpnRangeEl && Charts.renderCompareWeaponRanges) {
            Charts.renderCompareWeaponRanges(wpnRangeEl, citems);
          }
        } catch (e) {
          console.error('Compare chart error for', cat, e);
        }
      }
    });
  }

  // Helper: render a comparison table section
  function renderCompareTable(title, fields, items, chartId) {
    let html = `<div class="compare-section">
      <div class="compare-section-title">${title}</div>
      <div class="compare-table-wrap"><table class="compare-table">
        <thead><tr><th></th>${items.map((it, i) =>
          `<th style="border-bottom:3px solid ${COMPARE_COLORS[i]}">${esc(it.name)}</th>`
        ).join('')}</tr></thead><tbody>`;

    fields.forEach(f => {
      const values = items.map(item => f.getValue(item));
      const parseNum = v => typeof v === 'number' ? v : parseFloat(String(v).replace(/,/g, ''));
      const numericVals = values.map(parseNum).filter(v => !isNaN(v));
      const best = f.higherIsBetter !== undefined && numericVals.length > 1
        ? (f.higherIsBetter ? Math.max(...numericVals) : Math.min(...numericVals))
        : null;

      html += `<tr><td>${f.label}</td>`;
      values.forEach(v => {
        const num = parseNum(v);
        const isBest = best !== null && !isNaN(num) && num === best && numericVals.filter(n => n === best).length === 1;
        const display = typeof v === 'number' ? v.toLocaleString() : (v === 0 ? '0' : v);

        // Delta annotation: show difference from best value
        let deltaHtml = '';
        if (best !== null && !isNaN(num) && !isBest && numericVals.length > 1) {
          const diff = num - best;
          if (Math.abs(diff) > 0.001) {
            const absDiff = Math.abs(Math.round(diff * 100) / 100);
            const sign = diff > 0 ? '+' : '−';
            const isGood = f.higherIsBetter ? diff > 0 : diff < 0;
            const cls = isGood ? 'compare-delta-good' : 'compare-delta-bad';
            deltaHtml = ` <span class="compare-delta ${cls}">${sign}${absDiff.toLocaleString()}</span>`;
          }
        }

        html += `<td class="${isBest ? 'compare-best' : ''}">${display}${deltaHtml}</td>`;
      });
      html += '</tr>';
    });

    html += `</tbody></table></div>`;
    if (chartId) html += `<div class="compare-chart" id="${chartId}Chart"><div class="compare-chart-title">Key Metrics</div></div>`;
    html += `</div>`;
    return html;
  }

  // Full compare fields (all detail fields per category)
  function getCompareFieldsFull(cat) {
    switch (cat) {
      case 'aircraft':
        return [
          { label: 'Type', getValue: i => i.type || '—' },
          { label: 'Operator', getValue: i => i.operator || '—' },
          { label: 'Crew', getValue: i => i.crew ?? '—' },
          { label: 'Max Speed (kt)', getValue: i => i.maxSpeed || 0, higherIsBetter: true },
          { label: 'Wingspan (m)', getValue: i => i.span || 0 },
          { label: 'Length (m)', getValue: i => i.length || 0 },
          { label: 'Height (m)', getValue: i => i.height || 0 },
          { label: 'Empty Weight (kg)', getValue: i => i.emptyWeight ? i.emptyWeight.toLocaleString() : '—', higherIsBetter: false },
          { label: 'Max Weight (kg)', getValue: i => i.maxWeight ? i.maxWeight.toLocaleString() : '—', higherIsBetter: true },
          { label: 'Max Payload (kg)', getValue: i => i.maxPayload ? i.maxPayload.toLocaleString() : '—', higherIsBetter: true },
          { label: 'Agility', getValue: i => i.agility ?? '—', higherIsBetter: true },
          { label: 'Climb Rate (m/s)', getValue: i => i.climbRate ?? '—', higherIsBetter: true },
          { label: 'Endurance (hrs)', getValue: i => i.totalEndurance ?? '—', higherIsBetter: true },
          { label: 'Damage Points', getValue: i => i.damagePoints ?? '—', higherIsBetter: true },
          { label: 'Sensors', getValue: i => i.sensorCount || (i.sensors || []).length || 0, higherIsBetter: true },
          { label: 'Weapons', getValue: i => i.weaponCount || 0, higherIsBetter: true },
        ];
      case 'ships':
        return [
          { label: 'Type', getValue: i => i.type || '—' },
          { label: 'Operator', getValue: i => i.operator || '—' },
          { label: 'Crew', getValue: i => i.crew ? i.crew.toLocaleString() : '—' },
          { label: 'Max Speed (kt)', getValue: i => i.maxSpeed || 0, higherIsBetter: true },
          { label: 'Length (m)', getValue: i => i.length || 0, higherIsBetter: true },
          { label: 'Beam (m)', getValue: i => i.beam || 0 },
          { label: 'Draft (m)', getValue: i => i.draft || 0 },
          { label: 'Height (m)', getValue: i => i.height || 0 },
          { label: 'Empty Disp. (t)', getValue: i => i.displacementEmpty ? i.displacementEmpty.toLocaleString() : '—' },
          { label: 'Standard Disp. (t)', getValue: i => i.displacementStandard ? i.displacementStandard.toLocaleString() : '—' },
          { label: 'Full Disp. (t)', getValue: i => i.displacementFull ? i.displacementFull.toLocaleString() : '—', higherIsBetter: true },
          { label: 'Max Depth (m)', getValue: i => i.maxDepth ?? '—', higherIsBetter: true },
          { label: 'Damage Points', getValue: i => i.damagePoints ? i.damagePoints.toLocaleString() : '—', higherIsBetter: true },
          { label: 'Sensors', getValue: i => i.sensorCount || (i.sensors || []).length || 0, higherIsBetter: true },
          { label: 'Weapons', getValue: i => i.weaponCount || 0, higherIsBetter: true },
        ];
      case 'weapons':
        return [
          { label: 'Type', getValue: i => i.type || '—' },
          { label: 'Weight (kg)', getValue: i => i.weight ? i.weight.toLocaleString() : '—', higherIsBetter: false },
          { label: 'Length (m)', getValue: i => i.length || '—' },
          { label: 'Diameter (m)', getValue: i => i.diameter || '—' },
          { label: 'Span (m)', getValue: i => i.span || '—' },
          { label: 'Air Range (km)', getValue: i => i.airRange ?? '—', higherIsBetter: true },
          { label: 'Surface Range (km)', getValue: i => i.surfaceRange ?? '—', higherIsBetter: true },
          { label: 'Land Range (km)', getValue: i => i.landRange ?? '—', higherIsBetter: true },
          { label: 'Sub Range (km)', getValue: i => i.subRange ?? '—', higherIsBetter: true },
        ];
      case 'sensors':
        return [
          { label: 'Type', getValue: i => i.type || '—' },
          { label: 'Role', getValue: i => i.role || '—' },
          { label: 'Max Range (km)', getValue: i => i.rangeMax || 0, higherIsBetter: true },
          { label: 'Min Range (km)', getValue: i => i.rangeMin || 0, higherIsBetter: false },
          { label: 'Alt. Max (m)', getValue: i => i.altitudeMax ? i.altitudeMax.toLocaleString() : '—', higherIsBetter: true },
          { label: 'Generation', getValue: i => i.generation || '—' },
        ];
      case 'infantry':
      case 'armor':
      case 'artillery':
      case 'airdefense':
      case 'radar':
      case 'facilities':
        return [
          { label: 'Type', getValue: i => i.type || '—' },
          { label: 'Crew', getValue: i => i.crew ?? '—' },
          { label: 'Length (m)', getValue: i => i.length || '—' },
          { label: 'Width (m)', getValue: i => i.width || '—' },
          { label: 'Damage Points', getValue: i => i.damagePoints || 0, higherIsBetter: true },
          { label: 'Sensors', getValue: i => i.sensorCount || 0, higherIsBetter: true },
          { label: 'Weapons', getValue: i => i.weaponCount || 0, higherIsBetter: true },
        ];
      default:
        return [];
    }
  }

  // Numeric fields for the bar chart visualization
  function getCompareChartFields(cat) {
    switch (cat) {
      case 'aircraft':
        return [
          { label: 'Max Speed (kt)', getValue: i => i.maxSpeed || 0 },
          { label: 'Max Weight (kg)', getValue: i => i.maxWeight || 0 },
          { label: 'Payload (kg)', getValue: i => i.maxPayload || 0 },
          { label: 'Wingspan (m)', getValue: i => i.span || 0 },
          { label: 'Sensors', getValue: i => i.sensorCount || (i.sensors || []).length || 0 },
        ];
      case 'ships':
        return [
          { label: 'Max Speed (kt)', getValue: i => i.maxSpeed || 0 },
          { label: 'Displacement (t)', getValue: i => i.displacementFull || 0 },
          { label: 'Length (m)', getValue: i => i.length || 0 },
          { label: 'Damage Points', getValue: i => i.damagePoints || 0 },
          { label: 'Sensors', getValue: i => i.sensorCount || (i.sensors || []).length || 0 },
        ];
      case 'weapons':
        return [
          { label: 'Air Range (km)', getValue: i => i.airRange || 0 },
          { label: 'Surface Range (km)', getValue: i => i.surfaceRange || 0 },
          { label: 'Land Range (km)', getValue: i => i.landRange || 0 },
          { label: 'Weight (kg)', getValue: i => i.weight || 0 },
        ];
      case 'sensors':
        return [
          { label: 'Max Range (km)', getValue: i => i.rangeMax || 0 },
          { label: 'Alt. Max (m)', getValue: i => i.altitudeMax || 0 },
        ];
      default:
        return [
          { label: 'Damage Points', getValue: i => i.damagePoints || 0 },
          { label: 'Sensors', getValue: i => i.sensorCount || 0 },
          { label: 'Weapons', getValue: i => i.weaponCount || 0 },
        ];
    }
  }

  // ── Compare List Management ────────────
  function toggleCompare(id, category) {
    const idx = state.compareList.findIndex(c => c.id === id && c.category === category);
    if (idx >= 0) {
      state.compareList.splice(idx, 1);
    } else {
      if (state.compareList.length >= 5) {
        state.compareList.shift(); // max 5
      }
      const data = state.data[category] || [];
      const item = data.find(d => d.id === id);
      if (item) {
        state.compareList.push({ id, category, name: item.name });
      }
    }
    updateCompareButton();
  }

  function updateCompareButton() {
    compareCount.textContent = state.compareList.length;
    compareBtn.disabled = state.compareList.length < 2;
  }

  // ── Main Render ────────────────────────
  async function render() {
    content.innerHTML = '<div class="loading">Loading data...</div>';
    const cat = state.currentCategory;
    // Load category data + prefetch images in parallel
    const [data] = await Promise.all([
      loadCategory(cat),
      prefetchCategoryImages(cat)
    ]);

    categoryTitle.textContent = categories[cat].title;
    populateFilters(data);

    // Restore filter/sort selections after repopulating dropdowns
    filterType.value = state.filters.type;
    filterOperator.value = state.filters.operator;
    sortBy.value = state.sort;

    const filtered = getFilteredData(data);
    renderTypeIconFilters(data, cat);

    content.className = `content ${state.viewMode === 'grid' ? 'grid-view' : 'list-view'}`;
    renderCards(filtered);
  }

  // ── Utilities ──────────────────────────
  function esc(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function truncate(str, max) {
    return str.length > max ? str.slice(0, max) + '...' : str;
  }

  // Map loadout role to a CSS color class
  function roleClass(role) {
    const map = {
      'Air-to-Air': 'role-aa',
      'Anti-Ship': 'role-asuw',
      'Anti-Submarine': 'role-asw', 'ASW Patrol': 'role-asw', 'Maritime Patrol': 'role-asw',
      'Precision Strike': 'role-strike', 'Standoff Strike': 'role-strike', 'Cruise Missile': 'role-strike',
      'CAS / Anti-Armor': 'role-cas', 'Rocket Attack': 'role-cas', 'Gunship': 'role-cas', 'Forward Observer': 'role-cas',
      'General Purpose Bombing': 'role-bomb', 'Area Attack': 'role-bomb',
      'Nuclear Strike': 'role-nuke',
      'SEAD / DEAD': 'role-sead',
      'Transport / Airdrop': 'role-transport', 'Logistics': 'role-transport', 'Aerial Refueling': 'role-transport', 'Ferry / Extended Range': 'role-transport',
      'Reconnaissance': 'role-isr', 'ISR / Targeting': 'role-isr', 'Surveillance': 'role-isr', 'Early Warning': 'role-isr',
      'Electronic Warfare': 'role-ew', 'Decoy / EW': 'role-ew',
      'Special Operations': 'role-sof',
      'Search & Rescue': 'role-sar',
      'Naval Mining': 'role-mine',
      'Command & Control': 'role-c2',
      'Drone / Target': 'role-drone', 'Missile Defense': 'role-drone',
      'Training': 'role-train',
    };
    return map[role] || '';
  }

  // ── Loadout Description Generator ───────────────────────
  const weaponDB = [
    [/AIM-120[^\s,]* AMRAAM/i, 'BVR active radar-homing air-to-air missile'],
    [/AIM-54[^\s,]* Phoenix/i, 'long-range air-to-air missile for fleet defense'],
    [/AIM-7[^\s,]* Sparrow/i, 'medium-range semi-active radar-guided AAM'],
    [/AIM-9[^\s,]* Sidewinder/i, 'short-range infrared-homing AAM'],
    [/AIM-4[^\s,]* Falcon/i, 'early semi-active radar/IR-guided AAM'],
    [/AIM-92[^\s,]* Stinger/i, 'shoulder-fired IR air defense missile adapted for air use'],
    [/AIR-2A Genie/i, 'unguided nuclear air-to-air rocket'],
    [/AGM-88[^\s,]* HARM/i, 'high-speed anti-radiation missile for SEAD'],
    [/AGM-88[^\s,]* AARGM/i, 'advanced anti-radiation missile with GPS/MMW seeker'],
    [/AGM-45[^\s,]* Shrike/i, 'early anti-radiation missile targeting enemy radar'],
    [/AGM-78[^\s,]* Standard ARM/i, 'long-range anti-radiation missile'],
    [/AGM-65[^\s,]* Maverick EO/i, 'electro-optical guided air-to-ground missile for precision CAS'],
    [/AGM-65[^\s,]* Maverick IR/i, 'imaging infrared air-to-ground missile for all-weather CAS'],
    [/AGM-65[^\s,]* Maverick Laser/i, 'laser-guided Maverick for cooperative target designation'],
    [/AGM-114[^\s,]* Hellfire/i, 'laser/radar-guided anti-armor missile'],
    [/AGM-176[^\s,]* Griffin/i, 'lightweight precision-guided munition for low-collateral strikes'],
    [/AGM-69[^\s,]* SRAM/i, 'short-range nuclear attack missile for penetrating air defenses'],
    [/AGM-158[^\s,]* JASSM/i, 'stealthy long-range cruise missile with autonomous targeting'],
    [/AGM-158[^\s,]* LRASM/i, 'long-range anti-ship missile with autonomous targeting'],
    [/AGM-84[^\s,]* Harpoon/i, 'sea-skimming anti-ship cruise missile'],
    [/AGM-84[^\s,]* SLAM(?!-?ER)/i, 'standoff land-attack missile with man-in-the-loop guidance'],
    [/SLAM-?ER/i, 'extended-range standoff land-attack missile'],
    [/AGM-86[^\s,]* ALCM/i, 'air-launched cruise missile for strategic strike'],
    [/CALCM/i, 'conventional air-launched cruise missile with GPS guidance'],
    [/Tomahawk|TLAM/i, 'long-range sea/air-launched cruise missile'],
    [/GBU-10[^\s,]* LGB/i, '2,000 lb Paveway II laser-guided bomb'],
    [/GBU-12[^\s,]* (?:LGB|Paveway)/i, '500 lb Paveway II laser-guided bomb'],
    [/GBU-16[^\s,]* LGB/i, '1,000 lb Paveway II laser-guided bomb'],
    [/GBU-24[^\s,]*/i, '2,000 lb Paveway III low-level laser-guided bomb'],
    [/GBU-27[^\s,]*/i, '2,000 lb penetrating laser-guided bomb (stealth internal)'],
    [/GBU-28/i, '5,000 lb deep-penetration bunker-buster bomb'],
    [/GBU-43[^\s,]* MOAB/i, '21,600 lb Massive Ordnance Air Blast bomb'],
    [/GBU-57[^\s,]* MOP/i, '30,000 lb Massive Ordnance Penetrator for deep bunkers'],
    [/GBU-31[^\s,]*/i, '2,000 lb GPS/INS-guided JDAM'], [/GBU-32[^\s,]*/i, '1,000 lb GPS/INS-guided JDAM'],
    [/GBU-38[^\s,]*/i, '500 lb GPS/INS-guided JDAM'], [/GBU-54[^\s,]*/i, '500 lb laser-aided GPS-guided JDAM'],
    [/GBU-56[^\s,]*/i, '2,000 lb laser-aided GPS-guided JDAM'],
    [/GBU-39[^\s,]* SDB/i, '250 lb Small Diameter Bomb with GPS/INS guidance'],
    [/GBU-53[^\s,]* SDB/i, '250 lb Small Diameter Bomb II with tri-mode seeker'],
    [/GBU-44\/B Viper Strike/i, 'precision glide munition for gunship use'],
    [/AGM-154[^\s,]* JSOW/i, 'GPS-guided glide weapon with standoff range'],
    [/Walleye/i, 'TV-guided glide bomb for precision strike'],
    [/Mk82 LDGP/i, '500 lb low-drag general purpose bomb'], [/Mk83 LDGP/i, '1,000 lb low-drag GP bomb'],
    [/Mk84 LDGP/i, '2,000 lb low-drag GP bomb'], [/Mk84 AIR/i, '2,000 lb air-inflatable retard bomb'],
    [/Mk82 Snakeeye/i, '500 lb retarded bomb for low-altitude delivery'],
    [/Mk82 AIR/i, '500 lb air-inflatable retard bomb'], [/Mk77 Incendiary/i, 'incendiary bomb for area denial'],
    [/Mk18.*RET/i, '1,000 lb retarded bomb'], [/M117/i, '750 lb general purpose bomb'],
    [/CBU-87[^\s,]* CEM/i, 'combined-effects cluster munition (anti-armor/personnel/materiel)'],
    [/CBU-97[^\s,]* SFW/i, 'sensor-fuzed cluster weapon with anti-armor skeets'],
    [/CBU-78[^\s,]* GATOR/i, 'area-denial cluster munition dispensing AT/AP mines'],
    [/CBU-89[^\s,]* GATOR/i, 'area-denial cluster munition dispensing AT/AP mines'],
    [/CBU-103[^\s,]* WCMD/i, 'wind-corrected cluster munition'], [/CBU-105[^\s,]* WCMD/i, 'wind-corrected sensor-fuzed anti-armor weapon'],
    [/CBU-59[^\s,]* APAM/i, 'anti-personnel/anti-materiel cluster bomb'],
    [/CBU-52[^\s,]*/i, 'fragmentation cluster bomb'], [/CBU-71[^\s,]*/i, 'incendiary cluster bomb'],
    [/Mk20 Rockeye/i, 'anti-armor cluster bomb with shaped-charge submunitions'],
    [/HYDRA APKWS.* 70mm/i, '70mm laser-guided precision rockets'],
    [/HYDRA 70mm/i, '70mm unguided folding-fin rockets'], [/Zuni/i, '5-inch unguided air-to-ground rocket'],
    [/Mk46/i, 'lightweight ASW torpedo'], [/Mk50/i, 'advanced lightweight torpedo'], [/Mk54/i, 'lightweight hybrid torpedo'],
    [/AN\/SSQ-53[^\s,]* DIFAR/i, 'directional passive sonobuoy'], [/AN\/SSQ-62[^\s,]* DICASS/i, 'active command sonobuoy'],
    [/AN\/SSQ-77[^\s,]* VLAD/i, 'vertical line array sonobuoy'], [/Sonobuoy/i, 'acoustic sonobuoy pattern'],
    [/Quickstrike/i, 'shallow-water naval mine'], [/Mk52.*Naval Mine/i, 'bottom-influence naval mine'],
    [/Mk55/i, 'bottom-influence naval mine'], [/Mk56/i, 'moored naval mine'],
    [/Mk62/i, 'Quickstrike mine (500 lb)'], [/Mk63/i, 'Quickstrike mine (1,000 lb)'],
    [/Mk64/i, 'Quickstrike mine (2,000 lb)'], [/Mk65/i, 'Quickstrike mine (2,000 lb)'],
    [/DST/i, 'Destructor mine conversion kit'], [/CAPTOR/i, 'encapsulated torpedo mine'],
    [/Mk10[3-6][^\s,]* .*Mine Sweep/i, 'helicopter-towed mine sweep'],
    [/AN\/ALQ-21[89].*Mine Sweep/i, 'multi-influence mine countermeasures sweep'],
    [/AN\/ALQ-220.*Mine Sweep/i, 'multi-influence mine countermeasures sweep'],
    [/A\/N37U.*Mine Sweep/i, 'mechanical cable-cutter mine sweep'],
    [/AN\/AQS-232.*AMNS/i, 'airborne mine neutralization system with ROV'],
    [/AN\/AQS-\d+[^\s,]*/i, 'helicopter-towed minehunting sonar'], [/Seafox/i, 'mine neutralization torpedo'],
    [/B61/i, 'tactical/strategic variable-yield nuclear bomb'], [/B83/i, '1.2 megaton strategic nuclear bomb'],
    [/B57/i, 'tactical nuclear depth bomb'], [/B28/i, 'thermonuclear bomb (1.45 megaton yield)'],
    [/Litening\s*(II|AT|SE|ER)?\s*Pod/i, 'targeting pod with FLIR/CCD/laser designator'],
    [/Litening\s*(AT|ER)\s*\[/i, 'targeting pod with FLIR/CCD/laser designator'],
    [/Sniper XR Pod/i, 'advanced targeting pod with FLIR and laser designator'],
    [/LANTIRN\s*Pod/i, 'navigation/targeting pod for low-altitude night ops'],
    [/ATFLIR/i, 'advanced targeting FLIR pod'], [/EOTS/i, 'electro-optical targeting system (internal)'],
    [/Internal FLIR/i, 'internal FLIR targeting system'], [/Pave Tack Pod/i, 'FLIR/laser designator pod'],
    [/TRAM/i, 'target recognition attack multisensor'],
    [/AN\/ALQ-184/i, 'ECM pod'], [/AN\/ALQ-119/i, 'deceptive ECM jammer pod'],
    [/AN\/ALQ-131/i, 'self-protection ECM pod'], [/AN\/ALQ-167/i, 'threat simulation ECM pod'],
    [/AN\/ALQ-99/i, 'high-power standoff jamming pod'], [/AN\/ALQ-76/i, 'noise/deception jamming pod'],
    [/AN\/AXQ-14/i, 'weapon datalink pod'], [/SUU-23\/A/i, '20mm gun pod'],
    [/TARPS/i, 'tactical aerial reconnaissance pod'], [/SLAR/i, 'side-looking airborne radar'],
    [/ADM-141\w* TALD/i, 'tactical air-launched decoy'], [/ADM-160\w* MALD/i, 'miniature air-launched decoy'],
    [/ITALD/i, 'improved tactical air-launched decoy'],
    [/Paratrooper|Paras/i, 'airborne infantry airdrop'], [/Ranger/i, 'Army Ranger airdrop'],
    [/Delta Force/i, 'Delta Force airdrop'], [/Green Beret/i, 'Special Forces ODA airdrop'],
    [/SEAL/i, 'Navy SEAL team insertion'], [/Troop/i, 'troop transport'], [/Passenger/i, 'passenger transport'],
    [/Marines?,\s*\d+/i, 'Marine infantry transport'], [/Litter|Patient/i, 'medical evacuation'],
    [/Cargo/i, 'cargo transport'], [/Slung Load/i, 'external slung-load cargo'],
    [/Gunship/i, 'ground-attack gunship configuration'], [/M134.*Minigun/i, '7.62mm rotary minigun'],
    [/Standard FAC/i, 'forward air controller configuration'],
    [/Airborne Early Warning|AEW/i, 'airborne early warning radar patrol'],
    [/Airborne Command Post|ACP/i, 'airborne command post for nuclear C3'],
    [/TACAMO/i, 'communications relay to ballistic missile submarines'],
    [/National Airborne/i, 'national emergency airborne command center'],
    [/Joint STARS/i, 'ground surveillance and battle management'],
    [/Maritime Patrol/i, 'maritime surface search and patrol'],
    [/Maritime Surveillance/i, 'wide-area maritime surveillance'], [/Area Surveillance/i, 'persistent area surveillance'],
    [/Forward Observer/i, 'artillery forward observer and fire coordination'],
    [/Gorgon Stare/i, 'wide-area persistent surveillance sensor'],
    [/Offensive ECM/i, 'standoff electronic attack jamming'],
    [/\bELINT\b/i, 'electronic intelligence collection'], [/\bSIGINT\b/i, 'signals intelligence collection'],
    [/\bTELINT\b/i, 'telemetry intelligence collection'],
    [/Recon/i, 'photographic/electronic reconnaissance'], [/Search And Rescue|SAR\b/i, 'search and rescue mission'],
    [/Tanker|Refuel|Buddy/i, 'aerial refueling configuration'],
    [/Drone.*Target|Aerial Target/i, 'unmanned aerial target drone'], [/Aerostat/i, 'tethered surveillance aerostat'],
    [/Airborne Laser/i, 'airborne laser for ballistic missile defense'],
    [/Training|Trainer/i, 'training configuration'], [/BAT\b/i, 'brilliant anti-tank submunition'],
  ];
  // Naval mount & weapon descriptions (checked by describeMountOrWeapon)
  const navalDB = [
    // CIWS / Close-In
    [/Phalanx/i, 'radar-guided close-in weapon system for anti-missile and anti-aircraft defense'],
    [/Goalkeeper/i, '30mm close-in weapon system providing last-ditch defense against missiles'],
    [/SeaRAM/i, 'rolling-airframe missile launcher for close-in anti-missile defense'],
    [/RAM.*Mk\s?49|Mk\s?49.*RAM|RIM-116/i, 'rolling-airframe missile launcher for point defense'],
    // Guns
    [/127mm\/54\s*Mk45/i, '5-inch naval gun for surface fire support and anti-surface warfare'],
    [/127mm\/62\s*Mk45/i, '5-inch extended-range naval gun for precision fire support'],
    [/127mm\/38/i, '5-inch dual-purpose naval gun (WWII-era, anti-surface and anti-air)'],
    [/76mm\/62\s*OTO/i, 'medium-caliber rapid-fire naval gun for anti-surface and anti-air'],
    [/57mm.*Mk\s*110|Mk\s*110.*57mm/i, '57mm rapid-fire deck gun for littoral combat'],
    [/40mm.*Bofors|Bofors.*40mm/i, '40mm auto-cannon for anti-surface and close-range defense'],
    [/30mm.*Bushmaster|Bushmaster.*30mm/i, '30mm chain gun for anti-surface and anti-helicopter fire'],
    [/25mm.*Bushmaster|Bushmaster.*25mm/i, '25mm chain gun for small boat and low-air threat defense'],
    [/25mm.*Typhoon|Typhoon.*25mm/i, '25mm stabilized remote weapon station'],
    [/20mm\/70\s*Oerlikon|Oerlikon/i, '20mm anti-aircraft autocannon'],
    [/12\.7mm.*MG|\.50\s*cal/i, 'heavy machine gun for close-range surface defense'],
    [/M240|7\.62mm.*MG/i, 'medium machine gun for close-range defense'],
    [/Mk38.*25mm|25mm.*Mk38/i, '25mm machine gun system for surface defense'],
    [/GAU-8|30mm.*GAU/i, '30mm rotary cannon'],
    [/Mk\s?15/i, '20mm Phalanx close-in weapon system'],
    [/Mk\s?110/i, '57mm naval gun system'],
    // Missile launchers
    [/Mk41\s*VLS|Mk\s?41.*VLS|VLS.*Mk\s?41/i, 'vertical launch system for SM-2, Tomahawk, ESSM, and ASROC'],
    [/Mk57\s*VLS|Mk\s?57/i, 'peripheral vertical launch system for Zumwalt-class'],
    [/Mk\s?29.*Sea Sparrow|Sea Sparrow.*Mk\s?29/i, 'NATO Sea Sparrow missile launcher for area defense'],
    [/Mk\s?13.*Launcher|Mk\s?13.*GMLS/i, 'single-arm guided missile launcher (SM-1/Harpoon)'],
    [/Mk\s?26.*Launcher|Mk\s?26.*GMLS/i, 'twin-arm guided missile launcher (SM-2/ASROC)'],
    [/Mk\s?10.*Launcher|Mk\s?10.*GMLS/i, 'twin-arm guided missile launcher for Terrier/SM-1ER'],
    [/Harpoon.*Mk\s?141|Mk\s?141.*Harpoon/i, 'quad Harpoon anti-ship missile launcher'],
    [/Mk\s?141/i, 'quad canister launcher for Harpoon anti-ship missiles'],
    // Torpedo systems
    [/324mm\s*Mk32.*TT|Mk32.*Triple/i, 'triple torpedo tube for lightweight ASW torpedoes'],
    [/533mm.*TT|21in.*TT/i, '21-inch heavyweight torpedo tube'],
    [/Torpedo\s*Magazine.*Internal/i, 'internal torpedo storage and launch tubes'],
    // Decoys & EW
    [/SRBOC|Mk36/i, 'Super Rapid Bloom Offboard Chaff system for radar decoy'],
    [/Nulka/i, 'active radar decoy rocket for anti-ship missile defense'],
    [/AN\/SLQ-25.*Nixie/i, 'towed torpedo decoy system'],
    [/AN\/SLQ-32/i, 'shipboard electronic warfare suite'],
    [/AN\/SLQ-49/i, 'inflatable radar decoy (chaff buoy)'],
    [/Mk53.*DLS|NULKA/i, 'decoy launching system for active/passive decoys'],
    // Misc naval
    [/ASROC|RUM-139/i, 'anti-submarine rocket-launched torpedo'],
    [/ESSM|RIM-162/i, 'evolved Sea Sparrow missile for anti-air/missile defense'],
    [/SM-2|RIM-66[A-Z]|RIM-67/i, 'Standard Missile for area air defense'],
    [/SM-3|RIM-161/i, 'Standard Missile 3 for ballistic missile defense'],
    [/SM-6|RIM-174/i, 'Standard Missile 6 for extended-range air and missile defense'],
    [/RGM-84.*Harpoon/i, 'ship-launched anti-ship cruise missile'],
    [/BGM-109.*Tomahawk/i, 'ship-launched land-attack cruise missile'],
    [/Mk\s?46.*Torpedo/i, 'lightweight anti-submarine torpedo'],
    [/Mk\s?54.*Torpedo/i, 'lightweight hybrid anti-submarine torpedo'],
    [/Mk\s?48.*Torpedo/i, 'heavyweight wire-guided torpedo for submarines'],
    [/RIM-7.*Sea Sparrow/i, 'semi-active radar-guided SAM for ship defense'],
    [/Grenade\s*Launcher|40mm.*Grenade/i, 'grenade launcher for close-range defense'],
    [/Mine\s*Rail|Mine\s*Track/i, 'mine-laying rail system'],
    [/Helicopter\s*Magazine/i, 'rotary-wing aircraft hangar and magazine'],
    [/RHIB|Launch/i, 'rigid-hull inflatable boat launch'],
    [/Mk\s?75/i, '76mm OTO Melara rapid-fire naval gun'],
    // Twin/Single Rail launchers
    [/Mk26.*Twin Rail/i, 'twin-arm guided missile launcher for SM-2 and ASROC'],
    [/Mk10.*Twin Rail/i, 'twin-arm guided missile launcher for Terrier/SM-1ER'],
    [/Mk11.*Twin Rail/i, 'twin-arm guided missile launcher for Tartar/SM-1MR'],
    [/Mk12.*Twin Rail/i, 'twin-arm missile launcher'],
    [/Mk13.*Single Rail/i, 'single-arm guided missile launcher for SM-1/Harpoon'],
    [/Mk22.*Single Rail/i, 'single-arm launcher for Sea Sparrow'],
    [/Mk25 BPDMS/i, 'Basic Point Defense Missile System for Sea Sparrow'],
    // Additional VLS
    [/Mk45\s*VLS|NSSN\s*VLS/i, 'submarine vertical launch system for Tomahawk cruise missiles'],
    [/NSSN VPM/i, 'Virginia Payload Module for expanded Tomahawk loadout'],
    [/Tomahawk VLS/i, 'dedicated Tomahawk cruise missile vertical launch cells'],
    // Strategic missiles
    [/Trident D5/i, 'Trident II D5 submarine-launched ballistic missile'],
    [/Trident C4/i, 'Trident I C4 submarine-launched ballistic missile'],
    [/Poseidon C3/i, 'Poseidon C3 submarine-launched ballistic missile'],
    // Laser / advanced
    [/LaWS|Laser Weapon/i, 'directed-energy laser weapon system for anti-drone and small boat defense'],
    // Stinger / MANPADS
    [/Stinger.*MANPADS|Sea Stinger/i, 'shoulder-fired infrared SAM for point defense'],
    [/TOW/i, 'tube-launched optically-tracked wire-guided anti-tank missile'],
    // Other decoys
    [/Nulka/i, 'active hovering radar decoy for anti-ship missile defense'],
    [/CSA.*Mk[123]/i, 'countermeasures signal/decoy ammunition launcher'],
    [/SKWS/i, 'Super RBOC decoy launching system'],
    [/Fanfare/i, 'acoustic torpedo countermeasure noisemaker'],
    [/Floating Decoy|Rubber Duck/i, 'floating radar/acoustic decoy'],
    [/RBOC|Mk34|Mk52.*SRBOC/i, 'Rapid Bloom Offboard Chaff launcher for radar decoy'],
    // Mine-related
    [/Seafox.*ROV/i, 'mine neutralization remotely-operated vehicle'],
    // AGS
    [/155mm.*AGS/i, '155mm Advanced Gun System for long-range precision fire support'],
    [/406mm.*Triple.*Turret/i, '16-inch battleship main battery turret for shore bombardment'],
    // Misc caliber guns
    [/76mm\/50/i, '3-inch dual-purpose naval gun'],
    [/57mm\/70.*Mk110|Mk110.*CIGS/i, '57mm close-in gun system for littoral combat'],
    [/20mm.*Single|20mm\/80/i, '20mm cannon for close-range anti-air defense'],
    [/3-inch Signal Ejector/i, 'signal and decoy ejector'],
    [/7\.62mm|762mm/i, 'light machine gun or small torpedo tube'],
    [/40mm.*Grenade/i, 'automatic grenade launcher for close-range defense'],
    [/LCS Mission Module/i, 'littoral combat ship modular weapons package'],
    [/Passengers/i, 'passenger/troop transport capacity'],
    [/Mini-Typhoon/i, 'stabilized remote weapon station with heavy machine gun'],
    [/Mk44 ABL/i, 'Armored Box Launcher for Tomahawk missiles'],
    [/Mk60.*PCGMS/i, 'patrol combatant guided missile quad launcher'],
    [/533mm.*TT/i, '21-inch heavyweight torpedo tube for anti-ship/submarine torpedoes'],
    [/171mm.*CAT.*TT/i, 'countermeasures anti-torpedo launcher'],
    [/324mm.*Mk68.*TT/i, 'lightweight torpedo tubes for ASW torpedoes'],
    [/762mm.*Mk69.*TT/i, 'small-caliber torpedo tube'],
  ];

  const loadoutModifiers = [
    [/Long-Range/i, 'extended range'], [/Short-Range/i, 'short-range ops'],
    [/Hi-Lo-Hi/i, 'high-low-high profile'], [/Lo-Lo-Hi/i, 'low-low-high profile'], [/Hi-Hi-Hi/i, 'high-altitude profile'],
    [/Internal Only/i, 'internal bay only (stealth)'], [/MiGCAP/i, 'MiG combat air patrol'], [/BarCAP/i, 'barrier CAP'],
    [/HDB Bomb Bay/i, 'internal bomb bay'],
  ];

  function describeLoadout(name) {
    const parts = [], mods = [];
    for (const [rx, desc] of weaponDB) if (rx.test(name)) parts.push(desc);
    for (const [rx, desc] of loadoutModifiers) if (rx.test(name)) mods.push(desc);
    if (parts.length === 0 && mods.length === 0) return '';
    let r = '';
    if (parts.length > 0) {
      r = parts[0].charAt(0).toUpperCase() + parts[0].slice(1);
      if (parts.length > 1) r += '. ' + parts.slice(1).map(p => p.charAt(0).toUpperCase() + p.slice(1)).join('. ');
    }
    if (mods.length > 0) {
      const m = mods.join(', ');
      r += (r ? '. ' : '') + m.charAt(0).toUpperCase() + m.slice(1);
    }
    return r + '.';
  }

  // Describe a naval mount/weapon name using navalDB + weaponDB patterns
  function describeMount(name) {
    if (!name) return '';
    // Try naval-specific patterns first, then general weaponDB
    for (const [rx, desc] of navalDB) {
      if (rx.test(name)) return desc.charAt(0).toUpperCase() + desc.slice(1) + '.';
    }
    for (const [rx, desc] of weaponDB) {
      if (rx.test(name)) return desc.charAt(0).toUpperCase() + desc.slice(1) + '.';
    }
    // Fallback: try to infer from caliber pattern (e.g. "127mm/54")
    const calMatch = name.match(/(\d+)mm\/(\d+)/);
    if (calMatch) return `${calMatch[1]}mm naval gun mount.`;
    return '';
  }

  // ── Sensor description database ──
  const sensorDB = [
    // Major radar systems (ships)
    [/AN\/SPY-1[A-Z]?/i, 'phased-array multi-function radar forming the core of the AEGIS combat system'],
    [/AN\/SPY-6/i, 'Air and Missile Defense Radar (AMDR) with advanced digital beamforming'],
    [/AN\/SPY-3/i, 'multi-function radar for horizon search and missile illumination'],
    [/AN\/SPS-49/i, 'long-range 2D air search radar for early warning'],
    [/AN\/SPS-48/i, '3D air search radar providing range, bearing, and altitude'],
    [/AN\/SPS-40/i, 'long-range 2D air search radar'],
    [/AN\/SPS-52/i, '3D air search radar'],
    [/AN\/SPS-55/i, 'surface search and navigation radar'],
    [/AN\/SPS-64/i, 'navigation and surface search radar'],
    [/AN\/SPS-67/i, 'surface search and target acquisition radar'],
    [/AN\/SPS-73/i, 'navigation and surface search radar'],
    [/AN\/SPG-62/i, 'continuous-wave illumination radar for SM-2 terminal guidance'],
    [/AN\/SPG-51/i, 'missile fire control illumination radar for Tartar/SM-1'],
    [/AN\/SPG-55/i, 'missile fire control illumination radar for Terrier/SM-1ER'],
    [/AN\/SPG-60/i, 'pulse-doppler target tracking radar'],
    [/AN\/SPQ-9/i, 'horizon search and fire control radar for gun and missile targeting'],
    [/AN\/SQQ-89/i, 'integrated anti-submarine warfare combat system'],
    [/AN\/SQS-53/i, 'hull-mounted active/passive sonar for anti-submarine search and attack'],
    [/AN\/SQS-56/i, 'hull-mounted active sonar for ASW in littoral waters'],
    [/AN\/SQS-26/i, 'bow-mounted sonar for long-range submarine detection'],
    [/AN\/SQR-19/i, 'tactical towed array sonar for passive submarine detection'],
    [/AN\/SQR-20/i, 'multi-function towed array sonar system'],
    [/AN\/SLQ-32/i, 'shipboard electronic warfare system for threat detection and jamming'],
    [/AN\/SLQ-25/i, 'towed torpedo countermeasure decoy system'],
    [/AN\/SQQ-28/i, 'LAMPS III helicopter datalink for ASW coordination'],
    [/AN\/SQQ-32/i, 'mine hunting sonar for mine countermeasures'],
    [/AN\/SQQ-34/i, 'helicopter-based minehunting sonar'],
    // Major radar systems (aircraft)
    [/AN\/APG-63/i, 'pulse-doppler radar for long-range air-to-air detection and tracking'],
    [/AN\/APG-70/i, 'multi-mode radar with synthetic aperture for air-to-air and ground mapping'],
    [/AN\/APG-71/i, 'multi-mode radar for F-14D with digital scan converter'],
    [/AN\/APG-73/i, 'multi-mode radar with improved air-to-ground capability'],
    [/AN\/APG-65/i, 'pulse-doppler multi-mode radar for air combat and ground attack'],
    [/AN\/APG-68/i, 'fire control radar with multiple air-to-air and air-to-ground modes'],
    [/AN\/APG-77/i, 'active electronically scanned array (AESA) radar for F-22'],
    [/AN\/APG-79/i, 'AESA multi-mode radar for F/A-18E/F with simultaneous air/ground tracking'],
    [/AN\/APG-80/i, 'AESA radar for F-16 Block 60'],
    [/AN\/APG-81/i, 'AESA radar for F-35 with electronic attack capability'],
    [/AN\/APG-82/i, 'AESA upgrade for F-15E with improved range and resolution'],
    [/AN\/APG-83\s*SABR/i, 'scalable agile beam radar (AESA) for F-16V'],
    [/AN\/APG-83/i, 'AESA radar for F-16'],
    [/AN\/APY-1/i, 'E-3 Sentry surveillance radar for airborne warning and control'],
    [/AN\/APY-2/i, 'improved E-3 Sentry look-down radar with maritime mode'],
    [/AN\/APY-9/i, 'E-2D Advanced Hawkeye UHF radar with 360-degree electronic scan'],
    [/AN\/APS-145/i, 'E-2C surveillance radar for carrier-based AEW'],
    [/AN\/APS-137/i, 'maritime search radar for P-3C patrol aircraft'],
    [/AN\/APS-149/i, 'inverse synthetic aperture radar for maritime surveillance'],
    [/AN\/APS-153/i, 'multi-mode search radar for MH-60R helicopter'],
    [/AN\/APS-143/i, 'lightweight surveillance radar for special operations aircraft'],
    [/AN\/APS-80/i, 'maritime patrol radar'],
    [/AN\/APY-10/i, 'multi-mission surface search radar for P-8A Poseidon'],
    // EW systems (aircraft)
    [/AN\/ALQ-99/i, 'high-power tactical jamming system for electronic attack'],
    [/AN\/ALQ-131/i, 'self-protection electronic countermeasures pod'],
    [/AN\/ALQ-135/i, 'internal electronic countermeasures system'],
    [/AN\/ALQ-161/i, 'integrated defensive electronic countermeasures system for B-1B'],
    [/AN\/ALQ-165/i, 'airborne self-protection jammer (ASPJ)'],
    [/AN\/ALQ-184/i, 'self-protection ECM pod with improved power management'],
    [/AN\/ALQ-214/i, 'integrated defensive electronic countermeasures (IDECM) suite'],
    [/AN\/ALQ-218/i, 'tactical ESM/ELINT receiver for threat warning and targeting'],
    [/AN\/ALQ-227/i, 'communications countermeasures set for EA-18G'],
    [/AN\/ALQ-239/i, 'digital electronic warfare suite for F-15EX'],
    [/AN\/ALQ-250/i, 'Eagle Passive Active Warning Survivability System (EPAWSS)'],
    [/AN\/ALR-56/i, 'radar warning receiver with precision direction finding'],
    [/AN\/ALR-67/i, 'radar warning receiver for threat detection and identification'],
    [/AN\/ALR-69/i, 'radar warning receiver for tactical aircraft'],
    [/AN\/ALR-94/i, 'passive radar warning and geolocation system for F-22'],
    [/AN\/APR-39/i, 'radar warning receiver for rotary-wing aircraft'],
    [/AN\/AAR-47/i, 'missile approach warning system using UV sensors'],
    [/AN\/AAR-54/i, 'common missile warning system with IR detection'],
    [/AN\/AAR-56/i, 'passive missile approach warning system'],
    [/AN\/AAR-57\s*CMWS/i, 'common missile warning system for helicopters'],
    [/AN\/AAQ-24.*DIRCM|LAIRCM/i, 'laser-based infrared countermeasures against heat-seeking missiles'],
    [/AN\/AAQ-37.*EO-?DAS/i, 'distributed aperture system providing 360° spherical IR coverage for F-35'],
    [/AN\/AAQ-40.*EOTS/i, 'electro-optical targeting system with FLIR and laser designator for F-35'],
    // FLIR / EO systems
    [/AN\/AAQ-28.*LITENING/i, 'targeting pod with FLIR, CCD camera, and laser designator'],
    [/AN\/AAQ-33\s*Sniper/i, 'advanced targeting pod with high-resolution FLIR and laser'],
    [/AN\/AAQ-30.*Hawkeye/i, 'target sight system with FLIR for helicopter weapons delivery'],
    [/AN\/AAQ-16/i, 'airborne electro-optical/IR surveillance system'],
    [/AN\/AAQ-11.*PNVS/i, 'pilot night vision sensor providing thermal imagery for nap-of-earth flight'],
    [/AN\/AAQ-13.*LANTIRN.*Nav/i, 'LANTIRN navigation pod with terrain-following radar and FLIR'],
    [/AN\/AAQ-14.*LANTIRN.*Tgt/i, 'LANTIRN targeting pod with FLIR and laser designator'],
    [/AN\/AAS-42/i, 'infrared search and track system for passive air target detection'],
    [/AN\/AAS-44/i, 'infrared camera for target search, tracking, and identification'],
    [/AN\/AAS-52.*MTS/i, 'multi-spectral targeting system with IR/EO and laser'],
    [/AN\/AAS-53.*CSP/i, 'common sensor payload with multi-spectral targeting'],
    [/AN\/AAS-33.*TRAM/i, 'target recognition attack multisensor for A-6 precision strike'],
    [/AN\/AAS-35.*Pave Penny/i, 'laser spot tracker for acquiring laser-designated targets'],
    // Sonar (aircraft)
    [/AN\/AQS-13/i, 'dipping sonar for helicopter ASW search and localization'],
    [/AN\/AQS-18/i, 'dipping sonar with passive and active modes'],
    [/AN\/AQS-20/i, 'airborne mine detection sonar'],
    [/AN\/AQS-22/i, 'airborne low-frequency sonar for submarine detection and tracking'],
    // Submarine systems
    [/AN\/BQQ-5/i, 'integrated bow sonar suite for submarine search, detection, and fire control'],
    [/AN\/BQQ-6/i, 'advanced submarine sonar suite with spherical array'],
    [/AN\/BQQ-10/i, 'acoustic rapid COTS insertion sonar processor for submarines'],
    [/AN\/BQR-15/i, 'towed array sonar for long-range passive submarine detection'],
    [/AN\/BQR-25/i, 'submarine towed array sonar for surveillance'],
    [/AN\/BQS-14/i, 'active sonar for under-ice navigation and mine avoidance'],
    [/AN\/BQS-15/i, 'under-ice and mine-avoidance sonar for submarines'],
    [/AN\/BLQ-10/i, 'submarine SIGINT system for electronic and communications intelligence'],
    [/AN\/BPS-1[2-6]/i, 'submarine surface search and navigation radar'],
    [/AN\/BRD-[67]/i, 'high-frequency direction finder for submarine ESM'],
    // Generic pattern matchers (must come after specific ones)
    [/MAWS|Missile Approach Warning/i, 'missile approach warning system for incoming threat detection'],
    [/IRCM|DIRCM/i, 'directed infrared countermeasures against heat-seeking missiles'],
    [/IRST/i, 'infrared search and track for passive air target detection'],
    [/RWR|Radar Warning/i, 'radar warning receiver for detecting hostile radar emissions'],
    [/ESM.*ELINT|ELINT/i, 'electronic intelligence receiver for intercepting radar signals'],
    [/SIGINT|COMINT/i, 'signals intelligence system for electronic and communications intercept'],
    [/HF\/DF/i, 'high-frequency direction finder for radio signal geolocation'],
    [/DECM|Defensive ECM/i, 'defensive electronic countermeasures system'],
    [/OECM|Offensive ECM/i, 'offensive electronic countermeasures jammer'],
    [/Laser Designator|LTD/i, 'laser target designator and ranger for precision weapon guidance'],
    [/Laser Rangefinder/i, 'laser rangefinder for precise distance measurement'],
    [/Laser Spot Tracker|LST\b/i, 'laser spot tracker for acquiring designated targets'],
    [/SeaFLIR/i, 'shipboard infrared surveillance camera'],
    [/FLIR.*Nav|Nav.*FLIR/i, 'forward-looking infrared for navigation'],
    [/FLIR/i, 'forward-looking infrared sensor for target detection and tracking'],
    [/IR.*Camera|Surveillance Camera/i, 'infrared surveillance camera'],
    [/LLTV/i, 'low-light television sensor for night targeting'],
    [/Sensor Group/i, 'integrated multi-sensor suite'],
    [/Sensor Turret/i, 'stabilized sensor turret with electro-optical/infrared cameras'],
  ];

  // Describe a sensor using name-based patterns, then role/type fallback
  function describeSensor(name, role, type) {
    if (!name) return '';
    // 1. Try specific sensor patterns
    for (const [rx, desc] of sensorDB) {
      if (rx.test(name)) return desc.charAt(0).toUpperCase() + desc.slice(1) + '.';
    }
    // 2. Try matching the role field against sensorDB
    if (role) {
      for (const [rx, desc] of sensorDB) {
        if (rx.test(role)) return desc.charAt(0).toUpperCase() + desc.slice(1) + '.';
      }
    }
    // 3. Generate from role string (already quite descriptive in the data)
    if (role && role.length > 5) {
      // Clean up the role into a readable sentence
      let r = role.replace(/^Radar,\s*/i, 'Radar providing ').replace(/^Hull Sonar,\s*/i, 'Hull-mounted sonar for ').replace(/^TASS,\s*/i, 'Towed array sonar for ').replace(/^VDS,\s*/i, 'Variable depth sonar for ').replace(/^Infrared,\s*/i, 'Infrared sensor for ');
      r = r.charAt(0).toUpperCase() + r.slice(1);
      if (!r.endsWith('.')) r += '.';
      return r;
    }
    return '';
  }

  // Classify a loadout name into a mission role description
  function classifyLoadout(n) {
    if (/^A\/A/i.test(n)) return 'Air-to-Air';
    if (/AGM-84|Harpoon|SLAM(?!R)|Penguin|NSM/i.test(n)) return 'Anti-Ship';
    if (/SLAM-?ER/i.test(n)) return 'Standoff Strike';
    if (/AGM-88|HARM|AARGM|AGM-45|Shrike|AGM-78|Standard ARM/i.test(n)) return 'SEAD / DEAD';
    if (/JASSM|LRASM|AGM-158/i.test(n)) return 'Standoff Strike';
    if (/Tomahawk|TLAM|CALCM|AGM-86/i.test(n)) return 'Cruise Missile';
    if (/GBU|LGB|JDAM|Paveway|SDB|JSOW|WCMD|Walleye/i.test(n)) return 'Precision Strike';
    if (/AGM-6[5-9]|AGM-114|Maverick|Hellfire|AGM-176|Griffin/i.test(n)) return 'CAS / Anti-Armor';
    if (/CBU|Cluster|Rockeye|GATOR|APAM/i.test(n)) return 'Area Attack';
    if (/Mk8[0-9]|Mk7[0-9]|LDGP|Incendiary|Snakeye/i.test(n)) return 'General Purpose Bombing';
    if (/HYDRA|rocket|Zuni/i.test(n)) return 'Rocket Attack';
    if (/torpedo|Mk46|Mk50|Mk54|Mk44/i.test(n)) return 'Anti-Submarine';
    if (/[Mm]ine|Quickstrike|DST|CAPTOR/i.test(n)) return 'Naval Mining';
    if (/Nuclear|B61|B83|B57|nuke|kT\b/i.test(n)) return 'Nuclear Strike';
    if (/Decoy|MALD|ADM-160|ITALD|TALD/i.test(n)) return 'Decoy / EW';
    if (/Recon|Camera|TARPS|Photo|SLAR/i.test(n)) return 'Reconnaissance';
    if (/Tanker|Refuel|[Bb]uddy|D-704/i.test(n)) return 'Aerial Refueling';
    if (/Sonobuoy/i.test(n)) return 'ASW Patrol';
    if (/Cargo|Supply|Paradrop|Paratrooper|Paras/i.test(n)) return 'Transport / Airdrop';
    if (/SAR|Rescue|CSAR/i.test(n)) return 'Search & Rescue';
    if (/Gunship|Minigun|GAU-|M134|M102|Howitzer|105mm/i.test(n)) return 'Gunship';
    if (/Troop|Passenger|Pax|Marine[s,]|Litter|Patient|Evacuee|Medevac/i.test(n)) return 'Transport / Airdrop';
    if (/Drone|Target|Aerostat/i.test(n)) return 'Drone / Target';
    if (/AEW|Early Warning|AWACS|E-2|E-3/i.test(n)) return 'Early Warning';
    if (/Command Post|TACAMO|NAOC|National Airborne|Communications Relay/i.test(n)) return 'Command & Control';
    if (/Maritime Patrol/i.test(n)) return 'Maritime Patrol';
    if (/Forward Observer/i.test(n)) return 'Forward Observer';
    if (/Gorgon Stare|BAT\b/i.test(n)) return 'ISR / Targeting';
    if (/STARS|Surveillance/i.test(n)) return 'Surveillance';
    if (/Offensive ECM|ALQ-|ECM/i.test(n)) return 'Electronic Warfare';
    if (/COD|Carrier Onboard|Mail|Logistics/i.test(n)) return 'Logistics';
    if (/EW|Jamm|EA-|ELINT|SIGINT|Prowler/i.test(n)) return 'Electronic Warfare';
    if (/ASW|Anti.?Sub|Depth Charge/i.test(n)) return 'Anti-Submarine';
    if (/Training|Trainer/i.test(n)) return 'Training';
    if (/Ranger|Delta|Green Beret|SEAL|Special/i.test(n)) return 'Special Operations';
    if (/Fuel|[Tt]ank|Ferry|Long.?Range/i.test(n)) return 'Ferry / Extended Range';
    if (/FLIR|Pod|Litening|Sniper|LANTIRN/i.test(n)) return 'ISR / Targeting';
    if (/Laser.*ABM|ABL/i.test(n)) return 'Missile Defense';
    if (/RET\b|Retarded|HSAB/i.test(n)) return 'General Purpose Bombing';
    return '';
  }

  // ── Loadout sorting helpers ──────────────
  const LOADOUT_ROLE_PRIORITY = {
    'Nuclear Strike': 1, 'Cruise Missile': 2, 'Standoff Strike': 3,
    'SEAD / DEAD': 4, 'Anti-Ship': 5, 'Precision Strike': 6,
    'CAS / Anti-Armor': 7, 'Area Attack': 8, 'General Purpose Bombing': 9,
    'Rocket Attack': 10, 'Anti-Submarine': 11, 'Naval Mining': 12,
    'Air-to-Air': 13, 'Electronic Warfare': 14, 'Decoy / EW': 15,
    'Reconnaissance': 16, 'ISR / Targeting': 17, 'Missile Defense': 18,
    'Gunship': 19, 'Early Warning': 20, 'Surveillance': 21,
    'Command & Control': 22, 'ASW Patrol': 23, 'Maritime Patrol': 24,
    'Aerial Refueling': 25, 'Special Operations': 26, 'Transport / Airdrop': 27,
    'Logistics': 28, 'Search & Rescue': 29, 'Training': 30,
    'Ferry / Extended Range': 31, 'Drone / Target': 32, 'Forward Observer': 33,
  };
  function _loMaxRange(lo) {
    if (!lo.weapons?.length) return 0;
    return Math.max(0, ...lo.weapons.map(w => Math.max(w.airRange||0, w.surfaceRange||0, w.landRange||0, w.subRange||0)));
  }
  function _loTotalWeight(lo) {
    if (!lo.weapons?.length) return 0;
    return lo.weapons.reduce((s, w) => s + (w.weight||0) * (w.qty||1), 0);
  }
  function _loTotalCount(lo) {
    if (!lo.weapons?.length) return 0;
    return lo.weapons.reduce((s, w) => s + (w.qty||1), 0);
  }
  function _applyLoadoutSort(loadouts, key) {
    const arr = [...loadouts];
    switch (key) {
      case 'role': return arr.sort((a, b) => {
        const ra = LOADOUT_ROLE_PRIORITY[classifyLoadout(a.name)] || 99;
        const rb = LOADOUT_ROLE_PRIORITY[classifyLoadout(b.name)] || 99;
        return ra - rb || _loMaxRange(b) - _loMaxRange(a);
      });
      case 'range-desc': return arr.sort((a, b) => _loMaxRange(b) - _loMaxRange(a));
      case 'range-asc':  return arr.sort((a, b) => _loMaxRange(a) - _loMaxRange(b) || a.name.localeCompare(b.name));
      case 'weight-desc': return arr.sort((a, b) => _loTotalWeight(b) - _loTotalWeight(a));
      case 'count-desc':  return arr.sort((a, b) => _loTotalCount(b) - _loTotalCount(a));
      case 'alpha':       return arr.sort((a, b) => a.name.localeCompare(b.name));
      case 'aa-first': return arr.sort((a, b) => {
        const aAA = classifyLoadout(a.name) === 'Air-to-Air' ? 0 : 1;
        const bAA = classifyLoadout(b.name) === 'Air-to-Air' ? 0 : 1;
        if (aAA !== bAA) return aAA - bAA;
        return (LOADOUT_ROLE_PRIORITY[classifyLoadout(a.name)]||99) - (LOADOUT_ROLE_PRIORITY[classifyLoadout(b.name)]||99);
      });
      case 'offensive': return arr.sort((a, b) => {
        // Offensive: any role with priority <= 12 first, then by range
        const aOff = (LOADOUT_ROLE_PRIORITY[classifyLoadout(a.name)]||99) <= 12 ? 0 : 1;
        const bOff = (LOADOUT_ROLE_PRIORITY[classifyLoadout(b.name)]||99) <= 12 ? 0 : 1;
        if (aOff !== bOff) return aOff - bOff;
        return _loMaxRange(b) - _loMaxRange(a);
      });
      default: return arr; // 'default' — original DB order
    }
  }
  function buildLoadoutItemHTML(lo, idx) {
    const role = classifyLoadout(lo.name);
    const desc = describeLoadout(lo.name);
    const maxR = _loMaxRange(lo);
    const uniqueWpns = lo.weapons ? [...new Map(lo.weapons.map(w => [w.name, w])).values()] : [];
    return `<div class="loadout-item" data-loadout="${idx}">
      <div class="loadout-header loadout-header-desc" onclick="this.parentElement.classList.toggle('open')">
        <div class="loadout-top-row">
          <div class="loadout-chevron"></div>
          <div class="loadout-name" title="${esc(lo.name)}" style="white-space:normal">${esc(lo.name)}</div>
          <div class="loadout-badges">
            ${maxR > 0 ? `<span class="loadout-badge" title="Max weapon range">${maxR} km</span>` : ''}
            ${role ? `<span class="loadout-badge loadout-role ${roleClass(role)}">${esc(role)}</span>` : ''}
          </div>
        </div>
        ${desc ? `<div class="loadout-desc">${esc(desc)}</div>` : ''}
      </div>
      <div class="loadout-body"><div class="loadout-body-inner">
        ${uniqueWpns.length > 0 ? `<div class="wpn-chips">${uniqueWpns.map(w => {
          const qty = lo.weapons.filter(x => x.name === w.name).length;
          return `<span class="wpn-chip" data-wpn-name="${esc(w.name)}" title="${esc(w.name)}${w.type ? ' (' + w.type + ')' : ''}">${qty > 1 ? qty + 'x ' : ''}${esc(w.name)}</span>`;
        }).join('')}</div>` : '<div style="color:var(--text-secondary);font-size:12px;padding:4px 0">No weapon details available</div>'}
      </div></div>
    </div>`;
  }
  // Exposed to sort dropdown onchange
  window._sortLoadouts = function(key) {
    const body = document.getElementById('loadoutListBody');
    if (!body || !state.currentDetail?.loadouts) return;
    body.innerHTML = _applyLoadoutSort(state.currentDetail.loadouts, key)
      .map(buildLoadoutItemHTML).join('');
  };

  // ── Tips & Tricks Rendering ──────────────
  async function renderTips() {
    const tips = await loadTips();
    const content = document.getElementById('content');
    const isProduction = location.hostname !== 'localhost' && location.hostname !== '127.0.0.1';

    const CATEGORIES = ['All', 'Tactics', 'Aircraft', 'Ships', 'Weapons', 'Sensors', 'General'];
    const tipFilters = { category: 'All', search: '', sort: 'default' };

    function filteredTips() {
      let list = tips.slice();
      if (tipFilters.category !== 'All') list = list.filter(t => t.category === tipFilters.category);
      if (tipFilters.search) {
        const q = tipFilters.search.toLowerCase();
        list = list.filter(t => t.title.toLowerCase().includes(q) || t.body.toLowerCase().includes(q));
      }
      if (tipFilters.sort === 'az') list.sort((a, b) => a.title.localeCompare(b.title));
      else if (tipFilters.sort === 'za') list.sort((a, b) => b.title.localeCompare(a.title));
      else if (tipFilters.sort === 'cat') list.sort((a, b) => (a.category || '').localeCompare(b.category || ''));
      return list;
    }

    function renderGrid() {
      const list = filteredTips();
      const grid = document.getElementById('tipsGrid');
      const count = document.getElementById('tipsCount');
      if (count) count.textContent = `${list.length} tip${list.length !== 1 ? 's' : ''}`;
      if (!grid) return;
      if (list.length === 0) {
        grid.innerHTML = '<p class="tips-empty">No tips match your filter.</p>';
        return;
      }
      grid.innerHTML = list.map(tip => renderTipCard(tip)).join('');
      grid.querySelectorAll('.tip-card').forEach(card => {
        const open = () => { const tip = tips.find(t => t.id === parseInt(card.dataset.tipId, 10)); if (tip) openTipDetail(tip); };
        card.addEventListener('click', open);
        card.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); } });
      });
    }

    content.className = 'content';
    content.innerHTML = `
      <div class="tips-view">
        <div class="tips-header">
          <div class="tips-header-left">
            <h2>Tips &amp; Tricks</h2>
            <span id="tipsCount" class="tips-count"></span>
          </div>
          ${isProduction
            ? `<a class="tips-submit-btn" href="https://github.com/richykthrowaway-5949/cmodb/issues/new?labels=tip&title=%5BTip%5D+" target="_blank" rel="noopener">
                <svg viewBox="0 0 24 24" width="16" height="16"><path fill="currentColor" d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
                Suggest a Tip
              </a>`
            : `<button class="tips-submit-btn" id="tipsSubmitBtn">
                <svg viewBox="0 0 24 24" width="16" height="16"><path fill="currentColor" d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
                Add a Tip
              </button>`
          }
        </div>
        <div class="tips-controls">
          <div class="tips-search-wrap">
            <svg class="tips-search-icon" viewBox="0 0 24 24" width="14" height="14"><path fill="currentColor" d="M21 19l-4.35-4.35A7.5 7.5 0 1016.65 13.3L21 17.65 19.65 19zM10.5 16a5.5 5.5 0 110-11 5.5 5.5 0 010 11z"/></svg>
            <input id="tipSearch" class="tips-search" type="text" placeholder="Search tips…" autocomplete="off">
          </div>
          <div class="tips-filter-pills">
            ${CATEGORIES.map(c => `<button class="tip-filter-pill${c === 'All' ? ' active' : ''}" data-cat="${c}">${c}</button>`).join('')}
          </div>
          <select id="tipsSort" class="tips-sort-select">
            <option value="default">Default order</option>
            <option value="az">A → Z</option>
            <option value="za">Z → A</option>
            <option value="cat">By category</option>
          </select>
        </div>
        <div class="tips-grid" id="tipsGrid"></div>
      </div>`;

    renderGrid();

    // Search
    document.getElementById('tipSearch').addEventListener('input', e => {
      tipFilters.search = e.target.value.trim();
      renderGrid();
    });

    // Category pills
    content.querySelectorAll('.tip-filter-pill').forEach(pill => {
      pill.addEventListener('click', () => {
        content.querySelectorAll('.tip-filter-pill').forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        tipFilters.category = pill.dataset.cat;
        renderGrid();
      });
    });

    // Sort
    document.getElementById('tipsSort').addEventListener('change', e => {
      tipFilters.sort = e.target.value;
      renderGrid();
    });

    // Wire submit button → add modal
    document.getElementById('tipsSubmitBtn')?.addEventListener('click', () => {
      document.getElementById('tipSubmitModal').classList.remove('hidden');
      document.getElementById('tipTitle').focus();
    });

    const closeTipModal = () => {
      document.getElementById('tipSubmitModal').classList.add('hidden');
      document.getElementById('tipFormError').style.display = 'none';
    };
    document.getElementById('tipCancelBtn').onclick = closeTipModal;
    document.getElementById('tipSubmitModal').querySelector('.modal-overlay').onclick = closeTipModal;
    document.getElementById('tipSubmitModal').querySelector('.modal-close').onclick = closeTipModal;

    document.getElementById('tipSendBtn').onclick = async () => {
      const title    = document.getElementById('tipTitle').value.trim();
      const body     = document.getElementById('tipBody').value.trim();
      const category = document.getElementById('tipTopic').value;
      const author   = document.getElementById('tipAuthorName').value.trim() || null;
      const link     = document.getElementById('tipLink').value.trim() || null;
      const errEl    = document.getElementById('tipFormError');

      if (!title || !body) {
        errEl.textContent = 'Title and content are required.';
        errEl.style.display = 'block';
        (!title ? document.getElementById('tipTitle') : document.getElementById('tipBody')).focus();
        return;
      }

      const btn = document.getElementById('tipSendBtn');
      btn.disabled = true;
      btn.textContent = 'Saving…';

      try {
        const res = await fetch('/api/tips', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title, body, category, author, link }),
        });
        if (!res.ok) throw new Error(await res.text());
        state._tipsCache = null;
        closeTipModal();
        ['tipTitle', 'tipBody', 'tipAuthorName', 'tipLink'].forEach(id => {
          document.getElementById(id).value = '';
        });
        await renderTips();
      } catch (e) {
        errEl.textContent = 'Failed to save: ' + e.message;
        errEl.style.display = 'block';
      } finally {
        btn.disabled = false;
        btn.textContent = 'Add Tip';
      }
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

  // ── Analytics Rendering ────────────────
  async function renderAnalytics(cat) {
    const data = await loadCategory(cat);
    if (typeof Charts !== 'undefined' && Charts.d3Ready()) {
      // Row 1: Donut + Scatter
      Charts.renderDonut(document.getElementById('analyticsDonut'), data, cat);
      Charts.renderScatter(document.getElementById('analyticsScatter'), data, cat);
      // Row 2: Operator + Histogram
      Charts.renderOperatorBreakdown(document.getElementById('analyticsOperator'), data, cat);
      Charts.renderHistogram(document.getElementById('analyticsHistogram'), data, cat);
      // Row 3: Domain heatmap + Top 10
      if (cat === 'weapons') {
        Charts.renderDomainHeatmap(document.getElementById('analyticsHeatmap'), data);
      } else {
        const hm = document.getElementById('analyticsHeatmap');
        if (hm) hm.innerHTML = '<div style="padding:40px;text-align:center;color:var(--text-secondary);font-size:12px">Select Weapons to see domain coverage</div>';
      }
      Charts.renderTopTen(document.getElementById('analyticsTopTen'), data, cat);
      // Row 4: Capability radar + Timeline
      Charts.renderCapabilityRadar(document.getElementById('analyticsCapRadar'), data, cat);
      Charts.renderTimeline(document.getElementById('analyticsTimeline'), data, cat);
      // Row 5: Sensor generations (full width, sensors only)
      Charts.renderSensorGenerations(document.getElementById('analyticsSensorGen'), data, cat);

      // ── Tactical Analytics (detail-data charts) ──
      // Only load details + show panels for applicable categories
      const tacticalPanels = {
        analyticsPok: cat === 'weapons',
        analyticsEnvelope: cat === 'weapons',
        analyticsSensorCoverage: ['aircraft', 'ships'].includes(cat),
        analyticsWeaponBubble: cat === 'weapons',
        analyticsMagDepth: cat === 'ships',
        analyticsCapMatrix: cat === 'sensors',
      };
      // Show/hide panels
      Object.entries(tacticalPanels).forEach(([id, show]) => {
        const el = document.getElementById(id);
        if (el) { el.classList.toggle('analytics-panel-hidden', !show); el.innerHTML = ''; }
      });
      // Only fetch details if at least one tactical panel applies
      const hasApplicable = Object.values(tacticalPanels).some(Boolean);
      if (hasApplicable) {
        const detailData = await loadDetails(cat);
        if (tacticalPanels.analyticsPok) Charts.renderPokMatrix(document.getElementById('analyticsPok'), data, detailData);
        if (tacticalPanels.analyticsEnvelope) Charts.renderEngagementEnvelope(document.getElementById('analyticsEnvelope'), data, detailData);
        if (tacticalPanels.analyticsSensorCoverage) Charts.renderSensorCoverage(document.getElementById('analyticsSensorCoverage'), data, detailData, cat);
        if (tacticalPanels.analyticsWeaponBubble) Charts.renderWeaponBubble(document.getElementById('analyticsWeaponBubble'), data, detailData);
        if (tacticalPanels.analyticsMagDepth) Charts.renderMagazineDepth(document.getElementById('analyticsMagDepth'), data, detailData);
        if (tacticalPanels.analyticsCapMatrix) Charts.renderCapabilityMatrix(document.getElementById('analyticsCapMatrix'), data, detailData);
      }
    }
  }

  // ── Event Handlers ─────────────────────
  function initEvents() {
    // Category nav
    document.querySelectorAll('.nav-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.nav-btn').forEach(b => {
          b.classList.remove('active');
          b.removeAttribute('aria-current');
        });
        btn.classList.add('active');
        btn.setAttribute('aria-current', 'page');
        const cat = btn.dataset.category;
        state.currentCategory = cat;

        // Tips & Tricks tab
        if (cat === 'tips') {
          document.querySelector('.toolbar').classList.add('hidden');
          renderTips();
          return;
        }

        // Analytics tab: show analytics view instead of card grid
        if (cat === 'analytics') {
          document.querySelector('.toolbar').classList.add('hidden');
          const content = document.getElementById('content');
          content.className = 'content';
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
                <div class="analytics-panel" id="analyticsOperator"></div>
                <div class="analytics-panel analytics-panel-wide" id="analyticsHistogram"></div>
                <div class="analytics-panel" id="analyticsHeatmap"></div>
                <div class="analytics-panel analytics-panel-wide" id="analyticsTopTen"></div>
                <div class="analytics-panel" id="analyticsCapRadar"></div>
                <div class="analytics-panel analytics-panel-wide" id="analyticsTimeline"></div>
                <div class="analytics-panel analytics-panel-full" id="analyticsSensorGen"></div>
                <div class="analytics-panel analytics-panel-full" id="analyticsPok"></div>
                <div class="analytics-panel analytics-panel-full" id="analyticsEnvelope"></div>
                <div class="analytics-panel analytics-panel-full" id="analyticsSensorCoverage"></div>
                <div class="analytics-panel analytics-panel-full" id="analyticsWeaponBubble"></div>
                <div class="analytics-panel analytics-panel-full" id="analyticsMagDepth"></div>
                <div class="analytics-panel analytics-panel-full" id="analyticsCapMatrix"></div>
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
        // Restore toolbar when leaving analytics
        document.querySelector('.toolbar').classList.remove('hidden');

        state.filters = { type: '', operator: '', search: '' };
        state.sort = 'name-asc';
        globalSearch.value = '';
        sortBy.value = 'name-asc';
        render();
      });
    });

    // Type icon filter buttons
    typeIconFiltersEl.addEventListener('click', e => {
      const btn = e.target.closest('.type-icon-btn');
      if (!btn) return;
      const group = btn.dataset.typeGroup;
      if (group) {
        // Ship group button
        state.filters.type = state.filters.type === group ? '' : group;
        filterType.value = ''; // groups don't map to dropdown options
      } else {
        // Aircraft direct type button
        const type = btn.dataset.type;
        state.filters.type = state.filters.type === type ? '' : type;
        filterType.value = state.filters.type;
      }
      render();
    });

    // Filters
    filterType.addEventListener('change', () => {
      state.filters.type = filterType.value;
      render();
    });

    filterOperator.addEventListener('change', () => {
      state.filters.operator = filterOperator.value;
      render();
    });

    sortBy.addEventListener('change', () => {
      state.sort = sortBy.value;
      render();
    });

    // Global search
    let searchTimeout;
    globalSearch.addEventListener('input', () => {
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(() => {
        state.filters.search = globalSearch.value;
        render();
      }, 200);
    });

    // Card keyboard activation
    content.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        const card = e.target.closest('.card');
        if (card && e.target === card) {
          e.preventDefault();
          card.click();
        }
      }
    });

    // Card click (detail + compare checkbox)
    content.addEventListener('click', (e) => {
      const compareBtn = e.target.closest('.card-compare');
      if (compareBtn) {
        e.stopPropagation();
        const id = parseInt(compareBtn.dataset.id);
        toggleCompare(id, state.currentCategory);
        compareBtn.classList.toggle('selected');
        return;
      }

      const card = e.target.closest('.card');
      if (card) {
        const id = parseInt(card.dataset.id);
        const cat = card.dataset.category;
        const data = state.data[cat] || [];
        const item = data.find(d => d.id === id);
        if (item) showDetail(item, cat);
      }
    });

    // Compare button
    compareBtn.addEventListener('click', showCompare);

    // View toggle
    viewToggle.setAttribute('aria-label', 'Switch to list view');
    viewToggle.addEventListener('click', () => {
      state.viewMode = state.viewMode === 'grid' ? 'list' : 'grid';
      $('gridIcon').classList.toggle('hidden', state.viewMode === 'grid');
      $('listIcon').classList.toggle('hidden', state.viewMode === 'list');
      viewToggle.setAttribute('aria-label', state.viewMode === 'grid' ? 'Switch to list view' : 'Switch to grid view');
      render();
    });

    // Section collapse toggle
    modalBody.addEventListener('click', (e) => {
      if (e.target.closest('select, button, a, input')) return;
      const title = e.target.closest('.detail-section-title');
      if (!title) return;
      title.parentElement.classList.toggle('collapsed');
    });

    // Modal close
    document.querySelectorAll('.modal-overlay, .modal-close').forEach(el => {
      el.addEventListener('click', () => {
        detailModal.classList.add('hidden');
        compareModal.classList.add('hidden');
      });
    });

    // Escape key closes modals + focus trap
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        detailModal.classList.add('hidden');
        compareModal.classList.add('hidden');
        return;
      }
      // Focus trap within open modal
      if (e.key === 'Tab') {
        const openModal = !detailModal.classList.contains('hidden') ? detailModal
          : !compareModal.classList.contains('hidden') ? compareModal : null;
        if (!openModal) return;
        const focusable = openModal.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
        if (!focusable.length) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    });
  }

  // ── Init ───────────────────────────────
  async function init() {
    initImageObserver();
    initEvents();
    // Load image map concurrently — render() will wait for it via prefetchCategoryImages
    loadImageMap();
    render();
  }

  // ── Country switching ───────────────────
  function switchCountry(code) {
    if (state.country === code) return;
    state.country = code;
    // Clear per-country caches
    state.data = {};
    state.details = {};
    state.imageMap = null;
    _imageMapPromise = null;
    // Cancel queued image loads
    state.imgQueue = [];
    state.imgActive = 0;
    state.chartCache.clear();
    // Disconnect existing observer so cards get re-observed after re-render
    if (state.imageObserver) { state.imageObserver.disconnect(); state.imageObserver = null; }
    // Reset filters and re-render current tab
    state.filters = { type: '', operator: '', search: '' };
    state.sort = 'name-asc';
    // Update page title/subtitle
    // Use manifest name if available, else fallback
    const entry = (window._countriesManifest || []).find(c => c.code === code);
    const label = entry ? entry.name : code.toUpperCase();
    const sub = document.getElementById('logoSubtitle');
    if (sub) sub.textContent = `${label} Military Equipment`;
    document.title = `Command: Index — ${label}`;
    // Update header button
    const flagEl = document.getElementById('countrySelectFlag');
    const labelEl = document.getElementById('countrySelectLabel');
    if (flagEl && entry) { flagEl.src = entry.flag; flagEl.alt = code.toUpperCase(); }
    if (labelEl && entry) labelEl.textContent = entry.name;
    // Re-render current tab with new country's data
    render();
  }

  return { init, switchCountry };
})();

document.addEventListener('DOMContentLoaded', App.init);

// Country picker modal
(function() {
  const btn = document.getElementById('countrySelectBtn');
  const modal = document.getElementById('countryModal');
  const grid = document.getElementById('countryGrid');
  const searchEl = document.getElementById('countrySearch');
  let countries = [];

  function openModal() {
    modal.classList.remove('hidden');
    btn.setAttribute('aria-expanded', 'true');
    searchEl.value = '';
    renderGrid('');
    requestAnimationFrame(() => searchEl.focus());
  }

  function closeModal() {
    modal.classList.add('hidden');
    btn.setAttribute('aria-expanded', 'false');
  }

  function renderGrid(query) {
    const q = query.toLowerCase().trim();
    const filtered = q ? countries.filter(c => c.name.toLowerCase().includes(q)) : countries;
    grid.innerHTML = filtered.map(c => `
      <button class="country-tile${c.code === (window._activeCountry || 'us') ? ' active' : ''}" data-code="${c.code}" data-flag="${c.flag}" data-name="${c.name}">
        <img src="${c.flag}" width="32" height="22" alt="${c.name}" onerror="this.style.display='none'">
        <span>${c.name}</span>
      </button>`).join('');
  }

  function init(data) {
    countries = data;
    window._countriesManifest = data;
    window._activeCountry = 'us';

    btn.addEventListener('click', openModal);

    grid.addEventListener('click', e => {
      const tile = e.target.closest('.country-tile');
      if (!tile) return;
      window._activeCountry = tile.dataset.code;
      closeModal();
      App.switchCountry(tile.dataset.code);
    });

    searchEl.addEventListener('input', () => renderGrid(searchEl.value));

    modal.querySelector('.modal-overlay').addEventListener('click', closeModal);
    modal.querySelector('.modal-close').addEventListener('click', closeModal);

    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && !modal.classList.contains('hidden')) closeModal();
    });
  }

  fetch('data/countries.json')
    .then(r => r.json())
    .then(init)
    .catch(() => console.warn('Could not load countries.json'));
})();
