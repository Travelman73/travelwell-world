/**
 * TravelWell — Safety Card data (the layer behind the Destination Safety Card).
 *
 * Self-contained, framework-free, no network — compiled into the bundle, the
 * same pattern as src/data/emergency-numbers.ts. Keyed by ISO 3166-1 alpha-2
 * country code so it JOINS the emergency-numbers data off one key (local
 * emergency phone lines live there, never duplicated here).
 *
 * Accuracy contract: every entry must carry a real `source` + `verified` date.
 * Entries we haven't verified yet fall through to DEFAULT_SAFETY ("exercise
 * normal precautions"), which the card renders as a neutral, accurate baseline.
 *
 * Hand-off (David): author entries in this shape (TS or matching JSON), keyed
 * by ISO code, no phone numbers, with source + verified on every entry.
 */

export type RiskLevel = 1 | 2 | 3 | 4; // 1 = normal precautions … 4 = do not travel

// Verified destination safety data (David's safety.json — 33 countries, keyed
// by ISO alpha-2, sourced to US State Dept / UK FCDO advisories, verified 2026-06).
import safetyJson from "./safety.json";

export interface SafetyInfo {
  /** Display name, e.g. "Kenya". */
  country: string;
  /** Risk level — maps to the safety-1…safety-4 card colors. */
  lvl: RiskLevel;
  /** Advisory tier text, e.g. "Exercise increased caution". */
  label: string;
  /** One sentence shown at the top of the card. */
  summary: string;
  /** 2–5 key local considerations (rendered as rows). */
  considerations: string[];
  /** Verified medical notes — water, vaccines, altitude, etc. */
  medical?: string;
  /** Provenance, e.g. "US State Dept L2 / UK FCDO, Apr 2026". */
  source: string;
  /** Date verified, e.g. "2026-05". */
  verified: string;
}

/** Card top color per risk level. */
export const SAFE_COLOR: Record<RiskLevel, string> = {
  1: "var(--safety-1)",
  2: "var(--safety-2)",
  3: "var(--safety-3)",
  4: "var(--safety-4)",
};

/** Dark, hued variants for the safety-card HEADER, where the fill sits behind
 *  WHITE text. The vivid SAFE_COLOR ramp is too light for white at L1–L3 (fails
 *  WCAG AA); these keep the same green→red signal but dark enough for ≥4.5:1. */
export const SAFE_HEADER_COLOR: Record<RiskLevel, string> = {
  1: "#1f6b3a", // dark green — normal precautions
  2: "#7a5a12", // dark gold — increased caution
  3: "#9a4e14", // dark amber — reconsider
  4: "#9e2420", // dark red — do not travel
};

/** Neutral, accurate baseline for any country we don't have verified data for. */
export const DEFAULT_SAFETY: SafetyInfo = {
  country: "This destination",
  lvl: 1,
  label: "Exercise normal precautions",
  summary: "Standard travel precautions apply. Check your government's latest advisory before you travel.",
  considerations: [],
  source: "Baseline — verify the latest official advisory before travel",
  verified: "",
};

/**
 * Display-name → ISO alpha-2 for the countries our live destinations cover.
 * (Destinations store `country` as a display name; the Safety Card and the
 * emergency-numbers data both key by ISO, so we map here.)
 */
export const COUNTRY_ISO: Record<string, string> = {
  Australia: "AU", Austria: "AT", Bahamas: "BS", Cambodia: "KH", Canada: "CA", "Chile / Argentina": "CL",
  Colombia: "CO", Egypt: "EG", France: "FR", "French Polynesia": "PF", Germany: "DE", Greece: "GR",
  Iceland: "IS", Indonesia: "ID", Italy: "IT", Japan: "JP", Jordan: "JO", Kenya: "KE",
  Namibia: "NA", Netherlands: "NL", "New Zealand": "NZ", Norway: "NO", Peru: "PE",
  Portugal: "PT", Rwanda: "RW", "Saudi Arabia": "SA", "South Africa": "ZA", "South Korea": "KR",
  Spain: "ES", "St. Lucia": "LC", Switzerland: "CH", Tanzania: "TZ", Thailand: "TH",
  "Turks & Caicos": "TC", UAE: "AE",
};

export const isoForCountry = (name: string): string | null => COUNTRY_ISO[name] ?? null;

/**
 * Safety data keyed by ISO alpha-2 — sourced from David's verified safety.json
 * (33 countries, US State Dept / UK FCDO, verified 2026-06). Anything not in
 * the file falls through to DEFAULT_SAFETY. ⚠️ Advisories shift — re-verify
 * against the live source before these cards go public-facing.
 */
export const SAFETY_DATA = safetyJson as Record<string, SafetyInfo>;

/** Look up safety info by ISO code. Always returns something (DEFAULT fallback). */
export function getSafety(iso: string | null | undefined): SafetyInfo {
  if (!iso) return DEFAULT_SAFETY;
  return SAFETY_DATA[iso.toUpperCase()] ?? DEFAULT_SAFETY;
}
