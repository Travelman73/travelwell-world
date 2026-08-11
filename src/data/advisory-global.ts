/**
 * GLOBAL advisories — the ones that apply everywhere, not to one country.
 *
 * The State Department issues a Worldwide Caution that sits above the per-country
 * levels. It is live right now (David found it in the Consular Affairs API,
 * 2026-08-10) and it was invisible to us: our safety card only ever showed a
 * country level, so a caution covering every destination on the site appeared on
 * none of them.
 *
 * ── Rules this file follows ────────────────────────────────────────────────
 * · VERBATIM. A government advisory is quoted, never paraphrased. Summarising
 *   one is how you accidentally change what it says.
 * · ATTRIBUTED TO ITS ISSUER. This is the US State Department advising US
 *   citizens. A German traveler reading our page needs to know whose advice it
 *   is, or it reads as a claim of ours about the world.
 * · IT EXPIRES. `active: false` (or a withdrawal) removes it everywhere in one
 *   edit. A stale worldwide caution is worse than none — it trains people to
 *   ignore the banner.
 * · NETWORK-FREE, like every other safety layer here. The fortnightly checker
 *   will write this record; nothing fetches it at render time.
 */

export interface GlobalAdvisory {
  /** Set false the moment it's withdrawn — it then renders nowhere. */
  active: boolean;
  id: string;
  title: string;
  /** Who issued it, and therefore whose citizens it addresses. */
  issuer: string;
  /** ISO date it was issued. */
  issued: string;
  /** The advisory's own words. Do not paraphrase. */
  text: string;
  /** Where a traveler reads it in full. */
  url: string;
  /** When WE last confirmed it still stands. */
  verified: string;
}

/**
 * Issued 2026-02-28, still current as of the 2026-08-10 check.
 * Text quoted from the Bureau of Consular Affairs advisory record.
 */
export const WORLDWIDE_CAUTION: GlobalAdvisory = {
  active: true,
  id: "us-worldwide-caution-2026-02",
  title: "Worldwide Caution",
  issuer: "US State Department",
  issued: "2026-02-28",
  text:
    "Following the launch of U.S. combat operations in Iran, Americans worldwide and especially in the Middle East should follow the guidance in the latest security alerts. They may experience travel disruptions due to periodic airspace closures. The Department of State advises Americans worldwide to exercise increased caution.",
  url: "https://travel.state.gov/content/travel/en/traveladvisories/traveladvisories/worldwide-caution.html",
  verified: "2026-08",
};

/** The global advisories in force right now. Empty is the normal state. */
export const activeGlobalAdvisories = (): GlobalAdvisory[] =>
  [WORLDWIDE_CAUTION].filter((a) => a.active);
