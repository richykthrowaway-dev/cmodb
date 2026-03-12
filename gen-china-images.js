// gen-china-images.js — Auto-generate Wikipedia image mappings for China units
// Uses pattern matching to derive article titles from unit names.
// The app's lazy IntersectionObserver handles actual URL fetching on demand.
const fs = require('fs');
const path = require('path');

const dataDir = path.join(__dirname, 'data', 'cn');

const aircraft  = JSON.parse(fs.readFileSync(path.join(dataDir, 'aircraft.json'), 'utf8'));
const ships     = JSON.parse(fs.readFileSync(path.join(dataDir, 'ships.json'), 'utf8'));
const weapons   = JSON.parse(fs.readFileSync(path.join(dataDir, 'weapons.json'), 'utf8'));
const sensors   = JSON.parse(fs.readFileSync(path.join(dataDir, 'sensors.json'), 'utf8'));
const infantry  = JSON.parse(fs.readFileSync(path.join(dataDir, 'infantry.json'), 'utf8'));
const armor     = JSON.parse(fs.readFileSync(path.join(dataDir, 'armor.json'), 'utf8'));
const artillery = JSON.parse(fs.readFileSync(path.join(dataDir, 'artillery.json'), 'utf8'));
const airdefense= JSON.parse(fs.readFileSync(path.join(dataDir, 'airdefense.json'), 'utf8'));
const radar     = JSON.parse(fs.readFileSync(path.join(dataDir, 'radar.json'), 'utf8'));

// ─── Aircraft: designation → Wikipedia article ───────────────────────────────
// Extract leading designation (e.g. "J-20", "Su-30", "H-6") then look up table
const AC_MAP = {
  'A-50':     'Ilyushin_Il-76',           // AWACS based on Il-76 airframe
  'An-24':    'Antonov_An-24',
  'An-26':    'Antonov_An-26',
  'AS.565':   'Eurocopter_AS565_Panther',
  'BZK-005':  'CASC_Rainbow',
  'Camcopter':'Schiebel_Camcopter_S-100',
  'CH-4':     'CASC_Rainbow',
  'CSA-003':  'Yilong_(drone)',
  'CSA-004':  'Yilong_(drone)',
  'EA-03':    'Soar_Dragon',
  'H-5':      'Harbin_H-5',
  'H-6':      'Xian_H-6',
  'HD-5':     'Harbin_H-5',
  'HY-6':     'Xian_H-6',
  'HZ-5':     'Harbin_H-5',
  'HZ-6':     'Xian_H-6',
  'Il-76':    'Ilyushin_Il-76',
  'Il-78':    'Ilyushin_Il-78',
  'J-10':     'Chengdu_J-10',
  'J-11':     'Shenyang_J-11',
  'J-15':     'Shenyang_J-15',
  'J-16':     'Shenyang_J-16',
  'J-20':     'Chengdu_J-20',
  'J-31':     'Shenyang_FC-31',
  'J-5':      'Shenyang_J-5',
  'J-6':      'Shenyang_J-6',
  'J-7':      'Chengdu_J-7',
  'J-8':      'Shenyang_J-8',
  'JH-7':     'Xian_JH-7',
  'JL-8':     'Hongdu_JL-8',
  'JZ-8':     'Shenyang_J-8',
  'Ka-28':    'Kamov_Ka-27',
  'Ka-31':    'Kamov_Ka-31',
  'Mi-17':    'Mil_Mi-17',
  'Mi-171':   'Mil_Mi-17',
  'Mi-8':     'Mil_Mi-8',
  'Q-5':      'Nanchang_Q-5',
  'S-70':     'Sikorsky_UH-60_Black_Hawk',
  'SA.321':   'Aérospatiale_SA_321_Super_Frelon',
  'SH-5':     'Harbin_SH-5',
  'Su-30':    'Sukhoi_Su-30MKK',
  'Su-35':    'Sukhoi_Su-35',
  'Tu-154':   'Tupolev_Tu-154',
  'WD-1':     'CASC_Rainbow',
  'Y-12':     'Harbin_Y-12',
  'Y-20':     'Xian_Y-20',
  'Y-7':      'Xian_Y-7',
  'Y-8':      'Shaanxi_Y-8',
  'Y-9':      'Shaanxi_Y-9',
  'Z-10':     'CAIC_Z-10',
  'Z-18':     'Changhe_Z-18',
  'Z-19':     'Harbin_Z-19',
  'Z-8':      'Changhe_Z-8',
  'Z-9':      'Harbin_Z-9',
};

function getAcWiki(name) {
  // Try longest prefix first (e.g. "Su-30MKK" before "Su-30")
  const keys = Object.keys(AC_MAP).sort((a,b) => b.length - a.length);
  for (const k of keys) {
    if (name.startsWith(k)) return AC_MAP[k];
  }
  return 'People\'s_Liberation_Army_Air_Force';
}

// ─── Ships: type number → Wikipedia article ──────────────────────────────────
const SHIP_MAP = {
  'Bohai':          'People\'s_Liberation_Army_Navy',
  'DDG 136':        'Type_051B_destroyer',
  'DDG 138':        'Type_051B_destroyer',
  'S 351':          'Romeo-class_submarine',
  'S 364':          'Ming-class_submarine',
  'S 366':          'Ming-class_submarine',
  'S 368':          'Ming-class_submarine',
  'Type 001':       'Chinese_aircraft_carrier_Liaoning',
  'Type 021':       'Huangfeng-class_missile_boat',
  'Type 022':       'Type_022_missile_boat',
  'Type 024':       'Hoku-class_missile_boat',
  'Type 033':       'Romeo-class_submarine',
  'Type 035':       'Ming-class_submarine',
  'Type 037':       'Hainan-class_submarine_chaser',
  'Type 039':       'Type_039_submarine',
  'Type 041':       'Type_041_submarine',
  'Type 051 ':      'Type_051_destroyer',
  'Type 051B':      'Type_051B_destroyer',
  'Type 051C':      'Type_051C_destroyer',
  'Type 051G':      'Type_051_destroyer',
  'Type 052 ':      'Type_052_destroyer',
  'Type 052B':      'Type_052B_destroyer',
  'Type 052C':      'Type_052C_destroyer',
  'Type 052D':      'Type_052D_destroyer',
  'Type 053H ':     'Type_053_frigate',
  'Type 053H1':     'Type_053_frigate',
  'Type 053H2':     'Type_053_frigate',
  'Type 053H3':     'Type_053_frigate',
  'Type 053HT':     'Type_053_frigate',
  'Type 053K':      'Type_053_frigate',
  'Type 054 ':      'Type_054_frigate',
  'Type 054A':      'Type_054A_frigate',
  'Type 055':       'Type_055_destroyer',
  'Type 056':       'Type_056_corvette',
  'Type 062':       'Shanghai-class_gunboat',
  'Type 067':       'Type_067_landing_craft',
  'Type 068':       'Type_068_landing_craft',
  'Type 071':       'Type_071_amphibious_transport_dock',
  'Type 072':       'Type_072_tank_landing_ship',
  'Type 073':       'Type_073_landing_ship',
  'Type 074':       'Type_074_landing_craft',
  'Type 079':       'Type_079_landing_ship',
  'Type 081':       'Type_081_minesweeper',
  'Type 082':       'Type_082_minesweeper',
  'Type 091':       'Type_091_submarine',
  'Type 092':       'Type_092_submarine',
  'Type 093':       'Type_093_submarine',
  'Type 094':       'Type_094_submarine',
  'Type 271':       'Type_072_tank_landing_ship',
  'Type 312':       'Remotely_operated_underwater_vehicle',
  'Type 65':        'Type_051_destroyer',
  'Type 660':       'Type_051_destroyer',
  'Type 724':       'Landing_craft',
  'Type 726':       'Type_726_air-cushion_landing_craft',
  'Type 795':       'People\'s_Liberation_Army_Navy',
  'Type 814':       'Intelligence_ship',
  'Type 815':       'Chinese_spy_ship',
  'Type 818':       'People\'s_Liberation_Army_Navy',
  'Type 901':       'Type_901_replenishment_ship',
  'Type 903':       'Type_903_replenishment_ship',
  'Type 904':       'Type_904_replenishment_ship',
  'Type 905':       'People\'s_Liberation_Army_Navy',
  'Type 908':       'People\'s_Liberation_Army_Navy',
  'Type 918':       'Hospital_ship',
  'Type 920':       'Chinese_hospital_ship_Peace_Ark',
  'Type 922':       'Submarine_rescue_ship',
  'Type 925':       'Submarine_rescue_ship',
  'Yuan Wang':      'Yuanwang-class_space_tracking_ship',
};

function getShipWiki(name) {
  const keys = Object.keys(SHIP_MAP).sort((a,b) => b.length - a.length);
  for (const k of keys) {
    if (name.startsWith(k)) return SHIP_MAP[k];
  }
  return 'People\'s_Liberation_Army_Navy';
}

// ─── Ground / facility units ─────────────────────────────────────────────────
// Infantry
const INF_MAP = {
  'Inf Plt (Chinese Army)':          'People\'s_Liberation_Army_Ground_Force',
  'Inf Plt (Chinese Naval Infantry)':'People\'s_Liberation_Army_Marine_Corps',
  'Inf Plt (Marines)':               'People\'s_Liberation_Army_Marine_Corps',
  'Inf Plt (Paratroopers)':          'People\'s_Liberation_Army_Airborne_Corps',
  'SAM Plt (HN-5':                   'HN-5',
  'SAM Plt (HN-5B':                  'HN-5',
  'SAM Sec (FN-6':                   'FN-6_(missile)',
  'SAM Sec (QW-1':                   'Qianwei-1',
  'SSM Plt (HJ-8':                   'HJ-8',
};

function getInfWiki(name) {
  for (const k of Object.keys(INF_MAP)) {
    if (name.startsWith(k)) return INF_MAP[k];
  }
  return 'People\'s_Liberation_Army_Ground_Force';
}

// Armor
const ARMOR_MAP = {
  'Armored Plt (Type 59':   'Type_59_tank',
  'Armored Plt (Type 63A':  'Type_63_amphibious_tank',
  'Armored Plt (Type 69':   'Type_69_tank',
  'Armored Plt (Type 79':   'Type_79_tank',
  'Armored Plt (Type 85':   'Type_85_tank',
  'Armored Plt (Type 88':   'Type_88_tank',
  'Armored Plt (Type 96':   'Type_96_tank',
  'Armored Plt (Type 99':   'Type_99_tank',
  'Armored Plt (ZTD-05':    'ZTD-05',
  'Armored Plt (ZTL-09':    'ZTL-09',
  'Armored Plt (ZTQ':       'Type_15_light_tank',
  'Mech Inf Plt (Type 63':  'Type_63_armoured_personnel_carrier',
  'Mech Inf Plt (Type 85':  'Type_85_APC',
  'Mech Inf Plt (Type 86':  'Type_86_infantry_fighting_vehicle',
  'Mech Inf Plt (Type 90':  'Type_90_APC',
  'Mech Inf Plt (ZBD-04':   'ZBD-04',
  'Mech Inf Plt (ZBD-05':   'ZBD-05',
  'Mech Inf Plt (ZBD-08':   'ZBD-08',
  'Mech Inf Plt (ZBL-09':   'ZBL-09',
};

function getArmorWiki(name) {
  const keys = Object.keys(ARMOR_MAP).sort((a,b) => b.length - a.length);
  for (const k of keys) {
    if (name.startsWith(k)) return ARMOR_MAP[k];
  }
  return 'People\'s_Liberation_Army_Ground_Force';
}

// Artillery & SSM
const ARTY_MAP = {
  'Arty Bn/2 (SY-400':       'SY-400',
  'Arty Bty (122mm/38 PCL-09':'PCL-09',
  'Arty Bty (122mm/38 PLL-09':'PLL-09',
  'Arty Bty (122mm/38 PLZ-07':'PLZ-07',
  'Arty Bty (122mm/38 Type 86':'Type_86_towed_howitzer',
  'Arty Bty (122mm/38 Type 89':'PLZ-89',
  'Arty Bty (130mm/52':       'Type_59-1_field_gun',
  'Arty Bty (152mm/29 Type 66':'Type_66_howitzer',
  'Arty Bty (152mm/29 Type 83':'PLZ-83',
  'Arty Bty (155mm/39 AH4':   'NORINCO_AH4',
  'Arty Bty (155mm/52 PLZ-05':'PLZ-05',
  'Arty Bty (PHL-03':         'PHL-03',
  'Arty Bty (PHZ-89':         'PHZ-89',
  'Arty Bty (Type 81':        'Type_81_MLRS',
  'Arty Bty (Type 90':        'Type_90_MLRS',
  'SSM Bn (C-801':            'YJ-8',
  'SSM Bn (C-802':            'YJ-8',
  'SSM Bn (DF-11':            'Dongfeng-11',
  'SSM Bn (DF-12':            'Dongfeng-12',
  'SSM Bn (DF-15':            'Dongfeng-15',
  'SSM Bn (DF-16':            'Dongfeng-16',
  'SSM Bn (DF-21':            'Dongfeng-21',
  'SSM Bn (DF-25':            'Dongfeng-25',
  'SSM Bn (DF-26':            'Dongfeng-26',
  'SSM Bn (DF-3 ':            'Dongfeng-3',
  'SSM Bn (DF-31':            'Dongfeng-31',
  'SSM Bn (DF-3A':            'Dongfeng-3',
  'SSM Bn (DF-4 ':            'Dongfeng-4',
  'SSM Bn (DF-41':            'Dongfeng-41',
  'SSM Bn (YJ-62':            'YJ-62',
  'SSM Bty (CJ-10':           'CJ-10',
  'SSM Bty (Harpy':           'IAI_Harpy',
  'SSM Bty (HY-2':            'HY-2',
};

function getArtyWiki(name) {
  const keys = Object.keys(ARTY_MAP).sort((a,b) => b.length - a.length);
  for (const k of keys) {
    if (name.startsWith(k)) return ARTY_MAP[k];
  }
  return 'People\'s_Liberation_Army_Rocket_Force';
}

// Air defense
const AD_MAP = {
  'AAA Bty (23mm Type 80':   'Type_80_twin-23mm_anti-aircraft_gun',
  'AAA Bty (37mm Type 65':   'Type_65_37mm_anti-aircraft_gun',
  'AAA Plt (LD-2000':        'LD-2000',
  'AAA Sec (25mm Type 87':   'PGZ-87',
  'AAA Sec (35mm PGZ-07':    'PGZ-07',
  'AAA Sec (35mm/90 Type 90':'Type_90_twin_35mm_SPAAG',
  'AAA Sec (HQ-17':          'HQ-17',
  'SAM Bn (HQ-12':           'HQ-12',
  'SAM Bn (HQ-9':            'HQ-9',
  'SAM Bn (SA-10':           'S-300_(missile_system)',
  'SAM Bn (SA-20':           'S-300PMU',
  'SAM Bn (SA-21':           'S-400_(missile_system)',
  'SAM Bty (HQ-16':          'HQ-16',
  'SAM Bty (HQ-61':          'HQ-61',
  'SAM Bty (SC-19':          'SC-19_(missile)',
  'SAM Coy (DK-9':           'DK-9',
  'SAM Plt (HQ-17':          'HQ-17',
  'SAM Plt (HQ-64':          'HQ-64',
  'SAM Plt (HQ-7':           'HQ-7',
  'SAM Plt (PGZ04':          'PGZ-04',
  'SAM Plt (SA-15':          'Tor_missile_system',
};

function getADWiki(name) {
  const keys = Object.keys(AD_MAP).sort((a,b) => b.length - a.length);
  for (const k of keys) {
    if (name.startsWith(k)) return AD_MAP[k];
  }
  return 'People\'s_Liberation_Army_Ground_Force';
}

// Radar
const RADAR_MAP = {
  'Radar (Big Bird':        'S-300_(missile_system)',
  'Radar (China CLC-2':     'PLA_radar_systems',
  'Radar (China HQ-64':     'HQ-64',
  'Radar (HQ-16A Search':   'HQ-16',
  'Radar (Tin Shield':      'Tin_Shield_radar',
  'Radar (Watchman':        'Watchman_radar',
  'Vehicle (Kolchuga':      'Kolchuga_passive_sensor_system',
  'Vehicle (YLC-20':        'Passive_radar',
  'Vehicle (YLC-29':        'Passive_radar',
};

function getRadarWiki(name) {
  const keys = Object.keys(RADAR_MAP).sort((a,b) => b.length - a.length);
  for (const k of keys) {
    if (name.startsWith(k)) return RADAR_MAP[k];
  }
  return 'Radar';
}

// Weapons — use unit name prefix patterns
const WPN_MAP = {
  'PL-':    'PL-5_(missile)',
  'YJ-':    'YJ-12',
  'C-801':  'YJ-8',
  'C-802':  'YJ-8',
  'C-803':  'YJ-8',
  'C-805':  'YJ-8',
  'CJ-10':  'CJ-10',
  'HJ-':    'HJ-8',
  'HN-':    'HN-5',
  'HQ-':    'HQ-9',
  'HY-':    'HY-2',
  'DF-':    'Dongfeng_(missile)',
  'FJ-':    'People\'s_Liberation_Army_Air_Force',
  'FT-':    'People\'s_Liberation_Army_Air_Force',
  'KD-':    'People\'s_Liberation_Army_Air_Force',
  'LD-':    'LD-2000',
  'RJ-':    'People\'s_Liberation_Army_Air_Force',
  'SD-10':  'PL-12_(missile)',
  'TY-90':  'TY-90',
  'WS-':    'People\'s_Liberation_Army_Air_Force',
  'YJ-12':  'YJ-12',
  'YJ-18':  'YJ-18',
  'YJ-62':  'YJ-62',
  'YJ-83':  'YJ-83',
  'YJ-91':  'YJ-91',
  '100mm':  'Naval_gun',
  '122mm':  'Artillery',
  '130mm':  'Artillery',
  '152mm':  'Artillery',
  '23mm':   'ZU-23-2',
  '30mm':   'Naval_gun',
  '37mm':   'Bofors_40_mm_L/60_gun',
  '57mm':   'AK-57_autocannon',
  '76mm':   'OTO_Melara_76_mm',
  'AK-':    'AK-47',
  'QW-':    'Qianwei-1',
  'FN-6':   'FN-6_(missile)',
  'Type 90B':'Type_90_MLRS',
  'Type 83':'PLZ-83',
  'DK-9':   'DK-9',
  'SC-19':  'SC-19_(missile)',
  'SY-400': 'SY-400',
  'PHL-03': 'PHL-03',
  'PLZ-05': 'PLZ-05',
};

function getWpnWiki(name) {
  const keys = Object.keys(WPN_MAP).sort((a,b) => b.length - a.length);
  for (const k of keys) {
    if (name.startsWith(k)) return WPN_MAP[k];
  }
  return null; // no mapping = no image
}

// Sensors — most will use generic articles
function getSnWiki(name) {
  if (name.startsWith('AN/')) return null; // US sensors in CN data — skip
  if (name.includes('Sonar') || name.includes('sonar')) return 'Sonar';
  if (name.includes('Radar') || name.includes('radar')) return 'Radar';
  if (name.includes('FLIR') || name.includes('IR ')) return 'Forward-looking_infrared';
  if (name.includes('ESM') || name.includes('EW ')) return 'Electronic_warfare';
  if (name.includes('ECM')) return 'Electronic_warfare';
  if (name.includes('Optic') || name.includes('optic')) return 'Electro-optical_sensor';
  return null;
}

// ─── Build the map ────────────────────────────────────────────────────────────
const imageMap = {
  aircraft:  {},
  ships:     {},
  weapons:   {},
  sensors:   {},
  infantry:  {},
  armor:     {},
  artillery: {},
  airdefense:{},
  radar:     {},
};

let mapped = 0, skipped = 0;

function addMap(cat, items, fn) {
  for (const item of items) {
    const wiki = fn(item.name);
    if (wiki) { imageMap[cat][String(item.id)] = wiki; mapped++; }
    else skipped++;
  }
}

addMap('aircraft',   aircraft,   getAcWiki);
addMap('ships',      ships,      getShipWiki);
addMap('weapons',    weapons,    getWpnWiki);
addMap('sensors',    sensors,    getSnWiki);
addMap('infantry',   infantry,   getInfWiki);
addMap('armor',      armor,      getArmorWiki);
addMap('artillery',  artillery,  getArtyWiki);
addMap('airdefense', airdefense, getADWiki);
addMap('radar',      radar,      getRadarWiki);

const outPath = path.join(dataDir, 'images.json');
fs.writeFileSync(outPath, JSON.stringify(imageMap, null, 2));
console.log(`Wrote ${outPath}`);
console.log(`Mapped: ${mapped}, Skipped (no image): ${skipped}`);
Object.entries(imageMap).forEach(([cat, m]) => {
  console.log(`  ${cat}: ${Object.keys(m).length}`);
});
