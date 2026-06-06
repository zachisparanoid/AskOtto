/**
 * Curated master list of automotive forum domains (≈189 entries, well above the
 * 150 minimum) plus the query-time selection logic.
 *
 * Weight convention:
 *   1 — generic / cross-brand mechanic & DIY communities (the "always-include" pool)
 *   2 — brand-general forums
 *   3 — high-signal model-specific or powertrain-specific forums
 *
 * Match metadata (`makes` / `models` / `powertrains`) extends the bare
 * {domain,name,weight} shape so selection can rank by specificity. Tokens are
 * lowercase. `domain` is the Google `site:` target (reddit entries include the
 * subreddit path, which Google honors).
 */

export interface Forum {
  domain: string;
  name: string;
  weight: 1 | 2 | 3;
  /** Makes (canonical, lowercase) this forum covers. Omitted for generic pool. */
  makes?: string[];
  /** Model/keyword tokens, lowercase. */
  models?: string[];
  /** Powertrain keywords that, if present in the issue text, boost this forum. */
  powertrains?: string[];
}

export const FORUMS: Forum[] = [
  // ── Generic / mechanic / DIY (always-include pool, weight 1) ──────────────
  { domain: "reddit.com/r/MechanicAdvice", name: "r/MechanicAdvice", weight: 1 },
  { domain: "reddit.com/r/AskMechanics", name: "r/AskMechanics", weight: 1 },
  { domain: "reddit.com/r/Cartalk", name: "r/Cartalk", weight: 1 },
  { domain: "reddit.com/r/Justrolledintotheshop", name: "r/Justrolledintotheshop", weight: 1 },
  { domain: "reddit.com/r/Autobody", name: "r/Autobody", weight: 1 },
  { domain: "reddit.com/r/Cars", name: "r/Cars", weight: 1 },
  { domain: "reddit.com/r/Trucks", name: "r/Trucks", weight: 1 },
  { domain: "garagejournal.com", name: "The Garage Journal", weight: 1 },
  { domain: "bobistheoilguy.com", name: "Bob Is The Oil Guy", weight: 1 },
  { domain: "justanswer.com", name: "JustAnswer (Car)", weight: 1 },
  { domain: "carcomplaints.com", name: "CarComplaints", weight: 1 },
  { domain: "automotiveforums.com", name: "AutomotiveForums.com", weight: 1 },
  { domain: "secondchancegarage.com", name: "Second Chance Garage", weight: 1 },
  { domain: "hotrodders.com", name: "Hot Rodders Bulletin Board", weight: 1 },

  // ── GM — full-size trucks / SUVs ──────────────────────────────────────────
  { domain: "gm-trucks.com", name: "GM-Trucks", weight: 3, makes: ["gmc", "chevrolet"], models: ["sierra", "silverado", "denali", "duramax"], powertrains: ["duramax", "diesel"] },
  { domain: "silveradosierra.com", name: "Silverado Sierra Forum", weight: 3, makes: ["chevrolet", "gmc"], models: ["silverado", "sierra", "1500", "2500", "3500"] },
  { domain: "gmtruckclub.com", name: "GM Truck Club", weight: 3, makes: ["gmc", "chevrolet"], models: ["sierra", "silverado", "tahoe", "suburban"] },
  { domain: "chevroletforum.com", name: "Chevrolet Forum", weight: 2, makes: ["chevrolet"] },
  { domain: "tahoeyukonforum.com", name: "Tahoe Yukon Forum", weight: 3, makes: ["chevrolet", "gmc"], models: ["tahoe", "yukon", "suburban", "denali"] },
  { domain: "chevyavalanchefanclub.com", name: "Chevy Avalanche Fan Club", weight: 3, makes: ["chevrolet"], models: ["avalanche"] },
  { domain: "coloradofans.com", name: "Colorado Fans", weight: 3, makes: ["chevrolet", "gmc"], models: ["colorado", "canyon"] },
  { domain: "67-72chevytrucks.com", name: "1967–72 Chevy Trucks", weight: 3, makes: ["chevrolet", "gmc"], models: ["c10", "k10", "c20", "truck"] },
  { domain: "gbodyforum.com", name: "GBodyForum", weight: 3, makes: ["chevrolet", "oldsmobile", "buick", "pontiac"], models: ["monte carlo", "regal", "cutlass", "el camino", "malibu", "grand national", "gbody"] },
  { domain: "reddit.com/r/gmtrucks", name: "r/gmtrucks", weight: 2, makes: ["gmc", "chevrolet"], models: ["sierra", "silverado"] },

  // ── GM — cars / performance ───────────────────────────────────────────────
  { domain: "chevytalk.org", name: "ChevyTalk", weight: 2, makes: ["chevrolet"] },
  { domain: "ls1tech.com", name: "LS1Tech", weight: 3, makes: ["chevrolet", "pontiac"], models: ["camaro", "firebird", "gto", "corvette", "trans am"], powertrains: ["ls1", "ls", "lsx"] },
  { domain: "corvetteforum.com", name: "Corvette Forum", weight: 3, makes: ["chevrolet"], models: ["corvette", "c5", "c6", "c7", "c8"] },
  { domain: "camaro5.com", name: "Camaro5", weight: 3, makes: ["chevrolet"], models: ["camaro"] },
  { domain: "camaro6.com", name: "Camaro6", weight: 3, makes: ["chevrolet"], models: ["camaro"] },
  { domain: "thirdgen.org", name: "ThirdGen", weight: 3, makes: ["chevrolet", "pontiac"], models: ["camaro", "firebird", "trans am"] },
  { domain: "impalassforum.com", name: "Impala SS Forum", weight: 3, makes: ["chevrolet"], models: ["impala"] },
  { domain: "montecarloss.com", name: "Monte Carlo SS Forum", weight: 3, makes: ["chevrolet"], models: ["monte carlo"] },
  { domain: "cadillacforums.com", name: "Cadillac Forums", weight: 2, makes: ["cadillac"] },
  { domain: "reddit.com/r/Chevy", name: "r/Chevy", weight: 2, makes: ["chevrolet"] },

  // ── Ford — trucks / diesel ────────────────────────────────────────────────
  { domain: "f150forum.com", name: "F150 Forum", weight: 3, makes: ["ford"], models: ["f150", "f-150"] },
  { domain: "f150online.com", name: "F-150 Online", weight: 3, makes: ["ford"], models: ["f150", "f-150"] },
  { domain: "ford-trucks.com", name: "Ford-Trucks", weight: 3, makes: ["ford"], models: ["f150", "f250", "f350", "super duty", "ranger", "excursion"], powertrains: ["powerstroke", "diesel"] },
  { domain: "fordforumsonline.com", name: "Ford Forums Online", weight: 2, makes: ["ford"] },
  { domain: "fordf150.net", name: "FordF150.net", weight: 3, makes: ["ford"], models: ["f150", "f-150"] },
  { domain: "powerstroke.org", name: "Power Stroke Diesel Forum", weight: 3, makes: ["ford"], models: ["f250", "f350", "super duty", "excursion"], powertrains: ["powerstroke", "diesel", "6.0", "7.3", "6.7", "6.4"] },
  { domain: "powerstrokenation.com", name: "Powerstroke Nation", weight: 3, makes: ["ford"], models: ["f250", "f350", "super duty"], powertrains: ["powerstroke", "diesel", "6.0", "7.3", "6.7"] },
  { domain: "thedieselstop.com", name: "The Diesel Stop", weight: 3, makes: ["ford"], models: ["f250", "f350", "super duty"], powertrains: ["powerstroke", "diesel", "7.3", "6.0"] },
  { domain: "ranger-forums.com", name: "Ranger Forums", weight: 3, makes: ["ford"], models: ["ranger"] },
  { domain: "bronco6g.com", name: "Bronco6G", weight: 3, makes: ["ford"], models: ["bronco"] },
  { domain: "fordraptorforum.com", name: "Ford Raptor Forum", weight: 3, makes: ["ford"], models: ["raptor", "f150", "f-150"] },
  { domain: "mavericktruckclub.com", name: "Maverick Truck Club", weight: 3, makes: ["ford"], models: ["maverick"] },
  { domain: "reddit.com/r/f150", name: "r/f150", weight: 2, makes: ["ford"], models: ["f150", "f-150"] },

  // ── Ford — cars / Mustang ─────────────────────────────────────────────────
  { domain: "mustang6g.com", name: "Mustang6G", weight: 3, makes: ["ford"], models: ["mustang", "gt", "ecoboost"] },
  { domain: "themustangsource.com", name: "The Mustang Source", weight: 3, makes: ["ford"], models: ["mustang"] },
  { domain: "allfordmustangs.com", name: "All Ford Mustangs", weight: 3, makes: ["ford"], models: ["mustang"] },
  { domain: "stangnet.com", name: "StangNet", weight: 3, makes: ["ford"], models: ["mustang", "fox body", "foxbody"] },
  { domain: "vintage-mustang.com", name: "Vintage Mustang Forums", weight: 3, makes: ["ford"], models: ["mustang"] },
  { domain: "explorerforum.com", name: "Explorer Forum", weight: 3, makes: ["ford"], models: ["explorer", "sport trac"] },
  { domain: "focusfanatics.com", name: "Focus Fanatics", weight: 3, makes: ["ford"], models: ["focus"] },
  { domain: "fiestastforum.com", name: "Fiesta ST Forum", weight: 3, makes: ["ford"], models: ["fiesta"] },

  // ── Mopar — Dodge / RAM / Chrysler ────────────────────────────────────────
  { domain: "dodgeforum.com", name: "Dodge Forum", weight: 2, makes: ["dodge", "ram"] },
  { domain: "ramforum.com", name: "RAM Forum", weight: 3, makes: ["ram", "dodge"], models: ["ram", "1500", "2500", "3500"] },
  { domain: "ramforumz.com", name: "RamForumz", weight: 3, makes: ["ram", "dodge"], models: ["ram", "1500", "2500", "3500"] },
  { domain: "dodgetalk.com", name: "DodgeTalk", weight: 2, makes: ["dodge", "ram"] },
  { domain: "cumminsforum.com", name: "Cummins Forum", weight: 3, makes: ["dodge", "ram"], models: ["2500", "3500", "ram"], powertrains: ["cummins", "diesel", "5.9", "6.7"] },
  { domain: "dodgecummins.com", name: "Dodge Cummins", weight: 3, makes: ["dodge", "ram"], models: ["2500", "3500", "ram"], powertrains: ["cummins", "diesel", "5.9", "6.7"] },
  { domain: "dieseltruckresource.com", name: "Diesel Truck Resource", weight: 3, makes: ["dodge", "ram", "ford", "chevrolet", "gmc"], powertrains: ["cummins", "diesel", "powerstroke", "duramax"] },
  { domain: "moparforums.com", name: "Mopar Forums", weight: 2, makes: ["dodge", "chrysler", "ram", "jeep", "plymouth"] },
  { domain: "challengertalk.com", name: "Challenger Talk", weight: 3, makes: ["dodge"], models: ["challenger", "hellcat", "srt"] },
  { domain: "chargerforums.com", name: "Charger Forums", weight: 3, makes: ["dodge"], models: ["charger", "hellcat", "srt"] },
  { domain: "durangoforum.com", name: "Durango Forum", weight: 3, makes: ["dodge"], models: ["durango"] },
  { domain: "reddit.com/r/Dodge", name: "r/Dodge", weight: 2, makes: ["dodge", "ram"] },

  // ── Jeep ──────────────────────────────────────────────────────────────────
  { domain: "jeepforum.com", name: "JeepForum", weight: 2, makes: ["jeep"] },
  { domain: "wranglerforum.com", name: "Wrangler Forum", weight: 3, makes: ["jeep"], models: ["wrangler", "jk", "jl", "tj", "yj"] },
  { domain: "jlwranglerforums.com", name: "JL Wrangler Forums", weight: 3, makes: ["jeep"], models: ["wrangler", "jl", "gladiator"] },
  { domain: "jkowners.com", name: "JK Owners", weight: 3, makes: ["jeep"], models: ["wrangler", "jk"] },
  { domain: "cherokeeforum.com", name: "Cherokee Forum", weight: 3, makes: ["jeep"], models: ["cherokee", "grand cherokee", "xj", "wj", "wk"] },
  { domain: "jeepgarage.org", name: "Jeep Garage", weight: 2, makes: ["jeep"] },
  { domain: "reddit.com/r/Jeep", name: "r/Jeep", weight: 2, makes: ["jeep"] },

  // ── Toyota / Lexus / Scion ────────────────────────────────────────────────
  { domain: "tacomaworld.com", name: "Tacoma World", weight: 3, makes: ["toyota"], models: ["tacoma"] },
  { domain: "tundratalk.net", name: "Tundra Talk", weight: 3, makes: ["toyota"], models: ["tundra"] },
  { domain: "tundras.com", name: "Tundras.com", weight: 3, makes: ["toyota"], models: ["tundra"] },
  { domain: "toyotanation.com", name: "Toyota Nation", weight: 2, makes: ["toyota"] },
  { domain: "yotatech.com", name: "YotaTech", weight: 2, makes: ["toyota"], models: ["tacoma", "4runner", "tundra", "pickup", "hilux"] },
  { domain: "toyota-4runner.org", name: "Toyota 4Runner Forum", weight: 3, makes: ["toyota"], models: ["4runner"] },
  { domain: "t4r.org", name: "4Runners (T4R)", weight: 3, makes: ["toyota"], models: ["4runner"] },
  { domain: "ih8mud.com", name: "IH8MUD (Land Cruiser)", weight: 3, makes: ["toyota"], models: ["land cruiser", "landcruiser", "fj", "fj40", "fj60", "fj80", "100 series"] },
  { domain: "priuschat.com", name: "PriusChat", weight: 3, makes: ["toyota"], models: ["prius"], powertrains: ["hybrid"] },
  { domain: "rav4world.com", name: "RAV4World", weight: 3, makes: ["toyota"], models: ["rav4"] },
  { domain: "clublexus.com", name: "ClubLexus", weight: 2, makes: ["lexus"] },
  { domain: "lexusownersclub.com", name: "Lexus Owners Club", weight: 2, makes: ["lexus"] },
  { domain: "ft86club.com", name: "FT86Club (86 / BRZ)", weight: 3, makes: ["toyota", "subaru", "scion"], models: ["86", "gt86", "brz", "frs", "gr86"] },
  { domain: "fjcruiserforums.com", name: "FJ Cruiser Forums", weight: 3, makes: ["toyota"], models: ["fj cruiser", "fj"] },
  { domain: "reddit.com/r/Toyota", name: "r/Toyota", weight: 2, makes: ["toyota"] },

  // ── Honda / Acura ─────────────────────────────────────────────────────────
  { domain: "honda-tech.com", name: "Honda-Tech", weight: 2, makes: ["honda"] },
  { domain: "civicx.com", name: "CivicX (10th gen Civic)", weight: 3, makes: ["honda"], models: ["civic"] },
  { domain: "8thcivic.com", name: "8th Gen Civic Forum", weight: 3, makes: ["honda"], models: ["civic"] },
  { domain: "driveaccord.net", name: "Drive Accord", weight: 3, makes: ["honda"], models: ["accord"] },
  { domain: "crvownersclub.com", name: "CR-V Owners Club", weight: 3, makes: ["honda"], models: ["cr-v", "crv"] },
  { domain: "elementownersclub.com", name: "Element Owners Club", weight: 3, makes: ["honda"], models: ["element"] },
  { domain: "s2ki.com", name: "S2KI (S2000)", weight: 3, makes: ["honda"], models: ["s2000"] },
  { domain: "nsxprime.com", name: "NSX Prime", weight: 3, makes: ["acura", "honda"], models: ["nsx"] },
  { domain: "acurazine.com", name: "AcuraZine", weight: 2, makes: ["acura"] },
  { domain: "clubrsx.com", name: "Club RSX", weight: 3, makes: ["acura"], models: ["rsx", "integra"] },
  { domain: "ridgelineownersclub.com", name: "Ridgeline Owners Club", weight: 3, makes: ["honda"], models: ["ridgeline"] },
  { domain: "fitfreak.net", name: "Fit Freak", weight: 3, makes: ["honda"], models: ["fit", "jazz"] },
  { domain: "reddit.com/r/Honda", name: "r/Honda", weight: 2, makes: ["honda"] },

  // ── Nissan / Infiniti ─────────────────────────────────────────────────────
  { domain: "nicoclub.com", name: "NICOclub", weight: 2, makes: ["nissan", "infiniti"] },
  { domain: "titantalk.com", name: "Titan Talk", weight: 3, makes: ["nissan"], models: ["titan"] },
  { domain: "clubfrontier.org", name: "Club Frontier", weight: 3, makes: ["nissan"], models: ["frontier"] },
  { domain: "thenewx.org", name: "The New X (Xterra)", weight: 3, makes: ["nissan"], models: ["xterra"] },
  { domain: "maxima.org", name: "Maxima.org", weight: 3, makes: ["nissan"], models: ["maxima"] },
  { domain: "my350z.com", name: "My350Z", weight: 3, makes: ["nissan"], models: ["350z"] },
  { domain: "the370z.com", name: "The370Z", weight: 3, makes: ["nissan"], models: ["370z"] },
  { domain: "nissanforums.com", name: "Nissan Forums", weight: 2, makes: ["nissan"] },
  { domain: "g35driver.com", name: "G35Driver (Infiniti)", weight: 3, makes: ["infiniti", "nissan"], models: ["g35", "g37"] },
  { domain: "myg37.com", name: "MyG37", weight: 3, makes: ["infiniti"], models: ["g37"] },

  // ── Subaru ────────────────────────────────────────────────────────────────
  { domain: "nasioc.com", name: "NASIOC", weight: 3, makes: ["subaru"], models: ["impreza", "wrx", "sti"] },
  { domain: "subaruforester.org", name: "Subaru Forester Owners Forum", weight: 3, makes: ["subaru"], models: ["forester"] },
  { domain: "subaruoutback.org", name: "Subaru Outback Forums", weight: 3, makes: ["subaru"], models: ["outback"] },
  { domain: "legacygt.com", name: "Legacy GT", weight: 3, makes: ["subaru"], models: ["legacy"] },
  { domain: "subaruxvforum.com", name: "Subaru XV Forum", weight: 3, makes: ["subaru"], models: ["xv", "crosstrek"] },
  { domain: "iwsti.com", name: "IWSTI (WRX STI)", weight: 3, makes: ["subaru"], models: ["wrx", "sti", "impreza"] },
  { domain: "ultimatesubaru.org", name: "Ultimate Subaru Message Board", weight: 2, makes: ["subaru"] },
  { domain: "reddit.com/r/subaru", name: "r/subaru", weight: 2, makes: ["subaru"] },

  // ── Mazda ─────────────────────────────────────────────────────────────────
  { domain: "miata.net", name: "Miata.net", weight: 3, makes: ["mazda"], models: ["miata", "mx-5", "mx5"] },
  { domain: "mazda3forums.com", name: "Mazda3 Forums", weight: 3, makes: ["mazda"], models: ["mazda3", "3"] },
  { domain: "mazda3revolution.com", name: "Mazda3 Revolution", weight: 3, makes: ["mazda"], models: ["mazda3", "3"] },
  { domain: "mazdas247.com", name: "Mazdas247", weight: 2, makes: ["mazda"] },
  { domain: "rx7club.com", name: "RX7Club", weight: 3, makes: ["mazda"], models: ["rx-7", "rx7"], powertrains: ["rotary"] },
  { domain: "rx8club.com", name: "RX8Club", weight: 3, makes: ["mazda"], models: ["rx-8", "rx8"], powertrains: ["rotary"] },
  { domain: "cx5forum.com", name: "CX-5 Forum", weight: 3, makes: ["mazda"], models: ["cx-5", "cx5"] },

  // ── BMW / MINI ────────────────────────────────────────────────────────────
  { domain: "bimmerfest.com", name: "Bimmerfest", weight: 2, makes: ["bmw"] },
  { domain: "bimmerforums.com", name: "Bimmer Forums", weight: 2, makes: ["bmw"] },
  { domain: "e46fanatics.com", name: "E46Fanatics", weight: 3, makes: ["bmw"], models: ["3 series", "e46", "m3", "325i", "330i"] },
  { domain: "e90post.com", name: "E90Post", weight: 3, makes: ["bmw"], models: ["3 series", "e90", "e92", "335i", "328i", "m3"] },
  { domain: "f30post.com", name: "F30Post", weight: 3, makes: ["bmw"], models: ["3 series", "f30", "328i", "335i", "340i"] },
  { domain: "bimmerpost.com", name: "BimmerPost", weight: 2, makes: ["bmw"] },
  { domain: "xbimmers.com", name: "Xbimmers (X-series)", weight: 3, makes: ["bmw"], models: ["x1", "x3", "x5", "x6", "x7"] },
  { domain: "r3vlimited.com", name: "R3VLimited (E30)", weight: 3, makes: ["bmw"], models: ["e30", "3 series", "325i", "318i"] },
  { domain: "1addicts.com", name: "1Addicts (1 Series)", weight: 3, makes: ["bmw"], models: ["1 series", "128i", "135i"] },
  { domain: "northamericanmotoring.com", name: "North American Motoring (MINI)", weight: 3, makes: ["mini"], models: ["cooper", "mini", "clubman", "countryman"] },

  // ── Mercedes-Benz ─────────────────────────────────────────────────────────
  { domain: "benzworld.org", name: "BenzWorld", weight: 2, makes: ["mercedes"] },
  { domain: "mbworld.org", name: "MBWorld", weight: 2, makes: ["mercedes"] },
  { domain: "peachparts.com", name: "PeachParts (Mercedes Shop)", weight: 2, makes: ["mercedes"], powertrains: ["diesel", "om617", "om606"] },
  { domain: "mercedesforum.com", name: "Mercedes Forum", weight: 2, makes: ["mercedes"] },
  { domain: "sprinter-source.com", name: "Sprinter Source", weight: 3, makes: ["mercedes", "dodge", "freightliner"], models: ["sprinter"], powertrains: ["diesel"] },
  { domain: "reddit.com/r/mercedes_benz", name: "r/mercedes_benz", weight: 2, makes: ["mercedes"] },

  // ── Audi / VW / Porsche ───────────────────────────────────────────────────
  { domain: "audizine.com", name: "Audizine", weight: 2, makes: ["audi"] },
  { domain: "audiworld.com", name: "AudiWorld", weight: 2, makes: ["audi"] },
  { domain: "quattroworld.com", name: "QuattroWorld", weight: 2, makes: ["audi"], models: ["quattro"] },
  { domain: "vwvortex.com", name: "VWVortex", weight: 2, makes: ["volkswagen"] },
  { domain: "tdiclub.com", name: "TDIClub", weight: 3, makes: ["volkswagen", "audi"], models: ["jetta", "golf", "passat", "beetle"], powertrains: ["tdi", "diesel"] },
  { domain: "golfmk7.com", name: "GolfMK7", weight: 3, makes: ["volkswagen"], models: ["golf", "gti", "mk7", "r"] },
  { domain: "thesamba.com", name: "TheSamba (aircooled VW)", weight: 3, makes: ["volkswagen"], models: ["beetle", "bus", "vanagon", "type 2", "karmann"], powertrains: ["aircooled"] },
  { domain: "newbeetle.org", name: "NewBeetle.org", weight: 3, makes: ["volkswagen"], models: ["beetle"] },
  { domain: "vwatlasforum.com", name: "VW Atlas Forum", weight: 3, makes: ["volkswagen"], models: ["atlas"] },
  { domain: "rennlist.com", name: "Rennlist (Porsche)", weight: 2, makes: ["porsche"] },
  { domain: "6speedonline.com", name: "6SpeedOnline", weight: 2, makes: ["porsche"] },
  { domain: "planet-9.com", name: "Planet-9 (Porsche)", weight: 3, makes: ["porsche"], models: ["cayman", "boxster", "911", "987", "981"] },

  // ── Hyundai / Kia / Genesis ───────────────────────────────────────────────
  { domain: "hyundai-forums.com", name: "Hyundai Forums", weight: 2, makes: ["hyundai"] },
  { domain: "kia-forums.com", name: "Kia Forums", weight: 2, makes: ["kia"] },
  { domain: "genesisownersclub.com", name: "Genesis Owners Club", weight: 2, makes: ["genesis", "hyundai"] },

  // ── Volvo / Saab ──────────────────────────────────────────────────────────
  { domain: "swedespeed.com", name: "SwedeSpeed", weight: 2, makes: ["volvo", "saab"] },
  { domain: "volvoforums.com", name: "Volvo Forums", weight: 2, makes: ["volvo"] },
  { domain: "brickboard.com", name: "Brickboard (Volvo)", weight: 2, makes: ["volvo"], models: ["240", "740", "850", "940"] },
  { domain: "saabcentral.com", name: "SaabCentral", weight: 2, makes: ["saab"] },

  // ── Land Rover / Jaguar ───────────────────────────────────────────────────
  { domain: "landroverforums.com", name: "Land Rover Forums", weight: 2, makes: ["land rover", "landrover", "rover"] },
  { domain: "disco3.co.uk", name: "Disco3 (Discovery)", weight: 3, makes: ["land rover", "landrover"], models: ["discovery", "disco", "lr3", "lr4"] },
  { domain: "jaguarforums.com", name: "Jaguar Forums", weight: 2, makes: ["jaguar"] },

  // ── Mitsubishi / Suzuki / Isuzu ───────────────────────────────────────────
  { domain: "evolutionm.net", name: "EvolutionM (Lancer / Evo)", weight: 3, makes: ["mitsubishi"], models: ["lancer", "evo", "evolution", "ralliart"] },
  { domain: "mitsubishi-forums.com", name: "Mitsubishi Forums", weight: 2, makes: ["mitsubishi"] },
  { domain: "suzuki-forums.com", name: "Suzuki Forums", weight: 2, makes: ["suzuki"] },
  { domain: "planetisuzoo.com", name: "Planet Isuzoo", weight: 2, makes: ["isuzu"] },

  // ── EV ────────────────────────────────────────────────────────────────────
  { domain: "teslamotorsclub.com", name: "Tesla Motors Club", weight: 2, makes: ["tesla"], powertrains: ["ev", "electric"] },
  { domain: "mynissanleaf.com", name: "My Nissan Leaf", weight: 3, makes: ["nissan"], models: ["leaf"], powertrains: ["ev", "electric"] },
  { domain: "chevybolt.org", name: "Chevy Bolt EV Forum", weight: 3, makes: ["chevrolet"], models: ["bolt"], powertrains: ["ev", "electric"] },
  { domain: "insideevsforum.com", name: "InsideEVs Forum", weight: 2, powertrains: ["ev", "electric", "phev"] },
  { domain: "rivianforums.com", name: "Rivian Forums", weight: 2, makes: ["rivian"], models: ["r1t", "r1s"], powertrains: ["ev", "electric"] },
  { domain: "f150lightningforum.com", name: "F-150 Lightning Forum", weight: 3, makes: ["ford"], models: ["lightning", "f150", "f-150"], powertrains: ["ev", "electric"] },
  { domain: "macheforum.com", name: "Mach-E Forum", weight: 3, makes: ["ford"], models: ["mach-e", "mache", "mustang"], powertrains: ["ev", "electric"] },

  // ── Diesel / off-road / overland ──────────────────────────────────────────
  { domain: "dieselplace.com", name: "Diesel Place", weight: 3, makes: ["chevrolet", "gmc"], models: ["silverado", "sierra", "2500", "3500"], powertrains: ["duramax", "diesel"] },
  { domain: "competitiondiesel.com", name: "Competition Diesel", weight: 2, powertrains: ["diesel", "cummins", "duramax", "powerstroke"] },
  { domain: "turbodieselregister.com", name: "Turbo Diesel Register", weight: 3, makes: ["dodge", "ram"], models: ["2500", "3500", "ram"], powertrains: ["cummins", "diesel"] },
  { domain: "expeditionportal.com", name: "Expedition Portal", weight: 2, models: ["overland", "4x4"] },
  { domain: "pirate4x4.com", name: "Pirate 4x4", weight: 2, models: ["4x4", "offroad", "rock crawler"] },

  // ── Classic / muscle / other ──────────────────────────────────────────────
  { domain: "pro-touring.com", name: "Pro-Touring", weight: 2, models: ["pro touring", "muscle"] },
  { domain: "classicoldsmobile.com", name: "Classic Oldsmobile", weight: 3, makes: ["oldsmobile"], models: ["cutlass", "442", "delta 88"] },
  { domain: "fordmuscleforums.com", name: "Ford Muscle Forums", weight: 3, makes: ["ford"], models: ["mustang", "torino", "fairlane", "muscle"] },
  { domain: "saturnfans.com", name: "SaturnFans", weight: 2, makes: ["saturn"] },
  { domain: "g8board.com", name: "G8Board (Pontiac G8)", weight: 3, makes: ["pontiac"], models: ["g8"] },

  // ── RV / van / commercial ─────────────────────────────────────────────────
  { domain: "irv2.com", name: "iRV2", weight: 2, makes: ["rv"], models: ["motorhome", "rv", "class a", "class c"] },
  { domain: "fordtransitusaforum.com", name: "Ford Transit USA Forum", weight: 3, makes: ["ford"], models: ["transit"] },
  { domain: "promasterforum.com", name: "ProMaster Forum", weight: 3, makes: ["ram", "dodge"], models: ["promaster"] },
];

/** Generic / cross-brand pool (always considered first; weight 1). */
export const GENERIC_FORUMS: Forum[] = FORUMS.filter((f) => f.weight === 1);

/** Max domains per Serper `site:` OR-query (keeps the query within Google limits). */
export const MAX_DOMAINS_PER_QUERY = 12;

/** Floor of generic-pool forums guaranteed in every selection (≤ cap). */
const GENERIC_MIN_SLOTS = 4;

/**
 * Normalize a user-entered make to the canonical token used in `Forum.makes`.
 * Handles common aliases / abbreviations / punctuation.
 */
const MAKE_ALIASES: Record<string, string> = {
  chevy: "chevrolet",
  chev: "chevrolet",
  vw: "volkswagen",
  volkswagon: "volkswagen",
  benz: "mercedes",
  "mercedes-benz": "mercedes",
  "mercedes benz": "mercedes",
  mb: "mercedes",
  "land-rover": "land rover",
  landrover: "land rover",
  rover: "land rover",
  beemer: "bmw",
  bimmer: "bmw",
  "mini cooper": "mini",
  scion: "toyota",
  olds: "oldsmobile",
  caddy: "cadillac",
};

export function normalizeMake(make: string): string {
  const m = make.trim().toLowerCase();
  return MAKE_ALIASES[m] ?? m;
}

/** Split a string into lowercase alphanumeric tokens (length ≥ 2). */
function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .split(/\s+/)
    .map((t) => t.trim())
    .filter((t) => t.length >= 2);
}

/** True if any forum token exactly equals a query token. */
function hasExactToken(forumTokens: string[], queryTokens: string[]): boolean {
  return forumTokens.some((ft) => queryTokens.includes(ft));
}

/** True if a forum token contains / is contained by a query token (fuzzy). */
function hasFuzzyToken(forumTokens: string[], queryTokens: string[]): boolean {
  return forumTokens.some((ft) =>
    queryTokens.some(
      (qt) => qt.length >= 3 && (ft.includes(qt) || qt.includes(ft)),
    ),
  );
}

/**
 * Score one brand/model forum against the query. Higher = more specific.
 * Returns 0 if the forum doesn't match the query at all.
 */
function scoreForum(
  forum: Forum,
  make: string,
  modelTokens: string[],
  issueText: string,
): number {
  let score = 0;
  const forumModels = forum.models ?? [];
  // Model-level matches are the strongest signal.
  if (forumModels.length && hasExactToken(forumModels, modelTokens)) {
    score += 100;
  } else if (forumModels.length && hasFuzzyToken(forumModels, modelTokens)) {
    score += 50;
  }
  // Brand match.
  if (forum.makes?.includes(make)) {
    score += 40;
  }
  // Powertrain keyword present in the issue text (e.g. "cummins", "diesel").
  if (forum.powertrains?.some((p) => issueText.includes(p))) {
    score += 45;
  }
  // Small weight tiebreak so model-specific forums edge out brand-general ones
  // when scores are otherwise equal.
  if (score > 0) score += forum.weight;
  return score;
}

/**
 * Select the most relevant forum domains for a query.
 *
 * Always reserves slots for the generic pool (cross-brand mechanic wisdom helps
 * every search), then fills the remainder with the highest-scoring
 * brand/model/powertrain forums, capped at MAX_DOMAINS_PER_QUERY.
 */
export function selectForums(
  query: { make: string; model: string; issue: string },
  cap: number = MAX_DOMAINS_PER_QUERY,
): Forum[] {
  const make = normalizeMake(query.make);
  const modelTokens = tokenize(query.model);
  const issueText = ` ${query.issue.toLowerCase()} ${query.model.toLowerCase()} `;

  const scored = FORUMS.filter((f) => f.weight > 1)
    .map((f) => ({ forum: f, score: scoreForum(f, make, modelTokens, issueText) }))
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score || b.forum.weight - a.forum.weight);

  // Reserve generic slots, but don't waste them if there are few brand matches.
  const brandTake = Math.min(scored.length, Math.max(0, cap - GENERIC_MIN_SLOTS));
  const selected: Forum[] = scored.slice(0, brandTake).map((s) => s.forum);

  // Fill remaining slots from the generic pool (curation order = priority).
  for (const g of GENERIC_FORUMS) {
    if (selected.length >= cap) break;
    if (!selected.some((f) => f.domain === g.domain)) selected.push(g);
  }

  // If brand matches were sparse and generic didn't fill the cap, top up with
  // any remaining scored brand forums.
  for (const s of scored.slice(brandTake)) {
    if (selected.length >= cap) break;
    if (!selected.some((f) => f.domain === s.forum.domain)) selected.push(s.forum);
  }

  return selected.slice(0, cap);
}

/**
 * Map a result URL's host (+ path, for reddit) back to a curated forum's human
 * name. Falls back to a prettified domain when unknown.
 */
export function forumNameForUrl(url: string): { source: string; forumName: string } {
  let host = "";
  let pathname = "";
  try {
    const u = new URL(url);
    host = u.hostname.replace(/^www\./, "").toLowerCase();
    pathname = u.pathname.toLowerCase();
  } catch {
    host = url.replace(/^https?:\/\//, "").split("/")[0].replace(/^www\./, "").toLowerCase();
  }
  const hostPath = `${host}${pathname}`;

  // Reddit: match the subreddit path prefix (e.g. reddit.com/r/mechanicadvice).
  const match = FORUMS.find((f) => {
    const fd = f.domain.toLowerCase();
    if (fd.includes("/r/")) return hostPath.startsWith(fd);
    return host === fd || host.endsWith(`.${fd}`);
  });

  if (match) return { source: match.domain, forumName: match.name };

  // Unknown domain — prettify the host into a readable name.
  const pretty = host
    .replace(/\.(com|net|org|co\.uk|us|io)$/i, "")
    .split(/[.-]/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
  return { source: host, forumName: pretty || host };
}
