/**
 * TravelWell — the official advisory sources, and DEEP links into them.
 *
 * David's §7B: we publish our verification date, name the sources, hand the
 * traveler the link, and say plainly to read the advisory before they go. His
 * requirement on the link: it must go to that COUNTRY's page, not the source's
 * homepage — "that is the difference between a useful link and a gesture."
 *
 * ── Why this is a table and not string manipulation ────────────────────────
 * The sources don't share a slug. Portugal is `portugal` at the FCDO and
 * `portugal-travel-advisory` at State. Irregular names (the UAE, Turks & Caicos,
 * St. Lucia) don't derive from the display name under any rule that also works
 * for Kenya. So: derive the regular ones, override the rest, in one place.
 *
 * ── A wrong deep link is worse than a homepage link ────────────────────────
 * A 404 looks like we checked and didn't. So every URL this file generates is
 * checkable: `npm run check:advisory-links` fetches all of them and reports what
 * resolves. It needs outbound network, which the build sandbox doesn't have —
 * run it from an environment that does BEFORE these go public-facing, and fix
 * any slug it flags here rather than in a component.
 *
 * Framework-free, no network at read time — the same discipline as
 * emergency-numbers.ts. Building a URL never fetches anything.
 */

export type AdvisorySourceId = "state" | "fcdo" | "cdc";

export interface AdvisorySource {
  id: AdvisorySourceId;
  /** How we name it to the traveler. */
  name: string;
  /** Whose advisory this is — so a non-US, non-UK traveler knows to also check their own. */
  issuer: string;
  /** Where the link lands when we have no country slug for this source. */
  index: string;
}

export const ADVISORY_SOURCES: Record<AdvisorySourceId, AdvisorySource> = {
  state: {
    id: "state",
    name: "US State Department",
    issuer: "United States",
    index: "https://travel.state.gov/content/travel/en/traveladvisories/traveladvisories.html",
  },
  fcdo: {
    id: "fcdo",
    name: "UK FCDO",
    issuer: "United Kingdom",
    index: "https://www.gov.uk/foreign-travel-advice",
  },
  cdc: {
    id: "cdc",
    name: "CDC Travel Health Notices",
    issuer: "United States · health",
    index: "https://wwwnc.cdc.gov/travel/notices",
  },
};

/**
 * Country slug per source, keyed by ISO alpha-2.
 *
 * `undefined` for a source means "we don't have a confirmed slug" — the link
 * falls back to that source's index rather than guessing, because a guess that
 * 404s is worse than an honest index link. Fill these in from the checker's
 * output; don't hand-type from memory.
 *
 * The default derivation (display name → lowercase, spaces to hyphens) covers
 * most countries; entries here exist only where that derivation is wrong.
 */
const SLUG_OVERRIDES: Record<string, Partial<Record<AdvisorySourceId, string>>> = {
  AE: { state: "united-arab-emirates", fcdo: "united-arab-emirates", cdc: "united-arab-emirates" },
  TC: { state: "turks-and-caicos-islands", fcdo: "turks-and-caicos-islands", cdc: "turks-and-caicos-islands" },
  LC: { state: "saint-lucia", fcdo: "st-lucia", cdc: "saint-lucia" },
  // FCDO is `bahamas`, not `the-bahamas` — the checker's first live run 404'd on
  // it (2026-08-11). Empirical beats plausible: this is the whole reason the run
  // reports per-country failures instead of a single pass/fail.
  BS: { state: "the-bahamas", fcdo: "bahamas", cdc: "bahamas" },
  KR: { state: "south-korea", fcdo: "south-korea", cdc: "south-korea" },
  PF: { state: "french-polynesia", fcdo: "french-polynesia", cdc: "french-polynesia" },
  ZA: { state: "south-africa", fcdo: "south-africa", cdc: "south-africa" },
  NZ: { state: "new-zealand", fcdo: "new-zealand", cdc: "new-zealand" },
  SA: { state: "saudi-arabia", fcdo: "saudi-arabia", cdc: "saudi-arabia" },
};

const derive = (countryName: string) =>
  countryName.normalize("NFD").replace(/[̀-ͯ]/g, "")
    .toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

/**
 * A destination whose `country` spans TWO countries has no single advisory page
 * (we write those with a slash — "Chile / Argentina").
 *
 * Deliberately a slash and nothing else: "&" and "and" appear inside plenty of
 * SINGLE country names — Turks & Caicos, Antigua & Barbuda, Trinidad and Tobago.
 * A looser rule silently downgraded Turks & Caicos to an index link.
 */
export const isMultiCountry = (countryName: string) => countryName.includes("/");

function slugFor(source: AdvisorySourceId, iso: string | null, countryName: string): string | null {
  if (isMultiCountry(countryName)) return null;
  const override = iso ? SLUG_OVERRIDES[iso.toUpperCase()]?.[source] : undefined;
  if (override) return override;
  const d = derive(countryName);
  return d || null;
}

export interface AdvisoryLink {
  source: AdvisorySource;
  href: string;
  /** False when we fell back to the source's index — the UI says so plainly. */
  deep: boolean;
}

/**
 * The links we hand a traveler for one destination's country.
 * Never throws, never fetches; returns an index link rather than a bad guess.
 */
export function advisoryLinks(countryName: string, iso: string | null): AdvisoryLink[] {
  return (["state", "fcdo", "cdc"] as AdvisorySourceId[]).map((id) => {
    const source = ADVISORY_SOURCES[id];
    const slug = slugFor(id, iso, countryName);
    if (!slug) return { source, href: source.index, deep: false };
    const href =
      id === "state" ? `https://travel.state.gov/content/travel/en/traveladvisories/traveladvisories/${slug}-travel-advisory.html`
      : id === "fcdo" ? `https://www.gov.uk/foreign-travel-advice/${slug}`
      : `https://wwwnc.cdc.gov/travel/destinations/traveler/none/${slug}`;
    return { source, href, deep: true };
  });
}
