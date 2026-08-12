/**
 * Verify every advisory DEEP link actually resolves.
 *
 * David's rule for §7B is that the link must land on that country's page. The
 * failure mode is silent: a wrong slug 404s, and a 404 looks like we checked and
 * didn't. So the slug table is checkable rather than trusted.
 *
 * NEEDS OUTBOUND NETWORK. The build sandbox has none, so this has never been run
 * green here — run it from an environment that can reach the sources (the
 * research environment), then fix any slug it flags in
 * `src/data/advisory-sources.ts`, not in a component.
 *
 *   ./node_modules/.bin/esbuild scripts/check-advisory-links.ts --bundle \
 *     --platform=node --format=esm --outfile=scratchpad/links.mjs && node scratchpad/links.mjs
 *
 * Exits non-zero if any deep link fails, so it can gate a release.
 *
 * A 403 is reported separately from a 404 on purpose: 403 means the source is
 * refusing an automated request (State did exactly this to a plain GET), which
 * says nothing about whether the slug is right. Only 404 condemns a slug.
 */
import { COUNTRY_ISO } from "../src/data/safety-data";
import { advisoryLinks, isMultiCountry } from "../src/data/advisory-sources";

// A bare fetch gets bot-filtered by at least one of these sources; ask like a browser.
const HEADERS = {
  "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36",
  Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  "Accept-Language": "en-GB,en;q=0.9",
};

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function status(url: string): Promise<number | string> {
  try {
    // HEAD first (cheap); some sites only answer GET.
    let res = await fetch(url, { method: "HEAD", headers: HEADERS, redirect: "follow" });
    if (res.status === 405 || res.status === 501) {
      res = await fetch(url, { method: "GET", headers: HEADERS, redirect: "follow" });
    }
    return res.status;
  } catch (err) {
    return `ERR ${(err as Error).message.slice(0, 60)}`;
  }
}

const rows: { country: string; iso: string; source: string; href: string; deep: boolean; code: number | string }[] = [];
const countries = Object.entries(COUNTRY_ISO);
console.log(`Checking ${countries.length} countries × 3 sources…\n`);

for (const [country, iso] of countries) {
  if (isMultiCountry(country)) {
    console.log(`· ${country} — names more than one country; no single advisory page. Skipped by design.`);
    continue;
  }
  for (const l of advisoryLinks(country, iso)) {
    if (!l.deep) { rows.push({ country, iso, source: l.source.id, href: l.href, deep: false, code: "index" }); continue; }
    const code = await status(l.href);
    rows.push({ country, iso, source: l.source.id, href: l.href, deep: true, code });
    await sleep(250);                                  // be a polite client
  }
}

const deep = rows.filter((r) => r.deep);
const bad = deep.filter((r) => r.code === 404);
const blocked = deep.filter((r) => typeof r.code === "number" && (r.code === 403 || r.code === 429));
const errored = deep.filter((r) => typeof r.code === "string");
const ok = deep.filter((r) => typeof r.code === "number" && r.code >= 200 && r.code < 400);

console.log(`\n── ADVISORY LINK CHECK ─────────────────────`);
console.log(`deep links: ${deep.length}   ok: ${ok.length}   404 (wrong slug): ${bad.length}   403/429 (blocked, slug unproven): ${blocked.length}   errors: ${errored.length}`);
console.log(`index fallbacks (no confirmed slug): ${rows.filter((r) => !r.deep).length}`);

if (blocked.length) {
  console.log(`\n⚠︎ Blocked — these could not be proved either way. Re-run from an allow-listed egress:`);
  for (const r of blocked.slice(0, 10)) console.log(`  ${r.code}  ${r.country} · ${r.source}`);
  if (blocked.length > 10) console.log(`  …and ${blocked.length - 10} more`);
}
if (bad.length) {
  console.log(`\n✗ WRONG SLUGS — fix these in src/data/advisory-sources.ts (SLUG_OVERRIDES):`);
  for (const r of bad) console.log(`  ${r.country} (${r.iso}) · ${r.source}\n     ${r.href}`);
  process.exit(1);
}

// NOT PROVEN IS NOT PASSED. "No 404s" is trivially true when nothing was
// reached, and this printed a green tick on a run where all 108 links were
// blocked — the same shape as a 404 that reads as "we checked" when we didn't.
// A verifier that can return a tick without verifying anything is worse than no
// verifier, because it is the thing someone points at before shipping.
if (!ok.length) {
  console.log(`\n✗ NOTHING WAS VERIFIED — 0 of ${deep.length} deep links were reached.`);
  console.log(`  This is not a pass. Every link is still unproven. Run it from an egress`);
  console.log(`  that can reach travel.state.gov, gov.uk and cdc.gov before these go public.`);
  process.exit(2);
}
// A partial run is a partial answer, and says so.
if (blocked.length || errored.length) {
  console.log(`\n⚠︎ PARTIAL — ${ok.length} of ${deep.length} links proven, ${blocked.length + errored.length} still unproven. No 404s among those reached.`);
  process.exit(3);
}
console.log(`\n✓ All ${ok.length} deep links resolve. None 404.`);
