/**
 * Emit the country payload the daily checker is called with.
 *
 * The Edge Function deliberately never guesses its own country list — it checks
 * what we actually SERVE, which is why the cycle is ~90 lookups and not 200, and
 * why a country appearing on the site can't quietly go unchecked. The list is
 * therefore an input, generated from the same tables the site renders from:
 * `COUNTRY_ISO` for the countries, `advisory-sources.ts` for the FCDO slugs.
 *
 *   npm run gen:advisory-payload   → docs/advisory-countries.json
 *
 * Regenerate whenever a destination adds a new country, and update the scheduled
 * job with it. If the two drift, the checker silently stops covering a country —
 * so the generated file is the source, never a hand-kept copy.
 */
import { writeFileSync } from "node:fs";
import { COUNTRY_ISO } from "../src/data/safety-data";
import { advisoryLinks, isMultiCountry } from "../src/data/advisory-sources";

const countries = Object.entries(COUNTRY_ISO)
  .filter(([name]) => !isMultiCountry(name))
  .map(([name, iso]) => {
    // Recover the FCDO slug from the link builder so the slug lives in exactly
    // one place and a correction there reaches the checker too.
    const links = advisoryLinks(name, iso);
    const fcdo = links.find((l) => l.source.id === "fcdo");
    const state = links.find((l) => l.source.id === "state");
    const slug = fcdo?.deep ? fcdo.href.split("/").pop() : undefined;
    // The names a SOURCE uses are not our display names — State says "United Arab
    // Emirates" where we say "UAE", "Saint Lucia" where we say "St. Lucia". The
    // checker matches its feed rows by name, so it needs every alias or those
    // countries silently go unchecked while the run still reports success.
    const stateName = state?.deep
      ? state.href.split("/").pop()!.replace("-travel-advisory.html", "").replace(/-/g, " ")
      : undefined;
    const match = [...new Set([name, slug?.replace(/-/g, " "), stateName]
      .filter(Boolean).map((n) => (n as string).toLowerCase()))];
    return { iso, name, match, ...(slug ? { fcdo_slug: slug } : {}) };
  })
  .sort((a, b) => a.iso.localeCompare(b.iso));

writeFileSync("docs/advisory-countries.json", JSON.stringify({ countries }, null, 2) + "\n");
console.log(`Wrote docs/advisory-countries.json — ${countries.length} countries, ${countries.filter((c) => c.fcdo_slug).length} with an FCDO slug`);
