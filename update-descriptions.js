#!/usr/bin/env node
/**
 * Update all unit descriptions across data files.
 * Descriptions should be short (1 line) and differentiate between variants.
 */
const fs = require('fs');
const path = require('path');

// ─── AIRCRAFT DESCRIPTIONS ────────────────────────────────────────
const aircraftDesc = {
  1: "Original single-seat CAS variant with GAU-8/A 30mm cannon and analog cockpit",
  2: "Precision Engagement upgrade with glass cockpit, JDAM/WCMD, and targeting pod integration",
  3: "Light COIN attack jet derived from T-37B trainer with twin J85 engines and GAU-2B minigun",
  4: "Marine light attack variant with J52-P-408A engine and Hughes ARBS laser/TV tracker",
  5: "SWIP-upgraded all-weather carrier strike jet adding Harpoon, SLAM, and HARM capability",
  6: "Early Navy light attack variant with TF30-P-8 engine, upgraded from A-7A",
  7: "Air Force CAS variant with TF41 engine, M61 Vulcan cannon, and LANA navigation pod",
  8: "Definitive Navy light attack variant with TF41-A-2 engine and advanced avionics suite",
  9: "Two-seat Air Force trainer/combat variant of the A-7D with full weapons capability",
  10: "First-gen gunship with 7.62mm miniguns, 20mm Vulcans, and 40mm Bofors cannon",
  11: "Second-gen gunship armed with 105mm howitzer, 40mm Bofors, and two 20mm Vulcan cannons",
  12: "Latest gunship on C-130J airframe with 105mm howitzer, 30mm cannon, and precision standoff munitions",
  13: "Third-gen gunship with 25mm GAU-12 Equalizer, 40mm Bofors, 105mm, and AN/APQ-180 SAR",
  14: "MC-130W converted to gunship role with 30mm GAU-23 cannon, Griffin missiles, and SDB",
  15: "Fully modernized AH-1 with flat-plate canopy, composite blades, TOW, and HUD/laser rangefinder",
  16: "First twin-engine Cobra for Marines with XM197 three-barrel 20mm cannon turret",
  17: "Single-engine TOW Cobra with flat-plate canopy, composite blades, and NOE instruments",
  18: "Lengthened Marine Cobra with T400-WV-402 Twin Pac engine, TOW, and upgraded transmission",
  19: "Twin-engine Marine SuperCobra with Hellfire, Sidewinder, and Sidearm missile capability",
  20: "Four-blade rotor Marine Viper with TSS target sight system and Top Owl helmet display",
  21: "Original Apache with TADS/PNVS targeting, T700-GE-701 engines, and laser-guided Hellfire",
  22: "Mast-mounted AN/APG-78 Longbow radar enabling fire-and-forget AGM-114L Hellfire engagement",
  23: "Latest Apache Guardian with T700-GE-701D engines, composite rotor blades, and Link 16 datalink",
  24: "Early 160th SOAR light attack Little Bird derived from OH-6A Cayuse airframe",
  25: "SpecOps attack variant of OH-6A with weapons pylons for rockets, guns, and missiles",
  26: "MD 500MD-based SpecOps attack helo with T-tail and more powerful Allison 250-C20R engine",
  27: "SpecOps attack Little Bird based on MD 530F with five-blade rotor and FLIR/GPS avionics",
  28: "Mission Enhanced Little Bird on MD 530F with six-blade rotor and glass cockpit",
  29: "Boeing 747-400F-based COIL laser testbed for boost-phase ballistic missile intercept",
  30: "Tethered 71M aerostat carrying AN/TPS-63 surveillance radar for low-altitude detection",
  31: "First-gen USMC V/STOL jet with Pegasus 11 engine and limited avionics/weapon pylons",
  32: "Upgraded Harrier II Plus with APG-65 radar enabling AIM-120 AMRAAM and night attack",
  33: "Refurbished AV-8A with ECM improvements, OBOGS, and airframe life extension kit",
  34: "Mach 1.25 swing-wing heavy bomber with Integrated Battle Station and Sniper pod capability",
  35: "Stealth flying-wing bomber with B61-12 nuclear, JDAM, JASSM, and MOP capability",
  36: "Vietnam-era B-52 with Big Belly high-density bomb racks for conventional carpet bombing",
  37: "Multi-role B-52 with Harpoon anti-ship, ALCM nuclear cruise, and OAS offensive avionics",
  38: "Current B-52 with CONECT datalink, TF33-P-3 turbofans, and conventional/nuclear flexibility",
  39: "Subsonic turbojet target drone for ship and air defense gunnery training exercises",
  40: "Extended-range Chukar III variant with improved turbojet and longer flight endurance",
  41: "Latest Chukar III with improved sea-level flight performance and higher maneuverability",
  42: "Early tactical airlift Hercules with T56-A-7A turboprops and shorter range than H model",
  43: "Standard tactical airlifter with improved T56-A-15 turboprops and 42,000 lb payload",
  44: "Super Hercules with Rolls-Royce AE 2100D3 turboprops, six-blade props, and glass cockpit",
  45: "Original strategic airlifter, often cubed out before reaching max weight limit",
  46: "Stretched Starlifter with 23 ft fuselage plugs and aerial refueling receptacle",
  47: "Final Starlifter with glass cockpit, GPS, and TCAS avionics modernization upgrades",
  48: "Strategic/tactical airlifter with 170,900 lb payload and direct global delivery capability",
  49: "VIP transport variant based on Boeing 727-200 airframe for Air National Guard",
  50: "Carrier onboard delivery turboprop with remanufactured center wing and updated avionics",
  51: "VIP transport based on Boeing 757-200 serving as Air Force Two backup aircraft",
  52: "SpecOps VIP transport variant with enhanced C4ISR communications suite",
  53: "Navy fleet logistics support aircraft based on Boeing 737-700C convertible freighter",
  54: "Air Force VIP/operational support transport with C4ISR communications capability",
  55: "Congressional/executive transport version of 737-700C with palletized passenger interior",
  56: "Original heavy strategic airlift Galaxy with TF39-GE-1 turbofans, wing fatigue issues",
  57: "Improved Galaxy with strengthened wing structure and updated avionics over C-5A",
  58: "Re-engined Super Galaxy with CF6-80C2 turbofans, glass cockpit, and 22% more thrust",
  59: "Air Force aeromedical evacuation variant of DC-9-30 with 40 litter stations",
  60: "Navy fleet logistics transport based on DC-9-30 for passenger and cargo missions",
  61: "Special air mission VIP transport for senior DoD/government officials, former VC-9C",
  62: "Medium-lift Marine transport helo with T58-GE-10 engines, early Sea Knight variant",
  63: "Upgraded Sea Knight with T58-GE-16 engines, improved crashworthiness, and new avionics",
  64: "Final Sea Knight production variant with minor improvements over CH-46E",
  65: "Early Chinook with T55-L-7C engines and 33,000 lb max gross weight capacity",
  66: "Upgraded heavy-lift Chinook with T55-L-712 engines, fiberglass blades, and triple cargo hooks",
  67: "Latest Chinook with T55-GA-714A engines, digital glass cockpit, and Common Avionics Architecture",
  68: "Marine heavy-lift helo with two T64-GE-413 turboshaft engines and 8,000 lb external payload",
  69: "Three-engine Super Stallion with T64-GE-416A engines, largest Western military helicopter",
  70: "Next-gen heavy-lift with GE T408 engines, fly-by-wire, and 36,000 lb external payload",
  71: "Navy carrier-onboard-delivery Osprey replacing C-2A Greyhound with 1,150 nm range",
  72: "Air Force special operations tiltrotor with APQ-186 terrain-following/avoidance radar",
  73: "Carrier AEW aircraft with AN/APS-145 radar providing overland and overwater tracking",
  74: "Advanced Hawkeye with AN/APY-9 UHF AESA radar, CEC datalink, and aerial refueling probe",
  75: "Initial AWACS variant with Westinghouse AN/APY-1 look-down radar on Boeing 707 airframe",
  76: "AWACS Block 20/25 with CC-2 computer, Have Quick radios, and maritime search capability",
  77: "AWACS Block 30/35 with AN/APY-2 radar, additional situation display consoles, and JTIDS",
  78: "Latest E-3G with open-architecture mission computers, RSIP radar, and Link 16 waveforms",
  79: "National Airborne Operations Center on Boeing 747 for presidential nuclear C3 continuity",
  80: "TACAMO airborne VLF nuclear communications relay with trailing wire antenna",
  81: "Upgraded Mercury combining TACAMO relay and ABNCP airborne command post roles",
  82: "Prototype Joint STARS ground surveillance on Boeing 707 airframe, used in Gulf War",
  83: "Production Joint STARS with AN/APY-7 GMTI radar on Boeing 707-300 airframe",
  84: "Electronic attack Super Hornet carrying ALQ-99 tactical jamming pods with 7-person-capable WSO",
  85: "Carrier-based ELINT variant of A-3 Skywarrior with 7-person electronic warfare crew",
  86: "Marine Corps electronic warfare A-6 with ALQ-55 jammer and ECM escort pod capability",
  87: "Final Prowler with ICAP III, ALQ-218 receiver, and up to 5 ALQ-99 jamming pods",
  88: "Commando Solo airborne PSYOP/MISO broadcast platform on C-130E airframe",
  89: "Navy TACAMO VLF nuclear communications relay on C-130G airframe, predecessor to EC-130Q",
  90: "Compass Call airborne electronic attack platform for enemy communications jamming and denial",
  91: "Latest Commando Solo on C-130J airframe with improved AM/FM/TV/military broadcast",
  92: "Navy TACAMO VLF communications relay on C-130Q airframe, predecessor to E-6A",
  93: "Supersonic EW jet with ALQ-99E in ventral canoe radome and 10 internal transmitters, retired 1998",
  94: "UH-60A Black Hawk with AN/ALQ-151 Quick Fix II SIGINT intercept and communications jamming",
  95: "Airborne Reconnaissance Low COMINT platform on DHC-7 airframe for signals intercept",
  96: "ARL multi-intelligence variant on DHC-7 with COMINT/IMINT configured for Korea ops",
  97: "P-3C-based Aries II SIGINT aircraft with comprehensive ELINT/COMINT collection suite",
  98: "Carrier-based ELINT/SIGINT Shadow aircraft derived from S-3A Viking airframe",
  99: "Mach 1.85 supersonic interceptor with Hughes MG-13 fire control and Genie/Falcon missiles",
  100: "Two-seat operational trainer/combat-ready variant of the F-101B Voodoo interceptor",
  101: "Wild Weasel III SEAD variant of the Thunderchief with AGM-45 Shrike and APR-25/26 RHAW",
  102: "Mach 2.3 delta-wing interceptor with MA-1 fire control, SAGE data link, and Genie rockets",
  103: "Original F-111 with TF30-P-1 engines and Mk I avionics, plagued by engine compressor stalls",
  104: "F-111D with complex Mk II digital avionics and TF30-P-9 engines, high maintenance burden",
  105: "Simplified F-111E with Mk I avionics and TF30-P-3 engines, most numerous TAC variant",
  106: "Best tactical F-111F with TF30-P-100 engines, Pave Tack FLIR/laser pod, and GBU-15/24 capability",
  107: "First operational stealth aircraft with faceted low-observable design and two GBU-27 LGBs",
  108: "Original fleet defense Tomcat with TF30-P-414A engines and AWG-9/Phoenix missile system",
  109: "Re-engined Tomcat (later redesignated F-14B) with F110-GE-400 engines eliminating compressor stalls",
  110: "Ultimate Tomcat with AN/APG-71 radar, F110-GE-400 engines, and digital glass cockpit",
  111: "First production Eagle air superiority fighter with AN/APG-63 pulse-Doppler radar",
  112: "Definitive Eagle with AN/APG-63(V)3 AESA radar upgrade for select units",
  113: "Dual-role Strike Eagle with AN/APG-82 AESA radar and conformal fuel tanks",
  114: "ADF variant of F-16A Block 15 with APG-66A radar and AIM-7/AIM-120 capability",
  115: "Block 30 multi-role Falcon with F110-GE-100 engine option, often ANG/Reserve operated",
  116: "Block 40 Night Falcon with LANTIRN pods, F110-GE-100 engine, and wide-angle HUD",
  117: "Block 50 SEAD/DEAD Falcon with HARM Targeting System and F110-GE-129 engine",
  118: "Have Glass II signature-reduced Block 50 with radar-absorbent coatings for lower RCS",
  119: "Aggressor F-16 with F110-GE-100 engine painted in adversary schemes for DACT training",
  120: "Fifth-gen stealth air dominance fighter with F119 supercruise and AN/APG-77 AESA radar",
  121: "CTOL stealth multirole fighter for USAF with 4x AMRAAM and 2x GBU-31 internal capacity",
  122: "STOVL stealth variant for Marines with Rolls-Royce LiftFan system for vertical landing",
  123: "Carrier-variant stealth fighter for USN with larger folding wings and increased fuel capacity",
  124: "Early USAF tactical fighter with APQ-100 pulse radar and AIM-7 Sparrow capability",
  125: "Improved F-4 with APQ-109 radar, weapons release computer, and precision bombing avionics",
  126: "Multi-role variant with internal M61A1 Vulcan cannon, leading-edge slats, and J79-GE-17 engines",
  127: "Advanced Wild Weasel V SEAD variant with APR-38 (later APR-47) radar threat detection system",
  128: "Navy fleet defense variant with AWG-10 pulse-Doppler radar and improved dogfight capability",
  129: "Rebuilt F-4B with upgraded AN/AWG-10B radar, new wiring, and extended structural life",
  130: "Final Navy Phantom with J79-GE-17 smokeless engines, leading-edge slats, and VTAS helmet sight",
  131: "Lightweight single-seat aggressor fighter with J85-GE-21B engines for DACT training",
  132: "Two-seat combat-capable trainer variant of the F-5E Tiger II with full weapons capability",
  133: "Upgraded Hornet with APG-73 radar and AIM-120 AMRAAM capability for Marine squadrons",
  134: "Night-attack Hornet with NAVFLIR, NVG-compatible cockpit, and APG-73 radar",
  135: "Two-seat all-weather Hornet with APG-73 radar, ATFLIR pod, and precision strike role",
  136: "Single-seat Super Hornet with APG-79 AESA radar, LRASM, and 35% more fuel than legacy",
  137: "Two-seat Super Hornet with APG-79 AESA, LRASM, and WSO for complex strike missions",
  138: "Strategic nuclear F-111 variant with FB wing, SRAM missiles, and extended-range fuel",
  139: "Hand-launched 4.5 lb miniature UAV with EO camera for squad-level reconnaissance",
  140: "Search and rescue Hercules with ARS-6 personnel locator for Combat SAR coordination",
  141: "Combat King II on C-130J with enhanced sensors, CSAR refueling, and personnel recovery",
  142: "Combat King for extended-range CSAR with helicopter aerial refueling pods and FLIR",
  143: "USCG medium-range maritime patrol based on EADS CN-235-300M with 360° radar coverage",
  144: "Combat rescue Pave Hawk with APQ-174 terrain-following radar and aerial refueling probe",
  145: "Navy CSAR and NSW support helicopter based on SH-60 with rescue hoist and FLIR",
  146: "Coast Guard medium-range recovery helicopter based on Eurocopter HH-65 Dauphin",
  147: "Next-gen USAF combat rescue helo with T700-GE-401D engines replacing HH-60G Pave Hawk",
  148: "USCG short-range recovery helicopter based on Aerospatiale SA 366G1 Dauphin airframe",
  149: "USCG medium-range surveillance jet based on Dassault Falcon 20G with APS-127 radar",
  150: "Guardian variant with Motorola Aireye oil spill detection and pollution monitoring sensors",
  151: "Interceptor Guardian with AN/APG-66 radar and FLIR for drug interdiction missions",
  152: "Guardian variant with AN/APS-131 side-looking airborne radar for maritime surveillance",
  153: "Carrier-based aerial tanker converted from A-3B Skywarrior with hose-drogue refueling",
  154: "Carrier-based buddy tanker converted from A-6 Intruder with D-704 refueling store",
  155: "Widebody tanker/cargo based on DC-10-30CF with boom and hose-drogue dual refueling",
  156: "Original Marine KC-130F tanker-transport Hercules with probe-and-drogue refueling pods",
  157: "Super Hercules tanker with roll-on/roll-off refueling pallets and Harvest Hawk ISR kit",
  158: "Improved Marine tanker on C-130R with increased fuel capacity and updated avionics",
  159: "Reserve Marine tanker on C-130T airframe with enhanced avionics and cargo handling",
  160: "Original Stratotanker with water-injected J57-P-59W turbojet engines and flying boom",
  161: "Re-engined Stratotanker with JT3D/TF33 turbofans from retired 707 airliners (ANG/Reserve)",
  162: "Special Stratotanker with segregated JP-7 fuel tanks for SR-71 Blackbird aerial refueling",
  163: "Definitive re-engined Stratotanker with CFM56-2B-1 high-bypass turbofans, 50% more fuel offload",
  164: "Re-engined KC-135Q retaining segregated JP-7 fuel capability for special refueling missions",
  165: "Next-gen boom/drogue tanker based on Boeing 767-200ER with remote vision refueling system",
  166: "ISR Liberty turboprop on King Air 350ER with MX-15D full-motion video and SIGINT pod",
  167: "First-gen Combat Talon I for low-level SOF infiltration with Fulton STAR recovery system",
  168: "Combat Talon II with integrated APQ-170 TF/TA radar and glass cockpit for deep SOF insert",
  169: "Latest SOF Commando II on C-130J replacing both Combat Talon and Combat Shadow fleets",
  170: "Combat Shadow for nighttime SOF helicopter aerial refueling with NVG-compatible cockpit",
  171: "MC-130W interim SOF platform later converted to AC-130W Stinger II gunship configuration",
  172: "SpecOps Chinook with APQ-174 terrain-following radar and NVG-compatible cockpit for night ops",
  173: "Advanced SpecOps Chinook with aerial refueling probe, multimode radar, and EW suite",
  174: "Latest SpecOps Chinook with CAAS digital cockpit, AAR probe, and Common Avionics Architecture",
  175: "Navy airborne mine countermeasures variant of CH-53E towing AN/AQS-24 mine hunting sonar",
  176: "SpecOps Pave Low III heavy-lift with TF/TA radar, GPS/INS, and NVG for all-weather ops",
  177: "Early SpecOps Blackhawk conversion for 160th SOAR, nicknamed Velcro Hawk for added gear",
  178: "SpecOps Pave Hawk with FLIR, color weather radar, AAR probe, and rescue hoist system",
  179: "Purpose-built SpecOps Blackhawk with integrated FLIR/TF radar, EW suite, and AAR probe",
  180: "MH-60L Direct Action Penetrator with rocket pods, Hellfire missiles, and M230 30mm chain gun",
  181: "Latest 160th SOAR Blackhawk with T700-GE-701D engines, glass cockpit, and FLIR turret",
  182: "Multi-mission Romeo Seahawk with APS-153 radar, dipping sonar, torpedoes, and Hellfire",
  183: "Multi-mission Sierra Knighthawk for VERTREP, SAR, MEDEVAC, and airborne mine countermeasures",
  184: "Stealth-modified Blackhawk with radar-absorbent airframe used in Operation Neptune Spear",
  185: "USCG armed interdiction helicopter based on AgustaWestland A109E Power for HITRON ops",
  186: "SpecOps transport Little Bird derived from OH-6A for 160th SOAR covert insertion",
  187: "SpecOps transport based on MD 500E/D helicopter with passenger benches and FAST rope",
  188: "Updated SpecOps transport Little Bird with improved avionics and navigation systems",
  189: "SpecOps transport Little Bird, unarmed counterpart to armed AH-6J attack variant",
  190: "Latest Mission Enhanced Little Bird transport with MELB glass cockpit and six-blade rotor",
  191: "Armed Predator with two Hellfire hardpoints for persistent strike/ISR with 24-hour endurance",
  192: "Army Gray Eagle UAS with 36-hour endurance, four Hellfire pylons, and SAR/GMTI radar",
  193: "Carrier-based unmanned MQ-25A Stingray tanker providing aerial refueling for carrier air wing",
  194: "Navy MQ-4C Triton persistent maritime surveillance UAV with 360° AN/ZPY-3 MFAS radar",
  195: "Medium-altitude Hunter ISR UAV with GCS datalink and limited weapons for Army brigade ISR",
  196: "Improved Hunter variant with increased payload capacity and extended mission endurance",
  197: "Ship-based Fire Scout VTUAV with laser designator, mine detection, and weapons pylons",
  198: "MQ-9A Reaper Block 5 with 27-hour endurance, 3,800 lb payload, and Lynx SAR/GMTI radar",
  199: "BQM-34 Firebee subsonic jet-powered target drone for fleet air defense training exercises",
  200: "Marine tiltrotor replacing CH-46 Sea Knight with 24 combat-equipped troops and 1,000+ nm range",
  201: "Twin-boom Cessna O-2A Skymaster for visual reconnaissance and forward air control missions",
  202: "FAC/observation variant of A-37B Dragonfly for forward air control and light attack",
  203: "Forward air control redesignation of A-10A, identical airframe used for FAC/AFAC missions",
  204: "Forward air control redesignation of A-10C with digital targeting for precision CAS direction",
  205: "Original OH-58A light observation helicopter with T63-A-700 engine for Army scout role",
  206: "Improved Kiowa with flat-plate canopy, T63-A-720 engine, and improved instruments for NOE",
  207: "Armed Kiowa Warrior with mast-mounted MMS sight, Hellfire, Stinger, and .50 cal options",
  208: "LOH-6A Cayuse light observation helo, basis for 160th SOAR Little Bird variants",
  209: "Twin-turboprop Bronco for light armed recon, FAC, and counterinsurgency with 3,600 lb stores",
  210: "Night Observation Bronco with FLIR turret under nose, laser designator, and AIM-9 Sidewinder",
  211: "OV-1D Mohawk with SLAR and IR sensors for Army battlefield surveillance over the FEBA",
  212: "P-3A Orion modified with APS-138 rotodome for Navy airborne early warning patrol role",
  213: "Update III P-3C Orion with APS-137 ISAR radar, acoustic improvements, and Harpoon capability",
  214: "Boeing 737-800 based Poseidon with APY-10 radar, advanced sonobuoy processing, and Mk54 torpedoes",
  215: "Mach 2 carrier-based recon jet with SLAR, IR scanner, camera pack, and PECM countermeasures",
  216: "Guardrail V SIGINT platform on Beechcraft King Air A200CT for tactical COMINT/ELINT intercept",
  217: "Guardrail Common Sensor System 3 Minus, reduced-capability SIGINT on King Air airframe",
  218: "Guardrail Common Sensor System 4 on RC-12K with upgraded PT6A-67 engines and intercept suite",
  219: "Guardrail Common Sensor System 1 on RC-12N, first unified COMINT/DF SIGINT architecture",
  220: "Guardrail Common Sensor System 2 on RC-12P with datalink and improved geolocation capability",
  221: "Modified RC-12P Guardrail with enhanced multi-sensor SIGINT suite, 3 aircraft",
  222: "MASINT aircraft with AIRS optical/IR sensors tracking ballistic missile boost and reentry phases",
  223: "ELINT aircraft with specialized arrays profiling hostile radar emitter signatures, 2 aircraft",
  224: "Primary USAF SIGINT platform with comprehensive COMINT/ELINT collection suite, 8 aircraft",
  225: "Rivet Joint SIGINT variant with identical mission equipment to RC-135V fleet, 12 aircraft",
  226: "Single IR-sensor Cobra Eye for missile tracking, later converted to RC-135S Cobra Ball",
  227: "RF-4C tactical photo-reconnaissance Phantom with multi-sensor nose and SLAR capability",
  228: "RF-8G photo-recon Crusader with five camera stations replacing guns, Navy's primary tac recon",
  229: "RH-53D mine countermeasures Sea Stallion towing mechanical/magnetic/acoustic sweeping gear",
  230: "RQ-170 Sentinel stealthy flying-wing ISR UAV operated by USAF for penetrating denied airspace",
  231: "Classified RQ-180 stealth long-endurance ISR/SIGINT UAV, larger than RQ-170 Sentinel",
  232: "Original unarmed RQ-1A Predator for persistent surveillance with 24-hour loiter endurance",
  233: "Improved RQ-1B Predator with Ku-band SATCOM link and de-icing for extended operations",
  234: "Small RQ-14A Dragon Eye hand-launched UAV for Marine battalion-level ISR and force protection",
  235: "RQ-2B Pioneer ship-launched tactical UAV used from Iowa-class BBs and amphibious ships",
  236: "RQ-4A Global Hawk Block 10 with EISS EO/IR and Hughes SAR for 32-hour HALE ISR missions",
  237: "RQ-4B Global Hawk Block 40 with Multi-Platform Radar Technology Insert for wide-area GMTI",
  238: "RQ-5A Hunter dual-payload tactical UAV with 12-hour endurance for division-level ISR",
  239: "RQ-7A Shadow original tactical UAS for Army brigade-level surveillance and target acquisition",
  240: "RQ-7B Shadow with increased endurance, improved datalink range, and laser designator option",
  241: "RV-1D Quick Look II electronic warfare Mohawk with ALQ-133 for ELINT and battlefield ESM",
  242: "Original S-3A Viking carrier-based ASW jet with APS-116 radar, MAD boom, and torpedoes",
  243: "Upgraded S-3B Viking with APS-137 ISAR radar, Harpoon anti-ship, and FLIR capability",
  244: "SH-2F LAMPS I Seasprite with APS-124 radar and Magic Lantern laser mine detection system",
  245: "SH-2G Super Seasprite with T700-GE-401/401C engines and improved ASW avionics, 24 built",
  246: "SH-3D Sea King medium ASW helicopter with AQS-13A dipping sonar and two Mk46 torpedoes",
  247: "SH-3H multi-mission Sea King upgraded for ASW, plane guard, and utility/cargo roles",
  248: "SH-60B LAMPS III ASW helo with APS-124 surface search radar, sonobuoys, and Mk46 torpedoes",
  249: "SH-60F Oceanhawk inner-zone carrier ASW helo with AQS-13F dipping sonar for close-in defense",
  250: "SR-71A Blackbird Mach 3.3 reconnaissance aircraft with ASARS-1 SAR, cameras, and ELINT/SIGINT",
  251: "Two-seat TF-16N aggressor trainer variant with F110 engine for Navy adversary DACT training",
  252: "TCOM 250K large tethered aerostat platform for surveillance radar and communications payloads",
  253: "TR-1A high-altitude tactical reconnaissance variant, redesignated back to U-2R in 1992",
  254: "U-28A ISR/SOF light fixed-wing on Pilatus PC-12 for non-standard aviation support missions",
  255: "U-2R high-altitude reconnaissance platform with 103 ft wingspan and interchangeable sensor nose",
  256: "Current U-2S with GE F118-GE-101 engine, ASARS-2A SAR, and Senior Glass SIGINT payload",
  257: "Marine UH-1E Huey utility helo based on Bell UH-1E with M60 door guns, Vietnam era",
  258: "UH-1H Iroquois Army utility helicopter with T53-L-13 engine, workhorse of Vietnam War",
  259: "Twin-engine UH-1N based on Bell 212 with PT6T-3 Turbo Twin Pac for base security/VIP",
  260: "Four-blade UH-1Y Venom with T700-GE-401C engines and glass cockpit, paired with AH-1Z",
  261: "Early UH-46A Sea Knight for vertical replenishment and utility, precursor to CH-46 series",
  262: "Improved UH-46D VERTREP Sea Knight with upgraded T58 engines and avionics for fleet support",
  263: "Original UH-60A Blackhawk utility helicopter with T700-GE-700 engines and 11 combat troops",
  264: "UH-60L Blackhawk with more powerful T700-GE-701C engines and external stores support system",
  265: "UH-60M Blackhawk with T700-GE-701D engines, digital glass cockpit, and improved survivability",
  266: "UH-60Q Medevac Blackhawk with medical attendant stations, also redesignated HH-60L",
  267: "UH-72A Lakota light utility helo based on EC145 for training, MEDEVAC, and homeland security",
  268: "VC-25A Air Force One presidential transport based on Boeing 747-200B, 2 aircraft fleet",
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
  1: "5\"/54 Mk45 naval gun, 13nm range, 16-20 rpm, with Mk160 fire control system",
  2: "5\"/62 Mk45 Mod 4 extended-range gun, 24nm+ range, higher velocity for land attack",
  3: "20mm single-barrel cannon burst, aircraft/vehicle mounted automatic fire",
  4: "Meroka CIWS with 12x 20mm Oerlikon barrels firing at 1,440 rpm, Spanish-designed",
  5: "20mm Oerlikon single-mount light AA cannon with manual operation",
  6: "20mm Rh202 autocannon for naval/ground mounts, 800-1,000 rpm cyclic rate",
  7: "Phalanx Block 0 CIWS with 20mm M61 Vulcan at 3,000 rpm, radar-guided tracking",
  8: "Mk38 Mod 2 stabilized 25mm Bushmaster remote weapon station for small combatants",
  9: "25mm M242 Bushmaster chain gun in Mk96 stabilized mount for patrol craft",
  10: "30mm single Oerlikon KCB cannon in naval pedestal mount",
  11: "DS30M Mk2 30mm Bushmaster II remote-operated cannon, 200 rpm, for RN-type ships",
  12: "Bofors 57mm Mk110 at 220 rpm, 9nm range, main gun on LCS Freedom-class",
  13: "OTO Melara 76mm Super Rapid dual-purpose gun, 120 rpm, 20km effective range",
  14: "AGM-114A Hellfire with SAL laser homing, 8km range, 8kg HEAT shaped-charge warhead",
  15: "AGM-114F Hellfire with tandem HEAT warhead defeating explosive reactive armor, SAL guided",
  16: "AGM-114K Hellfire II with SAL seeker and blast-fragmentation warhead, IOC 1994",
  17: "AGM-114K2A Hellfire II with fragmentation-sleeve warhead optimized vs. small boats/light vehicles",
  18: "AGM-114L Longbow Hellfire with MMW radar fire-and-forget seeker, 8km range, all-weather",
  19: "AGM-123A Skipper II: Mk83 bomb + Paveway II laser kit + Mk78 rocket booster, 25km range",
  20: "AGM-129A ACM stealth nuclear cruise missile with W80 warhead, 2,000+ mi range, low-observable",
  21: "AGM-12C Bullpup radio command-guided missile, 1,000 lb warhead, 10 mi range, Vietnam era",
  22: "AGM-142A Have Nap/Popeye standoff missile, IIR seeker, 340kg warhead, 50nm+ range",
  23: "AGM-142B Raptor variant with electro-optical TV seeker and data-link guidance, 50nm+",
  24: "AGM-142 Popeye export variant with IIR seeker, 1,360kg launch weight",
  25: "AGM-142 Popeye export variant with CCD TV seeker for South Korea",
  26: "AGM-142 Popeye export variant with imaging IR seeker for South Korea",
  27: "AGM-62B Walleye II 2,000lb TV glide bomb with ERDL data link, 45nm standoff range",
  28: "AGM-65G Maverick with IIR seeker, 300lb penetrator warhead, 12nm range, day/night capable",
  29: "AGM-69 SRAM nuclear attack missile, Mach 3, W69 warhead, 100nm range, IOC 1972",
  30: "AGM-86C/D CALCM conventional cruise missile, GPS/INS guided, 3,000lb warhead, 600+ mi range",
  31: "AGM-88B HARM anti-radiation missile, Mach 2+, broadband seeker, 30+ mi range, IOC 1986",
  32: "AGM-88E AARGM with MMW radar + GPS terminal guidance, defeats radar shutdown tactics",
  33: "AIM-120B AMRAAM with active radar homing, 40nm range, reprogrammable software, IOC 1994",
  34: "AIM-120D AMRAAM with 2-way data link, 90nm+ range, enhanced ECCM and GPS/INS midcourse",
  35: "AIM-132 ASRAAM short-range IR missile, Mach 3+, 25km+ range, 50g maneuver, British-designed",
  36: "MIM-23B I-HAWK adapted for air launch, SARH guidance, 40km range",
  37: "AIM-4D Falcon IR-homing missile, Mach 4, 6mi range, 13kg warhead, IOC 1963",
  38: "AIM-54A Phoenix long-range fleet defense missile, 60nm+ range, analog SARH/active radar, IOC 1974",
  39: "AIM-54C Phoenix with digital seeker, improved ECCM and low-altitude capability, IOC 1986",
  40: "AIM-7E Sparrow SARH missile with Mk38 motor, high minimum range limitation, IOC 1963",
  41: "AIM-7E-2 Dogfight Sparrow with clipped wings for shorter minimum engagement range",
  42: "AIM-7M Sparrow with Mk58 motor, monopulse seeker, and inverse-processed guidance, IOC 1982",
  43: "AIM-92 ATAS Stinger adapted for helicopter air-to-air combat, IR homing, 4.8km range",
  44: "AIM-9B Sidewinder with uncooled IR seeker, rear-aspect only, 4° FOV, IOC 1956",
  45: "AIM-9D Navy Sidewinder with nitrogen-cooled seeker and Mk36 motor for improved range",
  46: "AIM-9J USAF Sidewinder solid-state rebuild of 9B/E with wider engagement cone",
  47: "AIM-9L first all-aspect Sidewinder with AM/FM conical scan seeker, IOC 1977",
  48: "AIM-9M Sidewinder with improved IRCCM, reduced-smoke Mk36 motor, IOC 1983",
  49: "BGM-71A TOW wire-guided SACLOS anti-tank missile, 3km range, 430mm RHA penetration",
  50: "BGM-71C ITOW with extendable standoff probe, 630mm penetration, 3.75km range",
  51: "CBU-87 CEM with WCMD wind-corrected tail kit, 202x BLU-97 submunitions, GPS-aided",
  52: "CBU-97/105 SFW sensor-fuzed weapon, 10x BLU-108 with 40 IR/LADAR anti-armor skeets",
  53: "CBU-52 cluster bomb with 217x BLU-61 fragmentation/incendiary submunitions for area denial",
  54: "CBU-55 fuel-air explosive with 3x BLU-73 propylene oxide canisters, 750lb class",
  55: "CBU-58 cluster bomb with 650x BLU-63 titanium-pellet fragmentation bomblets, incendiary",
  56: "CBU-87 CEM unguided variant, 202x BLU-97 anti-armor/fragmentation/incendiary bomblets",
  57: "FIM-43 Redeye MANPADS, rear-aspect only IR seeker, 4.5km range, Mach 1.7, IOC 1967",
  58: "FIM-92C Stinger RMP with all-aspect rosette scan seeker, 4.8km range, Mach 2.5 speed",
  59: "GBU-10 Paveway II, 2,000lb Mk84 with semi-active laser guidance, 9nm glide range",
  60: "HGK-84 Turkish GPS/INS guidance kit on Mk84 bomb body, 24km range, 6m CEP",
  61: "GBU-15 2,000lb EO/IIR glide bomb with data link for post-release steering, IOC 1983",
  62: "GBU-12 Paveway II, 500lb Mk82 laser-guided bomb, most widely used LGB in combat",
  63: "GBU-24 Paveway III, 2,000lb BLU-109 penetrator with proportional navigation, 11nm range",
  64: "GBU-24E Enhanced Paveway III with GPS/laser dual-mode guidance and BLU-116 penetrator",
  65: "GBU-28 4,700lb deep-penetration LGB, laser-guided, penetrates 50m of earth or 6m concrete",
  66: "EGBU-27 2,000lb BLU-109 penetrator with GPS/laser dual-mode guidance, F-117 compatible",
  67: "GBU-36 GPS-Aided Munition on Mk84, B-2 only, IOC 1997, withdrawn by 1999",
  68: "GBU-31(V)3 JDAM, 2,000lb BLU-109 penetrator body with GPS/INS guidance, 15nm glide",
  69: "GBU-38 JDAM, 500lb Mk82 with GPS/INS guidance, 15nm range, ~5m CEP, primary precision bomb",
  70: "GBU-43/B MOAB 21,600lb thermobaric bomb, 18,700lb H-6 fill, GPS-guided, largest conventional",
  71: "AGM-154A JSOW GPS/INS glide weapon, 145x BLU-97 CEB submunitions, 60nm high-altitude release",
  72: "GBU-49 Enhanced Paveway II, 500lb dual-mode GPS/laser for precision strikes on moving targets",
  73: "GBU-54 LJDAM, 500lb Mk82 with DSU-38 laser seeker added to GPS/INS JDAM guidance",
  74: "GBU-31(V)1 JDAM, 2,000lb Mk84 with GPS/INS guidance, 15nm range, primary heavy JDAM",
  75: "GBU-58 Paveway II, 250lb Mk81 laser-guided bomb for training and light strike missions",
  76: "GBU-39 SDB Small Diameter Bomb, 250lb GPS/INS, 60nm+ glide, penetrates 6ft of concrete",
  77: "GBU-15(V)1/B 2,000lb EO-guided Mk84 bomb with data link, IOC 1983, replaced AGM-62",
  78: "Elbit Lizard/Opher laser/IR-guided bomb kit compatible with Mk80-series bomb bodies",
  79: "MGM-164B ATACMS Block IIA with 6x P3I BAT anti-armor submunitions (programme cancelled)",
  80: "MGM-31A Pershing Ia MRBM, 740km range, W50 nuclear warhead (60-400kt), solid fuel motor",
  81: "MGM-31B Pershing II MRBM, 1,770km range, W85 nuclear, radar-guided MaRV with 30m CEP",
  82: "MIM-104C PAC-2 Patriot SAM, blast-fragmentation warhead, pulse-Doppler fuze, 70km range",
  83: "SL-AMRAAM CLWS, AIM-120 on HUMVEE launcher for point-defense SHORAD role",
  84: "MIM-23B I-HAWK Phase I with improved motor and low-level engagement capability, 40km range",
  85: "MIM-23B I-HAWK Phase II with new body section for improved aerodynamic performance",
  86: "MIM-23B I-HAWK Phase III with new proximity fuze for improved lethality against small targets",
  87: "MIM-23B I-HAWK variant with updated fuzing and limited production run",
  88: "MIM-72C Chaparral with AN/DAW-1B seeker for all-aspect engagement, 9km range",
  89: "MIM-72G Chaparral with rosette scan POST seeker, smokeless motor, and improved IRCCM",
  90: "Mk103 mechanical mine sweep system, helicopter-towed cutter gear for contact mines",
  91: "Mk104 acoustic influence minesweep, helicopter-towed noise generator, IOC 1967",
  92: "Mk105 magnetic influence minesweep, 8,000lb hydrofoil sled towed by helicopter",
  93: "Mk11 depth charge for airborne ASW delivery from helicopters and patrol aircraft",
  94: "Practice loading round (inert) for training naval gun crews on ammunition handling",
  95: "SRBOC Mk214 chaff cartridge, 130mm mortar-launched radar decoy from Mk36 SRBOC",
  96: "SRBOC IR flare decoy cartridge, 130mm, launched from Mk36 SRBOC launcher system",
  97: "Mk104 acoustic sweep variant, helicopter-towed, 1973 service entry, updated electronics",
  98: "Mousetrap ASW rocket launcher, 4-8 rail mount, 7.2\" contact-fuzed ahead-thrown projectiles",
  99: "Sea Gnat improved SRBOC decoy with enhanced chaff and IR seduction capability, 130mm",
  100: "Nulka Mk53 active radar decoy, hovering rocket with broadband RF emitter seducing seekers",
  101: "Limbo Mk10 triple-barrel ahead-throwing ASW mortar, 400-1,000 yd range, depth-fuzed bombs",
  102: "Mk48 Mod 4 heavyweight torpedo, wire-guided + active/passive homing, 55kt speed, 38km range",
  103: "Mk48 Mod 7 CBASS with broadband sonar optimized for littoral and deep-water submarine threats",
  104: "Mk50 ALWT lightweight torpedo, SCEPS closed-cycle propulsion for deep-diving submarine threats",
  105: "Mk60 CAPTOR encapsulated Mk46 torpedo mine, 2,000lb, triggers on submarine acoustic signature",
  106: "Mk62 Quickstrike, 500lb Mk82 bomb converted to bottom influence mine for shallow water",
  107: "Mk65 Quickstrike, 2,000lb purpose-built thin-wall bottom mine for deeper water employment",
  108: "Mk13 torpedo, 22.5\" air-dropped/PT boat weapon, 33.5kt speed, 5,800m range, WWII legacy",
  109: "Mk81 LDGP 250lb general purpose bomb, smallest of the Mk80-series standard munitions",
  110: "Mk82 AIR (BSU-49 Snakeye) 500lb retarded bomb with folding fins for low-level delivery",
  111: "Mk44 lightweight ASW torpedo, 30kt speed, 5.5km range, seawater battery powered, IOC 1960",
  112: "RIM-116B RAM Block 1 with dual-mode passive RF + IR homing, Mach 2+ speed, 9km range",
  113: "RIM-161A SM-3 Block IA exo-atmospheric kinetic warhead interceptor, 600km engagement range",
  114: "RIM-24C Improved Tartar with TRIP solid-state guidance upgrade, SARH homing, 32km range",
  115: "RIM-2 Terrier beam-riding/SARH SAM, Mach 3 speed, 40nm range, retired in 1980s",
  116: "RIM-66A SM-1MR Block I semi-active radar SAM with Mk27 motor, IOC 1967",
  117: "RIM-66E SM-1MR Block VI, final SM-1MR production with improved ECCM and Mk115 warhead",
  118: "RIM-66C SM-2MR Block II with Mk104 dual-thrust motor for AEGIS Mk26 rail launcher ships",
  119: "RIM-66M SM-2MR Block II with Mk104 motor, compatible with AEGIS Mk41 VLS system",
  120: "RIM-66D SM-2MR Block II for legacy Tartar NTU rail launcher-equipped ships",
  121: "RIM-66G SM-2MR Block IIIA with improved low-altitude proximity fuze for AEGIS rail launchers",
  122: "RIM-66M SM-2MR Block IIIB with IR/RF dual-mode terminal seeker for AEGIS VLS ships",
  123: "MIM-72F naval Chaparral, all-aspect IR with smokeless motor for ship self-defense",
  124: "RIM-7F Sea Sparrow, Japanese-built SARH variant for Mk29 folding-fin launcher system",
  125: "RIM-7M Improved Sea Sparrow with monopulse seeker, improved low-altitude performance, VLS capable",
  126: "RIM-8 Talos ramjet SAM, Mach 2.5, 130nm range, nuclear or conventional warhead, retired 1979",
  127: "RGM-66D Standard ARM, surface-launched anti-radiation variant for anti-radar missions",
  128: "UGM-109E Tomahawk Block IV, GPS/INS cruise missile, 900nm range, 2-way SATCOM, loiter capable",
  129: "UGM-133A Trident II D5 three-stage SLBM, 6,000nm range, MIRV W76/W88 nuclear warheads",
  130: "UGM-84A Sub-Harpoon Block IC anti-ship missile, 120nm range, sea-skimming, 220kg warhead",
  131: "UGM-84D Sub-Harpoon with waypoint navigation and re-attack mode, JP-10 fuel for range",
  132: "UGM-96A Trident I C-4 three-stage SLBM, 4,000nm range, 8x W76 MIRV warheads",
};

// ─── SENSOR DESCRIPTIONS ──────────────────────────────────────────
// With 576 sensors, we'll generate smart descriptions from names/existing desc
// Focus on differentiating variant families
const sensorDescOverrides = {};
// We'll use a script to generate these from naming patterns

// ─── FACILITY DESCRIPTIONS ────────────────────────────────────────
const facilitiesDesc = {
  1: "2x M163A1 Vulcan 20mm SPAAG on M113 hull, 3000 rpm, 1.2km effective range",
  2: "2x M163A2 PIVADS 20mm SPAAG, upgraded powertrain over A1, 3000 rpm",
  3: "2x M167 towed 20mm Vulcan, 1000-3000 rpm selectable, 1.2km effective range",
  4: "Centurion C-RAM with 20mm Phalanx 1B, 4500 rpm, HEIT-SD self-destruct rounds",
  5: "4x M1 Abrams with 105mm M68 rifled gun and Chobham composite armor",
  6: "3x M1128 Stryker MGS with 105mm autoloaded cannon, 18 ready rounds",
  7: "4x M1A1 Abrams with 120mm M256 smoothbore and depleted uranium armor",
  8: "4x M1A2 Abrams with CITV, digital fire control, and 120mm smoothbore",
  9: "4x M1A2 SEP with FBCB2 digital systems, improved cooling, and 2nd-gen FLIR",
  10: "4x M60A3 TTS with AN/VSG-2 thermal sight, laser rangefinder, 105mm M68 gun",
  11: "6x M101 towed 105mm/22-cal howitzer, 11km range, WWII-era, 2.3 tons",
  12: "6x M102 towed 105mm/32-cal howitzer, 11.5km range, 1.5 tons, air-droppable",
  13: "6x M109A3 155mm/23-cal SP howitzer with NBC/RAM upgrades over baseline",
  14: "6x M109A5 155mm/39-cal SP howitzer, M284 cannon, 30km range with RAP",
  15: "6x M109A6 Paladin 155mm/39-cal SP with GPS nav and autonomous shoot-and-scoot",
  16: "6x M109A7 Paladin PIM with Bradley drivetrain and electric gun drives",
  17: "6x M198 towed 155mm/39-cal, 30km range with RAP, 7.2-ton steel construction",
  18: "6x M777 towed 155mm/39-cal, 24.7km standard range, 4.2-ton titanium build",
  19: "6x M110 203mm/25-cal SP howitzer, 21.3km range, heaviest US Army tube artillery",
  20: "HIMARS platoon (3x per battery) with 6-round GMLRS pods, 70+km range",
  21: "MLRS platoon (3x per battery) with 12-round GMLRS pods, 70+km range",
  22: "SOSUS fixed seabed hydrophone array for passive long-range submarine detection",
  23: "AN/FLR-9 CDAA HF/DF station, 8 sites, large circular antenna for SIGINT/DF",
  24: "AN/FRD-10 Classic Bullseye CDAA, 14 Navy sites, 270m diameter dual-ring antenna",
  25: "Delta Force troop with AN/PAQ-1 laser designation, no sabotage role",
  26: "SF ODA (A-Team) with AN/PAQ-1 LTD, sabotage and laser designation capable",
  27: "Marine Raider/MSOR team with AN/PAQ-1 LTD, sabotage and laser designation",
  28: "Ranger platoon with AN/PAQ-1 laser designator and 60mm organic mortar",
  29: "Standard US Army infantry platoon, ~40 soldiers with small arms",
  30: "Standard US Marine Corps infantry platoon, ~40 Marines with small arms",
  31: "Navy SEAL platoon with sabotage and AN/PAQ-1 laser designation capability",
  32: "Delta recon team with AN/PAQ-1 LTD for target laser designation only",
  33: "Delta saboteur team for behind-lines demolition and direct action",
  34: "Delta combined team with both sabotage and AN/PAQ-1 laser designation",
  35: "Forward air controller section with AN/PAQ-1 LTD for CAS coordination",
  36: "SF split ODA half-team with AN/PAQ-1 LTD for laser target designation",
  37: "SF split ODA half-team specialized in sabotage and demolition operations",
  38: "Marine Force Recon team with AN/PAQ-1 LTD for deep reconnaissance",
  39: "Marine Raider/MSOR section with AN/PAQ-1 LTD for laser designation",
  40: "USAF Pararescue (PJ) team for combat search and rescue operations",
  41: "Ranger fire team (4 soldiers), no laser designator, smallest tactical element",
  42: "Ranger Regimental Recon team with AN/PAQ-1 LTD for target designation",
  43: "Ranger squad organized as air assault chalk, no laser designator",
  44: "Navy SEAL recon team with AN/PAQ-1 LTD for laser target designation",
  45: "Navy SEAL recon team without laser designator, reconnaissance only",
  46: "Navy SEAL squad with both sabotage and AN/PAQ-1 laser designation",
  47: "Navy SEAL team with sabotage capability only, no laser designator",
  48: "4x LAV-25 8x8 wheeled recon vehicles with 25mm M242 Bushmaster cannon",
  49: "3x M1126 Stryker ICV with RWS (.50 cal or Mk19), 8x8 wheeled APC",
  50: "4x M113A1 tracked APC with .50 cal, aluminum armor, diesel engine",
  51: "4x M113A2 APC with improved engine cooling, suspension, and fuel system",
  52: "4x M113A3 APC with turbocharged 275hp diesel and external fuel tanks",
  53: "4x M2 Bradley IFV with 25mm Bushmaster, TOW, and 7.62mm coax",
  54: "4x M2A1 Bradley with TOW-2 missiles, NBC system, and fire suppression",
  55: "4x M2A2 Bradley with 600hp engine, 30mm-rated armor, spall liners",
  56: "4x M2A3 Bradley with 2nd-gen FLIR, digital C4I, and titanium roof armor",
  57: "4x M3 Bradley CFV for cavalry scout role, extra TOW/ammo stowage, 2 scouts",
  58: "4x M3A1 CFV with TOW-2 launcher, NBC protection, fire suppression",
  59: "4x M3A2 CFV with 600hp engine and enhanced armor protection package",
  60: "4x M3A3 CFV with digital battle management, 2nd-gen FLIR, full C4I suite",
  61: "Generic US Army mechanized infantry platoon, vehicle type unspecified",
  62: "3x XM1296 Stryker Dragoon with 30mm XM813 Bushmaster II autocannon",
  63: "3x AAV-P7/A1 amphibious assault vehicle with .50 cal and Mk19 40mm grenade launcher",
  64: "AN/FPS-108 Cobra Dane L-band phased array at Shemya AK, 136-deg coverage, 3200km range",
  65: "AN/FPS-115 PAVE PAWS upgraded to UEWR for Ground-Based Midcourse Defense",
  66: "AN/FPS-115 PAVE PAWS dual-face UHF phased array for SLBM/ICBM detection, 3000mi range",
  67: "AN/FPS-117(V)4 Seek Igloo long-range L-band NWS radar, 250nm range, Arctic air defense",
  68: "AN/FPS-117(V)5 relocatable L-band radar, 4 deployed on Iceland",
  69: "AN/FPS-118 OTH-B HF skywave radar for wide-area beyond-the-horizon surveillance",
  70: "AN/FPS-120 BMEWS Site I at Thule, Greenland, dual-face UHF phased array",
  71: "AN/FPS-123 BMEWS Site II at Clear, Alaska, upgraded PAVE PAWS phased array",
  72: "AN/FPS-124 Seek Frost short-range unattended NWS gap-filler radar, D-band, 70mi range",
  73: "AN/FPS-126 BMEWS Site III at RAF Fylingdales, UK, three-face UHF phased array",
  74: "AN/FPS-130 long-range discrimination radar, 3 units, S-band for BMD tracking",
  75: "AN/FPS-49 legacy BMEWS tracking radar at Fylingdales, replaced by FPS-126",
  76: "AN/FPS-50 legacy BMEWS detection radars at Clear AFB, 3x 120-deg fence antennas",
  77: "AN/FPS-66 medium-range S-band air surveillance search radar",
  78: "AN/FPS-85 UHF phased array at Eglin AFB, 32MW peak, space surveillance to 22,000nm",
  79: "AN/FPS-92 legacy BMEWS tracking radar at Clear AFB, 26m steerable dish in radome",
  80: "AN/FPS-93 Safeguard PAR for perimeter ballistic missile acquisition, 2000mi range",
  81: "AN/FPS-93A improved PAR variant with upgraded signal processing",
  82: "AN/MPQ-49 FAAR pulse-Doppler radar, 20km range, cues Chaparral/Vulcan SHORAD",
  83: "AN/MPQ-64 Sentinel 3D X-band phased array, 40-75km range, SHORAD target acquisition",
  84: "AN/MPS-14 mobile height-finder radar (mobile FPS-6), S-band, 200nm range",
  85: "AN/MSQ-46 battlefield surveillance radar for ground target tracking",
  86: "AN/TPQ-36 Firefinder short-range counter-battery radar, locates mortars and rockets",
  87: "AN/TPQ-36A Firefinder variant on loan to NASAMS firing units for cueing",
  88: "AN/TPQ-37 Firefinder long-range counter-battery radar, 3-50km artillery location",
  89: "AN/TPQ-43 Seek Score deployable tactical radar for air surveillance",
  90: "AN/TPS-32 3D S-band long-range USMC tactical radar, 370km range, helicopter-transportable",
  91: "AN/TPS-43E deployable 3D S-band air surveillance radar, 240nm range, truck-mobile",
  92: "AN/TPS-59(V)3 anti-TBM variant, tracks ballistic missiles to 400nm and aircraft to 300nm",
  93: "AN/TPS-59 long-range 3D USMC air surveillance radar, 11 units fielded",
  94: "AN/TPS-63 LASS surveillance radar on tethered aerostat, 5 units, border/drug surveillance",
  95: "AN/TPS-63 ground-based 2D L-band tactical surveillance radar for USMC/USAF",
  96: "AN/TPS-71 ROTHR Navy over-the-horizon HF radar for counter-narcotics, Caribbean coverage",
  97: "AN/TPS-73 MATCALS precision approach radar for Marine expeditionary air traffic control",
  98: "AN/TPS-75 deployable 3D S-band air defense radar, 240nm range, 57 fielded, truck-mobile",
  99: "AN/TPS-77 upgraded FPS-117 replacement with improved digital processing",
  100: "AN/TPS-80 G/ATOR GaN AESA multi-role Marine radar, replaces 5 legacy systems",
  101: "AN/TPY-2 transportable X-band AESA radar for THAAD, up to 3000km detection range",
  102: "AN/UPS-3 Sentry TDAR aerostat-mounted radar, 41 units, border/drug surveillance",
  103: "ARSR-4 L-band joint FAA/military long-range air route surveillance radar, 42 sites",
  104: "ASR-9 airport surveillance radar for military ground-controlled approach operations",
  105: "JLENS VHF-band aerostat surveillance radar, 340mi coverage, paired with X-band FCR",
  106: "JLENS X-band aerostat fire control radar, precision tracking for cruise missile defense",
  107: "I-HAWK baseline battery with original AN/MPQ-50 PAR and MIM-23B missiles",
  108: "I-HAWK Phase 1 battery with improved ICWAR AN/MPQ-55 and digital MTI",
  109: "I-HAWK Phase 2 battery with TAS electro-optical tracker for ECCM capability",
  110: "I-HAWK Phase 3 USMC high-mobility battery with LASHE multi-target engagement",
  111: "I-HAWK Phase 3 battery with TAS and AN/MPQ-61 HPI, LASHE capable",
  112: "Nike Hercules MIM-14 battery, solid-fuel SAM, 140km range, Cold War area defense",
  113: "Patriot baseline battery with AN/MPQ-53 radar, 6 launchers, anti-aircraft only",
  114: "PAC-1 Patriot with software upgrade for limited TBM engagement, 6 launchers",
  115: "PAC-2 GEM Patriot with upgraded seeker for improved anti-TBM intercept, 6 launchers",
  116: "PAC-2 GEM+ battery mixed with PAC-3 hit-to-kill interceptors (16 per launcher)",
  117: "PAC-2 GEM+ battery with PAC-3 MSE extended-range interceptors, AN/MPQ-65 radar",
  118: "PAC-2 GEM+ Patriot with improved low-RCS target engagement, 6 launchers",
  119: "PAC-2 Patriot with initial anti-TBM software and blast-frag warhead, 6 launchers",
  120: "THAAD battery: 6 launchers, 48 hit-to-kill interceptors, AN/TPY-2 radar, 150-200km range",
  121: "HUMRAAM: HUMVEE-mounted AMRAAM launchers for Marine LAAD SHORAD, ~25km range",
  122: "I-HAWK baseline firing platoon with original MIM-23B launchers and radars",
  123: "I-HAWK Phase 1 platoon with improved ICWAR acquisition radar",
  124: "I-HAWK Phase 2 platoon with TAS electro-optical tracking adjunct",
  125: "I-HAWK Phase 3 platoon with TAS and LASHE multi-target engagement capability",
  126: "NASAMS platoon: 3 AMRAAM launchers + AN/TPQ-36A radar + NTAS EO sensor",
  127: "2x M48 Chaparral with 4 MIM-72 heat-seeking SAMs each, Sidewinder-derived",
  128: "NASAMS II half-platoon: 2 AMRAAM launchers + MSP-500 EO/IR tracker per platoon",
  129: "AN/TWQ-1 Avenger HUMVEE with 8x Stinger SAMs and .50 cal M3P MG",
  130: "M6 Bradley Linebacker with 4x Stinger SAMs, 25mm Bushmaster, on M2A2 chassis",
  131: "LAV-AD with 8x Stinger SAMs and GAU-12 25mm Gatling for Marine SHORAD",
  132: "4x FIM-43 Redeye MANPADS gunners, IR tail-chase only, 4.5km range",
  133: "5x FIM-92 Stinger MANPADS team, all-aspect IR/UV seeker, 4.8km range",
  134: "AEGIS Ashore with 24x SM-3 Block IIA interceptors in Mk41 VLS cells",
  135: "Ground-Based Interceptor CE-I in silo for homeland ICBM defense, early EKV variant",
  136: "GBI CE-II Block 0 with upgraded EKV and improved guidance components",
  137: "GBI CE-II Block 1 with alternate divert thrusters on latest kill vehicle",
  138: "MSP-500 stabilized EO/IR sensor with laser rangefinder for NASAMS II fire control",
  139: "NTAS FLIR/laser rangefinder passive tracking sensor for NASAMS fire control",
  140: "GLCM flight: 4 TELs with 16x BGM-109G Gryphon nuclear cruise missiles, 2500km range",
  141: "3x FGM-148 Javelin fire-and-forget ATGM, top-attack tandem HEAT, 2.5-4km range",
  142: "MGM-52C Lance tactical ballistic missile, 129km range, conventional cluster/shaped warhead",
  143: "Pershing 1A mobile SRBM, 740km range, W50 nuclear warhead, inertial guidance",
  144: "Pershing II mobile MRBM, 1770km range, radar terminal guidance, 30m CEP",
  145: "LGM-30F Minuteman II ICBM in hardened silo, single W56 1.2MT warhead, 12500km range",
  146: "LGM-30G Minuteman III ICBM in silo, up to 3 MIRV W78/W87 warheads, 13000km range",
  147: "LGM-118 Peacekeeper ICBM in silo, 10x W87 300kT MIRV warheads, 9600km range",
  148: "LGM-25C Titan II ICBM in silo, single W53 9MT warhead, 15000km range",
  149: "Ground launch facility for BQM-74 Chukar subsonic target drones, JATO-boosted",
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
