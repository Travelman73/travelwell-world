/**
 * MVP-side SI-dossier gate — the border check for Special Interests, the sibling
 * of validate-destinations.ts. Checks an incoming nine-layer dossier against the
 * LIVE MVP canon BEFORE it goes near the generator or the DB.
 *
 * The nine layers (David-locked 2026-08): market · streams · sources ·
 * timing+events · map · providers · faq · connective tissue · ship-ready.
 *
 * The rule this gate exists to enforce above all others: **every figure is
 * labeled `verified` or `estimate`.** An unlabeled number is a guessed number,
 * and a guessed number in an investor deck or an AI answer is the one mistake
 * this whole system is built to make impossible. That check is a hard error.
 *
 * Two input modes:
 *   • A path to a `.json` (array, or `{ special_interests: [...] }`) or a
 *     directory of them:   npm run validate:si -- src/data/interests
 *   • No arg → self-checks the repo's own bundled SIS + any dropped-in batch,
 *     a regression guard so we can't introduce a bad dossier ourselves:
 *                          npm run validate:si
 *
 * Canon is read straight from source, so the gate always reflects the live
 * vocabularies. Reports per-row; exits non-zero on any error.
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, basename } from "node:path";
import { SIS, SI_GROUPS, ALL_WELLS, REGIONS, SI_TAGLINE_SUBJECT } from "../src/data/taxonomy";
import { DESTINATIONS } from "../src/data/places";
import { checkHero } from "./lib/check-hero";

// ── Canon, straight from the live source ──────────────────────────────────
const SI_SLUGS = new Set(SIS.map((s) => s.id));
const GROUPS = new Set(SI_GROUPS.map((g) => g.id));
const SI_TAGLINE_MAP = new Set(Object.keys(SI_TAGLINE_SUBJECT));
const WELL_IDS = new Set(ALL_WELLS.map((w) => w.id));
const REGION_CODES = new Set(REGIONS.map((r) => r.code));
const LIVE_DEST_IDS = new Set(Object.values(DESTINATIONS).flat().map((d) => d.id));
const STATUS = new Set(["live", "preview", "soon"]);
const CONFIDENCE = new Set(["verified", "estimate"]);
const BOOKING_PATH = new Set(["api", "request-to-book", "aggregator", "lead"]);
const MODE = new Set(["api", "widget", "affiliate", "first-party"]);

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const HEX_RE = /^#[0-9a-fA-F]{6}$/;
const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
// A number-looking value with no confidence label is the thing we refuse to ship.
const LOOKS_NUMERIC = /\d/;

// ── Load input ────────────────────────────────────────────────────────────
type Row = { d: any; from: string };
function normalize(raw: any, from: string): Row[] {
  const list = Array.isArray(raw) ? raw : raw?.special_interests ?? (raw?.id ? [raw] : []);
  return (list as any[]).map((d) => ({ d, from }));
}
function loadRows(): { rows: Row[]; source: string } {
  const arg = process.argv[2];
  if (!arg) {
    const rows = SIS.map((d) => ({ d, from: "bundle" }));
    try {
      for (const f of readdirSync("src/data/interests").filter((f) => f.endsWith(".json") && !f.startsWith("_")).sort()) {
        rows.push(...normalize(JSON.parse(readFileSync(join("src/data/interests", f), "utf8")), f));
      }
    } catch { /* no batch folder yet */ }
    return { rows, source: "bundled SIS + src/data/interests (self-check)" };
  }
  const st = statSync(arg);
  const files = st.isDirectory()
    ? readdirSync(arg).filter((f) => f.endsWith(".json") && !f.startsWith("_")).map((f) => join(arg, f))
    : [arg];
  const rows = files.flatMap((f) => normalize(JSON.parse(readFileSync(f, "utf8")), f));
  return { rows, source: `${arg} (${files.length} file${files.length === 1 ? "" : "s"})` };
}

// ── Validate ──────────────────────────────────────────────────────────────
const errs: string[] = [];
const warns: string[] = [];
const seenIds = new Set<string>();
const layerCount: Record<string, number> = {};
let figures = 0, verified = 0, dossiers = 0, netNew = 0;

/** Every figure, wherever it sits, goes through here. */
function checkFigure(at: string, where: string, f: any, i: number) {
  const tag = `${at}: ${where} figure #${i + 1}`;
  if (!f || typeof f !== "object") { errs.push(`${tag} isn't an object`); return; }
  figures++;
  if (!f.label) errs.push(`${tag} has no "label"`);
  if (f.value == null || f.value === "") errs.push(`${tag} ("${f.label ?? "?"}") has no "value"`);
  if (!f.confidence) {
    errs.push(`${tag} ("${f.label ?? "?"}" = ${JSON.stringify(f.value)}) has no "confidence" — every number must be labeled verified or estimate. An unlabeled number is a guessed number.`);
  } else if (!CONFIDENCE.has(f.confidence)) {
    errs.push(`${tag} confidence "${f.confidence}" is not verified|estimate`);
  } else if (f.confidence === "verified") {
    verified++;
    if (!f.source) errs.push(`${tag} ("${f.label}") is marked verified with no "source" — verified means someone can check it.`);
  }
  if (typeof f.value === "string" && !LOOKS_NUMERIC.test(f.value)) {
    warns.push(`${tag} value "${f.value}" has no digits — is this a figure, or should it be a note?`);
  }
}

const { rows, source } = loadRows();
const incomingIds = new Set(rows.map(({ d }) => d.id));

for (const { d, from } of rows) {
  const id = d.id;
  const at = `${d.id ?? d.name ?? "?"}${from === "bundle" ? "" : ` (${from})`}`;

  // ── The row itself ──────────────────────────────────────────────────────
  if (!id) { errs.push(`${at}: missing "id"`); continue; }
  if (!SLUG_RE.test(id)) errs.push(`${at}: id "${id}" isn't a clean lowercase slug`);
  if (seenIds.has(id)) errs.push(`${at}: duplicate id "${id}" (two dossiers → same slot)`); else seenIds.add(id);

  // A batch row for an SI we already carry may be a data-only patch: it needs
  // nothing but id + data. A NET-NEW interest must bring the full row.
  const isPatch = SI_SLUGS.has(id) && from !== "bundle" && d.name == null;
  if (!isPatch) {
    if (!SI_SLUGS.has(id) && from !== "bundle") netNew++;
    for (const f of ["name", "sig", "status", "accent", "group"]) {
      if (d[f] == null || d[f] === "") errs.push(`${at}: missing required "${f}"`);
    }
    if (d.status && !STATUS.has(d.status)) errs.push(`${at}: status "${d.status}" not live|preview|soon`);
    if (d.accent && !HEX_RE.test(d.accent)) errs.push(`${at}: accent "${d.accent}" isn't a 6-digit hex colour`);
    if (d.group && !GROUPS.has(d.group)) {
      warns.push(`${at}: group "${d.group}" has no SI_GROUPS entry — the board will render it unordered until one is added (no migration needed, grp is free text)`);
    }
    if (d.lux != null && typeof d.lux !== "boolean") errs.push(`${at}: lux must be true or false`);
  }

  // ── The dossier ─────────────────────────────────────────────────────────
  const data = d.data;
  if (data == null) { if (from !== "bundle") warns.push(`${at}: no data — the row lands, but the page renders nothing new`); continue; }
  if (typeof data !== "object" || Array.isArray(data)) { errs.push(`${at}: data must be an object (jsonb)`); continue; }
  dossiers++;
  for (const k of ["market", "streams", "sources", "timing", "events", "map", "providers", "faq", "wells", "whispers", "seo"]) {
    if (data[k] != null) (layerCount[k] = (layerCount[k] || 0) + 1);
  }
  // `_`-prefixed files are references (never shipped), so their teaching comments
  // are expected. In a real batch a leftover _comment is worth flagging.
  const isReference = basename(from).startsWith("_");
  if (!isReference) {
    for (const k of Object.keys(data)) if (k.startsWith("_")) warns.push(`${at}: data."${k}" is a comment key — strip _comment keys from real batches`);
  }

  // 1 — market
  if (data.market) {
    if (!data.market.figures?.length) warns.push(`${at}: data.market has no figures (layer 1 is the sizing — that's the layer)`);
    (data.market.figures ?? []).forEach((f: any, i: number) => checkFigure(at, "market", f, i));
  }
  // 2 — streams
  (data.streams ?? []).forEach((s: any, i: number) => {
    if (!s?.name) errs.push(`${at}: stream #${i + 1} has no "name"`);
    if (s?.id && !SLUG_RE.test(s.id)) errs.push(`${at}: stream "${s.name}" id "${s.id}" isn't a clean slug`);
    (s?.figures ?? []).forEach((f: any, j: number) => checkFigure(at, `stream "${s.name}"`, f, j));
  });
  // 3 — sources
  (data.sources ?? []).forEach((s: any, i: number) => {
    if (!s?.country) errs.push(`${at}: source #${i + 1} has no "country"`);
    if (s?.iso && !/^[A-Z]{2}$/.test(s.iso)) errs.push(`${at}: source "${s.country}" iso "${s.iso}" isn't a 2-letter uppercase code`);
    (s?.figures ?? []).forEach((f: any, j: number) => checkFigure(at, `source "${s.country}"`, f, j));
  });
  // 4a — timing
  if (data.timing) {
    for (const m of data.timing.best_months ?? []) {
      if (!Number.isInteger(m) || m < 1 || m > 12) errs.push(`${at}: timing.best_months has "${m}" (must be 1–12)`);
    }
    if (!data.timing.booking_window) warns.push(`${at}: timing has no booking_window — how far ahead it books is what tells Atlas when to raise it`);
  }
  // 4b — events
  (data.events ?? []).forEach((e: any, i: number) => {
    const label = e?.name ?? `#${i + 1}`;
    if (!e?.name) errs.push(`${at}: event #${i + 1} has no "name"`);
    if (e?.year == null && !e?.starts_on) errs.push(`${at}: event "${label}" has neither "year" nor "starts_on" — events are absolute dated series, never a season`);
    if (e?.year != null && (!Number.isInteger(e.year) || e.year < 2000 || e.year > 2100)) errs.push(`${at}: event "${label}" year "${e.year}" isn't a plausible 4-digit year`);
    for (const k of ["starts_on", "ends_on"]) {
      if (e?.[k] != null && (!ISO_DATE_RE.test(e[k]) || Number.isNaN(Date.parse(e[k])))) errs.push(`${at}: event "${label}" ${k} "${e[k]}" isn't an ISO yyyy-mm-dd date`);
    }
    if (e?.starts_on && e?.ends_on && Date.parse(e.ends_on) < Date.parse(e.starts_on)) errs.push(`${at}: event "${label}" ends before it starts`);
    if (e?.year != null && e?.starts_on && Number(e.starts_on.slice(0, 4)) !== e.year) errs.push(`${at}: event "${label}" year ${e.year} disagrees with starts_on ${e.starts_on}`);
  });
  // 5 — map (cross-references resolved below, once every id is known)
  for (const code of data.map?.regions ?? []) {
    if (!REGION_CODES.has(code)) errs.push(`${at}: map.regions has "${code}" — not a valid 13-code region`);
  }
  // 6 — providers
  (data.providers ?? []).forEach((p: any, i: number) => {
    const label = p?.name ?? `#${i + 1}`;
    if (!p?.name) errs.push(`${at}: provider #${i + 1} has no "name"`);
    if (!p?.booking_path) errs.push(`${at}: provider "${label}" has no "booking_path" (api|request-to-book|aggregator|lead) — that's the API-first check`);
    else if (!BOOKING_PATH.has(p.booking_path)) errs.push(`${at}: provider "${label}" booking_path "${p.booking_path}" not api|request-to-book|aggregator|lead`);
    if (p?.mode && !MODE.has(p.mode)) errs.push(`${at}: provider "${label}" mode "${p.mode}" not api|widget|affiliate|first-party`);
    if (p?.well && !WELL_IDS.has(p.well)) errs.push(`${at}: provider "${label}" well "${p.well}" isn't a known Well`);
    if (p?.confidence && !CONFIDENCE.has(p.confidence)) errs.push(`${at}: provider "${label}" confidence "${p.confidence}" not verified|estimate`);
    if (!p?.commission) warns.push(`${at}: provider "${label}" has no commission lane (the money — set it if bookable)`);
  });
  // 7 — faq
  (data.faq ?? []).forEach((f: any, i: number) => {
    if (!f?.q || !f?.a) errs.push(`${at}: faq #${i + 1} needs both q and a (it emits FAQPage schema)`);
  });
  // 8 — connective tissue
  for (const w of data.wells ?? []) if (!WELL_IDS.has(w)) errs.push(`${at}: wells has "${w}" — not a known Well id`);
  if (data.whispers != null && !Array.isArray(data.whispers)) errs.push(`${at}: whispers must be an array of strings`);
  // 9 — ship-ready
  if (data.seo && !data.seo.keywords?.length) warns.push(`${at}: data.seo has no keywords`);
  if (data.tagline_subject != null && typeof data.tagline_subject !== "string") errs.push(`${at}: tagline_subject must be a string`);
  if (!isPatch && !SI_TAGLINE_MAP.has(id) && !data.tagline_subject && (d.name ?? "").split(/\s+/).length > 1) {
    warns.push(`${at}: no tagline_subject — the brand line will read "If It's ${d.name}… TravelWell" instead of a tight noun. Add one.`);
  }
  if (data.faq?.length && !(data.schema ?? []).includes("FAQPage")) {
    warns.push(`${at}: has faq but schema doesn't list "FAQPage" (we emit it anyway — this is just the manifest disagreeing)`);
  }

  checkHero(at, data.hero, { errs, warns });

}

// ── Cross-reference resolution — the "map → empty shelf" bug ───────────────
let brokenRefs = 0, mapped = 0;
for (const { d } of rows) {
  for (const ref of d?.data?.map?.destinations ?? []) {
    mapped++;
    if (!LIVE_DEST_IDS.has(ref)) { errs.push(`${d.id}: map.destinations "${ref}" points to no destination (broken shelf)`); brokenRefs++; }
  }
}

// ── Report ────────────────────────────────────────────────────────────────
console.log(`\n── SI DOSSIER GATE ─────────────────────────`);
console.log(`source:      ${source}`);
console.log(`interests:   ${rows.length}   with a dossier: ${dossiers}   net-new: ${netNew}   unique ids: ${seenIds.size}`);
console.log(`layers:      ${Object.entries(layerCount).sort().map(([k, v]) => `${k}:${v}`).join("  ") || "—"}`);
console.log(`figures:     ${figures} (${verified} verified, ${figures - verified} estimate)   map refs: ${mapped} (${brokenRefs} broken)`);
if (warns.length) { console.log(`\n⚠︎ ${warns.length} warnings (won't block, but check):`); warns.forEach((w) => console.log("  · " + w)); }
if (errs.length) { console.log(`\n✗ ${errs.length} ERRORS (must fix before ingest):`); errs.forEach((e) => console.log("  ✗ " + e)); process.exit(1); }
console.log(`\n✓ Clean against live canon — safe to ingest.`);
console.log(`  (incoming ids: ${[...incomingIds].filter((i) => !SI_SLUGS.has(i)).join(", ") || "none net-new"})`);
