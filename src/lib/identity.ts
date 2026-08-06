/**
 * TravelWell — the living Travel ID (David-locked: Identity Builder + Lifetime Loop).
 *
 * The Identity Card is the traveler's PERMANENT anchor — the *constant* (who they
 * are: name, age cohort, party, how they move, budget style per Well, interests).
 * The trip *vision* is the *variable* — it changes every trip and is NOT identity;
 * it's held as `trip_intent` and re-asked each Lifetime-Loop check-in.
 *
 * This module normalizes a stored `TravelIdRecord` (or the demo fallback) into a
 * display-ready shape, and holds the canonical age-cohort + budget vocabularies so
 * the card renders real data instead of a hardcoded mock. See
 * docs/identity-builder-and-age-budget.md.
 */
import type { TravelIdRecord, PartyMember } from "./travelId";

/* ---- Age cohorts — 12, seniors split 65–74 / 75–84 / 85+ (David 2026-07-29).
 * Age shapes pace/tone/mobility, NEVER budget (separate axis, locked). Stored as a
 * range, never a birthday. `cohortFor` also accepts the legacy Sign-Up buckets so
 * older Travel IDs keep rendering while onboarding catches up to the 12-cohort set. */
export interface Cohort { key: string; label: string; range: string; note: string }

export const AGE_COHORTS: Cohort[] = [
  { key: "infant", label: "Infant & Toddler", range: "0–3", note: "Runs on naps; stroller/carrier" },
  { key: "child", label: "Young Child", range: "4–8", note: "Energy in bursts, then a break" },
  { key: "tween", label: "Tween", range: "9–12", note: "High energy; keeps up with adults" },
  { key: "teen", label: "Teen", range: "13–17", note: "Full grown-up energy, dawn to dark" },
  { key: "young-adult", label: "Young Adult", range: "18–24", note: "Peak energy, all day and night" },
  { key: "early-adult", label: "Early Adult", range: "25–34", note: "Very high; the couples core" },
  { key: "established", label: "Established Adult", range: "35–44", note: "Strong days; first back-and-knees" },
  { key: "peak-earner", label: "Peak Earner", range: "45–54", note: "Strong, but rest days now planned" },
  { key: "pre-retirement", label: "Pre-Retirement", range: "55–64", note: "Steady; likes an easier pace" },
  { key: "young-senior", label: "Young Senior", range: "65–74", note: "A morning outing, then ease off" },
  { key: "senior", label: "Senior", range: "75–84", note: "A few active hours, then real rest" },
  { key: "senior-plus", label: "Senior+", range: "85+", note: "Rest-and-visit; comfort & safety first" },
];

// Legacy Sign-Up values (and child/teen party ages) → the closest cohort key.
const LEGACY_AGE: Record<string, string> = {
  "0-12": "child", "13-17": "teen",
  "18-24": "young-adult", "25-34": "early-adult",
  "35-49": "established", "50-64": "pre-retirement", "65+": "young-senior",
};

// Cohorts an account-holder can pick for themselves (18+); the child/teen cohorts
// apply only to party members. Sign-Up's self-age step uses this subset.
export const ADULT_COHORTS: Cohort[] = AGE_COHORTS.slice(4);

const MINOR_KEYS = new Set(["infant", "child", "tween", "teen"]);
/** True when an age resolves to a 0–17 cohort (drives "no notifications for children"). */
export function isMinorCohort(age: string | null | undefined): boolean {
  const c = cohortFor(age);
  return c ? MINOR_KEYS.has(c.key) : false;
}

/** Resolve a stored age value to its cohort, tolerating cohort keys, ranges, and legacy buckets. */
export function cohortFor(age: string | null | undefined): Cohort | null {
  if (!age || age === "na") return null;
  const v = age.trim().toLowerCase();
  const byKey = AGE_COHORTS.find((c) => c.key === v);
  if (byKey) return byKey;
  const byRange = AGE_COHORTS.find((c) => c.range.replace(/[–—]/g, "-") === v);
  if (byRange) return byRange;
  const legacy = LEGACY_AGE[v];
  if (legacy) return AGE_COHORTS.find((c) => c.key === legacy) ?? null;
  return null;
}

/** A short human label for an age value ("Early Adult · 25–34"), or a graceful fallback. */
export function cohortLabel(age: string | null | undefined): string {
  const c = cohortFor(age);
  if (c) return `${c.label} · ${c.range}`;
  if (!age || age === "na") return "Undisclosed";
  return age;
}

/* ---- Budget style — per Well, not one tier (locked). Fly-Well is cabin class.
 * We tolerate both the canonical tier keys and the current Sign-Up keys so a stored
 * blend always labels cleanly. Percentages drive the Profile bars. */
interface Tier { label: string; pct: number }
const TIERS: Record<string, Tier> = {
  // canonical (Essential · Comfort · Premier · Luxury · Ultra)
  ultra: { label: "Ultra", pct: 100 }, luxury: { label: "Luxury", pct: 88 },
  premier: { label: "Premier", pct: 70 }, comfort: { label: "Comfort", pct: 50 }, essential: { label: "Essential", pct: 28 },
  // legacy Sign-Up / Profile keys, mapped onto the same ladder
  highend: { label: "High-End", pct: 80 }, high: { label: "High-End", pct: 80 },
  midrange: { label: "Mid-Range", pct: 52 }, mid: { label: "Mid-Range", pct: 52 },
  family: { label: "Family Friendly", pct: 38 }, budget: { label: "Budget Conscious", pct: 22 },
};
const FLY_TIERS: Record<string, Tier> = {
  first: { label: "First Class", pct: 100 }, business: { label: "Business", pct: 68 },
  premium: { label: "Premium Economy", pct: 46 }, "premium-economy": { label: "Premium Economy", pct: 46 },
  economy: { label: "Economy", pct: 30 }, coach: { label: "Coach", pct: 30 },
};

const tierTable = (wellId: string) => (wellId === "fly" ? FLY_TIERS : TIERS);
export function tierLabel(wellId: string, key: string): string {
  return tierTable(wellId)[key.toLowerCase()]?.label ?? key;
}

/* Canonical picker options + the "Mix my ranges" cap (David: up to three per Well).
 * Budget = Essential · Comfort · Premier · Luxury · Ultra. Fly-Well is cabin class. */
export interface PickOption { v: string; t: string; s: string }
export const BUDGET_TIER_OPTIONS: PickOption[] = [
  { v: "essential", t: "Essential", s: "Smart & lean" },
  { v: "comfort", t: "Comfort", s: "Easy, comfortable value" },
  { v: "premier", t: "Premier", s: "Premium, polished" },
  { v: "luxury", t: "Luxury", s: "The very best" },
  { v: "ultra", t: "Ultra", s: "Beyond luxury, no ceiling" },
];
export const FLY_CABIN_OPTIONS: PickOption[] = [
  { v: "economy", t: "Economy", s: "Get me there" },
  { v: "premium-economy", t: "Premium Economy", s: "Extra room to breathe" },
  { v: "business", t: "Business", s: "Lie-flat comfort" },
  { v: "first", t: "First Class", s: "The pointy end" },
];
export const MAX_BUDGET_PICKS = 3;
export const budgetOptionsFor = (wellId: string): PickOption[] => (wellId === "fly" ? FLY_CABIN_OPTIONS : BUDGET_TIER_OPTIONS);

/* ---- Safer-Informed capabilities overlay (Identity Builder Step 2) --------
 * Pace + access, captured BOTH sides (able-to-do + to-plan-around) and used to
 * build the trip AROUND the traveler, never to limit them. A stated factor
 * overrides the age default; this is the socket the L3 safety gates read. */
export const ACTIVITY_LEVELS: PickOption[] = [
  { v: "very-active", t: "Very Active", s: "Long days, big miles" },
  { v: "moderately-active", t: "Moderately Active", s: "Full days, some downtime" },
  { v: "lightly-active", t: "Lightly Active", s: "Gentle pace, regular rest" },
  { v: "leisurely", t: "Leisurely Strolls", s: "Easy outings, plenty of sitting" },
];
export const ACCESS_NEEDS: PickOption[] = [
  { v: "fully-mobile", t: "Fully Mobile", s: "No access needs" },
  { v: "some-stairs", t: "Some Stairs OK", s: "A flight is fine" },
  { v: "no-stairs", t: "No Stairs", s: "Step-free routes" },
  { v: "frequent-rest", t: "Frequent Rest", s: "Regular sit-downs" },
  { v: "cane", t: "Cane", s: "Walking aid" },
  { v: "wheelchair", t: "Wheelchair", s: "Wheelchair access" },
];
export const activityLabel = (v: string | null | undefined): string | null =>
  v ? (ACTIVITY_LEVELS.find((a) => a.v === v)?.t ?? v) : null;
export const accessLabel = (v: string): string => ACCESS_NEEDS.find((a) => a.v === v)?.t ?? v;
/** Highest tier % selected in a Well (drives the bar); 0 when none chosen. */
export function tierPeak(wellId: string, keys: string[]): number {
  const t = tierTable(wellId);
  return Math.max(0, ...keys.map((k) => t[k.toLowerCase()]?.pct ?? 0));
}

/* ---- Normalized identity for the card ----------------------------------- */
export interface DisplayMember { name: string; initial: string; cohort: string; tag: string; lead: boolean }
export interface DisplayIdentity {
  id: string;
  name: string;
  cohort: Cohort | null;
  since: string;
  party: DisplayMember[];
  interests: string[];
  budget: Record<string, string[]>;
  // Safer-Informed overlay — how they move, and both sides of the ask.
  activity: string | null;      // activity-level key
  access: string[];             // access-need keys
  capabilities: string | null;  // the enabling side ("fully up for")
  accessibility: string | null; // the "anything to plan around" side
  dietary: string | null;
  /** The per-trip VARIABLE — the current vision. Not part of the permanent identity. */
  vision: string | null;
  synced: boolean;
}

const relLabel = (rel: string) =>
  (({ partner: "Partner", child: "Child", family: "Family", companion: "Companion" }) as Record<string, string>)[rel] || "Companion";
const initialOf = (n: string) => (n || "?").trim().charAt(0).toUpperCase() || "?";

/** Short, stable ID token from the user id (display only; not a secret). */
function idToken(userId: string): string {
  const hex = userId.replace(/[^a-f0-9]/gi, "").toUpperCase();
  return `TW-${hex.slice(0, 4) || "0000"}-${hex.slice(4, 6) || "K3"}`;
}

/**
 * Build the display identity from a stored record, falling back to `demo` for any
 * field the record doesn't carry — so the card is real when signed in and a warm
 * showcase otherwise.
 */
export function deriveIdentity(
  rec: TravelIdRecord | null,
  demo: Omit<DisplayIdentity, "synced" | "cohort"> & { cohortAge?: string },
): DisplayIdentity {
  if (!rec) return { ...demo, cohort: cohortFor(demo.cohortAge), synced: false };

  const party: DisplayMember[] = (rec.party?.length ? rec.party : []).map((m: PartyMember, i) => ({
    name: m.name,
    initial: initialOf(m.name),
    cohort: cohortLabel(m.age),
    tag: i === 0 ? "You" : relLabel(m.rel),
    lead: i === 0,
  }));
  // Ensure the lead traveler is always present, even with an empty party list.
  const lead: DisplayMember = {
    name: rec.display_name || demo.name,
    initial: initialOf(rec.display_name || demo.name),
    cohort: cohortLabel(rec.age_range),
    tag: "You",
    lead: true,
  };
  const roster = party.some((m) => m.lead) ? party : [lead, ...party];

  return {
    id: idToken(rec.user_id),
    name: rec.display_name || demo.name,
    cohort: cohortFor(rec.age_range),
    since: demo.since,
    party: roster,
    interests: rec.interests?.length ? rec.interests : demo.interests,
    budget: rec.budget_ranges && Object.keys(rec.budget_ranges).length ? rec.budget_ranges : demo.budget,
    activity: rec.activity_level ?? demo.activity,
    access: rec.access_needs?.length ? rec.access_needs : demo.access,
    capabilities: rec.capabilities ?? demo.capabilities,
    accessibility: rec.accessibility ?? demo.accessibility,
    dietary: rec.dietary ?? demo.dietary,
    vision: rec.trip_intent ?? demo.vision,
    synced: true,
  };
}

/** The shared demo identity — the warm showcase when nobody's signed in. Real
 *  records override every field (deriveIdentity). Used by Profile + Welcome-Back. */
export const DEMO_IDENTITY: Omit<DisplayIdentity, "synced" | "cohort"> & { cohortAge?: string } = {
  id: "TW-2A9F-K3",
  name: "Amara",
  cohortAge: "established",
  since: "Jun 2026",
  party: [
    { name: "Amara", initial: "A", cohort: "Established Adult · 35–44", tag: "You", lead: true },
    { name: "Jhumur", initial: "J", cohort: "Established Adult · 35–44", tag: "Partner", lead: false },
  ],
  interests: ["safari", "romance", "culinary"],
  budget: { stay: ["premier", "luxury"], fly: ["business"], eat: ["premier"], move: ["comfort"], activities: ["comfort", "premier"] },
  activity: "moderately-active",
  access: ["no-stairs", "frequent-rest"],
  capabilities: "Happy on gentle game-drive tracks and short nature walks; comfortable with early starts.",
  accessibility: "Step-free rooms preferred; a rest in the afternoon.",
  dietary: "Pescatarian (Jhumur) · No shellfish",
  vision: "An unhurried anniversary safari — golden-hour game drives, candlelit dinners under the stars, and a few slow mornings with coffee and a view.",
};

/* ---- Lifetime Loop diff helpers (David: refresh, never rebuild) -----------
 * On return, Atlas confirms the constant and nudges the deltas — a year older,
 * energy shifted, budget moved. These compute the refreshed values to write back. */

/** The next-older cohort key (a year on may cross a boundary); clamps at Senior+. */
export function nextCohort(age: string | null | undefined): string | null {
  const c = cohortFor(age);
  if (!c) return age ?? null;
  const i = AGE_COHORTS.findIndex((x) => x.key === c.key);
  return AGE_COHORTS[Math.min(i + 1, AGE_COHORTS.length - 1)].key;
}

/** Shift activity level: dir +1 = more active (toward Very), -1 = easier (toward Leisurely). */
export function shiftActivity(activity: string | null | undefined, dir: 1 | -1): string | null {
  const i = ACTIVITY_LEVELS.findIndex((a) => a.v === activity);
  if (i < 0) return activity ?? null;
  // ACTIVITY_LEVELS runs most→least active, so "more active" moves toward index 0.
  const j = Math.min(Math.max(i - dir, 0), ACTIVITY_LEVELS.length - 1);
  return ACTIVITY_LEVELS[j].v;
}

/** Nudge every selected per-Well tier by one notch: dir +1 = pricier, -1 = leaner. */
export function shiftBudget(budget: Record<string, string[]>, dir: 1 | -1): Record<string, string[]> {
  const out: Record<string, string[]> = {};
  for (const [well, keys] of Object.entries(budget)) {
    const opts = budgetOptionsFor(well);
    out[well] = keys.map((k) => {
      const i = opts.findIndex((o) => o.v === k);
      if (i < 0) return k;
      return opts[Math.min(Math.max(i + dir, 0), opts.length - 1)].v;
    });
    // de-dupe if a shift collided two picks onto the same tier
    out[well] = [...new Set(out[well])];
  }
  return out;
}
