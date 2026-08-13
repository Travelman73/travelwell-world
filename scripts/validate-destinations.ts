/**
 * MVP-side ingest validator — the border gate. Checks incoming dossiers against
 * the LIVE MVP canon BEFORE they go near the generator or the DB, so a mistake in
 * the research library (broken cross-ref, wrong region scheme, non-canonical
 * spelling, missing field) is caught at the boundary, not shipped + translated ×9.
 *
 * Two input modes:
 *   • A path to the library's JSON — a single `.json` (array of dossiers, or an
 *     object keyed by region code) or a directory of `.json` files:
 *       npm run validate:ingest -- path/to/dossiers
 *   • No arg → self-checks THIS repo's own `src/data/places.ts` (a regression
 *     guard so we never introduce a bad id/ref ourselves):
 *       npm run validate:ingest
 *
 * Canon is read straight from source (taxonomy + places), so the gate always
 * reflects the live vocabularies. Reports per-row; exits non-zero on any error.
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { REGIONS, SIS, SUBREGIONS } from "../src/data/taxonomy";
import { DESTINATIONS, LEGACY_DEST_ID, resolveDestId } from "../src/data/places";
import { checkHero } from "./lib/check-hero";

// ── Canon, straight from the live source ──────────────────────────────────
const REGION_CODES = new Set(REGIONS.map((r) => r.code));
const SI_SLUGS = new Set(SIS.map((s) => s.id));
const TIERS = new Set(["essential", "comfort", "premier", "luxury", "ultra"]);
const STATUS = new Set(["live", "future"]);
const DEPTH = new Set(["verified", "stub", "cached"]);
const DRAW = new Set(["anchor", "core", "emerging"]);
const FEEL = new Set(["dramatic","serene","rugged","refined","wild","polished","cosmopolitan","buzzy","festive","romantic","secluded","family-friendly","coastal","alpine","historic","tropical","urban","remote","pastoral","adventurous"]);
const ADVISORY = new Set(["L1", "L2", "L3", "L4"]);
// The live MVP ids — the universe a reconciles_live_mvp / see-also must resolve
// into. Built from our own bundle so it's always current.
//
// LEGACY SLUGS COUNT. The whole point of `reconciles_live_mvp` is that a dossier
// names the row by the slug it was authored against, and 34 of those slugs were
// renamed on 2026-08-12 (`paris` → `paris-france`). Dossiers already written
// against `kruger` are not wrong; they are exactly what the reconcile map asked
// for. Rejecting them would punish authors for following the instruction.
const LIVE_IDS = new Set([
  ...Object.values(DESTINATIONS).flat().map((d) => d.id),
  ...Object.keys(LEGACY_DEST_ID),
]);

const ID_RE = /^[a-z0-9]+(?:-[a-z0-9]+)+$/;
const SLUG_RE = /^[a-z0-9-]+$/;
// Keys that hold cross-references to other destinations (the "see also" links).
const REF_KEYS = ["see_also", "related", "related_destinations", "nearby", "links"];

const slug = (s: string) =>
  (s || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
const deriveId = (name: string, country: string) => `${slug(name)}-${slug(country)}`;

// ── Load input → a flat list of { code, d } ───────────────────────────────
type Row = { code: string; d: any };
function normalize(raw: any, fromRegionKey?: string): Row[] {
  if (Array.isArray(raw)) return raw.map((d) => ({ code: d.region_code ?? fromRegionKey ?? "?", d }));
  if (raw && typeof raw === "object") {
    // object keyed by region code → { "05A": [ ... ] }
    if (Object.keys(raw).every((k) => Array.isArray((raw as any)[k]))) {
      return Object.entries(raw).flatMap(([code, list]) => (list as any[]).map((d) => ({ code: d.region_code ?? code, d })));
    }
    return [{ code: (raw as any).region_code ?? fromRegionKey ?? "?", d: raw }]; // single dossier
  }
  return [];
}
function loadRows(): { rows: Row[]; source: string } {
  const arg = process.argv[2];
  if (!arg) {
    const rows = Object.entries(DESTINATIONS).flatMap(([code, list]) => list.map((d) => ({ code, d })));
    return { rows, source: "src/data/places.ts (self-check)" };
  }
  const st = statSync(arg);
  const files = st.isDirectory()
    ? readdirSync(arg).filter((f) => f.endsWith(".json")).map((f) => join(arg, f))
    : [arg];
  const rows = files.flatMap((f) => normalize(JSON.parse(readFileSync(f, "utf8"))));
  return { rows, source: `${arg} (${files.length} file${files.length === 1 ? "" : "s"})` };
}

// ── Validate ──────────────────────────────────────────────────────────────
const errs: string[] = [];
const warns: string[] = [];
const bump = (m: Record<string, number>, k: string) => { m[k] = (m[k] || 0) + 1; };
const perRegion: Record<string, number> = {};
const seenIds = new Set<string>();
const seenReconcile = new Set<string>();
const refChecks: { at: string; ref: string }[] = [];
// Image-reuse tracking. Two destinations showing the SAME photo is a trust
// problem — a reader who sees one beach on Bonaire and Curaçao stops believing
// the rest of the page. Tokens are only placeholders so reuse there is a soft
// warning; a PINNED hero url reused is a hard error, because that one really
// does render the identical picture twice.
const byToken: Record<string, string[]> = {};
const byHeroUrl: Record<string, string[]> = {};
const byHeroQuery: Record<string, string[]> = {};
let linked = 0;

const { rows, source } = loadRows();
const incomingIds = new Set(rows.map(({ d }) => d.id ?? deriveId(d.name, d.country)));

for (const { code, d } of rows) {
  const id = d.id ?? deriveId(d.name, d.country);
  const at = `[${code}] ${id ?? d.name ?? "?"}`;

  for (const f of ["name", "country", "line", "status", "depth"]) {
    if (d[f] == null || d[f] === "") errs.push(`${at}: missing required "${f}"`);
  }
  // Region scheme — the 13-code is official; a 15-scheme code must be mapped down.
  if (!REGION_CODES.has(code)) errs.push(`${at}: region "${code}" is not a valid 13-code region — map 15→13 via the reconciliation table before ingest`);
  // Id: net-new dossiers must be <city>-<country>; the 38 legacy live slugs
  // (bali, kyoto, machu…) are grandfathered canon — they're the reconcile anchors.
  if (!ID_RE.test(id) && !LIVE_IDS.has(id)) errs.push(`${at}: id "${id}" isn't <city>-<country> (lowercase, hyphenated)`);
  if (d.id && d.id !== deriveId(d.name, d.country)) warns.push(`${at}: id "${d.id}" ≠ derived "${deriveId(d.name, d.country)}" (name/country drift)`);
  if (seenIds.has(id)) errs.push(`${at}: duplicate id "${id}" (two dossiers → same slot)`); else seenIds.add(id);
  // sub_region — validate against the region's known set where we have it (12A/13A
  // in the bundle); can't strictly check regions whose sub_regions live only in the seed.
  const subs = SUBREGIONS[code];
  if (d.sub_region && subs && !subs.includes(d.sub_region)) errs.push(`${at}: sub_region "${d.sub_region}" isn't a ${code} sub_region (${subs.join(" · ")})`);
  // Enums.
  if (d.status && !STATUS.has(d.status)) errs.push(`${at}: status "${d.status}" not live|future`);
  if (d.depth && !DEPTH.has(d.depth)) errs.push(`${at}: depth "${d.depth}" not verified|stub|cached`);
  if (d.draw_rank != null && !DRAW.has(d.draw_rank)) errs.push(`${at}: draw_rank "${d.draw_rank}" not anchor|core|emerging`);
  if (d.price_band != null && !TIERS.has(d.price_band)) errs.push(`${at}: price_band "${d.price_band}" not a valid tier`);
  for (const tb of d.tier_range ?? []) if (!TIERS.has(tb)) errs.push(`${at}: tier_range has "${tb}" (not a valid tier)`);
  for (const s of d.si ?? []) if (!SI_SLUGS.has(s)) warns.push(`${at}: si "${s}" isn't a known SI slug (won't surface)`);
  for (const f of d.feel ?? []) if (!FEEL.has(f)) errs.push(`${at}: feel "${f}" is outside the controlled vocabulary (breaks matching)`);
  if (!(d.si ?? []).length) warns.push(`${at}: no si tags`);

  // data (jsonb) — v1 dossier tier (safety, timing, jewels+si+commission, faq).
  const data = d.data;
  if (data != null && typeof data !== "object") errs.push(`${at}: data must be an object (jsonb)`);
  if (data && typeof data === "object") {
    if (d.depth === "verified" && !data.safety) warns.push(`${at}: verified but no data.safety (safety spine)`);
    if (data.safety?.advisory_level && !ADVISORY.has(data.safety.advisory_level)) errs.push(`${at}: advisory_level "${data.safety.advisory_level}" not L1–L4`);
    if (data.safety?.advisory_level === "L4" && data.safety.booking_hold !== true) warns.push(`${at}: L4 should be content-only (booking_hold: true)`);
    for (const [i, j] of (data.jewels ?? []).entries()) {
      if (!j?.name) errs.push(`${at}: jewel #${i + 1} missing "name"`);
      if (j?.tier && !TIERS.has(j.tier)) errs.push(`${at}: jewel "${j.name}" tier "${j.tier}" not a valid tier`);
      if (j?.si && !SI_SLUGS.has(j.si)) warns.push(`${at}: jewel "${j.name}" si "${j.si}" isn't a known SI slug`);
      if (!j?.commission) warns.push(`${at}: jewel "${j?.name}" has no commission lane (the money — set it if bookable)`);
    }
    for (const [i, q] of (data.faq ?? []).entries()) {
      if (!q?.q || !q?.a) errs.push(`${at}: faq #${i + 1} needs both q and a (it emits FAQPage schema)`);
    }
    // Editorial hero override (data.hero) — the content team's image pick.
    // Shared with the SI gate so the two can't drift: a missing credit on a
    // PINNED url used to be a warning here and nothing at all there, which is
    // two answers to one question.
    checkHero(at, data.hero, { errs, warns });

    // reconciles_live_mvp → must resolve to an ACTUAL live MVP id (not just a slug).
    const rec = data.reconciles_live_mvp;
    if (rec == null) warns.push(`${at}: no data.reconciles_live_mvp (confirm this is net-new, not an existing MVP row)`);
    else if (typeof rec !== "string" || !SLUG_RE.test(rec)) errs.push(`${at}: reconciles_live_mvp "${String(rec)}" isn't a clean lowercase slug`);
    else if (!LIVE_IDS.has(rec)) errs.push(`${at}: reconciles_live_mvp "${rec}" is not a live MVP id (would map onto nothing)`);
    else {
      linked++;
      // Collide on the RESOLVED id, not the string. Two dossiers claiming the
      // same row — one as `kruger`, one as `greater-kruger-south-africa` — are a
      // duplicate, and comparing raw strings would wave both through, producing
      // exactly the duplicate row the reconcile map exists to prevent.
      const canon = resolveDestId(rec)!;
      if (seenReconcile.has(canon)) errs.push(`${at}: reconciles_live_mvp "${rec}" already claimed (collision — resolves to "${canon}")`);
      else seenReconcile.add(canon);
    }
  }

  // Collect cross-references for a resolution pass once every id is known.
  const scan = (obj: any) => {
    if (!obj || typeof obj !== "object") return;
    for (const k of REF_KEYS) {
      const v = obj[k];
      for (const ref of Array.isArray(v) ? v : v != null ? [v] : []) if (typeof ref === "string") refChecks.push({ at, ref });
    }
  };
  if (d.img) (byToken[String(d.img)] ??= []).push(id);
  const h = (data ?? {}).hero as { url?: string; query?: string } | undefined;
  if (h?.url) (byHeroUrl[h.url] ??= []).push(id);
  if (h?.query) (byHeroQuery[h.query.toLowerCase()] ??= []).push(id);

  scan(d); scan(data);
  bump(perRegion, code);
}

// ── Cross-reference resolution — the "see also → empty shelf" bug ──────────
const known = new Set([...LIVE_IDS, ...incomingIds]);
let brokenRefs = 0;
for (const { at, ref } of refChecks) {
  if (!known.has(ref)) { errs.push(`${at}: see-also "${ref}" points to no destination (broken link)`); brokenRefs++; }
}

// ── Duplicate imagery ─────────────────────────────────────────────────────
for (const [url, ids] of Object.entries(byHeroUrl)) {
  if (ids.length > 1) errs.push(`duplicate pinned hero image — ${ids.join(", ")} all use ${url}. The same photo on two places reads as fake.`);
}
for (const [q, ids] of Object.entries(byHeroQuery)) {
  if (ids.length > 1) warns.push(`same hero.query "${q}" on ${ids.join(", ")} — they will very likely resolve to the identical photo`);
}
for (const [tok, ids] of Object.entries(byToken)) {
  if (ids.length > 3) warns.push(`placeholder token "${tok}" reused by ${ids.length} destinations (${ids.slice(0, 4).join(", ")}…) — only the pre-load image, but consider spreading them`);
}

// ── Report ────────────────────────────────────────────────────────────────
const fmt = (m: Record<string, number>) => Object.entries(m).sort().map(([k, v]) => `${k}:${v}`).join("  ");
console.log(`\n── INGEST GATE ─────────────────────────────`);
console.log(`source:      ${source}`);
console.log(`destinations: ${rows.length}   regions: ${Object.keys(perRegion).length}`);
console.log(`per region:  ${fmt(perRegion)}`);
console.log(`linkage:     ${linked}/${rows.length} reconcile to a live row   unique ids: ${seenIds.size}   cross-refs: ${refChecks.length} (${brokenRefs} broken)`);
if (warns.length) { console.log(`\n⚠︎ ${warns.length} warnings (won't block, but check):`); warns.forEach((w) => console.log("  · " + w)); }
if (errs.length) { console.log(`\n✗ ${errs.length} ERRORS (must fix before ingest):`); errs.forEach((e) => console.log("  ✗ " + e)); process.exit(1); }
console.log(`\n✓ Clean against live canon — safe to ingest.`);
