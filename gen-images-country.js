// gen-images-country.js — Auto-generate Wikipedia image mappings for any country
// Usage: node gen-images-country.js <code>
//   e.g. node gen-images-country.js ru
//        node gen-images-country.js su
const fs = require('fs');
const path = require('path');

const code = process.argv[2];
if (!code) { console.error('Usage: node gen-images-country.js <code>'); process.exit(1); }

const dataDir = path.join(__dirname, 'data', code);
const load = f => { try { return JSON.parse(fs.readFileSync(path.join(dataDir, f), 'utf8')); } catch { return []; } };

const aircraft   = load('aircraft.json');
const ships      = load('ships.json');
const weapons    = load('weapons.json');
const sensors    = load('sensors.json');
const infantry   = load('infantry.json');
const armor      = load('armor.json');
const artillery  = load('artillery.json');
const airdefense = load('airdefense.json');
const radar      = load('radar.json');

// ─── Aircraft: designation prefix → Wikipedia article ────────────────────────
// Keys sorted longest-first by getAcWiki() — longer keys always win on prefix match.
const AC_MAP = {
  // ── US / NATO Fighters & Multirole ──────────────────────────────────────────
  'F/A-18E':      'Boeing_F/A-18E/F_Super_Hornet',
  'F/A-18F':      'Boeing_F/A-18E/F_Super_Hornet',
  'F/A-18':       'McDonnell_Douglas_F/A-18_Hornet',
  'F-15EX':       'McDonnell_Douglas_F-15_Eagle',
  'F-15SA':       'McDonnell_Douglas_F-15_Eagle',
  'F-15K':        'McDonnell_Douglas_F-15_Eagle',
  'F-15I':        'McDonnell_Douglas_F-15_Eagle',
  'F-15':         'McDonnell_Douglas_F-15_Eagle',
  'F-16':         'General_Dynamics_F-16_Fighting_Falcon',
  'F-14':         'Grumman_F-14_Tomcat',
  'F-22':         'Lockheed_Martin_F-22_Raptor',
  'F-35':         'Lockheed_Martin_F-35_Lightning_II',
  'F-111':        'General_Dynamics_F-111',
  'F-106':        'Convair_F-106_Delta_Dart',
  'F-105':        'Republic_F-105_Thunderchief',
  'F-104':        'Lockheed_F-104_Starfighter',
  'F-102':        'Convair_F-102_Delta_Dagger',
  'F-101':        'McDonnell_F-101_Voodoo',
  'F-100':        'North_American_F-100_Super_Sabre',
  'F-86':         'North_American_F-86_Sabre',
  'F-84':         'Republic_F-84_Thunderjet',
  'F-80':         'Lockheed_P-80_Shooting_Star',
  'F-8':          'Vought_F-8_Crusader',
  'F-5':          'Northrop_F-5',
  'F-4':          'McDonnell_Douglas_F-4_Phantom_II',
  'FA-50':        'KAI_T-50_Golden_Eagle',
  'F-1A':         'Mitsubishi_F-1',
  'F-2':          'Mitsubishi_F-2',
  'F-1':          'Mitsubishi_F-1',
  // British / European Fighters
  'EF2000':       'Eurofighter_Typhoon',
  'EF-2000':      'Eurofighter_Typhoon',
  'Eurofighter':  'Eurofighter_Typhoon',
  'Typhoon FGR':  'Eurofighter_Typhoon',
  'Typhoon FG':   'Eurofighter_Typhoon',
  'Sea Harrier':  'British_Aerospace_Sea_Harrier',
  'Harrier GR':   'British_Aerospace_Harrier_II',
  'Harrier T':    'British_Aerospace_Harrier_II',
  'Harrier':      'Hawker_Siddeley_Harrier',
  'Lightning F':  'English_Electric_Lightning',
  'Lightning II': 'Lockheed_Martin_F-35_Lightning_II',
  'Phantom FGR':  'McDonnell_Douglas_F-4_Phantom_II',
  'Phantom FG':   'McDonnell_Douglas_F-4_Phantom_II',
  'CF-18':        'McDonnell_Douglas_F/A-18_Hornet',
  'EF-18':        'McDonnell_Douglas_F/A-18_Hornet',
  'RF-4':         'McDonnell_Douglas_F-4_Phantom_II',
  'AV-8B':        'McDonnell_Douglas_AV-8B_Harrier_II',
  'AV-8':         'McDonnell_Douglas_AV-8B_Harrier_II',
  // French Fighters
  'Rafale':       'Dassault_Rafale',
  'Mirage 2000-5':'Dassault_Mirage_2000',
  'Mirage 2000':  'Dassault_Mirage_2000',
  'Mirage F.1':   'Dassault_Mirage_F1',
  'Mirage F1':    'Dassault_Mirage_F1',
  'Mirage IV':    'Dassault_Mirage_IV',
  'Mirage III':   'Dassault_Mirage_III',
  'Mirage 5':     'Dassault_Mirage_5',
  'Mirage':       'Dassault_Mirage_III',
  'Super Etendard':'Dassault-Breguet_Super_Étendard',
  'Etendard':     'Dassault_Étendard_IV',
  // Swedish
  'JAS 39':       'Saab_JAS_39_Gripen',
  'JAS39':        'Saab_JAS_39_Gripen',
  'AJ 37':        'Saab_37_Viggen',
  'JA 37':        'Saab_37_Viggen',
  'SK 37':        'Saab_37_Viggen',
  'SF 37':        'Saab_37_Viggen',
  'SH 37':        'Saab_37_Viggen',
  'J 37':         'Saab_37_Viggen',
  'J 35':         'Saab_35_Draken',
  'J 32':         'Saab_32_Lansen',
  // Israeli
  'Kfir':         'IAI_Kfir',
  'Nesher':       'IAI_Nesher',
  'Lavi':         'IAI_Lavi',
  // Korean
  'T-50':         'KAI_T-50_Golden_Eagle',
  'KUH-1':        'Surion',
  // Turkish
  'T-129':        'TAI/AgustaWestland_T129',
  'TB2':          'Bayraktar_TB2',
  'Bayraktar':    'Bayraktar_TB2',
  'Anka':         'TAI_Anka',
  // Indian
  'Tejas':        'HAL_Tejas',
  'Dhruv':        'HAL_Dhruv',
  'Rudra':        'HAL_Rudra',
  // Pakistani
  'JF-17':        'CAC/PAC_JF-17_Thunder',
  // ── Attack Aircraft ──────────────────────────────────────────────────────────
  'AC-130':       'Lockheed_AC-130',
  'A-10':         'Fairchild-Republic_A-10_Thunderbolt_II',
  'A-7':          'Ling-Temco-Vought_A-7_Corsair_II',
  'A-6':          'Grumman_A-6_Intruder',
  'A-4':          'McDonnell_Douglas_A-4_Skyhawk',
  'EA-18':        'Boeing_EA-18G_Growler',
  'EA-6':         'Grumman_EA-6_Prowler',
  'OV-10':        'North_American_OV-10_Bronco',
  'Alpha Jet':    'Dassault-Dornier_Alpha_Jet',
  'AMX':          'AMX_International_AMX',
  'Jaguar':       'SEPECAT_Jaguar',
  'Buccaneer':    'Blackburn_Buccaneer',
  'MB-339':       'Aermacchi_MB-339',
  'MB.339':       'Aermacchi_MB-339',
  // ── Bombers ──────────────────────────────────────────────────────────────────
  'B-52':         'Boeing_B-52_Stratofortress',
  'B-21':         'Northrop_Grumman_B-21_Raider',
  'B-2':          'Northrop_Grumman_B-2_Spirit',
  'B-1':          'Rockwell_B-1_Lancer',
  'Vulcan':       'Avro_Vulcan',
  'Victor B':     'Handley_Page_Victor',
  'Canberra':     'English_Electric_Canberra',
  'Shackleton':   'Avro_Shackleton',
  // ── Maritime Patrol ──────────────────────────────────────────────────────────
  'P-8':          'Boeing_P-8_Poseidon',
  'P-3':          'Lockheed_P-3_Orion',
  'CP-140':       'Lockheed_CP-140_Aurora',
  'EP-3':         'Lockheed_EP-3',
  'P-1':          'Kawasaki_P-1',
  'BR.1150':      'Breguet_Atlantic',
  'Atlantique':   'Breguet_Atlantic',
  'Atlantic':     'Breguet_Atlantic',
  'Nimrod':       'Hawker_Siddeley_Nimrod',
  'Do 228':       'Dornier_228',
  'Do 28':        'Dornier_28',
  // ── AEW & C2 ─────────────────────────────────────────────────────────────────
  'E-767':        'Boeing_E-767',
  'E-7A':         'Boeing_737_AEW&C',
  'E-7':          'Boeing_737_AEW&C',
  'E-3':          'Boeing_E-3_Sentry',
  'E-2':          'Grumman_E-2_Hawkeye',
  'E-8':          'Boeing_E-8_Joint_STARS',
  'E-6':          'Boeing_E-6_Mercury',
  'Phalcon':      'IAI_Phalcon',
  // ── SIGINT / Recon ───────────────────────────────────────────────────────────
  'SR-71':        'Lockheed_SR-71_Blackbird',
  'U-2':          'Lockheed_U-2',
  'TR-1':         'Lockheed_U-2',
  'RC-135':       'Boeing_RC-135',
  'EC-130':       'Lockheed_EC-130',
  // ── Transports ───────────────────────────────────────────────────────────────
  'CC-177':       'Boeing_C-17_Globemaster_III',
  'C-17':         'Boeing_C-17_Globemaster_III',
  'C-141':        'Lockheed_C-141_Starlifter',
  'C-135':        'Boeing_C-135_Stratolifter',
  'C-130':        'Lockheed_C-130_Hercules',
  'KC-130':       'Lockheed_KC-130',
  'C-160':        'Transall_C-160',
  'C-295':        'Airbus_C295',
  'C-212':        'CASA_C-212_Aviocar',
  'C-27J':        'Alenia_C-27J_Spartan',
  'CN-235':       'CASA/IPTN_CN-235',
  'C-12':         'Beechcraft_King_Air',
  'C-5':          'Lockheed_C-5_Galaxy',
  'C-2A':         'Grumman_C-2_Greyhound',
  'C-2':          'Kawasaki_C-2',
  'C-1':          'Kawasaki_C-1',
  'VC.10':        'Vickers_VC10',
  'VC-10':        'Vickers_VC10',
  'G.222':        'Alenia_G.222',
  'G222':         'Alenia_G.222',
  'Tp 84':        'Lockheed_C-130_Hercules',
  'YS-11':        'NAMC_YS-11',
  // ── Tankers ───────────────────────────────────────────────────────────────────
  'KC-135':       'Boeing_KC-135_Stratotanker',
  'KC-767':       'Boeing_KC-767',
  'KC-46':        'Boeing_KC-46_Pegasus',
  'KC-10':        'McDonnell_Douglas_KC-10_Extender',
  // ── EW / Strike ──────────────────────────────────────────────────────────────
  'Tornado ECR':  'Panavia_Tornado',
  'Tornado IDS':  'Panavia_Tornado',
  'Tornado ADV':  'Panavia_Tornado',
  'Tornado GR':   'Panavia_Tornado',
  'Tornado F':    'Panavia_Tornado',
  'Tornado':      'Panavia_Tornado',
  // ── Helicopters: Attack ──────────────────────────────────────────────────────
  'AH-64':        'Boeing_AH-64_Apache',
  'AH-1Z':        'Bell_AH-1Z_Viper',
  'AH-1W':        'Bell_AH-1_SuperCobra',
  'AH-1':         'Bell_AH-1_Cobra',
  'A-129':        'Agusta_A129_Mangusta',
  'EC.665':       'Eurocopter_Tiger',
  'Tiger EC':     'Eurocopter_Tiger',
  'Tiger ARH':    'Eurocopter_Tiger',
  'Tiger HAD':    'Eurocopter_Tiger',
  'Tiger HAP':    'Eurocopter_Tiger',
  'Tiger UHT':    'Eurocopter_Tiger',
  // ── Helicopters: Heavy Lift & Transport ──────────────────────────────────────
  'CH-53K':       'Sikorsky_CH-53K_King_Stallion',
  'CH-53':        'Sikorsky_CH-53_Sea_Stallion',
  'CH-47':        'Boeing_CH-47_Chinook',
  'CH-46':        'Boeing_Vertol_CH-46_Sea_Knight',
  'Hkp 4':        'Sikorsky_SH-3_Sea_King',
  'Hkp 3':        'Boeing_Vertol_CH-46_Sea_Knight',
  // ── Helicopters: Utility ──────────────────────────────────────────────────────
  'UH-60':        'Sikorsky_UH-60_Black_Hawk',
  'MH-60':        'Sikorsky_UH-60_Black_Hawk',
  'HH-60':        'Sikorsky_UH-60_Black_Hawk',
  'SH-60':        'Sikorsky_UH-60_Black_Hawk',
  'S-70':         'Sikorsky_UH-60_Black_Hawk',
  'UH-1':         'Bell_UH-1_Iroquois',
  'HH-1':         'Bell_UH-1_Iroquois',
  'AB.212':       'Bell_212',
  'AB.205':       'Bell_UH-1_Iroquois',
  'AB.206':       'Bell_206',
  'Bell 412':     'Bell_412',
  'Bell 212':     'Bell_212',
  'Bell 206':     'Bell_206',
  'OH-58':        'Bell_OH-58_Kiowa',
  'OH-1':         'Kawasaki_OH-1',
  'SA.332':       'Eurocopter_AS332',
  'SA.330':       'Aerospatiale_SA_330_Puma',
  'SA.342':       'Aerospatiale_Gazelle',
  'SA.341':       'Aerospatiale_Gazelle',
  'SA.321':       'Aérospatiale_SA_321_Super_Frelon',
  'SA.316':       'Aerospatiale_Alouette_III',
  'SA.313':       'Aerospatiale_Alouette_II',
  'AS.565':       'Eurocopter_AS565_Panther',
  'AS.532':       'Eurocopter_AS532_Cougar',
  'AS.332':       'Eurocopter_AS332',
  'AS.365':       'Eurocopter_AS365_Dauphin',
  'EC.725':       'Eurocopter_EC725',
  'EC.135':       'Eurocopter_EC135',
  'HH-65':        'Eurocopter_HH-65_Dolphin',
  'Puma HC':      'Aerospatiale_Puma',
  'Puma':         'Aerospatiale_Puma',
  'Gazelle':      'Aerospatiale_Gazelle',
  'Dauphin':      'Eurocopter_AS365_Dauphin',
  'Cougar':       'Eurocopter_AS532_Cougar',
  // ── Helicopters: ASW / Naval ──────────────────────────────────────────────────
  'AW.159':       'AgustaWestland_AW159_Wildcat',
  'AW.101':       'AgustaWestland_AW101',
  'EH.101':       'AgustaWestland_AW101',
  'AW.109':       'AgustaWestland_AW109',
  'A-109':        'AgustaWestland_AW109',
  'NH.90':        'NHIndustries_NH90',
  'NH90':         'NHIndustries_NH90',
  'Hkp 14':       'NHIndustries_NH90',
  'Hkp 10':       'Eurocopter_AS332',
  'Lynx':         'Westland_Lynx',
  'Merlin HC':    'AgustaWestland_AW101',
  'Merlin HM':    'AgustaWestland_AW101',
  'Merlin':       'AgustaWestland_AW101',
  'Sea King':     'Sikorsky_SH-3_Sea_King',
  'SH-3':         'Sikorsky_SH-3_Sea_King',
  'Hawk':         'British_Aerospace_Hawk',
  'M.346':        'Alenia_Aermacchi_M-346',
  // ── UAVs ──────────────────────────────────────────────────────────────────────
  'RQ-170':       'Lockheed_Martin_RQ-170_Sentinel',
  'RQ-4':         'Northrop_Grumman_RQ-4_Global_Hawk',
  'MQ-25':        'Boeing_MQ-25_Stingray',
  'MQ-9':         'General_Atomics_MQ-9_Reaper',
  'MQ-4':         'Northrop_Grumman_MQ-4C_Triton',
  'MQ-1C':        'General_Atomics_MQ-1C_Gray_Eagle',
  'MQ-1':         'General_Atomics_MQ-1_Predator',
  'Heron':        'IAI_Heron',
  'Hermes':       'Elbit_Hermes_450',
  'Searcher':     'IAI_Searcher',
  'IAI Arava':    'IAI_Arava',
  // ── V/STOL ───────────────────────────────────────────────────────────────────
  'V-22':         'Bell_Boeing_V-22_Osprey',
  // ── Trainers ─────────────────────────────────────────────────────────────────
  'T-38':         'Northrop_T-38_Talon',
  'T-37':         'Cessna_T-37_Tweet',
  'L-159':        'Aero_L-159_ALCA',
  'BAC 167':      'BAC_Strikemaster',
  // ── Russian / Soviet ─────────────────────────────────────────────────────────
  'A-50':         'Beriev_A-50',
  'An-124':       'Antonov_An-124_Ruslan',
  'An-22':        'Antonov_An-22',
  'An-24':        'Antonov_An-24',
  'An-26':        'Antonov_An-26',
  'An-30':        'Antonov_An-30',
  'An-32':        'Antonov_An-32',
  'An-72':        'Antonov_An-72',
  'An-12':        'Antonov_An-12',
  'An-8':         'Antonov_An-8',
  'An-2':         'Antonov_An-2',
  'Be-200':       'Beriev_Be-200',
  'Be-12':        'Beriev_Be-12',
  'Be-6':         'Beriev_Be-6',
  'Il-80':        'Ilyushin_Il-80',
  'Il-78':        'Ilyushin_Il-78',
  'Il-76':        'Ilyushin_Il-76',
  'Il-62':        'Ilyushin_Il-62',
  'Il-38':        'Ilyushin_Il-38',
  'Il-22':        'Ilyushin_Il-20',
  'Il-20':        'Ilyushin_Il-20',
  'Il-18':        'Ilyushin_Il-18',
  'Ka-52':        'Kamov_Ka-52',
  'Ka-50':        'Kamov_Ka-50',
  'Ka-31':        'Kamov_Ka-31',
  'Ka-29':        'Kamov_Ka-29',
  'Ka-28':        'Kamov_Ka-27',
  'Ka-27':        'Kamov_Ka-27',
  'Ka-25':        'Kamov_Ka-25',
  'M-55':         'Myasishchev_M-55',
  'M-4':          'Myasishchev_M-4',
  'Mi-171':       'Mil_Mi-17',
  'Mi-35':        'Mil_Mi-24',
  'Mi-28':        'Mil_Mi-28',
  'Mi-26':        'Mil_Mi-26',
  'Mi-24':        'Mil_Mi-24',
  'Mi-17':        'Mil_Mi-17',
  'Mi-14':        'Mil_Mi-14',
  'Mi-8':         'Mil_Mi-8',
  'Mi-6':         'Mil_Mi-6',
  'Mi-4':         'Mil_Mi-4',
  'Mi-2':         'Mil_Mi-2',
  'MiG-31':       'Mikoyan_MiG-31',
  'MiG-29':       'Mikoyan_MiG-29',
  'MiG-27':       'Mikoyan_MiG-27',
  'MiG-25':       'Mikoyan-Gurevich_MiG-25',
  'MiG-23':       'Mikoyan-Gurevich_MiG-23',
  'MiG-21':       'Mikoyan-Gurevich_MiG-21',
  'MiG-19':       'Mikoyan-Gurevich_MiG-19',
  'MiG-17':       'Mikoyan-Gurevich_MiG-17',
  'MiG-15':       'Mikoyan-Gurevich_MiG-15',
  'Su-57':        'Sukhoi_Su-57',
  'Su-35':        'Sukhoi_Su-35',
  'Su-34':        'Sukhoi_Su-34',
  'Su-33':        'Sukhoi_Su-33',
  'Su-30':        'Sukhoi_Su-30',
  'Su-27':        'Sukhoi_Su-27',
  'Su-25':        'Sukhoi_Su-25',
  'Su-24':        'Sukhoi_Su-24',
  'Su-22':        'Sukhoi_Su-17',
  'Su-20':        'Sukhoi_Su-17',
  'Su-17':        'Sukhoi_Su-17',
  'Su-15':        'Sukhoi_Su-15',
  'Su-9':         'Sukhoi_Su-9',
  'Su-7':         'Sukhoi_Su-7',
  'Tu-204':       'Tupolev_Tu-204',
  'Tu-160':       'Tupolev_Tu-160',
  'Tu-154':       'Tupolev_Tu-154',
  'Tu-142':       'Tupolev_Tu-142',
  'Tu-134':       'Tupolev_Tu-134',
  'Tu-22M':       'Tupolev_Tu-22M',
  'Tu-22':        'Tupolev_Tu-22',
  'Tu-95':        'Tupolev_Tu-95',
  'Tu-16':        'Tupolev_Tu-16',
  'Yak-130':      'Yakovlev_Yak-130',
  'Yak-141':      'Yakovlev_Yak-141',
  'Yak-40':       'Yakovlev_Yak-40',
  'Yak-44':       'Yakovlev_Yak-44',
  'Yak-38':       'Yakovlev_Yak-38',
  'Yak-36':       'Yakovlev_Yak-36',
  'Yak-28':       'Yakovlev_Yak-28',
  'L-39':         'Aero_L-39_Albatros',
  'Orion':        'Orion_(UAV)',
  'Altius':       'Altius-U',
  'Forpost':      'IAI_Searcher',
  // ── Chinese ───────────────────────────────────────────────────────────────────
  'J-20':         'Chengdu_J-20',
  'J-16':         'Shenyang_J-16',
  'J-15':         'Shenyang_J-15',
  'J-11':         'Shenyang_J-11',
  'J-10':         'Chengdu_J-10',
  'J-31':         'Shenyang_FC-31',
  'JH-7':         'Xian_JH-7',
  'J-8':          'Shenyang_J-8',
  'J-7':          'Chengdu_J-7',
  'J-6':          'Shenyang_J-6',
  'J-5':          'Shenyang_J-5',
  'H-6':          'Xian_H-6',
  'H-5':          'Harbin_H-5',
  'Q-5':          'Nanchang_Q-5',
  'Y-20':         'Xian_Y-20',
  'Y-12':         'Harbin_Y-12',
  'Y-9':          'Shaanxi_Y-9',
  'Y-8':          'Shaanxi_Y-8',
  'Y-7':          'Xian_Y-7',
  'Z-19':         'Harbin_Z-19',
  'Z-18':         'Changhe_Z-18',
  'Z-10':         'CAIC_Z-10',
  'Z-9':          'Harbin_Z-9',
  'Z-8':          'Changhe_Z-8',
  'SH-5':         'Harbin_SH-5',
  'JL-8':         'Hongdu_JL-8',
  'BZK-005':      'CASC_Rainbow',
  'Camcopter':    'Schiebel_Camcopter_S-100',
  'CH-4':         'CASC_Rainbow',
  'WD-1':         'CASC_Rainbow',
  'EA-03':        'Soar_Dragon',
};

// ══════════════════════════════════════════════════════════════════════════════
// AIRCRAFT VARIANT MAPPINGS — unique photos for variants of the same platform
// Longer keys win over shorter base-type keys (e.g. 'MH-60R' beats 'MH-60')
// ══════════════════════════════════════════════════════════════════════════════

// ── UH-60 / H-60 family (18 variants, currently all → Sikorsky_UH-60_Black_Hawk) ──
Object.assign(AC_MAP, {
  'MH-60R Seahawk':   'Sikorsky_MH-60R_Seahawk',
  'MH-60R ':          'Sikorsky_MH-60R_Seahawk',
  'MH-60S ':          'Sikorsky_MH-60S_Knighthawk',
  'MH-60S Knighthawk':'Sikorsky_MH-60S_Knighthawk',
  'SH-60B ':          'Sikorsky_SH-60_Seahawk',
  'SH-60F ':          'Sikorsky_SH-60_Seahawk',
  'SH-60J ':          'Sikorsky_SH-60_Seahawk',
  'SH-60K ':          'Sikorsky_SH-60_Seahawk',
  'HH-60G ':          'Sikorsky_HH-60_Pave_Hawk',
  'HH-60H ':          'Sikorsky_HH-60_Pave_Hawk',
  'HH-60J ':          'Sikorsky_HH-60_Jayhawk',
  'HH-60W ':          'Sikorsky_HH-60W_Jolly_Green_II',
  'MH-60G ':          'Sikorsky_HH-60_Pave_Hawk',
  'MH-60K ':          'Sikorsky_UH-60_Black_Hawk',
  'MH-60L ':          'Sikorsky_MH-60L_Black_Hawk',
  'MH-60M ':          'Sikorsky_UH-60M_Black_Hawk',
  'MH-60X ':          'Sikorsky_UH-60_Black_Hawk',
  'UH-60A ':          'Sikorsky_UH-60_Black_Hawk',
  'UH-60L ':          'Sikorsky_UH-60_Black_Hawk',
  'UH-60M ':          'Sikorsky_UH-60M_Black_Hawk',
  'UH-60Q ':          'Sikorsky_UH-60_Black_Hawk',
  'UH-60J ':          'Sikorsky_UH-60_Black_Hawk',
  'S-70A':            'Sikorsky_S-70',
  'S-70B':            'Sikorsky_SH-60_Seahawk',
  'S-70C':            'Sikorsky_S-70',
});

// ── F-4 Phantom II variants ──
Object.assign(AC_MAP, {
  'F-4C ':     'McDonnell_Douglas_F-4_Phantom_II',
  'F-4D ':     'McDonnell_Douglas_F-4_Phantom_II',
  'F-4E ':     'McDonnell_Douglas_F-4_Phantom_II',
  'F-4EJ ':    'McDonnell_Douglas_F-4_Phantom_II',
  'F-4F ':     'McDonnell_Douglas_F-4_Phantom_II',
  'F-4G ':     'McDonnell_Douglas_F-4_Phantom_II',
  'F-4J ':     'McDonnell_Douglas_F-4_Phantom_II',
  'F-4N ':     'McDonnell_Douglas_F-4_Phantom_II',
  'F-4S ':     'McDonnell_Douglas_F-4_Phantom_II',
  'RF-4C ':    'McDonnell_Douglas_RF-4_Phantom_II',
  'RF-4E ':    'McDonnell_Douglas_RF-4_Phantom_II',
  'RF-4EJ ':   'McDonnell_Douglas_RF-4_Phantom_II',
});

// ── F-16 Fighting Falcon variants ──
Object.assign(AC_MAP, {
  'F-16AM ':    'General_Dynamics_F-16_Fighting_Falcon_variants',
  'F-16BM ':    'General_Dynamics_F-16_Fighting_Falcon_variants',
  'F-16CM ':    'General_Dynamics_F-16_Fighting_Falcon_variants',
  'F-16DM ':    'General_Dynamics_F-16_Fighting_Falcon_variants',
  'F-16CG ':    'General_Dynamics_F-16_Fighting_Falcon',
  'F-16DG ':    'General_Dynamics_F-16_Fighting_Falcon',
  'F-16CJ ':    'General_Dynamics_F-16_Fighting_Falcon',
  'F-16DJ ':    'General_Dynamics_F-16_Fighting_Falcon',
  'F-16I ':     'F-16I_Sufa',
  'F-16C Blk 30': 'General_Dynamics_F-16_Fighting_Falcon',
  'F-16C Blk 32': 'General_Dynamics_F-16_Fighting_Falcon_variants',
  'F-16C Blk 50': 'General_Dynamics_F-16_Fighting_Falcon',
  'F-16N ':     'General_Dynamics_F-16_Fighting_Falcon_variants',
  'F-16A ':     'General_Dynamics_F-16_Fighting_Falcon',
  'F-16B ':     'General_Dynamics_F-16_Fighting_Falcon',
  'F-16D ':     'General_Dynamics_F-16_Fighting_Falcon',
});

// ── F-15 Eagle variants ──
Object.assign(AC_MAP, {
  'F-15E Strike':   'McDonnell_Douglas_F-15E_Strike_Eagle',
  'F-15E ':         'McDonnell_Douglas_F-15E_Strike_Eagle',
  'F-15EX ':        'Boeing_F-15EX_Eagle_II',
  'F-15I ':         'McDonnell_Douglas_F-15E_Strike_Eagle',
  'F-15K ':         'F-15K',
  'F-15S ':         'McDonnell_Douglas_F-15E_Strike_Eagle',
  'F-15SA ':        'McDonnell_Douglas_F-15E_Strike_Eagle',
  'F-15A ':         'McDonnell_Douglas_F-15_Eagle',
  'F-15B ':         'McDonnell_Douglas_F-15_Eagle',
  'F-15C ':         'McDonnell_Douglas_F-15_Eagle',
  'F-15D ':         'McDonnell_Douglas_F-15_Eagle',
  'F-15DJ ':        'Mitsubishi_F-15J',
  'F-15J ':         'Mitsubishi_F-15J',
});

// ── F-35 Lightning II variants ──
Object.assign(AC_MAP, {
  'F-35A ':   'Lockheed_Martin_F-35_Lightning_II',
  'F-35B ':   'Lockheed_Martin_F-35B_Lightning_II',
  'F-35C ':   'Lockheed_Martin_F-35C_Lightning_II',
});

// ── F-14 Tomcat variants ──
Object.assign(AC_MAP, {
  'F-14A ':   'Grumman_F-14_Tomcat',
  'F-14B ':   'Grumman_F-14_Tomcat',
  'F-14D ':   'Grumman_F-14_Tomcat',
});

// ── F/A-18 Hornet / Super Hornet variants ──
Object.assign(AC_MAP, {
  'F/A-18A+ ':  'McDonnell_Douglas_F/A-18_Hornet',
  'F/A-18A ':   'McDonnell_Douglas_F/A-18_Hornet',
  'F/A-18B ':   'McDonnell_Douglas_F/A-18_Hornet',
  'F/A-18C ':   'McDonnell_Douglas_F/A-18_Hornet',
  'F/A-18D ':   'McDonnell_Douglas_F/A-18_Hornet',
  'F/A-18E ':   'Boeing_F/A-18E/F_Super_Hornet',
  'F/A-18F ':   'Boeing_F/A-18F_Super_Hornet',
});

// ── AC-130 Gunship variants ──
Object.assign(AC_MAP, {
  'AC-130A ':   'Lockheed_AC-130',
  'AC-130H ':   'Lockheed_AC-130_Spectre',
  'AC-130J ':   'Lockheed_AC-130J_Ghostrider',
  'AC-130U ':   'Lockheed_AC-130',
  'AC-130W ':   'AC-130W_Stinger_II',
});

// ── EC-130 variants ──
Object.assign(AC_MAP, {
  'EC-130E ':   'Lockheed_EC-130',
  'EC-130G ':   'Lockheed_EC-130',
  'EC-130H ':   'Lockheed_EC-130H_Compass_Call',
  'EC-130J ':   'Lockheed_EC-130J_Commando_Solo',
  'EC-130Q ':   'Lockheed_EC-130',
});

// ── KC-135 variants ──
Object.assign(AC_MAP, {
  'KC-135R ':   'Boeing_KC-135_Stratotanker',
  'KC-135RG ':  'Boeing_KC-135_Stratotanker',
  'KC-135A ':   'Boeing_KC-135_Stratotanker',
  'KC-135E ':   'Boeing_KC-135_Stratotanker',
  'KC-135Q ':   'Boeing_KC-135R_Stratotanker',
  'KC-135T ':   'Boeing_KC-135R_Stratotanker',
});

// ── RC-135 variants ──
Object.assign(AC_MAP, {
  'RC-135S ':   'Boeing_RC-135#RC-135S_Cobra_Ball',
  'RC-135U ':   'Boeing_RC-135#RC-135U_Combat_Sent',
  'RC-135V ':   'Boeing_RC-135',
  'RC-135W ':   'Boeing_RC-135',
  'RC-135X ':   'Boeing_RC-135',
});

// ── A-7 Corsair II variants ──
Object.assign(AC_MAP, {
  'A-7B ':    'Ling-Temco-Vought_A-7_Corsair_II',
  'A-7D ':    'Ling-Temco-Vought_A-7_Corsair_II',
  'A-7E ':    'LTV_A-7E_Corsair_II',
  'A-7K ':    'Ling-Temco-Vought_A-7_Corsair_II',
});

// ── AH-1 Cobra family ──
Object.assign(AC_MAP, {
  'AH-1F ':    'Bell_AH-1_Cobra',
  'AH-1J ':    'Bell_AH-1_SuperCobra',
  'AH-1S ':    'Bell_AH-1_Cobra',
  'AH-1T ':    'Bell_AH-1_SuperCobra',
  'AH-1W ':    'Bell_AH-1_SuperCobra',
  'AH-1Z ':    'Bell_AH-1Z_Viper',
});

// ── AH-64 Apache variants ──
Object.assign(AC_MAP, {
  'AH-64A ':    'Boeing_AH-64_Apache',
  'AH-64D ':    'Boeing_AH-64_Apache',
  'AH-64E ':    'Boeing_AH-64_Apache',
});

// ── B-52 variants ──
Object.assign(AC_MAP, {
  'B-52D ':    'Boeing_B-52_Stratofortress',
  'B-52G ':    'Boeing_B-52_Stratofortress',
  'B-52H ':    'Boeing_B-52H_Stratofortress',
});

// ── C-130 Hercules variants ──
Object.assign(AC_MAP, {
  'C-130B ':    'Lockheed_C-130_Hercules',
  'C-130E ':    'Lockheed_C-130_Hercules',
  'C-130H ':    'Lockheed_C-130H_Hercules',
  'C-130J-30':  'Lockheed_Martin_C-130J_Super_Hercules',
  'C-130J ':    'Lockheed_Martin_C-130J_Super_Hercules',
  'C-130R ':    'Lockheed_C-130_Hercules',
});

// ── C-5 Galaxy variants ──
Object.assign(AC_MAP, {
  'C-5A ':    'Lockheed_C-5_Galaxy',
  'C-5B ':    'Lockheed_C-5_Galaxy',
  'C-5M ':    'Lockheed_C-5M_Super_Galaxy',
});

// ── C-141 variants ──
Object.assign(AC_MAP, {
  'C-141A ':    'Lockheed_C-141_Starlifter',
  'C-141B ':    'Lockheed_C-141B_Starlifter',
  'C-141C ':    'Lockheed_C-141_Starlifter',
});

// ── CH-47 Chinook variants ──
Object.assign(AC_MAP, {
  'CH-47C ':    'Boeing_CH-47_Chinook',
  'CH-47D ':    'Boeing_CH-47_Chinook',
  'CH-47F ':    'Boeing_CH-47F_Chinook',
  'CH-47J ':    'Boeing_CH-47_Chinook',
  'CH-47JA':    'Boeing_CH-47_Chinook',
});

// ── CH-53 variants ──
Object.assign(AC_MAP, {
  'CH-53D ':    'Sikorsky_CH-53_Sea_Stallion',
  'CH-53E ':    'Sikorsky_CH-53E_Super_Stallion',
  'CH-53G ':    'Sikorsky_CH-53_Sea_Stallion',
  'CH-53K ':    'Sikorsky_CH-53K_King_Stallion',
});

// ── E-2 Hawkeye variants ──
Object.assign(AC_MAP, {
  'E-2C Hawkeye 2000':  'Grumman_E-2_Hawkeye',
  'E-2C Hawkeye Group': 'Grumman_E-2C_Hawkeye',
  'E-2C ':              'Grumman_E-2C_Hawkeye',
  'E-2D ':              'Northrop_Grumman_E-2D_Advanced_Hawkeye',
  'E-2K ':              'Grumman_E-2_Hawkeye',
  'E-2T ':              'Grumman_E-2_Hawkeye',
});

// ── E-3 Sentry variants ──
Object.assign(AC_MAP, {
  'E-3A ':    'Boeing_E-3_Sentry',
  'E-3B ':    'Boeing_E-3_Sentry',
  'E-3C ':    'Boeing_E-3_Sentry',
  'E-3G ':    'Boeing_E-3G_Sentry',
});

// ── F-111 variants ──
Object.assign(AC_MAP, {
  'F-111A ':    'General_Dynamics_F-111_Aardvark',
  'F-111C ':    'General_Dynamics_F-111C',
  'F-111D ':    'General_Dynamics_F-111_Aardvark',
  'F-111E ':    'General_Dynamics_F-111_Aardvark',
  'F-111F ':    'General_Dynamics_F-111F',
  'F-111G ':    'General_Dynamics_F-111',
});

// ── UH-1 Huey / Bell 212 family ──
Object.assign(AC_MAP, {
  'UH-1E ':    'Bell_UH-1_Iroquois',
  'UH-1H ':    'Bell_UH-1H_Iroquois',
  'UH-1J ':    'Bell_UH-1_Iroquois',
  'UH-1N ':    'Bell_UH-1N_Twin_Huey',
  'UH-1Y ':    'Bell_UH-1Y_Venom',
  'AB.212 ASW':  'Agusta-Bell_AB_212',
  'AB.212 Colibri': 'Agusta-Bell_AB_212',
  'AB.212AM':    'Agusta-Bell_AB_212',
});

// ── OH-58 Kiowa variants ──
Object.assign(AC_MAP, {
  'OH-58A ':    'Bell_OH-58_Kiowa',
  'OH-58C ':    'Bell_OH-58_Kiowa',
  'OH-58D ':    'Bell_OH-58_Kiowa',
});

// ── Sea King variants ──
Object.assign(AC_MAP, {
  'Sea King AEW':   'Westland_Sea_King',
  'Sea King ASaC':  'Westland_Sea_King_ASaC7',
  'Sea King HAR':   'Westland_Sea_King',
  'Sea King HAS':   'Westland_Sea_King',
  'Sea King HC':    'Westland_Sea_King',
  'Sea King Mk42':  'Westland_Sea_King',
  'Sea King Mk43':  'Westland_Sea_King',
  'SH-3D ':         'Sikorsky_SH-3_Sea_King',
  'SH-3H ':         'Sikorsky_SH-3_Sea_King',
});

// ── Lynx variants ──
Object.assign(AC_MAP, {
  'Lynx AH':     'Westland_Lynx',
  'Lynx HAS':    'Westland_Lynx',
  'Lynx HMA':    'Westland_Lynx',
  'Lynx Mk88':   'Westland_Super_Lynx',
  'Lynx Mk99':   'Westland_Super_Lynx',
});

// ── Merlin / AW101 variants ──
Object.assign(AC_MAP, {
  'Merlin ASaC':    'AgustaWestland_AW101',
  'Merlin HC':      'AgustaWestland_AW101',
  'Merlin HM':      'AgustaWestland_AW101',
  'AW.101 Merlin Mk.110': 'AgustaWestland_AW101',
  'AW.101 Merlin Mk.112': 'AgustaWestland_AW101',
  'AW.101 Merlin Mk.410': 'AgustaWestland_AW101',
  'AW.101 Merlin Mk.413': 'AgustaWestland_AW101',
  'AW.101 Merlin Mk.518': 'AgustaWestland_AW101',
  'AW.101 Merlin Mk.611': 'AgustaWestland_AW101',
});

// ── Tornado variants ──
Object.assign(AC_MAP, {
  'Tornado EF':     'Panavia_Tornado_ADV',
  'Tornado F.2':    'Panavia_Tornado_ADV',
  'Tornado F.3':    'Panavia_Tornado_ADV',
  'Tornado GR.1':   'Panavia_Tornado',
  'Tornado GR.4':   'Panavia_Tornado_GR4',
  'Tornado ECR':    'Panavia_Tornado_ECR',
  'Tornado IDS':    'Panavia_Tornado_IDS',
  'Tornado ADV':    'Panavia_Tornado_ADV',
});

// ── Harrier variants ──
Object.assign(AC_MAP, {
  'Harrier GR.3':   'Hawker_Siddeley_Harrier',
  'Harrier GR.5':   'British_Aerospace_Harrier_II',
  'Harrier GR.7':   'BAE_Systems_Harrier_II',
  'Harrier GR.9':   'BAE_Systems_Harrier_II',
  'AV-8B ':         'McDonnell_Douglas_AV-8B_Harrier_II',
  'AV-8A ':         'Hawker_Siddeley_Harrier',
  'AV-8C ':         'Hawker_Siddeley_Harrier',
});

// ── Jaguar variants ──
Object.assign(AC_MAP, {
  'Jaguar GR.1':    'SEPECAT_Jaguar',
  'Jaguar GR.3':    'SEPECAT_Jaguar',
  'Jaguar IM':      'SEPECAT_Jaguar',
  'Jaguar IS':      'SEPECAT_Jaguar',
});

// ── F-104 Starfighter variants ──
Object.assign(AC_MAP, {
  'F-104DJ ':    'Lockheed_F-104_Starfighter',
  'F-104G ':     'Lockheed_F-104G_Starfighter',
  'F-104J ':     'Lockheed_F-104_Starfighter',
  'F-104S ':     'Aeritalia_F-104S_Starfighter',
});

// ── F-5 Freedom Fighter / Tiger II variants ──
Object.assign(AC_MAP, {
  'F-5A ':    'Northrop_F-5',
  'F-5B ':    'Northrop_F-5',
  'F-5E ':    'Northrop_F-5E_Tiger_II',
  'F-5F ':    'Northrop_F-5',
});

// ── P-3 Orion variants ──
Object.assign(AC_MAP, {
  'P-3B ':    'Lockheed_P-3_Orion',
  'P-3C Orion Update II':  'Lockheed_P-3C_Orion',
  'P-3C Orion Update III': 'Lockheed_P-3C_Orion',
  'P-3C ':    'Lockheed_P-3C_Orion',
  'P-3N ':    'Lockheed_P-3_Orion',
});

// ── U-2 / TR-1 variants ──
Object.assign(AC_MAP, {
  'U-2R ':     'Lockheed_U-2',
  'U-2S ':     'Lockheed_U-2',
  'U-28A':     'Pilatus_PC-12',
  'TR-1A ':    'Lockheed_TR-1',
});

// ── NH90 variants ──
Object.assign(AC_MAP, {
  'NH90 NFH':   'NHIndustries_NH90',
  'NH90 NTH':   'NHIndustries_NH90',
  'NH90 TTH':   'NHIndustries_NH90',
});

// ── Nimrod variants ──
Object.assign(AC_MAP, {
  'Nimrod MR.1':    'Hawker_Siddeley_Nimrod',
  'Nimrod MR.2':    'Hawker_Siddeley_Nimrod',
  'Nimrod R.1':     'Hawker_Siddeley_Nimrod_R1',
});

// ── Canberra variants ──
Object.assign(AC_MAP, {
  'Canberra PR':    'English_Electric_Canberra',
  'Canberra T.17':  'English_Electric_Canberra',
  'Canberra TT':    'English_Electric_Canberra',
  'Canberra PR.57': 'English_Electric_Canberra',
  'Canberra PR.67': 'English_Electric_Canberra',
});

// ── VC10 variants ──
Object.assign(AC_MAP, {
  'VC.10 C':    'Vickers_VC10',
  'VC.10 K':    'Vickers_VC10',
});

// ── Hawk variants ──
Object.assign(AC_MAP, {
  'Hawk T.1':    'BAE_Systems_Hawk',
  'Hawk T.2':    'BAE_Systems_Hawk',
});

// ── RQ-4 Global Hawk variants ──
Object.assign(AC_MAP, {
  'RQ-4A ':    'Northrop_Grumman_RQ-4_Global_Hawk',
  'RQ-4B ':    'Northrop_Grumman_RQ-4B_Global_Hawk',
});

// ── Puma / Super Puma ──
Object.assign(AC_MAP, {
  'Puma HC.1':    'Aérospatiale_Puma',
  'Puma HC.2':    'Eurocopter_AS332_Super_Puma',
  'Hkp 10':       'Eurocopter_AS332',
});

// ──────────────────────────────────────────────────────────────────────────────
// Russian / Soviet aircraft variant mappings
// ──────────────────────────────────────────────────────────────────────────────

// ── Tu-16 Badger variants ──
Object.assign(AC_MAP, {
  'Tu-16K-10':    'Tupolev_Tu-16',
  'Tu-16K-26':    'Tupolev_Tu-16',
  'Tu-16N ':      'Tupolev_Tu-16',
  'Tu-16P ':      'Tupolev_Tu-16',
  'Tu-16R ':      'Tupolev_Tu-16',
  'Tu-16RM':      'Tupolev_Tu-16',
  'Tu-16Ye':      'Tupolev_Tu-16',
});

// ── MiG-29 Fulcrum variants ──
Object.assign(AC_MAP, {
  'MiG-29 Fulcrum A':  'Mikoyan_MiG-29',
  'MiG-29 Fulcrum B':  'Mikoyan_MiG-29',
  'MiG-29 Fulcrum C':  'Mikoyan_MiG-29',
  'MiG-29K ':          'Mikoyan_MiG-29K',
  'MiG-29KUB':         'Mikoyan_MiG-29K',
  'MiG-29S ':          'Mikoyan_MiG-29',
  'MiG-29SMT':         'Mikoyan_MiG-29SMT',
  'MiG-29UB':          'Mikoyan_MiG-29UB',
  'MiG-29UPG':         'Mikoyan_MiG-29',
});

// ── Mi-8/17 Hip variants ──
Object.assign(AC_MAP, {
  'Mi-8T ':      'Mil_Mi-8',
  'Mi-8TB':      'Mil_Mi-8',
  'Mi-8MT ':     'Mil_Mi-8',
  'Mi-8MTV':     'Mil_Mi-17',
  'Mi-8AMTSh':   'Mil_Mi-8',
  'Mi-8PP':      'Mil_Mi-8',
  'Mi-8SMV':     'Mil_Mi-8',
  'Mi-17 ':      'Mil_Mi-17',
  'Mi-171 ':     'Mil_Mi-171',
  'Mi-17V':      'Mil_Mi-17',
});

// ── MiG-25 Foxbat variants ──
Object.assign(AC_MAP, {
  'MiG-25BM':    'Mikoyan-Gurevich_MiG-25',
  'MiG-25P ':    'Mikoyan-Gurevich_MiG-25',
  'MiG-25PD':    'Mikoyan-Gurevich_MiG-25',
  'MiG-25RB':    'Mikoyan-Gurevich_MiG-25',
});

// ── Su-25 Frogfoot variants ──
Object.assign(AC_MAP, {
  'Su-25 ':       'Sukhoi_Su-25',
  'Su-25SM ':     'Sukhoi_Su-25',
  'Su-25SM2':     'Sukhoi_Su-25',
  'Su-25SM3':     'Sukhoi_Su-25',
  'Su-25T ':      'Sukhoi_Su-25',
  'Su-25UTG':     'Sukhoi_Su-25UTG',
});

// ── Tu-22 Blinder variants ──
Object.assign(AC_MAP, {
  'Tu-22KD':     'Tupolev_Tu-22',
  'Tu-22KPD':    'Tupolev_Tu-22',
  'Tu-22PD':     'Tupolev_Tu-22',
  'Tu-22RD':     'Tupolev_Tu-22',
});

// ── Tu-22M Backfire variants ──
Object.assign(AC_MAP, {
  'Tu-22M-2':    'Tupolev_Tu-22M',
  'Tu-22M-3M':   'Tupolev_Tu-22M3',
  'Tu-22M-3 ':   'Tupolev_Tu-22M3',
  'Tu-22MR':     'Tupolev_Tu-22M',
});

// ── Il-76 Candid variants ──
Object.assign(AC_MAP, {
  'Il-76M ':      'Ilyushin_Il-76',
  'Il-76MD-90':   'Ilyushin_Il-76',
  'Il-76MD ':     'Ilyushin_Il-76',
  'Il-76T ':      'Ilyushin_Il-76',
  'Il-76VPK':     'Beriev_A-50',
});

// ── Mi-24 Hind variants ──
Object.assign(AC_MAP, {
  'Mi-24A ':     'Mil_Mi-24',
  'Mi-24D ':     'Mil_Mi-24D',
  'Mi-24K ':     'Mil_Mi-24',
  'Mi-24P ':     'Mil_Mi-24P',
  'Mi-24V ':     'Mil_Mi-24V',
  'Mi-24VM ':    'Mil_Mi-24',
  'Mi-24VP ':    'Mil_Mi-24',
});

// ── MiG-23 Flogger variants ──
Object.assign(AC_MAP, {
  'MiG-23BN':    'Mikoyan-Gurevich_MiG-23BN',
  'MiG-23M ':    'Mikoyan-Gurevich_MiG-23',
  'MiG-23MF':    'Mikoyan-Gurevich_MiG-23',
  'MiG-23ML':    'Mikoyan-Gurevich_MiG-23ML',
  'MiG-23MLD':   'Mikoyan-Gurevich_MiG-23MLD',
  'MiG-23MS':    'Mikoyan-Gurevich_MiG-23',
  'MiG-23P ':    'Mikoyan-Gurevich_MiG-23',
  'MiG-23PD':    'Mikoyan-Gurevich_MiG-23',
});

// ── Su-17 Fitter variants ──
Object.assign(AC_MAP, {
  'Su-17 ':       'Sukhoi_Su-17',
  'Su-17M ':      'Sukhoi_Su-17M',
  'Su-17M-2':     'Sukhoi_Su-17',
  'Su-17M-3':     'Sukhoi_Su-17',
  'Su-17M-4':     'Sukhoi_Su-17',
});

// ── Su-24 Fencer variants ──
Object.assign(AC_MAP, {
  'Su-24 Fencer B':  'Sukhoi_Su-24',
  'Su-24 Fencer C':  'Sukhoi_Su-24',
  'Su-24M ':         'Sukhoi_Su-24M',
  'Su-24M2':         'Sukhoi_Su-24',
  'Su-24MP':         'Sukhoi_Su-24',
  'Su-24MR':         'Sukhoi_Su-24MR',
});

// ── Tu-142 / Tu-95 Bear variants ──
Object.assign(AC_MAP, {
  'Tu-142A ':    'Tupolev_Tu-142',
  'Tu-142M ':    'Tupolev_Tu-142',
  'Tu-142MK':    'Tupolev_Tu-142',
  'Tu-142MR':    'Tupolev_Tu-142',
  'Tu-142MZ':    'Tupolev_Tu-142',
  'Tu-95K':      'Tupolev_Tu-95',
  'Tu-95MR':     'Tupolev_Tu-95MR',
  'Tu-95MS':     'Tupolev_Tu-95MS',
  'Tu-95MSM':    'Tupolev_Tu-95',
  'Tu-95RT':     'Tupolev_Tu-95',
});

// ── Su-27 / Su-30 Flanker variants ──
Object.assign(AC_MAP, {
  'Su-27P ':     'Sukhoi_Su-27',
  'Su-27S ':     'Sukhoi_Su-27',
  'Su-27SM':     'Sukhoi_Su-27SM',
  'Su-30 ':      'Sukhoi_Su-30',
  'Su-30M2':     'Sukhoi_Su-30',
  'Su-30SM':     'Sukhoi_Su-30SM',
  'Su-30MK ':    'Sukhoi_Su-30MKI',
  'Su-30MKI':    'Sukhoi_Su-30MKI',
  'Su-30MKK':    'Sukhoi_Su-30MKK',
});

// ── MiG-31 Foxhound variants ──
Object.assign(AC_MAP, {
  'MiG-31 ':    'Mikoyan_MiG-31',
  'MiG-31B ':   'Mikoyan_MiG-31',
  'MiG-31BM':   'Mikoyan_MiG-31',
});

// ── MiG-27 Flogger D/J variants ──
Object.assign(AC_MAP, {
  'MiG-27 ':    'Mikoyan_MiG-27',
  'MiG-27K ':   'Mikoyan_MiG-27',
  'MiG-27M ':   'Mikoyan_MiG-27',
});

// ── MiG-21 Fishbed variants ──
Object.assign(AC_MAP, {
  'MiG-21bis Fishbed L': 'Mikoyan-Gurevich_MiG-21',
  'MiG-21bis Fishbed N': 'Mikoyan-Gurevich_MiG-21bis',
  'MiG-21bis UPG':       'Mikoyan-Gurevich_MiG-21',
  'MiG-21FL':            'Mikoyan-Gurevich_MiG-21',
  'MiG-21M ':            'Mikoyan-Gurevich_MiG-21',
  'MiG-21MF':            'Mikoyan-Gurevich_MiG-21',
  'MiG-21MT':            'Mikoyan-Gurevich_MiG-21',
  'MiG-21RF':            'Mikoyan-Gurevich_MiG-21',
  'MiG-21S ':            'Mikoyan-Gurevich_MiG-21',
  'MiG-21SM':            'Mikoyan-Gurevich_MiG-21',
});

// ── Ka-25/27 Hormone/Helix variants ──
Object.assign(AC_MAP, {
  'Ka-25BSh':    'Kamov_Ka-25',
  'Ka-25PS':     'Kamov_Ka-25',
  'Ka-25Ts':     'Kamov_Ka-25',
  'Ka-27M ':     'Kamov_Ka-27',
  'Ka-27PL':     'Kamov_Ka-27',
  'Ka-27PS':     'Kamov_Ka-27',
  'Ka-28 ':      'Kamov_Ka-28',
  'Ka-29RLD':    'Kamov_Ka-29',
  'Ka-29TB':     'Kamov_Ka-29',
  'Ka-52 ':      'Kamov_Ka-52',
  'Ka-52K':      'Kamov_Ka-52K',
});

// ── Mi-14 Haze variants ──
Object.assign(AC_MAP, {
  'Mi-14BT':    'Mil_Mi-14',
  'Mi-14PL ':   'Mil_Mi-14',
  'Mi-14PLM':   'Mil_Mi-14',
  'Mi-14PS':    'Mil_Mi-14',
});

// ── An-12 Cub variants ──
Object.assign(AC_MAP, {
  'An-12BK-IS':   'Antonov_An-12',
  'An-12BK-PP':   'Antonov_An-12',
  'An-12BK-PPS':  'Antonov_An-12',
  'An-12BK ':     'Antonov_An-12',
  'An-12BP':      'Antonov_An-12',
});

// ──────────────────────────────────────────────────────────────────────────────
// Chinese aircraft variant mappings
// ──────────────────────────────────────────────────────────────────────────────

// ── Y-8 / Y-9 Cub variants ──
Object.assign(AC_MAP, {
  'Y-8C ':    'Shaanxi_Y-8',
  'Y-8CA':    'Shaanxi_Y-8',
  'Y-8G ':    'Shaanxi_Y-8',
  'Y-8J ':    'Shaanxi_Y-8',
  'Y-8JB':    'Shaanxi_Y-8',
  'Y-8Q ':    'Shaanxi_Y-8',
  'Y-8T ':    'Shaanxi_Y-8',
  'Y-8W ':    'KJ-200',
  'Y-8X ':    'Shaanxi_Y-8',
  'Y-8XZ':    'Shaanxi_Y-8',
  'Y-8 ':     'Shaanxi_Y-8',
  'Y-9 ':     'Shaanxi_Y-9',
  'Y-9G ':    'Shaanxi_Y-9',
  'Y-9JB':    'Shaanxi_Y-9',
  'Y-9XZ':    'Shaanxi_Y-9',
});

// ── H-6 Badger variants ──
Object.assign(AC_MAP, {
  'H-6A ':    'Xian_H-6',
  'H-6C ':    'Xian_H-6',
  'H-6D ':    'Xian_H-6',
  'H-6E ':    'Xian_H-6',
  'H-6G ':    'Xian_H-6',
  'H-6H ':    'Xian_H-6',
  'H-6K ':    'Xian_H-6K',
  'H-6M ':    'Xian_H-6',
});

// ── J-7 Fishbed variants ──
Object.assign(AC_MAP, {
  'J-7C ':    'Chengdu_J-7',
  'J-7D ':    'Chengdu_J-7',
  'J-7E ':    'Chengdu_J-7',
  'J-7G ':    'Chengdu_J-7',
  'J-7I ':    'Chengdu_J-7',
  'J-7II':    'Chengdu_J-7',
});

// ── J-11 Flanker variants ──
Object.assign(AC_MAP, {
  'J-11 ':     'Shenyang_J-11',
  'J-11B ':    'Shenyang_J-11B',
  'J-11BH':    'Shenyang_J-11',
  'J-11BS':    'Shenyang_J-11',
  'J-11D ':    'Shenyang_J-11D',
});

// ── Z-9 Dauphin variants ──
Object.assign(AC_MAP, {
  'Z-9 ':     'Harbin_Z-9',
  'Z-9A ':    'Harbin_Z-9',
  'Z-9B ':    'Harbin_Z-9',
  'Z-9C ':    'Harbin_Z-9C',
  'Z-9D ':    'Harbin_Z-9',
  'Z-9W ':    'Harbin_Z-9',
  'Z-9WA':    'CAIC_WZ-10',
});

// ── J-8 Finback variants ──
Object.assign(AC_MAP, {
  'J-8A ':    'Shenyang_J-8',
  'J-8B ':    'Shenyang_J-8II',
  'J-8D ':    'Shenyang_J-8II',
  'J-8F ':    'Shenyang_J-8II',
  'J-8IE':    'Shenyang_J-8',
});

// ── Q-5 Fantan variants ──
Object.assign(AC_MAP, {
  'Q-5 ':     'Nanchang_Q-5',
  'Q-5C ':    'Nanchang_Q-5',
  'Q-5D ':    'Nanchang_Q-5',
  'Q-5I ':    'Nanchang_Q-5',
  'Q-5IA':    'Nanchang_Q-5',
});

// ── J-10 Vigorous Dragon variants ──
Object.assign(AC_MAP, {
  'J-10A ':    'Chengdu_J-10',
  'J-10AH':    'Chengdu_J-10',
  'J-10B ':    'Chengdu_J-10B',
  'J-10C ':    'Chengdu_J-10',
});

// ── Z-8 / Z-18 Super Frelon variants ──
Object.assign(AC_MAP, {
  'Z-8A ':     'Changhe_Z-8',
  'Z-8J ':     'Changhe_Z-8',
  'Z-8K ':     'Changhe_Z-8',
  'Z-18 Super':  'Changhe_Z-18',
  'Z-18FQ':      'Changhe_Z-18',
  'Z-18YJ':      'Changhe_Z-18',
});

// ── JH-7 Flounder variants ──
Object.assign(AC_MAP, {
  'JH-7 ':     'Xian_JH-7',
  'JH-7A ':    'Xian_JH-7A',
  'JH-7B ':    'Xian_JH-7',
});

// ──────────────────────────────────────────────────────────────────────────────
// French aircraft variant mappings
// ──────────────────────────────────────────────────────────────────────────────

// ── Mirage 2000 variants ──
Object.assign(AC_MAP, {
  'Mirage 2000-5':  'Dassault_Mirage_2000-5',
  'Mirage 2000C':   'Dassault_Mirage_2000',
  'Mirage 2000D':   'Dassault_Mirage_2000D',
  'Mirage 2000H':   'Dassault_Mirage_2000',
  'Mirage 2000N':   'Dassault_Mirage_2000N',
});

// ── Gazelle variants ──
Object.assign(AC_MAP, {
  'SA.341':    'Aérospatiale_Gazelle',
  'SA.342':    'Aérospatiale_Gazelle',
});

// ── Rafale variants ──
Object.assign(AC_MAP, {
  'Rafale B':   'Dassault_Rafale',
  'Rafale C':   'Dassault_Rafale',
  'Rafale M':   'Dassault_Rafale_M',
});

// ── Mirage F1 variants ──
Object.assign(AC_MAP, {
  'Mirage F.1C-200': 'Dassault_Mirage_F1',
  'Mirage F.1C ':    'Dassault_Mirage_F1',
  'Mirage F.1CR':    'Dassault_Mirage_F1',
  'Mirage F.1CT':    'Dassault_Mirage_F1',
  'Mirage F1C':      'Dassault_Mirage_F1',
  'Mirage F1CR':     'Dassault_Mirage_F1',
  'Mirage F1CT':     'Dassault_Mirage_F1',
});

// ── Mirage III variants ──
Object.assign(AC_MAP, {
  'Mirage IIIBJ':    'Dassault_Mirage_III',
  'Mirage IIIC':     'Dassault_Mirage_IIIC',
  'Mirage IIICJ':    'Dassault_Mirage_III',
  'Mirage IIIE':     'Dassault_Mirage_IIIE',
  'Mirage IIIRJ':    'Dassault_Mirage_III',
});

// ── Mirage IV variants ──
Object.assign(AC_MAP, {
  'Mirage IVA':   'Dassault_Mirage_IV',
  'Mirage IVP':   'Dassault_Mirage_IVP',
});

// ── Swedish Viggen / Draken variants ──
Object.assign(AC_MAP, {
  'AJ 37 ':    'Saab_37_Viggen',
  'JA 37 ':    'Saab_37_Viggen',
  'SF 37 ':    'Saab_37_Viggen',
  'SH 37 ':    'Saab_37_Viggen',
  'SK 37 ':    'Saab_37_Viggen',
  'SK 37E':    'Saab_37_Viggen',
  'J 35D ':    'Saab_35_Draken',
  'J 35F':     'Saab_35_Draken',
  'J 35J ':    'Saab_35_Draken',
  'JAS 39A':   'Saab_JAS_39_Gripen',
  'JAS 39B':   'Saab_JAS_39_Gripen',
  'JAS 39C':   'Saab_JAS_39_Gripen',
  'JAS 39D':   'Saab_JAS_39_Gripen',
  'JAS 39E':   'Saab_JAS_39E/F_Gripen',
  'JAS 39F':   'Saab_JAS_39E/F_Gripen',
});

// ── Krivak/Petya (Soviet frigates → resolve via aircraft names too) ──
// ── Israeli aircraft variants ──
Object.assign(AC_MAP, {
  'Kfir C.2':   'IAI_Kfir',
  'Kfir C.7':   'IAI_Kfir',
  'Nesher S':   'IAI_Nesher',
  'Nesher T':   'IAI_Nesher',
  'Hermes 450': 'Elbit_Hermes_450',
  'Hermes 900': 'Elbit_Hermes_900',
  'Heron TP':   'IAI_Eitan',
  'Heron UAV':  'IAI_Heron',
  'Searcher I':  'IAI_Searcher',
  'Searcher II': 'IAI_Searcher',
});

// ── US unmapped aircraft ──
Object.assign(AC_MAP, {
  // A-series attack / light attack
  'A-37B':        'Cessna_A-37_Dragonfly',

  // AH/MH-6 Little Bird family
  'AH-6':         'MD_Helicopters_MH-6_Little_Bird',
  'MH-6':         'MD_Helicopters_MH-6_Little_Bird',

  // Airborne Laser
  'AL-1A':        'Boeing_YAL-1',

  // Aerostat systems
  'AN/TPS-63':    'Tethered_Aerostat_Radar_System',
  'TIF-25K':      'Tethered_Aerostat_Radar_System',

  // BQM/MQM/FQM UAV targets
  'BQM-74':       'BQM-74_Chukar',
  'MQM-74':       'BQM-74_Chukar',
  'FQM-151':      'FQM-151_Pointer',

  // C-series transports
  'C-32':         'Boeing_C-32',
  'C-40':         'Boeing_C-40_Clipper',
  'C-9A':         'McDonnell_Douglas_C-9',
  'C-9B':         'McDonnell_Douglas_C-9',
  'C-9C':         'McDonnell_Douglas_C-9',

  // V-22 Osprey variants
  'CMV-22':       'Bell_Boeing_V-22_Osprey',
  'CV-22':        'Bell_Boeing_V-22_Osprey',
  'MV-22':        'Bell_Boeing_V-22_Osprey',

  // E-4B NAOC
  'E-4B':         'Boeing_E-4',

  // EA/KA-3 Skywarrior variants
  'EA-3B':        'Douglas_A-3_Skywarrior',
  'KA-3B':        'Douglas_A-3_Skywarrior',

  // EF-111 Raven
  'EF-111':       'General_Dynamics–Grumman_EF-111A_Raven',

  // EH-60 Quick Fix
  'EH-60':        'Sikorsky_UH-60_Black_Hawk',

  // EO-5 / O-5 ARL (DHC-7 based)
  'EO-5B':        'de_Havilland_Canada_DHC-7',
  'EO-5C':        'de_Havilland_Canada_DHC-7',
  'O-5A':         'de_Havilland_Canada_DHC-7',

  // ES-3 Shadow / S-3 Viking
  'ES-3A':        'Lockheed_S-3_Viking',
  'S-3':          'Lockheed_S-3_Viking',

  // FB-111 Aardvark
  'FB-111':       'General_Dynamics_F-111_Aardvark',

  // HC-130 Hercules variants
  'HC-130':       'Lockheed_HC-130',

  // HC-144 Ocean Sentry
  'HC-144':       'EADS_HC-144_Ocean_Sentry',

  // HU-25 Guardian
  'HU-25':        'Dassault_HU-25_Guardian',

  // KA-6D Intruder
  'KA-6D':        'Grumman_A-6_Intruder',

  // MC-12W Liberty
  'MC-12':        'Beechcraft_King_Air',

  // MC-130 variants
  'MC-130':       'Lockheed_MC-130',

  // MH-47 Chinook
  'MH-47':        'Boeing_CH-47_Chinook',

  // MH-53 variants
  'MH-53E':       'Sikorsky_CH-53E_Super_Stallion',
  'MH-53J':       'Sikorsky_MH-53_Pave_Low',

  // MH-68 Enforcer
  'MH-68':        'Agusta_A109',

  // MQ-5 / RQ-5 Hunter UAV
  'MQ-5':         'RQ-5_Hunter',
  'RQ-5':         'RQ-5_Hunter',

  // MQ-8 Fire Scout
  'MQ-8':         'Northrop_Grumman_MQ-8_Fire_Scout',

  // O-2A Super Skymaster
  'O-2A':         'Cessna_O-2_Skymaster',

  // OA-10 Thunderbolt II
  'OA-10':        'Fairchild-Republic_A-10_Thunderbolt_II',

  // OH-6A Cayuse
  'OH-6A':        'Hughes_OH-6_Cayuse',

  // OV-1 / RV-1 Mohawk
  'OV-1D':        'Grumman_OV-1_Mohawk',
  'RV-1D':        'Grumman_OV-1_Mohawk',

  // RA-5C Vigilante
  'RA-5C':        'North_American_A-5_Vigilante',

  // RC-12 Guardrail
  'RC-12':        'Beechcraft_RC-12_Guardrail',

  // RF-8G Crusader
  'RF-8G':        'Vought_F-8_Crusader',

  // RH-53D Sea Stallion
  'RH-53D':       'Sikorsky_CH-53_Sea_Stallion',

  // RQ-180 UAV
  'RQ-180':       'Northrop_Grumman',

  // RQ-1 Predator
  'RQ-1':         'General_Atomics_MQ-1_Predator',

  // RQ-21 Blackjack
  'RQ-21':        'RQ-21_Blackjack',

  // RQ-2 Pioneer
  'RQ-2':         'AAI_RQ-2_Pioneer',

  // RQ-7 Shadow
  'RQ-7':         'AAI_RQ-7_Shadow',

  // SH-2 Seasprite
  'SH-2':         'Kaman_SH-2_Seasprite',

  // TF-16N Falcon
  'TF-16N':       'General_Dynamics_F-16_Fighting_Falcon',

  // UH-46 Sea Knight
  'UH-46':        'Boeing_Vertol_CH-46_Sea_Knight',

  // UH-72 Lakota
  'UH-72':        'Eurocopter_UH-72_Lakota',

  // VC-25 Air Force One
  'VC-25':        'Boeing_VC-25',
});

// ══════════════════════════════════════════════════════════════════════════════
// BATCH 2 — Non-US country aircraft mappings
// ══════════════════════════════════════════════════════════════════════════════

Object.assign(AC_MAP, {
  // ── UK (RAF / RN designations) ──────────────────────────────────────────────
  'Airseeker':            'Boeing_RC-135',
  'Apache AH':            'AgustaWestland_Apache',
  'Atlas C':              'Airbus_A400M_Atlas',
  'Chinook HC':           'Boeing_CH-47_Chinook',
  'DA-42MPP':             'Diamond_DA42',
  'Falcon 20F':           'Dassault_Falcon_20',
  'Globemaster III':      'Boeing_C-17_Globemaster_III',
  'Hercules C.':          'Lockheed_C-130_Hercules',
  'Jindivik':             'GAF_Jindivik',
  'Meteor TT':            'Gloster_Meteor',
  'Mirach 100':           'Target_drone',
  'Phantom II':           'McDonnell_Douglas_F-4_Phantom_II',
  'Reaper UAV':           'General_Atomics_MQ-9_Reaper',
  'ScanEagle UAV':        'Boeing_Insitu_ScanEagle',
  'Scout AH':             'Westland_Scout',
  'Sentinel R':           'Raytheon_Sentinel',
  'Sentry AEW':           'Boeing_E-3_Sentry',
  'Shadow R':             'Raytheon_Sentinel',
  'Statesman C':          'British_Aerospace_146',
  'Statesman CC':         'British_Aerospace_146',
  'T.67M':                'Slingsby_Firefly',
  'Tristar C':            'Lockheed_L-1011_TriStar',
  'Tristar K':            'Lockheed_L-1011_TriStar',
  'Tristar KC':           'Lockheed_L-1011_TriStar',
  'Typhoon F.':           'Eurofighter_Typhoon',
  'Typhoon T.':           'Eurofighter_Typhoon',
  'Victor K':             'Handley_Page_Victor',
  'Voyager KC':           'Airbus_A330_MRTT',
  'Wasp HAS':             'Westland_Wasp',
  'Watchkeeper':          'Thales_Watchkeeper_WK450',
  'Wessex HAS':           'Westland_Wessex',
  'Wessex HC':            'Westland_Wessex',
  'Wessex HU':            'Westland_Wessex',
  'Wildcat AH':           'AgustaWestland_Wildcat',
  'Wildcat HMA':          'AgustaWestland_Wildcat',
});

Object.assign(AC_MAP, {
  // ── Sweden (Swedish AF designations) ────────────────────────────────────────
  'AJS 37':               'Saab_37_Viggen',
  'AJSF 37':              'Saab_37_Viggen',
  'AJSH 37':              'Saab_37_Viggen',
  'HKp 14E':              'Sikorsky_UH-60_Black_Hawk',
  'HKp 14F':              'Sikorsky_UH-60_Black_Hawk',
  'Hkp 15':               'AgustaWestland_A109',
  'Hkp 16':               'Sikorsky_UH-60_Black_Hawk',
  'Hkp 2':                'Aérospatiale_Alouette_II',
  'Hkp 6':                'Bell_206',
  'Hkp 9':                'MBB_Bo_105',
  'KBV 501':              'CASA_C-212_Aviocar',
  'S 100B':               'Saab_340',
  'S 102B':               'Gulfstream_IV',
  'S 35E':                'Saab_35_Draken',
  'SH 89':                'CASA_C-212_Aviocar',
  'SK 60':                'Saab_105',
  'TP 84':                'Lockheed_C-130_Hercules',
  'TP 85':                'Lockheed_C-130_Hercules',
  'UAV 01':               'Sagem_Sperwer',
  'UAV 03':               'AAI_RQ-7_Shadow',
});

Object.assign(AC_MAP, {
  // ── Argentina ───────────────────────────────────────────────────────────────
  'AS.555':               'Eurocopter_Fennec',
  'Boeing 707-387C':      'Boeing_707',
  'Dagger':               'IAI_Nesher',
  'IA-58A':               'FMA_IA_58_Pucará',
  'IA-63':                'FMA_IA_63_Pampa',
  'L-188A':               'Lockheed_L-188_Electra',
  'Learjet 35A':          'Learjet_35',
  'P-2H':                 'Lockheed_P-2_Neptune',
  'P-95':                 'Embraer_EMB_111',
  'S-2E':                 'Grumman_S-2_Tracker',
  'S-2T':                 'Grumman_S-2_Tracker',
  'SA.319B':              'Aérospatiale_Alouette_III',
  'SC.7':                 'Short_SC.7_Skyvan',
  'T-34C':                'Beechcraft_T-34_Mentor',
  'TA-4AR':               'McDonnell_Douglas_A-4_Skyhawk',
});

Object.assign(AC_MAP, {
  // ── Israel ──────────────────────────────────────────────────────────────────
  'Boeing 707':           'Boeing_707',
  'Aerostat':            'Aerostat',
  'Gulfstream G550':      'Gulfstream_G550',
  'IAI 1124N':            'IAI_1124_Westwind',
  'IAI 201':              'IAI_Arava',
  'IAI 202':              'IAI_Arava',
  'Mastiff':              'Tadiran_Mastiff',
  'MD-500MD':             'MD_Helicopters_MD_500',
  'SA.366G':              'Eurocopter_AS365_Dauphin',
  'Scout UAV':            'IAI_Scout',
  'TA-4H':                'McDonnell_Douglas_A-4_Skyhawk',
});

Object.assign(AC_MAP, {
  // ── Australia ───────────────────────────────────────────────────────────────
  'Airbus A.330':         'Airbus_A330_MRTT',
  'AP-3C':                'Lockheed_P-3_Orion',
  'AS.350BA':             'Eurocopter_AS350_Écureuil',
  'BN-2':                 'Britten-Norman_Islander',
  'Boeing 707-338C':      'Boeing_707',
  'Boeing 737-700':       'Boeing_Business_Jet',
  'Dash-8':               'De_Havilland_Canada_Dash_8',
  'DHC-4':                'de_Havilland_Canada_DHC-4_Caribou',
  'F406':                 'Reims-Cessna_F406_Caravan_II',
  'King Air 350':         'Beechcraft_King_Air',
  'Pilatus PC-9':         'Pilatus_PC-9',
  'RF-111C':              'General_Dynamics_F-111C',
  'S-2G':                 'Grumman_S-2_Tracker',
  'SH-2G':                'Kaman_SH-2_Seasprite',
  'TA-4G':                'McDonnell_Douglas_A-4_Skyhawk',
});

Object.assign(AC_MAP, {
  // ── Brazil ──────────────────────────────────────────────────────────────────
  'A-29':                 'Embraer_EMB_314_Super_Tucano',
  'AS.350B':              'Eurocopter_AS350_Écureuil',
  'AT-27':                'Embraer_EMB_312_Tucano',
  'C-95':                 'Embraer_EMB_110_Bandeirante',
  'C/P-95':               'Embraer_EMB_110_Bandeirante',
  'EMB-145 AEWC':         'Embraer_R-99',
  'EMB-145 RS':           'Embraer_R-99',
  'Embraer KC-390':       'Embraer_C-390_Millennium',
  'KC-137':               'Boeing_707',
  'P-95':                 'Embraer_EMB_111',
  'S-2E':                 'Grumman_S-2_Tracker',
  'T-27':                 'Embraer_EMB_312_Tucano',
  'TA-4KU':               'McDonnell_Douglas_A-4_Skyhawk',
  'Wasp HAS':             'Westland_Wasp',
});

Object.assign(AC_MAP, {
  // ── France ──────────────────────────────────────────────────────────────────
  'A.400M':               'Airbus_A400M_Atlas',
  'Airbus A.330-200':     'Airbus_A330_MRTT',
  'BR.1050':              'Breguet_Alizé',
  'C.160':                'Transall_C-160',
  'CL.289':               'Canadair_CL-89',
  'Douglas DC-8':         'Douglas_DC-8',
  'Harfang':              'IAI_Heron',
  'nEUROn':               'Dassault_nEUROn',
  'SA.365F':              'Eurocopter_AS365_Dauphin',
  'SA.532':               'Eurocopter_AS532_Cougar',
  'Sperwer UAV':          'Sagem_Sperwer',
});

Object.assign(AC_MAP, {
  // ── South Africa ────────────────────────────────────────────────────────────
  'Boeing 707-328C':      'Boeing_707',
  'C-47':                 'Douglas_C-47_Skytrain',
  'C.160Z':               'Transall_C-160',
  'Cheetah':              'Atlas_Cheetah',
  'MB.326KC':             'Aermacchi_MB-326',
  'MB.326M':              'Aermacchi_MB-326',
  'Rooivalk':             'Denel_Rooivalk',
  'Seeker':               'Unmanned_aerial_vehicle',
  'Vulture UAV':          'Unmanned_aerial_vehicle',
});

Object.assign(AC_MAP, {
  // ── Canada ──────────────────────────────────────────────────────────────────
  'Bo-105':               'MBB_Bo_105',
  'Boeing 707-347C':      'Boeing_707',
  'CC-150':               'Airbus_CC-150_Polaris',
  'CH-124':               'Sikorsky_CH-124_Sea_King',
  'CH-146':               'Bell_CH-146_Griffon',
  'CH-148':               'Sikorsky_CH-148_Cyclone',
  'CH-149':               'AgustaWestland_CH-149_Cormorant',
  'EF-101B':              'McDonnell_F-101_Voodoo',
  'RF-5A':                'Northrop_F-5',
  'Sperwer':              'Sagem_Sperwer',
  'TF-104G':              'Lockheed_F-104_Starfighter',
});

Object.assign(AC_MAP, {
  // ── Soviet (additional) ─────────────────────────────────────────────────────
  '3MN-1':                'Myasishchev_M-4',
  '3MS-1':                'Myasishchev_M-4',
  '3MS-2':                'Myasishchev_M-4',
  'A-90':                 'A-90_Orlyonok',
  'An-74':                'Antonov_An-74',
  'AS-2':                 'Air-to-surface_missile',
  'KM-08':                'Lun-class_ekranoplan',
  'Mi-10':                'Mil_Mi-10',
  'Tu-123':               'Tupolev_Tu-123',
  'Tu-126':               'Tupolev_Tu-126',
  'Tu-128':               'Tupolev_Tu-128',
  'Tu-141':               'Tupolev_Tu-141',
  'Tu-143':               'Tupolev_Tu-141',
  'Tu-243':               'Tupolev_Tu-141',
});

// ══════════════════════════════════════════════════════════════════════════════
// BATCH 3 — All remaining countries' missing aircraft
// ══════════════════════════════════════════════════════════════════════════════

Object.assign(AC_MAP, {
  // ── Italian designations ──────────────────────────────────────────────────
  'ATR-42':               'ATR_42',
  'ATR-72':               'ATR_72',
  'G.91R':                'Fiat_G.91',
  'G.91Y':                'Fiat_G.91Y',
  'MC-27J':               'Alenia_C-27J_Spartan',
  'PD.808':               'Piaggio_PD-808',
  'RF-104G':              'Lockheed_F-104_Starfighter',
  'SF.260':               'SIAI-Marchetti_SF.260',
  'S.211':                'SIAI-Marchetti_S.211',

  // ── Russian designations ──────────────────────────────────────────────────
  'Il-96':                'Ilyushin_Il-96',
  'Ka-60':                'Kamov_Ka-60',
  'MiG-35':               'Mikoyan_MiG-35',
  'Tu-214':               'Tupolev_Tu-214',

  // ── Pakistani designations ────────────────────────────────────────────────
  'A-5C':                 'Nanchang_Q-5',
  'Burraq':               'Burraq_(UCAV)',
  'F-6A':                 'Shenyang_J-6',
  'F-7':                  'Chengdu_F-7',
  'F.27':                 'Fokker_F27',
  'Falco UAV':            'Selex_ES_Falco',
  'K-8':                  'Hongdu_JL-8',
  'Saab 2000':            'Saab_2000',
  'Y8F':                  'Shaanxi_Y-8',

  // ── UAE designations ──────────────────────────────────────────────────────
  'AS.550':               'Eurocopter_Fennec',
  'IOMAX':                'IOMAX_Archangel',
  'United 40':            'Unmanned_combat_aerial_vehicle',

  // ── Japanese designations ─────────────────────────────────────────────────
  'EC.225':               'Eurocopter_EC225_Super_Puma',
  'HSS-2':                'Sikorsky_SH-3_Sea_King',
  'OH-6D':                'Hughes_OH-6_Cayuse',
  'OH-6J':                'Hughes_OH-6_Cayuse',
  'P-2J':                 'Kawasaki_P-2J',
  'PS-1':                 'ShinMaywa_PS-1',

  // ── Taiwanese designations ────────────────────────────────────────────────
  'AT-3A':                'AIDC_AT-3',
  'F-CK-1':               'AIDC_F-CK-1_Ching-kuo',
  'MD-500M':              'MD_Helicopters_MD_500',

  // ── Chinese designations ──────────────────────────────────────────────────
  'CSA-':                 'Shaanxi_Y-9',
  'HD-5':                 'Harbin_H-5',
  'HY-6':                 'Xian_H-6',
  'HZ-5':                 'Harbin_H-5',
  'HZ-6':                 'Xian_H-6',
  'JZ-8':                 'Shenyang_J-8',
  'L-15':                 'Hongdu_L-15',
  'Y-5':                  'Shijiazhuang_Y-5',
  'CH-3 UAV':             'CASC_Rainbow',

  // ── Colombian designations ────────────────────────────────────────────────
  'AH-60':                'Sikorsky_UH-60_Black_Hawk',
  'OT-47B':               'Grumman_S-2_Tracker',

  // ── German designations ───────────────────────────────────────────────────
  'Airbus A.310':         'Airbus_A310_MRTT',
  'Brevel KZO':           'Rheinmetall',

  // ── Spanish designations ──────────────────────────────────────────────────
  'Falcon 20C':           'Dassault_Falcon_20',
  'Falcon 50':            'Dassault_Falcon_50',

  // ── Iranian designations ──────────────────────────────────────────────────
  'Bell 214':             'Bell_214',
  'KC-25':                'Boeing_747',
  'Mohajer':              'Unmanned_aerial_vehicle',
  'Shahed-129':           'Shahed_129',
  'T-33':                 'Lockheed_T-33',

  // ── Dutch designations ────────────────────────────────────────────────────
  'KDC-10':               'McDonnell_Douglas_KDC-10',

  // ── Multi-country types ───────────────────────────────────────────────────
  'AC-235':               'Airbus_C295',
  'AC-295':               'Airbus_C295',
  'Cessna AC-208':        'Cessna_208_Caravan',
  'Bombardier Challenger': 'Bombardier_Challenger_600_series',
  'Gulfstream III':       'Gulfstream_III',
  'Hunter':               'Hawker_Hunter',
  'Strikemaster':         'BAC_Strikemaster',
  'Super Mystere':        'Dassault_Super_Mystère',
  'G-4':                  'Soko_G-4_Super_Galeb',
  'J-21':                 'Soko_J-21_Jastreb',
  'J-22':                 'Soko_J-22_Orao',
  'TA-4':                 'McDonnell_Douglas_A-4_Skyhawk',
  'TA-50':                'KAI_T-50_Golden_Eagle',
  'Pilatus PC-7':         'Pilatus_PC-7',
  'DHC-5':                'de_Havilland_Canada_DHC-5_Buffalo',
  'DHC-6':                'de_Havilland_Canada_DHC-6_Twin_Otter',
  'O-1A':                 'Cessna_O-1_Bird_Dog',
  'AW.139':               'AgustaWestland_AW139',
  'S-92':                 'Sikorsky_S-92',
  'N22S':                 'GAF_Nomad',
  'IAR-330':              'IAR_330',
  'Avro RJ':              'British_Aerospace_146',
  'Super King Air':       'Beechcraft_Super_King_Air',
  'Boeing 737-2':         'Boeing_737',
  'Boeing 757':           'Boeing_757',
  'ALH ':                 'HAL_Dhruv',
  'LCA ':                 'HAL_Tejas',
  'Ajeet':                'HAL_Ajeet',
  'Pegasus UAV':          'Elbit_Hermes_450',
  'F.50':                 'Fokker_50',
  'F.60':                 'Fokker_50',
  'RC-130H':              'Lockheed_C-130_Hercules',
  'UP-3':                 'Lockheed_P-3_Orion',
  'W-3':                  'PZL_W-3_Sokol',
  'M28B':                 'PZL_M28_Skytruck',
  'S-2F':                 'Grumman_S-2_Tracker',
  'Learjet 36':           'Learjet_35',
});

// ── Final stragglers ─────────────────────────────────────────────────────────
Object.assign(AC_MAP, {
  'EMB-145H':             'Embraer_R-99',
  'EMB-145I':             'Embraer_R-99',
  'Pegasus I':            'Elbit_Hermes_450',
  'Pegasus II':           'Elbit_Hermes_450',
  'AB.412':               'Bell_412',
  'KE-3A':                'Boeing_E-3_Sentry',
  'RE-3A':                'Boeing_E-3_Sentry',
  'RF-35':                'Saab_35_Draken',
  'TF-35':                'Saab_35_Draken',
  'Scout [':              'IAI_Scout',
  'TF-104S':              'Lockheed_F-104_Starfighter',
  'MD-500F':              'MD_Helicopters_MD_500',
  'CH-3 [':               'CASC_Rainbow',
  'PZL M28B':             'PZL_M28_Skytruck',
  'Falcon 20D':           'Dassault_Falcon_20',
});

function getAcWiki(name) {
  const keys = Object.keys(AC_MAP).sort((a,b) => b.length - a.length);
  for (const k of keys) { if (name.startsWith(k)) return AC_MAP[k]; }
  // Fallback: try extracting NATO reporting name for lookup
  return null;
}

// ─── Ships ───────────────────────────────────────────────────────────────────
const SHIP_MAP = {
  // Soviet/Russian hull class names (NATO or project names)
  'Admiral Gorshkov':    'Admiral_Gorshkov-class_frigate',
  'Admiral Grigorovich': 'Admiral_Grigorovich-class_frigate',
  'Admiral Kuznetsov':   'Russian_aircraft_carrier_Admiral_Kuznetsov',
  'Akula':               'Akula-class_submarine',
  'Alfa':                'Alfa-class_submarine',
  'Altay':               'Tanker_(ship)',
  'Boris Chilikin':      'Boris_Chilikin-class_fleet_oiler',
  'Buyan':               'Buyan-class_corvette',
  'Charlie':             'Charlie-class_submarine',
  'Delta':               'Delta-class_submarine',
  'Echo':                'Echo-class_submarine',
  'Foxtrot':             'Foxtrot-class_submarine',
  'Golf':                'Golf-class_submarine',
  'Goryn':               'Goryn-class_tugboat',
  'Grisha':              'Grisha-class_corvette',
  'Hotel':               'Hotel-class_submarine',
  'Ivan Gren':           'Ivan_Gren-class_landing_ship',
  'Ivan Rogov':          'Ivan_Rogov-class_landing_ship',
  'Juliet':              'Juliet-class_submarine',
  'Kashin':              'Kashin-class_destroyer',
  'Kilo':                'Kilo-class_submarine',
  'Kirov':               'Kirov-class_battlecruiser',
  'Kotlin':              'Kotlin-class_destroyer',
  'Koni':                'Koni-class_frigate',
  'Krivak':              'Krivak-class_frigate',
  'Kuznetsov':           'Russian_aircraft_carrier_Admiral_Kuznetsov',
  'Lada':                'Lada-class_submarine',
  'Matka':               'Matka-class_missile_boat',
  'Mirka':               'Mirka-class_frigate',
  'Molniya':             'Molniya-class_missile_boat',
  'Moskva':              'Moskva-class_helicopter_carrier',
  'Nanuchka':            'Nanuchka-class_corvette',
  'Natya':               'Natya-class_minesweeper',
  'Neustrashimy':        'Neustrashimyy-class_frigate',
  'November':            'Submarine',
  'Osa':                 'Osa-class_missile_boat',
  'Oscar':               'Oscar-class_submarine',
  'Parchim':             'Parchim-class_corvette',
  'Pauk':                'Pauk-class_corvette',
  'Petya':               'Petya-class_frigate',
  'Polnochny':           'Polnochny-class_landing_ship',
  'Polnocny':            'Polnochny-class_landing_ship',
  'Poti':                'Poti-class_corvette',
  'Pr.':                 'Russian_Navy',
  'Riga':                'Riga-class_frigate',
  'Ropucha':             'Ropucha-class_landing_ship',
  'Sarych':              'Sovremenny-class_destroyer',
  'Sierra':              'Sierra-class_submarine',
  'Slava':               'Slava-class_cruiser',
  'Sonya':               'Sonya-class_minesweeper',
  'Sovremennyy':         'Sovremenny-class_destroyer',
  'Steregushchiy':       'Steregushchiy-class_corvette',
  'Stenka':              'Stenka-class_patrol_boat',
  'Sverdlov':            'Sverdlov-class_cruiser',
  'Tarantul':            'Tarantul-class_corvette',
  'Tango':               'Tango-class_submarine',
  'Typhoon':             'Typhoon-class_submarine',
  'Udaloy':              'Udaloy-class_destroyer',
  'Victor':              'Victor-class_submarine',
  'Vishnya':             'Vishnya-class_intelligence_ship',
  'Whiskey':             'Whiskey-class_submarine',
  'Yankee':              'Yankee-class_submarine',
  'Yasny':               'Steregushchiy-class_corvette',
  'Yasen':               'Yasen-class_submarine',
  'Zubr':                'Zubr-class_LCAC',
  'Alligator':           'Alligator-class_landing_ship',
  'Pomornik':            'Zubr-class_LCAC',
  'Ugra':                'Ugra-class_submarine_tender',
  'Berezina':            'Replenishment_oiler',
  'Balzam':              'Balzam-class_intelligence_ship',
  'Primorye':            'Intelligence_ship',
  'Smolnyy':             'Smolnyy-class_training_ship',
  'Dubna':               'Dubna-class_tanker',
  'Ingul':               'Ingul-class_tugboat',
  'Kresta':              'Kresta_I-class_cruiser',
  'Kara':                'Kara-class_cruiser',
  'Kanin':               'Kanin-class_destroyer',
  'Kildin':              'Kildin-class_destroyer',
  'Kynda':               'Kynda-class_cruiser',
  'Skory':               'Skoryy-class_destroyer',
  'Sverdlov':            'Sverdlov-class_cruiser',
  'Chapayev':            'Chapayev-class_cruiser',
  // Chinese Type-numbered ships
  'Type 001':  'Chinese_aircraft_carrier_Liaoning',
  'Type 021':  'Missile_boat',
  'Type 022':  'Type_022_missile_boat',
  'Type 033':  'Romeo-class_submarine',
  'Type 035':  'Ming-class_submarine',
  'Type 037':  'Hainan-class_submarine_chaser',
  'Type 039':  'Type_039_submarine',
  'Type 041':  'Yuan-class_submarine',
  'Type 051B': 'Type_051B_destroyer',
  'Type 051C': 'Type_051C_destroyer',
  'Type 051G': 'Type_051_destroyer',
  'Type 051 ': 'Type_051_destroyer',
  'Type 052B': 'Type_052B_destroyer',
  'Type 052C': 'Type_052C_destroyer',
  'Type 052D': 'Destroyer',
  'Type 052 ': 'Type_052_destroyer',
  'Type 053':  'Type_053_frigate',
  'Type 054A': 'Type_054A_frigate',
  'Type 054 ': 'Type_054_frigate',
  'Type 055':  'Type_055_destroyer',
  'Type 056':  'Type_056_corvette',
  'Type 062':  'Gunboat',
  'Type 071':  'Type_071_amphibious_transport_dock',
  'Type 072':  'Type_072_tank_landing_ship',
  'Type 081':  'Minesweeper',
  'Type 082':  'Minesweeper',
  'Type 091':  'Type_091_submarine',
  'Type 092':  'Submarine',
  'Type 093':  'Submarine',
  'Type 094':  'Type_094_submarine',
  'Type 726':  'Air-cushioned_landing_craft',
  'Type 901':  'Type_901_replenishment_ship',
  'Type 903':  'Type_903_replenishment_ship',
  'Type 920':  'Chinese_hospital_ship_Peace_Ark',
  'Yuan Wang': 'Tracking_ship',
  'DDG 1':     'Type_051B_destroyer',
  'S 3':       'Romeo-class_submarine',
  'Bohai':     'People\'s_Liberation_Army_Navy',
  // Generic fallbacks
  'SS ':                 'Submarine',
  'SSG':                 'Submarine',
  'SSN':                 'Submarine',
  'SSBN':                'Submarine',
  'SSGN':                'Submarine',
};

// ── Western/NATO Ships (added to SHIP_MAP inline) ─────────────────────────────
Object.assign(SHIP_MAP, {
  // US Navy
  'Nimitz':            'Nimitz-class_aircraft_carrier',
  'Gerald R. Ford':    'Gerald_R._Ford-class_aircraft_carrier',
  'Enterprise':        'USS_Enterprise_(CVN-65)',
  'Ticonderoga':       'Ticonderoga-class_cruiser',
  'Arleigh Burke':     'Arleigh_Burke-class_destroyer',
  'Zumwalt':           'Zumwalt-class_destroyer',
  'Oliver Hazard Perry':'Oliver_Hazard_Perry-class_frigate',
  'Spruance':          'Spruance-class_destroyer',
  'Kidd':              'Kidd-class_destroyer',
  'Forrest Sherman':   'Forrest_Sherman-class_destroyer',
  'Charles F. Adams':  'Charles_F._Adams-class_destroyer',
  'Tarawa':            'Tarawa-class_amphibious_assault_ship',
  'Wasp':              'Wasp-class_amphibious_assault_ship',
  'America':           'America-class_amphibious_assault_ship',
  'San Antonio':       'San_Antonio-class_amphibious_transport_dock',
  'Whidbey Island':    'Whidbey_Island-class_dock_landing_ship',
  'Harpers Ferry':     'Harpers_Ferry-class_dock_landing_ship',
  'Los Angeles':       'Los_Angeles-class_submarine',
  'Virginia':          'Virginia-class_submarine',
  'Ohio':              'Ohio-class_submarine',
  'Seawolf':           'Seawolf-class_submarine',
  'Sturgeon':          'Sturgeon-class_submarine',
  'Knox':              'Knox-class_frigate',
  'Garcia':            'Garcia-class_frigate',
  'Avenger':           'Avenger-class_mine_countermeasures_ship',
  // UK Royal Navy
  'Queen Elizabeth':   'Queen_Elizabeth-class_aircraft_carrier',
  'Invincible':        'Invincible-class_aircraft_carrier',
  'Type 45':           'Type_45_destroyer',
  'Type 42':           'Type_42_destroyer',
  'Type 23':           'Type_23_frigate',
  'Type 22':           'Type_22_frigate',
  'Type 21':           'Type_21_frigate',
  'Astute':            'Astute-class_submarine',
  'Trafalgar':         'Trafalgar-class_submarine',
  'Swiftsure':         'Swiftsure-class_submarine',
  'Vanguard':          'Vanguard-class_submarine',
  'County':            'County-class_destroyer',
  'Sheffield':         'Type_42_destroyer',
  'Hunt':              'Hunt-class_mine_countermeasures_vessel',
  'River':             'River-class_offshore_patrol_vessel',
  // French Navy
  'Charles de Gaulle': 'French_aircraft_carrier_Charles_de_Gaulle',
  'Foch':              'French_aircraft_carrier_Foch',
  'Horizon':           'Horizon-class_frigate',
  'FREMM':             'FREMM_multipurpose_frigate',
  'La Fayette':        'La_Fayette-class_frigate',
  'Georges Leygues':   'Georges_Leygues-class_frigate',
  'Suffren':           'Suffren-class_frigate',
  'Triomphant':        'Triomphant-class_submarine',
  'Rubis':             'Rubis-class_submarine',
  'Cassard':           'Cassard-class_frigate',
  // German Navy
  'Sachsen':           'Sachsen-class_frigate',
  'Brandenburg':       'Brandenburg-class_frigate',
  'Bremen':            'Bremen-class_frigate',
  'Hamburg':           'Hamburg-class_destroyer',
  'Type 212':          'Type_212_submarine',
  'Type 206':          'Type_206_submarine',
  'Type 143':          'Type_143_missile_boat',
  // Italian Navy
  'Cavour':            'Italian_aircraft_carrier_Cavour',
  'Garibaldi':         'Italian_aircraft_carrier_Giuseppe_Garibaldi',
  'Horizon':           'Horizon-class_frigate',
  'Maestrale':         'Maestrale-class_frigate',
  'Lupo':              'Lupo-class_frigate',
  'Sauro':             'Sauro-class_submarine',
  // Spanish Navy
  'Juan Carlos I':     'Spanish_ship_Juan_Carlos_I',
  'Alvaro de Bazan':   'Álvaro_de_Bazán-class_frigate',
  'Santa Maria':       'Santa_María-class_frigate',
  'Galerna':           'Galerna-class_submarine',
  // Dutch Navy
  'De Zeven Provincien':'De_Zeven_Provinciën-class_frigate',
  'Karel Doorman':     'Karel_Doorman-class_frigate',
  'Walrus':            'Walrus-class_submarine',
  // Norwegian Navy
  'Nansen':            'Fridtjof_Nansen-class_frigate',
  'Ula':               'Ula-class_submarine',
  'Skjold':            'Skjold-class_corvette',
  'Hauk':              'Torpedo_boat',
  // Swedish Navy
  'Gotland':           'Gotland-class_submarine',
  'Visby':             'Visby-class_corvette',
  // Japanese JMSDF
  'Kongo':             'Kongō-class_destroyer',
  'Atago':             'Atago-class_destroyer',
  'Maya':              'Maya-class_destroyer',
  'Asahi':             'Asahi-class_destroyer',
  'Izumo':             'Izumo-class_helicopter_destroyer',
  'Hyuga':             'Hyūga-class_helicopter_destroyer',
  'Soryu':             'Sōryū-class_submarine',
  'Oyashio':           'Oyashio-class_submarine',
  // Australian RAN
  'Hobart':            'Hobart-class_destroyer',
  'Collins':           'Collins-class_submarine',
  'Adelaide':          'Adelaide-class_frigate',
  'Anzac':             'Frigate',
  // South Korean ROK Navy
  'Sejong the Great':  'Sejong_the_Great-class_destroyer',
  'Chungmugong Yi':    'Chungmugong_Yi_Sun-sin-class_destroyer',
  'Chang Bogo':        'Chang_Bogo-class_submarine',
  'Son Won-il':        'Son_Won-il-class_submarine',
  // Canadian RCN
  'Halifax':           'Halifax-class_frigate',
  'Victoria':          'Victoria-class_submarine',
  // Generic NATO
  'STANFLEX':          'StanFlex',
  'OHP':               'Oliver_Hazard_Perry-class_frigate',
});

// ── Russian/Soviet additional ship classes ────────────────────────────────────
Object.assign(SHIP_MAP, {
  // Aircraft carriers
  'Kiev':              'Kiev-class_aircraft_carrier',
  'Minsk':             'Kiev-class_aircraft_carrier',
  'Novorossiysk':      'Kiev-class_aircraft_carrier',
  // Cruisers (individual names)
  'Slava ':            'Slava-class_cruiser',
  'Marshal Ustinov':   'Slava-class_cruiser',
  'Moskva ':           'Slava-class_cruiser',
  'Admiral Nakhimov':  'Kirov-class_battlecruiser',
  'Petr Velikiy':      'Kirov-class_battlecruiser',
  'Admiral Lazarev':   'Kirov-class_battlecruiser',
  'Admiral Ushakov':   'Kirov-class_battlecruiser',
  // Patrol / torpedo / missile boats
  'Zhuk':              'Zhuk-class_patrol_boat',
  'Shershen':          'Shershen-class_torpedo_boat',
  'Saygak':            'Zhuk-class_patrol_boat',
  'Bora':              'Corvette',
  'P-6':               'Torpedo_boat',
  'SO1':               'SO-1-class_patrol_boat',
  'SO 1':              'SO-1-class_patrol_boat',
  'Shmel':             'Gunboat',
  // Landing ships/craft
  'Ondatra':           'Ondatra-class_landing_craft',
  'Vydra':             'Utility_landing_craft',
  'Aist':              'Aist-class_LCAC',
  'Lebed':             'Lebed-class_LCAC',
  // Tankers / auxiliaries
  'Andizhan':          'Tanker_(ship)',
  'Gorya':             'Russian_Navy',
  'Amur':              'Repair_ship',
  'Amga':              'Russian_Navy',
  'Lama':              'Lama-class_repair_ship',
  'Don ':              'Don-class_submarine_tender',
  'Don':               'Don-class_submarine_tender',
  'Alesha':            'Minelayer',
  'Okhtenskiy':        'Russian_Navy',
  // Intelligence / survey ships
  'Alpinist':          'Intelligence_ship',
  'Kapusta':           'Intelligence_ship',
  'Marshal Krylov':    'Missile_range_instrumentation_ship',
  'Marshal Nedelin':   'Missile_range_instrumentation_ship',
  'Meridian':          'Russian_Navy',
  'Moma':              'Hydrographic_survey',
  'Okean':             'Russian_Navy',
  'Yug ':              'Russian_Navy',
  'Yug':               'Russian_Navy',
  // ── US Navy hull-type prefixes (longer key = wins over shorter generic) ──────
  // Carriers
  'CVN 7':             'Nimitz-class_aircraft_carrier',
  'CVN 6':             'Nimitz-class_aircraft_carrier',
  'CVN ':              'Nimitz-class_aircraft_carrier',
  'CV 67':             'USS_John_F._Kennedy_(CV-67)',
  'CV 66':             'America-class_aircraft_carrier',
  'CV 63':             'Kitty_Hawk-class_aircraft_carrier',
  'CV 64':             'Kitty_Hawk-class_aircraft_carrier',
  'CV 62':             'Kitty_Hawk-class_aircraft_carrier',
  'CV 59':             'Forrestal-class_aircraft_carrier',
  'CV 60':             'Forrestal-class_aircraft_carrier',
  'CV 61':             'Forrestal-class_aircraft_carrier',
  'CV 43':             'Midway-class_aircraft_carrier',
  'CV 41':             'Midway-class_aircraft_carrier',
  'CV ':               'Kitty_Hawk-class_aircraft_carrier',
  // Battleships
  'BB 61':             'Iowa-class_battleship',
  'BB 62':             'Iowa-class_battleship',
  'BB 63':             'Iowa-class_battleship',
  'BB 64':             'Iowa-class_battleship',
  'BB ':               'Iowa-class_battleship',
  // Cruisers
  'CG 49':             'Ticonderoga-class_cruiser',
  'CG 5':              'Ticonderoga-class_cruiser',
  'CG 6':              'Ticonderoga-class_cruiser',
  'CG 7':              'Ticonderoga-class_cruiser',
  'CGN 36':            'California-class_cruiser',
  'CGN 35':            'USS_Truxtun_(CGN-35)',
  'CGN 25':            'USS_Bainbridge_(CGN-25)',
  'CGN 9':             'USS_Long_Beach_(CGN-9)',
  'CGN ':              'Leahy-class_cruiser',
  'CG 16':             'Leahy-class_cruiser',
  'CG 26':             'Belknap-class_cruiser',
  'CG ':               'Ticonderoga-class_cruiser',
  // Destroyers
  'DDG ':              'Arleigh_Burke-class_destroyer',
  'DD ':               'Spruance-class_destroyer',
  // Frigates
  'FFG ':              'Oliver_Hazard_Perry-class_frigate',
  'FF ':               'Knox-class_frigate',
  // Submarines (with trailing space to win over 3-char generic)
  'SSBN ':             'Ohio-class_submarine',
  'SSGN ':             'Ohio-class_submarine',
  'SSN 21':            'Seawolf-class_submarine',
  'SSN 22':            'Seawolf-class_submarine',
  'SSN 23':            'Seawolf-class_submarine',
  'SSN 7':             'Los_Angeles-class_submarine',
  'SSN 6':             'Los_Angeles-class_submarine',
  'SSN ':              'Los_Angeles-class_submarine',
  // Amphibious
  'LHA ':              'Tarawa-class_amphibious_assault_ship',
  'LHD ':              'Wasp-class_amphibious_assault_ship',
  'LPD ':              'Austin-class_amphibious_transport_dock',
  'LSD ':              'Whidbey_Island-class_dock_landing_ship',
  'LST ':              'Newport-class_tank_landing_ship',
  'LCC ':              'Blue_Ridge-class_command_ship',
  // Mine countermeasures
  'MCM ':              'Avenger-class_mine_countermeasures_ship',
  'MHC ':              'Osprey-class_minehunter',
  // Auxiliaries
  'AOE ':              'Sacramento-class_fast_combat_support_ship',
  'AOR ':              'Wichita-class_replenishment_oiler',
  'AO ':               'Oiler_(ship)',
  'AE ':               'Kilauea-class_ammunition_ship',
  'AFS ':              'Mars-class_combat_stores_ship',
  'AFSB':              'USS_Ponce_(LPD-15)',
  'AGF ':              'La_Salle_(AGF-3)',
  'ARS ':              'Safeguard-class_rescue_and_salvage_ship',
  // Patrol
  'PC ':               'Cyclone-class_patrol_ship',
  // ── Western hull/class names not yet mapped ───────────────────────────────────
  // UK
  'Leander':           'Leander-class_frigate',
  'Amazon':            'Type_21_frigate',
  'Broadword':         'Type_22_frigate',
  'Fife':              'County-class_destroyer',
  'Kent ':             'County-class_destroyer',
  'Sirius':            'Leander-class_frigate',
  'Devonshire':        'County-class_destroyer',
  'Antrim':            'County-class_destroyer',
  'Glamorgan':         'County-class_destroyer',
  'Glasgow':           'Type_42_destroyer',
  'Exeter':            'Type_42_destroyer',
  'Edinburgh':         'Type_42_destroyer',
  'Liverpool':         'Type_42_destroyer',
  'Manchester':        'Type_42_destroyer',
  'Daring':            'Type_45_destroyer',
  'Defender':          'Type_45_destroyer',
  'Dragon ':           'Type_45_destroyer',
  'Duncan':            'Type_45_destroyer',
  'Dauntless':         'Type_45_destroyer',
  'Diamond':           'Type_45_destroyer',
  'Duke ':             'Type_23_frigate',
  'Cornwall':          'Type_22_frigate',
  'Brave ':            'Type_22_frigate',
  'Beaver':            'Type_22_frigate',
  'Brilliant':         'Type_22_frigate',
  'Broadsword':        'Type_22_frigate',
  'Coventry':          'Type_42_destroyer',
  // French
  'Duperre':           'T_47-class_destroyer',
  'Colbert':           'French_cruiser_Colbert_(C611)',
  'Jeanne d\'Arc':     'Jeanne_d\'Arc_(helicopter_carrier)',
  'Tourville':         'Georges_Leygues-class_frigate',
  'De Grasse':         'Georges_Leygues-class_frigate',
  'Montcalm':          'Georges_Leygues-class_frigate',
  'Latouche-Tréville': 'Georges_Leygues-class_frigate',
  'Jean de Vienne':    'Georges_Leygues-class_frigate',
  'Primauguet':        'Georges_Leygues-class_frigate',
  'Forbin':            'Horizon-class_frigate',
  'Chevalier Paul':    'Horizon-class_frigate',
  'Aquitaine':         'FREMM_multipurpose_frigate',
  // German
  'Lütjens':           'Lütjens-class_destroyer',
  'Mölders':           'Lütjens-class_destroyer',
  'Rommel':            'Lütjens-class_destroyer',
  'Hameln':            'Minesweeper',
  'Bayern':            'Sachsen-class_frigate',
  'Hessen':            'Sachsen-class_frigate',
  // Italian
  'Minerva':           'Minerva-class_corvette',
  'Ardimento':         'Minerva-class_corvette',
  'Stromboli':         'Replenishment_ship',
  // Spanish
  'Baleares':          'Baleares-class_frigate',
  'Numancia':          'Santa_María-class_frigate',
  // Brazilian
  'Niteroi':           'Niterói-class_frigate',
  'Greenhalgh':        'Niterói-class_frigate',
  // Yugoslav
  'Heroj':             'Heroj-class_submarine',
  'Tara ':             'Sutjeska-class_submarine',
  'Rade Koncar':       'Missile_boat',
  'Rade Konĉar':       'Missile_boat',
  // Israeli
  'Romah':             'Missile_boat',
  'Reshef':            'Missile_boat',
  'Hetz':              'Saar_5-class_corvette',
  'Lahav':             'Saar_5-class_corvette',
  // Norwegian
  'Marjata':           'Intelligence_ship',
  // ── More Russian/Soviet ships ─────────────────────────────────────────────────
  'PL-633':            'Romeo-class_submarine',
  'PL-865':            'Midget_submarine',
  'Sovremenny':        'Sovremenny-class_destroyer',
  'Sovremenyy':        'Sovremenny-class_destroyer',
  'EM Sovremenny':     'Sovremenny-class_destroyer',
  'EM Sovremennyy':    'Sovremenny-class_destroyer',
  // Icebreakers / polar ships (LDK = ледокол)
  'Arktika':           'Arktika-class_icebreaker',
  'Dobrynya Nikitich': 'Dobrynya_Nikitich-class_icebreaker',
  'Ermak':             'Icebreaker',
  'Kapitan Sorokin':   'Icebreaker',
  'Magadan':           'Arktika-class_icebreaker',
  'Sevmorput':         'Sevmorput_(ship)',
  'Aleksandr Brykin':  'Russian_Navy',
  // General prefix codes → generic fallback
  'SDK ':              'Russian_Navy',
  'LDK ':              'Russian_Navy',
  'PSKA ':             'Russian_Navy',
  'PSKR ':             'Russian_Navy',
  'PRTB ':             'Russian_Navy',
  'SSV ':              'Russian_Navy',
  'RKR ':              'Russian_Navy',
  'TAKR ':             'Russian_Navy',
  'MRK ':              'Russian_Navy',
  'MPK ':              'Russian_Navy',
  'MB ':               'Russian_Navy',
  'PM ':               'Russian_Navy',
  'ZM ':               'Russian_Navy',
  'RT ':               'Russian_Navy',
  'MT ':               'Russian_Navy',
  'RK ':               'Russian_Navy',
  'TK ':               'Russian_Navy',
  'BDK ':              'Russian_Navy',
  'RKA ':              'Russian_Navy',
  'EP-02':             'Russian_Navy',
  'FNH ':              'Russian_Navy',
  'Ghannatha':         'Missile_boat',
  // ── Greek Navy ────────────────────────────────────────────────────────────────
  'Themistocles':      'Gearing-class_destroyer',
  'Kanaris':           'Gearing-class_destroyer',
  'Kimon':             'Gearing-class_destroyer',
  'Aspis':             'Allen_M._Sumner-class_destroyer',
  'Hydra ':            'Hydra-class_frigate',
  'Elli ':             'Knox-class_frigate',
  'Epirus':            'Hydra-class_frigate',
  'Adrias':            'Hydra-class_frigate',
  'Oinoussai':         'Landing_ship',
  'Prometeus':         'Greek_Navy',
  // ── Swedish Navy ─────────────────────────────────────────────────────────────
  'Sjöormen':          'Sjöormen-class_submarine',
  'Sjoormen':          'Sjöormen-class_submarine',
  'Draken ':           'Submarine',
  'Nacken':            'Nacken-class_submarine',
  'Södermanland':      'Västergötland-class_submarine',
  'Sodermanland':      'Västergötland-class_submarine',
  'Vastergotland':     'Västergötland-class_submarine',
  'Västergötland':     'Västergötland-class_submarine',
  'Orion ':            'Swedish_Navy',
  'Belos':             'Swedish_Navy',
  'Ejdern':            'Swedish_Navy',
  'Pelikanen':         'Swedish_Navy',
  'Tapper':            'Gotland-class_submarine',
  // ── Indian Navy ──────────────────────────────────────────────────────────────
  'Rajput':            'Rajput-class_destroyer',
  'Delhi ':            'Delhi-class_destroyer',
  'Kolkata':           'Kolkata-class_destroyer',
  'Visakhapatnam':     'Visakhapatnam-class_destroyer',
  'Godavari':          'Godavari-class_frigate',
  'Brahmaputra':       'Brahmaputra-class_frigate',
  'Nilgiri':           'Frigate',
  'Talwar ':           'Talwar-class_frigate',
  'Shivalik':          'Shivalik-class_frigate',
  'Mysore ':           'Delhi-class_destroyer',
  'Deepak':            'Replenishment_tanker',
  'Jyoti ':            'Replenishment_tanker',
  'Samar ':            'Indian_Navy',
  // ── Iranian Navy ─────────────────────────────────────────────────────────────
  'Kharg':             'IRIS_Kharg',
  'Hengam':            'Hengam-class_landing_ship',
  'Ghadir':            'Ghadir-class_submarine',
  'Fateh ':            'Fateh-class_submarine',
  'Nahang':            'Nahang-class_submarine',
  'Damavand':          'Iranian_Navy',
  'Riazi':             'Iranian_Navy',
  'Kangan':            'Iranian_Navy',
  // ── Taiwanese Navy ───────────────────────────────────────────────────────────
  'Cheng Kung':        'Cheng_Kung-class_frigate',
  'Kang Ding':         'Kang_Ding-class_frigate',
  'Keelung':           'Destroyer',
  'Lung Chiang':       'Missile_boat',
  'Jing Chiang':       'Missile_boat',
  'Yuen Feng':         'Taiwanese_Navy',
  'Wu Yi ':            'Taiwanese_Navy',
  'Chung Ho':          'Taiwanese_Navy',
  // ── Norwegian Navy ───────────────────────────────────────────────────────────
  'Oslo ':             'Oslo-class_frigate',
  'Bergen ':           'Oslo-class_frigate',
  'Trondheim':         'Oslo-class_frigate',
  'Stavanger':         'Oslo-class_frigate',
  'Narvik ':           'Oslo-class_frigate',
  'Sleipner':          'Torpedo_boat',
  'Horten':            'Norwegian_Navy',
  'Valkyrien':         'Norwegian_Navy',
  'Reinoysund':        'Norwegian_Navy',
  'Sauda ':            'Oksøy-class_minehunter',
  'Tana ':             'Alta-class_minesweeper',
  'Oksoey':            'Oksøy-class_minehunter',
  'Alta ':             'Alta-class_minesweeper',
  // ── Turkish Navy ─────────────────────────────────────────────────────────────
  'Yavuz ':            'Frigate',
  'Barbaros':          'Frigate',
  'Alcitepe':          'Gearing-class_destroyer',
  'Kilicalipasa':      'Gearing-class_destroyer',
  'Kocatepe':          'Gearing-class_destroyer',
  'Gelibolu':          'Frigate',
  'Berk ':             'Frigate',
  'Akar ':             'Turkish_Navy',
  // ── Egyptian Navy ────────────────────────────────────────────────────────────
  'Tahya Misr':        'Mistral-class_amphibious_assault_ship',
  'Ramadan':           'Ramadan-class_missile_boat',
  'October':           'Missile_boat',
  'Al Nour':           'Egyptian_Navy',
  'Al Siddiq':         'Egyptian_Navy',
  'Aswan':             'Egyptian_Navy',
  'Hegu':              'Missile_boat',
  // ── Generic craft types ───────────────────────────────────────────────────────
  'LCVP':              'Landing_craft_vehicle_personnel',
  'LCM-8':             'Landing_craft,_mechanized',
  'LCM-6':             'Landing_craft,_mechanized',
  'LCM-1':             'Landing_craft,_mechanized',
  'LCM ':              'Landing_craft,_mechanized',
  'LCU ':              'Landing_craft_utility',
  'LCAC':              'Landing_Craft_Air_Cushion',
  'L-Cat':             'French_Navy',
  'PAP 104':           'Mine_countermeasures_vessel',
  'Seafox':            'Remotely_operated_underwater_vehicle',
  'Remus':             'REMUS_(AUV)',
  'Pluto Plus':        'Mine_countermeasures_vessel',
  'Pluto Giga':        'Mine_countermeasures_vessel',
  'Pluto ROV':         'Mine_countermeasures_vessel',
  'Pluto':             'Mine_countermeasures_vessel',
  'Pinguin B':         'Atlas_Elektronik',
  'Protector USV':     'Protector_USV',
  'HSV 2 Swift':       'HSV-2_Swift',
  // Indian Navy
  'Chakra':            'Akula-class_submarine',
  // German U-boats (Type 206/212)
  'U 1':               'Type_206_submarine',
  'U 2':               'Type_206_submarine',
  'U 3':               'Type_206_submarine',
  'U 4':               'Type_206_submarine',
  'U 5':               'Type_206_submarine',
  'U 6':               'Type_206_submarine',
  // Portuguese
  'Comandante Joao Belo': 'Commandant_Rivière-class_frigate',
  'Joao Belo':            'Commandant_Rivière-class_frigate',
  // Taiwan Knox-class
  'Chi Yang':             'Knox-class_frigate',
  // Yugoslav
  'Mitar Acev':           'Osa-class_missile_boat',
  'RC 301':               'Osa-class_missile_boat',
  // Vietnamese
  'Dang Chiang':          'Petya-class_frigate',
  // Chinese Type 918
  'Type 918':             'Minesweeper',
  // US expeditionary ships
  'EPF ':                 'Spearhead-class_expeditionary_fast_transport',
  'ESB ':                 'Lewis_B._Puller-class_expeditionary_sea_base',
  'ESD ':                 'Amphibious_assault_ship',
  // Cape-class
  '95300 Cape':           'Cape-class_cutter',
  '95321 Cape':           'Cape-class_cutter',
  'Cape Small':           'Cape-class_cutter',
  'Cape Cross':           'Cape-class_cutter',
  // Abu Bakr (Bangladeshi/Pakistani frigate)
  'Abu Bakr':             'Knox-class_frigate',
  // China-Cat
  'China-Cat':            'Missile_boat',
});

// ── US Military Sealift Command, Coast Guard, LCS, other hull types, Russian subs, special ops, UUVs, named vessels ──
Object.assign(SHIP_MAP, {
  // US Military Sealift Command
  'T-AKR ':    'Bob_Hope-class_vehicle_cargo_ship',
  'T-AKE ':    'Lewis_and_Clark-class_dry_cargo_ship',
  'T-AK ':     'Container_ship',
  'T-AGM ':    'Missile_Range_Instrumentation_Ship',
  'T-AGOS ':   'Stalwart-class_ocean_surveillance_ship',
  'T-AH ':     'Mercy-class_hospital_ship',
  'T-AOT ':    'Henry_J._Kaiser-class_oiler',
  'T-AVB ':    'Aviation_Logistics_Support_Ship',
  'T-AO ':     'Henry_J._Kaiser-class_oiler',
  'T-ATF ':    'Powhatan-class_fleet_ocean_tug',
  'T-ARS ':    'Safeguard-class_salvage_ship',
  'T-EPF ':    'Spearhead-class_expeditionary_fast_transport',
  // US Coast Guard
  'WHEC ':     'Hamilton-class_cutter',
  'WMEC ':     'Famous-class_cutter',
  'WMSL ':     'Legend-class_cutter',
  'WPB ':      'Island-class_patrol_boat',
  'WAGB ':     'Polar-class_icebreaker',
  // US Littoral Combat Ships
  'LCS 1':     'Freedom-class_littoral_combat_ship',
  'LCS 2':     'Independence-class_littoral_combat_ship',
  'LCS 3':     'Freedom-class_littoral_combat_ship',
  'LCS 4':     'Independence-class_littoral_combat_ship',
  'LCS 5':     'Freedom-class_littoral_combat_ship',
  'LCS 6':     'Independence-class_littoral_combat_ship',
  'LCS 7':     'Freedom-class_littoral_combat_ship',
  'LCS 8':     'Independence-class_littoral_combat_ship',
  'LCS 9':     'Freedom-class_littoral_combat_ship',
  'LCS 10':    'Independence-class_littoral_combat_ship',
  'LCS 11':    'Freedom-class_littoral_combat_ship',
  'LCS 12':    'Independence-class_littoral_combat_ship',
  'LCS 13':    'Freedom-class_littoral_combat_ship',
  'LCS 14':    'Independence-class_littoral_combat_ship',
  'LCS 15':    'Freedom-class_littoral_combat_ship',
  'LCS 16':    'Independence-class_littoral_combat_ship',
  'LCS 17':    'Freedom-class_littoral_combat_ship',
  'LCS 18':    'Independence-class_littoral_combat_ship',
  'LCS 19':    'Freedom-class_littoral_combat_ship',
  'LCS 20':    'Independence-class_littoral_combat_ship',
  'LCS 21':    'Freedom-class_littoral_combat_ship',
  'LCS 22':    'Independence-class_littoral_combat_ship',
  'LCS 23':    'Freedom-class_littoral_combat_ship',
  'LCS 24':    'Independence-class_littoral_combat_ship',
  'LCS 25':    'Freedom-class_littoral_combat_ship',
  'LCS 26':    'Independence-class_littoral_combat_ship',
  // US other hull types
  'LPH ':      'Helicopter_carrier',
  'LKA ':      'Charleston-class_amphibious_cargo_ship',
  'MSO ':      'Aggressive-class_minesweeper',
  'PGM ':      'Gunboat',
  'PHM ':      'Pegasus-class_hydrofoil',
  'LSV ':      'Logistics_support_vessel',
  'MCS ':      'Mine_countermeasures_ship',
  'PC ':       'Cyclone-class_patrol_ship',
  'HSV ':      'Spearhead-class_expeditionary_fast_transport',
  // Russian submarines
  'PLA-885':   'Yasen-class_submarine',
  'PLA-949':   'Oscar-class_submarine',
  'PLA-671':   'Victor-class_submarine',
  'PLA-945':   'Sierra-class_submarine',
  'PLA-971':   'Akula-class_submarine',
  'PLA-941':   'Typhoon-class_submarine',
  'PLA-667':   'Delta-class_submarine',
  // Special operations / small craft
  'RHIB':      'Rigid-hulled_inflatable_boat',
  'SOC-R':     'Special_warfare_combatant-craft_crewmen',
  'Mark V':    'Mark_V_Special_Operations_Craft',
  'Mark VI':   'Mark_VI_patrol_boat',
  // UUVs/drones
  'Knifefish':     'Mine_countermeasures_vessel',
  'AN/WLD-1':      'AN/WLD-1_Remote_Minehunting_System',
  'CUSV':          'Unmanned_surface_vehicle',
  'Sea Hunter':    'Sea_Hunter',
  // Additional named vessels / classes
  'Avenger':       'Avenger-class_mine_countermeasures_ship',
  'Osprey':        'Osprey-class_coastal_minehunter',
  'Whidbey Island': 'Whidbey_Island-class_dock_landing_ship',
  'Harpers Ferry': 'Harpers_Ferry-class_dock_landing_ship',
  'San Antonio':   'San_Antonio-class_amphibious_transport_dock',
  'Wasp':          'Wasp-class_amphibious_assault_ship',
  'America':       'America-class_amphibious_assault_ship',
  'Blue Ridge':    'Blue_Ridge-class_command_ship',
  'Emory S. Land': 'Emory_S._Land-class_submarine_tender',
  'Supply':        'Supply-class_fast_combat_support_ship',
  'Safeguard':     'Safeguard-class_salvage_ship',
  'Powhatan':      'Powhatan-class_fleet_ocean_tug',
  'Mercy':         'Mercy-class_hospital_ship',
  'Lewis and Clark': 'Lewis_and_Clark-class_dry_cargo_ship',
  'Bob Hope':      'Bob_Hope-class_vehicle_cargo_ship',
  'Watson':        'Watson-class_vehicle_cargo_ship',
  'Algol':         'Algol-class_vehicle_cargo_ship',
  'Gordon':        'Gordon-class_vehicle_cargo_ship',
  'Shughart':      'Shughart-class_vehicle_cargo_ship',
});

// ── Royal Navy (UK) ship/class names ──
Object.assign(SHIP_MAP, {
  'Orangeleaf':    'Leaf-class_tanker',
  'Olwen':         'Replenishment_oiler',
  'Tidespring':    'Tide-class_tanker',
  'Green Rover':   'Rover-class_tanker',
  'Wave Knight':   'Wave-class_tanker',
  'Wave Ruler':    'Wave-class_tanker',
  'Fort Grange':   'Fort_Rosalie-class_replenishment_ship',
  'Fort Rosalie':  'Fort_Rosalie-class_replenishment_ship',
  'Fort Austin':   'Fort_Rosalie-class_replenishment_ship',
  'Fort Victoria':  'Replenishment_ship',
  'Resource':      'Replenishment_oiler',
  'Argus':         'RFA_Argus_(A135)',
  'Endurance':     'HMS_Endurance_(A171)',
  'Bristol':       'Type_82_destroyer',
  'Dragon':        'Type_45_destroyer',
  'Daring':        'Type_45_destroyer',
  'Defender':      'Type_45_destroyer',
  'Duncan':        'Type_45_destroyer',
  'Diamond':       'Type_45_destroyer',
  'Dauntless':     'Type_45_destroyer',
  'Norfolk':       'Type_23_frigate',
  'Montrose':      'Type_23_frigate',
  'Westminster':   'Type_23_frigate',
  'Northumberland': 'Type_23_frigate',
  'Richmond':      'Type_23_frigate',
  'Somerset':      'Type_23_frigate',
  'Sutherland':    'Type_23_frigate',
  'Kent':          'Type_23_frigate',
  'Portland':      'Type_23_frigate',
  'St Albans':     'Type_23_frigate',
  'Iron Duke':     'Type_23_frigate',
  'Lancaster':     'Type_23_frigate',
  'Argyll':        'Type_23_frigate',
  'Rothesay':      'Rothesay-class_frigate',
  'Achilles':      'Leander-class_frigate',
  'Andromeda':     'Leander-class_frigate',
  'Leander':       'Leander-class_frigate',
  'Boxer':         'Type_22_frigate',
  'Broadsword':    'Type_22_frigate',
  'Brilliant':     'Type_22_frigate',
  'Brazen':        'Type_22_frigate',
  'Brave':         'Type_22_frigate',
  'Battleaxe':     'Type_22_frigate',
  'Beaver':        'Type_22_frigate',
  'Cornwall':      'Type_22_frigate',
  'Cumberland':    'Type_22_frigate',
  'Campbeltown':   'Type_22_frigate',
  'Chatham':       'Type_22_frigate',
  'Coventry':      'Type_22_frigate',
  'Sheffield':     'Type_22_frigate',
  'Type 26 GCS':   'Type_26_frigate',
  'Fearless':      'Fearless-class_landing_platform_dock',
  'Intrepid':      'Fearless-class_landing_platform_dock',
  'Ocean':         'HMS_Ocean_(L12)',
  'Albion':        'Albion-class_landing_platform_dock',
  'Bulwark':       'Albion-class_landing_platform_dock',
  'Sir Galahad':   'Round_Table-class_landing_ship_logistics',
  'Sir Lancelot':  'Round_Table-class_landing_ship_logistics',
  'Sir Geraint':   'Round_Table-class_landing_ship_logistics',
  'Sir Percivale': 'Round_Table-class_landing_ship_logistics',
  'Sir Tristram':  'Round_Table-class_landing_ship_logistics',
  'Sir Bedivere':  'Round_Table-class_landing_ship_logistics',
  'Largs Bay':     'Bay-class_landing_ship',
  'Cardigan Bay':  'Bay-class_landing_ship',
  'Mounts Bay':    'Bay-class_landing_ship',
  'Lyme Bay':      'Bay-class_landing_ship',
  'Sandown':       'Sandown-class_minehunter',
  'Brecon':        'Hunt-class_mine_countermeasures_vessel',
  'Conniston':     'Ton-class_minesweeper',
  'Waveney':       'River-class_minesweeper',
  'Abdiel':        'Abdiel-class_minelayer',
  'Anglesey':      'Island-class_patrol_vessel',
  'Peacock':       'Peacock-class_corvette',
  'Clyde':         'River-class_offshore_patrol_vessel',
  'Leeds Castle':  'Castle-class_patrol_vessel',
  'Redpole':       'Bird-class_patrol_vessel',
  'Archer':        'HMS_Archer_(P264)',
  'Tyne':          'River-class_offshore_patrol_vessel',
  'Forth':         'River-class_offshore_patrol_vessel',
  'Scimitar':      'Scimitar-class_patrol_vessel',
  'Illustrious':   'Invincible-class_aircraft_carrier',
  'Ark Royal':     'Invincible-class_aircraft_carrier',
  'Hermes':        'Centaur-class_aircraft_carrier',
  'Porpoise':      'Submarine',
  'Oberon':        'Oberon-class_submarine',
  'Valiant':       'Valiant-class_submarine',
  'Resolution':    'Resolution-class_submarine',
  'Upholder':      'Upholder/Victoria-class_submarine',
  'Churchill':     'Submarine',
  'Engadine':      'RFA_Engadine_(K08)',
  'Challenger':    'Survey_vessel',
});

// ── French Navy (Marine nationale) ──
Object.assign(SHIP_MAP, {
  'Monge':         'French_ship_Monge_(A601)',
  'Meuse':         'Replenishment_oiler',
  'Durance':       'Replenishment_oiler',
  'Alize':         'Patrol_vessel',
  'Dupuy de Lome': 'Dupuy_de_Lôme_(A759)',
  'Aconit':        'Frigate',
  'Kersaint':      'Destroyer',
  'Maille-Breze':  'Tourville-class_frigate',
  'La Galissonniere': 'Commandant_Rivière-class_frigate',
  'Floreal':       'Floréal-class_frigate',
  'D Estienne':    'Aviso',
  'Premier Maître': 'Aviso',
  'Foudre':        'Foudre-class_landing_platform_dock',
  'Mistral':       'Mistral-class_amphibious_assault_ship',
  'Ouragan':       'Ouragan-class_landing_platform_dock',
  'Champlain':     'Landing_ship',
  'Sabre':         'Landing_craft',
  'Hallebarde':    'Landing_craft',
  'Eridan':        'Tripartite-class_minehunter',
  'Flamant':       'Flamant-class_patrol_vessel',
  'Audacieuse':    'Patrol_vessel',
  'L Adroit':      'Patrol_vessel',
  'Charles De Gaulle': 'French_aircraft_carrier_Charles_de_Gaulle',
  'Jeanne d Arc':  'Helicopter_carrier',
  'Clemenceau':    'Clemenceau-class_aircraft_carrier',
  'Amethyste':     'Rubis-class_submarine',
  'Rubis':         'Rubis-class_submarine',
  'Le Redoutable': 'Redoutable-class_submarine_(1967)',
  'L Indomptable': 'Redoutable-class_submarine_(1967)',
  'L Inflexible':  'Redoutable-class_submarine_(1967)',
  'Le Triomphant': 'Triomphant-class_submarine',
  'Agosta':        'Agosta-class_submarine',
  'Daphne':        'Daphné-class_submarine',
  'Suffren':       'Suffren-class_frigate',
});

// ── Indian Navy ──
Object.assign(SHIP_MAP, {
  'Samar':         'Sukanya-class_patrol_vessel',
  'Jyoti':         'Deepak-class_fleet_tanker',
  'Mysore':        'Delhi-class_destroyer',
  'Veer':          'Veer-class_corvette',
  'Vijaydurg':     'Abhay-class_corvette',
  'Prachand':      'Veer-class_corvette',
  'Ghorpad':       'Polnochny-class_landing_ship',
  'Shardul':       'Landing_ship',
  'Cheetah':       'Polnochny-class_landing_ship',
  'Magar':         'Landing_ship',
  'Jalashwa':      'Austin-class_amphibious_transport_dock',
  'Porbandar':     'Pondicherry-class_minesweeper',
  'Kamorta':       'Kamorta-class_corvette',
  'Abhay':         'Abhay-class_corvette',
  'Khukri':        'Khukri-class_corvette',
  'Sukanya':       'Sukanya-class_patrol_vessel',
  'Saryu':         'Saryu-class_patrol_vessel',
  'Kora':          'Kora-class_corvette',
  'Arnala':        'Minesweeper',
  'Vikrant':       'Vikrant-class_aircraft_carrier',
  'Viraat':        'INS_Viraat',
  'Vikramaditya':  'INS_Vikramaditya',
  'Kursura':       'Foxtrot-class_submarine',
  'Shishumar':     'Shishumar-class_submarine',
  'Kalvari':       'Scorpène-class_submarine',
  'Sindhughosh':   'Sindhughosh-class_submarine',
  'Car Nicobar':   'Fast_attack_craft',
});

// ── Iranian Navy ──
Object.assign(SHIP_MAP, {
  'Bandar Abbas':  'Missile_boat',
  'Delvar':        'Landing_ship',
  'Tareq':         'Kilo-class_submarine',
  'Babr':          'Allen_M._Sumner-class_destroyer',
  'Alvand':        'Alvand-class_frigate',
  'Jamaran':       'Moudge-class_frigate',
  'Bavar':         'Ground-effect_vehicle',
  'Peykaap':       'Missile_boat',
  'Iran Ajr':      'Iran_Ajr',
  'Kajami':        'Boghammar',
  'Gahjae':        'Boghammar',
  'Ashura':        'Missile_boat',
  'Zafar':         'Patrol_boat',
  'Bakhtaran':     'Patrol_boat',
  'Kaivan':        'Bayandor-class_corvette',
  'Parvin':        'Corvette',
  'Kaman':         'Fast_attack_craft',
  'Sina':          'Missile_boat',
  'Bayandor':      'Bayandor-class_corvette',
  'Fath':          'Patrol_vessel',
  'Shahid':        'Missile_boat',
  'Swift PB':      'Patrol_boat,_river',
  'Peterson':      'Patrol_boat',
  'Wellington':    'Hovercraft',
  'Toragh':        'Patrol_boat',
});

// ── Turkish Navy ──
Object.assign(SHIP_MAP, {
  'Akar':          'Akar-class_replenishment_oiler',
  'Berk':          'Frigate',
  'Yavuz':         'Frigate',
  'Salihreis':     'Knox-class_frigate',
  'Muavenet':      'Destroyer',
  'Gaziantep':     'Oliver_Hazard_Perry-class_frigate',
  'Gediz':         'Oliver_Hazard_Perry-class_frigate',
  'Bozcaada':      'Ada-class_corvette',
  'Heybeliada':    'Ada-class_corvette',
  'Ertugrul':      'Landing_ship',
  'Edincuk':       'Minelayer',
  'Alanya':        'Minesweeper',
  'Sarucabey':     'Landing_ship',
  'Osman Gasi':    'Fast_attack_craft',
  'Denizkuşu':     'Patrol_boat',
  'Kilic':         'Kılıç-class_fast_attack_craft',
  'Tufan':         'Frigate',
  'Yildirim':      'Frigate',
  'Dogan':         'Doğan-class_fast_attack_craft',
  'Yildiz':        'Yıldız-class_fast_attack_craft',
});

// ── Indonesian Navy ──
Object.assign(SHIP_MAP, {
  'Martadinata':   'Martadinata-class_frigate',
  'Martha Khristina': 'Parchim-class_corvette',
  'Samadikun':     'Claud_Jones-class_destroyer_escort',
  'Ahmad Yani':    'Van_Speijk-class_frigate',
  'Oswald Siahaan': 'Van_Speijk-class_frigate',
  'Bung Tomo':     'Sigma-class_corvette',
  'Fatahillah':    'Fatahillah-class_corvette',
  'Nala':          'Frosch-class_landing_ship',
  'Hajar Dewantara': 'Training_ship',
  'Diponegoro':    'Sigma-class_corvette',
  'Kapitan Patimura': 'Parchim-class_corvette',
  'Sultan Thaha':  'Corvette',
  'Cakra':         'Type_209_submarine',
  'Nagapasa':      'Submarine',
  'Nagarangsang':  'Type_209_submarine',
  'Pasopati':      'Whiskey-class_submarine',
  'Teluk Semangka': 'Landing_ship',
  'Teluk Banten':  'Frosch-class_landing_ship',
  'Teluk Gelimanuk': 'Frosch-class_landing_ship',
  'Teluk Cirebon': 'Landing_ship',
  'Multatuli':     'Corvette',
});

// ── Italian Navy ──
Object.assign(SHIP_MAP, {
  'Vittorio Veneto': 'Italian_cruiser_Vittorio_Veneto_(550)',
  'Andrea Doria':  'Andrea_Doria-class_destroyer',
  'Audace':        'Audace-class_destroyer_(1971)',
  'Luigi Durand':  'Durand_de_la_Penne-class_destroyer',
  'Albatros':      'Albatros-class_corvette',
  'Artigliere':    'Lupo-class_frigate',
  'Carlo Bergamini': 'FREMM_multipurpose_frigate',
  'Virginio Fasan': 'FREMM_multipurpose_frigate',
  'San Giorgio':   'San_Giorgio-class_amphibious_transport_dock',
  'Lerici':        'Lerici-class_minehunter',
  'Gaeta':         'Gaeta-class_minehunter',
  'Cassiopea':     'Cassiopea-class_patrol_vessel',
  'Sparviero':     'Patrol_vessel',
  'Commandante':   'Comandanti-class_patrol_vessel',
  'Enrico Toti':   'Toti-class_submarine',
  'Salvatore Pelosi': 'Sauro-class_submarine',
  'Primo Longobardo': 'Sauro-class_submarine',
  'Salvatore Todaro': 'Todaro-class_submarine',
  'Etna':          'Etna-class_replenishment_oiler',
  'Elettra':       'Italian_ship_Elettra_(A5340)',
});

// ── Greek Navy ──
Object.assign(SHIP_MAP, {
  'Elli':          'Elli-class_frigate',
  'Syros':         'Jason-class_tank_landing_ship',
  'Nafkratoussa':  'Jason-class_tank_landing_ship',
  'Chios':         'Jason-class_tank_landing_ship',
  'Kefalonia':     'Jason-class_tank_landing_ship',
  'Atalanti':      'Hunt-class_mine_countermeasures_vessel',
  'Euniki':        'Adjutant-class_minesweeper',
  'Aktion':        'Fast_attack_craft',
  'Anninos':       'Patrol_boat',
  'Armatolos':     'Patrol_boat',
  'Laskos':        'Patrol_boat',
  'Tolmi':         'Missile_boat',
  'Kavaloudis':    'Patrol_boat',
  'Mahitis':       'Fast_attack_craft',
  'Diopos':        'Fast_attack_craft',
  'Pyrpolitis':    'Fast_attack_craft',
  'Niki':          'La_Combattante_IIa-class_fast_attack_craft',
  'Roussen':       'Fast_attack_craft',
  'Pezopoulos':    'Thetis-class_gunboat',
  'Glavkos':       'Submarine',
  'Poseidon':      'Poseidon-class_submarine',
  'Papanikolis':   'Type_214_submarine',
  'Ipopliarchos':  'Landing_craft',
});

// ── Spanish Navy ──
Object.assign(SHIP_MAP, {
  'Marques de la Ensenada': 'Spanish_Navy',
  'Patino':        'Replenishment_ship',
  'Cantabria':     'Replenishment_oiler',
  'Alvaro De Baz': 'Álvaro_de_Bazán-class_frigate',
  'Cristobal Colon': 'Álvaro_de_Bazán-class_frigate',
  'Descubierta':   'Descubierta-class_corvette',
  'Navarra':       'Santa_María-class_frigate',
  'Hernan Cortez': 'Landing_platform_dock',
  'Galicia':       'Galicia-class_landing_platform_dock',
  'Castilla':      'Galicia-class_landing_platform_dock',
  'Diana':         'Minehunter',
  'Segura':        'Minehunter',
  'Guadalete':     'Minesweeper',
  'Meteoro':       'Meteoro-class_offshore_patrol_vessel',
  'Serviola':      'Offshore_patrol_vessel',
  'Dedalo':        'Spanish_aircraft_carrier_Dédalo',
  'Principe de Asturias': 'Spanish_aircraft_carrier_Príncipe_de_Asturias',
  'Delfin':        'Daphné-class_submarine',
  'Isaac Peral':   'S-80-class_submarine',
});

// ── Argentine Navy ──
Object.assign(SHIP_MAP, {
  'Sanaviron':     'Transport',
  'Bahia San Blas': 'Transport',
  'Punta Delgada': 'Transport',
  'Punta Medanos': 'Transport',
  'Hercules':      'Type_42_destroyer',
  'General Belgrano': 'ARA_General_Belgrano',
  'Almirante Brown': 'Almirante_Brown-class_destroyer',
  'Segui':         'Fletcher-class_destroyer',
  'Comodoro Py':   'Fletcher-class_destroyer',
  'Mar Del Plata': 'Patrol_vessel',
  'Drummond':      'Drummond-class_corvette',
  'Espora':        'Espora-class_corvette',
  'Baradero':      'Patrol_vessel',
  'Intrepida':     'Intrepida-class_fast_attack_craft',
  'Santa Fe':      'Type_209_submarine',
  'Santa Cruz':    'TR-1700-class_submarine',
  'Veinticinco de Mayo': 'ARA_Veinticinco_de_Mayo_(V-2)',
  'Campo Durán':   'Oil_tanker',
  'Puerto Rosales': 'Oil_tanker',
});

// ── Polish Navy ──
Object.assign(SHIP_MAP, {
  'Kaszub':        'Corvette',
  'Warszawa':      'Destroyer',
  'Pulaski':       'Oliver_Hazard_Perry-class_frigate',
  'Orzel':         'Kilo-class_submarine',
  'Wilk':          'Foxtrot-class_submarine',
  'Sokol':         'Kobben-class_submarine',
  'Hel':           'Minesweeper',
  'Orkan':         'Orkan-class_fast_attack_craft',
  'Gornik':        'Corvette',
  'Kontradmiral':  'Polnocny-class_landing_ship',
  'Orlik':         'Patrol_boat',
  'Goplo':         'Minehunter',
  'Lenino':        'Polnochny-class_landing_ship',
  'Janow':         'Polnochny-class_landing_ship',
  'Grunwald':      'Polnochny-class_landing_ship',
  'Lublin':        'Lublin-class_minelayer-landing_ship',
  'Odra':          'Salvage_tug',
  'Oka':           'Salvage_tug',
  'Pilica':        'Patrol_boat',
});

// ── Danish Navy ──
Object.assign(SHIP_MAP, {
  'Beskytteren':   'Patrol_vessel',
  'Bellona':       'Corvette',
  'Hvidbjornen':   'Patrol_vessel',
  'Peder Skram':   'Peder_Skram-class_frigate',
  'Niels Juel':    'Niels_Juel-class_corvette',
  'Thetis':        'Thetis-class_ocean_patrol_vessel',
  'Iver Huitfeldt': 'Iver_Huitfeldt-class_frigate',
  'Absalon':       'Absalon-class_command_and_support_ship',
  'Aarosund':      'Minesweeper',
  'Lindormen':     'Lindormen-class_minelayer',
  'Falster':       'Minelayer',
  'Soloven':       'Torpedo_boat',
  'Willemoes':     'Fast_attack_craft',
  'Flyvefisken':   'Flyvefisken-class_patrol_vessel',
  'Knud Rasmussen': 'Knud_Rasmussen-class_patrol_vessel',
});

// ── Pakistani Navy ──
Object.assign(SHIP_MAP, {
  'Nasr':          'Fleet_tanker',
  'Babur':         'Destroyer',
  'Cosmos SX':     'Midget_submarine',
  'Alamgir':       'Oliver_Hazard_Perry-class_frigate',
  'Tariq':         'Type_21_frigate',
  'Zulfiquar':     'Frigate',
  'Muhafiz':       'Minesweeper',
  'Azmat':         'Missile_boat',
  'Jalalat':       'Missile_boat',
  'Larkana':       'Large_patrol_craft',
  'Hangor':        'Daphné-class_submarine',
  'Hashmat':       'Agosta-class_submarine',
  'Khalid':        'Agosta_90B-class_submarine',
  'Improved Khalid': 'Agosta_90B-class_submarine',
});

// ── Egyptian Navy ──
Object.assign(SHIP_MAP, {
  'S. Ezzat':      'Missile_boat',
  'Al Fateh':      'Frigate',
  'Ahmed Fadel':   'Descubierta-class_corvette',
  'Mubarak':       'Oliver_Hazard_Perry-class_frigate',
  'Abu Qir':       'Knox-class_frigate',
  'Najim Al Zafir': 'Frigate',
  'Damyat':        'FREMM_multipurpose_frigate',
  'Gamal Abdel Nasser': 'Mistral-class_amphibious_assault_ship',
  'Romeo':         'Romeo-class_submarine',
});

// ── Dutch Navy ──
Object.assign(SHIP_MAP, {
  'Zuiderkruis':   'Fast_combat_support_ship',
  'Amsterdam':     'Fast_combat_support_ship',
  'Mercuur':       'HNLMS_Mercuur_(A900)',
  'Tromp':         'Tromp-class_frigate',
  'De Zeven Provinciën': 'De_Zeven_Provinciën-class_frigate',
  'Van Speijk':    'Van_Speijk-class_frigate',
  'Kortenaer':     'Kortenaer-class_frigate',
  'Jacob van Heemskerck': 'Jacob_van_Heemskerck-class_frigate',
  'Rotterdam':     'Rotterdam-class_amphibious_transport_dock',
  'Johan de Witt': 'Rotterdam-class_amphibious_transport_dock',
  'Alkmaar':       'Tripartite-class_minehunter',
  'Holland':       'Holland-class_offshore_patrol_vessel',
  'Zwaardvis':     'Zwaardvis-class_submarine',
  'Walrus':        'Walrus-class_submarine',
});

// ── Brazilian Navy ──
Object.assign(SHIP_MAP, {
  'Minas Gerais':  'Brazilian_aircraft_carrier_Minas_Gerais',
  'Sao Paulo':     'Brazilian_aircraft_carrier_São_Paulo',
  'Marcilio Diaz': 'Garcia-class_destroyer_escort',
  'Mato Grosso':   'Niterói-class_frigate',
  'Sergipe':       'Niterói-class_frigate',
  'Independência': 'Niterói-class_frigate',
  'Almirante Saboia': 'Thomaston-class_dock_landing_ship',
  'Mattoso Maia':  'Newport-class_tank_landing_ship',
  'Macae':         'Macaé-class_patrol_vessel',
  'Humaita':       'Riachuelo-class_submarine',
  'Riachuelo':     'Riachuelo-class_submarine',
  'Inhauma':       'Inhaúma-class_corvette',
  'Barroso':       'Barroso-class_corvette',
});

// ── Swedish Navy ──
Object.assign(SHIP_MAP, {
  'Orion':         'Patrol_vessel',
  'Visborg':       'Visby-class_corvette',
  'Draken':        'Submarine',
  'Halland':       'Halland-class_destroyer',
  'Östergötland':  'Östergötland-class_destroyer',
  'Stockholm':     'Stockholm-class_corvette',
  'Goteborg':      'Göteborg-class_corvette',
  'Älvsborg':      'Minelayer',
  'Carlskrona':    'Minelayer',
  'Styrso':        'Minesweeper',
  'Hanö':          'Landsort-class_mine_countermeasures_vessel',
  'Arkö':          'Koster-class_mine_countermeasures_vessel',
  'Landsort':      'Landsort-class_mine_countermeasures_vessel',
  'Koster':        'Koster-class_mine_countermeasures_vessel',
  'Hugin':         'Patrol_boat',
  'Kaparen':       'Patrol_boat',
  'Norrköping':    'Norrköping-class_missile_boat',
  'Strb 90':       'Stridsbåt_90',
  'Tpbs 200':      'Tapper-class_patrol_boat',
  'Plejad':        'Torpedo_boat',
  'Spica':         'Torpedo_boat',
  'Gåssten':       'Minesweeper',
});

// ── German Navy ──
Object.assign(SHIP_MAP, {
  'Berlin':        'Berlin-class_replenishment_ship',
  'Freiburg':      'Berlin-class_replenishment_ship',
  'Walchensee':    'Walchensee-class_tanker',
  'Westerwald':    'Ammunition_ship',
  'Spessart':      'Tanker_(ship)',
  'Elbe':          'Elbe-class_replenishment_ship',
  'Oste':          'Oste-class_fleet_service_ship',
  'Rhein':         'Rhein-class_tender',
  'Neustadt':      'Minesweeper',
  'Köln':          'Köln-class_frigate',
  'Baden-Wurttemberg': 'Baden-Württemberg-class_frigate',
  'Braunschweig':  'Braunschweig-class_corvette',
  'Flunder':       'Landing_craft',
  'Frankenthal':   'Frankenthal-class_minehunter',
  'Kulmbach':      'Minesweeper',
  'Zobel':         'Zobel-class_fast_attack_craft',
  'Albatros':      'Albatros-class_fast_attack_craft',
  'Gepard':        'Gepard-class_fast_attack_craft',
  'Tiger':         'Tiger-class_fast_attack_craft',
  'Seehund ROV':   'Remotely_operated_underwater_vehicle',
});

// ── Australian Navy ──
Object.assign(SHIP_MAP, {
  'Onslow':        'Oberon-class_submarine',
  'Paluma':        'Paluma-class_survey_motor_launch',
  'Armidale':      'Armidale-class_patrol_boat',
  'Ocean Shield':  'ADV_Ocean_Shield',
  'Jervis Bay':    'HSV-X1_Joint_Venture',
  'Perth':         'Perth-class_destroyer',
  'Brisbane':      'Perth-class_destroyer',
  'Parramatta':    'River-class_destroyer_escort',
  'Swan':          'River-class_destroyer_escort',
  'Leeuwin':       'Leeuwin-class_survey_vessel',
  'Canberra':      'Canberra-class_landing_helicopter_dock',
  'Choules':       'HMAS_Choules',
  'Balikpapan':    'Landing_craft',
  'Tobruk':        'HMAS_Tobruk_(L50)',
  'Kanimbla':      'Kanimbla-class_landing_platform_amphibious',
  'Huon':          'Huon-class_minehunter',
  'Success':       'HMAS_Success_(OR_304)',
  'Fremantle':     'Fremantle-class_patrol_boat',
  'Melbourne':     'Aircraft_carrier',
});

// ── Norwegian Navy ──
Object.assign(SHIP_MAP, {
  'Fridtjof Nansen': 'Fridtjof_Nansen-class_frigate',
  'Skjold':        'Skjold-class_corvette',
  'Knm':           'Royal_Norwegian_Navy',
  'Nordkapp':      'Nordkapp-class_offshore_patrol_vessel',
  'Ula':           'Ula-class_submarine',
  'Oslo':          'Oslo-class_frigate',
});

// ── Canadian Navy ──
Object.assign(SHIP_MAP, {
  'Provider':      'Provider-class_replenishment_oiler',
  'Protecteur':    'Auxiliary_oiler_replenishment',
  'Kingston':      'Kingston-class_coastal_defence_vessel',
  'Ojibwa':        'Oberon-class_submarine',
  'Cape Roger':    'Patrol_vessel',
  'Restigouche':   'Destroyer_escort',
  'Mackenzie':     'Destroyer_escort',
  'St. Laurent':   'Destroyer_escort',
  'Annapolis':     'Destroyer_escort',
  'Iroquois':      'Iroquois-class_destroyer',
  'TRUMP':         'Iroquois-class_destroyer',
});

// ── Chilean Navy ──
Object.assign(SHIP_MAP, {
  'Almirante Riveros': 'Almirante_Riveros-class_frigate',
  'Capitan Prat':  'County-class_destroyer',
  'Blanco Encalada': 'Frigate',
  'Condell':       'Condell-class_frigate',
  'Thomson':       'Type_209_submarine',
  'Scorpene':      'Scorpène-class_submarine',
});

// ── South Korean Navy ──
Object.assign(SHIP_MAP, {
  'Sejong Daewang': 'Sejong_the_Great-class_destroyer',
  'Chungmugong Yi Sun-sin': 'Chungmugong_Yi_Sun-sin-class_destroyer',
  'Gwanggaeto Daewang': 'Gwanggaeto_the_Great-class_destroyer',
  'Ulsan':         'Ulsan-class_frigate',
  'Incheon':       'Incheon-class_frigate',
  'Dokdo':         'Dokdo-class_amphibious_assault_ship',
  'Pohang':        'Pohang-class_corvette',
  'Yoon Youngha':  'Patrol_vessel',
  'Chamsuri':      'Chamsuri-class_patrol_boat',
  'Son Won-il':    'Son_Won-il-class_submarine',
  'Chang Bogo':    'Chang_Bogo-class_submarine',
  'Dosan Ahn Changho': 'Dosan_Ahn_Changho-class_submarine',
});

// ── Thai Navy ──
Object.assign(SHIP_MAP, {
  'Prabrarapak':   'Fast_attack_craft',
  'Ratcharit':     'Fast_attack_craft',
  'Chonburi':      'Fast_attack_craft',
  'Naresuan':      'Naresuan-class_frigate',
  'Tapi':          'Frigate',
  'Makut Rajakumarn': 'HTMS_Makut_Rajakumarn',
  'Ratanakosin':   'Ratanakosin-class_corvette',
  'Chao Phraya':   'Chao_Phraya-class_frigate',
  'Kraburi':       'Chao_Phraya-class_frigate',
  'Phutthayotfa':  'Naresuan-class_frigate',
  'Sattahip':      'Transport',
  'Khamronsin':    'Khamronsin-class_corvette',
  'Lat Ya':        'Mine_countermeasures_vessel',
  'Sichang':       'Landing_ship',
  'An Thong':      'Landing_platform_dock',
  'Chakri Naruebet': 'HTMS_Chakri_Naruebet',
});

// ── North Korean Navy ──
Object.assign(SHIP_MAP, {
  'Najin':         'Najin-class_frigate',
  'Sariwon':       'Sariwon-class_corvette',
  'Soho':          'Frigate',
  'Chaho':         'Torpedo_boat',
  'Chong Jin':     'Frigate',
  'Kongbang':      'Landing_craft',
  'Yono':          'Submarine',
  'Nampo':         'Corvette',
  'Nongo':         'Patrol_boat',
  'Sang-O':        'Sang-O-class_submarine',
  'Sin Hung':      'Submarine',
  'Sinpo':         'Submarine',
  'Sohung':        'Landing_ship',
  'Soju':          'Missile_boat',
  'Taechong':      'Corvette',
});

// ── Singaporean Navy ──
Object.assign(SHIP_MAP, {
  'Formidable':    'Formidable-class_frigate',
  'Bedok':         'Bedok-class_mine_countermeasures_vessel',
  'Independence':  'Independence-class_littoral_mission_vessel',
  'Sovereignity':  'Corvette',
  'Sea Wolf':      'Missile_boat',
  'Resilience':    'Endurance-class_landing_platform_dock',
  'Perseverance':  'Endurance-class_landing_platform_dock',
});

// ── UAE Navy ──
Object.assign(SHIP_MAP, {
  'Abu Dhabi':     'Corvette',
  'Ardhana':       'Fast_attack_craft',
  'Baynunah':      'Baynunah-class_corvette',
  'Ghantoot':      'Fast_attack_craft',
  'Mubarraz':      'Missile_boat',
  'Baniyas':       'Corvette',
  'Kawkab':        'Fast_attack_craft',
  'Murray Jip':    'Patrol_vessel',
});

// ── Philippine Navy ──
Object.assign(SHIP_MAP, {
  'Ivatan':        'Landing_craft',
  'Bacolod City':  'Bacolod_City-class_logistics_support_vessel',
  'Tarlac':        'Tarlac-class_landing_platform_dock',
  'Rajah Humabon': 'Cannon-class_destroyer_escort',
  'Gregorio del Pilar': 'Gregorio_del_Pilar-class_frigate',
  'Tomas Batillo': 'Gunboat',
  'Emilio Aguinaldo': 'Frigate',
  'Jose Andrada':  'Patrol_vessel',
  'Agusan':        'Rizal-class_corvette',
  'Miguel Malvar': 'Miguel_Malvar-class_corvette',
  'Magat Salamat': 'Miguel_Malvar-class_corvette',
  'Rizal':         'Jose_Rizal-class_frigate',
});

// ── Venezuelan Navy ──
Object.assign(SHIP_MAP, {
  'Almirante Clemente': 'Almirante_Clemente-class_destroyer',
  'Mariscal Sucre': 'Lupo-class_frigate',
  'Guaicamacuto':  'Patrol_vessel',
  'Alcatraz':      'Patrol_vessel',
  'Pagalo':        'Patrol_vessel',
  'Fernando Gomez': 'Patrol_vessel',
  'Carite':        'Type_209_submarine',
  'Capana':        'Landing_ship',
  'Ciudad Bolivar': 'Patrol_vessel',
  'Los Frailes':   'Patrol_vessel',
});

// ── Vietnamese Navy ──
Object.assign(SHIP_MAP, {
  'Tran Quang Khai': 'Gepard-class_frigate',
  'Dai Ky':        'Petya-class_frigate',
  'Dinh Tien Hoang': 'Gepard-class_frigate',
  'Hanoi':         'Kilo-class_submarine',
  'HQ 261':        'Landing_ship',
  'HQ 331':        'Molniya-class_corvette',
  'HQ 354':        'Tarantul-class_corvette',
  'HQ 371':        'Svetlyak-class_patrol_boat',
  'HQ 375':        'Svetlyak-class_patrol_boat',
  'HQ 851':        'Petya-class_frigate',
});

// ── Misc other countries ──
Object.assign(SHIP_MAP, {
  // Norway
  'Nordkapp':      'Nordkapp-class_offshore_patrol_vessel',
  // Thailand
  'T-11':          'Landing_craft',
  // Philippines
  'AT ':           'Tugboat',
  // Egypt - hull number only ships
  '211':           'Patrol_boat',
  '301':           'Patrol_boat',
  '633':           'Missile_boat',
  '751':           'Patrol_boat',
  // Various
  'Daphne':        'Daphné-class_submarine',
  'MIN Mk2 ROV':   'Remotely_operated_underwater_vehicle',
  'Platform':      'Oil_platform',
  'Commercial':    'Fishing_vessel',
});

// ── Japanese Navy (JMSDF) ──
Object.assign(SHIP_MAP, {
  'Hibiki':        'Hibiki-class_ocean_surveillance_ship',
  'Haruna':        'Haruna-class_destroyer',
  'Shirane':       'Shirane-class_destroyer',
  'Yamagumo':      'Yamagumo-class_destroyer',
  'Minegumo':      'Minegumo-class_destroyer',
  'Chikugo':       'Chikugo-class_destroyer_escort',
  'Yoshino':       'Chikugo-class_destroyer_escort',
  'Yubari':        'Yūbari-class_destroyer_escort',
  'Abukuma':       'Abukuma-class_destroyer_escort',
  'Souya':         'Minesweeper',
  'Hirashima':     'Hirashima-class_minesweeper',
  'Enoshima':      'Enoshima-class_minesweeper',
  'Hatsushima':    'Hatsushima-class_minesweeper',
  'Awashima':      'Minesweeper',
  'Uwajima':       'Uwajima-class_minesweeper',
  'Sugashima':     'Sugashima-class_minesweeper',
  'Hayase':        'Minelayer',
  'Uraga':         'Minesweeper',
  'Hayabusa':      'Hayabusa-class_patrol_boat',
  'Hateruna':      'Hateruma-class_patrol_vessel',
  'Shikishima':    'Shikishima-class_patrol_vessel',
  'ROV':           'Remotely_operated_underwater_vehicle',
});

// ── Norwegian Navy remaining ──
Object.assign(SHIP_MAP, {
  'Trondernes':    'Minesweeper',
  'Tjeldsund':     'Landing_craft',
  'Sauda':         'Minesweeper',
  'Tana':          'Minesweeper',
  'Oksøy':         'Oksøy-class_mine_hunter',
  'Alta':          'Alta-class_minesweeper',
  'Borgen':        'Minelayer',
  'Vidar':         'Vidar-class_minelayer',
  'Storm':         'Storm-class_patrol_boat',
  'Snøgg':         'Snøgg-class_missile_torpedo_boat',
  'Torpen':        'Patrol_boat',
  'Svalbard':      'NoCGV_Svalbard',
  'Harstad':       'Nordkapp-class_offshore_patrol_vessel',
});

// ── Taiwanese Navy (ROCN) ──
Object.assign(SHIP_MAP, {
  'Yung Feng':     'Missile_boat',
  'Yung Yang':     'Frigate',
  'Yung Jin':      'Patrol_ship',
  'Shui Hai':      'Missile_boat',
  'Wu Yi':         'Replenishment_oiler',
  'Tuo Chiang':    'Tuo_Chiang-class_corvette',
  'Hai Lung':      'Hai_Lung-class_submarine',
  'Chien Yang':    'Knox-class_frigate',
  'Han Yang':      'Gearing-class_destroyer',
  'Hai Ou':        'Missile_boat',
  'Pinguin':       'Remotely_operated_underwater_vehicle',
});

// ── Chilean Navy remaining ──
Object.assign(SHIP_MAP, {
  'Piloto Pardo':  'Transport',
  'O Higgins':     'Leander-class_frigate',
  'Almirante Lynch': 'Type_23_frigate',
  'Ministro Zenteno': 'Jacob_van_Heemskerck-class_frigate',
  'General Baquedano': 'Leander-class_frigate',
  'Casma':         'Missile_boat',
  'Iquique':       'Missile_boat',
  'Riquelme':      'Tiger-class_fast_attack_craft',
  'Sargento Aldea': 'Foudre-class_landing_platform_dock',
  'Guacolda':      'Fast_attack_craft',
  'Maipo':         'County-class_destroyer',
  'O Brien':       'Oberon-class_submarine',
});

// ── Israeli Navy ──
Object.assign(SHIP_MAP, {
  'Mivtach':       'Missile_boat',
  'Eilat':         'Corvette',
  'Saar':          'Missile_boat',
  'Aliyah':        'Missile_boat',
  'Dabur':         'Dabur-class_patrol_boat',
  'Dolphin':       'Dolphin-class_submarine',
  'Dvora':         'Dvora-class_fast_patrol_boat',
  'Gal':           'Gal-class_submarine',
  'Shaldag':       'Shaldag-class_fast_patrol_boat',
});

// ── Malaysian Navy ──
Object.assign(SHIP_MAP, {
  'Mahamiru':      'Minesweeper',
  'Musytari':      'Corvette',
  'Kedah':         'Kedah-class_offshore_patrol_vessel',
  'Rahmat':        'Frigate',
  'Perdana':       'Fast_attack_craft',
  'Jerong':        'Fast_attack_craft',
  'Handalan':      'Fast_attack_craft',
  'Laksamana':     'Laksamana-class_corvette',
  'Kasturi':       'Kasturi-class_corvette',
  'Lekiu':         'Lekiu-class_frigate',
  'Mermaid':       'Frigate',
  'Tunku Abdul Rahman': 'Scorpène-class_submarine',
});

// ── Portuguese Navy ──
Object.assign(SHIP_MAP, {
  'Berrio':        'Replenishment_oiler',
  'Vasco Da Gama': 'Vasco_da_Gama-class_frigate',
  'Bartolomeu Diaz': 'Vasco_da_Gama-class_frigate',
  'Antonio Enes':  'Corvette',
  'Almirante Pereira': 'Almirante_Pereira_da_Silva-class_frigate',
  'Baptiste de Andrade': 'Corvette',
  'Cacine':        'Patrol_vessel',
  'Viana do Castelo': 'Offshore_patrol_vessel',
  'Tridente':      'Tridente-class_submarine',
  'Albacora':      'Albacora-class_submarine',
});

// ── Bangladeshi Navy ──
Object.assign(SHIP_MAP, {
  'Shadhinota':    'Corvette',
  'Umar Farooq':   'Ulsan-class_frigate',
  'Osman':         'Salisbury-class_frigate',
  'Bangabandhu':   'Frigate',
  'Somudro Joy':   'Type_056_corvette',
  'Bijoy':         'Castle-class_patrol_vessel',
  'Nabajatra':     'Large_patrol_craft',
  'Sangu':         'Patrol_boat',
  'Durjoy':        'Large_patrol_craft',
});

// ── Algerian Navy ──
Object.assign(SHIP_MAP, {
  'Rais Hadj Mubarek': 'Missile_boat',
  'Rais Hadi Slimane': 'Missile_boat',
  'El Yadekh':     'Djebel_Chenoua-class_corvette',
  'El Kechef':     'Djebel_Chenoua-class_corvette',
  'Djebel Chenoua': 'Djebel_Chenoua-class_corvette',
  'Kalaat Beni':   'Corvette',
  'Rais Hamidou':  'Corvette',
  'Mourad Rais':   'Corvette',
  'Erradii':       'Frigate',
  'Adhafer':       'Frigate',
});

// ── Bulgarian Navy ──
Object.assign(SHIP_MAP, {
  'Mulnaya':       'Wielingen-class_frigate',
  'Uragon':        'Osa-class_missile_boat',
  'Burya':         'Osa-class_missile_boat',
  'Druzki':        'Koni-class_frigate',
  'Smedi':         'Osa-class_missile_boat',
  'Reshitelni':    'Pauk-class_corvette',
  'Tsibar':        'Vanya-class_minesweeper',
  'Trabri':        'Sonya-class_minesweeper',
  'Briz':          'Polnochny-class_landing_ship',
  'Siriys':        'Ropucha-class_landing_ship',
  'Drazki':        'Wielingen-class_frigate',
});

// ── Iraqi Navy ──
Object.assign(SHIP_MAP, {
  'Janada':        'Patrol_boat',
  'Nyryat':        'Patrol_boat',
  'Al Basrah':     'Corvette',
  'PB 90':         'Patrol_boat',
  'Fateh':         'Fast_attack_craft',
  'Swary':         'Patrol_boat',
});

// ── Peruvian Navy ──
Object.assign(SHIP_MAP, {
  'Tacna':         'Landing_ship',
  'Almirante Grau': 'BAP_Almirante_Grau_(CLM-81)',
  'Aguirre':       'De_Ruyter-class_cruiser',
  'Velarde':       'Missile_boat',
  'Palacios':      'Lupo-class_frigate',
  'Paita':         'Gunboat',
  'Carvajal':      'Lupo-class_frigate',
  'Bolognesi':     'Lupo-class_frigate',
});

// ── East German Navy (DDR) ──
Object.assign(SHIP_MAP, {
  'Rostock':       'Koni-class_frigate',
  'Wismar':        'Parchim-class_corvette',
  'Artur Becker':  'Frosch-class_landing_ship',
  'Hoyerswerda':   'Frosch-class_landing_ship',
  'Max Reichpietsch': 'Kondor-class_minesweeper',
  'Albin Kobis':   'Osa-class_missile_boat',
  'Nordpferd':     'Patrol_vessel',
  'Wolgast':       'Patrol_vessel',
});

// ── Nigerian Navy ──
Object.assign(SHIP_MAP, {
  'Erinmi':        'Corvette',
  'Aradu':         'Frigate',
  'Thunder':       'Offshore_patrol_vessel',
  'Centenary':     'Offshore_patrol_vessel',
  'Ambe':          'Landing_ship',
  'Ohue':          'Lerici-class_minehunter',
  'Zaria':         'Fast_attack_craft',
  'Ekpe':          'Fast_attack_craft',
  'Siri':          'Patrol_vessel',
});

// ── Indonesian Navy remaining ──
Object.assign(SHIP_MAP, {
  'Makassar':      'Makassar-class_landing_platform_dock',
  'Mandau':        'Mandau-class_fast_attack_craft',
  'Sampari':       'Sampari-class_fast_attack_craft',
  'Clurit':        'Clurit-class_fast_attack_craft',
  'Andau':         'Patrol_boat',
  'Pulau Rote':    'Landing_ship',
  'Pandrong':      'Torpedo_boat',
  'Todak':         'Torpedo_boat',
  'Boa':           'Patrol_boat',
  'Kakap':         'Patrol_boat',
  'Viper':         'Patrol_boat',
  'Salawaku':      'Patrol_boat',
  'Sibarau':       'Attack-class_patrol_boat',
});

// ── Finnish Navy ──
Object.assign(SHIP_MAP, {
  'Hämeenmaa':     'Hämeenmaa-class_minelayer',
  'Turunmaa':      'Corvette',
  'Tuima':         'Tuima-class_missile_boat',
  'Katanpaa':      'Mine_countermeasures_vessel',
  'Rauma':         'Rauma-class_missile_boat',
  'Hamina':        'Hamina-class_missile_boat',
  'Pansio':        'Pansio-class_minelayer',
});

// ── Moroccan Navy ──
Object.assign(SHIP_MAP, {
  'Errahmani':     'Descubierta-class_corvette',
  'Mohammed V':    'Floréal-class_frigate',
  'Tarik Ben Ziyad': 'FREMM_multipurpose_frigate',
  'Sultan Moulay Ismail': 'Corvette',
  'Mohammed VI':   'FREMM_multipurpose_frigate',
  'Okba':          'Patrol_vessel',
  'El Lahiq':      'Patrol_vessel',
  'Rais Bargach':  'Patrol_vessel',
  'Bir Anzaran':   'Offshore_patrol_vessel',
});

// ── Myanmar Navy ──
Object.assign(SHIP_MAP, {
  'Maga':          'Corvette',
  'Anawratha':     'Aung_Zeya-class_frigate',
  'Tabinshwehti':  'Aung_Zeya-class_frigate',
  'Aung Zeya':     'Aung_Zeya-class_frigate',
  'Kyan Sittha':   'Kyan_Sittha-class_frigate',
  'Mahar Bandoola': 'Frigate',
  'Gunboat':       'Gunboat',
  'Missile Boat':  'Missile_boat',
});

// ── New Zealand Navy ──
Object.assign(SHIP_MAP, {
  'Endeavour':     'HMNZS_Endeavour_(A11)',
  'Otago':         'Offshore_patrol_vessel',
  'Canterbury':    'HMNZS_Canterbury_(L421)',
  'Te Kaha':       'Anzac-class_frigate',
  'Rotoiti':       'Protector-class_inshore_patrol_vessel',
});

// ── Omani Navy ──
Object.assign(SHIP_MAP, {
  'Al Munassir':   'Fast_attack_craft',
  'Saba Al Bahr':  'Patrol_boat',
  'Al Waafi':      'Patrol_boat',
  'Qahir Al Amwaj': 'Qahir-class_corvette',
  'Al-Shamikh':    'Khareef-class_corvette',
  'Al Bushra':     'Patrol_vessel',
  'Dhofar':        'Patrol_vessel',
  'Al-Seeb':       'Fast_attack_craft',
});

// ── South African Navy ──
Object.assign(SHIP_MAP, {
  'Outeniqua':     'Replenishment_ship',
  'Protea':        'Survey_vessel',
  'Amatola':       'Valour-class_frigate',
  'President Kruger': 'President-class_frigate',
  'Jan Smuts':     'Minister-class_fast_attack_craft',
  'Isaac Dyboha':  'Fast_attack_craft',
  'Manthatisi':    'Heroine-class_submarine',
  'Maria van Riebeeck': 'Daphné-class_submarine',
});

// ── Saudi Navy ──
Object.assign(SHIP_MAP, {
  'Al Jawf':       'Mine_hunter',
  'Badr':          'Badr-class_corvette',
  'Al Madinah':    'Al_Madinah-class_frigate',
  'Al Riyadh':     'Al_Riyadh-class_frigate',
  'Addriyah':      'Minesweeper',
});

// ── Libyan Navy ──
Object.assign(SHIP_MAP, {
  'Ras Al Gehis':  'Patrol_boat',
  'Ibn Al Hadrani': 'Patrol_boat',
  'Ibn Ouf':       'Nanuchka-class_corvette',
  'Al Katum':      'Fast_attack_craft',
  'Ziyad':         'Fast_attack_craft',
  'Sharara':       'Patrol_boat',
  'Al Burdi':      'Patrol_boat',
  'Dat Assawari':  'Frigate',
  'Al Hani':       'Koni-class_frigate',
});

// ── Colombian Navy ──
Object.assign(SHIP_MAP, {
  'Cartegena':     'Frigate',
  'Almirante Padilla': 'Almirante_Padilla-class_frigate',
  'Quita Suevo':   'River_gunboat',
  'Valle del Cauca': 'Patrol_vessel',
  '20 de Julio':   'Patrol_vessel',
});

// ── Mexican Navy ──
Object.assign(SHIP_MAP, {
  'Papaloapan':    'Landing_platform_dock',
  'Durango':       'Offshore_patrol_vessel',
  'Oaxaca':        'Offshore_patrol_vessel',
  'Corrientes':    'Patrol_vessel',
});

// ── Syrian Navy ──
Object.assign(SHIP_MAP, {
  'Tir II':        'Tir-class_patrol_vessel',
});

// ── Kenyan Navy ──
Object.assign(SHIP_MAP, {
  'Galana':        'Landing_craft',
  'Mamba':         'Patrol_boat',
  'Simba':         'Patrol_boat',
  'Madaraka':      'Missile_boat',
  'Nyayo':         'Missile_boat',
  'Harambee':      'Patrol_boat',
  'Shupavu':       'Patrol_boat',
});

// ── Lithuanian Navy ──
Object.assign(SHIP_MAP, {
  'Zemaitis':      'Patrol_vessel',
  'Skalvis':       'Hunt-class_mine_countermeasures_vessel',
  'Jotvingis':     'Minelayer',
  'Dzukas':        'Flyvefisken-class_patrol_vessel',
});

// ── Romanian Navy ──
Object.assign(SHIP_MAP, {
  'Tetal':         'Corvette',
  'Marasesti':     'Destroyer',
  'Regele Ferdinand': 'Frigate',
});

// ══════════════════════════════════════════════════════════════════════════════
// INDIVIDUAL SHIP MAPPINGS — unique photos for ships of the same class
// These are longer keys so they win over shorter class-level prefix keys.
// ══════════════════════════════════════════════════════════════════════════════

// ── US Aircraft Carriers (individual) ──
Object.assign(SHIP_MAP, {
  'CVN 68 Nimitz':                  'USS_Nimitz',
  'CVN 69 Dwight D. Eisenhower':   'USS_Dwight_D._Eisenhower',
  'CVN 70 Carl Vinson':            'USS_Carl_Vinson',
  'CVN 71 Theodore Roosevelt':     'USS_Theodore_Roosevelt_(CVN-71)',
  'CVN 72 Abraham Lincoln':        'USS_Abraham_Lincoln_(CVN-72)',
  'CVN 73 George Washington':      'USS_George_Washington_(CVN-73)',
  'CVN 74 John C. Stennis':       'USS_John_C._Stennis',
  'CVN 75 Harry S Truman':        'USS_Harry_S._Truman',
  'CVN 76 Ronald Reagan':         'USS_Ronald_Reagan',
  'CVN 77 George Bush':           'USS_George_H.W._Bush_(CVN-77)',
  'CVN 79 John F. Kennedy':       'USS_John_F._Kennedy_(CVN-79)',
  'CVN 65 Enterprise':            'USS_Enterprise_(CVN-65)',
  'CVN 80 Enterprise':            'USS_Enterprise_(CVN-80)',
  'CV 59 Forrestal':              'USS_Forrestal_(CV-59)',
  'CV 60 Saratoga':               'USS_Saratoga_(CV-60)',
  'CV 61 Ranger':                 'USS_Ranger_(CV-61)',
  'CV 63 Kitty Hawk':             'USS_Kitty_Hawk_(CV-63)',
  'CV 64 Constellation':          'USS_Constellation_(CV-64)',
  'CV 66 America':                'USS_America_(CV-66)',
  'CV 41 Midway':                 'USS_Midway_(CV-41)',
  'CV 43 Coral Sea':              'USS_Coral_Sea_(CV-43)',
  'CV 62 Independence':           'USS_Independence_(CV-62)',
});

// ── US Battleships (individual) ──
Object.assign(SHIP_MAP, {
  'BB 61 Iowa':          'USS_Iowa_(BB-61)',
  'BB 62 New Jersey':    'USS_New_Jersey_(BB-62)',
  'BB 63 Missouri':      'USS_Missouri_(BB-63)',
  'BB 64 Wisconsin':     'USS_Wisconsin_(BB-64)',
});

// ── US Cruisers (individual) ──
Object.assign(SHIP_MAP, {
  'CG 47 Ticonderoga':       'USS_Ticonderoga_(CG-47)',
  'CG 49 Vincennes':         'USS_Vincennes_(CG-49)',
  'CG 52 Bunker Hill':       'USS_Bunker_Hill_(CG-52)',
  'CG 54 Antietam':          'USS_Antietam_(CG-54)',
  'CG 56 San Jacinto':       'USS_San_Jacinto_(CG-56)',
  'CG 59 Princeton':         'USS_Princeton_(CG-59)',
  'CG 68 Anzio':             'USS_Anzio_(CG-68)',
  'CG 70 Lake Erie':         'USS_Lake_Erie_(CG-70)',
  'CG 10 Albany':            'USS_Albany_(CG-10)',
  'CG 27 Josephus Daniels': 'USS_Josephus_Daniels_(CG-27)',
  'CGN 36 California':      'USS_California_(CGN-36)',
  'CGN 38 Virginia':        'USS_Virginia_(CGN-38)',
  'CGN 9 Long Beach':       'USS_Long_Beach_(CGN-9)',
});

// ── US Destroyers (individual) ──
Object.assign(SHIP_MAP, {
  'DDG 51 Arleigh Burke':         'USS_Arleigh_Burke',
  'DDG 72 Mahan':                 'USS_Mahan_(DDG-72)',
  'DDG 85 McCampbell':            'USS_McCampbell',
  'DDG 91 Pinckney':              'USS_Pinckney',
  'DDG 96 Bainbridge':            'USS_Bainbridge_(DDG-96)',
  'DDG 103 Truxtun':              'USS_Truxtun_(DDG-103)',
  'DDG 113 John Finn':            'USS_John_Finn_(DDG-113)',
  'DDG 116 Thomas Hudner':        'USS_Thomas_Hudner',
  'DDG 124 Harvey C. Barnum':     'USS_Harvey_C._Barnum_Jr.',
  'DDG 31 Decatur':               'USS_Decatur_(DDG-31)',
  'DDG 37 Farragut':              'USS_Farragut_(DDG-37)',
  'DDG 42 Mahan':                 'USS_Mahan_(DDG-42)',
  'DDG 19 Tattnall':              'USS_Tattnall_(DDG-19)',
  'DD 963 Spruance':              'USS_Spruance_(DD-963)',
});

// ── US Submarines (individual) ──
Object.assign(SHIP_MAP, {
  // SSN - Los Angeles & others
  'SSN 688 Los Angeles':     'USS_Los_Angeles_(SSN-688)',
  'SSN 700 Dallas':          'USS_Dallas_(SSN-700)',
  'SSN 716 Salt Lake City':  'USS_Salt_Lake_City_(SSN-716)',
  'SSN 719 Providence':      'USS_Providence_(SSN-719)',
  'SSN 751 San Juan':        'USS_San_Juan_(SSN-751)',
  'SSN 771 Columbia':        'USS_Columbia_(SSN-771)',
  'SSN 778 New Hampshire':   'USS_New_Hampshire_(SSN-778)',
  'SSN 784 North Dakota':    'USS_North_Dakota_(SSN-784)',
  'SSN 792 Vermont':         'USS_Vermont_(SSN-792)',
  'SSN 585 Skipjack':        'USS_Skipjack_(SSN-585)',
  'SSN 594 Permit':          'USS_Permit_(SSN-594)',
  'SSN 642 Kamehameha':      'USS_Kamehameha_(SSBN-642)',
  'SSN 671 Narwhal':         'USS_Narwhal_(SSN-671)',
  'SSN 685 Glenard P. Lipscomb': 'USS_Glenard_P._Lipscomb',
  'SSN 21 Seawolf':          'USS_Seawolf_(SSN-21)',
  'SSN 23 Jimmy Carter':     'USS_Jimmy_Carter',
  'SSN 774 Virginia':        'USS_Virginia_(SSN-774)',
  // SSBN/SSGN - Ohio & earlier
  'SSBN 726 Ohio':           'USS_Ohio_(SSGN-726)',
  'SSBN 734 Tennessee':      'USS_Tennessee_(SSBN-734)',
  'SSBN 616 Lafayette':      'USS_Lafayette_(SSBN-616)',
  'SSBN 627 James Madison':  'USS_James_Madison_(SSBN-627)',
  'SSBN 640 Benjamin Franklin': 'USS_Benjamin_Franklin_(SSBN-640)',
  'SSGN 726 Ohio':           'USS_Ohio_(SSGN-726)',
});

// ── US Amphibious (individual) ──
Object.assign(SHIP_MAP, {
  'LHA 6 America':       'USS_America_(LHA-6)',
  'LHA 1 Tarawa':        'USS_Tarawa_(LHA-1)',
  'LHD 1 Wasp':          'USS_Wasp_(LHD-1)',
  'LHD 2 Essex':         'USS_Essex_(LHD-2)',
  'LHD 8 Makin Island':  'USS_Makin_Island_(LHD-8)',
  'LPD 1 Raleigh':       'USS_Raleigh_(LPD-1)',
  'LPD 4 Austin':        'USS_Austin_(LPD-4)',
  'LPD 17 San Antonio':  'USS_San_Antonio_(LPD-17)',
  'LSD 28 Thomaston':    'USS_Thomaston_(LSD-28)',
  'LSD 36 Anchorage':    'USS_Anchorage_(LSD-36)',
  'LSD 41 Whidbey Island': 'USS_Whidbey_Island_(LSD-41)',
  'LSD 49 Harpers Ferry': 'USS_Harpers_Ferry_(LSD-49)',
  'LST 1179 Newport':    'USS_Newport_(LST-1179)',
  'LST 1184 Frederick':  'USS_Frederick_(LST-1184)',
});

// ── US Frigates/Patrol (individual) ──
Object.assign(SHIP_MAP, {
  'FFG 7 Oliver Hazard Perry': 'USS_Oliver_Hazard_Perry',
  'FFG 36 Underwood':         'USS_Underwood_(FFG-36)',
  'FFG 1 Brooke':             'USS_Brooke_(FFG-1)',
  'FF 1052 Knox':             'USS_Knox_(FF-1052)',
  'LCS 1 Freedom':            'USS_Freedom_(LCS-1)',
  'LCS 2 Independence':       'USS_Independence_(LCS-2)',
  'LCS 17 Indianapolis':      'USS_Indianapolis_(LCS-17)',
  'PC 1 Cyclone':             'USS_Cyclone_(PC-1)',
});

// ── US Auxiliaries (individual) ──
Object.assign(SHIP_MAP, {
  'AOE 1 Sacramento':      'USS_Sacramento_(AOE-1)',
  'AOE 6 Supply':          'USS_Supply_(AOE-6)',
  'AOE 8 Arctic':          'USNS_Arctic_(T-AOE-8)',
  'AO 177 Cimarron':       'USS_Cimarron_(AO-177)',
  'AO 105 Mispillion':     'USS_Mispillion_(AO-105)',
  'AO 51 Ashtabula':       'USS_Ashtabula_(AO-51)',
  'AE 21 Suribachi':       'USS_Suribachi_(AE-21)',
  'AE 23 Nitro':           'USS_Nitro_(AE-23)',
  'AE 26 Kilauea':         'USS_Kilauea_(AE-26)',
  'AE 27 Butte':           'USS_Butte_(AE-27)',
  'T-AE 26 Kilauea':       'USS_Kilauea_(AE-26)',
  'T-AE 27 Butte':         'USS_Butte_(AE-27)',
  'T-AO 187 Henry J. Kaiser': 'USNS_Henry_J._Kaiser_(T-AO-187)',
  'T-AO 182 Columbia':     'USNS_Leroy_Grumman_(T-AO-195)',
  'T-AO 143 Neosho':       'USS_Neosho_(AO-143)',
  'T-AFS 8 Sirius':        'USNS_Sirius_(T-AFS-8)',
  'AGF 3 La Salle':        'USS_La_Salle_(AGF-3)',
  'AGF 11 Coronado':       'USS_Coronado_(AGF-11)',
  'T-AKR 300 Bob Hope':    'USNS_Bob_Hope_(T-AKR-300)',
  'T-AKR 310 Watson':      'USNS_Watson_(T-AKR-310)',
  'T-AKR 287 Algol':       'SS_Algol_(T-AKR-287)',
  'T-AKR 296 Gordon':      'USNS_Gordon_(T-AKR-296)',
  'T-AKR 295 Shughart':    'USNS_Shughart_(T-AKR-295)',
  'T-AKE 1 Lewis and Clark': 'USNS_Lewis_and_Clark_(T-AKE-1)',
  'T-AGOS 1 Stalwart':     'USNS_Stalwart_(T-AGOS-1)',
  'T-AGOS 19 Victorious':  'USNS_Victorious_(T-AGOS-19)',
  'T-AGOS 23 Impeccable':  'USNS_Impeccable_(T-AGOS-23)',
  'T-AGM 23 Observation Island': 'USNS_Observation_Island_(T-AGM-23)',
  'T-AGM 25 Howard O. Lorenzen': 'USNS_Howard_O._Lorenzen_(T-AGM-25)',
  'T-AH 19 Mercy':         'USNS_Mercy_(T-AH-19)',
  'T-AVB 3 Wright':        'SS_Wright_(T-AVB-3)',
  'T-AOE 6 Supply':        'USNS_Supply_(T-AOE-6)',
});

// ── US Coast Guard (individual) ──
Object.assign(SHIP_MAP, {
  'WMEC 901 Bear':         'USCGC_Bear_(WMEC-901)',
  'WMEC 615 Reliance':     'USCGC_Reliance_(WMEC-615)',
  'WMEC 39 Alex Haley':    'USCGC_Alex_Haley_(WMEC-39)',
  'WPB 1301 Farallon':     'Island-class_patrol_boat',
  'WPC 1101 Bernard C. Webber': 'USCGC_Bernard_C._Webber_(WPC-1101)',
});

// ── UK Royal Navy (individual) ──
Object.assign(SHIP_MAP, {
  'R 05 Invincible':       'HMS_Invincible_(R05)',
  'R 06 Illustrious':      'HMS_Illustrious_(R06)',
  'R 07 Ark Royal':        'HMS_Ark_Royal_(R07)',
  'R 12 Hermes':           'HMS_Hermes_(R12)',
  'R 08 Bulwark':          'Centaur-class_aircraft_carrier',
  'D 80 Sheffield':        'HMS_Sheffield_(D80)',
  'F 85 Cornwall':         'HMS_Cornwall_(F99)',
  'F 88 Broadsword':       'HMS_Broadsword_(F88)',
  'F 92 Boxer':            'HMS_Boxer_(F92)',
  'F 109 Leander':         'HMS_Leander_(F109)',
  'F 12 Achilles':         'HMS_Achilles_(F12)',
  'F 40 Sirius':           'HMS_Sirius_(F40)',
  'F 57 Andromeda':        'HMS_Andromeda_(F57)',
  'D 02 Devonshire':       'HMS_Devonshire_(D02)',
  'D 20 Fife':             'HMS_Fife_(D20)',
  'D 35 Dragon':           'HMS_Dragon_(D35)',
  'P 257 Clyde':           'HMS_Clyde_(P257)',
  'P 281 Tyne':            'HMS_Tyne_(P281)',
  'P 2XX Forth':           'HMS_Forth_(P222)',
  'S 518 Nazario Sauro':   'Sauro-class_submarine',
});

// ── Japanese Navy (JMSDF) individual destroyers ──
Object.assign(SHIP_MAP, {
  'DD 101 Murasame':       'Murasame-class_destroyer_(1994)',
  'DD 110 Takanami':       'Takanami-class_destroyer',
  'DD 115 Akizuki':        'Akizuki-class_destroyer_(2010)',
  'DD 122 Hatsuyuki':      'Hatsuyuki-class_destroyer',
  'DD 129 Yamayuki':       'Hatsuyuki-class_destroyer',
  'DD 151 Asagiri':        'Asagiri-class_destroyer',
  'DD 155 Hamagiri':       'Asagiri-class_destroyer',
  'DD 164 Takatsuki':      'Takatsuki-class_destroyer',
  'DDG 163 Amatsukaze':    'JDS_Amatsukaze',
  'DDG 168 Tachikaze':     'Tachikaze-class_destroyer',
  'DDG 171 Hatakaze':      'Hatakaze-class_destroyer',
  'DDG 173 Kongo':         'Kongō-class_destroyer',
  'DDG 177 Atago':         'Atago-class_destroyer',
  // Japanese subs (not Russian!)
  'SS 566 Uzushio':        'Uzushio-class_submarine',
  'SS 573 Yushio':         'Yūshio-class_submarine',
  'SS 583 Harushio':       'Harushio-class_submarine',
  'SS 571 Takashio':       'Uzushio-class_submarine',
  'SS 568 Isoshio':        'Submarine',
  // Japanese amphibious
  'LST 4001 Osumi':        'Ōsumi-class_tank_landing_ship',
  'LST 4101 Atsumi':       'Atsumi-class_tank_landing_ship',
  'LST 4151 Miura':        'Miura-class_tank_landing_ship',
  // Japanese auxiliaries
  'AOE 421 Sagami':        'Replenishment_oiler',
  'AOE 422 Towada':        'Replenishment_oiler',
  'AOE 425 Masyu':         'Replenishment_oiler',
});

// ── French Navy (individual) ──
Object.assign(SHIP_MAP, {
  'D 610 Tourville':       'Tourville-class_frigate',
  'D 640 Georges Leygues': 'Georges_Leygues-class_frigate',
  'D 644 Primauguet':      'Georges_Leygues-class_frigate',
  'R 91 Charles De Gaulle': 'French_aircraft_carrier_Charles_de_Gaulle',
});

// ── Chinese Navy (individual) — reduce class-level duplicates ──
Object.assign(SHIP_MAP, {
  'Type 053H Jianghu I':     'Type_053H_frigate',
  'Type 053H1 Jianghu II':   'Type_053_frigate',
  'Type 053H1G Jianghu V':   'Type_053_frigate',
  'Type 053H2 Jianghu III':  'Type_053_frigate',
  'Type 053H2G Jiangwei':    'Type_053H2G_frigate',
  'Type 053H3 Jiangwei II':  'Type_053H3_frigate',
  'Type 053HT-H Jianghu IV': 'Type_053_frigate',
  'Type 053K Jiangdong':     'Type_053_frigate',
  'Type 051 Mod 1 Luda I':   'Type_051_destroyer',
  'Type 051 Mod 1A Luda II': 'Luda-class_destroyer',
  'Type 051G Mod 3 Luda III': 'Type_051_destroyer',
  'DDG 136 Hangzhou':        'Sovremenny-class_destroyer',
  'DDG 138 Taizhou':         'Sovremenny-class_destroyer',
  'Type 033 Romeo':          'Romeo-class_submarine',
  'Type 035 Ming':           'Submarine',
  'Type 035B Ming':          'Submarine',
  'Type 035G Ming':          'Submarine',
  'Type 039 Song':           'Type_039_submarine',
  'Type 039G Song':          'Type_039_submarine',
  'Type 039G1 Song':         'Type_039_submarine',
  'Type 037 Hainan':         'Hainan-class_submarine_chaser',
  'Type 037-I Haijiu':       'Type_037-class_submarine_chaser',
  'Type 037-IG Houxin':      'Type_037-class_submarine_chaser',
  'Type 037-II Houjian':     'Missile_boat',
  'Type 037-IS Haiqing':     'Submarine_chaser',
  'Type 062 Shanghai I':     'Gunboat',
  'Type 062 Shanghai II':    'Gunboat',
  'Type 072 Yukan':          'Type_072-class_landing_ship',
  'Type 072-II Yuting I':    'Landing_ship',
  'Type 072-III Yuting IIA': 'Type_072A-class_landing_ship',
});

// ── South Korean Navy (individual) ──
Object.assign(SHIP_MAP, {
  'DD 915 Chungbuk':     'Chungbuk-class_destroyer',
  'DD 916 Jeonbuk':      'Chungbuk-class_destroyer',
  'DD 917 Dae Gu':       'Chungbuk-class_destroyer',
  'DD 919 Taejo':        'Chungmu-class_destroyer',
  'DD 923 Kyonggi':      'Ulsan-class_frigate',
  'LST 671 Un Bong':     'Go_Jun_Bong-class_tank_landing_ship',
  'LST 681 Go Jun Bong': 'Go_Jun_Bong-class_tank_landing_ship',
  'LST 686 Cheon Wang':  'Go_Jun_Bong-class_tank_landing_ship',
});

// ── Turkish Navy submarines (individual) ──
Object.assign(SHIP_MAP, {
  'S 336 Muratreis':     'Preveze-class_submarine',
  'S 341 Çanakkale':     'Type_209_submarine',
  'S 343 Pirireis':      'Type_209_submarine',
  'S 347 Atilay':        'Atilay-class_submarine',
  'S 353 Preveze':       'Preveze-class_submarine',
  'S 361 Cerbe':         'Type_214_submarine',
  'D 346 Alcitepe':      'Gearing-class_destroyer',
  'D 349 Kilicalipasa':  'Gearing-class_destroyer',
  'D 354 Kocatepe':      'Gearing-class_destroyer',
});

// ── German submarines (individual) ──
Object.assign(SHIP_MAP, {
  'S 181 U 31':  'Type_212_submarine',
  'S 190 U 11':  'Type_206_submarine',
  'S 192 U 13':  'Type_206_submarine',
});

// ── Italian submarines (individual) ──
Object.assign(SHIP_MAP, {
  'S 518 Nazario Sauro':   'Submarine',
  'S 522 Salvatore Pelosi': 'Submarine',
  'S 524 Primo Longobardo': 'Submarine',
});

// ══════════════════════════════════════════════════════════════════════════════
// ADDITIONAL SHIP MAPPINGS — previously unmapped ships
// ══════════════════════════════════════════════════════════════════════════════

Object.assign(SHIP_MAP, {
  // ── China (PLAN) ──
  'Type 024':       'Missile_boat',
  'Type 067':       'Type_067_utility_landing_craft',
  'Type 068':       "People's_Liberation_Army_Navy",
  'Type 073-2':     'Type_073-class_landing_ship',
  'Type 073-3':     'Type_073-class_landing_ship',
  'Type 073A':      'Type_073-class_landing_ship',
  'Type 074':       'Type_074-class_landing_ship',
  'Type 079':       'Landing_ship',
  'Type 0891A':     'Mine_countermeasures_vessel',
  'Type 271':       'Type_271_landing_craft',
  'Type 65':        'Frigate',
  'Type 6601':      'Riga-class_frigate',
  'Type 6610':      'Minesweeper',
  'Type 724':       'Type_037_corvette',
  'Type 795':       "People's_Liberation_Army_Navy",
  'Type 814A':      "People's_Liberation_Army_Navy",
  'Type 815':       'Type_815_spy_ship',
  'Type 818':       'Icebreaker',
  'Type 904':       'Auxiliary_ship',
  'Type 905':       'Type_905_replenishment_ship',
  'Type 908':       'Hospital_ship',
  'Type 922':       'Salvage_tug',
  'Type 925':       'Submarine_tender',
  'Qiongsha':       "People's_Liberation_Army_Navy",
  'Type xxx':       "People's_Liberation_Army_Navy",

  // ── South Korea (ROKN) ──
  '072 Son Won-Il':      'Son_Won-il-class_submarine',
  'DDH 971 Kwanggaeto':  'Gwanggaeto_the_Great-class_destroyer',
  'DDH 978 Wang Geon':   'Gwanggaeto_the_Great-class_destroyer',
  'LSF 621':             'Republic_of_Korea_Navy',
  'PCC 756 Po Hang':     'Pohang-class_corvette',
  'PCC 761':             'Pohang-class_corvette',
  'PCC 766':             'Pohang-class_corvette',
  'PCC 769':             'Pohang-class_corvette',
  'PCC 778':             'Pohang-class_corvette',
  'PK 151 Chebi':        'Chamsuri-class_patrol_boat',
  'PKG 711 Yoon Young Ha': 'Patrol_vessel',

  // ── United States (USN) ──
  'LCP':                 'Landing_craft',
  'MSV Cragside':        'United_States_Navy',
  'NSWTU Atlantic':      'Naval_Special_Warfare_Command',
  'NSWTU Pacific':       'Naval_Special_Warfare_Command',
  'RB-M 45601':          'United_States_Navy',
  'SBX 1':               'Sea-based_X-band_Radar',
  'US CCM Mk1 PB':       'Patrol_boat',
  'US Mk3 Sea Spectre PB': 'Special_warfare_combatant-craft_crewmen',
  'US Mk5 Pegasus PB':   'Mark_V_Special_Operations_Craft',
  'US Mk6 PB':           'Mark_VI_patrol_boat',
  'SEAL ASDS':           'Advanced_SEAL_Delivery_System',

  // ── Russia ──
  'DKA Dyugon':          'Dyugon-class_landing_craft',
  'DKA Serna':           'Serna-class_landing_craft',
  'NORSUB-5':            'Submarine',
  'PK Vasil Bykov':      'Patrol_ship',
  'PL-20120':            'Russian_Navy',
  'PLARB-955':           'Borei-class_submarine',
  'SKR Admiral Sergey Gorshkov': 'Admiral_Gorshkov-class_frigate',
  'Triton-NN':           'Russian_Navy',
  'VTR Academician Pashin': 'Replenishment_oiler',

  // ── Soviet Union ──
  'AK Komar':            'Soviet_Navy',
  'PL-611':              'Zulu-class_submarine',
  'PLA-685':             'Mike-class_submarine',
  'PLARK-661':           'Papa-class_submarine',
  'T-43':                'Minesweeper',
  'T-58':                'Minesweeper',
  'VT Uda':              'Uda-class_oiler',

  // ── Ireland ──
  'P 21 Emer':           'Patrol_vessel',
  'P 31 Eithne':         'LÉ_Eithne_(P31)',
  'P 41 Orla':           'Róisín-class_patrol_vessel',
  'P 51 Roisin':         'Róisín-class_patrol_vessel',
  'P 61 Samuel Beckett': 'Samuel_Beckett-class_offshore_patrol_vessel',

  // ── Turkey ──
  'C-107':               'Landing_craft_utility',
  'C-139':               'Landing_craft_utility',
  'C-151':               'Landing_craft_tank',
  'C-305':               'Turkish_Naval_Forces',
  'P 125':               'Turkish_Naval_Forces',

  // ── Bahrain ──
  '10 Al Riffa':         'Corvette',
  '22 Abdul Rahman':     'Royal_Bahrain_Naval_Force',
  '50 Al Manama':        'Corvette',
  '90 Sabha':            'Royal_Bahrain_Naval_Force',

  // ── Ecuador ──
  'CM 11 Esmeraldas':    'Esmeraldas-class_corvette',
  'LM 21 Quito':         'Missile_boat',
  'LM 25 Manta':         'Missile_boat',
  'S 101 Shyri':         'Type_209_submarine',

  // ── India ──
  'D 61 Delhi':          'Delhi-class_destroyer',
  'F 40 Talwar':         'Talwar-class_frigate',
  'F 45 Teg':            'Talwar-class_frigate',
  'T 80':                'Indian_Navy',

  // ── Syria ──
  '1-114':               'Osa-class_missile_boat',
  '1-508':               'Osa-class_missile_boat',
  '1-8':                 'Osa-class_missile_boat',
  '532':                 'Syrian_Arab_Navy',

  // ── Yugoslavia ──
  'DBM 241 Silba':       'Yugoslav_Navy',
  'P 831 Sava':          'Submarine',
  'RF 31 Split':         'Frigate',
  'RF 33 Kotor':         'Kotor-class_frigate',

  // ── Belgium ──
  'F 910 Wielingen':     'Wielingen-class_frigate',
  'F 930 Leopold I':     'Karel_Doorman-class_frigate',
  'M 915 Aster':         'Tripartite-class_minehunter',

  // ── Estonia ──
  'A 230 Admiral Pitka': 'Estonian_Navy',
  'M 313':               'Sandown-class_minehunter',
  'M 411':               'Sandown-class_minehunter',

  // ── Iran ──
  'IPS-18 Tir':          'Islamic_Republic_of_Iran_Navy',
  'MIG':                 'Islamic_Republic_of_Iran_Navy',

  // ── Iceland ──
  'ICGV Aegir':          'Patrol_vessel',
  'ICGV Odinn':          'Patrol_vessel',
  'ICGV Thor':           'Patrol_vessel',

  // ── Kuwait ──
  'P 3711':              'Kuwait_Naval_Force',
  'P 4501':              'Kuwait_Naval_Force',
  'P 5702':              'Kuwait_Naval_Force',

  // ── Lebanon ──
  '21 Sour':             'Lebanese_Navy',
  '401':                 'Lebanese_Navy',
  'LCSC 42':             'Lebanese_Navy',

  // ── Latvia ──
  'M 01':                'Tripartite-class_minehunter',
  'M 04':                'Tripartite-class_minehunter',
  'P 05 Skrunda':        'Latvian_National_Armed_Forces',

  // ── Yemen ──
  '124':                 'Osa-class_missile_boat',
  '126':                 'Osa-class_missile_boat',
  '2601 Sanaa':          'Tarantul-class_corvette',

  // ── Brazil ──
  'D 27 Para':           'Garcia-class_frigate',
  'G 40 Bahia':          'Brazilian_Navy',

  // ── Cameroon ──
  'P 104':               'Cameroon',
  'P 106':               'Cameroon',

  // ── Equatorial Guinea ──
  'F 047':               'Equatorial_Guinea',
  'F 073':               'Equatorial_Guinea',

  // ── Greece ──
  'F 452 Hydra':         'Hydra-class_frigate',
  'M 62 Europe':         'Hunt-class_mine_countermeasures_vessel',

  // ── Croatia ──
  'OB 61 Novigrad':      'Croatian_Navy',
  'RTOP 21':             'Croatian_Navy',

  // ── Qatar ──
  'Q 01':                'Fast_attack_craft',
  'Q 04':                'Fast_attack_craft',

  // ── Ukraine ──
  'BG 31':               'Ukrainian_Navy',
  'U 762 Rivne':         'Ukrainian_Navy',

  // ── Vietnam ──
  'HQ 09':               "Vietnam_People's_Navy",
  'HQ 13':               "Vietnam_People's_Navy",

  // ── Angola ──
  'Argos Class':         'Angola',

  // ── Bulgaria ──
  '51':                  'Bulgarian_Navy',

  // ── Cuba ──
  'S 725':               'Cuban_Revolutionary_Navy',

  // ── East Germany ──
  '900':                 'Volksmarine',

  // ── Germany ──
  'D 170 Z1':            'Hamburg-class_destroyer',

  // ── Egypt ──
  'S 41':                'Type_209_submarine',

  // ── France ──
  'LCM':                 'Landing_craft_mechanized',

  // ── United Kingdom ──
  'Hartland Point':      'Landing_ship',

  // ── Iraq ──
  '310':                 'Osa-class_missile_boat',

  // ── Japan ──
  'PG 01':               'Hayabusa-class_patrol_boat',

  // ── Myanmar ──
  '491':                 'Myanmar_Navy',

  // ── Nigeria ──
  'P 247':               'Nigerian_Navy',

  // ── Romania ──
  'V1':                  'Romanian_Naval_Forces',

  // ── Serbia ──
  'RF 31 Beograd':       'Kotor-class_frigate',

  // ── Taiwan ──
  'S-1':                 'Republic_of_China_Navy',

  // ── Uruguay ──
  '1 Uruguay':           'Uruguayan_Navy',

  // ── Guatemala ──
  'GC-H 656':            'Guatemalan_Navy',
});

function getShipWiki(name) {
  const keys = Object.keys(SHIP_MAP).sort((a,b) => b.length - a.length);
  for (const k of keys) { if (name.startsWith(k) || name.includes(k)) return SHIP_MAP[k]; }
  // Russian ship naming: often "Pr. XXXX" or class name
  if (name.includes('Mod ')) return 'Russian_Navy';
  return null;
}

// ─── Ground units ────────────────────────────────────────────────────────────
const ARMOR_MAP = {
  'T-14':  'T-14_Armata',
  'T-34':  'T-34',
  'T-44':  'T-44',
  'T-54':  'T-54/T-55',
  'T-55':  'T-54/T-55',
  'T-62':  'T-62',
  'T-64':  'T-64',
  'T-72':  'T-72',
  'T-80':  'T-80',
  'T-90':  'T-90',
  'BMP-1': 'BMP-1',
  'BMP-2': 'BMP-2',
  'BMP-3': 'BMP-3',
  'BMD-1': 'BMD-1',
  'BMD-2': 'BMD-2',
  'BMD-3': 'BMD-3',
  'BMD-4': 'BMD-4',
  'BTR-50':'BTR-50',
  'BTR-60':'BTR-60',
  'BTR-70':'BTR-70',
  'BTR-80':'BTR-80',
  'BTR-82':'BTR-82',
  'BTR-90':'BTR-90',
  'MT-LB': 'MT-LB',
  'BRDM':  'BRDM-2',
  'PT-76': 'PT-76',
  'GAZ':   'GAZ_Tigr',
  'Kurganets':'Kurganets-25',
  'Boomerang':'Bumerang',
  // Chinese tanks
  'Type 59': 'Type_59_tank',
  'Type 63': 'Type_63_amphibious_tank',
  'Type 69': 'Type_69_tank',
  'Type 79': 'Type_79_tank',
  'Type 85': 'Type_85_tank',
  'Type 88': 'Type_88_tank',
  'Type 96': 'Type_96_tank',
  'Type 99': 'Type_99_tank',
  'ZTD-05': 'ZTD-05',
  'ZTL-09': 'ZTL-09',
  'ZTQ':    'Type_15_light_tank',
  'ZBD-04': 'ZBD-04',
  'ZBD-05': 'ZBD-05',
  'ZBD-08': 'ZBD-08',
  'ZBL-09': 'ZBL-09',
  'Type 86': 'Type_86_infantry_fighting_vehicle',
  'Type 90 APC': 'Type_90_APC',
};

// ── Western Armor (added to ARMOR_MAP inline) ─────────────────────────────────
Object.assign(ARMOR_MAP, {
  // US
  'M1A2':      'M1_Abrams',
  'M1A1':      'M1_Abrams',
  'M1 ':       'M1_Abrams',
  'Abrams':    'M1_Abrams',
  'M2 ':       'M2_Bradley',
  'M3 ':       'M2_Bradley',
  'Bradley':   'M2_Bradley',
  'M113':      'M113_armored_personnel_carrier',
  'M109':      'M109_howitzer',
  'M270':      'M270_MLRS',
  'MLRS':      'M270_MLRS',
  'HIMARS':    'M142_HIMARS',
  'Stryker':   'Stryker',
  'LAV-25':    'LAV-25',
  'AAV':       'Assault_Amphibious_Vehicle',
  'Humvee':    'Humvee',
  // UK
  'Challenger 2': 'Challenger_2',
  'Challenger 1': 'Challenger_1',
  'Chieftain':    'Chieftain_tank',
  'Warrior':      'Warrior_infantry_fighting_vehicle',
  'FV432':        'FV432',
  'Saxon':        'Saxon_APC',
  // Germany
  'Leopard 2A7':  'Leopard_2',
  'Leopard 2A6':  'Leopard_2',
  'Leopard 2A5':  'Leopard_2',
  'Leopard 2A4':  'Leopard_2',
  'Leopard 2':    'Leopard_2',
  'Leopard 1':    'Leopard_1',
  'Marder':       'Marder_infantry_fighting_vehicle',
  'Puma':         'Puma_infantry_fighting_vehicle',
  'Boxer':        'Boxer_MRAV',
  'Wiesel':       'Wiesel_AWC',
  'Fuchs':        'TPz_Fuchs',
  // France
  'Leclerc':   'Leclerc_tank',
  'AMX-56':    'Leclerc_tank',
  'AMX-30':    'AMX-30',
  'AMX-10':    'AMX-10',
  'VAB':       'Véhicule_de_l\'avant_blindé',
  'VBCI':      'VBCI',
  // Israel
  'Merkava':   'Merkava',
  'Namer':     'Namer',
  'Achzarit':  'Achzarit',
  // Italy
  'Ariete':    'C1_Ariete',
  'Dardo':     'VCC-80_Dardo',
  'Centauro':  'B1_Centauro',
  // South Korea
  'K2 ':       'K2_Black_Panther',
  'K1A1':      'K1_88-Tank',
  'K1 ':       'K1_88-Tank',
  'K21':       'K21',
  // Japan
  'Type 10':   'Type_10_tank',
  'Type 74':   'Type_74_tank',
  'Type 90':   'Type_90_tank',
  // India
  'Arjun':     'Arjun_(tank)',
  // Turkey
  'Altay':     'Altay_(tank)',
  'ACV-15':    'AIFV',
  // Generic
  'AMX-':      'AMX-30',
  'M-84':      'M-84',
  'M-60':      'M60_Patton',
  'M48':       'M48_Patton',
  'M47':       'M47_Patton',
  'M46':       'M46_Patton',
  'Sherman':   'M4_Sherman',
  'Centurion': 'Centurion_tank',
});

function getArmorWiki(name) {
  // Extract vehicle name from within parentheses
  const m = name.match(/\((.+?)(?:\s*x\s*\d+)?\)/);
  const inner = m ? m[1] : name;
  const keys = Object.keys(ARMOR_MAP).sort((a,b) => b.length - a.length);
  for (const k of keys) { if (inner.startsWith(k) || inner.includes(k)) return ARMOR_MAP[k]; }
  return null;
}

const ARTY_MAP = {
  // Russian/Soviet
  '2S1':   '2S1_Gvozdika',
  '2S3':   '2S3_Akatsiya',
  '2S4':   '2S4_Tyulpan',
  '2S5':   '2S5_Giatsint-S',
  '2S6':   '2S6_Tunguska',
  '2S7':   '2S7_Pion',
  '2S9':   '2S9_Nona',
  '2S19':  '2S19_Msta',
  '2S25':  '2S25_Sprut-SD',
  '2S33':  '2S19_Msta',
  '2S34':  '2S1_Gvozdika',
  '2S35':  '2S35_Koalitsiya-SV',
  '2A65':  '2A65',
  'D-20':  'D-20_(howitzer)',
  'D-30':  'D-30_(howitzer)',
  'M-46':  'M-46_(howitzer)',
  'BM-21': 'BM-21_Grad',
  'BM-27': 'BM-27_Uragan',
  'BM-30': 'BM-30_Smerch',
  'Tornado':'BM-30_Smerch',
  'Iskander':'Iskander_(missile_system)',
  'Scud':  'Scud_(missile)',
  'SS-1':  'Scud_(missile)',
  'SS-21': 'OTR-21_Tochka',
  'SS-26': 'Iskander_(missile_system)',
  'Tochka':'OTR-21_Tochka',
  'R-17':  'Scud_(missile)',
  'P-15':  'P-15_Termit',
  'P-35':  'P-35_(missile)',
  'P-500': 'P-500_Bazalt',
  'P-800': 'P-800_Oniks',
  'K-300': 'K-300P_Bastion-P',
  'Bastion':'K-300P_Bastion-P',
  'Bal':   'Bal_(coastal_defence_missile_system)',
  'Redut': 'Redut_(coastal_defence_missile_system)',
  'Rubezh':'Redut_(coastal_defence_missile_system)',
  'Club-K':'3M-54_Kalibr',
  '3K60':  'Bal_(coastal_defence_missile_system)',
  '4K51':  'P-15_Termit',
  // Chinese
  'SY-400':'SY-400',
  'PLZ-05':'PLZ-05',
  'PLZ-07':'PLZ-07',
  'PLZ-89':'PLZ-89',
  'PHL-03':'PHL-03',
  'Dongfeng':'Dongfeng_(missile)',
  'DF-':   'Dongfeng_(missile)',
  'CJ-10': 'CJ-10',
  'YJ-62': 'YJ-62',
  'C-801': 'YJ-8',
  'C-802': 'YJ-8',
  'HY-2':  'HY-2',
  'Harpy': 'IAI_Harpy',
};

// ── Western Artillery (added to ARTY_MAP inline) ──────────────────────────────
Object.assign(ARTY_MAP, {
  'M109A':    'M109_howitzer',
  'M109':     'M109_howitzer',
  'M270 MLRS':'M270_MLRS',
  'M270':     'M270_MLRS',
  'HIMARS':   'M142_HIMARS',
  'ATACMS':   'MGM-140_ATACMS',
  'MGM-140':  'MGM-140_ATACMS',
  'PzH 2000': 'PzH_2000',
  'PzH2000':  'PzH_2000',
  'AS-90':    'AS-90',
  'AS90':     'AS-90',
  'Caesar':   'CAESAR_howitzer',
  'CAESAR':   'CAESAR_howitzer',
  'K9 ':      'K9_Thunder',
  'K9T':      'K9_Thunder',
  'AHS Krab': 'Krab_howitzer',
  'Archer':   'Archer_artillery_system',
  'FH77':     'FH77',
  'ATMOS':    'ATMOS_2000',
  'LYNX':     'Lynx_rocket_system',
  'BM-21':    'BM-21_Grad',
  'BM-27':    'BM-27_Uragan',
  'BM-30':    'BM-30_Smerch',
  'Hades':    'Hades_(missile)',
  'HARM':     'AGM-88_HARM',
  'RBS-15':   'RBS-15',
  'NSM':      'Naval_Strike_Missile',
  'JSM':      'Naval_Strike_Missile',
});

function getArtyWiki(name) {
  const keys = Object.keys(ARTY_MAP).sort((a,b) => b.length - a.length);
  for (const k of keys) { if (name.includes(k)) return ARTY_MAP[k]; }
  return null;
}

const AD_MAP = {
  // ── NATO / Western SAMs ──────────────────────────────────────────────────────
  'Patriot PAC-3':  'MIM-104_Patriot',
  'Patriot PAC-2':  'MIM-104_Patriot',
  'Patriot':        'MIM-104_Patriot',
  'NASAMS':         'NASAMS',
  'SAMP/T':         'Aster_(missile)',
  'Aster 30':       'Aster_(missile)',
  'Aster 15':       'Aster_(missile)',
  'HAWK':           'MIM-23_Hawk',
  'MIM-23':         'MIM-23_Hawk',
  'Nike Hercules':  'MIM-14_Nike_Hercules',
  'Nike Ajax':      'MIM-3_Nike_Ajax',
  'Roland':         'Roland_(missile)',
  'Crotale':        'Crotale_(missile)',
  'Mistral':        'MBDA_Mistral',
  'Rapier':         'Rapier_(missile)',
  'Starstreak':     'Starstreak_missile',
  'Skyguard':       'Skyguard',
  'Gepard':         'Gepard_tank',
  'IRIS-T SL':      'IRIS-T',
  'RBS 70':         'RBS_70',
  'RBS70':          'RBS_70',
  'Stinger':        'FIM-92_Stinger',
  'FIM-92':         'FIM-92_Stinger',
  'FIM-43':         'FIM-43_Redeye',
  'Redeye':         'FIM-43_Redeye',
  'Blowpipe':       'Blowpipe_missile',
  'Javelin':        'Javelin_(surface-to-air_missile)',
  'Chaparral':      'MIM-72_Chaparral',
  'MIM-72':         'MIM-72_Chaparral',
  'Vulcan/Phalanx': 'M163_VADS',
  'M163 VADS':      'M163_VADS',
  'Oerlikon':       'Oerlikon_35_mm_twin_cannon',
  'Bofors':         'Bofors_40_mm_autocannon',
  'Aspide':         'Aspide_(missile)',
  'SPADA':          'Aspide_(missile)',
  'SHORAD':         'Short-range_air_defense',
  'Avenger':        'M1097_Avenger',
  'THAAD':          'Terminal_High_Altitude_Area_Defense',
  'Arrow':          'Arrow_(Israeli_missile)',
  'Iron Dome':      'Iron_Dome',
  'David\'s Sling': 'David\'s_Sling',
  'Spyder':         'SPYDER',
  // Russian/Soviet SAMs
  'S-300':   'S-300_missile_system',
  'S-350':   'S-350_Vityaz',
  'S-400':   'S-400_missile_system',
  'S-500':   'S-500_missile_system',
  'S-75':    'S-75_Dvina',
  'S-125':   'S-125_Neva/Pechora',
  'S-200':   'S-200_(missile)',
  'SA-10':   'S-300_missile_system',
  'SA-11':   'Buk_missile_system',
  'SA-12':   'S-300V',
  'SA-13':   '9K35_Strela-10',
  'SA-15':   'Tor_missile_system',
  'SA-17':   'Buk_missile_system',
  'SA-19':   '2S6_Tunguska',
  'SA-2':    'S-75_Dvina',
  'SA-20':   'S-300_missile_system',
  'SA-21':   'S-400_missile_system',
  'SA-22':   'Pantsir_missile_system',
  'SA-23':   'S-300V',
  'SA-3':    'S-125_Neva/Pechora',
  'SA-4':    '2K11_Krug',
  'SA-5':    'S-200_(missile)',
  'SA-6':    '2K12_Kub',
  'SA-7':    '9K32_Strela-2',
  'SA-8':    '9K33_Osa',
  'SA-9':    '9K31_Strela-1',
  'Buk':     'Buk_missile_system',
  'Pantsir': 'Pantsir_missile_system',
  'Tor':     'Tor_missile_system',
  'Tunguska':'2S6_Tunguska',
  'Strela':  '9K35_Strela-10',
  'Igla':    '9K38_Igla',
  'Verba':   '9K333_Verba',
  'ZSU-23':  'ZSU-23-4_Shilka',
  'ZSU-57':  'ZSU-57-2',
  'ZU-23':   'ZU-23-2',
  'ZPU':     'ZPU',
  'KS-19':   'KS-19',
  'S-60':    'S-60_(anti-aircraft_gun)',
  // Chinese
  'HQ-9':   'HQ-9',
  'HQ-12':  'HQ-12',
  'HQ-16':  'HQ-16',
  'HQ-17':  'HQ-17',
  'HQ-61':  'HQ-61',
  'HQ-64':  'HQ-64',
  'HQ-7':   'HQ-7',
  'PGZ-07': 'PGZ-07',
  'PGZ-04': 'PGZ-04',
  'PGZ04':  'PGZ-04',
  'PGZ-87': 'PGZ-87',
  'LD-2000':'LD-2000',
  'FN-6':   'FN-6_(missile)',
  'HN-5':   'HN-5',
  'QW-1':   'Qianwei-1',
  'DK-9':   'DK-9',
  'SC-19':  'SC-19_(missile)',
};

function getADWiki(name) {
  const keys = Object.keys(AD_MAP).sort((a,b) => b.length - a.length);
  for (const k of keys) { if (name.includes(k)) return AD_MAP[k]; }
  return null;
}

const RADAR_MAP = {
  'Big Bird':     'S-300_missile_system',
  'Clam Shell':   'Buk_missile_system',
  'Dog Ear':      '9K35_Strela-10',
  'Flat Face':    'P-15_radar',
  'Flap Lid':     'S-300_missile_system',
  'Grill Pan':    'S-300V',
  'Long Track':   '2K12_Kub',
  'Low Blow':     'S-125_Neva/Pechora',
  'Pat Hand':     '2K12_Kub',
  'Snow Drift':   'Buk_missile_system',
  'Spoon Rest':   'P-18_radar',
  'Squat Eye':    'S-200_(missile)',
  'Straight Flush':'2K12_Kub',
  'Tall King':    'P-14_radar',
  'Tin Shield':   'Tin_Shield_radar',
  'Tomb Stone':   'S-300_missile_system',
  'Kolchuga':     'Kolchuga_passive_sensor_system',
  'Watchman':     'Watchman_radar',
  'Cheese Board': 'S-400_missile_system',
  'Grave Stone':  'S-400_missile_system',
  '96L6':         'S-400_missile_system',
  '91N6':         'S-400_missile_system',
  '64N6':         'S-300_missile_system',
  'Bar Lock':     'P-35_radar',
  'Back Net':     'Russian_Navy',
  'Kasta':        'Kasta_radar',
  'Nebo':         'Nebo_radar',
  'Sopka':        'Sopka_(radar)',
  'Vostok':       'Vostok_(radar)',
  'Gamma':        'Russian_Air_Force',
  'Podlet':       'Russian_Air_Force',
  'Rezonans':     'Rezonans-N',
  'Protivnik':    'Russian_Air_Force',
};

function getRadarWiki(name) {
  const keys = Object.keys(RADAR_MAP).sort((a,b) => b.length - a.length);
  for (const k of keys) { if (name.includes(k)) return RADAR_MAP[k]; }
  return null;
}

function getInfWiki(name) {
  // MANPADS
  if (name.includes('SA-18') || name.includes('Igla-S')) return '9K38_Igla';
  if (name.includes('SA-24') || name.includes('Verba')) return '9K333_Verba';
  if (name.includes('SA-16') || name.includes('Gimlet')) return '9K38_Igla';
  if (name.includes('SA-14') || name.includes('Strela-3')) return '9K34_Strela-3';
  if (name.includes('SA-7') || name.includes('Strela-2')) return '9K32_Strela-2';
  if (name.includes('Igla')) return '9K38_Igla';
  if (name.includes('Stinger')) return 'FIM-92_Stinger';
  if (name.includes('Mistral')) return 'MBDA_Mistral';
  if (name.includes('Starstreak')) return 'Starstreak_missile';
  if (name.includes('RBS 70') || name.includes('RBS70')) return 'RBS_70';
  if (name.includes('HN-5')) return 'HN-5';
  if (name.includes('FN-6')) return 'FN-6_(missile)';
  if (name.includes('QW-1')) return 'Qianwei-1';
  // ATGMs
  if (name.includes('Kornet') || name.includes('AT-14')) return '9M133_Kornet';
  if (name.includes('Metis') || name.includes('AT-13')) return '9M115_Metis';
  if (name.includes('Konkurs') || name.includes('AT-5')) return '9M113_Konkurs';
  if (name.includes('Fagot') || name.includes('AT-4')) return '9M111_Fagot';
  if (name.includes('Malyutka') || name.includes('AT-3')) return '9M14_Malyutka';
  if (name.includes('AT-')) return 'Anti-tank_missile';
  if (name.includes('HJ-8')) return 'HJ-8';
  if (name.includes('Milan')) return 'MILAN';
  if (name.includes('TOW')) return 'BGM-71_TOW';
  if (name.includes('Javelin')) return 'FGM-148_Javelin';
  if (name.includes('Spike')) return 'Spike_(missile)';
  if (name.includes('Hellfire')) return 'AGM-114_Hellfire';
  if (name.includes('RPG')) return 'RPG-7';
  // Infantry roles
  if (name.includes('Paratrooper') || name.includes('VDV') || name.includes('Airborne')) return 'Airborne_forces';
  if (name.includes('Marine') || name.includes('Naval Inf')) return 'Marine_(military)';
  if (name.includes('Spetsnaz') || name.includes('Special Forces') || name.includes('SOF')) return 'Special_forces';
  if (name.includes('Ranger')) return 'United_States_Army_Rangers';
  if (name.includes('Chinese')) return 'People\'s_Liberation_Army_Ground_Force';
  return 'Infantry';
}

// Weapons & sensors: generic pattern matching
function getWpnWiki(name) {
  // ── Drop / Ferry / Conformal Tanks ──────────────────────────────────────────
  if (name.includes('Drop Tank') || name.includes('Ferry Tank') || name.includes('Slipper Tank') || name.includes('Conformal Tank') || name.includes('CFT') || /^\d+ liter /.test(name) || /^\d+ USG /.test(name) || /^\d+ ImpG /.test(name))
    return 'Drop_tank';

  // ── US / NATO air-to-air ─────────────────────────────────────────────────────
  if (name.includes('AIM-120') || name.includes('AMRAAM'))  return 'AIM-120_AMRAAM';
  if (name.includes('AIM-9') || name.includes('Sidewinder')) return 'AIM-9_Sidewinder';
  if (name.includes('AIM-7') || name.includes('Sparrow'))   return 'AIM-7_Sparrow';
  if (name.includes('AIM-54') || name.includes('Phoenix'))  return 'AIM-54_Phoenix';
  if (name.includes('AIM-132') || name.includes('ASRAAM'))  return 'ASRAAM';
  if (name.includes('AIM-152')) return 'Air-to-air_missile';
  if (name.includes('AIM-23'))  return 'MIM-23_Hawk';
  if (name.includes('AIM-26') || name.includes('AIM-4') || name.includes('Falcon')) return 'AIM-4_Falcon';
  if (name.includes('AIR-2'))   return 'AIR-2_Genie';
  if (name.includes('IRIS-T'))  return 'IRIS-T';
  if (name.includes('Meteor'))  return 'Meteor_(missile)';
  if (name.includes('MICA'))    return 'MICA_(missile)';
  if (name.includes('Magic'))   return 'Matra_Magic';
  if (name.includes('Super 530'))return 'Matra_Super_530';
  if (name.includes('R.530'))   return 'Matra_R530';
  if (name.includes('Python'))  return 'Python_(missile)';
  if (name.includes('Derby'))   return 'Derby_(missile)';
  if (name.includes('Shafrir')) return 'Shafrir_(missile)';
  if (name.includes('Red Top')) return 'Red_Top_(missile)';
  if (name.includes('Sky Flash')) return 'Skyflash';
  if (name.includes('RB 71'))   return 'Skyflash';
  if (name.includes('RB 28'))   return 'AIM-4_Falcon';
  if (name.includes('PL-12') || name.includes('PL-10') || name.includes('PL-11') || name.includes('PL-5') || name.includes('PL-8') || name.includes('PL-9'))
    return 'Air-to-air_missile';
  if (name.includes('V3B Kukri') || name.includes('V3S Snake') || name.includes('V4A R-Darter'))
    return 'Air-to-air_missile';
  if (name.includes('AAM-1') || name.includes('AAM-3') || name.includes('AAM-4') || name.includes('AAM-5')) return 'Air-to-air_missile';

  // ── US / NATO air-to-surface ─────────────────────────────────────────────────
  if (name.includes('AGM-88') || name.includes('HARM'))    return 'AGM-88_HARM';
  if (name.includes('AGM-65') || name.includes('Maverick'))return 'AGM-65_Maverick';
  if (name.includes('AGM-84') || name.includes('Harpoon')) return 'AGM-84E_SLAM';
  if (name.includes('AGM-158') || name.includes('JASSM')) return 'AGM-158_JASSM';
  if (name.includes('AGM-154') || name.includes('JSOW'))  return 'AGM-154_JSOW';
  if (name.includes('AGM-114') || name.includes('Hellfire'))return 'AGM-114_Hellfire';
  if (name.includes('AGM-45') || name.includes('Shrike'))  return 'AGM-45_Shrike';
  if (name.includes('AGM-'))   return 'Air-to-surface_missile';
  if (name.includes('JDAM'))   return 'Guided_bomb';
  if (name.includes('Paveway'))return 'Paveway';
  if (name.includes('GBU-'))   return 'Guided_bomb';
  if (name.includes('Storm Shadow') || name.includes('SCALP')) return 'Storm_Shadow';
  if (name.includes('Brimstone')) return 'Brimstone_(missile)';
  if (name.includes('Taurus'))    return 'Taurus_KEPD_350';
  if (name.includes('KEPD'))      return 'Taurus_KEPD_350';
  if (name.includes('Exocet'))    return 'Exocet';
  if (name.includes('Penguin'))   return 'Penguin_(missile)';
  if (name.includes('AS.30'))     return 'AS.30_(missile)';
  if (name.includes('AS.37') || name.includes('Martel'))  return 'Martel_(missile)';
  if (name.includes('AS.11'))     return 'SS.11';
  if (name.includes('AS.34') || name.includes('Kormoran')) return 'Anti-ship_missile';
  if (name.includes('ALARM'))     return 'ALARM_(missile)';
  if (name.includes('Sea Eagle')) return 'British_Aerospace_Sea_Eagle';
  if (name.includes('Popeye') || name.includes('AGM-142')) return 'AGM-142_Popeye';
  if (name.includes('Gabriel'))   return 'Gabriel_(missile)';
  if (name.includes('ARMAT'))     return 'Anti-radiation_missile';
  if (name.includes('ASMP'))      return 'Nuclear_missile';
  if (name.includes('AN.52'))     return 'Nuclear_weapon';
  if (name.includes('Apache') && !name.includes('AH-64')) return 'Apache_(missile)';

  // ── Chinese missiles ────────────────────────────────────────────────────────
  if (name.includes('C-802') || name.includes('YJ-8'))  return 'YJ-8';
  if (name.includes('C-801'))  return 'YJ-8';
  if (name.includes('C-301'))  return 'Anti-ship_missile';
  if (name.includes('C-703') || name.includes('C-704')) return 'Anti-ship_missile';
  if (name.includes('YJ-12'))  return 'YJ-12';
  if (name.includes('YJ-62'))  return 'YJ-62';
  if (name.includes('YJ-91'))  return 'YJ-91';
  if (name.includes('YJ-9'))   return 'Anti-ship_missile';
  if (name.includes('HY-'))    return 'Silkworm_(missile)';
  if (name.includes('SY-'))    return 'Silkworm_(missile)';
  if (name.startsWith('KD-'))  return 'Cruise_missile';
  if (name.startsWith('DF-'))  return 'Intercontinental_ballistic_missile';
  if (name.startsWith('JL-'))  return 'Submarine-launched_ballistic_missile';
  if (name.includes('HQ-'))    return 'Surface-to-air_missile';
  if (name.includes('FN-6') || name.includes('QW-') || name.includes('HN-5')) return 'MANPADS';

  // ── Anti-ship (other) ───────────────────────────────────────────────────────
  if (name.includes('RGM-84') || name.includes('UGM-84')) return 'AGM-84E_SLAM';
  if (name.includes('RBS-15') || name.includes('RBS 15') || name.includes('RB 15')) return 'RBS-15';
  if (name.includes('RB 04'))  return 'Rb_04';
  if (name.includes('RB 05'))  return 'Rb_05';
  if (name.includes('RB 08'))  return 'Saab_Rb_08';
  if (name.includes('Otomat'))  return 'Otomat';
  if (name.includes('Marte'))   return 'Marte_(missile)';
  if (name.includes('Sea Killer')) return 'Sea_Killer';
  if (name.includes('Sea Venom'))  return 'Sea_Venom_(missile)';
  if (name.includes('Hsiung Feng')) return 'Hsiung_Feng_III';
  if (name.includes('SSM-1') || name.includes('ASM-1') || name.includes('ASM-2') || name.includes('ASM-3')) return 'Anti-ship_missile';
  if (name.includes('SSM-700')) return 'Anti-ship_missile';
  if (name.includes('SSC-3') || name.includes('Styx')) return 'P-15_Termit';
  if (name.includes('NSM') || name.includes('Naval Strike')) return 'Naval_Strike_Missile';
  if (name.includes('JSM') || name.includes('Joint Strike Missile')) return 'Joint_Strike_Missile';
  if (name.includes('LRASM'))   return 'AGM-158C_LRASM';
  if (name.includes('Delilah'))  return 'Delilah_(missile)';
  if (name.includes('Harpy'))    return 'IAI_Harpy';
  if (name.includes('MAR-1'))    return 'Anti-radiation_missile';
  if (name.includes('K-745'))    return 'Anti-ship_missile';
  if (name.includes('Malafon'))  return 'Malafon';
  if (name.includes('Metel'))    return 'Metel_Anti-Ship_Complex';
  if (name.includes('Milas'))    return 'MILAS';
  if (name.includes('Ikara'))    return 'Ikara_(missile)';
  if (name.includes('FRAS-'))    return 'Anti-submarine_warfare';
  if (name.includes('Martlet'))  return 'Lightweight_Multirole_Missile';
  if (name.includes('VA-111') || name.includes('Shkval')) return 'VA-111_Shkval';
  if (name.includes('SS.11'))    return 'SS.11';
  if (name.includes('SS.12'))    return 'Nord_Aviation';
  if (name.includes('J-600T') || name.includes('Yildirim')) return 'Tactical_ballistic_missile';
  if (name.includes('H-4 SOW'))  return 'Precision-guided_munition';
  if (name.includes('EAJ-'))     return 'Anti-ship_missile';

  // ── Cruise missiles (Tomahawk etc.) ─────────────────────────────────────────
  if (name.includes('Tomahawk') || name.includes('RGM-109') || name.includes('UGM-109') || name.includes('BGM-109')) return 'Tomahawk_(missile)';
  if (name.includes('RGM-165') || name.includes('LASM'))  return 'Cruise_missile';
  if (name.includes('RGM-176') || name.includes('Griffin'))return 'Cruise_missile';
  if (name.startsWith('RGM-'))  return 'Anti-ship_missile';

  // ── SLBMs/ICBMs/BMs ─────────────────────────────────────────────────────────
  if (name.includes('UGM-133') || name.includes('Trident II')) return 'UGM-133_Trident_II';
  if (name.includes('UGM-96') || name.includes('Trident C'))  return 'UGM-96_Trident_I';
  if (name.includes('UGM-73') || name.includes('Poseidon'))   return 'UGM-73_Poseidon';
  if (name.startsWith('UGM-'))  return 'Submarine-launched_ballistic_missile';
  if (name.includes('LGM-30'))  return 'LGM-30_Minuteman';
  if (name.includes('Pershing')) return 'Pershing_II';
  if (name.includes('MGM-52') || name.includes('Lance'))  return 'MGM-52_Lance';
  if (name.includes('MGM-140') || name.includes('ATACMS')) return 'MGM-140_ATACMS';
  if (name.includes('MGM-164')) return 'MGM-140_ATACMS';
  if (name.includes('MGM-157')) return 'Cruise_missile';
  if (name.includes('GBI'))     return 'Ground-Based_Midcourse_Defense';
  if (name.includes('SC-19'))   return 'Anti-satellite_weapon';
  if (name.startsWith('SS-')) {
    if (name.includes('Scud'))     return 'Scud';
    if (name.includes('SS-1'))     return 'Scud';
    if (name.includes('Sego'))     return 'Intercontinental_ballistic_missile';
    if (name.includes('Scaleboard'))return 'OTR-22_Temp-S';
    if (name.includes('Savage'))   return 'Intercontinental_ballistic_missile';
    if (name.includes('Sinner'))   return 'Intercontinental_ballistic_missile';
    if (name.includes('Spanker'))  return 'Intercontinental_ballistic_missile';
    if (name.includes('Satan'))    return 'R-36_(missile)';
    if (name.includes('Stiletto')) return 'UR-100N';
    if (name.includes('Saber'))    return 'RSD-10_Pioneer';
    if (name.includes('Scarab'))   return 'OTR-21_Tochka';
    if (name.includes('Spider'))   return 'OTR-23_Oka';
    if (name.includes('Scalpel'))  return 'RT-23_Molodets';
    if (name.includes('Sickle B') || name.includes('SS-27') || name.includes('SS-29')) return 'RT-2PM2_Topol-M';
    if (name.includes('Sickle') || name.includes('SS-25')) return 'RT-2PM_Topol';
    if (name.includes('Stone') || name.includes('SS-26'))  return '9K720_Iskander';
    if (name.includes('Sandal'))   return 'R-12_(missile)';
    if (name.includes('Skean'))    return 'R-14_(missile)';
    if (name.includes('Scarp'))    return 'R-36_(missile)';
    return 'Intercontinental_ballistic_missile';
  }
  if (name.includes('SH-04') || name.includes('Galosh'))  return 'A-35_anti-ballistic_missile_system';
  if (name.includes('SH-08') || name.includes('Gazelle')) return 'A-135_anti-ballistic_missile_system';

  // ── Foreign BMs ─────────────────────────────────────────────────────────────
  if (name.includes('Scud'))    return 'Scud';
  if (name.includes('FROG-'))   return 'FROG-7';
  if (name.includes('Nodong'))  return 'Medium-range_ballistic_missile';
  if (name.includes('Taepodong')) return 'Unha';
  if (name.includes('KN-'))     return 'Ballistic_missile';
  if (name.includes('Agni'))    return 'Agni_(missile)';
  if (name.includes('Hatf'))    return 'Ballistic_missile';
  if (name.includes('Shahab'))  return 'Shahab-3';
  if (name.includes('Ghadr'))   return 'Ghadr-110';
  if (name.includes('Sejil'))   return 'Sejjil';
  if (name.includes('Fateh'))   return 'Fateh-110';
  if (name.includes('Qiam'))    return 'Qiam_1';
  if (name.includes('Khalij Fars')) return 'Khalij_Fars';
  if (name.includes('Zelzal'))  return 'Fajr-5';
  if (name.includes('Qassed'))  return 'Ballistic_missile';
  if (name.includes('Jericho')) return 'Ballistic_missile';
  if (name.includes('Babur'))   return 'Land-attack_missile';
  if (name.includes('Soumar'))  return 'Soumar_(missile)';
  if (name.includes('Raad'))    return 'Cruise_missile';
  if (name.includes('Hyunmoo')) return 'Hyunmoo';
  if (name.includes('Tondar'))  return 'Tondar-69';

  // ── SAMs ────────────────────────────────────────────────────────────────────
  if (name.startsWith('SA-N-') || name.startsWith('SA-')) {
    if (name.includes('SA-N-1') || name.includes('SA-3') || name.includes('Goa')) return 'S-125_Neva/Pechora';
    if (name.includes('SA-N-2') || name.includes('SA-2') || name.includes('Guideline')) return 'S-75_Dvina';
    if (name.includes('SA-N-5') || name.includes('SA-7') || name.includes('Grail')) return 'Strela-2';
    if (name.includes('SA-N-7') || name.includes('SA-11') || name.includes('Gadfly')) return 'Buk_missile_system';
    if (name.includes('SA-N-10') || name.includes('SA-14') || name.includes('Gremlin')) return 'Man-portable_air-defense_system';
    if (name.includes('SA-N-11') || name.includes('SA-19') || name.includes('Grisom')) return 'Tunguska_missile_system';
    if (name.includes('SA-N-12') || name.includes('SA-12') || name.includes('Grizzly') || name.includes('Gladiator')) return 'S-300V';
    if (name.includes('SA-N-20') || name.includes('SA-10') || name.includes('Grumble') || name.includes('Gargoyle')) return 'S-300_(missile_system)';
    if (name.includes('SA-N-21') || name.includes('SA-21') || name.includes('Growler')) return 'S-400_missile_system';
    if (name.includes('SA-N-22') || name.includes('SA-22') || name.includes('Greyhound')) return 'Pantsir_missile_system';
    if (name.includes('SA-N-24') || name.includes('SA-25') || name.includes('Verba') || name.includes('Grinch')) return 'MANPADS';
    if (name.includes('SA-23') || name.includes('Giant')) return 'S-300V';
    if (name.includes('SA-15') || name.includes('Gauntlet')) return 'Tor_missile_system';
    if (name.includes('SA-13') || name.includes('Gopher')) return 'Strela-10';
    if (name.includes('SA-5') || name.includes('Gammon'))  return 'S-200_(missile)';
    if (name.includes('SA-6') || name.includes('Gainful')) return 'Kub_missile_system';
    if (name.includes('SA-8') || name.includes('Gecko'))   return '9K33_Osa';
    return 'Surface-to-air_missile';
  }
  if (name.startsWith('RIM-')) {
    if (name.includes('RIM-116') || name.includes('RAM'))    return 'RIM-116_Rolling_Airframe_Missile';
    if (name.includes('RIM-156') || name.includes('RIM-66') || name.includes('RIM-67') || name.includes('SM-1') || name.includes('SM-2')) return 'Standard_Missile';
    if (name.includes('RIM-161') || name.includes('SM-3'))   return 'RIM-161_Standard_Missile_3';
    if (name.includes('RIM-162') || name.includes('ESSM'))   return 'RIM-162_ESSM';
    if (name.includes('RIM-174') || name.includes('SM-6'))   return 'RIM-174_Standard_ERAM';
    if (name.includes('RIM-24') || name.includes('Tartar'))  return 'RIM-24_Tartar';
    if (name.includes('RIM-2') || name.includes('Terrier'))  return 'RIM-2_Terrier';
    if (name.includes('RIM-8') || name.includes('Talos'))    return 'RIM-8_Talos';
    if (name.includes('RIM-72') || name.includes('Sea Chaparral')) return 'Sea_Chaparral';
    return 'Surface-to-air_missile';
  }
  if (name.startsWith('MIM-')) {
    if (name.includes('MIM-104') || name.includes('Patriot')) return 'MIM-104_Patriot';
    if (name.includes('MIM-23') || name.includes('HAWK') || name.includes('I-HAWK')) return 'MIM-23_Hawk';
    if (name.includes('MIM-72') || name.includes('Chaparral')) return 'MIM-72_Chaparral';
    if (name.includes('MIM-120') || name.includes('HUMRAAM') || name.includes('NASAMS')) return 'NASAMS';
    if (name.includes('MIM-146') || name.includes('ADATS'))  return 'Air_Defense_Anti-Tank_System';
    return 'Surface-to-air_missile';
  }
  if (name.startsWith('FIM-')) {
    if (name.includes('Stinger')) return 'FIM-92_Stinger';
    if (name.includes('Redeye'))  return 'FIM-43_Redeye';
    return 'MANPADS';
  }
  if (name.includes('RUM-139') || name.includes('VLA'))  return 'ASROC';
  if (name.includes('RUM-125') || name.includes('UUM-125') || name.includes('Sea Lance')) return 'Sea_Lance';
  if (name.includes('UUM-44') || name.includes('SUBROC')) return 'UUM-44_SUBROC';
  if (name.includes('Aster 15') || name.includes('Aster 30')) return 'Aster_(missile_family)';
  if (name.includes('Barak'))    return 'Barak_8';
  if (name.includes('Rapier'))   return 'Rapier_(missile)';
  if (name.includes('Sea Wolf')) return 'Sea_Wolf_(missile)';
  if (name.includes('Sea Dart')) return 'Sea_Dart';
  if (name.includes('Sea Cat'))  return 'Seacat_(missile)';
  if (name.includes('Sea Ceptor')) return 'Surface-to-air_missile';
  if (name.includes('Sea Slug')) return 'Seaslug_(missile)';
  if (name.includes('Starstreak')) return 'Starstreak';
  if (name.includes('Crotale') || name.includes('R.440')) return 'Crotale_(missile)';
  if (name.includes('Roland'))   return 'Roland_(missile)';
  if (name.includes('Mistral'))  return 'Mistral_(missile)';
  if (name.includes('Umkhonto')) return 'Umkhonto_(missile)';
  if (name.includes('Sky Bow'))  return 'Sky_Bow';
  if (name.includes('Sky Sword'))return 'Sky_Sword_II';
  if (name.includes('KP-SAM') || name.includes('Shin-Gung')) return 'Chiron_(missile)';
  if (name.includes('KM-SAM'))  return 'KM-SAM';
  if (name.includes('SAM-1') || name.includes('SAM-2') || name.includes('Tan-SAM') || name.includes('Kin-SAM')) return 'Surface-to-air_missile';
  if (name.includes('PZR Grom') || name.includes('Grom')) return 'Vympel_R-77';
  if (name.includes('Aspide'))   return 'Aspide';
  if (name.includes('Anza'))     return 'Anza_(missile)';
  if (name.includes('Misagh'))   return 'MANPADS';
  if (name.includes('Tamir'))    return 'Iron_Dome';
  if (name.includes('RB 67') || name.includes('RB 77') || name.includes('RB 97')) return 'MIM-23_Hawk';
  if (name.includes('RB 69'))    return 'FIM-43_Redeye';
  if (name.includes('RB 70') || name.includes('Bolide'))  return 'RBS_70';
  if (name.includes('Standard')) return 'Standard_Missile';

  // ── ATGMs ───────────────────────────────────────────────────────────────────
  if (name.startsWith('AT-')) {
    if (name.includes('AT-14') || name.includes('Spriggan')) return '9M133_Kornet';
    if (name.includes('AT-16') || name.includes('Scallion')) return '9M120_Ataka';
    if (name.includes('AT-6') || name.includes('Spiral'))    return '9K114_Shturm';
    if (name.includes('AT-9') || name.includes('Spiral-2'))  return '9K114_Shturm';
    if (name.includes('AT-3') || name.includes('Sagger'))    return '9M14_Malyutka';
    if (name.includes('AT-4') || name.includes('Spigot'))    return '9M111_Fagot';
    if (name.includes('AT-5') || name.includes('Spandrel'))  return '9M113_Konkurs';
    if (name.includes('AT-2'))   return 'AT-2_Swatter';
    if (name.includes('AT-10'))  return 'Anti-tank_guided_missile';
    return 'Anti-tank_guided_missile';
  }
  if (name.includes('BGM-71') || name.includes('TOW'))    return 'BGM-71_TOW';
  if (name.includes('FGM-148') || name.includes('Javelin')) return 'FGM-148_Javelin';
  if (name.includes('Milan'))    return 'MILAN';
  if (name.includes('HOT'))      return 'HOT_(missile)';
  if (name.includes('LAHAT'))    return 'LAHAT';
  if (name.includes('Spike'))    return 'Spike_(missile)';
  if (name.includes('PARS-3'))   return 'PARS_3_LR';
  if (name.includes('Ingwe') || name.includes('ZT-3'))  return 'ZT3_Ingwe';
  if (name.includes('Mokopa') || name.includes('ZT-6')) return 'Mokopa';
  if (name.includes('Barrier'))  return 'Anti-tank_guided_missile';
  if (name.includes('Carl Gustav') || name.includes('84mm')) return 'Carl_Gustaf_M4';
  if (name.includes('ATGM') || name.includes('Jyu-MAT')) return 'Anti-tank_guided_missile';
  if (name.includes('Black Shahine')) return 'Anti-tank_guided_missile';
  if (name.includes('Commando') && !name.includes('Solo') && !name.includes('Vault')) return 'Anti-tank_guided_missile';
  if (name.includes('Type 79 Jyu-MAT')) return 'Anti-tank_guided_missile';

  // ── Naval guns ───────────────────────────────────────────────────────────────
  if (name.startsWith('Mk 45') || name.startsWith('5"/54') || name.startsWith('5"/62')) return 'Mark_45_gun';
  if (name.startsWith('76mm') || name.startsWith('76/62') || name.startsWith('76/')) return 'OTO_Melara_76_mm';
  if (name.startsWith('Phalanx') || name.includes('CIWS')) return 'Phalanx_CIWS';
  if (name.includes('Goalkeeper')) return 'Goalkeeper_CIWS';
  if (name.startsWith('RBU-'))  return 'RBU-6000';
  if (name.startsWith('RPK-')) return 'Anti-submarine_warfare';
  if (name.startsWith('AK-'))  return 'Naval_gun';

  // ── Gun calibers ────────────────────────────────────────────────────────────
  if (name.startsWith('406mm'))  return 'Battleship';
  if (name.startsWith('305mm'))  return 'Battleship';
  if (name.startsWith('234mm'))  return 'Cruiser';
  if (name.startsWith('203mm'))  return 'Howitzer';
  if (name.startsWith('155mm'))  return 'Howitzer';
  if (name.startsWith('152mm'))  return 'Naval_gun';
  if (name.startsWith('150mm'))  return 'Naval_gun';
  if (name.startsWith('130mm'))  return 'Naval_gun';
  if (name.startsWith('127mm'))  return 'Naval_gun';
  if (name.startsWith('122mm'))  return 'Naval_gun';
  if (name.startsWith('120mm')) {
    if (name.includes('Mortar')) return 'Mortar_(weapon)';
    if (name.includes('STRIX'))  return 'STRIX_(mortar_round)';
    if (name.includes('Rheinmetall') || name.includes('APFSDS') || name.includes('HE')) return 'Rheinmetall_Rh-120';
    return 'Naval_gun';
  }
  if (name.startsWith('115mm'))  return 'Tank_gun';
  if (name.startsWith('114mm'))  return 'Naval_gun';
  if (name.startsWith('105mm')) {
    if (name.includes('Howitzer')) return 'Howitzer';
    return 'Royal_Ordnance_L7';
  }
  if (name.startsWith('102mm'))  return 'Naval_gun';
  if (name.startsWith('100mm'))  return 'Naval_gun';
  if (name.startsWith('90mm'))   return 'Tank_gun';
  if (name.startsWith('85mm'))   return 'Tank_gun';
  if (name.startsWith('83.4mm')) return 'Tank_gun';
  if (name.startsWith('81mm'))   return 'Mortar_(weapon)';
  if (name.startsWith('75mm'))   return 'Naval_gun';
  if (name.startsWith('60mm'))   return 'Mortar_(weapon)';
  if (name.startsWith('57mm'))   return 'Naval_gun';
  if (name.startsWith('45mm'))   return 'Naval_gun';
  if (name.startsWith('40mm')) {
    if (name.includes('Grenade')) return 'Grenade_launcher';
    return 'Autocannon';
  }
  if (name.startsWith('37mm'))   return 'Autocannon';
  if (name.startsWith('35mm'))   return 'Oerlikon_GDF';
  if (name.startsWith('30mm'))   return 'Naval_gun';
  if (name.startsWith('27mm'))   return 'Mauser_BK-27';
  if (name.startsWith('25mm'))   return 'M242_Bushmaster';
  if (name.startsWith('23mm'))   return 'ZU-23-2';
  if (name.startsWith('20mm'))   return 'Oerlikon_20_mm_cannon';
  if (name.startsWith('14.5mm')) return 'KPV_heavy_machine_gun';
  if (name.startsWith('12.7mm')) return 'M2_Browning';
  if (name.startsWith('7.62mm')) return 'M60_machine_gun';
  if (name.startsWith('5.56mm')) return 'Squad_automatic_weapon';

  // ── Russian/Soviet air-to-air ────────────────────────────────────────────────
  if (name.startsWith('AA-') || name.startsWith('R-')) {
    if (name.includes('R-77') || name.includes('AA-12')) return 'R-77_(missile)';
    if (name.includes('R-73') || name.includes('AA-11')) return 'R-73_(missile)';
    if (name.includes('R-27') || name.includes('AA-10')) return 'R-27_(air-to-air_missile)';
    if (name.includes('R-60') || name.includes('AA-8'))  return 'R-60_(missile)';
    if (name.includes('R-33') || name.includes('AA-9'))  return 'Air-to-air_missile';
    if (name.includes('R-37') || name.includes('AA-13')) return 'R-37_(missile)';
    if (name.includes('R-23') || name.includes('AA-7'))  return 'R-23_(missile)';
    if (name.includes('R-40') || name.includes('AA-6'))  return 'R-40_(missile)';
    if (name.includes('AA-2') || name.includes('R-3'))   return 'K-13_(missile)';
    return 'Air-to-air_missile';
  }
  // ── Russian/Soviet air-to-surface ────────────────────────────────────────────
  if (name.startsWith('AS-') || name.startsWith('Kh-')) {
    if (name.includes('Kh-101')) return 'Kh-101';
    if (name.includes('Kh-58'))  return 'Kh-58';
    if (name.includes('Kh-55'))  return 'Kh-55';
    if (name.includes('Kh-59'))  return 'Kh-59';
    if (name.includes('Kh-35'))  return 'Kh-35';
    if (name.includes('Kh-31'))  return 'Kh-31';
    if (name.includes('Kh-29'))  return 'Kh-29';
    if (name.includes('Kh-25'))  return 'Kh-25';
    if (name.includes('Kh-22'))  return 'Kh-22';
    if (name.includes('AS-2') || name.includes('Kipper'))  return 'Anti-ship_missile';
    return 'Anti-ship_missile';
  }
  if (name.startsWith('SS-N-') || name.startsWith('3M-')) {
    if (name.includes('Kalibr') || name.includes('3M-14') || name.includes('3M-54')) return '3M-54_Kalibr';
    if (name.includes('SS-N-19') || name.includes('Granit')) return 'P-700_Granit';
    if (name.includes('SS-N-22') || name.includes('Moskit')) return 'P-270_Moskit';
    if (name.includes('SS-N-12') || name.includes('Bazalt')) return 'P-500_Bazalt';
    if (name.includes('SS-N-2') || name.includes('Styx'))    return 'P-15_Termit';
    if (name.includes('SS-N-3') || name.includes('Shaddock'))return 'P-35_(missile)';
    if (name.includes('SS-N-9') || name.includes('Siren'))   return 'P-120_Malakhit';
    if (name.includes('SS-N-26') || name.includes('Oniks'))  return 'P-800_Oniks';
    if (name.includes('SS-N-27') || name.includes('Sizzler'))return '3M-54_Kalibr';
    return 'Anti-ship_missile';
  }
  if (name.startsWith('9M')) {
    if (name.includes('Kornet'))  return '9M133_Kornet';
    if (name.includes('Metis'))   return '9M115_Metis';
    if (name.includes('Konkurs')) return '9M113_Konkurs';
    if (name.includes('Ataka'))   return '9M120_Ataka';
    return 'Anti-tank_missile';
  }

  // ── Torpedoes ───────────────────────────────────────────────────────────────
  if (name.includes('Torpedo') || name.includes('torpedo')) return 'Torpedo';
  if (name.startsWith('Mk14') || name.startsWith('Mk16') || name.startsWith('Mk37') || name.startsWith('Mk43') || name.startsWith('Mk44') || name.startsWith('Mk48') || name.startsWith('Mk50') || name.startsWith('Mk8 ') || name.startsWith('Mk9 '))
    return 'Torpedo';
  if (name.startsWith('Mk46') || name.includes('Mk 46') || name.includes('Mk 50') || name.includes('Mk 54') || name.includes('Mk54 '))
    return 'Torpedo';
  if (name.startsWith('Mk24 Tigerfish') || name.startsWith('Mk20(S)'))
    return 'Torpedo';
  if (/^5[3-9]-/.test(name) || name.startsWith('SET-') || name.startsWith('SAET-') || name.startsWith('USET-') || name.startsWith('TEST-'))
    return 'Torpedo';
  if (name.startsWith('APR-') || name.startsWith('A.184') || name.startsWith('A.244') || name.startsWith('NT-37') || name.startsWith('F17') || name.startsWith('SUT ') || name.startsWith('SST-'))
    return 'Torpedo';
  if (name.startsWith('Tp ') || name.includes('White Shark') || name.includes('Paket-NK'))
    return 'Torpedo';
  if (name.includes('Type 89') || name.includes('Type 80') || name.includes('Type 55'))
    return 'Torpedo';
  if (name.includes('Yu-') || name.includes('K/JDC-'))   return 'Torpedo';
  if (name.includes('65-76A'))  return 'Torpedo';
  if (name.includes('Mk45 ASTOR')) return 'Torpedo';
  if (name.includes('Mk57 MOSS'))  return 'Decoy';

  // ── ASW ──────────────────────────────────────────────────────────────────────
  if (name.includes('ASROC') || name.includes('VL-ASROC')) return 'ASROC';

  // ── Sonobuoys ───────────────────────────────────────────────────────────────
  if (name.startsWith('AN/SSQ') || name.startsWith('SSQ-') || name.startsWith('CA/SSQ'))
    return 'Sonobuoy';
  if (name.includes('LOFAR') || name.includes('DIFAR') || name.includes('DICASS') || name.includes('CASS'))
    return 'Sonobuoy';
  if (name.startsWith('Hydrofonboj') || name.startsWith('RGB-') || name.startsWith('DSTV') || name.startsWith('BIR '))
    return 'Sonobuoy';
  if (name.includes('Generic Passive') || name.includes('Generic Active') || name.includes('Active Directional'))
    return 'Sonobuoy';
  if (name.startsWith('TSM ') || name.startsWith('Type 3005') || name.startsWith('Type 1705') || name.startsWith('Type 1151') || name.startsWith('Type 9003'))
    return 'Sonobuoy';
  if (name.includes('Sonobuoy') || name.includes('AN/SSQ') || name.includes('Jezebel') || name.includes('Julie') || name.includes('XBT') || name.includes('Calibrated-LOFAR'))
    return 'Sonobuoy';

  // ── ECM / DECM / OECM / Jammer pods ────────────────────────────────────────
  if (name.includes('AN/ALQ-') || name.includes('DECM') || name.includes('OECM') || name.includes('ECM Pod') || name.includes('Jammer'))
    return 'Electronic_warfare';
  if (name.includes('ELT-555') || name.includes('EL/L-8222') || name.includes('Barax') || name.includes('Cerberus'))
    return 'Electronic_warfare';
  if (name.includes('Sky Shadow') || name.includes('Ariel Mk2'))
    return 'Electronic_warfare';
  if (name.includes('SAP-14') || name.includes('SAP-518') || name.includes('SRS-14') || name.includes('SPK-39') || name.includes('K/ALQ-'))
    return 'Electronic_warfare';
  if (name.includes('PAJ-FA') || name.includes('Barracuda') && name.includes('Pod'))
    return 'Electronic_warfare';
  if (name.includes('TMV-002') || name.includes('TMV-004') || name.includes('CONTRALTO'))
    return 'Electronic_warfare';
  if (name.includes('China KG-800')) return 'Electronic_warfare';

  // ── Recon / Targeting / Navigation / Datalink pods ──────────────────────────
  if (name.includes('AN/AAQ') || name.includes('LANTIRN') || name.includes('Litening') || name.includes('ATFLIR') || name.includes('Sniper'))
    return 'Targeting_pod';
  if (name.includes('AN/AAR-') || name.includes('AN/AAS-') || name.includes('AN/ASD-') || name.includes('AN/ASQ-') || name.includes('AN/AUS-') || name.includes('AN/AVQ-'))
    return 'Targeting_pod';
  if (name.includes('TIALD') || name.includes('Damocles') || name.includes('Talios') || name.includes('Atlis') || name.includes('CLDP') || name.includes('Pave'))
    return 'Targeting_pod';
  if (name.includes('Recon Pod') || name.includes('Camera Pod') || name.includes('TARPS') || name.includes('SHARP') || name.includes('LOROP') || name.includes('AREOS') || name.includes('DB-110'))
    return 'Reconnaissance_pod';
  if (name.includes('Gorgon Stare'))  return 'Reconnaissance_pod';
  if (name.includes('Night Owl'))     return 'Targeting_pod';
  if (name.includes('Pathfinder'))    return 'Targeting_pod';
  if (name.includes('PANTERA'))       return 'Targeting_pod';
  if (name.includes('Datalink Pod') || name.includes('AN/ASW-') || name.includes('AN/ZSW-') || name.includes('APP-') || name.includes('DJRP'))
    return 'Targeting_pod';
  if (name.includes('Navigation Pod') || name.includes('Atlantic Nav'))
    return 'Targeting_pod';
  if (name.includes('Omera') || name.includes('CRM 280') || name.includes('GAF') || name.includes('SKA 24') || name.includes('Rafael Recon') || name.includes('LA-610') || name.includes('Per Udsen') || name.includes('Blue Baron') || name.includes('Red Baron'))
    return 'Reconnaissance_pod';
  if (name.includes('Generic ESM Pod') || name.includes('Generic Comms Jammer') || name.includes('Generic OECM'))
    return 'Electronic_warfare';
  if (name.includes('TLS-99'))   return 'Targeting_pod';
  if (name.includes('Hakim Datalink') || name.includes('H-4 SOW') && name.includes('Datalink')) return 'Targeting_pod';

  // ── Chaff / Flare / Decoys ──────────────────────────────────────────────────
  if (name.includes('Chaff') || name.includes('Flare') || name.includes('Decoy') || name.includes('Nulka') || name.includes('Nixie') || name.includes('RBOC'))
    return 'Chaff_(countermeasure)';
  if (name.includes('DAGAIE') || name.includes('SCLAR') || name.includes('SEALEM') || name.includes('SEALIR') || name.includes('SEAMOSC') || name.includes('Sea Gnat'))
    return 'Chaff_(countermeasure)';
  if (name.includes('Barricade') || name.includes('Corvus') || name.includes('Philax') || name.includes('Protean') || name.includes('PIRATE'))
    return 'Chaff_(countermeasure)';
  if (name.includes('BOZ-') || name.includes('AN/ALE') || name.includes('Phimat') || name.includes('Alkan') || name.includes('Terma MCP'))
    return 'Chaff_(countermeasure)';
  if (name.includes('PK-10') || name.includes('PK-16') || name.includes('PK-2') || name.includes('KT-216'))
    return 'Chaff_(countermeasure)';
  if (name.includes('HIRAM') || name.includes('GEMINI') || name.includes('DUAL TRAP') || name.includes('Hot Dog') || name.includes('Silver Dog') || name.includes('Heatrap'))
    return 'Chaff_(countermeasure)';
  if (name.includes('SQK-') || name.includes('Bubble Screen') || name.includes('LF Jammer'))
    return 'Decoy';
  if (name.includes('CHAFFSTAR') || name.includes('LOROC') || name.includes('IPqm') || name.includes('LLS-920') || name.includes('LRCR') || name.includes('SRCR') || name.includes('Green Parrot') || name.includes('Kung Fen'))
    return 'Chaff_(countermeasure)';
  if (name.includes('BT-4 Chaff') || name.includes('DM19'))
    return 'Chaff_(countermeasure)';
  if (name.includes('FDS-3') || name.includes('Wizard') || name.includes('Mk59') || name.includes('Mk234'))
    return 'Chaff_(countermeasure)';
  if (name.includes('ADC Mk4') || name.includes('Type 2071') || name.includes('Type 2170') || name.includes('Type 2066'))
    return 'Decoy';
  if (name.includes('FOTD') || name.includes('FOTRD'))
    return 'Chaff_(countermeasure)';
  if (name.includes('MG-104') || name.includes('MG-44') || name.includes('MG-54') || name.includes('MG-64') || name.includes('MG-74'))
    return 'Decoy';

  // ── Mines ───────────────────────────────────────────────────────────────────
  if (name.includes('Mine') && !name.includes('Minigun') && !name.includes('Mine Sweep') && !name.includes('Minehunt'))
    return 'Naval_mine';
  if (name.includes('Destructor') || name.includes('CAPTOR') || name.includes('Quickstrike') || name.includes('SLMM'))
    return 'Naval_mine';
  if (name.includes('Stonefish') || name.includes('DM1 See') || name.includes('Manta Mine'))
    return 'Naval_mine';
  if (name.includes('PMT-1'))   return 'Naval_mine';

  // ── Mine countermeasures (towed gear) ───────────────────────────────────────
  if (name.includes('Mine Sweep') || name.includes('Minehunt') || name.includes('Mine sweep') || name.includes('Cable Cutter'))
    return 'Mine_countermeasures';

  // ── Depth charges ───────────────────────────────────────────────────────────
  if (name.includes('Depth Charge') || name.includes('PLAB-'))
    return 'Depth_charge';
  if (name.includes('WE.177'))  return 'WE.177';

  // ── Unguided rockets ────────────────────────────────────────────────────────
  if (name.includes('HYDRA') || name.includes('Hydra'))  return 'Hydra_70';
  if (name.includes('ZUNI') || name.includes('127mm HVAR')) return 'Zuni_(rocket)';
  if (name.includes('CRV-7'))    return 'CRV7';
  if (name.includes('SNEB') || name.includes('SNORA'))   return 'Unguided_rocket';
  if (name.includes('SURA'))     return 'Unguided_rocket';
  if (name.includes('FZ 68') || name.includes('FZ 70') || name.includes('FZ 90')) return 'Unguided_rocket';
  if (name.startsWith('S-13'))   return 'S-13_rocket';
  if (name.startsWith('S-25'))   return 'S-25_(rocket)';
  if (name.startsWith('S-5') || name.startsWith('S-8'))   return 'S-8_(rocket)';
  if (name.includes('107mm Rocket') || name.includes('140mm Rocket') || name.includes('Rocket') && name.includes('mm'))
    return 'Unguided_rocket';
  if (name.includes('Qassam'))   return 'Qassam_rocket';
  if (name.includes('WM-18') || name.includes('WR-40') || name.includes('WS-1') || name.includes('MLRS') || name.includes('GMLRS'))
    return 'Multiple_rocket_launcher';
  if (name.includes('M/49') || name.includes('M/57') || name.includes('M/70') && name.includes('Rocket'))
    return 'Unguided_rocket';
  if (name.includes('Mk15 AMLRS') || name.includes('Mk30 AMLRS') || name.includes('Mk45 AMLRS'))
    return 'Multiple_rocket_launcher';
  if (name.includes('BM-14') || name.includes('A-22'))  return 'Multiple_rocket_launcher';

  // ── ASW mortars ─────────────────────────────────────────────────────────────
  if (name.includes('Hedgehog')) return 'Hedgehog_(weapon)';
  if (name.includes('Mousetrap')) return 'Mousetrap_(weapon)';
  if (name.includes('Limbo'))   return 'Limbo_(weapon)';
  if (name.includes('Squid'))   return 'Squid_(weapon)';
  if (name.includes('ASW Rocket') || name.includes('ASW Mortar'))  return 'Anti-submarine_warfare';
  if (name.includes('Elma'))    return 'Anti-submarine_warfare';
  if (name.includes('Bofors 375mm')) return 'Anti-submarine_warfare';
  if (name.includes('Depth Charge Mortar') || name.includes('Mk6/9/14')) return 'Depth_charge';

  // ── Bombs (unguided) ────────────────────────────────────────────────────────
  if (name.startsWith('Mk81') || name.startsWith('Mk82') || name.startsWith('Mk83') || name.startsWith('Mk84'))
    return 'General-purpose_bomb';
  if (name.startsWith('Mk77') || name.startsWith('Mk78') || name.startsWith('Mk79'))
    return 'Incendiary_weapon';
  if (name.includes('BLU-82') || name.includes('Daisy Cutter')) return 'BLU-82';
  if (name.startsWith('BLU-'))  return 'Incendiary_weapon';
  if (name.startsWith('FAB-') || name.startsWith('OFAB-'))
    return 'General-purpose_bomb';
  if (name.includes('M117') || name.includes('JM117')) return 'General-purpose_bomb';
  if (name.includes('M/71 Virgo')) return 'General-purpose_bomb';
  if (name.includes('BR-250') || name.includes('T.200') || name.includes('EU.3') || name.includes('EU.4') || name.includes('MkXX'))
    return 'General-purpose_bomb';
  if (name.includes('GPB') && !name.includes('Pod'))
    return 'General-purpose_bomb';
  if (name.includes('SAMP Mk'))  return 'General-purpose_bomb';

  // ── LGBs / PGMs ────────────────────────────────────────────────────────────
  if (name.includes('LGB') || name.includes('Laser-Guided') || name.includes('BGL-'))
    return 'Paveway';
  if (name.includes('SPICE'))    return 'Precision-guided_munition';
  if (name.includes('AASM') || name.includes('SBU-'))   return 'Guided_bomb';
  if (name.includes('Opher') || name.includes('Lizard')) return 'Guided_bomb';
  if (name.includes('GCS-1'))    return 'Guided_bomb';
  if (name.includes('PGM-2') || name.includes('Hakim'))  return 'Guided_bomb';
  if (name.includes('BANG ') || name.includes('TLS '))    return 'Guided_bomb';
  if (name.includes('China Type 200A')) return 'Guided_bomb';
  if (name.includes('KAB-'))     return 'Guided_bomb';
  if (name.includes('Griffin LGB') || name.includes('Griffin-3')) return 'Guided_bomb';

  // ── Cluster bombs / dispensers ──────────────────────────────────────────────
  if (name.startsWith('CBU-'))   return 'Cluster_munition';
  if (name.includes('BL.755') || name.includes('BK 90') || name.includes('Mjolner'))
    return 'Cluster_munition';
  if (name.includes('JP.233'))   return 'Cluster_munition';
  if (name.includes('DWS'))      return 'Cluster_munition';
  if (name.includes('MW-1'))     return 'Cluster_munition';
  if (name.includes('RBK-'))     return 'Cluster_munition';
  if (name.includes('BetAB'))    return 'General-purpose_bomb';
  if (name.includes('PBK-500'))  return 'Cluster_munition';
  if (name.includes('KMG-U'))    return 'Cluster_munition';
  if (name.includes('Karinga') || name.includes('TAL 1') || name.includes('ISCB') || name.includes('BME-330'))
    return 'Cluster_munition';
  if (name.includes('BAT') && !name.includes('Combat')) return 'Cluster_munition';
  if (name.includes('ADM-141') || name.includes('TALD'))  return 'ADM-141_TALD';
  if (name.includes('ADM-160') || name.includes('MALD'))  return 'ADM-160_MALD';

  // ── Nuclear / strategic bombs ───────────────────────────────────────────────
  if (name.startsWith('B28') || name.startsWith('B43') || name.startsWith('B53') || name.startsWith('B57') || name.startsWith('B61') || name.startsWith('B83'))
    return 'Nuclear_weapon';
  if (name.startsWith('RN-') || name.startsWith('T-50 Strategic') || name.includes('China Type 639'))
    return 'Nuclear_weapon';
  if (name.includes('Strategic Bomb') || name.includes('Tactical Bomb') || name.includes('Multipurpose Surface'))
    return 'Nuclear_weapon';
  if (name.includes('M2/TN') || name.includes('M20/TN') || name.includes('M45/TN') || name.includes('M4A/TN') || name.includes('M4B/TN'))
    return 'Submarine-launched_ballistic_missile';

  // ── PJ-10 BrahMos ──────────────────────────────────────────────────────────
  if (name.includes('PJ-10') || name.includes('Brahmos') || name.includes('BrahMos'))
    return 'BrahMos';

  // ── Indian / Pakistani BMs ──────────────────────────────────────────────────
  // (already handled above under Foreign BMs)

  // ── Misc Swedish ────────────────────────────────────────────────────────────
  if (name.includes('RB 57'))    return 'AT4';

  // ── Laser weapons ───────────────────────────────────────────────────────────
  if (name.includes('Laser') && (name.includes('Shot') || name.includes('COIL')))
    return 'Directed-energy_weapon';

  // ── Personnel / Special Forces ──────────────────────────────────────────────
  if (name.includes('Combat Swimmer') || name.includes('SEAL Commando') || name.includes('Green Beret') || name.includes('Delta Force') || name.includes('Marine Infantry') || name.includes('Trooper'))
    return 'Special_forces';
  if (name.includes('Terrorist'))  return 'Improvised_explosive_device';
  if (name.includes('Trophy'))     return 'Trophy_(countermeasure)';
  if (name.includes('Cargo'))      return 'Drop_tank';

  // ── Generic fallbacks ───────────────────────────────────────────────────────
  if (name.includes('Generic RPG')) return 'Rocket-propelled_grenade';
  if (name.includes('Generic Mine')) return 'Naval_mine';
  if (name.includes('Generic Drill') || name.includes('Generic Test') || name.includes('Generic Unguided'))
    return 'Ammunition';
  if (name.includes('Aerial Towed Target')) return 'Target_drone';
  if (name.includes('Mk110 Load Practice')) return 'Ammunition';
  if (name.includes('Mk173 RBOC Test'))     return 'Chaff_(countermeasure)';
  if (name.includes('Mk11 Depth'))          return 'Depth_charge';

  // ── Type XX sonar jammers / decoys ──────────────────────────────────────────
  if (name.startsWith('Type 2'))   return 'Decoy';
  if (name.includes('Type 81H'))   return 'Multiple_rocket_launcher';
  if (name.startsWith('Type '))    return 'Torpedo';

  // ── Remaining Mk-series ─────────────────────────────────────────────────────
  if (name.startsWith('Mk'))      return 'Torpedo';

  // ── Catch-all ───────────────────────────────────────────────────────────────
  if (name.includes('LDGP'))     return 'General-purpose_bomb';
  if (name.includes('Incendiary')) return 'Incendiary_weapon';
  if (name.includes('lb GPB'))   return 'General-purpose_bomb';
  if (name.includes('Mortar'))   return 'Mortar_(weapon)';
  if (name.includes('Howitzer')) return 'Howitzer';

  // ── Remaining unmapped specifics ──────────────────────────────────────────
  if (name.includes('2A82') || name.includes('APFSDS'))  return 'Rheinmetall_Rh-120';
  if (name.includes('210mm'))  return 'Naval_gun';
  if (name.includes('AN/SLQ-49') || name.includes('Rubber Duck')) return 'Decoy';
  if (name.includes('CHT-02D')) return 'Torpedo';
  if (name.includes('Condib'))  return 'Unguided_rocket';
  if (name.includes('DPRK 32cm')) return 'Multiple_rocket_launcher';
  if (name.includes('LIG 130mm')) return 'Multiple_rocket_launcher';
  if (name.includes('Mirach 100')) return 'Target_drone';
  if (name.includes('S-2 RV') || name.includes('S-3 RV') || name === 'S-3') return 'Submarine-launched_ballistic_missile';
  if (name.includes('SOM B1') || name.includes('SOM J')) return 'Cruise_missile';
  if (name.includes('Tiger Cat')) return 'Seacat_(missile)';
  if (name.includes('TE-2'))    return 'Torpedo';
  if (name.includes('YT534'))   return 'Torpedo';

  return null;
}

function getSnWiki(name) {
  // ── Specific US radar systems (AN/xxx designations) ───────────────────────
  // Air search / AEW radars
  if (name.includes('AN/APY-1') || name.includes('AN/APY-2')) return 'Airborne_early_warning_and_control';
  if (name.includes('AN/APY-9'))  return 'AN/APY-9';
  if (name.includes('AN/SPY-1')) return 'AN/SPY-1';
  if (name.includes('AN/SPY-6')) return 'AN/SPY-6';
  if (name.includes('AN/SPY-3') || name.includes('AN/SPY-4')) return 'Phased_array_radar';
  if (name.includes('AN/SPS-48')) return 'AN/SPS-48';
  if (name.includes('AN/SPS-49')) return 'AN/SPS-49';
  if (name.includes('AN/SPS-40')) return 'AN/SPS-40';
  if (name.includes('AN/SPS-67')) return 'AN/SPS-67';
  if (name.includes('AN/SPS-73')) return 'Marine_radar';
  if (name.includes('AN/SPS-55')) return 'Marine_radar';
  if (name.includes('AN/SPS-64')) return 'Radar_navigation';
  if (name.includes('AN/SPS-10')) return 'Marine_radar';
  if (name.includes('AN/SPS-37') || name.includes('AN/SPS-43')) return 'Airborne_early_warning';
  if (name.includes('AN/SPS-52')) return 'Phased_array_radar';
  if (name.includes('AN/SPS-39')) return 'Phased_array_radar';

  // Ground-based search radars
  if (name.includes('AN/FPS-117')) return 'AN/FPS-117';
  if (name.includes('AN/FPS-132')) return 'AN/FPS-132';
  if (name.includes('AN/FPS-85')) return 'AN/FPS-85';
  if (name.includes('AN/FPS-') || name.includes('AN/FPN-')) return 'Over-the-horizon_radar';
  if (name.includes('AN/TPS-59')) return 'AN/TPS-59';
  if (name.includes('AN/TPS-70')) return 'AN/TPS-70';
  if (name.includes('AN/TPS-80')) return 'AN/TPS-80';
  if (name.includes('AN/TPS-43')) return 'Airport_surveillance_radar';
  if (name.includes('AN/TPS-63') || name.includes('AN/TPS-64') || name.includes('AN/TPS-65')) return 'Airport_surveillance_radar';
  if (name.includes('AN/TPS-32') || name.includes('AN/TPS-73')) return 'Airport_surveillance_radar';
  if (name.includes('AN/TPQ-36')) return 'AN/TPQ-36';
  if (name.includes('AN/TPQ-37')) return 'AN/TPQ-37';
  if (name.includes('AN/TPQ-'))  return 'Fire-control_radar';
  if (name.includes('AN/TPY-2')) return 'AN/TPY-2';

  // Fighter FCR radars
  if (name.includes('AN/APG-77')) return 'AN/APG-77';
  if (name.includes('AN/APG-81')) return 'AN/APG-81';
  if (name.includes('AN/APG-82')) return 'AN/APG-82';
  if (name.includes('AN/APG-83')) return 'AN/APG-83';
  if (name.includes('AN/APG-79')) return 'AN/APG-79';
  if (name.includes('AN/APG-63')) return 'AN/APG-63';
  if (name.includes('AN/APG-70')) return 'AN/APG-70';
  if (name.includes('AN/APG-68')) return 'AN/APG-68';
  if (name.includes('AN/APG-65') || name.includes('AN/APG-73')) return 'Active_electronically_scanned_array';
  if (name.includes('AN/APG-66')) return 'Pulse-Doppler_radar';
  if (name.includes('AN/APG-76')) return 'Synthetic-aperture_radar';

  // Bomber/attack FCR
  if (name.includes('AN/APQ-181')) return 'AN/APQ-181';
  if (name.includes('AN/APQ-164')) return 'AN/APQ-164';
  if (name.includes('AN/APQ-120')) return 'AN/APQ-120';
  if (name.includes('AN/APQ-'))   return 'Fire-control_radar';

  // Maritime patrol / surface search
  if (name.includes('AN/APS-137') || name.includes('AN/APS-149')) return 'Synthetic-aperture_radar';
  if (name.includes('AN/APS-143') || name.includes('AN/APS-145')) return 'Airborne_early_warning';
  if (name.includes('AN/APS-115') || name.includes('AN/APS-124') || name.includes('AN/APS-127') || name.includes('AN/APS-128')) return 'Marine_radar';
  if (name.includes('AN/APS-134')) return 'Doppler_radar';
  if (name.includes('AN/APS-20'))  return 'Airborne_early_warning';
  if (name.includes('AN/APS-147')) return 'Pulse-Doppler_radar';
  if (name.includes('AN/APY-3'))  return 'Synthetic-aperture_radar';
  if (name.includes('AN/APY-7'))  return 'Airborne_early_warning_and_control';
  if (name.includes('AN/APY-10')) return 'Marine_radar';
  if (name.includes('AN/ZPY-'))   return 'Synthetic-aperture_radar';

  // Aegis / combat system
  if (name.includes('AEGIS') || name.includes('Aegis')) return 'Aegis_Combat_System';

  // US EW systems
  if (name.includes('AN/ALQ-99'))  return 'AN/ALQ-99';
  if (name.includes('AN/ALQ-218') || name.includes('AN/ALQ-217') || name.includes('AN/ALQ-210') || name.includes('AN/ALQ-240')) return 'Electronic_intelligence';
  if (name.includes('AN/ALQ-161')) return 'Electronic_attack';
  if (name.includes('AN/ALQ-126') || name.includes('AN/ALQ-131') || name.includes('AN/ALQ-135') || name.includes('AN/ALQ-165')) return 'Electronic_countermeasure';
  if (name.includes('AN/ALQ-136') || name.includes('AN/ALQ-137') || name.includes('AN/ALQ-162') || name.includes('AN/ALQ-167')) return 'Barrage_jamming';
  if (name.includes('AN/ALQ-171') || name.includes('AN/ALQ-172') || name.includes('AN/ALQ-175') || name.includes('AN/ALQ-178')) return 'Electronic_countermeasure';
  if (name.includes('AN/ALQ-184') || name.includes('AN/ALQ-187') || name.includes('AN/ALQ-196') || name.includes('AN/ALQ-211')) return 'Electronic_attack';
  if (name.includes('AN/ALQ-214') || name.includes('AN/ALQ-100') || name.includes('AN/ALQ-105') || name.includes('AN/ALQ-117')) return 'Chaff_(countermeasure)';
  if (name.includes('AN/ALQ-128') || name.includes('AN/ALQ-133') || name.includes('AN/ALQ-142')) return 'Electronic_warfare_support';
  if (name.includes('AN/ALQ-173') || name.includes('AN/ALQ-202')) return 'Electronic_countermeasure';
  if (name.includes('AN/ALQ-'))   return 'Electronic_countermeasure';

  // US RWR
  if (name.includes('AN/ALR-94'))  return 'Stealth_technology';
  if (name.includes('AN/ALR-56') || name.includes('AN/ALR-67') || name.includes('AN/ALR-69')) return 'Radar_warning_receiver';
  if (name.includes('AN/ALR-45') || name.includes('AN/ALR-46') || name.includes('AN/ALR-50')) return 'Radar_warning_receiver';
  if (name.includes('AN/ALR-52') || name.includes('AN/ALR-54') || name.includes('AN/ALR-59')) return 'Electronic_warfare_support';
  if (name.includes('AN/ALR-62') || name.includes('AN/ALR-63') || name.includes('AN/ALR-66')) return 'Radar_warning_receiver';
  if (name.includes('AN/ALR-73') || name.includes('AN/ALR-75') || name.includes('AN/ALR-76')) return 'Electronic_warfare_support';
  if (name.includes('AN/ALR-81') || name.includes('AN/ALR-82') || name.includes('AN/ALR-86')) return 'Radar_warning_receiver';
  if (name.includes('AN/ALR-'))   return 'Radar_warning_receiver';
  if (name.includes('AN/APR-'))   return 'Signals_intelligence';

  // US shipboard EW
  if (name.includes('AN/SLQ-32'))  return 'AN/SLQ-32';
  if (name.includes('AN/SLQ-17') || name.includes('AN/SLQ-25') || name.includes('AN/SLQ-')) return 'Electronic_countermeasure';
  if (name.includes('AN/SLD-') || name.includes('AN/WLR-') || name.includes('AN/WLQ-')) return 'Electronic_intelligence';
  if (name.includes('AN/BLR-'))   return 'Electronic_warfare_support';
  if (name.includes('AN/ULQ-'))   return 'Barrage_jamming';

  // US Sonar systems
  if (name.includes('AN/SQS-53')) return 'AN/SQS-53';
  if (name.includes('AN/SQS-56')) return 'Active_sonar';
  if (name.includes('AN/SQS-26') || name.includes('AN/SQS-36') || name.includes('AN/SQS-38')) return 'Active_sonar';
  if (name.includes('AN/SQS-'))  return 'Sonar';
  if (name.includes('AN/BQQ-5'))  return 'AN/BQQ-5';
  if (name.includes('AN/BQQ-10') || name.includes('AN/BQQ-')) return 'Passive_sonar';
  if (name.includes('AN/BQH-'))   return 'Sonar';
  if (name.includes('AN/SQQ-89')) return 'AN/SQQ-89';
  if (name.includes('AN/SQQ-'))  return 'Sonar';
  if (name.includes('AN/SQR-'))  return 'Towed_array_sonar';
  if (name.includes('AN/SSQ-'))  return 'Sonobuoy';
  if (name.includes('AN/BQR-'))  return 'Passive_sonar';
  if (name.includes('AN/BQS-'))  return 'Active_sonar';

  // US sensor turrets & targeting
  if (name.includes('AN/AAQ-'))   return 'Electro-optical_targeting_system';
  if (name.includes('AN/AAS-'))   return 'Forward-looking_infrared';
  if (name.includes('AN/ASQ-228') || name.includes('ATFLIR')) return 'Forward-looking_infrared';
  if (name.includes('AN/ASQ-'))   return 'Electro-optical_targeting_system';
  if (name.includes('AN/ASX-'))   return 'Infrared_search_and_track';
  if (name.includes('AN/SAY-'))   return 'Thermal_imaging';
  if (name.includes('AN/KAX-'))   return 'Forward-looking_infrared';

  // US MAWS
  if (name.includes('AN/AAR-') || name.includes('AN/ALQ-212')) return 'Missile_approach_warning_system';

  // US MAD
  if (name.includes('AN/ASQ-81') || name.includes('AN/ASQ-233')) return 'Magnetic_anomaly_detector';

  // Catch remaining AN/ designations
  if (name.includes('AN/AYR-'))   return 'Signals_intelligence';
  if (name.includes('AN/ASD-'))   return 'Doppler_radar';
  if (name.includes('AN/AVQ-'))   return 'Laser_designator';
  if (name.includes('AN/AUS-'))   return 'Infrared_search_and_track';
  if (name.includes('AN/SPG-51') || name.includes('AN/SPG-55')) return 'Fire-control_radar';
  if (name.includes('AN/SPG-'))   return 'Fire-control_radar';
  if (name.includes('Mk92 ') || name.includes('Mk95 '))       return 'Fire-control_radar';

  // ── European / NATO radars ──────────────────────────────────────────────────
  // Thales (French)
  if (name.includes('DRBV'))     return 'Airborne_early_warning';
  if (name.includes('DRBI'))     return 'Phased_array_radar';
  if (name.includes('DRBN'))     return 'Radar_navigation';
  if (name.includes('DRBC'))     return 'Fire-control_radar';
  if (name.includes('DRUA') || name.includes('DRBJ')) return 'Doppler_radar';
  if (name.includes('TRS 3') || name.includes('TRS 2')) return 'Pulse-Doppler_radar';
  if (name.includes('Herakles') || name.includes('Heracles')) return 'Thales_Herakles';
  if (name.includes('Triton'))    return 'Marine_radar';
  if (name.includes('Jupiter'))   return 'Airborne_early_warning';
  if (name.includes('Calypso'))   return 'Doppler_radar';
  if (name.includes('Castor'))    return 'Fire-control_radar';
  if (name.includes('RBE2'))      return 'RBE2';
  if (name.includes('Cyrano'))    return 'Pulse-Doppler_radar';
  if (name.includes('Agave'))     return 'Marine_radar';
  if (name.includes('Anemone'))   return 'Pulse-Doppler_radar';
  if (name.includes('Antilope'))  return 'Terrain-following_radar';
  if (name.includes('Narval'))    return 'Doppler_radar';
  if (name.includes('Rapiere'))   return 'Fire-control_radar';

  // French sonar
  if (name.includes('DSUV') || name.includes('DSRV')) return 'Variable_depth_sonar';
  if (name.includes('DUBV'))     return 'Sonar';
  if (name.includes('DUUX'))     return 'Passive_sonar';
  if (name.includes('DUUG'))     return 'Sound_Surveillance_System';
  if (name.includes('DUBA'))     return 'Active_sonar';
  if (name.includes('TSM 22'))   return 'Sonar';
  if (name.includes('TSM 20'))   return 'Active_sonar';
  if (name.includes('TSM '))     return 'Sonar';
  if (name.includes('UMS 4'))    return 'Towed_array_sonar';
  if (name.includes('CAPTAS'))   return 'Towed_array_sonar';

  // French EW
  if (name.includes('ARBR'))     return 'Electronic_intelligence';
  if (name.includes('ARBB'))     return 'Electronic_countermeasure';
  if (name.includes('ARAR'))     return 'Electronic_intelligence';
  if (name.includes('DR 2000') || name.includes('DR 3000') || name.includes('DR 4000')) return 'Electronic_intelligence';

  // Italian (Selex/Leonardo)
  if (name.includes('MM/SPS-') || name.includes('MM/SPQ-')) return 'Marine_radar';
  if (name.includes('MM/SLQ-'))  return 'Electronic_countermeasure';
  if (name.includes('RAN-') || name.includes('RAN '))  return 'Doppler_radar';
  if (name.includes('SPS-') && (name.includes('2') || name.includes('7')))  return 'Marine_radar';
  if (name.includes('RTN-') || name.includes('NA-') || name.includes('SPG-7')) return 'Fire-control_radar';
  if (name.includes('EMPAR'))    return 'EMPAR';
  if (name.includes('Kronos'))   return 'Active_electronically_scanned_array';
  if (name.includes('Argo'))     return 'Electronic_intelligence';
  if (name.includes('Nettuno'))  return 'Electronic_countermeasure';
  if (name.includes('Newton'))   return 'Electronic_countermeasure';
  if (name.includes('IRSCAN'))   return 'Infrared_search_and_track';

  // Dutch (Signaal/Thales NL)
  if (name.includes('SMART-L') || name.includes('SMART L')) return 'Active_electronically_scanned_array';
  if (name.includes('SMART-S') || name.includes('SMART S')) return 'Phased_array_radar';
  if (name.includes('APAR'))     return 'Phased_array_radar';
  if (name.includes('DA.0') || name.includes('DA.1') || name.includes('LW.0')) return 'Airborne_early_warning';
  if (name.includes('WM-') && name.includes('25'))  return 'Fire-control_radar';
  if (name.includes('ZW-') || name.includes('ZW0')) return 'Marine_radar';
  if (name.includes('Scout'))    return 'Marine_radar';
  if (name.includes('STIR'))     return 'Fire-control_radar';
  if (name.includes('Mirador'))  return 'Electro-optical_targeting_system';

  // UK radars
  if (name.includes('Type 965') || name.includes('Type 984') || name.includes('Type 985')) return 'Type_965_radar';
  if (name.includes('Type 1022') || name.includes('Type 1023')) return 'Type_1022_radar';
  if (name.includes('Type 996') || name.includes('Type 992') || name.includes('Type 993')) return 'Doppler_radar';
  if (name.includes('Type 1006') || name.includes('Type 1007') || name.includes('Type 1008')) return 'Marine_radar';
  if (name.includes('Type 909'))  return 'Fire-control_radar';
  if (name.includes('Type 903') || name.includes('Type 904') || name.includes('Type 911')) return 'Fire-control_radar';
  if (name.includes('Type 978') || name.includes('Type 1002') || name.includes('Type 994')) return 'Marine_radar';
  if (name.includes('SAMPSON'))   return 'SAMPSON';
  if (name.includes('Artisan'))   return 'Active_electronically_scanned_array';
  if (name.includes('Searchwater'))return 'Synthetic-aperture_radar';
  if (name.includes('Blue Fox'))  return 'Pulse-Doppler_radar';
  if (name.includes('Blue Vixen'))return 'Pulse-Doppler_radar';
  if (name.includes('Captor'))    return 'Active_electronically_scanned_array';
  if (name.includes('Seaspray'))  return 'Marine_radar';
  if (name.includes('AWS'))       return 'Doppler_radar';
  if (name.includes('CWS'))       return 'Fire-control_radar';

  // UK sonar
  if (name.includes('Type 2016') || name.includes('Type 2050') || name.includes('Type 2087')) return 'Towed_array_sonar';
  if (name.includes('Type 2008') || name.includes('Type 2019') || name.includes('Type 2020')) return 'Passive_sonar';
  if (name.includes('Type 2001') || name.includes('Type 2024') || name.includes('Type 2026') || name.includes('Type 2031')) return 'Towed_array_sonar';
  if (name.includes('Type 2046') || name.includes('Type 2044') || name.includes('Type 2050')) return 'Sonar';
  if (name.includes('Type 184') || name.includes('Type 170') || name.includes('Type 174') || name.includes('Type 177') || name.includes('Type 176') || name.includes('Type 162')) return 'Sonar';
  if (name.includes('Type 193') || name.includes('Type 194') || name.includes('Type 197') || name.includes('Type 199') || name.includes('Type 195')) return 'Active_sonar';
  if (name.includes('Type 2059') || name.includes('Type 2093') || name.includes('Type 2076')) return 'Sonar';

  // UK EW
  if (name.includes('UAA') || name.includes('UAF') || name.includes('UAT')) return 'Electronic_warfare_support';
  if (name.includes('Cutlass'))   return 'Electronic_intelligence';
  if (name.includes('Outfit'))    return 'Electronic_countermeasure';

  // Swedish (Ericsson/Saab)
  if (name.includes('9LV'))       return 'Fire-control_radar';
  if (name.includes('Giraffe') || name.includes('Sea Giraffe')) return 'Giraffe_radar';
  if (name.includes('PS-05'))     return 'Active_electronically_scanned_array';
  if (name.includes('PS-46') || name.includes('PS-860') || name.includes('PS-890'))  return 'Airborne_early_warning';
  if (name.includes('Saab '))     return 'Pulse-Doppler_radar';
  if (name.includes('Scanter'))   return 'Marine_radar';
  if (name.includes('Telegon'))   return 'Electronic_intelligence';
  if (name.includes('ASO '))      return 'Active_sonar';
  if (name.includes('Hydra '))    return 'Passive_sonar';

  // German
  if (name.includes('DE 1160') || name.includes('DE 1163') || name.includes('DE 1167')) return 'Sonar';
  if (name.includes('DSQS-') || name.includes('CSU '))  return 'Active_sonar';
  if (name.includes('DBQS-'))    return 'Passive_sonar';
  if (name.includes('TAS-') || name.includes('TASS ')) return 'Towed_array_sonar';
  if (name.includes('FL 1800'))  return 'Electronic_intelligence';
  if (name.includes('FL '))      return 'Electronic_countermeasure';

  // Israeli (Elta/IAI/Elbit)
  if (name.includes('EL/M-2080') || name.includes('Green Pine')) return 'EL/M-2080_Green_Pine';
  if (name.includes('EL/M-2032') || name.includes('EL/M-2052') || name.includes('EL/M-2060')) return 'Active_electronically_scanned_array';
  if (name.includes('EL/M-2221') || name.includes('EL/M-2228')) return 'Fire-control_radar';
  if (name.includes('EL/M-2022')) return 'Marine_radar';
  if (name.includes('EL/M-2083')) return 'Airborne_early_warning_and_control';
  if (name.includes('EL/M-'))    return 'Phased_array_radar';
  if (name.includes('AselFLIR') || name.includes('CoMPASS')) return 'Forward-looking_infrared';
  if (name.includes('EL/L-'))    return 'Electronic_countermeasure';
  if (name.includes('EL/K-'))    return 'Electronic_intelligence';

  // Russian/Soviet radars (NATO reporting names)
  if (name.includes('Big Bird'))  return 'S-300_missile_system';
  if (name.includes('Top Pair') || name.includes('Top Plate') || name.includes('Top Steer') || name.includes('Top Sail')) return 'Phased_array_radar';
  if (name.includes('Top Dome') || name.includes('Top Hat'))  return 'S-300_missile_system';
  if (name.includes('Flap Lid'))  return 'S-300_missile_system';
  if (name.includes('Tombstone')) return 'S-400_missile_system';
  if (name.includes('Grave Stone')) return 'S-400_missile_system';
  if (name.includes('Snow Drift')) return 'Buk_missile_system';
  if (name.includes('Fire Dome'))  return 'Buk_missile_system';
  if (name.includes('Hot Shot') || name.includes('Hot Flash')) return 'Pantsir_missile_system';
  if (name.includes('Scrum Half')) return 'Tor_missile_system';
  if (name.includes('Flat Face'))  return 'Flat_Face_radar';
  if (name.includes('Bar Lock'))   return 'Over-the-horizon_radar';
  if (name.includes('Long Track')) return 'Long_Track_radar';
  if (name.includes('Thin Skin')) return 'Height_finder';
  if (name.includes('Spoon Rest') || name.includes('Knife Rest')) return 'Over-the-horizon_radar';
  if (name.includes('Tall King'))  return 'Over-the-horizon_radar';
  if (name.includes('Nebo') || name.includes('55Zh6'))  return 'Nebo_SVU';
  if (name.includes('Protivnik') || name.includes('59N6')) return 'Phased_array_radar';
  if (name.includes('Vostok'))    return 'Over-the-horizon_radar';
  if (name.includes('Cheese Board') || name.includes('Cheese Cake')) return 'Marine_radar';
  if (name.includes('Head Net'))  return 'Doppler_radar';
  if (name.includes('Strut'))     return 'Doppler_radar';
  if (name.includes('Palm Frond') || name.includes('Don Kay') || name.includes('Don-2')) return 'Marine_radar';
  if (name.includes('Spin Trough') || name.includes('Square Tie') || name.includes('Plank Shave')) return 'Marine_radar';
  if (name.includes('Peel '))     return 'Marine_radar';
  if (name.includes('Snoop'))     return 'Marine_radar';
  if (name.includes('Band Stand') || name.includes('Light Bulb') || name.includes('Mineral')) return 'Fire-control_radar';
  if (name.includes('Kite Screech') || name.includes('Owl Screech') || name.includes('Hawk Screech')) return 'Fire-control_radar';
  if (name.includes('Bass Tilt') || name.includes('Drum Tilt') || name.includes('Muff Cob') || name.includes('Pop Group')) return 'Fire-control_radar';
  if (name.includes('Egg Cup') || name.includes('Sun Visor') || name.includes('Wasp Head')) return 'Fire-control_radar';
  if (name.includes('Half Plate') || name.includes('Half Hat') || name.includes('Half Bow') || name.includes('Half Cup')) return 'Fire-control_radar';
  if (name.includes('Cross Dome') || name.includes('Cross Sword') || name.includes('Cross Slot') || name.includes('Cross Round')) return 'Fire-control_radar';
  if (name.includes('Squat Eye'))  return 'Doppler_radar';
  if (name.includes('High Fix') || name.includes('High Lark')) return 'Pulse-Doppler_radar';
  if (name.includes('Fox Fire') || name.includes('Jay Bird') || name.includes('Sapfir') || name.includes('Skip Spin')) return 'Pulse-Doppler_radar';
  if (name.includes('Twistrack') || name.includes('Twist Two')) return 'Doppler_radar';
  if (name.includes('Clam Pipe') || name.includes('Fin Curve') || name.includes('Snoop Pair')) return 'Marine_radar';
  if (name.includes('Pot '))       return 'Doppler_radar';
  if (name.includes('Cage'))       return 'Airborne_early_warning';

  // Russian/Soviet radars (specific systems)
  if (name.includes('MR-350') || name.includes('MR-710') || name.includes('MR-700') || name.includes('MR-750')) return 'Phased_array_radar';
  if (name.includes('MR-212') || name.includes('MR-302') || name.includes('MR-310') || name.includes('MR-320')) return 'Doppler_radar';
  if (name.includes('Irbis'))     return 'Irbis-E';
  if (name.includes('N011M'))     return 'Active_electronically_scanned_array';
  if (name.includes('N001'))      return 'Pulse-Doppler_radar';
  if (name.includes('N010') || name.includes('N035') || name.includes('N036')) return 'Active_electronically_scanned_array';
  if (name.includes('Zhuk'))      return 'Zhuk_(radar)';
  if (name.includes('Phazotron')) return 'Pulse-Doppler_radar';
  if (name.includes('NIIP'))      return 'Active_electronically_scanned_array';
  if (name.includes('Zaslon'))    return 'Phased_array_radar';
  if (name.includes('SBI-16') || name.includes('Kolchuga')) return 'Kolchuga_passive_sensor';

  // Russian/Soviet EW
  if (name.includes('Brick '))    return 'Electronic_countermeasure';
  if (name.includes('Bell '))     return 'Electronic_countermeasure';
  if (name.includes('Foot Ball'))  return 'Electronic_countermeasure';
  if (name.includes('Rum Tub'))   return 'Electronic_countermeasure';
  if (name.includes('Wine Flask') || name.includes('Wine Glass')) return 'Electronic_countermeasure';
  if (name.includes('SPO-'))      return 'Radar_warning_receiver';
  if (name.includes('SPS-N'))     return 'Electronic_countermeasure';

  // Russian sonar
  if (name.includes('MGK-') || name.includes('MG-'))   return 'Sonar';
  if (name.includes('Shark Gill') || name.includes('Shark Fin') || name.includes('Shark Rib') || name.includes('Shark Teeth')) return 'Sonar';
  if (name.includes('Bull Nose') || name.includes('Bull Horn') || name.includes('Bull Leap')) return 'Active_sonar';
  if (name.includes('Horse Jaw') || name.includes('Horse Tail')) return 'Variable_depth_sonar';
  if (name.includes('Mouse Roar') || name.includes('Moose Jaw')) return 'Active_sonar';
  if (name.includes('Herkules'))  return 'Sonar';
  if (name.includes('Stork Tail'))return 'Active_sonar';
  if (name.includes('Mare Tail'))  return 'Variable_depth_sonar';
  if (name.includes('Pegas'))      return 'Sonar';

  // Chinese systems
  if (name.includes('China') || name.startsWith('Type 3') || name.startsWith('Type 4') || name.startsWith('Type 5') || name.startsWith('Type 6') || name.startsWith('Type 7') || name.startsWith('Type 8') || name.startsWith('Type 9')) {
    if (name.includes('Type 346') || name.includes('Type 348')) return 'Type_346_radar';
    if (name.includes('Type 382') || name.includes('Type 381')) return 'Phased_array_radar';
    if (name.includes('Type 360') || name.includes('Type 362') || name.includes('Type 364')) return 'Doppler_radar';
    if (name.includes('Type 517') || name.includes('Type 518') || name.includes('Type 515')) return 'Over-the-horizon_radar';
    if (name.includes('Type 354') || name.includes('Type 352') || name.includes('Type 756') || name.includes('Type 765')) return 'Marine_radar';
    if (name.includes('Type 341') || name.includes('Type 344') || name.includes('Type 347')) return 'Fire-control_radar';
    if (name.includes('Type 349')) return 'Fire-control_radar';
    if (name.includes('SJD-') || name.includes('SJC-') || name.includes('ESS-') || name.includes('SS-12') || name.includes('SJ '))  return 'Sonar';
    if (name.includes('SQC-') || name.includes('TASS') || name.includes('SQR-') || name.includes('ACTAS'))  return 'Towed_array_sonar';
    if (name.includes('HN-') || name.includes('BM/HZ') || name.includes('YLC-') || name.includes('JY-'))  return 'Phased_array_radar';
    if (name.includes('KLC-') || name.includes('KLJ-'))  return 'Active_electronically_scanned_array';
    if (name.includes('K/JRW') || name.includes('RWR') || name.includes('923'))  return 'Radar_warning_receiver';
    if (name.includes('981') || name.includes('923'))  return 'Electronic_countermeasure';
    if (name.includes('Rice '))  return 'Fire-control_radar';
    if (name.includes('SJR'))   return 'Active_sonar';
    if (name.includes('Type 120') || name.includes('Rye House')) return 'Over-the-horizon_radar';
    return 'Phased_array_radar';
  }

  // Japanese
  if (name.includes('J/OPS-') || name.includes('J/FCS-') || name.includes('J/APS-')) return 'Phased_array_radar';
  if (name.includes('J/APG-') || name.includes('J/APQ-')) return 'Active_electronically_scanned_array';
  if (name.includes('J/OQS-') || name.includes('J/QQS-') || name.includes('J/SQS-')) return 'Sonar';
  if (name.includes('J/QQR-') || name.includes('J/SQR-')) return 'Towed_array_sonar';
  if (name.includes('J/ALR-') || name.includes('J/HLR-')) return 'Radar_warning_receiver';
  if (name.includes('J/NOLQ-') || name.includes('J/OLT-')) return 'Electronic_countermeasure';
  if (name.includes('J/'))       return 'Phased_array_radar';

  // Canadian
  if (name.includes('CA/SPS-') || name.includes('CA/APS-')) return 'Marine_radar';
  if (name.includes('CA/SPG-') || name.includes('CA/SPQ-')) return 'Fire-control_radar';
  if (name.includes('CA/SQS-') || name.includes('CA/SQR-')) return 'Sonar';
  if (name.includes('CA/ULR-') || name.includes('CA/SLQ-')) return 'Electronic_intelligence';

  // Decca / Kelvin Hughes navigation radars
  if (name.includes('Decca'))     return 'Decca_Radar';
  if (name.includes('Kelvin'))    return 'Kelvin_Hughes';
  if (name.includes('Bridgemaster'))  return 'Marine_radar';
  if (name.includes('Furuno'))    return 'Marine_radar';
  if (name.includes('Sperry'))    return 'Marine_radar';
  if (name.includes('Racal'))     return 'Marine_radar';
  if (name.includes('Atlas'))     return 'Marine_radar';
  if (name.includes('Raytheon'))  return 'Raytheon';
  if (name.includes('JRC'))       return 'Marine_radar';
  if (name.includes('Nucleus'))   return 'Marine_radar';

  // EDO / sonar
  if (name.includes('EDO '))      return 'Active_sonar';

  // Indian
  if (name.includes('BEL'))       return 'Phased_array_radar';
  if (name.includes('Rajendra'))  return 'Phased_array_radar';
  if (name.includes('HUMSA'))     return 'Sonar';

  // Korean
  if (name.includes('SPS-100K') || name.includes('SPS-200') || name.includes('SPS-2000') || name.includes('SPS-2100')) return 'Phased_array_radar';
  if (name.includes('KJS-'))      return 'Electronic_countermeasure';

  // GSA / Radamec / RNEOSS (optronic directors)
  if (name.includes('GSA ') || name.includes('Radamec') || name.includes('RNEOSS')) return 'Electro-optical_targeting_system';
  if (name.includes('CEROS'))     return 'Fire-control_radar';

  // ── Sonar by type ─────────────────────────────────────────────────────────
  if (name.includes('TASS') || name.includes('Towed Array')) return 'Towed_array_sonar';
  if (name.includes('VDS') || name.includes('Variable Depth')) return 'Variable_depth_sonar';
  if (name.includes('Dipping Sonar') || name.includes('Dipping sonar')) return 'Dipping_sonar';
  if (name.includes('SOSUS'))     return 'Sound_Surveillance_System';
  if (name.includes('Sonobuoy') || name.includes('SSQ'))  return 'Sonobuoy';
  if (name.includes('Acoustic Intercept') || name.includes('Torpedo Warning')) return 'Passive_sonar';
  if (name.includes('Sonar') || name.includes('sonar'))   return 'Sonar';

  // ── EW by type ────────────────────────────────────────────────────────────
  if (name.includes('DIRCM'))     return 'Infrared_countermeasure';
  if (name.includes('MAWS'))      return 'Missile_approach_warning_system';
  if (name.includes('LWR'))       return 'Laser_rangefinder';
  if (name.includes('IRCM'))      return 'Infrared_countermeasure';
  if (name.includes('RWR') || name.includes('RHAWS') || name.includes('TEWS')) return 'Radar_warning_receiver';
  if (name.includes('ELINT'))     return 'Electronic_intelligence';
  if (name.includes('COMINT'))    return 'Communications_intelligence';
  if (name.includes('SIGINT'))    return 'Signals_intelligence';
  if (name.includes('ESM'))       return 'Electronic_warfare_support';
  if (name.includes('OECM') || name.includes('DECM'))    return 'Electronic_countermeasure';
  if (name.includes('ECM'))       return 'Electronic_countermeasure';
  if (name.includes('EW ') || name.includes('EW/'))       return 'Electronic_warfare';
  if (name.includes('Jammer') || name.includes('jammer')) return 'Barrage_jamming';
  if (name.includes('HF/DF') || name.includes('HFDF') || name.includes('Direction Find')) return 'Direction_finding';

  // ── IR / EO / Visual systems ──────────────────────────────────────────────
  if (name.includes('FLIR'))      return 'Forward-looking_infrared';
  if (name.includes('IRST'))      return 'Infrared_search_and_track';
  if (name.includes('OLS'))       return 'Infrared_search_and_track';
  if (name.includes('IRLS'))      return 'Infrared_imaging';
  if (name.includes('Infrared') || name.includes('IR '))  return 'Infrared_search_and_track';
  if (name.includes('Night Vision') || name.includes('NVG'))  return 'Night_vision_device';
  if (name.includes('LLTV'))      return 'Night_vision';
  if (name.includes('TV Camera') || name.includes('Video'))   return 'Electro-optical_targeting_system';
  if (name.includes('Binocular'))  return 'Binoculars';
  if (name.includes('Searchlight'))return 'Searchlight';
  if (name.includes('Bomb Sight') || name.includes('Bombsight')) return 'Bombsight';
  if (name.includes('Camera'))     return 'Aerial_photography';
  if (name.includes('Optical'))    return 'Optical_sight';
  if (name.includes('Periscope'))  return 'Periscope';
  if (name.includes('Telescope'))  return 'Telescopic_sight';

  // ── MAD ────────────────────────────────────────────────────────────────────
  if (name.includes('MAD'))       return 'Magnetic_anomaly_detector';

  // ── Laser ─────────────────────────────────────────────────────────────────
  if (name.includes('Laser Designator') || name.includes('LTD')) return 'Laser_designator';
  if (name.includes('Laser Range') || name.includes('LRF'))     return 'Laser_rangefinder';
  if (name.includes('LST'))        return 'Laser_designator';
  if (name.includes('Laser'))      return 'Laser_rangefinder';

  // ── Mine countermeasures ──────────────────────────────────────────────────
  if (name.includes('Mine Sweep') || name.includes('Cable Cutter') || name.includes('Minesweep')) return 'Minesweeping';
  if (name.includes('Mine Hunt') || name.includes('Minehunt') || name.includes('Mine Classification')) return 'Mine_countermeasures';
  if (name.includes('Mine Avoidance') || name.includes('Mine Detect') || name.includes('Mine Reconnaissance')) return 'Mine_countermeasures';
  if (name.includes('Oropesa'))    return 'Minesweeping';
  if (name.includes('Mine'))       return 'Mine_countermeasures';

  // ── Navigation ────────────────────────────────────────────────────────────
  if (name.includes('INS') || name.includes('Inertial'))  return 'Inertial_navigation_system';
  if (name.includes('Navigation') || name.includes('Nav '))return 'Radar_navigation';
  if (name.includes('Weather'))    return 'Weather_radar';
  if (name.includes('Doppler'))    return 'Doppler_radar';
  if (name.includes('Terrain'))    return 'Terrain-following_radar';

  // ── ATC / GCA ─────────────────────────────────────────────────────────────
  if (name.includes('GCA') || name.includes('ATC') || name.includes('ASR-')) return 'Airport_surveillance_radar';

  // ── Ballistic missile ─────────────────────────────────────────────────────
  if (name.includes('BMEWS') || name.includes('Ballistic')) return 'BMEWS';
  if (name.includes('PAVE PAWS'))  return 'PAVE_PAWS';
  if (name.includes('Cobra Dane')) return 'Cobra_Dane';
  if (name.includes('Cobra Judy')) return 'Cobra_Judy';
  if (name.includes('DEW Line'))   return 'DEW_Line';

  // ── Counter-battery ───────────────────────────────────────────────────────
  if (name.includes('Counter-') || name.includes('Firefind')) return 'Fire-control_radar';

  // ── Generic type-based fallbacks ──────────────────────────────────────────
  if (name.includes('Sensor Group') || name.includes('Sensor Suite')) return 'Combat_information_center';
  if (name.includes('Sensor Turret'))  return 'Electro-optical_targeting_system';
  if (name.includes('Grifo'))      return 'Pulse-Doppler_radar';
  if (name.includes('Radar') || name.includes('radar'))   return 'Doppler_radar';
  if (name.includes('Height Find'))return 'Height_finder';
  if (name.includes('Fire Control') || name.includes('FCR')) return 'Fire-control_radar';
  if (name.includes('AESA'))       return 'Active_electronically_scanned_array';
  if (name.includes('SAR') && !name.includes('MSAR'))     return 'Synthetic-aperture_radar';
  if (name.includes('ISAR'))       return 'Synthetic-aperture_radar';
  if (name.includes('Surface Search') || name.includes('Surface search')) return 'Marine_radar';
  if (name.includes('Air Search') || name.includes('Air search'))   return 'Airborne_early_warning';
  if (name.includes('Target Indicator') || name.includes('Target Acquisition')) return 'Fire-control_radar';
  if (name.includes('Illuminat'))  return 'Fire-control_radar';
  if (name.includes('BX-') || name.includes('RDR'))  return 'Marine_radar';
  if (name.includes('Generic'))    return 'Combat_information_center';

  // ── Remaining AN/ catch-alls ──────────────────────────────────────────────
  if (name.includes('AN/APN-') || name.includes('AN/APN ')) return 'Radar_navigation';
  if (name.includes('AN/ALT-'))   return 'Electronic_countermeasure';
  if (name.includes('AN/ALD-'))   return 'Direction_finding';
  if (name.includes('AN/APD-'))   return 'Synthetic-aperture_radar';
  if (name.includes('AN/APS-'))   return 'Marine_radar';
  if (name.includes('AN/APG-'))   return 'Pulse-Doppler_radar';
  if (name.includes('AN/SPN-'))   return 'Airport_surveillance_radar';
  if (name.includes('AN/SPQ-'))   return 'Fire-control_radar';
  if (name.includes('AN/SSQ-'))   return 'Sonobuoy';
  if (name.includes('AN/AIM-'))   return 'Infrared_search_and_track';
  if (name.includes('AN/AAD-'))   return 'Infrared_search_and_track';
  if (name.includes('AN/'))       return 'Combat_information_center';

  // ── Swedish PS- series ──────────────────────────────────────────────────────
  if (name.startsWith('PS-41') || name.startsWith('PS-47')) return 'Pulse-Doppler_radar';
  if (name.startsWith('PS-0') || name.startsWith('PS-1') || name.startsWith('PS-2') || name.startsWith('PS-3')) return 'Pulse-Doppler_radar';
  if (name.startsWith('PS-5') || name.startsWith('PS-6') || name.startsWith('PS-7') || name.startsWith('PS-8')) return 'Marine_radar';
  if (name.startsWith('PS-'))     return 'Pulse-Doppler_radar';
  if (name.startsWith('PH-') || name.startsWith('PN-') || name.startsWith('PQ-')) return 'Direction_finding';
  if (name.startsWith('PE-'))     return 'Electronic_intelligence';
  if (name.startsWith('GD-'))     return 'Pulse-Doppler_radar';

  // ── Italian MM/ designations ────────────────────────────────────────────────
  if (name.includes('MM/APQ') || name.includes('MM/APS') || name.includes('MM/BPS')) return 'Marine_radar';
  if (name.includes('MM/BLD'))    return 'Sonar';
  if (name.includes('MM/SPN'))    return 'Airport_surveillance_radar';
  if (name.includes('MM/SCP'))    return 'Combat_information_center';
  if (name.includes('MM/HEW'))    return 'Electronic_intelligence';
  if (name.includes('MM/'))       return 'Marine_radar';

  // ── NATO reporting names (remaining) ────────────────────────────────────────
  // These are mostly one-word NATO codenames for Russian systems
  if (name.includes('Big '))      return 'Over-the-horizon_radar';
  if (name.includes('Tin '))      return 'Phased_array_radar';
  if (name.includes('Stag '))     return 'Direction_finding';
  if (name.includes('Front '))    return 'Fire-control_radar';
  if (name.includes('Dog '))      return 'Height_finder';
  if (name.includes('High '))     return 'Height_finder';
  if (name.includes('Side '))     return 'Height_finder';
  if (name.includes('Back '))     return 'Doppler_radar';
  if (name.includes('Watch '))    return 'Doppler_radar';
  if (name.includes('Stop '))     return 'Electronic_countermeasure';
  if (name.includes('Fly '))      return 'Marine_radar';
  if (name.includes('Don '))      return 'Marine_radar';
  if (name.includes('Odd '))      return 'Fire-control_radar';
  if (name.includes('Hen '))      return 'BMEWS';
  if (name.includes('Cat '))      return 'BMEWS';
  if (name.includes('Drop '))     return 'Fire-control_radar';
  if (name.includes('Buck '))     return 'Electronic_countermeasure';
  if (name.includes('Elk '))      return 'Direction_finding';
  if (name.includes('Foal '))     return 'Direction_finding';
  if (name.includes('Hood '))     return 'Electronic_intelligence';
  if (name.includes('Pill '))     return 'Doppler_radar';
  if (name.includes('Puff '))     return 'Doppler_radar';
  if (name.includes('Log '))      return 'Electronic_intelligence';
  if (name.includes('Toad '))     return 'Electronic_intelligence';
  if (name.includes('Ball End'))  return 'Marine_radar';
  if (name.includes('Skin Head')) return 'Marine_radar';
  if (name.includes('Slim Net'))  return 'Doppler_radar';
  if (name.includes('Mushroom'))  return 'Doppler_radar';
  if (name.includes('Bean'))      return 'Doppler_radar';
  if (name.includes('Wet '))      return 'Infrared_search_and_track';
  if (name.includes('Wolf'))      return 'Radar_warning_receiver';
  if (name.includes('Pike'))      return 'Sonar';
  if (name.includes('Ox '))       return 'Sonar';
  if (name.includes('Mad '))      return 'Magnetic_anomaly_detector';
  if (name.includes('Eye '))      return 'Fire-control_radar';
  if (name.includes('Box '))      return 'Over-the-horizon_radar';

  // ── Russian EW systems (SPS-/SRS-) ─────────────────────────────────────────
  if (name.startsWith('SPS-1') || name.startsWith('SPS-2') || name.startsWith('SPS-3') || name.startsWith('SPS-4') || name.startsWith('SPS-5') || name.startsWith('SPS-6')) return 'Electronic_countermeasure';
  if (name.startsWith('SRS-'))    return 'Electronic_intelligence';
  if (name.startsWith('SPO-'))    return 'Radar_warning_receiver';
  if (name.startsWith('SPS '))    return 'Phased_array_radar';

  // ── Korean K/ designations ──────────────────────────────────────────────────
  if (name.startsWith('K/SLQ') || name.startsWith('K/ULQ')) return 'Electronic_countermeasure';
  if (name.startsWith('K/SPS') || name.startsWith('K/'))    return 'Phased_array_radar';

  // ── Canadian CA/ remaining ──────────────────────────────────────────────────
  if (name.startsWith('CA/ASQ'))  return 'Electro-optical_targeting_system';
  if (name.startsWith('CA/BLQ') || name.startsWith('CA/SLR')) return 'Electronic_intelligence';
  if (name.startsWith('CA/BQG'))  return 'Passive_sonar';
  if (name.startsWith('CA/'))     return 'Marine_radar';

  // ── Kelvin Hughes (KH) ─────────────────────────────────────────────────────
  if (name.startsWith('KH '))     return 'Kelvin_Hughes';

  // ── French remaining ───────────────────────────────────────────────────────
  if (name.startsWith('DSBV'))    return 'Towed_array_sonar';
  if (name.startsWith('DUUA') || name.startsWith('DUBM') || name.startsWith('DMUX') || name.startsWith('DUAV')) return 'Sonar';
  if (name.startsWith('DHAX'))    return 'Active_sonar';
  if (name.startsWith('DRAA'))    return 'Marine_radar';
  if (name.startsWith('DRBR'))    return 'Doppler_radar';
  if (name.startsWith('APX '))    return 'Electro-optical_targeting_system';
  if (name.includes('Vigile'))    return 'Electronic_intelligence';

  // ── Specific well-known systems ─────────────────────────────────────────────
  if (name.includes('SPECTRA'))   return 'Electronic_countermeasure';
  if (name.includes('PIRATE'))    return 'Infrared_search_and_track';
  if (name.includes('DASS'))      return 'Electronic_countermeasure';
  if (name.includes('Foxhunter'))return 'Pulse-Doppler_radar';
  if (name.includes('Longbow'))  return 'Fire-control_radar';
  if (name.includes('Phalcon'))  return 'Airborne_early_warning_and_control';
  if (name.includes('MESA'))     return 'Airborne_early_warning_and_control';
  if (name.includes('COBRA'))    return 'Fire-control_radar';
  if (name.includes('ARTHUR'))   return 'Fire-control_radar';
  if (name.includes('LIOD') || name.includes('LIROD'))    return 'Fire-control_radar';
  if (name.includes('Rapiere') || name.includes('CGS'))   return 'Fire-control_radar';
  if (name.includes('WM.2') || name.includes('WM.22') || name.includes('WM.25') || name.includes('WM.26') || name.includes('WM.27') || name.includes('WM.28')) return 'Fire-control_radar';
  if (name.includes('STING'))    return 'Fire-control_radar';
  if (name.includes('Seaguard')) return 'Fire-control_radar';
  if (name.includes('NWS.'))     return 'Fire-control_radar';

  // ── Optronic turrets ────────────────────────────────────────────────────────
  if (name.includes('Turret') || name.includes('EOMS') || name.includes('EOS') || name.includes('Sensor Package'))
    return 'Electro-optical_targeting_system';
  if (name.includes('TADS') || name.includes('PNVS'))  return 'Forward-looking_infrared';
  if (name.includes('LORROS') || name.includes('MSIS') || name.includes('COMPASS') || name.includes('VAMPIR'))
    return 'Forward-looking_infrared';
  if (name.includes('Vigy'))     return 'Electro-optical_targeting_system';
  if (name.includes('Najir') || name.includes('Panda') || name.includes('LSEOS')) return 'Electro-optical_targeting_system';
  if (name.includes('Safire') || name.includes('BRITE') || name.includes('Toplite') || name.includes('Star ')) return 'Forward-looking_infrared';
  if (name.includes('Strix') || name.includes('Viviane') || name.includes('Osiris')) return 'Forward-looking_infrared';
  if (name.includes('Skyball') || name.includes('MX-1') || name.includes('MX-2'))  return 'Forward-looking_infrared';

  // ── Sea- prefixed systems ──────────────────────────────────────────────────
  if (name.startsWith('Sea '))    return 'Marine_radar';

  // ── Polish NUR- / SRN- series ──────────────────────────────────────────────
  if (name.startsWith('NUR-'))    return 'Marine_radar';
  if (name.startsWith('SRN-'))    return 'Marine_radar';
  if (name.startsWith('SHL-'))    return 'Active_sonar';

  // ── ENR/EN/ Spanish ────────────────────────────────────────────────────────
  if (name.startsWith('EN/'))     return 'Electronic_countermeasure';
  if (name.startsWith('ET/'))     return 'Electronic_intelligence';

  // ── Italian ELT- series ────────────────────────────────────────────────────
  if (name.startsWith('ELT-'))    return 'Electronic_countermeasure';

  // ── Australian/HELRAS/sonar ────────────────────────────────────────────────
  if (name.includes('HELRAS') || name.includes('ATAS'))   return 'Dipping_sonar';
  if (name.includes('Kariwara') || name.includes('Mulloka') || name.includes('MicroPUFFS')) return 'Passive_sonar';
  if (name.includes('Toadfish') || name.includes('Spira')) return 'Sonar';

  // ── RASIT / ground surveillance ────────────────────────────────────────────
  if (name.includes('RASIT') || name.includes('DDMT'))    return 'Doppler_radar';

  // ── Iranian systems ───────────────────────────────────────────────────────
  if (name.includes('Ghadir') || name.includes('Sepehr')) return 'Over-the-horizon_radar';

  // ── HF/DF by suffix ───────────────────────────────────────────────────────
  if (name.includes(' HF') || name.includes(' DF') || name.includes('HF/DF')) return 'Direction_finding';

  // ── Remaining acronym-heavy systems ────────────────────────────────────────
  if (name.startsWith('IPD-') || name.startsWith('IN '))  return 'Sonar';
  if (name.startsWith('KEVA') || name.startsWith('ERWE') || name.startsWith('ARWE')) return 'Electronic_intelligence';
  if (name.startsWith('RAT-') || name.startsWith('GM ') || name.startsWith('TRM-') || name.startsWith('SQ-3D') || name.startsWith('CONTROLMaster')) return 'Phased_array_radar';
  if (name.startsWith('TACDES'))  return 'Electronic_intelligence';
  if (name.startsWith('RV-'))     return 'Doppler_radar';
  if (name.startsWith('HR-') || name.startsWith('LRR'))   return 'Fire-control_radar';
  if (name.startsWith('THD') || name.startsWith('RTS'))    return 'Marine_radar';
  if (name.startsWith('GLOBUS'))  return 'BMEWS';
  if (name.startsWith('Voronezh'))return 'PAVE_PAWS';
  if (name.startsWith('SIASS'))   return 'Sonar';
  if (name.startsWith('AWARE'))   return 'Radar_warning_receiver';
  if (name.startsWith('LWS-') || name.startsWith('MAW-')) return 'Missile_approach_warning_system';
  if (name.startsWith('DDM'))     return 'Missile_approach_warning_system';
  if (name.startsWith('SS') && /^SS\d/.test(name))  return 'Sonar';
  if (name.startsWith('ST') && /^ST\d/.test(name))  return 'Sonar';

  // ── Absolute fallback ─────────────────────────────────────────────────────
  if (name.includes('ORB '))       return 'Phased_array_radar';
  if (name.includes('RDY') || name.includes('RDM') || name.includes('RDI')) return 'Pulse-Doppler_radar';
  if (name.includes('AMES'))       return 'Over-the-horizon_radar';
  if (name.includes('Chang Feng')) return 'Electronic_countermeasure';
  if (name.includes('NS-90') || name.includes('NS '))  return 'Electronic_countermeasure';
  if (name.includes('AR-') || name.includes('ARS-'))   return 'Electronic_intelligence';
  if (name.includes('ALR-'))       return 'Radar_warning_receiver';
  if (name.includes('PAK-FA'))     return 'Active_electronically_scanned_array';
  if (name.includes('Collector') || name.includes('Mentor') || name.includes('Vigil')) return 'Electronic_intelligence';
  if (name.includes('Watchman') || name.includes('Lanza') || name.includes('Master')) return 'Phased_array_radar';
  if (name.includes('Variant') || name.includes('Sceptre') || name.includes('Manta') || name.includes('Cygnus')) return 'Sonar';
  if (name.includes('Challenger') || name.includes('Pathfinder'))  return 'Marine_radar';
  if (name.includes('Guardian') || name.includes('Sky '))   return 'Marine_radar';
  if (name.includes('Aida'))       return 'Doppler_radar';
  if (name.includes('Alligator') || name.includes('Colibri') || name.includes('Serval') || name.includes('Rattler')) return 'Forward-looking_infrared';
  if (name.includes('Hermes') || name.includes('Tarang') || name.includes('Sanket')) return 'Radar_warning_receiver';
  if (name.includes('Sherloc') || name.includes('Shiploc')) return 'Electronic_intelligence';
  if (name.includes('Scorpion') || name.includes('Dagger') || name.includes('Scimitar') || name.includes('Saber'))  return 'Marine_radar';
  if (name.includes('Olympic') || name.includes('Kingfisher') || name.includes('Osprey'))  return 'Electro-optical_targeting_system';
  if (name.includes('Lynx') || name.includes('Pilot') || name.includes('Kestrel') || name.includes('Arrowhead')) return 'Fire-control_radar';
  if (name.includes('SLAR'))       return 'Synthetic-aperture_radar';
  if (name.includes('ARI.'))       return 'Electronic_intelligence';
  if (name.includes('C-Pearl') || name.includes('C-Lite')) return 'Electronic_intelligence';
  if (name.includes('Terma'))      return 'Marine_radar';
  if (name.includes('Matild'))     return 'Marine_radar';
  if (name.includes('Telephonics') || name.includes('Westinghouse') || name.includes('Raytheon')) return 'Raytheon';
  if (name.includes('Galileo'))    return 'Electro-optical_targeting_system';
  if (name.includes('Kollmorgen') || name.includes('Perch'))  return 'Periscope';
  if (name.includes('CRM-') || name.includes('LMT-') || name.includes('MPDR')) return 'Doppler_radar';
  if (name.includes('Kivach'))     return 'Electronic_intelligence';
  if (name.includes('Avtomat') || name.includes('Prim'))     return 'Electronic_countermeasure';
  if (name.includes('PAE-') || name.includes('PAJ-'))        return 'Electronic_countermeasure';
  if (name.includes('RAMSES') || name.includes('CARAPACE'))  return 'Electronic_countermeasure';
  if (name.includes('MW.08'))      return 'Doppler_radar';
  if (name.includes('S.1850'))     return 'Phased_array_radar';
  if (name.includes('CEA-'))       return 'Active_electronically_scanned_array';
  if (name.includes('Arabel'))     return 'Fire-control_radar';
  if (name.includes('Senit'))      return 'Combat_information_center';
  if (name.includes('ZW.') || name.includes('ZW0'))  return 'Marine_radar';

  // Type XX remaining (not caught by China/UK blocks)
  if (name.startsWith('Type '))    return 'Doppler_radar';

  // Sensor group / Mk designations
  if (name.startsWith('Mk'))      return 'Fire-control_radar';

  // ── Last-resort specifics ────────────────────────────────────────────────
  if (name.includes('ARIES'))     return 'Electronic_intelligence';
  if (name.includes('ARUR'))      return 'Electronic_intelligence';
  if (name.includes('CAPTOR'))    return 'Active_electronically_scanned_array';
  if (name.includes('EOTS'))      return 'Electro-optical_targeting_system';
  if (name.includes('NITE') || name.includes('Nightsun')) return 'Night_vision';
  if (name.includes('CS/'))       return 'Fire-control_radar';
  if (name.includes('CWE '))      return 'Electronic_countermeasure';
  if (name.includes('FAS '))      return 'Active_sonar';
  if (name.includes('FMS '))      return 'Fire-control_radar';
  if (name.includes('GRL '))      return 'Doppler_radar';
  if (name.includes('DUUV'))      return 'Variable_depth_sonar';
  if (name.includes('ELAC'))      return 'Active_sonar';
  if (name.includes('ASA '))      return 'Towed_array_sonar';
  if (name.includes('ATBF'))      return 'Forward-looking_infrared';
  if (name.includes('ASTAC'))     return 'Electronic_intelligence';
  if (name.includes('ARCANA'))    return 'Electronic_intelligence';
  if (name.includes('BU/'))       return 'Doppler_radar';
  if (name.includes('DR '))       return 'Electronic_intelligence';
  if (name.includes('ACTAS'))     return 'Towed_array_sonar';
  if (name.includes('MAS '))      return 'Active_sonar';
  if (name.includes('LOPAS'))     return 'Passive_sonar';
  if (name.includes('RPS-'))      return 'Phased_array_radar';
  if (name.includes('PMS '))      return 'Marine_radar';
  if (name.includes('HADR') || name.includes('HARD')) return 'Doppler_radar';
  if (name.includes('MV.') || name.includes('M.2') || name.includes('M.4')) return 'Fire-control_radar';
  if (name.includes('SIMONE') || name.includes('SATEPS') || name.includes('SEACLEAR') || name.includes('OSF')) return 'Infrared_search_and_track';
  if (name.includes('WBA') || name.includes('WBG') || name.includes('WBR'))  return 'Electronic_intelligence';
  if (name.includes('NRBA') || name.includes('TACAN') || name.includes('URDT')) return 'Radar_navigation';
  if (name.includes('Raypath'))    return 'Sonar';
  if (name.includes('M1H') || name.includes('QHB') || name.includes('QCU-')) return 'Active_sonar';
  if (name.includes('Agrion') || name.includes('Cameleon') || name.includes('VELOX')) return 'Electronic_intelligence';
  if (name.includes('RBE-') || name.includes('RCM-'))   return 'Pulse-Doppler_radar';
  if (name.includes('Shrike') || name.includes('EWPS')) return 'Radar_warning_receiver';
  if (name.includes('Sphynx') || name.includes('Sphinx')) return 'Electronic_intelligence';
  if (name.includes('Solarsub') || name.includes('CHMS') || name.includes('HMS-12')) return 'Sonar';
  if (name.includes('CTS-') || name.includes('RALM'))   return 'Radar_navigation';
  if (name.includes('TWE') || name.includes('TFR'))      return 'Terrain-following_radar';
  if (name.includes('MMSR') || name.includes('NASAAR'))  return 'Active_electronically_scanned_array';
  if (name.includes('SDD') || name.includes('KRTP'))     return 'Electronic_intelligence';
  if (name.includes('TSR ') || name.includes('TVT'))     return 'Electro-optical_targeting_system';
  if (name.includes('Vera'))       return 'Kolchuga_passive_sensor';
  if (name.includes('PDE-') || name.includes('PHS-') || name.includes('PSM-')) return 'Marine_radar';
  if (name.includes('GE-'))        return 'Doppler_radar';
  if (name.includes('PAL-') || name.includes('Paltus'))  return 'Sonar';
  if (name.includes('EWR-'))       return 'Electronic_intelligence';
  if (name.includes('Pelena'))     return 'Electronic_countermeasure';
  if (name.includes('H2S'))        return 'Doppler_radar';
  if (name.includes('ECKO'))       return 'Doppler_radar';
  if (name.includes('HIRNS') || name.includes('ASIP'))   return 'Radar_navigation';
  if (name.includes('ISO ') || name.includes('S-6') || name.includes('S-7') || name.includes('S-8') || name.includes('S-2'))  return 'Direction_finding';
  if (name.includes('Lira') || name.includes('Himalayas') || name.includes('Vinyetka')) return 'Sonar';
  if (name.includes('BOW-') || name.includes('G24') || name.includes('MD-') || name.includes('M5')) return 'Active_sonar';
  if (name.includes('LN-'))        return 'Marine_radar';
  if (name.includes('HC-') || name.includes('W-1') || name.includes('DB20')) return 'Marine_radar';
  if (name.includes('OR-'))        return 'Marine_radar';
  if (name.includes('Score') || name.includes('Janet') || name.includes('Farad') || name.includes('Gage') || name.includes('LAADS')) return 'Doppler_radar';
  if (name.includes('Oceanic') || name.includes('Wesmar') || name.includes('SeaBeam')) return 'Sonar';
  if (name.includes('DTA-'))       return 'Active_sonar';
  if (name.includes('DDSX'))       return 'Active_sonar';
  if (name.includes('SSAM') || name.includes('TICM') || name.includes('SLIR') || name.includes('SG200') || name.includes('R84')) return 'Marine_radar';
  if (name.includes('DORNA'))      return 'Electro-optical_targeting_system';
  if (name.includes('SA '))        return 'Active_sonar';
  if (name.includes('WF-'))        return 'Electro-optical_targeting_system';

  // Remaining unmapped with any letter-dash-number pattern → generic radar
  if (/^[A-Z]{1,4}[-/]?\d/.test(name)) return 'Doppler_radar';
  if (/^\d/.test(name))            return 'Doppler_radar';
  // Remaining words (NATO names etc)
  if (/^[A-Z][a-z]/.test(name))   return 'Marine_radar';
  // All caps remaining
  if (/^[A-Z]/.test(name))        return 'Combat_information_center';

  return null;
}

// ─── Build the map ────────────────────────────────────────────────────────────
const imageMap = {};
const cats = ['aircraft','ships','weapons','sensors','infantry','armor','artillery','airdefense','radar'];
for (const c of cats) imageMap[c] = {};

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
console.log(`Mapped: ${mapped}, Skipped: ${skipped}`);
Object.entries(imageMap).forEach(([cat, m]) => {
  console.log(`  ${cat}: ${Object.keys(m).length}`);
});
