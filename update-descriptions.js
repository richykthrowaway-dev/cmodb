#!/usr/bin/env node
/**
 * Update all unit descriptions across data files.
 * Descriptions should be short (1 line) and differentiate between variants.
 */
const fs = require('fs');
const path = require('path');

// ─── AIRCRAFT DESCRIPTIONS ────────────────────────────────────────
const aircraftDesc = {
  1: "Original analog-cockpit CAS variant with GAU-8/A 30mm cannon",
  2: "Digitized cockpit upgrade with precision GPS/laser-guided munitions",
  3: "Light counterinsurgency attack jet, converted T-37 trainer",
  4: "Marine single-seat light attack with improved avionics and J52 engine",
  5: "SWIP-upgraded all-weather carrier attack jet with Harpoon capability",
  6: "Early Navy light attack variant with TF30-P-6 engine",
  7: "Air Force variant with LANA navigation upgrade and M61 cannon",
  8: "Primary Navy light attack variant with TF41 engine",
  9: "Two-seat Air Force trainer variant with LANA navigation upgrade",
  10: "First-gen AC-130 gunship with Pave Pronto sensor/weapon upgrades",
  11: "Second-gen gunship with 105mm howitzer, 40mm Bofors, and 25mm GAU-12",
  12: "Latest gunship on MC-130J airframe with precision standoff weapons",
  13: "Third-gen gunship with all-weather synthetic aperture radar",
  14: "Modified MC-130W with Griffin, Viper Strike, and SDB munitions",
  15: "Modernized Cobra with TOW, 20mm cannon, and upgraded fire control",
  16: "Twin-engine Marine attack helo, first with TOW missile capability",
  17: "Interim Cobra upgrade with flat-plate canopy and improved TOW system",
  18: "Improved Sea Cobra with T700 engine and TOW capability",
  19: "Ultimate twin-Cobra with Hellfire, Sidewinder, and Sidearm missiles",
  20: "Four-blade rotor, new target sight, Hellfire/AIM-9X capable",
  21: "Original Apache with TADS/PNVS and Hellfire/rockets",
  22: "Longbow radar-equipped Apache with fire-and-forget Hellfire capability",
  23: "Latest Apache with more powerful T700-GE-701D engines and Link 16",
  24: "SpecOps light attack helo, counterpart to OH-6A Cayuse",
  25: "SpecOps variant corresponding to MH-6E transport Little Bird",
  26: "Updated SpecOps light attack with improved avionics",
  27: "SpecOps attack variant, armed counterpart to MH-6J",
  28: "Mission Enhanced Little Bird with modular weapons and sensors",
  29: "Boeing 747-based anti-ballistic-missile directed energy testbed",
  30: "Tethered aerostat carrying AN/TPS-63 surveillance radar",
  31: "First-gen USMC VSTOL jet, limited avionics and weapon pylons",
  32: "Upgraded Harrier with APG-65 radar and AIM-120 AMRAAM",
  33: "Refurbished AV-8A with improved engine and extended fatigue life",
  34: "Supersonic swing-wing heavy bomber with integrated battle station",
  35: "Stealth flying-wing bomber, Block 30 with B61-12 nuclear capability",
  36: "Vietnam-era conventional bombing variant of the B-52",
  37: "Multi-role B-52 with Harpoon anti-ship and ALCM nuclear capability",
  38: "Current B-52 with CRL Phase 1.2 avionics and conventional/nuclear flex",
  39: "Subsonic target drone for ship/air defense gunnery practice",
  40: "Extended-range Chukar III drone variant",
  41: "Latest Chukar III variant with improved flight performance",
  42: "Early tactical airlift Hercules, shorter range than H model",
  43: "Standard tactical airlifter with improved T56-A-15 turboprops",
  44: "Super Hercules with Rolls-Royce AE 2100D3 engines and glass cockpit",
  45: "Original strategic airlifter with limited cargo capacity",
  46: "Stretched Starlifter for special operations low-level airlift",
  47: "Final Starlifter upgrade with glass cockpit and AMP avionics",
  48: "Strategic/tactical airlifter configured for special operations",
  49: "VIP transport variant based on Boeing 727-200",
  50: "Carrier onboard delivery aircraft, remanufactured with new wings",
  51: "VIP transport based on Boeing 757-200, Air Force Two role",
  52: "SpecOps VIP transport with enhanced communications",
  53: "Navy fleet logistics support based on Boeing 737-700C",
  54: "Air Force VIP transport with C4ISR communications suite",
  55: "Congressional/executive transport version of the 737-700C",
  56: "Original heavy strategic airlift Galaxy with TF39 engines",
  57: "Improved production Galaxy with upgraded TF39 engines and wing",
  58: "Re-engined Galaxy with CF6-80C2 engines and modern glass cockpit",
  59: "Air Force aeromedical evacuation variant of DC-9-30",
  60: "Navy fleet logistics transport based on DC-9-30",
  61: "Special air mission VIP transport, former VC-9C",
  62: "Medium-lift Marine transport helo, early D variant",
  63: "Upgraded Sea Knight with improved crashworthiness and avionics",
  64: "Final Sea Knight production variant with minor improvements",
  65: "Early Chinook with T55-L-7C engines, limited payload",
  66: "Upgraded heavy-lift helo with T55-L-712 engines and fiberglass blades",
  67: "Latest Chinook with digital cockpit, more powerful T55-GA-714A engines",
  68: "Marine heavy-lift helo with two T64-GE-413 engines",
  69: "Three-engine heavy-lift, largest Western military helicopter",
  70: "Next-gen heavy-lift with fly-by-wire, composite airframe, 36,000 lb payload",
  71: "Navy carrier-onboard-delivery Osprey replacing C-2A Greyhound",
  72: "Air Force special operations tiltrotor with terrain-following radar",
  73: "Carrier AEW aircraft with ADS-18 radar, 21 aircraft fleet",
  74: "Advanced Hawkeye with AN/APY-9 radar and aerial refueling capability",
  75: "Original AWACS with Westinghouse APY-1 look-down radar",
  76: "AWACS with RSIP radar upgrade for improved detection, 24 aircraft",
  77: "Further upgraded Sentry with RSIP, 9 aircraft fleet",
  78: "Latest AWACS with upgraded mission computing and displays",
  79: "National Airborne Operations Center on Boeing 747 platform",
  80: "TACAMO airborne nuclear communications relay, first variant",
  81: "Upgraded Mercury with dual TACAMO and ABNCP capability",
  82: "Prototype Joint STARS ground surveillance aircraft",
  83: "Production Joint STARS with AN/APY-7 ground moving-target radar",
  84: "Electronic attack Super Hornet with Next Generation Jammer pods",
  85: "Electronic warfare Skywarrior, Cold War-era carrier EW platform",
  86: "Refurbished EA-6A with improved electronic countermeasures",
  87: "Final Prowler with ICAP III wideband jamming and HARM targeting",
  88: "Airborne psychological operations broadcast platform on C-130E",
  89: "TACAMO airborne VLF communications relay for nuclear C3",
  90: "Airborne electronic attack and communications jamming platform",
  91: "Latest Commando Solo on C-130J with improved broadcast capability",
  92: "Navy TACAMO communications relay on C-130Q airframe",
  93: "Supersonic electronic warfare jet with ALQ-99 jamming system",
  94: "UH-60 based electronic intelligence and jamming helicopter",
  95: "Airborne Reconnaissance Low COMINT platform, 2 aircraft",
  96: "ARL multi-intelligence variant configured for South Korea mission",
  97: "Signals intelligence aircraft with comprehensive ELINT/COMINT suite",
  98: "Carrier-based ELINT aircraft derived from S-3 Viking",
  99: "Supersonic interceptor with Hughes MG-13 fire control system",
  100: "Two-seat trainer/combat variant of the F-101B Voodoo",
  101: "Wild Weasel SEAD variant of the Thunderchief with AGM-45 Shrike",
  102: "Mach 2+ delta-wing interceptor with MA-1 weapons control system",
  103: "Original F-111 with TF30-P-3 engines and Mk I avionics",
  104: "Advanced avionics variant with Mk II digital system, limited success",
  105: "Simplified avionics variant with improved TF30-P-100 engines",
  106: "Best F-111 variant with Pave Tack targeting pod and GBU-15",
  107: "First operational stealth aircraft, faceted low-observable design",
  108: "Original fleet defense Tomcat with LANTIRN precision strike added",
  109: "Re-engined Tomcat with F110-GE-400 engines and LANTIRN",
  110: "Ultimate Tomcat with APG-71 radar, F110 engines, and LANTIRN",
  111: "Original lightweight Eagle air superiority fighter",
  112: "Definitive Eagle with AN/APG-63(V)3 AESA radar upgrade",
  113: "Dual-role Strike Eagle with AN/APG-82 AESA and SDB-II",
  114: "Air defense variant of the F-16A with improved radar modes",
  115: "Block 30 multi-role Falcon, typically flown by reserve units",
  116: "Block 40 night-attack Falcon with LANTIRN and MMC computers",
  117: "Block 50 SEAD/DEAD Falcon with HARM Targeting System",
  118: "Have Glass signature-reduced Block 50 with reduced RCS and IR",
  119: "Aggressor F-16 with GE F110 engine, used for adversary training",
  120: "Fifth-gen stealth air dominance fighter with supercruise capability",
  121: "CTOL stealth fighter for USAF with 6x AMRAAM internal capacity",
  122: "STOVL stealth variant for Marines with lift fan and SDB-II",
  123: "Carrier-variant stealth fighter for USN with larger wings and range",
  124: "Early USAF tactical fighter with pulse radar and Sparrow capability",
  125: "Improved F-4 with APQ-109 radar and precision bombing avionics",
  126: "Multi-role variant with internal M61 cannon and leading-edge slats",
  127: "Advanced Wild Weasel SEAD variant with APR-38 threat detection",
  128: "Navy fleet defense variant with AWG-10 pulse-Doppler radar",
  129: "Rebuilt F-4B with SLAT wing and improved radar reliability",
  130: "Final Navy Phantom with smokeless J79-GE-10B engines and VTAS helmet",
  131: "Lightweight aggressor/dissimilar air combat training fighter",
  132: "Two-seat trainer variant of the F-5E Tiger II",
  133: "Upgraded Hornet with AIM-120D capability, Marine operated",
  134: "Night-attack Hornet with FLIR and AIM-120D, single-seat",
  135: "Two-seat all-weather Hornet with Litening AT targeting pod",
  136: "Single-seat Super Hornet with SDB-II and LRASM capability",
  137: "Two-seat Super Hornet with SDB-II, LRASM, and crew WSO",
  138: "Strategic nuclear bomber variant of F-111 with SRAM missiles",
  139: "Hand-launched miniature surveillance UAV for squad-level recon",
  140: "Search and rescue Hercules for Combat SAR support",
  141: "Combat rescue variant on Super Hercules with advanced sensors",
  142: "Stretched Combat King for extended-range CSAR operations",
  143: "USCG medium-range maritime patrol based on CN-235",
  144: "Combat rescue helicopter with terrain-following radar, 98 built",
  145: "Navy CSAR and special warfare helicopter from SH-60 platform",
  146: "Coast Guard medium-range recovery helicopter",
  147: "Next-gen USAF combat rescue helo replacing HH-60G",
  148: "USCG short-range recovery helicopter based on AS365 Dauphin",
  149: "USCG medium-range surveillance jet based on Falcon 20",
  150: "Guardian variant with Aireye oil spill detection sensors",
  151: "Night-capable Guardian with AN/APG-66 and FLIR sensors",
  152: "Guardian variant with side-looking airborne radar",
  153: "Carrier-based aerial tanker variant of A-3 Skywarrior",
  154: "Carrier-based buddy tanker variant of A-6 Intruder",
  155: "Widebody tanker/cargo based on DC-10, dual-role capability",
  156: "Original Marine aerial refueling Hercules",
  157: "Super Hercules tanker with Griffin and Hellfire capability",
  158: "Improved Marine tanker with increased fuel capacity",
  159: "Reserve Marine tanker with enhanced avionics",
  160: "Original Stratotanker with water-injected J57 engines",
  161: "Re-engined tanker with commercial TF33 turbofan engines",
  162: "Special tanker for SR-71 Blackbird JP-7 fuel",
  163: "Definitive re-engined tanker with CFM56 high-bypass turbofans",
  164: "Special fuel tanker variant based on KC-135R",
  165: "Next-gen tanker based on Boeing 767-200ER platform",
  166: "ISR turboprop based on King Air 350ER with full-motion video",
  167: "First-gen special operations low-level infiltration aircraft",
  168: "Improved Combat Talon with terrain-following/avoidance radar",
  169: "Latest SOF transport on Super Hercules, replaces Combat Shadow",
  170: "SOF helicopter aerial refueling tanker, ex-HC-130 variants",
  171: "Transitional SOF C-130W upgraded to Dragon Spear/AC-130W",
  172: "SpecOps Chinook with terrain-following radar for night infiltration",
  173: "Advanced SpecOps Chinook with in-flight refueling probe",
  174: "Latest SpecOps Chinook with digital avionics and AAR capability",
  175: "Mine countermeasures variant of CH-53E with AN/AQS-24B tow body",
  176: "SpecOps heavy-lift with Pave Low III night/adverse weather avionics",
  177: "Early SpecOps Blackhawk conversion, nicknamed Velcro Hawk",
  178: "SpecOps Pave Hawk with FLIR, terrain-following, and AAR probe",
  179: "Purpose-built SpecOps Blackhawk with extensive EW and nav suite",
  180: "Direct Action Penetrator with rocket pods, Hellfire, and 30mm gun",
  181: "Latest SpecOps Blackhawk with digital glass cockpit and FLIR",
  182: "Multi-mission naval helicopter with dipping sonar and torpedoes",
  183: "Multi-mission Navy helo for VERTREP, SAR, and mine countermeasures",
  184: "Stealth-modified Blackhawk used in the Bin Laden raid",
  185: "USCG armed interdiction helo based on Agusta A109E Power",
  186: "SpecOps transport Little Bird, counterpart to OH-6A",
  187: "SpecOps transport variant of MD 500 helicopter",
  188: "Updated SpecOps transport with improved avionics",
  189: "SpecOps transport, counterpart to armed AH-6J variant",
  190: "Latest SpecOps transport Little Bird with MELB upgrades",
  191: "Armed Predator with Hellfire missiles for persistent strike ISR",
  192: "Army UAS with extended endurance and Hellfire strike capability",
  193: "Carrier-based unmanned tanker/ISR, evolved from X-47B",
  194: "Navy persistent maritime surveillance UAV based on Global Hawk",
  195: "Medium-altitude ISR UAV with limited weapon capability",
  196: "Improved Hunter with increased payload and endurance",
  197: "Ship-based rotary VTUAV with laser designator and weapons",
  198: "Extended-range Reaper Block 5 with 40+ hour endurance",
  199: "Older subsonic aerial target drone for fleet training",
  200: "Marine tiltrotor replacing CH-46, with tanker modification",
  201: "Twin-boom light observation and FAC aircraft, Vietnam era",
  202: "Single airborne reconnaissance platform, lost in crash",
  203: "Forward air control variant of A-10A, same airframe",
  204: "Forward air control variant of A-10C with digital avionics",
  205: "Original light observation helo with simple avionics",
  206: "Improved Kiowa with flat-plate canopy and upgraded engine",
  207: "Armed scout with mast-mounted sight, Hellfire, and Stinger",
  208: "Light observation helo, basis for MH-6B and AH-6C SpecOps variants",
  209: "Twin-turboprop light armed reconnaissance and FAC aircraft",
  210: "Night observation Bronco with FLIR and improved weapons",
  211: "Multi-sensor Army battlefield surveillance turboprop",
  212: "Orion modified with rotodome for airborne early warning role",
  213: "Mid-life upgraded Orion with acoustic improvements and Harpoon",
  214: "Boeing 737-based maritime patrol with advanced sonobuoy processing",
  215: "Supersonic carrier-based reconnaissance jet, Mach 2 capable",
  216: "Guardrail V SIGINT platform on RC-12 King Air airframe",
  217: "Guardrail Common Sensor Minus 3, reduced capability SIGINT",
  218: "Guardrail Common Sensor System 4 with enhanced intercept",
  219: "Guardrail Common Sensor System 1, first unified SIGINT suite",
  220: "Guardrail Common Sensor System 2 with improved geolocation",
  221: "Latest Guardrail with comprehensive multi-INT sensor suite",
  222: "Optical and ELINT collection aircraft for ballistic missile observation",
  223: "ELINT aircraft mapping hostile radar emitter characteristics",
  224: "Primary SIGINT aircraft with comprehensive COMINT/ELINT suite",
  225: "Complementary Rivet Joint with additional SIGINT capabilities",
  226: "Single airframe with optical/IR sensors for missile tracking",
  227: "Tactical photo-reconnaissance Phantom with multi-sensor nose",
  228: "Photo-recon Crusader with cameras replacing guns",
  229: "Minesweeping variant of CH-53D Sea Stallion, 30 built",
  230: "Stealthy flying-wing reconnaissance UAV for denied airspace",
  231: "Classified stealth long-endurance ISR UAV, larger than RQ-170",
  232: "Original unarmed Predator for persistent surveillance",
  233: "Improved Predator with satellite comms and extended endurance",
  234: "Small tactical UAS for Marine battalion-level ISR",
  235: "Ship-launched reconnaissance UAV used from Iowa-class BBs",
  236: "First-gen Global Hawk Block 10 with EO/IR and SAR sensors",
  237: "Block 40 Global Hawk with Multi-Platform Radar Technology",
  238: "Dual-payload tactical UAV, redesignated from BQM-155A",
  239: "Original Shadow tactical UAS for brigade-level surveillance",
  240: "Improved Shadow with increased endurance and reliability",
  241: "Electronic warfare/ELINT variant of OV-1 Mohawk",
  242: "Original carrier-based ASW jet with MAD and torpedoes",
  243: "Upgraded Viking with Harpoon, FLIR, and LANTIRN compatibility",
  244: "Gulf War-modified LAMPS helo with Magic Lantern mine detection",
  245: "Final Seasprite variant, 24 reserve aircraft",
  246: "Medium ASW helicopter with dipping sonar",
  247: "Multi-mission Sea King with ASW, AEW, and cargo capability",
  248: "LAMPS III ASW helo with surface search radar and sonobuoys",
  249: "Inner-zone carrier ASW helo with dipping sonar",
  250: "Mach 3+ strategic reconnaissance aircraft with ELINT sensors",
  251: "Two-seat aggressor trainer variant of F-16N",
  252: "Tethered aerostat platform for additional sensor payloads",
  253: "High-altitude surveillance variant of U-2, later redesignated U-2R",
  254: "ISR/SOF support aircraft based on Pilatus PC-12",
  255: "High-altitude reconnaissance platform with interchangeable sensor nose",
  256: "Current U-2 with F118-GE-101 engine and ASARS-2A radar",
  257: "Marine utility helo based on Bell 205, Vietnam era",
  258: "Army utility helicopter, workhorse of Vietnam War",
  259: "Twin-engine Huey based on Bell 212, base security and VIP transport",
  260: "Four-blade upgraded Huey with T700 engines, paired with AH-1Z",
  261: "Early Sea Knight for vertical replenishment and utility, 14 built",
  262: "Improved VERTREP Sea Knight with upgraded avionics",
  263: "Original Blackhawk utility helicopter with T700-GE-700 engines",
  264: "More powerful Blackhawk with T700-GE-701C and external stores pylons",
  265: "Latest Blackhawk with digital glass cockpit and improved survivability",
  266: "Medevac Blackhawk with medical interior, also designated HH-60L",
  267: "Light utility helo based on EC145, domestic training and logistics only",
  268: "Presidential transport based on Boeing 747-200B, 2 aircraft",
};

// ─── SHIPS DESCRIPTIONS ───────────────────────────────────────────
const shipsDesc = {
  1: "95-ft Cape-class patrol boat for coastal surveillance",
  2: "Cape-class patrol boat, mid-series hull",
  3: "Cape-class patrol boat, later series hull",
  4: "Suribachi-class ammunition ship, early underway replenishment",
  5: "Nitro-class ammunition ship for fleet stores transfer",
  6: "Kilauea-class ammunition ship, later transferred to USNS",
  7: "Kilauea-class, transferred to Military Sealift Command as T-AE",
  8: "Mars-class combat stores ship for underway resupply",
  9: "Converted LPD-15 as afloat staging base with experimental laser weapon",
  10: "Converted LPD as command flagship, Austin-class hull",
  11: "Raleigh-class converted to command flagship",
  12: "Mispillion-class fleet oiler, Jumboised T3 tanker hull",
  13: "Cimarron-class fleet oiler with Navy crew",
  14: "Jumboised T3-S2-A3 fleet oiler, long-serving replenishment ship",
  15: "Fast combat support ship combining AO, AE, and AFS roles",
  16: "Supply-class fast combat support, transferred to MSC",
  17: "Last Supply-class built with improved cargo handling systems",
  18: "Wichita-class replenishment oiler combining AO and AFS roles",
  19: "Submarine tender providing repair and resupply services",
  20: "Iowa-class battleship with 9×16-inch guns and Harpoon/Tomahawk",
  21: "Iowa-class reactivated in 1982 with modern missile systems",
  22: "Iowa-class battleship, site of Japanese surrender in WWII",
  23: "Iowa-class, last battleship reactivated, served in Gulf War",
  24: "Albany-class guided missile cruiser, converted heavy cruiser hull",
  25: "Leahy-class double-ended missile cruiser with NTU upgrade",
  26: "Belknap-class guided missile cruiser, single-arm Mk10 launcher",
  27: "Belknap-class with New Threat Upgrade for improved air defense",
  28: "First Ticonderoga CG with Mk26 twin-arm launchers",
  29: "Early Ticonderoga with Mk26 launchers, Vincennes Incident ship",
  30: "First VLS-equipped Ticonderoga with 122-cell Mk41 system",
  31: "Baseline 2 Ticonderoga cruiser with improved AEGIS displays",
  32: "Baseline 3 Ticonderoga with UYQ-21 displays",
  33: "Ticonderoga with SM-3 Block IIA ballistic missile defense",
  34: "Ticonderoga with SM-3 Block IIA BMD capability",
  35: "Ticonderoga missile defense cruiser, key BMD test ship",
  36: "Nuclear-powered guided missile cruiser, first surface nuclear combatant",
  37: "Nuclear cruiser with both ASROC and Terrier missile systems",
  38: "California-class nuclear cruiser with NTU Tartar/Standard upgrade",
  39: "Virginia-class nuclear cruiser with Semi-NTU weapons update",
  40: "First nuclear-powered surface warship, Long Beach cruiser",
  41: "Midway-class carrier, final conventional CV, served until 1992",
  42: "Midway-class carrier Coral Sea, oldest active CV in 1980s",
  43: "First supercarrier with armored flight deck and angled deck",
  44: "Forrestal-class supercarrier with improved angled deck",
  45: "Forrestal-class carrier, Pacific Fleet workhorse",
  46: "Forrestal-class carrier with updated electronics",
  47: "Kitty Hawk-class improved Forrestal with better elevator layout",
  48: "Kitty Hawk-class carrier with revised island structure",
  49: "Kitty Hawk-class with further improved combat systems",
  50: "Last conventional carrier built, one-off improved Kitty Hawk",
  51: "First nuclear-powered carrier, 8 reactors, one-of-a-kind",
  52: "Lead Nimitz-class nuclear carrier with anti-torpedo torpedo system",
  53: "Second Nimitz-class, improved reactor plant",
  54: "Nimitz-class with upgraded CVIC intelligence center",
  55: "Nimitz-class incorporating lessons from Nimitz and Vinson",
  56: "Nimitz-class with improved hull compartmentation",
  57: "Nimitz-class carrier with mid-life refueling completed",
  58: "Nimitz-class with improved nuclear fuel core",
  59: "Nimitz-class with enhanced self-defense suite",
  60: "Nimitz-class forward-deployed to Japan",
  61: "Final Nimitz-class with bulbous bow and improved island",
  62: "Lead Ford-class with EMALS catapults and AAG arresting gear",
  63: "Second Ford-class carrier under construction",
  64: "Third Ford-class carrier, named Enterprise",
  65: "Forrest Sherman-class Cold War gun destroyer",
  66: "Spruance-class ASW destroyer with gas turbine propulsion",
  67: "Stealth tumblehome hull destroyer with AGS 155mm guns",
  68: "Flight IIA Burke with helicopter hangar",
  69: "Flight IIA Burke with improved BMD capability",
  70: "Flight IIA Burke with single CIWS, SM-6 capable",
  71: "Latest Flight IIA Burke, exact weapons configuration evolving",
  72: "Charles F. Adams-class DDG with Tartar SAM system",
  73: "Lead ship of Adams-class guided missile destroyers",
  74: "Converted Forrest Sherman with Tartar missile system",
  75: "Farragut-class (Coontz) guided missile destroyer",
  76: "Farragut-class DDG serving as NTU test platform",
  77: "Lead Arleigh Burke-class Flight I with AEGIS BMD and SM-3",
  78: "Flight II Burke with SM-6 and enhanced BMD capability",
  79: "Flight IIA with 127mm/54 gun (pre-Mk45 Mod 4)",
  80: "First Burke with 127mm/62 Mk45 Mod 4 gun",
  81: "Flight IIA Burke with standard weapons suite",
  82: "Flight IIA with AN/WLD-1 Remote Minehunting System",
  83: "Flight IIA Burke with current-generation combat system",
  84: "Kidd-class modified Spruance with NTU air defense suite",
  85: "Spearhead-class expeditionary fast transport catamaran",
  86: "Lewis B. Puller-class expeditionary sea base",
  87: "Montford Point-class expeditionary transfer dock",
  88: "Garcia-class ocean escort with LAMPS helicopter capability",
  89: "Knox-class escort with Mk15 CIWS, towed sonar, and Harpoon",
  90: "Brooke-class guided missile frigate with Tartar SAM",
  91: "Perry-class frigate with SM-1MR launcher removed",
  92: "Perry-class guided missile frigate with SM-1MR and Harpoon",
  93: "Unmanned surface vehicle for LCS mine countermeasures",
  94: "High-speed catamaran for special operations and transport",
  95: "Air-cushion landing craft for amphibious assault, SLEP upgraded",
  96: "Blue Ridge-class amphibious command ship",
  97: "Landing craft mechanized for vehicle transport to shore",
  98: "Larger LCM for heavy vehicle transport",
  99: "Landing craft personnel, small troop transport boat",
  100: "Lead Freedom-class littoral combat ship, monohull",
  101: "Freedom-class LCS with improved combat systems",
  102: "Lead Independence-class LCS, trimaran hull",
  103: "1610-class utility landing craft, standard LCU",
  104: "Improved LCU with greater cargo capacity",
  105: "Further improved LCU variant",
  106: "Runnymede-class landing craft utility, 35 planned",
  107: "Landing craft vehicle/personnel for ship-to-shore transport",
  108: "Tarawa-class amphibious assault ship with well deck",
  109: "America-class LHA without well deck, aviation-optimized, hybrid drive",
  110: "Lead Wasp-class amphibious assault ship with well deck",
  111: "Second Wasp-class with improvements from lessons learned",
  112: "Final Wasp-class with hybrid electric/gas turbine drive",
  113: "Charleston-class amphibious cargo ship",
  114: "Raleigh-class amphibious transport dock",
  115: "San Antonio-class LPD with RAM Block II air defense",
  116: "Austin-class amphibious transport dock",
  117: "Iwo Jima-class amphibious assault helicopter carrier",
  118: "Thomaston-class dock landing ship, gun directors removed",
  119: "Anchorage-class dock landing ship for amphibious operations",
  120: "Whidbey Island-class LSD with 4 LCAC capacity",
  121: "Harpers Ferry-class LSD variant with increased cargo volume",
  122: "Newport-class tank landing ship with bow ramp, carries 3 LCVP",
  123: "Newport-class LST Frederick with standard LCVP/LCP complement",
  124: "Army logistics support vessel for intra-theater sealift",
  125: "Avenger-class mine countermeasures ship with ROVs and sonar",
  126: "Iwo Jima-class converted to mine countermeasures command ship",
  127: "Osprey-class coastal minehunter with AN/SLQ-48 ROV",
  128: "Aggressive-class ocean minesweeper with Gulf War modifications",
  129: "Acme-class minesweeper with Gulf War upgrades",
  130: "Special operations mothership converted from offshore support vessel",
  131: "Atlantic-based naval special warfare support barge",
  132: "Pacific-based naval special warfare support barge",
  133: "Cyclone-class coastal patrol with Griffin missile system",
  134: "Asheville-class patrol gunboat with 76mm gun",
  135: "Pegasus-class hydrofoil patrol combatant with Harpoon missiles",
  136: "Response Boat-Medium for USCG law enforcement, 57 planned",
  137: "Semi-submersible platform mounting AN/SPY-1 X-band radar for BMD",
  138: "Autonomous unmanned ASW surface vessel prototype",
  139: "MSC-operated Kilauea-class ammunition ship",
  140: "MSC-operated ammunition ship, ex-Navy AE 27",
  141: "MSC-operated Sirius-class combat stores ship",
  142: "Missile range instrumentation ship with Cobra Judy SIGINT radar",
  143: "Missile tracking ship with Cobra Gemini phased array radar",
  144: "Newest missile range ship with Cobra King S-band radar",
  145: "Stalwart-class ocean surveillance ship with SURTASS towed array",
  146: "Victorious-class SWATH ocean surveillance with SURTASS",
  147: "Impeccable-class SWATH surveillance with LFA active sonar",
  148: "Mercy-class hospital ship converted from supertanker",
  149: "Heavy-lift vessel for military cargo transport",
  150: "Victory-class cargo ship from Ready Reserve Force",
  151: "Northern Light-class military cargo vessel",
  152: "MPS-class maritime prepositioning cargo ship",
  153: "MPS vessel Sgt. Matej Kocak for prepositioned equipment",
  154: "MPS vessel for Marine brigade prepositioned sets",
  155: "Ex-commercial vessel acquired for military sealift",
  156: "Ex-commercial vessel for military transport augmentation",
  157: "Lewis and Clark-class dry cargo/ammunition ship for fleet resupply",
  158: "Cape I-class vehicle cargo ship in Ready Reserve Force",
  159: "Converted cargo ship Admiral Callaghan for vehicle/equipment sealift",
  160: "Cape T-class vehicle cargo ship in Ready Reserve Force",
  161: "Algol-class fast sealift ship with 33-knot capability",
  162: "Shughart-class large medium-speed roll-on/roll-off ship",
  163: "Gordon-class LMSR for rapid military vehicle transport",
  164: "Bob Hope-class LMSR with 380,000 sq ft vehicle capacity",
  165: "Watson-class LMSR, largest class of prepositioned ships",
  166: "Cape D-class Ready Reserve Force vehicle cargo ship",
  167: "Cape H-class RRF vehicle cargo ship",
  168: "Cape V-class Ready Reserve Force cargo ship",
  169: "Cape R-class Ready Reserve Force cargo vessel",
  170: "MSC-operated Neosho-class fleet oiler",
  171: "MSC-operated Columbia-class oiler",
  172: "Henry J. Kaiser-class fleet replenishment oiler",
  173: "MSC-operated Supply-class fast combat support ship",
  174: "Champion-class MSC tanker for fuel transport",
  175: "Sealift Pacific-class MSC coastal tanker",
  176: "Wright-class aviation logistics support ship",
  177: "11-meter RHIB for Naval Special Warfare operations",
  178: "7-meter standard Navy rigid-hull inflatable boat",
  179: "Mk1 combat craft medium for SOF coastal operations",
  180: "Mk3 Sea Spectre stealth patrol boat for special operations",
  181: "Mk5 high-speed special operations patrol boat, 50+ knots",
  182: "Mk6 patrol boat for riverine and coastal security",
  183: "Special Operations Craft-Riverine for brown-water missions",
  184: "SWCL Seafox patrol boat for NSW coastal operations",
  185: "Hamilton-class high-endurance Coast Guard cutter",
  186: "Ex-salvage tug converted to medium-endurance USCG cutter",
  187: "Reliance-class medium-endurance Coast Guard cutter",
  188: "Bear-class medium-endurance Coast Guard cutter",
  189: "National Security Cutter, most capable USCG ship",
  190: "Island-class 110-ft patrol boat, early hull",
  191: "Island-class patrol boat, mid-series",
  192: "Island-class patrol boat, later series",
  193: "82-ft Point-class Coast Guard patrol boat",
  194: "87-ft Marine Protector-class USCG coastal patrol, 73 built",
  195: "Sentinel-class fast response cutter replacing Island-class",
  196: "Remote-operated mine neutralization vehicle for MCM ships",
  197: "Remote minehunting system deployed from DDGs",
  198: "Boeing large autonomous underwater vehicle prototype",
  199: "Modified Bluefin-21 mine countermeasures UUV for LCS",
  200: "Remus 100-based mine hunting and disposal UUV",
  201: "Remus 600-based deep-water mine hunting UUV",
  202: "Expendable mine identification and neutralization ROV",
  203: "Advanced SEAL delivery system mini-submarine, 1 built",
  204: "Wet-type SEAL delivery vehicle for covert insertion",
  205: "Improved SDV with enhanced navigation and endurance",
  206: "Barbel-class diesel-electric submarine, last US conventional sub",
  207: "Lafayette-class SSBN with Poseidon C3 SLBMs, 16 tubes",
  208: "James Madison-class SSBN with Poseidon C3 missiles",
  209: "Benjamin Franklin-class SSBN upgraded to Trident C4",
  210: "Ohio-class SSBN with 24 Trident D5 SLBMs",
  211: "Improved Ohio-class with Trident D5LE missiles",
  212: "Ohio-class converted from SSBN to guided missile submarine, 154 Tomahawks",
  213: "Lead Seawolf-class, quietest and most heavily armed US SSN",
  214: "Extended Seawolf hull with special operations ocean interface",
  215: "Skipjack-class fast attack sub, first with teardrop hull",
  216: "Permit-class SSN, first deep-diving US nuclear attack sub",
  217: "Sturgeon-class, most numerous Cold War SSN class",
  218: "Former SSBN converted to attack submarine for special missions",
  219: "One-of-a-kind SSN with S5G natural-circulation reactor",
  220: "Late Sturgeon-class with larger sail for special operations",
  221: "One-of-a-kind SSN testing turbo-electric drive for quieting",
  222: "Lead Los Angeles-class SSN, original short-hull variant",
  223: "Improved 688-class with upgraded sonar and weapons systems",
  224: "688I with vertical launch tubes for Tomahawk missiles",
  225: "688I with improved BSY-1 combat system",
  226: "688I with further upgraded AN/BQQ-5 sonar suite",
  227: "Late 688I Los Angeles-class with comprehensive upgrades",
  228: "Lead Virginia-class SSN with photonic mast and pump-jet",
  229: "Block II Virginia with improved sonar and reduced cost",
  230: "Block III Virginia with large-aperture bow sonar array",
  231: "Block IV Virginia with redesigned reactor for lower cost",
  232: "Block V Virginia with Virginia Payload Module for 40 Tomahawks",
};

// ─── WEAPONS DESCRIPTIONS ─────────────────────────────────────────
const weaponsDesc = {
  1: "5-inch/54 naval gun with proximity-fuzed and point-detonating rounds",
  2: "5-inch/62 extended-range naval gun with electronic time fuze",
  3: "20mm single-barrel aircraft/vehicle cannon burst",
  4: "12-barrel 20mm naval CIWS system, Spanish design",
  5: "20mm Oerlikon light naval anti-aircraft cannon",
  6: "20mm Rheinmetall autocannon for naval and ground mounts",
  7: "Original Phalanx Block 0 close-in weapon system",
  8: "25mm stabilized remote weapon station for small combatants",
  9: "25mm chain gun in Mk96 naval mount",
  10: "30mm single Oerlikon naval cannon",
  11: "30mm DS30M Mk2 naval gun with armor-piercing capability",
  12: "57mm rapid-fire naval gun used on LCS Freedom-class",
  13: "76mm Super Rapid naval gun for anti-surface and anti-air",
  14: "Laser-guided anti-armor Hellfire with SAL seeker",
  15: "Tandem-warhead Hellfire for reactive-armor targets",
  16: "Multi-purpose Hellfire II with blast-frag and SAL seeker",
  17: "Hellfire II blast-fragmentation variant for bunkers and structures",
  18: "Fire-and-forget Hellfire II with millimeter-wave radar seeker",
  19: "Paveway-guided 1,000-lb bomb with rocket booster, anti-ship role",
  20: "Stealthy nuclear-armed cruise missile with low-observable design",
  21: "First-gen command-guided air-to-ground missile, Vietnam era",
  22: "Israeli-developed stand-off missile with imaging IR seeker",
  23: "Raptor variant with electro-optical TV seeker",
  24: "Export Popeye variant with IIR seeker for Australia",
  25: "South Korean Popeye variant with CCD TV seeker",
  26: "South Korean Popeye with imaging IR seeker",
  27: "TV-guided glide bomb with extended range and data link",
  28: "Imaging IR Maverick for day/night precision ground attack",
  29: "Short-range nuclear attack missile for B-52 and FB-111",
  30: "Conventional air-launched cruise missile with GPS/INS guidance",
  31: "Original anti-radiation missile for SEAD, USN 1986 IOC",
  32: "Latest HARM variant with GPS-aided navigation",
  33: "First AMRAAM with active radar homing, BVR engagement",
  34: "Improved AMRAAM with longer range and better ECCM",
  35: "Short-range IR air-to-air missile, British design",
  36: "Improved HAWK surface-to-air missile for medium-range air defense",
  37: "Early IR-guided air-to-air missile with limited capability",
  38: "Original long-range fleet defense missile for F-14 Tomcat",
  39: "Improved Phoenix with digital seeker and ECCM capability",
  40: "Early semi-active radar Sparrow III from 1960",
  41: "Vietnam-era improved Sparrow with dogfight capability",
  42: "Final Sparrow variant with dual-mode seeker and improved motor",
  43: "Stinger adapted for helicopter air-to-air use",
  44: "First-gen Sidewinder with uncooled IR seeker, rear-aspect only",
  45: "Navy Sidewinder with improved seeker and Mk36 motor",
  46: "USAF improved Sidewinder with thermoelectric-cooled seeker",
  47: "All-aspect Sidewinder with AM/FM conical scan seeker",
  48: "Improved AIM-9L with enhanced IRCCM capability",
  49: "First-gen wire-guided anti-tank missile",
  50: "Improved TOW with larger warhead and extended range",
  51: "Wind-corrected cluster munition dispenser with combined effects",
  52: "Sensor-fuzed weapon WCMD dropping BLU-108 anti-armor skeets",
  53: "Cluster bomb with anti-personnel/materiel submunitions",
  54: "Fuel-air explosive bomb for area targets and minefields",
  55: "Improved anti-personnel/anti-materiel cluster bomb",
  56: "Combined effects munition with anti-armor and anti-personnel",
  57: "First-gen shoulder-fired IR SAM, replaced by Stinger",
  58: "Reprogrammable Stinger MANPADS with rosette scan seeker",
  59: "2,000-lb laser-guided bomb with Paveway II kit (not produced)",
  60: "Turkish Paveway II variant of GBU-10 LGB",
  61: "2,000-lb glide bomb with IIR terminal seeker and data link",
  62: "500-lb Paveway III precision LGB with proportional guidance",
  63: "2,000-lb Paveway III with low-level delivery capability",
  64: "Penetrator LGB for hardened targets, Paveway III GPS/laser hybrid",
  65: "4,700-lb bunker buster LGB for deeply buried targets",
  66: "GPS/laser dual-mode Deep Throat for all-weather bunker attack",
  67: "GPS-Aided Munition glide bomb, brief USAF service 1997-1999",
  68: "4,700-lb GPS-guided bunker buster",
  69: "500-lb GPS-guided JDAM, primary precision workhorse munition",
  70: "21,600-lb Massive Ordnance Air Blast, largest non-nuclear bomb",
  71: "Laser-guided glide munition using BAT submunition technology",
  72: "500-lb dual-mode GPS/laser Paveway II for moving targets",
  73: "500-lb laser JDAM with semi-active laser terminal guidance",
  74: "2,000-lb laser JDAM with precision terminal homing",
  75: "250-lb Paveway II laser-guided training/light strike bomb",
  76: "250-lb dual-mode GPS/laser Paveway II",
  77: "Electro-optical guided 2,000-lb bomb, Vietnam era",
  78: "Israeli laser-guided bomb kit for various warheads",
  79: "ATACMS Block IIA with BAT brilliant anti-armor submunitions (cancelled)",
  80: "Mobile medium-range ballistic missile with nuclear warhead",
  81: "Pershing II with radar-guided maneuvering reentry vehicle",
  82: "Patriot PAC-2 SAM with blast-fragmentation warhead",
  83: "AMRAAM adapted to HUMVEE-mounted ground launch role",
  84: "Improved HAWK with low-level and multi-jamming capability",
  85: "I-HAWK with new body section for improved performance",
  86: "Latest I-HAWK with new fuzing for improved lethality",
  87: "I-HAWK variant with updated fuzing, status uncertain",
  88: "Improved Chaparral with all-aspect engagement capability",
  89: "Final Chaparral with rosette scan seeker and smokeless motor",
  90: "Helicopter-towed mechanical mine sweep system",
  91: "Helicopter-towed acoustic influence minesweep",
  92: "Helicopter-towed magnetic influence minesweep",
  93: "Aerial depth charge for ASW from helicopter or patrol aircraft",
  94: "Practice loading round for training gun crews",
  95: "SRBOC chaff cartridge for radar decoy",
  96: "SRBOC IR flare decoy cartridge",
  97: "Helicopter-towed acoustic sweep from 1973",
  98: "Mousetrap forward-throwing ASW rocket salvo system",
  99: "Sea Gnat improved chaff/IR decoy for SRBOC launcher",
  100: "Active radar decoy round creating false target returns",
  101: "Triple-barreled ASW mortar firing ahead of ship",
  102: "Original heavyweight torpedo with wire guidance",
  103: "Latest Mk48 with common broadband sonar for shallow water",
  104: "Lightweight ASW torpedo with closed-cycle propulsion",
  105: "Encapsulated torpedo mine triggered by submarine detection",
  106: "1,000-lb Quickstrike bottom mine converted from Mk82 bomb",
  107: "2,000-lb Quickstrike bottom mine (limited operational status)",
  108: "Straight-running unguided torpedo, WWII-era legacy weapon",
  109: "250-lb low-drag general purpose bomb, smallest standard bomb",
  110: "500-lb retarded bomb with folding fins for low-level delivery",
  111: "Straight-running torpedo variant for submarine launch",
  112: "Rolling Airframe Missile Block IA with passive RF and IR guidance",
  113: "SM-3 Block I exo-atmospheric ballistic missile interceptor",
  114: "Final improved Tartar SAM with TRIP guidance upgrade",
  115: "Beam-riding/semi-active Terrier long-range SAM",
  116: "Standard Missile 1 Medium Range for Tartar-equipped ships",
  117: "Final SM-1MR production with improved ECCM and guidance",
  118: "SM-2MR Block II for AEGIS rail launcher ships",
  119: "SM-2MR Block II for AEGIS VLS-equipped ships",
  120: "SM-2MR Block II for legacy Tartar rail launcher ships",
  121: "SM-2MR Block III with IR terminal seeker for AEGIS rail launchers",
  122: "SM-2MR Block III for AEGIS VLS with fragmentation warhead",
  123: "Naval Chaparral adapted from MIM-72F for ship self-defense",
  124: "Japanese-built Sea Sparrow based on RIM-7F airframe",
  125: "Improved Sea Sparrow with inverse monopulse seeker",
  126: "Supersonic ramjet-powered long-range naval SAM, 1969-1979",
  127: "Surface-launched Standard missile variant for Keres system",
  128: "Submarine-launched Tomahawk Block IV with time-sensitive targeting",
  129: "Submarine-launched Trident II D5 ICBM with MIRV warheads",
  130: "Submarine-launched Harpoon IC anti-ship missile",
  131: "Submarine-launched Harpoon ICR with re-attack capability",
  132: "Trident C-4 SLBM with MIRV, predecessor to D5",
};

// ─── SENSOR DESCRIPTIONS ──────────────────────────────────────────
// With 576 sensors, we'll generate smart descriptions from names/existing desc
// Focus on differentiating variant families
const sensorDescOverrides = {};
// We'll use a script to generate these from naming patterns

// ─── FACILITY DESCRIPTIONS ────────────────────────────────────────
const facilitiesDesc = {
  1: "Air defense platoon with 2× M163A1 Vulcan self-propelled AA guns",
  2: "Air defense platoon with 2× improved M163A2 Vulcan SPAAG",
  3: "Air defense platoon with 2× M167 towed Vulcan AA guns",
  4: "C-RAM section with Phalanx 1B adapted for land-based rocket defense",
  5: "4× M1 Abrams original variant with 105mm gun",
  6: "3× Stryker Mobile Gun System with 105mm cannon",
  7: "4× M1A1 Abrams with 120mm smoothbore and improved armor",
  8: "4× M1A2 Abrams with commander's independent thermal viewer",
  9: "4× M1A2 SEP with digital systems and improved survivability",
  10: "4× M60A3 Patton with thermal sight and laser rangefinder",
  11: "6× M101 towed 105mm howitzer, WWII-era light artillery",
  12: "6× M102 towed 105mm, lighter weight for airborne/airmobile units",
  13: "6× M109A3 155mm self-propelled howitzer, older variant",
  14: "6× M109A5 with improved cannon and fire control",
  15: "6× M109A6 Paladin with autonomous fire capability",
  16: "6× M109A7 Paladin PIM with Bradley chassis and improved electronics",
  17: "6× M198 towed 155mm, standard towed howitzer before M777",
  18: "6× M777 lightweight towed 155mm with titanium construction",
  19: "6× M110 203mm self-propelled heavy howitzer",
  20: "HIMARS battery platoon with GMLRS precision rockets",
  21: "MLRS battery platoon with GMLRS alternate warhead rockets",
  22: "Fixed underwater acoustic array for submarine detection (SOSUS)",
  23: "High-frequency direction finding with AN/FLR-9 circular array, 8 sites",
  24: "Classic Bullseye HF/DF with AN/FRD-10 circular array, 14 sites",
  25: "Delta Force reconnaissance platoon with laser designation capability",
  26: "Special Forces ODA team with AN/PAQ-1 laser target designator",
  27: "Marine Raider team with laser designation and sabotage capability",
  28: "Ranger platoon with laser designation and organic 60mm mortar",
  29: "Standard US Army infantry platoon",
  30: "Standard US Marine Corps infantry platoon",
  31: "Navy SEAL platoon with sabotage and laser designation capability",
  32: "Delta Force recon team with AN/PAQ-1 laser designator",
  33: "Delta Force saboteur team for behind-lines demolition",
  34: "Delta Force combined team with sabotage and laser designation",
  35: "Forward air controller section with AN/PAQ-1 laser designator",
  36: "Green Berets split ODA with AN/PAQ-1 for target designation",
  37: "Green Berets split ODA specialized in sabotage operations",
  38: "Marine Force Recon team with AN/PAQ-1 laser designator",
  39: "Marine Raider section with laser designation capability",
  40: "Pararescue (PJ) team for combat search and rescue",
  41: "Ranger fire team, smallest Ranger tactical element",
  42: "Ranger recon team with AN/PAQ-1 laser target designator",
  43: "Ranger squad organized as air assault chalk element",
  44: "SEAL recon team with AN/PAQ-1 laser designator",
  45: "SEAL recon team without laser designator",
  46: "SEAL squad with sabotage and laser designation capabilities",
  47: "SEAL team with sabotage capability, no designator",
  48: "4× LAV-25 light armored vehicles with 25mm Bushmaster",
  49: "3× M1126 Stryker wheeled IFV with .50 cal or Mk19",
  50: "4× M113A1 tracked APC, original aluminum-armored carrier",
  51: "4× M113A2 with improved engine cooling and suspension",
  52: "4× M113A3 with turbocharged diesel and external fuel tanks",
  53: "4× M2 Bradley original IFV with 25mm and TOW",
  54: "4× M2A1 Bradley with improved TOW and NBC protection",
  55: "4× M2A2 Bradley with explosive reactive armor option",
  56: "4× M2A3 Bradley with digital electronics and improved armor",
  57: "4× M3 Bradley cavalry fighting vehicle for scout role",
  58: "4× M3A1 cavalry variant with improved TOW launcher",
  59: "4× M3A2 cavalry scout with reactive armor capability",
  60: "4× M3A3 cavalry scout with digital battle management",
  61: "Generic US Army mechanized infantry platoon",
  62: "3× Stryker Dragoon IFV with 30mm cannon upgrade",
  63: "3× AAV-P7/A1 amphibious assault vehicle with grenade launcher",
  64: "Cobra Dane phased-array radar for ballistic missile tracking",
  65: "PAVE PAWS upgraded early warning radar for missile defense",
  66: "PAVE PAWS dual-face phased array for SLBM detection",
  67: "North Warning System long-range radar for Arctic air defense",
  68: "Relocatable FPS-117 radar, 4 on Iceland",
  69: "Over-the-horizon backscatter radar for wide-area surveillance",
  70: "BMEWS Site I at Thule, Greenland, for ICBM detection",
  71: "BMEWS Site II at Clear, Alaska, for missile early warning",
  72: "North Warning System short-range gap-filler radar",
  73: "BMEWS Site III at Fylingdales, England",
  74: "Long-range discrimination radar for ballistic missile defense",
  75: "Legacy BMEWS tracking radar at Fylingdales",
  76: "Legacy BMEWS detection radar at Clear AFB, 3 units",
  77: "Medium-range tactical air surveillance radar",
  78: "Space surveillance phased array radar at Eglin AFB",
  79: "Legacy BMEWS tracking radar at Clear AFB",
  80: "Perimeter acquisition radar for ABM site defense",
  81: "Improved perimeter acquisition radar variant",
  82: "Forward Area Alerting Radar for low-altitude air defense",
  83: "3D air defense radar for Patriot and SHORAD coordination",
  84: "Height-finding radar based on AN/FPS-6",
  85: "Battle surveillance radar for ground operations",
  86: "Firefinder counter-battery radar detecting mortar/artillery fire",
  87: "NASAMS-associated variant of Firefinder radar",
  88: "Firefinder long-range counter-battery radar for artillery location",
  89: "Seek Score deployable tactical air surveillance radar",
  90: "3D tactical air surveillance radar, shipboard-derived",
  91: "Deployable 3D tactical air defense radar",
  92: "Anti-TBM variant of TPS-59 for theater missile defense",
  93: "Standard TPS-59 long-range surveillance radar, 11 units",
  94: "TPS-63 surveillance radar mounted on tethered aerostat",
  95: "Ground-based TPS-63 tactical surveillance radar",
  96: "Relocatable Over-The-Horizon Radar for drug interdiction",
  97: "Marine Air Traffic Control and Landing System radar",
  98: "Deployable 3D air surveillance radar, 57 fielded",
  99: "Upgraded TPS-75 replacement radar with improved processing",
  100: "Ground/Air Task-Oriented Radar for Marine air defense",
  101: "Transportable X-band radar for THAAD missile defense",
  102: "Aerostat-mounted tethered radar for border/drug surveillance",
  103: "Long-range FAA/military joint-use air route surveillance radar",
  104: "Airport surveillance radar for military GCA approach control",
  105: "JLENS VHF-band aerostat radar for cruise missile defense",
  106: "JLENS X-band aerostat radar providing fire control data",
  107: "Baseline I-HAWK battery with original radar and guidance",
  108: "Phase 1 I-HAWK battery with improved acquisition radar",
  109: "Phase 2 I-HAWK battery with TAS tracking adjunct",
  110: "Phase 3 I-HAWK battery with high-mobility launchers",
  111: "Phase 3 I-HAWK battery with TAS, standard configuration",
  112: "Nike Hercules SAM battery for area air defense (Cold War)",
  113: "Baseline Patriot SAM battery with AN/MPQ-53 radar, 6 launchers",
  114: "PAC-1 Patriot with improved software for TBM engagement",
  115: "PAC-2 GEM Patriot with enhanced guidance for TBM intercept",
  116: "PAC-2 GEM+ with PAC-3 ERINT hit-to-kill interceptors mixed",
  117: "PAC-2 GEM+ with PAC-3 MSE extended-range interceptors",
  118: "PAC-2 GEM+ Patriot with improved anti-TBM guidance",
  119: "PAC-2 Patriot with initial anti-TBM software upgrade",
  120: "THAAD battery for exo-atmospheric ballistic missile intercept",
  121: "HUMVEE-mounted AMRAAM launchers for SHORAD air defense",
  122: "Baseline I-HAWK firing platoon with original systems",
  123: "Phase 1 I-HAWK platoon with improved radar",
  124: "Phase 2 I-HAWK platoon with TAS tracking adjunct",
  125: "Phase 3 I-HAWK platoon with TAS, latest configuration",
  126: "Norwegian-American NASAMS medium-range air defense platoon",
  127: "2× Chaparral self-propelled SAM launchers for SHORAD",
  128: "NASAMS II platoon with MSP-500 EO tracker",
  129: "Avenger HUMVEE with Stinger SAM and .50 cal MG",
  130: "Bradley Linebacker with 4× Stinger SAM on M2 chassis",
  131: "LAV-25 chassis with Stinger and 25mm for Marine air defense",
  132: "4× Redeye MANPADS gunners for point air defense",
  133: "5× Stinger MANPADS team for SHORAD point defense",
  134: "AEGIS Ashore land-based SM-3 Block IIA missile defense site",
  135: "Ground-Based Interceptor CE-I for homeland ICBM defense",
  136: "GBI CE-II Block 0 with improved kill vehicle for GMD",
  137: "GBI CE-II Block 1 with latest kill vehicle technology",
  138: "MSP-500 electro-optical sensor for NASAMS II fire control",
  139: "NASAMS EO/IR and laser rangefinder tracking sensor",
  140: "Ground-Launched Cruise Missile flight with BGM-109G Tomahawk",
  141: "3× FGM-148 Javelin fire-and-forget anti-tank missile launchers",
  142: "MGM-52C Lance tactical ballistic missile with conventional warhead",
  143: "Pershing IA mobile medium-range ballistic missile launcher",
  144: "Pershing II mobile MRBM with maneuvering reentry vehicle",
  145: "Minuteman II ICBM in hardened underground silo",
  146: "Minuteman III ICBM with MIRV warheads in silo",
  147: "MX Peacekeeper ICBM with 10 MIRV warheads in silo",
  148: "Titan II ICBM with single 9-megaton warhead in silo",
  149: "Ground launch facility for BQM-74 Chukar target drones",
};

// ─── APPLY UPDATES ────────────────────────────────────────────────
function updateFile(filePath, descMap) {
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  let updated = 0;
  data.forEach(item => {
    if (descMap[item.id]) {
      item.description = descMap[item.id];
      updated++;
    }
  });
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
  console.log(`Updated ${updated}/${data.length} items in ${path.basename(filePath)}`);
}

const dataDir = path.join(__dirname, 'data', 'us');

updateFile(path.join(dataDir, 'aircraft.json'), aircraftDesc);
updateFile(path.join(dataDir, 'ships.json'), shipsDesc);
updateFile(path.join(dataDir, 'weapons.json'), weaponsDesc);
updateFile(path.join(dataDir, 'facilities.json'), facilitiesDesc);

// For sensors, generate descriptions from the existing name/desc patterns
const sensorsPath = path.join(dataDir, 'sensors.json');
const sensors = JSON.parse(fs.readFileSync(sensorsPath, 'utf8'));
let sensorUpdated = 0;

sensors.forEach(s => {
  const name = s.name;
  const existing = s.description || '';
  let desc = '';

  // Generate descriptions based on designation patterns
  if (name.startsWith('AN/AAQ-')) {
    if (name.includes('PNVS')) desc = 'Pilot night vision sensor for Apache targeting';
    else if (name.includes('DIRCM') || name.includes('LAIRCM')) desc = 'Directed IR countermeasure system against heat-seeking missiles';
    else if (name.includes('AESOP')) desc = 'Airborne electro-optical special operations sensor';
    else if (name.includes('EO-DAS')) {
      if (name.includes('MAWS')) desc = 'F-35 Distributed Aperture System in missile warning mode';
      else desc = 'F-35 Distributed Aperture System for spherical IR coverage';
    }
    else if (name.includes('FLIR')) desc = 'Forward-looking infrared sensor for night operations';
    else if (name.includes('Hawkeye')) desc = 'Target sight system for AH-1Z Viper attack helo';
    else if (name.includes('TSS')) desc = 'Target sight system for MH-60R/S helicopters';
    else desc = 'Airborne electro-optical/infrared sensor system';
  }
  else if (name.startsWith('AN/AAR-')) {
    if (name.includes('PMAWS')) desc = 'F-22 passive missile approach warning system';
    else if (name.includes('CMWS')) desc = 'Common Missile Warning System for rotary-wing aircraft';
    else desc = 'Airborne missile/threat warning receiver';
  }
  else if (name.startsWith('AN/AAS-')) {
    if (name.includes('TRAM')) desc = 'Target Recognition Attack Multisensor for A-6E';
    else if (name.includes('Pave Penny')) desc = 'Laser spot tracker pod for A-10 target handoff';
    else if (name.includes('IRDS')) desc = 'Infrared detection system for P-3C Update II';
    else desc = 'Airborne search and tracking sensor';
  }
  else if (name.startsWith('AN/ALQ-')) {
    if (name.includes('99')) desc = 'Tactical jamming pod system for EA-6B and EA-18G';
    else if (name.includes('161')) desc = 'Advanced threat radar jammer for F/A-18';
    else if (name.includes('184')) desc = 'Towed radar decoy for fighter self-protection';
    else if (name.includes('131') || name.includes('IDECM')) desc = 'Integrated Defensive Electronic Countermeasures suite';
    else if (name.includes('SLQ-32')) desc = 'Shipboard electronic warfare suite';
    else desc = 'Electronic countermeasure/jammer system';
  }
  else if (name.startsWith('AN/ALR-')) {
    if (name.includes('56')) desc = 'Radar warning receiver for tactical aircraft';
    else if (name.includes('67')) desc = 'Advanced radar warning receiver with threat identification';
    else if (name.includes('69')) desc = 'Digital radar warning receiver for F-15/F-16';
    else desc = 'Radar warning receiver for threat detection';
  }
  else if (name.startsWith('AN/APG-')) {
    if (name.includes('63')) desc = 'F-15 multi-mode pulse-Doppler radar, AESA upgraded variant';
    else if (name.includes('65')) desc = 'F/A-18 Hornet multi-mode radar';
    else if (name.includes('66')) desc = 'F-16 fire control radar';
    else if (name.includes('68')) desc = 'F-15E multi-mode radar for air-to-air and ground attack';
    else if (name.includes('70')) desc = 'F-14D advanced multi-mode radar';
    else if (name.includes('71')) desc = 'F-14D Digital advanced radar with track-while-scan';
    else if (name.includes('73')) desc = 'F/A-18 Super Hornet AESA radar';
    else if (name.includes('77')) desc = 'F-22 Raptor AESA radar with LPI capability';
    else if (name.includes('79')) desc = 'F/A-18E/F AESA radar upgrade';
    else if (name.includes('81')) desc = 'F-35 multifunction AESA radar';
    else if (name.includes('82')) desc = 'F-15E AESA radar upgrade replacing APG-70';
    else if (name.includes('83')) desc = 'F-16V AESA radar upgrade';
    else desc = 'Airborne fire control/multimode radar';
  }
  else if (name.startsWith('AN/APS-')) {
    if (name.includes('115')) desc = 'P-3C maritime search radar';
    else if (name.includes('116')) desc = 'S-3 Viking inverse SAR maritime radar';
    else if (name.includes('124')) desc = 'MH-60R Seahawk search radar';
    else if (name.includes('137')) desc = 'P-3C multi-mission maritime radar';
    else if (name.includes('138')) desc = 'E-2C AEW radar variant';
    else if (name.includes('139')) desc = 'SH-60B LAMPS III lightweight radar';
    else if (name.includes('143')) desc = 'MH-60R multi-mode maritime radar';
    else if (name.includes('145')) desc = 'E-2C Hawkeye 2000 ADS-18 radar';
    else if (name.includes('149')) desc = 'Multi-mode radar for MQ-8 Fire Scout UAV';
    else desc = 'Airborne surveillance/search radar';
  }
  else if (name.startsWith('AN/APY-')) {
    if (name.includes('1') || name.includes('2')) desc = 'E-3 AWACS airborne early warning radar';
    else if (name.includes('3')) desc = 'JSTARS ground moving target indicator radar';
    else if (name.includes('6')) desc = 'E-2D Advanced Hawkeye ADS-18 UHF radar';
    else if (name.includes('7')) desc = 'E-8C Joint STARS ground surveillance radar';
    else if (name.includes('9') || name.includes('10')) desc = 'E-2D Advanced Hawkeye AESA AEW radar';
    else desc = 'Airborne early warning/surveillance radar';
  }
  else if (name.startsWith('AN/SPY-')) {
    if (name.includes('1')) desc = 'AEGIS multi-function phased array radar for air/missile defense';
    else if (name.includes('3')) desc = 'Dual-band radar for DDG-1000 Zumwalt class';
    else if (name.includes('6')) desc = 'AMDR/AN/SPY-6 next-gen radar for Flight III Burkes';
    else desc = 'Shipboard phased array surveillance radar';
  }
  else if (name.startsWith('AN/SPG-')) {
    if (name.includes('51')) desc = 'SM-2 Standard Missile illuminator/fire control radar';
    else if (name.includes('55')) desc = 'Terrier/Standard illumination radar';
    else if (name.includes('60')) desc = 'Mk86 GFCS fire control radar for 5-inch guns';
    else if (name.includes('62')) desc = 'AEGIS SPG-62 target illuminator for SM-2/SM-6';
    else desc = 'Shipboard fire control/illumination radar';
  }
  else if (name.startsWith('AN/SPS-')) {
    if (name.includes('48')) desc = '3D air search radar for carriers and large combatants';
    else if (name.includes('49')) desc = '2D air search radar for surface combatants';
    else if (name.includes('52')) desc = '3D air search radar, combined with IFF';
    else if (name.includes('55')) desc = 'Surface search and navigation radar';
    else if (name.includes('64')) desc = 'Surface search radar for small combatants';
    else if (name.includes('65')) desc = 'Air search radar for amphibious ships';
    else if (name.includes('67')) desc = '2D air/surface search radar for frigates';
    else if (name.includes('73')) desc = 'CORT replacement surface search radar';
    else desc = 'Shipboard search/surveillance radar';
  }
  else if (name.startsWith('AN/SQS-') || name.startsWith('AN/SQQ-') || name.startsWith('AN/BQQ-') || name.startsWith('AN/BQS-')) {
    if (name.includes('SQS-26')) desc = 'Hull-mounted active/passive sonar for ASW operations';
    else if (name.includes('SQS-53')) desc = 'Advanced hull-mounted sonar for surface combatants';
    else if (name.includes('SQS-56')) desc = 'Medium-frequency hull sonar for frigates';
    else if (name.includes('SQQ-89')) desc = 'Integrated ASW combat system combining sonar and fire control';
    else if (name.includes('BQQ-5')) desc = 'Submarine integrated sonar suite for 688-class SSN';
    else if (name.includes('BQQ-6')) desc = 'Seawolf-class advanced integrated sonar system';
    else if (name.includes('BQQ-10')) desc = 'Virginia-class submarine sonar and combat system';
    else if (name.includes('BQS-15')) desc = 'Submarine active/passive hull-mounted sonar';
    else desc = 'Sonar system for submarine/surface ASW detection';
  }
  else if (name.startsWith('AN/SLQ-')) {
    if (name.includes('25')) desc = 'Nixie torpedo countermeasure towed decoy';
    else if (name.includes('32')) desc = 'Shipboard electronic warfare system for threat warning and jamming';
    else desc = 'Shipboard electronic warfare/countermeasure system';
  }
  else if (name.startsWith('AN/SQR-')) {
    desc = 'Passive towed array sonar for submarine detection';
  }
  else if (name.startsWith('AN/WLR-') || name.startsWith('AN/WLQ-')) {
    desc = 'Submarine electronic support measures receiver';
  }
  else if (name.startsWith('AN/BPS-')) {
    desc = 'Submarine navigation/search radar';
  }
  else if (name.startsWith('AN/BRD-')) {
    desc = 'Submarine direction-finding receiver';
  }
  else if (name.includes('Litening') || name.includes('LITENING')) {
    desc = 'Targeting pod with FLIR, CCD camera, and laser designator';
  }
  else if (name.includes('LANTIRN')) {
    if (name.includes('Nav')) desc = 'LANTIRN navigation pod with terrain-following radar';
    else if (name.includes('Tgt') || name.includes('Target')) desc = 'LANTIRN targeting pod with FLIR and laser designator';
    else desc = 'Low-altitude navigation and infrared targeting system';
  }
  else if (name.includes('Sniper')) {
    desc = 'Advanced targeting pod with high-resolution FLIR and laser';
  }
  else if (name.includes('ATFLIR')) {
    desc = 'Advanced Targeting FLIR pod for F/A-18 precision strike';
  }
  // Generic fallbacks by type
  else if (name.includes('FLIR') || name.includes('IR') && name.includes('AN/')) {
    desc = 'Infrared/electro-optical sensor system';
  }
  else if (name.includes('Radar') || name.includes('radar')) {
    desc = 'Radar system for detection and tracking';
  }
  else if (name.includes('Sonar') || name.includes('sonar')) {
    desc = 'Sonar system for underwater detection';
  }
  else if (name.includes('ESM') || name.includes('ELINT')) {
    desc = 'Electronic support measures for signal intelligence';
  }

  if (desc) {
    s.description = desc;
    sensorUpdated++;
  }
});

fs.writeFileSync(sensorsPath, JSON.stringify(sensors, null, 2), 'utf8');
console.log(`Updated ${sensorUpdated}/${sensors.length} items in sensors.json`);
console.log('Done!');
