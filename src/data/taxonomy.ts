/**
 * TravelWell.World — Canonical taxonomy (the fixed nouns).
 * Special Interests · Wells (10 live + 2 soon) · Regions · launch locales.
 * The lists below ARE the counts — never write a count as a literal anywhere in
 * the app; read it from the catalog (`useSiCount` / `useRegionCount` /
 * `useWellCount` in `src/store/useCatalog.ts`). This header used to say
 * "25 Special Interests" while the catalog held 32.
 * Ported verbatim from the design prototype's js/data.js. This is
 * design-prototype data — names are taxonomy, not a real catalog (Law V-2).
 * Wire real data/APIs (Supabase) in implementation.
 */

// David's additive Special-Interest drop (raw data, same seam as safety.json).
// We keep the typed wrapper here: the SIs fold into SIS and their laddered
// activities into ACTIVITIES (see src/data/places.ts), so every existing
// consumer picks them up with no other change.
import siExtra from "./special-interests.json";

export type Status = "live" | "preview" | "soon";
export type IconName =
  | "plane" | "bed" | "utensils" | "car" | "bag" | "sparkle" | "compass"
  | "gift" | "shield" | "box" | "heart" | "lock";

/**
 * A sourced number. **David's rule, encoded: every figure is labeled `verified`
 * or `estimate`, and no figure is unlabeled** — an unlabeled number is a guessed
 * number, and the ingest gate rejects it. `value` is a string on purpose: the real
 * research carries ranges, arrows and currencies ("$26B → $60B", "€2,041/trip")
 * that a numeric column would flatten and lose.
 */
export interface Figure {
  label: string;
  value: string;
  confidence: "verified" | "estimate";
  source?: string;
  note?: string;
}

/** A dated event in the multi-year look-ahead (layer 4). Absolute dates, never
 *  "season" — canon: booking windows are absolute, multi-year dated series. */
export interface SiEvent {
  name: string;
  year?: number;
  starts_on?: string;              // ISO yyyy-mm-dd
  ends_on?: string;
  place?: string;
  note?: string;
  sold_out?: boolean;
}

/** How a provider can actually be booked (layer 6 — the API-first check). */
export type BookingPath = "api" | "request-to-book" | "aggregator" | "lead";

export interface SiProvider {
  name: string;
  well?: string;                   // the Well it hangs off (fly/stay/activities…)
  booking_path: BookingPath;
  mode?: string;                   // canon handoff mode: api|widget|affiliate|first-party
  commission?: string;             // the earning lane — the money
  confidence?: "verified" | "estimate";
  note?: string;
}

/** A traveler Q&A — answer-first; the array emits FAQPage JSON-LD. Same shape as
 *  the destination dossier's, deliberately: one FAQ shape across the whole system. */
export interface SiFaq { q: string; a: string; source?: string }

/**
 * The Special-Interest dossier `data` jsonb — **the nine layers, David-locked
 * 2026-08**, one key per layer, in his order. Mirrors `destinations.data`
 * (migration 0012). Every layer is optional so a dossier can land in stages;
 * the page renders whatever is present and stays silent about the rest.
 *
 *  1 market · 2 streams · 3 sources · 4 timing + events · 5 map ·
 *  6 providers · 7 faq · 8 wells/whispers/safety · 9 seo/schema
 *
 * Extra keys pass through untouched — the jsonb holds a later pass with no
 * migration, exactly as the destination dossier does.
 */
export interface SiData {
  /** 1 — the market, sized and range-cited. */
  market?: { summary?: string; figures?: Figure[] };
  /** 2 — demand streams: the distinct ways people travel for it (play vs watch). */
  streams?: { id?: string; name: string; blurb?: string; figures?: Figure[] }[];
  /** 3 — source countries: who travels, from where, how many. The targeting map. */
  sources?: { country: string; iso?: string; note?: string; figures?: Figure[] }[];
  /** 4a — seasons and booking windows. */
  timing?: { season?: string; best_months?: number[]; booking_window?: string; notes?: string };
  /** 4b — the multi-year dated event look-ahead. */
  events?: SiEvent[];
  /** 5 — the global map. `destinations` are MVP destination ids; the gate resolves them. */
  map?: { destinations?: string[]; regions?: string[]; anchors?: string[]; note?: string };
  /** 6 — the money and the booking rails. */
  providers?: SiProvider[];
  /** 7 — the traveler's real questions → on-page FAQ + FAQPage schema. */
  faq?: SiFaq[];
  /** 8 — connective tissue: Well anchoring, Atlas whisper hooks, the safety layer. */
  wells?: string[];
  whispers?: string[];
  safety?: Record<string, unknown>;
  /** 9 — ship-ready: SEO/GEO keywords and the structured-data types this page emits. */
  seo?: { title?: string; description?: string; keywords?: string[]; geo_keywords?: string[] };
  schema?: string[];
  /** The brand slogan's short subject — "If It's [Golf]… TravelWell™". A tight
   *  noun, not the full name. English-only (the slogan never localizes). */
  tagline_subject?: string;
  [key: string]: unknown;
}

export interface SpecialInterest {
  id: string;
  name: string;
  sig: string;
  status: Status;
  accent: string;
  lux: boolean;
  /** The category. `grp` in the DB — free text, so a new category needs no
   *  migration, only an SI_GROUPS entry so the UI can render and order it. */
  group: string;
  /** The rich SI dossier — the nine layers (market, streams, sources, timing +
   *  events, map, providers, faq, connective tissue, ship-ready). Mirrors
   *  `destinations.data` — migration 0012. */
  data?: SiData;
  /**
   * OFF THE BOARD, but NOT deleted. David's 2026-08-10 board collapsed eight
   * sports interests into two and dropped nightlife, and was explicit that the
   * old rows must not be deleted on his word alone — they're flagged for a
   * screen share instead. So they stay in `SIS`, which matters concretely: the
   * generated seed carries a `delete ... where id not in (...)`, so removing a
   * row here really does drop it from Postgres.
   *
   * Retired rows keep their database row and their history, and are filtered out
   * of every board, counter and picker by `boardSis()`. Un-retiring is deleting
   * one word. Deleting for real is a separate, deliberate decision.
   */
  retired?: boolean;
}

/**
 * THE BOARD — 35 Special Interests in 10 categories (David-locked, 2026-08-10:
 * "This is locked and it will not move again"). Ordered by category, and within
 * a category in his order, so the page renders the board as he wrote it.
 *
 * Three rows are RENAMES of existing ids, not new rows — keeping the id keeps the
 * activities, region rankings and provider links attached:
 *   sports  -> "Individual Sports"        (participatory: the traveler takes part)
 *   spectator -> "Sports Spectator Travel" (watching; the Olympic Games are event
 *                rows underneath this, not an interest of their own)
 *   entertainment -> "Global Live Entertainment"
 *
 * Four rows are RETIRED, not deleted — see `retired` on the interface. `nightlife`
 * became a City Well whisper; `olympic`/`prosports`/`compsports` fell out of the
 * sports collapse and need trademark clearance before any public use.
 */
const BASE_SIS: SpecialInterest[] = [
  /* 1 — Premium & Signature (7) */
  { id: "ultra", name: "Ultra-Luxury", sig: "the extraordinary", status: "live", accent: "#A8873F", lux: true, group: "premium" },
  { id: "tropical", name: "Tropical Islands", sig: "barefoot luxury", status: "live", accent: "#2E8C8C", lux: false, group: "premium" },
  { id: "romance", name: "Romance, Marriages & Honeymoons", sig: "the two of you", status: "live", accent: "#A8527A", lux: false, group: "premium" },
  { id: "safari", name: "Safari Adventures", sig: "the wild calling", status: "live", accent: "#B07A3C", lux: false, group: "premium" },
  { id: "expedition", name: "Global Expedition Adventures", sig: "to the edges of the map", status: "live", accent: "#5C5C5C", lux: false, group: "premium" },
  { id: "ski", name: "Winter/Ski", sig: "the first track", status: "live", accent: "#5B86A8", lux: false, group: "premium" },
  { id: "golf", name: "Golf Globally", sig: "the round of your life", status: "preview", accent: "#2F6B3A", lux: false, group: "premium" },

  /* 2 — Journeys of a Lifetime (6) — the ultra-premium halo: the journey IS the
     destination. All net-new; dossiers are being written. */
  { id: "rail", name: "Global Rail Journeys", sig: "the long way, beautifully", status: "preview", accent: "#6B5B4F", lux: false, group: "journeys" },
  { id: "barge", name: "Hotel-Barge & Canal Cruising", sig: "six knots, no hurry", status: "preview", accent: "#4F7A8C", lux: false, group: "journeys" },
  { id: "privatejet", name: "Private-Jet Expeditions", sig: "the world in one arc", status: "preview", accent: "#8C7A4F", lux: false, group: "journeys" },
  { id: "caravan", name: "Desert & Camel Caravans", sig: "dunes at first light", status: "preview", accent: "#C08A4A", lux: false, group: "journeys" },
  { id: "overland", name: "Luxury Overland Expeditions", sig: "the road as the journey", status: "preview", accent: "#8A6234", lux: false, group: "journeys" },
  { id: "motoring", name: "Classic-Car & Motorcycle Touring", sig: "the open road, in something special", status: "preview", accent: "#9E3B2E", lux: false, group: "journeys" },

  /* 3 — Adventure & Active (2) */
  { id: "adventure", name: "Global Adventures", sig: "the world, wide open", status: "preview", accent: "#3C7E55", lux: false, group: "adventure" },
  { id: "hiking", name: "Hiking & Trekking", sig: "the trail ahead", status: "preview", accent: "#4A8C5E", lux: false, group: "adventure" },

  /* 4 — Water & Cruise (6) — sailing + yacht arrive from special-interests.json */
  { id: "liveaboard", name: "Dive Liveaboards", sig: "sleep above the reef", status: "live", accent: "#2E6E8C", lux: false, group: "water" },
  { id: "river", name: "River Cruises", sig: "the slow current", status: "live", accent: "#5B86A8", lux: false, group: "water" },
  { id: "diveglobal", name: "Dive Globally", sig: "the world below", status: "preview", accent: "#1F6E8C", lux: false, group: "water" },
  { id: "ocean", name: "Ocean & Watersports", sig: "the open water", status: "preview", accent: "#2C6E68", lux: false, group: "water" },

  /* 5 — Nature & Wellbeing (3) */
  { id: "wellness", name: "Wellness, Spa & Retreats", sig: "coming home to yourself", status: "preview", accent: "#4F8C7A", lux: false, group: "nature" },
  { id: "wildlife", name: "Wildlife & Nature", sig: "wild places, up close", status: "preview", accent: "#4A7A3C", lux: false, group: "nature" },
  { id: "glamping", name: "Global Glamping", sig: "wild, but well-appointed", status: "preview", accent: "#7A6B4F", lux: false, group: "nature" },

  /* 6 — Life-Stage (3) */
  { id: "family", name: "Family Travel", sig: "everyone, together", status: "preview", accent: "#C98A2E", lux: false, group: "lifestage" },
  { id: "group", name: "Group Travel", sig: "better, together", status: "preview", accent: "#C27A3C", lux: false, group: "lifestage" },
  { id: "senior", name: "Senior Travel", sig: "unhurried, well-earned", status: "preview", accent: "#7A5B3B", lux: false, group: "lifestage" },

  /* 7 — Culture, Heritage & Pilgrimage (3) */
  { id: "culture", name: "Culture & Heritage", sig: "the soul of a place", status: "preview", accent: "#7A5BA8", lux: false, group: "culture" },
  { id: "deepdive", name: "Cultural Deep Dives", sig: "beneath the surface", status: "preview", accent: "#6B4F9E", lux: false, group: "culture" },
  { id: "pilgrimage", name: "Religious & Pilgrimage", sig: "the road as devotion", status: "preview", accent: "#8C6B4F", lux: false, group: "culture" },

  /* 8 — Global Entertainment (1) — the TLEU front door */
  { id: "entertainment", name: "Global Live Entertainment", sig: "the lights come up", status: "preview", accent: "#C2562E", lux: false, group: "entertainment" },

  /* 9 — Culinary, Wine & Spirits (2) — wine arrives from special-interests.json */
  { id: "culinary", name: "Culinary Experiences", sig: "a table worth the flight", status: "preview", accent: "#9C5B3B", lux: false, group: "culinary" },

  /* 10 — Sports (2) — collapsed from eight. Participate, or watch. */
  { id: "sports", name: "Individual Sports", sig: "your sport, somewhere new", status: "preview", accent: "#3C7E55", lux: false, group: "sports" },
  { id: "spectator", name: "Sports Spectator Travel", sig: "from the stands", status: "preview", accent: "#2C6E68", lux: false, group: "sports" },

  /* ── OFF THE BOARD — retired, NOT deleted ────────────────────────────────
     These keep their Postgres rows (the seed deletes any id missing from this
     array) and are filtered out of every board, counter and picker. David asked
     that the sports collapse be walked through on a screen share before anything
     is really removed, so removal stays his call, not a side effect of this edit. */
  { id: "nightlife", name: "Nightlife & City", sig: "the city after dark", status: "preview", accent: "#3C3C5C", lux: false, group: "culture", retired: true },
  { id: "olympic", name: "Olympic Travel", sig: "the world\u2019s stage", status: "preview", accent: "#C2562E", lux: false, group: "sports", retired: true },
  { id: "prosports", name: "Pro Sports Team Travel", sig: "follow the pros", status: "preview", accent: "#B07A3C", lux: false, group: "sports", retired: true },
  { id: "compsports", name: "Competitive Sports Team Travel", sig: "travel to compete", status: "preview", accent: "#2E6E8C", lux: false, group: "sports", retired: true },
];


// Canonical SIs + David's additive drop (folded in at module load).
export const SIS: SpecialInterest[] = [...BASE_SIS, ...(siExtra.special_interests as SpecialInterest[])];

/**
 * Brand slogan subjects — David's tagline system: "If It's [subject]… TravelWell."
 * The subject is a tight noun (not the poetic `sig`), ending in the one-word brand
 * mark. English-only, David-locked (like the Well names) — a coined brand line, so
 * it doesn't localize. Falls back to the SI name where no shorter subject is set.
 * romance → "Love" is locked (the Romance front-door line). See CLAUDE.md.
 */
export const SI_TAGLINE_SUBJECT: Record<string, string> = {
  // THE RULE FOR THIS SLOT (David, 2026-08-04): **the [X] slot takes the thing
  // the traveller WANTS, not the thing we sell.** Love, not Romance. Diving, not
  // Liveaboards. The River, not River Cruising. The best subjects in the set are
  // nouns of desire; a product category is the tell that we drifted.
  //
  // Applied 2026-08-14 — his two corrections had never been made:
  //   liveaboard  "Liveaboards"    → "Diving"      trade vocabulary; a first-time
  //                                                diver doesn't know the word, and
  //                                                it named the boat, not the want.
  //   river       "River Cruising" → "the River"   a product category became a longing.
  tropical: "Tropical", romance: "Love", safari: "Safari", liveaboard: "Diving",
  river: "the River", expedition: "Expedition", ski: "Winter", ultra: "Ultra-Luxury",
  // `diveglobal` held "Diving" and had to move: David's own rule is that no two
  // interests share a subject, and `liveaboard` is a LIVE launch interest while
  // this one is preview — so the live one takes the prime noun. "the World Below"
  // is this interest's own `sig`, so it isn't invented. One line to change if he
  // wants it the other way round.
  adventure: "Adventure", diveglobal: "the World Below", ocean: "Watersports", wellness: "Wellness",
  wildlife: "Wildlife", culinary: "Culinary", culture: "Culture", family: "Family",
  hiking: "Hiking", entertainment: "Live Entertainment",
  // The 2026-08-10 board's new interests. Tight nouns, not the full names —
  // "If It's Golf… TravelWell", never "If It's Golf Globally… TravelWell".
  golf: "Golf", rail: "Rail", barge: "Canal Cruising", privatejet: "Private Jets",
  caravan: "the Desert", overland: "Overland", motoring: "the Open Road",
  wine: "Wine", sailing: "Sailing", yacht: "Yachts", spectator: "the Big Game",
  // `olympic` is retired and needs trademark clearance before any public use —
  // deliberately no slogan subject.
};
/**
 * The tagline subject for an SI. Precedence: the hand-locked map (David's own
 * wording always wins) → the dossier's own `tagline_subject` → the SI name.
 *
 * The middle step exists because a net-new interest can now arrive as a drop-in
 * dossier, and without it the slogan would fall back to the full name — "If It's
 * Golf Globally… TravelWell™" instead of "If It's Golf… TravelWell™". The
 * dossier carries its own short subject so a new interest ships with the brand
 * line already right, and David can still override it here at any time.
 */
export const taglineSubject = (si: { id: string; name: string; data?: SiData }): string =>
  SI_TAGLINE_SUBJECT[si.id] ?? (typeof si.data?.tagline_subject === "string" ? si.data.tagline_subject : undefined) ?? si.name;
/** Master brand slogans (non-SI). */
export const MASTER_TAGLINE_SUBJECT = "Travel";
export const SAFER_TAGLINE_SUBJECT = "Safer Informed Travel";

export interface SiGroup { id: string; name: string; blurb: string; }
export const SI_GROUPS: SiGroup[] = [
  { id: "premium", name: "Premium & Signature", blurb: "Our flagship ways to travel." },
  { id: "journeys", name: "Journeys of a Lifetime", blurb: "Where the journey itself is the destination." },
  { id: "adventure", name: "Adventure & Active", blurb: "The world, on your own two feet." },
  { id: "water", name: "Water & Cruise", blurb: "On, under and beside the water." },
  { id: "nature", name: "Nature & Wellbeing", blurb: "Wild places, and coming home to yourself." },
  { id: "lifestage", name: "Life-Stage", blurb: "For every age, pace and party." },
  { id: "culture", name: "Culture, Heritage & Pilgrimage", blurb: "The soul of a place, and the road to it." },
  { id: "entertainment", name: "Global Entertainment", blurb: "The lights come up, wherever you are." },
  { id: "culinary", name: "Culinary, Wine & Spirits", blurb: "A table, a vineyard, a distillery worth the flight." },
  { id: "sports", name: "Sports", blurb: "Take part, or take a seat." },
];


export interface Well {
  id: string;
  name: string;
  tag: string;
  body: string;
  status: Status;
  icon: IconName;
  lux?: boolean;
}

export const WELLS: Well[] = [
  { id: "fly", name: "Fly-Well", tag: "Getting there", body: "Breath", status: "live", icon: "plane" },
  { id: "stay", name: "Stay-Well", tag: "Where you rest", body: "Skin", status: "live", icon: "bed" },
  { id: "eat", name: "Eat-Well", tag: "What you savor", body: "Digestion", status: "live", icon: "utensils" },
  { id: "move", name: "Move-Well", tag: "Getting around", body: "Muscle", status: "live", icon: "car" },
  { id: "gear", name: "Gear-Well", tag: "What you carry", body: "Bones", status: "live", icon: "bag" },
  { id: "beauty", name: "Beauty-Well", tag: "Looking & feeling well", body: "Senses", status: "live", icon: "sparkle" },
  { id: "activities", name: "Activities-Well", tag: "What excites you", body: "Heart", status: "live", icon: "compass" },
  { id: "shop", name: "Shop-Well", tag: "Taking it home", body: "Memory", status: "live", icon: "gift" },
  { id: "insure", name: "Insure-Well", tag: "Peace of mind", body: "Immunity", status: "soon", icon: "shield" },
  { id: "ship", name: "Ship-Well", tag: "Sending it ahead", body: "Circulation", status: "soon", icon: "box" },
  // The 13th Well (David, 2026-08-10). ~4 million people a year travel with a pet
  // and nobody serves them — this is a real lane, not a nicety. `soon` until it's
  // built; flip to `live` when it has providers behind it.
  { id: "pets", name: "Pets-Well", tag: "Traveling with your companion", body: "Loyalty", status: "soon", icon: "heart" },
];

export const LUX_WELLS: Well[] = [
  { id: "nanny", name: "Nanny-Well", tag: "Care for the little ones", body: "Nurture", status: "live", icon: "heart", lux: true },
  { id: "security", name: "Security-Well", tag: "Discreet protection", body: "Defense", status: "live", icon: "lock", lux: true },
];

export interface Region {
  code: string;
  name: string;
  line: string;
  countries: number;
  gateways: string;
  status: Status;
  sub?: boolean;
}

export const REGIONS: Region[] = [
  { code: "01F", name: "Western Europe", line: "Old-world capitals, modern ease", countries: 8, gateways: "CDG · LHR · AMS", status: "live" },
  { code: "02F", name: "The Mediterranean", line: "Sun, sea, and centuries", countries: 9, gateways: "BCN · FCO · ATH", status: "live" },
  { code: "03F", name: "Northern Europe & Nordics", line: "Fjords, design, long light", countries: 7, gateways: "CPH · OSL · HEL", status: "live" },
  { code: "04A", name: "Middle East, Gulf & North Africa", line: "Where ancient meets audacious", countries: 8, gateways: "DXB · CAI · DOH", status: "live" },
  { code: "05A", name: "East Africa", line: "The cradle of the safari", countries: 5, gateways: "NBO · JRO · KGL", status: "live" },
  { code: "06A", name: "Southern Africa", line: "Big skies, bigger game", countries: 5, gateways: "CPT · JNB · WDH", status: "live" },
  { code: "07A", name: "South & Southeast Asia", line: "Temples, islands, spice", countries: 9, gateways: "BKK · SIN · DPS", status: "live" },
  { code: "08A", name: "East Asia", line: "Tradition at the speed of now", countries: 5, gateways: "NRT · ICN · HKG", status: "live" },
  { code: "09P", name: "Oceania & The Pacific", line: "The end of the map, the start of awe", countries: 6, gateways: "SYD · AKL · NAN", status: "live" },
  { code: "10S", name: "Latin America", line: "Color, rhythm, wild horizons", countries: 11, gateways: "MEX · LIM · GIG", status: "preview" },
  { code: "11C", name: "Caribbean & Atlantic", line: "A thousand shades of blue", countries: 13, gateways: "NAS · PUJ · SJU", status: "live" },
  { code: "12A", name: "United States", line: "Fifty ways to wander", countries: 1, gateways: "JFK · LAX · ORD", status: "live", sub: true },
  { code: "13A", name: "Canada", line: "Vast, wild, and gracious", countries: 1, gateways: "YYZ · YVR · YUL", status: "live", sub: true },
];

export const SUBREGIONS: Record<string, string[]> = {
  "12A": ["Pacific Coast", "Pacific Northwest", "Mountain West", "The Southwest", "Texas & The Gulf", "The Midwest", "The South", "New England", "Mid-Atlantic", "Alaska", "Hawai‘i"],
  "13A": ["British Columbia", "The Rockies", "The Prairies", "Ontario", "Québec", "The Maritimes", "The North"],
};

export interface Locale {
  code: string;
  label: string;
  native: string;
  dir: "ltr" | "rtl";
  tier: "launch" | "staged";
}

export const LOCALES: Locale[] = [
  { code: "en", label: "English", native: "English", dir: "ltr", tier: "launch" },
  { code: "es", label: "Spanish", native: "Español", dir: "ltr", tier: "launch" },
  { code: "ar", label: "Arabic", native: "العربية", dir: "rtl", tier: "launch" },
  { code: "zh", label: "Chinese", native: "中文", dir: "ltr", tier: "launch" },
  { code: "fr", label: "French", native: "Français", dir: "ltr", tier: "staged" },
  { code: "de", label: "German", native: "Deutsch", dir: "ltr", tier: "staged" },
  { code: "pt", label: "Portuguese", native: "Português", dir: "ltr", tier: "staged" },
  { code: "ja", label: "Japanese", native: "日本語", dir: "ltr", tier: "staged" },
  { code: "ko", label: "Korean", native: "한국어", dir: "ltr", tier: "staged" },
];

/** SI → Region affinity: which regions shine for each interest (ranking input). */
export const REGION_SI: Record<string, string[]> = {
  "01F": ["ski", "culture", "culinary", "romance", "arts", "heritage", "wine", "rail", "city"],
  "02F": ["romance", "culinary", "ocean", "wine", "sailing", "yacht", "culture", "heritage", "surf"],
  "03F": ["photo", "adventure", "eco", "wellness", "rail", "sacred", "ski"],
  "04A": ["ultra", "river", "culture", "heritage", "city", "yacht", "wellness", "family", "golf"],
  "05A": ["safari", "photo", "adventure", "eco", "romance", "family", "heritage"],
  "06A": ["safari", "wine", "adventure", "eco", "photo", "ocean"],
  "07A": ["wellness", "culinary", "diving", "surf", "sacred", "culture", "eco", "family"],
  "08A": ["culture", "culinary", "arts", "city", "sacred", "ski", "heritage"],
  "09P": ["diving", "ocean", "adventure", "eco", "surf", "sailing", "yacht", "photo", "romance"],
  "10S": ["adventure", "culture", "festivals", "eco", "photo", "culinary", "surf", "heritage"],
  "11C": ["ocean", "romance", "diving", "sailing", "yacht", "surf", "family", "wellness"],
  "12A": ["road", "adventure", "family", "city", "golf", "ski", "festivals", "arts"],
  "13A": ["adventure", "ski", "eco", "photo", "rail", "road", "wellness"],
};

export const ALL_WELLS = [...WELLS, ...LUX_WELLS];
export const wellById = (id: string) => ALL_WELLS.find((w) => w.id === id);

/**
 * Well audience (David's tiering call) for the two premium Wells beyond the core 10:
 *  - Nanny-Well is UNIVERSAL — every family, any tier except budget (childcare
 *    isn't a luxury concern; we just never go cheap on who watches the kids).
 *  - Security-Well is ULTRA-only — close protection is a genuine ultra need that
 *    a typical traveler doesn't want surfaced.
 * Keyed by well id so it holds whether Wells come from the bundle or the DB.
 */
export type WellAudience = "universal" | "ultra";
export const WELL_AUDIENCE: Record<string, WellAudience> = {
  nanny: "universal",
  security: "ultra",
};
export const wellAudience = (id: string): WellAudience | undefined => WELL_AUDIENCE[id];
/**
 * THE BOARD — every interest a traveler can see or pick. Retired rows stay in
 * `SIS` (so the seed keeps their Postgres rows) but must never reach a tile, a
 * counter, a picker or Atlas. Always read the board through this, not `SIS`.
 */
export const boardSis = (sis: { retired?: boolean }[] = SIS) => sis.filter((s) => !s.retired);

export const siById = (id: string) => SIS.find((s) => s.id === id);
export const regionByCode = (code: string) => REGIONS.find((r) => r.code === code);

/** Rank regions by overlap with the traveler's chosen SIs. */
export function rankRegions(chosenSIs: string[]): Region[] {
  if (!chosenSIs.length) return REGIONS;
  const score = (code: string) => {
    const tags = REGION_SI[code] || [];
    return chosenSIs.reduce((n, si) => n + (tags.includes(si) ? 1 : 0), 0);
  };
  return [...REGIONS].sort((a, b) => score(b.code) - score(a.code));
}
