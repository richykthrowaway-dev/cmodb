// extract.js — Pull real game data from CMO database into split index/detail JSON files
const Database = require('./node_modules/better-sqlite3');
const fs = require('fs');
const path = require('path');

const DB_PATH = 'F:/SteamLibrary/steamapps/common/Command - Modern Operations/DB/DB3K_464.db3';
const db = new Database(DB_PATH, { readonly: true });
const NMI = 1.852;
const US = 2101;

// ========== Enum maps ==========
const em = t => {
  try { return Object.fromEntries(db.prepare(`SELECT ID, Description FROM ${t}`).all().map(r => [r.ID, r.Description])); }
  catch { return {}; }
};
const acTypes = em('EnumAircraftType'), shipTypes = em('EnumShipType'), subTypes = em('EnumSubmarineType');
const wpnTypes = em('EnumWeaponType'), snRoles = em('EnumSensorRole'), snTypes = em('EnumSensorType');
const snGens = em('EnumSensorGeneration'), sigTypesMap = em('EnumSignatureType'), services = em('EnumOperatorService');
const whTypes = em('EnumWarheadType'), acCodes = em('EnumAircraftCode'), shipCodes = em('EnumShipCode');
const subCodes = em('EnumSubmarineCode'), snCaps = em('EnumSensorCapability'), snFreqs = em('EnumSensorFrequency');
const facCats = em('EnumFacilityCategory');

// ========== Search helpers ==========
function findAC(term) {
  return db.prepare(`SELECT * FROM DataAircraft WHERE Name LIKE ? AND OperatorCountry=? AND Hypothetical=0 ORDER BY YearCommissioned DESC LIMIT 1`).get(`%${term}%`, US)
    || db.prepare(`SELECT * FROM DataAircraft WHERE Name LIKE ? AND OperatorCountry=? ORDER BY YearCommissioned DESC LIMIT 1`).get(`%${term}%`, US);
}
function findShip(term) {
  return db.prepare(`SELECT * FROM DataShip WHERE Name LIKE ? AND OperatorCountry=? AND Hypothetical=0 ORDER BY YearCommissioned DESC LIMIT 1`).get(`%${term}%`, US)
    || db.prepare(`SELECT * FROM DataShip WHERE Name LIKE ? AND OperatorCountry=? ORDER BY YearCommissioned DESC LIMIT 1`).get(`%${term}%`, US);
}
function findSub(term) {
  return db.prepare(`SELECT * FROM DataSubmarine WHERE Name LIKE ? AND OperatorCountry=? AND Hypothetical=0 ORDER BY YearCommissioned DESC LIMIT 1`).get(`%${term}%`, US)
    || db.prepare(`SELECT * FROM DataSubmarine WHERE Name LIKE ? AND OperatorCountry=? ORDER BY YearCommissioned DESC LIMIT 1`).get(`%${term}%`, US);
}
function findWpn(term) {
  return db.prepare(`SELECT * FROM DataWeapon WHERE Name LIKE ? AND Hypothetical=0 LIMIT 1`).get(`%${term}%`)
    || db.prepare(`SELECT * FROM DataWeapon WHERE Name LIKE ? LIMIT 1`).get(`%${term}%`);
}
function findSn(term) {
  return db.prepare(`SELECT * FROM DataSensor WHERE Name LIKE ? AND Hypothetical=0 LIMIT 1`).get(`%${term}%`)
    || db.prepare(`SELECT * FROM DataSensor WHERE Name LIKE ? LIMIT 1`).get(`%${term}%`);
}
function findFac(term) {
  return db.prepare(`SELECT * FROM DataFacility WHERE Name LIKE ? AND OperatorCountry=? AND Hypothetical=0 ORDER BY YearCommissioned DESC LIMIT 1`).get(`%${term}%`, US)
    || db.prepare(`SELECT * FROM DataFacility WHERE Name LIKE ? AND OperatorCountry=? ORDER BY YearCommissioned DESC LIMIT 1`).get(`%${term}%`, US);
}

// ========== Data extractors ==========
function getACSensors(id) {
  return db.prepare(`
    SELECT DataSensor.ID as sid, DataSensor.Name, DataSensor.Role, DataSensor.Type,
      DataSensor.Generation, DataSensor.RangeMax, DataSensor.RangeMin
    FROM DataAircraftSensors INNER JOIN DataSensor ON ComponentID=DataSensor.ID
    WHERE DataAircraftSensors.ID=?
  `).all(id).map(s => ({
    name: s.Name, role: snRoles[s.Role] || '', type: snTypes[s.Type] || '',
    generation: snGens[s.Generation] || '', rangeMax: +(s.RangeMax * NMI).toFixed(1), rangeMin: +(s.RangeMin * NMI).toFixed(1)
  }));
}

function getACLoadouts(id) {
  const loadouts = db.prepare(`
    SELECT DataLoadout.ID as lid, DataLoadout.Name FROM DataAircraftLoadouts
    INNER JOIN DataLoadout ON ComponentID=DataLoadout.ID WHERE DataAircraftLoadouts.ID=?
  `).all(id);
  return loadouts.filter(l => !l.Name.includes('Reserve') && !l.Name.includes('Maintenance') && !l.Name.includes('Ferry')).map(l => {
    const wpns = db.prepare(`
      SELECT DataWeapon.Name, DataWeapon.Type, DataLoadoutWeapons.Internal, DataLoadoutWeapons.Optional,
        DataWeapon.AirRangeMax, DataWeapon.SurfaceRangeMax, DataWeapon.LandRangeMax, DataWeapon.SubsurfaceRangeMax, DataWeapon.Weight
      FROM DataLoadoutWeapons INNER JOIN DataWeapon ON ComponentID=DataWeapon.ID
      WHERE DataLoadoutWeapons.ID=?
    `).all(l.lid);
    // Group by weapon name and count
    const grouped = {};
    for (const w of wpns) {
      if (!grouped[w.Name]) grouped[w.Name] = { ...w, qty: 0 };
      grouped[w.Name].qty++;
    }
    return {
      name: l.Name,
      weapons: Object.values(grouped).map(w => ({
        name: w.Name, type: wpnTypes[w.Type] || '', qty: w.qty,
        airRange: w.AirRangeMax ? +(w.AirRangeMax * NMI).toFixed(1) : null,
        surfaceRange: w.SurfaceRangeMax ? +(w.SurfaceRangeMax * NMI).toFixed(1) : null,
        landRange: w.LandRangeMax ? +(w.LandRangeMax * NMI).toFixed(1) : null,
        subRange: w.SubsurfaceRangeMax ? +(w.SubsurfaceRangeMax * NMI).toFixed(1) : null,
        weight: w.Weight, internal: !!w.Internal
      }))
    };
  });
}

function getACPropulsion(id) {
  const rows = db.prepare(`
    SELECT DataPropulsion.Name, DataPropulsion.NumberOfEngines,
      DataPropulsion.ThrustPerEngineMilitary, DataPropulsion.ThrustPerEngineAfterburner
    FROM DataAircraftPropulsion INNER JOIN DataPropulsion ON ComponentID=DataPropulsion.ID
    WHERE DataAircraftPropulsion.ID=?
  `).all(id);
  if (!rows.length) return { name: '', performances: [] };
  const compRow = db.prepare(`SELECT ComponentID FROM DataAircraftPropulsion WHERE ID=? LIMIT 1`).get(id);
  const perfs = compRow ? db.prepare(`SELECT * FROM DataPropulsionPerformance WHERE ID=?`).all(compRow.ComponentID) : [];
  return {
    name: rows[0].Name,
    engines: rows[0].NumberOfEngines,
    thrustMil: rows[0].ThrustPerEngineMilitary,
    thrustAB: rows[0].ThrustPerEngineAfterburner,
    performances: perfs.map(p => ({
      altBand: p.AltitudeBand, throttle: p.Throttle, speed: p.Speed,
      altMin: p.AltitudeMin, altMax: p.AltitudeMax, consumption: p.Consumption
    }))
  };
}

function getSignatures(table, id) {
  return db.prepare(`SELECT Type, Front, Side, Rear, Top FROM ${table} WHERE ID=?`).all(id)
    .map(s => ({ type: sigTypesMap[s.Type] || `Type ${s.Type}`, front: s.Front, side: s.Side, rear: s.Rear, top: s.Top }));
}

function getCodes(table, enumTable, id) {
  try {
    const enumMap = em(enumTable);
    return db.prepare(`SELECT CodeID FROM ${table} WHERE ID=?`).all(id).map(c => enumMap[c.CodeID] || '').filter(Boolean);
  } catch { return []; }
}

function getMountsWeapons(mountTable, id) {
  const mounts = db.prepare(`
    SELECT DataMount.ID as mid, DataMount.Name FROM ${mountTable}
    INNER JOIN DataMount ON ComponentID=DataMount.ID WHERE ${mountTable}.ID=?
  `).all(id);
  const result = [];
  const seen = new Set();
  for (const m of mounts) {
    const key = m.Name;
    if (seen.has(key)) { const existing = result.find(r => r.name === key); if (existing) existing.qty++; continue; }
    seen.add(key);
    const wpns = db.prepare(`
      SELECT DataWeapon.Name, DataWeapon.Type, DataWeapon.AirRangeMax, DataWeapon.SurfaceRangeMax,
        DataWeapon.LandRangeMax, DataWeapon.SubsurfaceRangeMax
      FROM DataMountWeapons INNER JOIN DataWeapon ON ComponentID=DataWeapon.ID WHERE DataMountWeapons.ID=?
    `).all(m.mid);
    result.push({
      name: m.Name, qty: 1,
      weapons: wpns.map(w => ({
        name: w.Name, type: wpnTypes[w.Type] || '',
        airRange: w.AirRangeMax ? +(w.AirRangeMax * NMI).toFixed(1) : null,
        surfaceRange: w.SurfaceRangeMax ? +(w.SurfaceRangeMax * NMI).toFixed(1) : null,
        landRange: w.LandRangeMax ? +(w.LandRangeMax * NMI).toFixed(1) : null,
        subRange: w.SubsurfaceRangeMax ? +(w.SubsurfaceRangeMax * NMI).toFixed(1) : null
      }))
    });
  }
  return result;
}

function getMagazineWeapons(id) {
  const mags = db.prepare(`
    SELECT DataMagazine.ID as mid, DataMagazine.Name, DataMagazine.Capacity
    FROM DataShipMagazines INNER JOIN DataMagazine ON ComponentID=DataMagazine.ID WHERE DataShipMagazines.ID=?
  `).all(id);
  const result = [];
  const seen = new Set();
  for (const m of mags) {
    if (seen.has(m.Name)) { const e = result.find(r => r.name === m.Name); if (e) e.qty++; continue; }
    seen.add(m.Name);
    const wpns = db.prepare(`
      SELECT DataWeapon.Name, DataWeapon.Type FROM DataMagazineWeapons
      INNER JOIN DataWeapon ON ComponentID=DataWeapon.ID WHERE DataMagazineWeapons.ID=?
    `).all(m.mid);
    result.push({ name: m.Name, qty: 1, capacity: m.Capacity, weapons: wpns.map(w => ({ name: w.Name, type: wpnTypes[w.Type] || '' })) });
  }
  return result;
}

function getShipSensors(table, id) {
  return db.prepare(`
    SELECT DataSensor.Name, DataSensor.Role, DataSensor.Type, DataSensor.Generation, DataSensor.RangeMax, DataSensor.RangeMin
    FROM ${table} INNER JOIN DataSensor ON ComponentID=DataSensor.ID WHERE ${table}.ID=?
  `).all(id).map(s => ({
    name: s.Name, role: snRoles[s.Role] || '', type: snTypes[s.Type] || '',
    generation: snGens[s.Generation] || '', rangeMax: +(s.RangeMax * NMI).toFixed(1), rangeMin: +(s.RangeMin * NMI).toFixed(1)
  }));
}

function getShipPropulsion(table, id) {
  const rows = db.prepare(`
    SELECT DataPropulsion.Name, DataPropulsion.NumberOfEngines
    FROM ${table} INNER JOIN DataPropulsion ON ComponentID=DataPropulsion.ID WHERE ${table}.ID=?
  `).all(id);
  if (!rows.length) return { name: '', maxSpeed: 0, performances: [] };
  const compRow = db.prepare(`SELECT ComponentID FROM ${table} WHERE ID=? LIMIT 1`).get(id);
  const perfs = compRow ? db.prepare(`SELECT * FROM DataPropulsionPerformance WHERE ID=?`).all(compRow.ComponentID) : [];
  return {
    name: rows[0].Name,
    maxSpeed: perfs.length ? Math.max(...perfs.map(p => p.Speed)) : 0,
    performances: perfs.map(p => ({ throttle: p.Throttle, speed: p.Speed, consumption: p.Consumption }))
  };
}

function getWeaponWarhead(wpnId) {
  const rec = db.prepare(`SELECT ComponentID FROM DataWeaponRecord WHERE ID=?`).get(wpnId);
  if (!rec) return null;
  const wh = db.prepare(`SELECT * FROM DataWarhead WHERE ID=?`).get(rec.ComponentID);
  if (!wh) return null;
  return { name: wh.Name, type: whTypes[wh.Type] || '', damage: wh.DamagePoints, explosiveWeight: wh.ExplosivesWeight, numWarheads: wh.NumberOfWarheads };
}

// Helper: resolve search term (string = LIKE search, number = direct ID)
function resolveAC(v) {
  if (typeof v === 'number') return db.prepare('SELECT * FROM DataAircraft WHERE ID=?').get(v);
  return findAC(v);
}
function resolveShip(v) {
  if (typeof v === 'number') return db.prepare('SELECT * FROM DataShip WHERE ID=?').get(v);
  return findShip(v);
}
function resolveSub(v) {
  if (typeof v === 'number') return db.prepare('SELECT * FROM DataSubmarine WHERE ID=?').get(v);
  return findSub(v);
}
function resolveWpn(v) {
  if (typeof v === 'number') return db.prepare('SELECT * FROM DataWeapon WHERE ID=?').get(v);
  return findWpn(v);
}
function resolveSn(v) {
  if (typeof v === 'number') return db.prepare('SELECT * FROM DataSensor WHERE ID=?').get(v);
  return findSn(v);
}
function resolveFac(v) {
  if (typeof v === 'number') return db.prepare('SELECT * FROM DataFacility WHERE ID=?').get(v);
  return findFac(v);
}

// ========== AIRCRAFT EXTRACTION ==========
// Use CMO DB ID (number) for exact match, or search term (string) for LIKE match
const aircraftSearch = {
  1:'F-14A', 2:'F-15A Eagle', 3:'F-15C', 4:'F-15E', 5:'F-16C', 6:'F/A-18C', 7:'F/A-18E',
  8:'F-22A', 9:'F-35A', 10:'F-35B', 11:'F-35C', 12:'A-10C', 13:'B-1B', 14:'B-2A', 15:'B-52H',
  16:'E-3C', 17:'E-2D', 18:'P-8A', 19:'C-17A', 20:'AH-64D', 21:'MQ-9B Reaper', 22:'V-22B', 23:'UH-60M',
  24:'KC-46A', 25:'EA-18G', 27:'F/A-18F', 28:'AV-8B', 29:'AC-130J',
  31:'AH-1Z', 32:'CH-47F', 33:'CH-53K', 34:1723, 35:'C-5M', 36:'E-6B', 37:'E-8C',
  38:'RC-135V', 39:'U-2S', 40:'MH-60R', 41:'HH-60W', 42:'KC-135R', 43:'RQ-4B', 44:'MQ-25',
  45:'MQ-1C'
};
const aircraftNames = {
  1:'F-14A Tomcat', 2:'F-15A Eagle', 3:'F-15C Eagle', 4:'F-15E Strike Eagle', 5:'F-16C Viper Block 50',
  6:'F/A-18C Hornet', 7:'F/A-18E Super Hornet', 8:'F-22A Raptor', 9:'F-35A Lightning II',
  10:'F-35B Lightning II', 11:'F-35C Lightning II', 12:'A-10C Thunderbolt II', 13:'B-1B Lancer',
  14:'B-2A Spirit', 15:'B-52H Stratofortress', 16:'E-3C Sentry (AWACS)', 17:'E-2D Advanced Hawkeye',
  18:'P-8A Poseidon', 19:'C-17A Globemaster III', 20:'AH-64D Apache Longbow', 21:'MQ-9A Reaper',
  22:'V-22B Osprey', 23:'UH-60M Black Hawk', 24:'KC-46A Pegasus', 25:'EA-18G Growler',
  26:'F-15EX Eagle II', 27:'F/A-18F Super Hornet', 28:'AV-8B Harrier II+', 29:'AC-130J Ghostrider',
  30:'B-21 Raider', 31:'AH-1Z Viper', 32:'CH-47F Chinook', 33:'CH-53K King Stallion',
  34:'C-130J Super Hercules', 35:'C-5M Super Galaxy', 36:'E-6B Mercury', 37:'E-8C Joint STARS',
  38:'RC-135V Rivet Joint', 39:'U-2S Dragon Lady', 40:'MH-60R Seahawk', 41:'HH-60W Jolly Green II',
  42:'KC-135R Stratotanker', 43:'RQ-4B Global Hawk', 44:'MQ-25A Stingray', 45:'MQ-1C Gray Eagle'
};

console.log('=== Extracting Aircraft ===');
const acIndex = [], acDetails = {};
for (const [ourId, term] of Object.entries(aircraftSearch)) {
  const row = resolveAC(term);
  if (!row) { console.log(`  MISS: ${term} (ID ${ourId})`); continue; }
  console.log(`  ${ourId}: ${aircraftNames[ourId]} -> CMO #${row.ID} "${row.Name}" [${row.Comments}]`);

  const sensors = getACSensors(row.ID);
  const loadouts = getACLoadouts(row.ID);
  const prop = getACPropulsion(row.ID);
  const sigs = getSignatures('DataAircraftSignatures', row.ID);
  const codes = getCodes('DataAircraftCodes', 'EnumAircraftCode', row.ID);

  // Compute unique weapon count and max speed
  const wpnSet = new Set();
  for (const lo of loadouts) for (const w of lo.weapons) wpnSet.add(w.name);
  const maxSpeed = prop.performances.length ? Math.max(...prop.performances.map(p => p.speed)) : 0;
  // Deduplicate sensors by name
  const uniqueSensors = [...new Map(sensors.map(s => [s.name, s])).values()];

  acIndex.push({
    id: +ourId, name: aircraftNames[ourId], dbName: row.Name, comments: row.Comments || '',
    type: acTypes[row.Type] || '', operator: services[row.OperatorService] || '',
    commissioned: row.YearCommissioned, crew: row.Crew, maxSpeed,
    maxWeight: row.WeightMax, emptyWeight: row.WeightEmpty, length: row.Length, span: row.Span, height: row.Height,
    propulsion: prop.name, sensorCount: uniqueSensors.length, weaponCount: wpnSet.size,
    description: row.Comments && row.Comments !== '-' ? `${aircraftNames[ourId]} [${row.Comments}]` : aircraftNames[ourId]
  });

  acDetails[ourId] = {
    agility: row.Agility, climbRate: row.ClimbRate, damagePoints: row.DamagePoints,
    maxPayload: row.WeightPayload, totalEndurance: row.TotalEndurance,
    engineArmor: row.AircraftEngineArmor, fuselageArmor: row.AircraftFuselageArmor, cockpitArmor: row.AircraftCockpitArmor,
    sensors: uniqueSensors, loadouts, propulsion: prop, signatures: sigs, codes
  };
}

// ========== SHIPS EXTRACTION ==========
// Use [type, searchTerm] or [type, cmoDbId] for direct ID lookup
const shipSearch = {
  1: ['ship', 'Nimitz'], 2: ['ship', 'Ford'], 3: ['ship', 'Arleigh Burke%Flight I]'],
  4: ['ship', 'Arleigh Burke%Flight IIA'], 5: ['ship', 'Zumwalt'], 6: ['ship', 'Ticonderoga%VLS'],
  7: ['ship', 'Freedom'], 8: ['ship', 'Independence'],
  10: ['ship', 'America'], 11: ['ship', 'San Antonio'],
  12: ['sub', 'Virginia'], 13: ['sub', 26], 14: ['sub', 182]
};
const shipNames = {
  1:'CVN-68 Nimitz', 2:'CVN-78 Gerald R. Ford', 3:'DDG-51 Arleigh Burke Flight I',
  4:'DDG-51 Arleigh Burke Flight IIA', 5:'DDG-1000 Zumwalt', 6:'CG-47 Ticonderoga',
  7:'LCS-1 Freedom', 8:'LCS-2 Independence', 9:'FFG-62 Constellation', 10:'LHA-6 America',
  11:'LPD-17 San Antonio', 12:'SSN-774 Virginia', 13:'SSBN-726 Ohio', 14:'SSGN-726 Ohio (Conversion)',
  15:'SSBN-826 Columbia'
};

console.log('\n=== Extracting Ships ===');
const shipIndex = [], shipDetails = {};
for (const [ourId, [kind, term]] of Object.entries(shipSearch)) {
  const row = kind === 'sub' ? resolveSub(term) : resolveShip(term);
  if (!row) { console.log(`  MISS: ${term} (ID ${ourId})`); continue; }
  console.log(`  ${ourId}: ${shipNames[ourId]} -> CMO #${row.ID} "${row.Name}" [${row.Comments || ''}]`);

  const isSub = kind === 'sub';
  const sensorTable = isSub ? 'DataSubmarineSensors' : 'DataShipSensors';
  const mountTable = isSub ? 'DataSubmarineMounts' : 'DataShipMounts';
  const sigTable = isSub ? 'DataSubmarineSignatures' : 'DataShipSignatures';
  const codeTable = isSub ? 'DataSubmarineCodes' : 'DataShipCodes';
  const codeEnum = isSub ? 'EnumSubmarineCode' : 'EnumShipCode';
  const propTable = isSub ? 'DataSubmarinePropulsion' : 'DataShipPropulsion';

  const sensors = getShipSensors(sensorTable, row.ID);
  const mounts = getMountsWeapons(mountTable, row.ID);
  const sigs = getSignatures(sigTable, row.ID);
  const codes = getCodes(codeTable, codeEnum, row.ID);
  const propulsion = getShipPropulsion(propTable, row.ID);
  const magazines = isSub ? [] : getMagazineWeapons(row.ID);

  const uniqueSensors = [...new Map(sensors.map(s => [s.name, s])).values()];
  const wpnSet = new Set();
  for (const m of mounts) for (const w of m.weapons) wpnSet.add(w.name);
  for (const m of magazines) for (const w of m.weapons) wpnSet.add(w.name);
  const maxSpeed = propulsion.maxSpeed || 0;

  shipIndex.push({
    id: +ourId, name: shipNames[ourId], dbName: row.Name, comments: row.Comments || '',
    type: isSub ? (subTypes[row.Type] || '') : (shipTypes[row.Type] || ''),
    operator: services[row.OperatorService] || '', commissioned: row.YearCommissioned,
    crew: row.Crew, displacementFull: row.DisplacementFull,
    length: row.Length, beam: row.Beam, draft: row.Draft,
    maxSpeed, sensorCount: uniqueSensors.length, weaponCount: wpnSet.size,
    maxDepth: isSub ? row.MaxDepth : null,
    description: row.Comments && row.Comments !== '-' ? `${shipNames[ourId]} [${row.Comments}]` : shipNames[ourId]
  });

  shipDetails[ourId] = {
    damagePoints: row.DamagePoints, displacementEmpty: row.DisplacementEmpty || 0,
    displacementStandard: row.DisplacementStandard || 0, height: row.Height || 0,
    maxDepth: isSub ? row.MaxDepth : null,
    sensors: uniqueSensors, mounts, magazines, propulsion,
    signatures: sigs, codes
  };
}

// ========== WEAPONS EXTRACTION ==========
const wpnSearch = {
  1:'AIM-120C-7', 2:2780, 3:'AIM-7M', 4:'AGM-88E', 5:'AGM-84D',
  6:'AGM-158B', 7:586, 8:'RIM-174', 9:3256, 10:3138,
  11:2853, 12:'AGM-114L', 13:'FIM-92', 14:'GBU-31(V)1', 15:'GBU-12',
  16:'Mk48%ADCAP', 17:'Mk54', 18:2686, 19:'AGM-154C', 20:'NSM',
  21:'AGM-65G', 22:'GBU-57', 23:'AGM-86B', 24:'LRASM', 25:893
};
const wpnNames = {
  1:'AIM-120C-7 AMRAAM', 2:'AIM-9X Sidewinder Block II', 3:'AIM-7M Sparrow', 4:'AGM-88E AARGM',
  5:'AGM-84D Harpoon', 6:'AGM-158B JASSM-ER', 7:'BGM-109E Tomahawk Block IV',
  8:'RIM-174 SM-6 ERAM', 9:'RIM-161 SM-3 Block IIA', 10:'RIM-162 ESSM',
  11:'RIM-116C RAM Block 2', 12:'AGM-114L Longbow Hellfire', 13:'FIM-92G Stinger',
  14:'GBU-31(V)1 JDAM', 15:'GBU-12 Paveway II', 16:'Mk48 Mod 7 ADCAP CBASS',
  17:'Mk54 Mod 0 LHT', 18:'UGM-133A Trident II D5', 19:'AGM-154C JSOW',
  20:'NSM (Naval Strike Missile)', 21:'AGM-65G2 Maverick',
  22:'GBU-57A/B Massive Ordnance Penetrator', 23:'AGM-86B ALCM',
  24:'LRASM (AGM-158C)', 25:'THAAD (Terminal High Altitude Area Defense)'
};

console.log('\n=== Extracting Weapons ===');
const wpnIndex = [], wpnDetails = {};
for (const [ourId, term] of Object.entries(wpnSearch)) {
  const row = resolveWpn(term);
  if (!row) { console.log(`  MISS: ${term} (ID ${ourId})`); continue; }
  console.log(`  ${ourId}: ${wpnNames[ourId]} -> CMO #${row.ID} "${row.Name}"`);

  const bestRange = Math.max(row.AirRangeMax || 0, row.SurfaceRangeMax || 0, row.LandRangeMax || 0, row.SubsurfaceRangeMax || 0);
  const warhead = getWeaponWarhead(row.ID);

  wpnIndex.push({
    id: +ourId, name: wpnNames[ourId], dbName: row.Name, comments: row.Comments || '',
    type: wpnTypes[row.Type] || '', weight: row.Weight, length: row.Length, span: row.Span, diameter: row.Diameter,
    maxRange: +(bestRange * NMI).toFixed(1),
    airRange: row.AirRangeMax ? +(row.AirRangeMax * NMI).toFixed(1) : null,
    surfaceRange: row.SurfaceRangeMax ? +(row.SurfaceRangeMax * NMI).toFixed(1) : null,
    landRange: row.LandRangeMax ? +(row.LandRangeMax * NMI).toFixed(1) : null,
    subRange: row.SubsurfaceRangeMax ? +(row.SubsurfaceRangeMax * NMI).toFixed(1) : null,
    description: row.Comments && row.Comments !== '-' ? `${wpnNames[ourId]} [${row.Comments}]` : wpnNames[ourId]
  });

  wpnDetails[ourId] = {
    burnoutWeight: row.BurnoutWeight, cruiseAltitude: row.CruiseAltitude,
    cep: row.CEP, cepSurface: row.CEPSurface,
    airPoK: row.AirPoK, surfacePoK: row.SurfacePoK, landPoK: row.LandPoK, subPoK: row.SubsurfacePoK,
    climbRate: row.ClimbRate,
    airRangeMin: row.AirRangeMin ? +(row.AirRangeMin * NMI).toFixed(1) : null,
    surfaceRangeMin: row.SurfaceRangeMin ? +(row.SurfaceRangeMin * NMI).toFixed(1) : null,
    landRangeMin: row.LandRangeMin ? +(row.LandRangeMin * NMI).toFixed(1) : null,
    subRangeMin: row.SubsurfaceRangeMin ? +(row.SubsurfaceRangeMin * NMI).toFixed(1) : null,
    launchSpeedMax: row.LaunchSpeedMax, launchSpeedMin: row.LaunchSpeedMin,
    launchAltMax: row.LaunchAltitudeMax_ASL, launchAltMin: row.LaunchAltitudeMin_ASL,
    targetSpeedMax: row.TargetSpeedMax, targetSpeedMin: row.TargetSpeedMin,
    targetAltMax: row.TargetAltitudeMax_ASL, targetAltMin: row.TargetAltitudeMin_ASL,
    maxFlightTime: row.MaxFlightTime,
    torpSpeedCruise: row.TorpedoSpeedCruise, torpRangeCruise: row.TorpedoRangeCruise ? +(row.TorpedoRangeCruise * NMI).toFixed(1) : null,
    torpSpeedFull: row.TorpedoSpeedFull, torpRangeFull: row.TorpedoRangeFull ? +(row.TorpedoRangeFull * NMI).toFixed(1) : null,
    warhead
  };
}

// ========== SENSORS EXTRACTION ==========
const snSearch = {
  1:'AN/APG-77 AESA', 2:'AN/APG-81', 3:'AN/APG-79', 4:'AN/SPY-1D(V)', 5:'AN/SPY-6',
  6:'AN/APY-2', 7:'AN/APY-9', 8:'AN/AAQ-37', 9:3466, 10:'AN/AAQ-33',
  11:'AN/BQQ-10', 12:'AN/SQS-53C', 13:'AN/SLQ-32(V)6', 14:'AN/ASQ-239', 15:'AN/APG-63(V)3',
  16:'AN/ALR-94', 17:'AN/TPY-2', 18:'AN/APG-68(V)9', 19:'TADS/PNVS', 20:'AN/APG-78'
};
const snNames = {
  1:'AN/APG-77 AESA', 2:'AN/APG-81 AESA', 3:'AN/APG-79 AESA', 4:'AN/SPY-1D(V)',
  5:'AN/SPY-6(V)1 AMDR', 6:'AN/APY-2', 7:'AN/APY-9 AESA', 8:'AN/AAQ-37 DAS',
  9:'AN/AAQ-40 EOTS', 10:'AN/AAQ-33 Sniper XR', 11:'AN/BQQ-10 ARCI', 12:'AN/SQS-53C',
  13:'AN/SLQ-32(V)6 SEWIP Block 3', 14:'AN/ASQ-239 EW Suite', 15:'AN/APG-63(V)3 AESA',
  16:'AN/ALR-94', 17:'AN/TPY-2 (THAAD Radar)', 18:'AN/APG-68(V)9', 19:'TADS/PNVS (M-TADS)',
  20:'AN/APG-78 Longbow FCR'
};

console.log('\n=== Extracting Sensors ===');
const snIndex = [], snDetails = {};
for (const [ourId, term] of Object.entries(snSearch)) {
  const row = resolveSn(term);
  if (!row) { console.log(`  MISS: ${term} (ID ${ourId})`); continue; }
  console.log(`  ${ourId}: ${snNames[ourId]} -> CMO #${row.ID} "${row.Name}"`);

  const caps = (() => { try { return db.prepare(`SELECT CodeID FROM DataSensorCapabilities WHERE ID=?`).all(row.ID).map(c => snCaps[c.CodeID] || '').filter(Boolean); } catch { return []; } })();
  const freqs = (() => { try { return db.prepare(`SELECT CodeID FROM DataSensorFrequencySearchAndTrack WHERE ID=?`).all(row.ID).map(f => snFreqs[f.CodeID] || '').filter(Boolean); } catch { return []; } })();

  snIndex.push({
    id: +ourId, name: snNames[ourId], dbName: row.Name, comments: row.Comments || '',
    role: snRoles[row.Role] || '', type: snTypes[row.Type] || '', generation: snGens[row.Generation] || '',
    rangeMax: +(row.RangeMax * NMI).toFixed(1), rangeMin: +(row.RangeMin * NMI).toFixed(1),
    altitudeMax: row.AltitudeMax, altitudeMin: row.AltitudeMin,
    description: row.Comments && row.Comments !== '-' ? `${snNames[ourId]} [${row.Comments}]` : snNames[ourId]
  });

  snDetails[ourId] = {
    scanInterval: row.ScanInterval, maxContactsAir: row.MaxContactsAir,
    maxContactsSurface: row.MaxContactsSurface, maxContactsSub: row.MaxContactsSubmarine,
    resolutionRange: row.ResolutionRange, resolutionHeight: row.ResolutionHeight, resolutionAngle: row.ResolutionAngle,
    directionFindingAccuracy: row.DirectionFindingAccuracy,
    radarHBeamwidth: row.RadarHorizontalBeamwidth, radarVBeamwidth: row.RadarVerticalBeamwidth,
    radarPeakPower: row.RadarPeakPower, radarPulseWidth: row.RadarPulseWidth,
    radarPRF: row.RadarPRF, radarNoiseLevel: row.RadarSystemNoiseLevel,
    radarProcessingGL: row.RadarProcessingGainLoss, radarBlindTime: row.RadarBlindTime,
    esmSensitivity: row.ESMSensitivity, esmChannels: row.ESMNumberOfChannels,
    ecmGain: row.ECMGain, ecmPeakPower: row.ECMPeakPower, ecmTargets: row.ECMNumberOfTargets,
    sonarSourceLevel: row.SonarSourceLevel, sonarDirectivity: row.SonarDirectivityIndex,
    capabilities: caps, frequencies: freqs
  };
}

// ========== FACILITIES EXTRACTION ==========
const facSearch = {
  1:'Patriot%PAC-3', 2:'THAAD', 3:'NASAMS', 4:'Aegis Ashore', 5:'HIMARS',
  6:'M109', 7:'M1A2%Abrams', 8:'Avenger', 9:'NMESIS', 10:'GBI',
  11:'HAWK', 12:'M-SHORAD'
};
const facNames = {
  1:'Patriot Battery (PAC-3 MSE)', 2:'THAAD Battery', 3:'NASAMS Battery (3rd Gen)',
  4:'Aegis Ashore Site', 5:'HIMARS Battery', 6:'M109A7 Paladin PIM Battery',
  7:'M1A2 SEPv3 Abrams Platoon', 8:'AN/TWQ-1 Avenger Battery', 9:'NMESIS Launcher',
  10:'Ground-Based Interceptor (GBI) Silo', 11:'MIM-23 HAWK Battery (Upgraded)',
  12:'Stryker M-SHORAD Platoon'
};

console.log('\n=== Extracting Facilities ===');
const facIndex = [], facDetails = {};
for (const [ourId, term] of Object.entries(facSearch)) {
  const row = resolveFac(term);
  if (!row) { console.log(`  MISS: ${term} (ID ${ourId})`); continue; }
  console.log(`  ${ourId}: ${facNames[ourId]} -> CMO #${row.ID} "${row.Name}" [${row.Comments || ''}]`);

  const sensors = getShipSensors('DataFacilitySensors', row.ID);
  const mounts = getMountsWeapons('DataFacilityMounts', row.ID);
  const sigs = getSignatures('DataFacilitySignatures', row.ID);

  const uniqueSensors = [...new Map(sensors.map(s => [s.name, s])).values()];
  const wpnSet = new Set();
  for (const m of mounts) for (const w of m.weapons) wpnSet.add(w.name);

  facIndex.push({
    id: +ourId, name: facNames[ourId], dbName: row.Name, comments: row.Comments || '',
    type: facCats[row.Category] || '', operator: services[row.OperatorService] || '',
    commissioned: row.YearCommissioned, crew: row.Crew || 0,
    length: row.Length, width: row.Width, damagePoints: row.DamagePoints,
    sensorCount: uniqueSensors.length, weaponCount: wpnSet.size,
    description: row.Comments && row.Comments !== '-' ? `${facNames[ourId]} [${row.Comments}]` : facNames[ourId]
  });

  facDetails[ourId] = {
    area: row.Area, mastHeight: row.MastHeight, armorGeneral: row.ArmorGeneral,
    sensors: uniqueSensors, mounts, signatures: sigs
  };
}

// ========== Write output ==========
const outDir = path.join(__dirname, 'data');
const detDir = path.join(outDir, 'details');
fs.mkdirSync(detDir, { recursive: true });

const write = (file, data) => {
  fs.writeFileSync(path.join(outDir, file), JSON.stringify(data, null, 2));
  console.log(`Wrote ${file} (${(JSON.stringify(data).length / 1024).toFixed(1)} KB)`);
};

write('aircraft.json', acIndex);
write('ships.json', shipIndex);
write('weapons.json', wpnIndex);
write('sensors.json', snIndex);
write('facilities.json', facIndex);
write('details/aircraft.json', acDetails);
write('details/ships.json', shipDetails);
write('details/weapons.json', wpnDetails);
write('details/sensors.json', snDetails);
write('details/facilities.json', facDetails);

console.log('\nDone!');
db.close();
