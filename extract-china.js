// extract-china.js — Extract ALL China (PLA) units from CMO database
const Database = require('./node_modules/better-sqlite3');
const fs = require('fs');
const path = require('path');

const DB_PATH = 'F:/SteamLibrary/steamapps/common/Command - Modern Operations/DB/DB3K_464.db3';
const db = new Database(DB_PATH, { readonly: true });
const NMI = 1.852;
const CN = 2018; // China's OperatorCountry ID

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
    name: rows[0].Name, engines: rows[0].NumberOfEngines,
    thrustMil: rows[0].ThrustPerEngineMilitary, thrustAB: rows[0].ThrustPerEngineAfterburner,
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

function getMagazineWeapons(id, table) {
  const magTable = table || 'DataShipMagazines';
  const mags = db.prepare(`
    SELECT DataMagazine.ID as mid, DataMagazine.Name, DataMagazine.Capacity
    FROM ${magTable} INNER JOIN DataMagazine ON ComponentID=DataMagazine.ID WHERE ${magTable}.ID=?
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
    SELECT DataPropulsion.Name, DataPropulsion.NumberOfEngines FROM ${table}
    INNER JOIN DataPropulsion ON ComponentID=DataPropulsion.ID WHERE ${table}.ID=?
  `).all(id);
  if (!rows.length) return { name: '', engines: 0 };
  const compRow = db.prepare(`SELECT ComponentID FROM ${table} WHERE ID=? LIMIT 1`).get(id);
  const perfs = compRow ? db.prepare(`SELECT * FROM DataPropulsionPerformance WHERE ID=?`).all(compRow.ComponentID) : [];
  return { name: rows[0].Name, engines: rows[0].NumberOfEngines, performances: perfs.map(p => ({ altBand: p.AltitudeBand, throttle: p.Throttle, speed: p.Speed })) };
}

function getWeaponWarhead(wpnId) {
  const rec = db.prepare(`SELECT ComponentID FROM DataWeaponRecord WHERE ID=?`).get(wpnId);
  if (!rec) return null;
  const wh = db.prepare(`SELECT * FROM DataWarhead WHERE ID=?`).get(rec.ComponentID);
  if (!wh) return null;
  return { name: wh.Name, type: whTypes[wh.Type] || '', weight: wh.Weight, caliber: wh.Caliber };
}

function cleanName(dbName) {
  return dbName.replace(/\s*\[.*?\]\s*$/, '').trim();
}

// ========== AUTO-DISCOVER AIRCRAFT ==========
console.log('=== Auto-discovering Aircraft ===');
const allAC = db.prepare(`
  SELECT * FROM DataAircraft WHERE OperatorCountry=? AND Hypothetical=0 ORDER BY YearCommissioned DESC
`).all(CN);

const acGroups = {};
for (const r of allAC) {
  const key = r.Name;
  if (!acGroups[key]) acGroups[key] = r;
}

const acIndex = [], acDetails = {};
let acId = 0;
const sortedAC = Object.entries(acGroups).sort((a, b) => a[0].localeCompare(b[0]));
for (const [desig, row] of sortedAC) {
  acId++;
  const displayName = cleanName(row.Name);
  console.log(`  ${acId}: ${displayName} (CMO #${row.ID}, ${row.YearCommissioned || '?'})`);

  const sensors = getACSensors(row.ID);
  const loadouts = getACLoadouts(row.ID);
  const prop = getACPropulsion(row.ID);
  const sigs = getSignatures('DataAircraftSignatures', row.ID);
  const codes = getCodes('DataAircraftCodes', 'EnumAircraftCode', row.ID);

  const uniqueSensors = [...new Map(sensors.map(s => [s.name, s])).values()];
  const wpnSet = new Set();
  for (const l of loadouts) for (const w of l.weapons) wpnSet.add(w.name);

  acIndex.push({
    id: acId, name: displayName, dbName: row.Name, comments: row.Comments || '',
    type: acTypes[row.Type] || '', operator: services[row.OperatorService] || '',
    commissioned: row.YearCommissioned, crew: row.Crew,
    maxSpeed: row.MaxSpeed, maxWeight: row.MaxWeight, emptyWeight: row.EmptyWeight,
    length: row.Length, span: row.Span, height: row.Height,
    propulsion: prop.name,
    sensorCount: uniqueSensors.length, weaponCount: wpnSet.size,
    description: row.Comments && row.Comments !== '-' ? `${displayName} [${row.Comments}]` : displayName
  });

  acDetails[acId] = {
    fuelCapacity: row.FuelCapacity, climbRate: row.ClimbRate,
    serviceAltitude: row.ServiceAltitude, minRunwayLength: row.MinRunwayLength,
    sensors: uniqueSensors, loadouts, propulsion: prop, signatures: sigs, codes
  };
}
console.log(`  Total aircraft: ${acId}`);

// ========== AUTO-DISCOVER SHIPS + SUBS ==========
console.log('\n=== Auto-discovering Ships & Submarines ===');
const allShips = db.prepare(`
  SELECT * FROM DataShip WHERE OperatorCountry=? AND Hypothetical=0 ORDER BY YearCommissioned DESC
`).all(CN);
const allSubs = db.prepare(`
  SELECT * FROM DataSubmarine WHERE OperatorCountry=? AND Hypothetical=0 ORDER BY YearCommissioned DESC
`).all(CN);

const shipGroups = {};
for (const r of allShips) {
  const key = r.Name;
  if (!shipGroups[key]) shipGroups[key] = { ...r, isSub: false };
}
for (const r of allSubs) {
  const key = r.Name;
  if (!shipGroups[key]) shipGroups[key] = { ...r, isSub: true };
}

const shipIndex = [], shipDetails = {};
let shipId = 0;
const sortedShips = Object.entries(shipGroups).sort((a, b) => a[0].localeCompare(b[0]));
for (const [name, row] of sortedShips) {
  shipId++;
  const displayName = cleanName(row.Name);
  console.log(`  ${shipId}: ${displayName} (CMO #${row.ID}, ${row.YearCommissioned || '?'})`);

  const isSub = row.isSub;
  const sensTable = isSub ? 'DataSubmarineSensors' : 'DataShipSensors';
  const mountTable = isSub ? 'DataSubmarineMounts' : 'DataShipMounts';
  const magTable = isSub ? 'DataSubmarineMagazines' : 'DataShipMagazines';
  const propTable = isSub ? 'DataSubmarinePropulsion' : 'DataShipPropulsion';
  const sigTable = isSub ? 'DataSubmarineSignatures' : 'DataShipSignatures';
  const codeTable = isSub ? 'DataSubmarineCodes' : 'DataShipCodes';
  const codeEnum = isSub ? 'EnumSubmarineCode' : 'EnumShipCode';

  const sensors = getShipSensors(sensTable, row.ID);
  const mounts = getMountsWeapons(mountTable, row.ID);
  const magazines = getMagazineWeapons(row.ID, magTable);
  const propulsion = getShipPropulsion(propTable, row.ID);
  const sigs = getSignatures(sigTable, row.ID);
  const codes = getCodes(codeTable, codeEnum, row.ID);

  const uniqueSensors = [...new Map(sensors.map(s => [s.name, s])).values()];
  const wpnSet = new Set();
  for (const m of mounts) for (const w of m.weapons) wpnSet.add(w.name);
  for (const m of magazines) for (const w of m.weapons) wpnSet.add(w.name);

  shipIndex.push({
    id: shipId, name: displayName, dbName: row.Name, comments: row.Comments || '',
    type: isSub ? (subTypes[row.Type] || '') : (shipTypes[row.Type] || ''),
    operator: services[row.OperatorService] || '',
    commissioned: row.YearCommissioned, crew: row.Crew,
    maxSpeed: row.MaxSpeed,
    displacementFull: isSub ? (row.DisplacementSubmerged || row.DisplacementSurfaced) : (row.DisplacementFull || row.DisplacementStandard),
    length: row.Length, beam: row.Beam, draft: row.Draft,
    maxDepth: isSub ? row.MaxDepth : null,
    sensorCount: uniqueSensors.length, weaponCount: wpnSet.size,
    description: row.Comments && row.Comments !== '-' ? `${displayName} [${row.Comments}]` : displayName
  });

  shipDetails[shipId] = {
    damagePoints: row.DamagePoints, displacementEmpty: row.DisplacementEmpty || 0,
    displacementStandard: row.DisplacementStandard || 0, height: row.Height || 0,
    maxDepth: isSub ? row.MaxDepth : null,
    sensors: uniqueSensors, mounts, magazines, propulsion, signatures: sigs, codes
  };
}
console.log(`  Total ships+subs: ${shipId}`);

// ========== AUTO-DISCOVER FACILITIES ==========
console.log('\n=== Auto-discovering Facilities ===');
const allFacs = db.prepare('SELECT * FROM DataFacility WHERE OperatorCountry=? AND Hypothetical=0 ORDER BY YearCommissioned DESC').all(CN);

const facGroups = {};
for (const r of allFacs) {
  const key = r.Name.replace(/\s*\[.*?\]\s*$/, '').trim();
  if (!facGroups[key]) facGroups[key] = r;
}

const facIndex = [], facDetails = {};
let facId = 0;
const sortedFac = Object.entries(facGroups).sort((a, b) => a[0].localeCompare(b[0]));

// Category buckets for split tabs
const infantry = [], armor = [], artillery = [], airdefense = [], radar = [], facilities = [];

for (const [typeName, row] of sortedFac) {
  facId++;
  const displayName = cleanName(row.Name);
  console.log(`  ${facId}: ${displayName} (CMO #${row.ID}, ${row.YearCommissioned || '?'})`);

  const sensors = getShipSensors('DataFacilitySensors', row.ID);
  const mounts = getMountsWeapons('DataFacilityMounts', row.ID);
  const sigs = getSignatures('DataFacilitySignatures', row.ID);

  const uniqueSensors = [...new Map(sensors.map(s => [s.name, s])).values()];
  const wpnSet = new Set();
  for (const m of mounts) for (const w of m.weapons) wpnSet.add(w.name);

  const entry = {
    id: facId, name: displayName, dbName: row.Name, comments: row.Comments || '',
    type: facCats[row.Category] || '', operator: services[row.OperatorService] || '',
    commissioned: row.YearCommissioned, crew: row.Crew || 0,
    length: row.Length, width: row.Width, damagePoints: row.DamagePoints,
    sensorCount: uniqueSensors.length, weaponCount: wpnSet.size,
    description: row.Comments && row.Comments !== '-' ? `${displayName} [${row.Comments}]` : displayName
  };

  facIndex.push(entry);
  facDetails[facId] = {
    area: row.Area, mastHeight: row.MastHeight, armorGeneral: row.ArmorGeneral,
    sensors: uniqueSensors, mounts, signatures: sigs
  };

  // Categorize into split tabs
  const catDesc = facCats[row.Category] || '';
  const nm = displayName;

  if (catDesc === 'Mobile Personnel') {
    infantry.push(entry);
  } else if (catDesc === 'Mobile Vehicle(s)') {
    if (nm.startsWith('Armored') || nm.startsWith('Mech Inf')) {
      armor.push(entry);
    } else if (nm.startsWith('Arty') || nm.startsWith('SSM') || nm.startsWith('Support')) {
      artillery.push(entry);
    } else if (nm.startsWith('SAM') || nm.startsWith('AAA')) {
      airdefense.push(entry);
    } else if (nm.startsWith('Radar') || nm.startsWith('Vehicle') || nm.startsWith('Sensor')) {
      radar.push(entry);
    } else {
      // Fallback to facilities
      facilities.push(entry);
    }
  } else {
    facilities.push(entry);
  }
}
console.log(`  Total facilities: ${facId}`);
console.log(`  Infantry: ${infantry.length}, Armor: ${armor.length}, Artillery: ${artillery.length}, Air Defense: ${airdefense.length}, Radar: ${radar.length}, Facilities: ${facilities.length}`);

// ========== AUTO-DISCOVER WEAPONS ==========
console.log('\n=== Auto-discovering Weapons ===');
const cnWpnDbIds = new Set();
for (const r of allAC) {
  const lids = db.prepare('SELECT ComponentID FROM DataAircraftLoadouts WHERE ID=?').all(r.ID).map(x => x.ComponentID);
  for (const lid of lids) db.prepare('SELECT ComponentID FROM DataLoadoutWeapons WHERE ID=?').all(lid).forEach(x => cnWpnDbIds.add(x.ComponentID));
}
for (const r of allShips) {
  db.prepare('SELECT ComponentID FROM DataShipMounts WHERE ID=?').all(r.ID).map(x => x.ComponentID)
    .forEach(mid => db.prepare('SELECT ComponentID FROM DataMountWeapons WHERE ID=?').all(mid).forEach(x => cnWpnDbIds.add(x.ComponentID)));
  db.prepare('SELECT ComponentID FROM DataShipMagazines WHERE ID=?').all(r.ID).map(x => x.ComponentID)
    .forEach(mid => db.prepare('SELECT ComponentID FROM DataMagazineWeapons WHERE ID=?').all(mid).forEach(x => cnWpnDbIds.add(x.ComponentID)));
}
for (const r of allSubs) {
  db.prepare('SELECT ComponentID FROM DataSubmarineMounts WHERE ID=?').all(r.ID).map(x => x.ComponentID)
    .forEach(mid => db.prepare('SELECT ComponentID FROM DataMountWeapons WHERE ID=?').all(mid).forEach(x => cnWpnDbIds.add(x.ComponentID)));
}
for (const r of allFacs) {
  db.prepare('SELECT ComponentID FROM DataFacilityMounts WHERE ID=?').all(r.ID).map(x => x.ComponentID)
    .forEach(mid => db.prepare('SELECT ComponentID FROM DataMountWeapons WHERE ID=?').all(mid).forEach(x => cnWpnDbIds.add(x.ComponentID)));
}

// For China: collect all weapons used by CN platforms, group by name (no prefix filter)
const cnWpns = {};
for (const wid of cnWpnDbIds) {
  const w = db.prepare('SELECT * FROM DataWeapon WHERE ID=?').get(wid);
  if (!w) continue;
  const key = w.Name;
  if (!cnWpns[key]) cnWpns[key] = w;
}

const wpnIndex = [], wpnDetails = {};
let wpnId = 0;
const sortedWpn = Object.entries(cnWpns).sort((a, b) => a[0].localeCompare(b[0]));
for (const [name, row] of sortedWpn) {
  wpnId++;
  const displayName = cleanName(row.Name);
  console.log(`  ${wpnId}: ${displayName} (CMO #${row.ID})`);

  const bestRange = Math.max(row.AirRangeMax || 0, row.SurfaceRangeMax || 0, row.LandRangeMax || 0, row.SubsurfaceRangeMax || 0);
  const warhead = getWeaponWarhead(row.ID);

  wpnIndex.push({
    id: wpnId, name: displayName, dbName: row.Name, comments: row.Comments || '',
    type: wpnTypes[row.Type] || '', weight: row.Weight, length: row.Length, span: row.Span, diameter: row.Diameter,
    maxRange: +(bestRange * NMI).toFixed(1),
    airRange: row.AirRangeMax ? +(row.AirRangeMax * NMI).toFixed(1) : null,
    surfaceRange: row.SurfaceRangeMax ? +(row.SurfaceRangeMax * NMI).toFixed(1) : null,
    landRange: row.LandRangeMax ? +(row.LandRangeMax * NMI).toFixed(1) : null,
    subRange: row.SubsurfaceRangeMax ? +(row.SubsurfaceRangeMax * NMI).toFixed(1) : null,
    description: row.Comments && row.Comments !== '-' ? `${displayName} [${row.Comments}]` : displayName
  });

  wpnDetails[wpnId] = {
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
console.log(`  Total weapons: ${wpnId}`);

// ========== AUTO-DISCOVER SENSORS ==========
console.log('\n=== Auto-discovering Sensors ===');
const cnSnDbIds = new Set();
for (const r of allAC) {
  db.prepare('SELECT ComponentID FROM DataAircraftSensors WHERE ID=?').all(r.ID).forEach(x => cnSnDbIds.add(x.ComponentID));
}
for (const r of allShips) {
  db.prepare('SELECT ComponentID FROM DataShipSensors WHERE ID=?').all(r.ID).forEach(x => cnSnDbIds.add(x.ComponentID));
}
for (const r of allSubs) {
  db.prepare('SELECT ComponentID FROM DataSubmarineSensors WHERE ID=?').all(r.ID).forEach(x => cnSnDbIds.add(x.ComponentID));
}
for (const r of allFacs) {
  db.prepare('SELECT ComponentID FROM DataFacilitySensors WHERE ID=?').all(r.ID).forEach(x => cnSnDbIds.add(x.ComponentID));
}

const cnSensors = {};
for (const sid of cnSnDbIds) {
  const s = db.prepare('SELECT * FROM DataSensor WHERE ID=?').get(sid);
  if (!s) continue;
  const key = s.Name;
  if (!cnSensors[key]) cnSensors[key] = s;
}

const snIndex = [], snDetails = {};
let snId = 0;
const sortedSn = Object.entries(cnSensors).sort((a, b) => a[0].localeCompare(b[0]));
for (const [name, row] of sortedSn) {
  snId++;
  const displayName = cleanName(row.Name);
  console.log(`  ${snId}: ${displayName} (CMO #${row.ID})`);

  const caps = (() => { try { return db.prepare(`SELECT CodeID FROM DataSensorCapabilities WHERE ID=?`).all(row.ID).map(c => snCaps[c.CodeID] || '').filter(Boolean); } catch { return []; } })();
  const freqs = (() => { try { return db.prepare(`SELECT CodeID FROM DataSensorFrequencySearchAndTrack WHERE ID=?`).all(row.ID).map(f => snFreqs[f.CodeID] || '').filter(Boolean); } catch { return []; } })();

  snIndex.push({
    id: snId, name: displayName, dbName: row.Name, comments: row.Comments || '',
    role: snRoles[row.Role] || '', type: snTypes[row.Type] || '', generation: snGens[row.Generation] || '',
    rangeMax: +(row.RangeMax * NMI).toFixed(1), rangeMin: +(row.RangeMin * NMI).toFixed(1),
    altitudeMax: row.AltitudeMax, altitudeMin: row.AltitudeMin,
    description: row.Comments && row.Comments !== '-' ? `${displayName} [${row.Comments}]` : displayName
  });

  snDetails[snId] = {
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
console.log(`  Total sensors: ${snId}`);

// ========== Write output ==========
const outDir = path.join(__dirname, 'data', 'cn');
const detDir = path.join(outDir, 'details');
fs.mkdirSync(detDir, { recursive: true });

const write = (file, data) => {
  const json = JSON.stringify(data, null, 2);
  fs.writeFileSync(path.join(outDir, file), json);
  console.log(`Wrote ${file} (${(json.length / 1024).toFixed(1)} KB)`);
};

write('aircraft.json', acIndex);
write('ships.json', shipIndex);
write('weapons.json', wpnIndex);
write('sensors.json', snIndex);
write('facilities.json', facIndex);
write('infantry.json', infantry);
write('armor.json', armor);
write('artillery.json', artillery);
write('airdefense.json', airdefense);
write('radar.json', radar);
write('details/aircraft.json', acDetails);
write('details/ships.json', shipDetails);
write('details/weapons.json', wpnDetails);
write('details/sensors.json', snDetails);
write('details/facilities.json', facDetails);

// Write detail files for split facility tabs (reference facDetails by id)
write('details/infantry.json', Object.fromEntries(infantry.map(e => [e.id, facDetails[e.id]])));
write('details/armor.json', Object.fromEntries(armor.map(e => [e.id, facDetails[e.id]])));
write('details/artillery.json', Object.fromEntries(artillery.map(e => [e.id, facDetails[e.id]])));
write('details/airdefense.json', Object.fromEntries(airdefense.map(e => [e.id, facDetails[e.id]])));
write('details/radar.json', Object.fromEntries(radar.map(e => [e.id, facDetails[e.id]])));

console.log(`\n=== SUMMARY ===`);
console.log(`Aircraft: ${acId}`);
console.log(`Ships+Subs: ${shipId}`);
console.log(`Weapons: ${wpnId}`);
console.log(`Sensors: ${snId}`);
console.log(`Facilities: ${facId} (Infantry:${infantry.length} Armor:${armor.length} Arty:${artillery.length} AD:${airdefense.length} Radar:${radar.length} Other:${facilities.length})`);
console.log(`Total: ${acId + shipId + wpnId + snId + facId}`);
console.log('\nDone! Output: data/cn/');
db.close();
