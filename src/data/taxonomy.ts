/**
 * TravelWell.World — Canonical taxonomy (the fixed nouns).
 * 25 Special Interests · 10 Wells (+2 luxury) · 13 Regions · launch locales.
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

export interface SpecialInterest {
  id: string;
  name: string;
  sig: string;
  status: Status;
  accent: string;
  lux: boolean;
  group: string;
}

const BASE_SIS: SpecialInterest[] = [
  /* Premium & Signature */
  { id: "ultra", name: "Ultra-Luxury", sig: "the extraordinary", status: "live", accent: "#A8873F", lux: true, group: "premium" },
  { id: "tropical", name: "Tropical Islands", sig: "barefoot luxury", status: "live", accent: "#2E8C8C", lux: false, group: "premium" },
  { id: "romance", name: "Romance, Marriages & Honeymoons", sig: "the two of you", status: "live", accent: "#A8527A", lux: false, group: "premium" },
  { id: "safari", name: "Safari Adventures", sig: "the wild calling", status: "live", accent: "#B07A3C", lux: false, group: "premium" },
  { id: "expedition", name: "Global Expedition Adventures", sig: "to the edges of the map", status: "live", accent: "#5C5C5C", lux: false, group: "premium" },
  { id: "adventure", name: "Global Adventures", sig: "the world, wide open", status: "preview", accent: "#3C7E55", lux: false, group: "premium" },
  /* Water & Cruise */
  { id: "liveaboard", name: "Dive Liveaboards", sig: "sleep above the reef", status: "live", accent: "#2E6E8C", lux: false, group: "water" },
  { id: "river", name: "River Cruises", sig: "the slow current", status: "live", accent: "#5B86A8", lux: false, group: "water" },
  { id: "diveglobal", name: "Dive Globally", sig: "the world below", status: "preview", accent: "#1F6E8C", lux: false, group: "water" },
  { id: "ocean", name: "Ocean & Watersports", sig: "the open water", status: "preview", accent: "#2C6E68", lux: false, group: "water" },
  /* Nature & Wellbeing */
  { id: "wellness", name: "Wellness, Spa & Retreats", sig: "coming home to yourself", status: "preview", accent: "#4F8C7A", lux: false, group: "nature" },
  { id: "wildlife", name: "Wildlife & Nature", sig: "wild places, up close", status: "preview", accent: "#4A7A3C", lux: false, group: "nature" },
  { id: "glamping", name: "Global Glamping", sig: "wild, but well-appointed", status: "preview", accent: "#7A6B4F", lux: false, group: "nature" },
  /* Life-stage & Active */
  { id: "family", name: "Family Travel", sig: "everyone, together", status: "preview", accent: "#C98A2E", lux: false, group: "active" },
  { id: "group", name: "Group Travel", sig: "better, together", status: "preview", accent: "#C27A3C", lux: false, group: "active" },
  { id: "hiking", name: "Hiking & Trekking", sig: "the trail ahead", status: "preview", accent: "#3C7E55", lux: false, group: "active" },
  { id: "ski", name: "Winter/Ski", sig: "the first track", status: "live", accent: "#5B86A8", lux: false, group: "active" },
  { id: "olympic", name: "Olympic Travel", sig: "the world's stage", status: "preview", accent: "#C2562E", lux: false, group: "active" },
  { id: "senior", name: "Senior Travel", sig: "unhurried, well-earned", status: "preview", accent: "#7A5B3B", lux: false, group: "active" },
  /* Culture & Entertainment */
  { id: "culinary", name: "Culinary Experiences", sig: "a table worth the flight", status: "preview", accent: "#9C5B3B", lux: false, group: "culture" },
  { id: "culture", name: "Culture & Heritage", sig: "the soul of a place", status: "preview", accent: "#7A5BA8", lux: false, group: "culture" },
  { id: "deepdive", name: "Cultural Deep Dives", sig: "beneath the surface", status: "preview", accent: "#6B4F9E", lux: false, group: "culture" },
  { id: "pilgrimage", name: "Religious & Pilgrimage", sig: "the road as devotion", status: "preview", accent: "#8C6B4F", lux: false, group: "culture" },
  { id: "entertainment", name: "Live Entertainment", sig: "the lights come up", status: "preview", accent: "#C2562E", lux: false, group: "culture" },
  { id: "nightlife", name: "Nightlife & City", sig: "the city after dark", status: "preview", accent: "#3C3C5C", lux: false, group: "culture" },
  /* Sports */
  { id: "sports", name: "Sports Travel", sig: "where the action is", status: "preview", accent: "#3C7E55", lux: false, group: "sports" },
  { id: "spectator", name: "Spectator Sports Travel", sig: "from the stands", status: "preview", accent: "#2C6E68", lux: false, group: "sports" },
  { id: "prosports", name: "Pro Sports Team Travel", sig: "follow the pros", status: "preview", accent: "#B07A3C", lux: false, group: "sports" },
  { id: "compsports", name: "Competitive Sports Team Travel", sig: "travel to compete", status: "preview", accent: "#2E6E8C", lux: false, group: "sports" },
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
  tropical: "Tropical", romance: "Love", safari: "Safari", liveaboard: "Liveaboards",
  river: "River Cruising", expedition: "Expedition", ski: "Winter", ultra: "Ultra-Luxury",
  adventure: "Adventure", diveglobal: "Diving", ocean: "Watersports", wellness: "Wellness",
  wildlife: "Wildlife", culinary: "Culinary", culture: "Culture", family: "Family",
  hiking: "Hiking", olympic: "the Olympics", entertainment: "Live Entertainment",
};
/** The tagline subject for an SI (map override, else its name). */
export const taglineSubject = (si: { id: string; name: string }): string =>
  SI_TAGLINE_SUBJECT[si.id] ?? si.name;
/** Master brand slogans (non-SI). */
export const MASTER_TAGLINE_SUBJECT = "Travel";
export const SAFER_TAGLINE_SUBJECT = "Safer Informed Travel";

export interface SiGroup { id: string; name: string; blurb: string; }
export const SI_GROUPS: SiGroup[] = [
  { id: "premium", name: "Premium & Signature", blurb: "Our flagship ways to travel — live now." },
  { id: "water", name: "Water & Cruise", blurb: "On, under and beside the water." },
  { id: "nature", name: "Nature & Wellbeing", blurb: "Wild places, and coming home to yourself." },
  { id: "active", name: "Life-stage & Active", blurb: "For every age, pace and energy." },
  { id: "culture", name: "Culture & Entertainment", blurb: "The soul of a place, and its nightlife." },
  { id: "sports", name: "Sports", blurb: "Play it, watch it, travel for it." },
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
