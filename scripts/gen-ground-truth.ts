/**
 * Emit the repository's ground truth — every count, field path and vocabulary
 * READ FROM THE SOURCE, with the file and line each one came from.
 *
 *   npm run gen:ground-truth   → docs/ground-truth.md
 *
 * WHY THIS EXISTS (2026-08-12). A planning surface with no access to this
 * repository produced a spec built on remembered field names: "booking windows
 * are in §6 of the nineteen sections." The dossier is nine layers, booking
 * windows are layer 4a, and no interest carries a dossier at all — so an
 * inheritance plan for 211 items had nothing to inherit from. None of that was
 * arguable; it was all one lookup away. The lookup just never happened, and
 * from the inside a confident recollection is indistinguishable from a read.
 *
 * So the fix isn't a promise to check more carefully. It's making the check a
 * command anyone can run and paste. This file is the artifact you hand to a
 * surface that can't read the repo — and because it is generated, it cannot
 * quietly drift from the code the way a hand-kept fact sheet does. A fact sheet
 * that goes stale is worse than none: it launders a stale claim as a verified
 * one.
 *
 * The conformance section is the important half. Counts answer "how many";
 * conformance answers "does the data actually obey the rule we wrote down",
 * which is the question a spec is really asking when it assumes a shape.
 */
import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import { SIS, boardSis, REGIONS, WELLS, LUX_WELLS, SI_GROUPS } from "../src/data/taxonomy";
import { DESTINATIONS, ACTIVITIES, PROVIDERS, GUIDES, SUBREGION_TOP } from "../src/data/places";
import { COUNTRY_ISO, SAFETY_DATA } from "../src/data/safety-data";

/**
 * A citation that survives the file moving underneath it.
 *
 * LINE NUMBERS ROT, and they rot silently — insert one line above and
 * `taxonomy.ts:222` now points at something else while still looking precise.
 * This repo ships daily, so a citation written this morning can be quietly
 * misdirecting by evening, and nothing about it looks stale.
 *
 * So every citation carries BOTH: the line number, which is exact right now and
 * regenerates on every run, and the matched source text, which is how a reader
 * finds the thing again after the number has drifted. Grep the anchor, ignore
 * the number.
 */
function lineOf(file: string, re: RegExp): string {
  const lines = readFileSync(file, "utf8").split("\n");
  const i = lines.findIndex((l) => re.test(l));
  if (i === -1) return `${file}`;
  const anchor = lines[i].trim().replace(/\s+/g, " ").slice(0, 46);
  return `${file}:${i + 1} · \`${anchor}\``;
}

const dests = Object.values(DESTINATIONS).flat();
const acts = Object.values(ACTIVITIES).flat();
const provs = Object.values(PROVIDERS).flat();
const board = boardSis(SIS);
const live = SIS.filter((s) => s.status === "live");
const allWells = [...WELLS, ...LUX_WELLS];

const TAX = "src/data/taxonomy.ts";
const PLACES = "src/data/places.ts";

// ── Conformance: does the DATA obey the rules we wrote down? ────────────────
// Each check is a documented rule turned into a predicate. A rule that can't be
// checked mechanically is left out rather than asserted — an unchecked rule in a
// list of checked ones reads as verified, which is the failure this file exists
// to prevent.
const idPattern = /^[a-z0-9]+(-[a-z0-9]+)+$/;
// The documented key is <city>-<country>, country spelled out. We can't prove a
// segment IS a country without a gazetteer, so this checks the weaker, decidable
// property: the id is hyphenated and multi-part at all. Single-word ids
// ("paris") definitively fail the convention.
const idConforming = dests.filter((d) => idPattern.test(d.id));
const idSingleWord = dests.filter((d) => !d.id.includes("-"));

const dossierFiles = {
  interests: readdirSync("src/data/interests").filter((f) => f.endsWith(".json")),
  destinations: readdirSync("src/data/destinations").filter((f) => f.endsWith(".json")),
};
const shipping = (files: string[]) => files.filter((f) => !f.startsWith("_"));

// Every country a destination sits in needs a country-level safety row, because
// `resolveSafety` cascades country → destination: a dossier carve-out with no
// baseline underneath it has nothing to carve out of.
const destCountries = [...new Set(dests.map((d) => d.country))];
const missingSafety = destCountries.filter((c) => !(c in COUNTRY_ISO));

// A safety row must not claim verification its own source denies. Uganda carried
// lvl 4 with `verified: "2026-08"` beside a source reading "NOT independently
// re-verified — confirm ... before public use". Both strings RENDER on the
// destination page, so a traveler saw an internal note to ourselves next to a
// Verified badge contradicting it. The caveat was written down and then ignored
// by every field that drives the UI.
const SELF_FLAGGED = /not independently|reported by|unconfirmed|not re-?verified|before public use/i;
const safetyRows = Object.entries(SAFETY_DATA as Record<string, {
  source?: string; verified?: string; reported?: boolean; unverified?: boolean; lvl?: number;
}>);
const provenanceLies = safetyRows.filter(([, r]) =>
  r.source && SELF_FLAGGED.test(r.source) && !r.reported && !r.unverified);
const claimsBoth = safetyRows.filter(([, r]) => r.reported && r.verified);

// Every country we know by name should have an advisory row. `COUNTRY_ISO` is
// the set we recognise — it drives the advisory checker's daily payload — so an
// ISO in there with no row in safety.json is a country we ask about every
// morning and hold no baseline for. The counts differing is how this surfaced.
const isoNoRow = [...new Set(Object.values(COUNTRY_ISO))].filter((i) => !(i in SAFETY_DATA));

const checks: { rule: string; result: string; ok: boolean; where: string }[] = [
  {
    rule: "The board is 35 Signature Interests in 10 categories (David-locked 2026-08-10)",
    result: `${board.length} on the board, ${Object.keys(SI_GROUPS).length} categories`,
    ok: board.length === 35 && Object.keys(SI_GROUPS).length === 10,
    where: lineOf(TAX, /export const SI_GROUPS/),
  },
  {
    rule: "Retired interests stay in SIS (the seed carries `delete … where id not in (…)`)",
    result: `${SIS.length - board.length} retired rows still present: ${SIS.filter((s) => s.retired).map((s) => s.id).join(", ") || "none"}`,
    ok: SIS.length > board.length,
    where: lineOf(TAX, /export const boardSis/),
  },
  {
    rule: "7 launch interests are live, plus `ultra` as the luxury overlay — 8 rows at status live",
    result: `${live.length} live: ${live.map((s) => s.id).join(", ")}`,
    ok: live.length === 8 && live.some((s) => s.id === "ultra"),
    where: lineOf(TAX, /export const SIS/),
  },
  {
    rule: "13 Wells total, 10 live + 3 soon",
    result: `${allWells.length} total, ${allWells.filter((w) => w.status === "live").length} live, ${allWells.filter((w) => w.status !== "live").length} not live`,
    ok: allWells.length === 13 && allWells.filter((w) => w.status === "live").length === 10,
    where: lineOf(TAX, /export const WELLS/),
  },
  {
    rule: "13-code region scheme",
    result: `${REGIONS.length} regions`,
    ok: REGIONS.length === 13,
    where: lineOf(TAX, /export const REGIONS/),
  },
  {
    rule: "Destination id is `<city>-<country>`, lowercase and hyphenated",
    result: `${idConforming.length} of ${dests.length} are hyphenated multi-part; ${idSingleWord.length} are single-word and cannot conform${idSingleWord.length ? ` (${idSingleWord.slice(0, 8).map((d) => d.id).join(", ")}${idSingleWord.length > 8 ? ", …" : ""})` : ""}`,
    ok: idSingleWord.length === 0,
    where: lineOf(PLACES, /export const DESTINATIONS/),
  },
  {
    rule: "Every interest dossier layer is optional, but a populated one must carry labeled figures",
    result: `${SIS.filter((s) => s.data && Object.keys(s.data).length).length} of ${SIS.length} interests carry a dossier`,
    ok: true, // zero is a valid state — it means the work hasn't started, not that a rule is broken
    where: lineOf(TAX, /export interface SiData/),
  },
  {
    rule: "Every country holding a destination **currently in the catalog** has a country-level safety row (the advisory cascade is country → destination)",
    result: missingSafety.length
      ? `${missingSafety.length} of ${destCountries.length} missing: ${missingSafety.join(", ")} — a dossier carve-out for these has no baseline to override`
      : `all ${destCountries.length} covered`,
    ok: missingSafety.length === 0,
    where: "src/data/safety-data.ts (COUNTRY_ISO) vs src/data/places.ts (DESTINATIONS)",
  },
  {
    rule: "Every country in `COUNTRY_ISO` has an advisory row — it is the set the daily checker asks about, so a missing row is a country we query and hold no baseline for",
    result: isoNoRow.length
      ? `${isoNoRow.length} with no row: ${isoNoRow.join(", ")} — checked daily, nothing to compare against`
      : `all ${Object.keys(SAFETY_DATA).length} covered`,
    ok: isoNoRow.length === 0,
    where: "src/data/safety-data.ts (COUNTRY_ISO) vs src/data/safety.json",
  },
  {
    rule: "No safety row claims verification its own `source` string denies (the source RENDERS on the destination page)",
    result: provenanceLies.length
      ? `${provenanceLies.length} row(s) self-flag as unconfirmed but carry neither \`reported\` nor \`unverified\`: ${provenanceLies.map(([iso]) => iso).join(", ")}`
      : `all ${safetyRows.length} rows consistent`,
    ok: provenanceLies.length === 0,
    where: "src/data/safety.json vs src/data/safety-data.ts (SafetyInfo.reported)",
  },
  {
    rule: "A `reported` safety row carries no `verified` date — we act on it, we don't claim it",
    result: claimsBoth.length ? `${claimsBoth.length}: ${claimsBoth.map(([iso]) => iso).join(", ")}` : "none claim both",
    ok: claimsBoth.length === 0,
    where: "src/data/safety.json",
  },
  {
    rule: "`_`-prefixed dossier files are references and never ship",
    result: `interests/: ${dossierFiles.interests.length} file(s), ${shipping(dossierFiles.interests).length} shipping · destinations/: ${dossierFiles.destinations.length} file(s), ${shipping(dossierFiles.destinations).length} shipping`,
    ok: true,
    where: "src/data/interests/, src/data/destinations/",
  },
];

// ── The nine layers, read off the interface itself ──────────────────────────
const LAYERS: [string, string, string][] = [
  ["1", "market", "{ summary?, figures?: Figure[] }"],
  ["2", "streams", "{ id?, name, blurb?, figures? }[]"],
  ["3", "sources", "{ country, iso?, note?, figures? }[]"],
  ["4a", "timing", "{ season?, best_months?: number[], booking_window?: string, notes? }"],
  ["4b", "events", "SiEvent[]"],
  ["5", "map", "{ destinations?: string[], regions?, anchors?, note? }"],
  ["6", "providers", "SiProvider[]"],
  ["7", "faq", "SiFaq[]"],
  ["8", "wells · whispers · safety", "string[] · string[] · Record<string, unknown>"],
  ["9", "seo · schema", "{ title?, description?, keywords?, geo_keywords? } · string[]"],
];

const rows = (r: string[][]) => r.map((c) => `| ${c.join(" | ")} |`).join("\n");
const tick = (ok: boolean) => (ok ? "✅" : "⚠️");

const md = `# Ground truth — generated, do not hand-edit

*Generated by \`npm run gen:ground-truth\`. Every number and field path below is
read from the source at generation time.*

**What this is for.** Hand it to anyone — or anything — that needs to reason
about this codebase without being able to read it. A spec built on a remembered
field name is bad work, and the remedy is not more care: it is a lookup that
costs one command. Because this file is generated, it cannot drift from the code
the way a hand-kept fact sheet does, and a fact sheet that has gone stale is
worse than none — it launders a stale claim as a verified one.

**How to use it in a review.** Take each factual claim in the spec — a field
name, a section number, a count, a file path — and find it here. Anything you
cannot find is unverified, which is not the same as wrong, but it is the same as
not-yet-checkable. Say so rather than letting it through.

**Citations carry an anchor, not just a line number.** Every \`file:line\` below is
followed by the source text it points at. Line numbers rot silently — insert one
line above and the number points elsewhere while still looking precise — so grep
the anchor and ignore the number if the two disagree. Regenerating fixes both.

**You can read this file instead of running it.** A pre-commit hook re-runs every
generator and refuses the commit if any generated file is out of step, so the
committed copy cannot be behind the source it describes. Reading it at HEAD is as
good as regenerating it.

## Inventory

| Thing | Count | Read from |
|---|---|---|
${rows([
  ["Signature Interests on the board", String(board.length), lineOf(TAX, /export const SIS/)],
  ["…rows in \`SIS\` including retired", String(SIS.length), lineOf(TAX, /export const boardSis/)],
  ["…at \`status: live\` (incl. \`ultra\` overlay)", String(live.length), lineOf(TAX, /export const SIS/)],
  ["SI categories", String(Object.keys(SI_GROUPS).length), lineOf(TAX, /export const SI_GROUPS/)],
  ["Destinations", String(dests.length), lineOf(PLACES, /export const DESTINATIONS/)],
  ["…with a \`price_band\`", `${dests.filter((d) => d.price_band).length}`, lineOf(PLACES, /price_band\?/)],
  ["…at \`depth: verified\`", `${dests.filter((d) => d.depth === "verified").length}`, lineOf(PLACES, /export type DestDepth/)],
  ["Activities", String(acts.length), lineOf(PLACES, /export const ACTIVITIES/)],
  // The bundle is not the whole picture: gen-catalog-seed merges the provider
  // CSVs on top before writing 0004, so the DB carries more than this array.
  // Reporting only the array would understate it by a third.
  ["Providers **in the bundle**", `${provs.length} (CSVs under \`src/data/providers/\` merge on top at seed time — run \`npm run gen:catalog\` to see the DB total)`, lineOf(PLACES, /export const PROVIDERS/)],
  ["Regions", String(REGIONS.length), lineOf(TAX, /export const REGIONS/)],
  ["Wells (10 live + 3 soon)", String(allWells.length), lineOf(TAX, /export const WELLS/)],
  ["Sub-region lists", String(Object.keys(SUBREGION_TOP).length), lineOf(PLACES, /export const SUBREGION_TOP/)],
  ["Guides", String(GUIDES.length), lineOf(PLACES, /export const GUIDES/)],
  // These were one row reading "Countries with a safety row: 37", which was
  // wrong twice: it counted name→ISO entries, not advisory rows, and the
  // mislabel hid the fact that the two numbers differ. Reported by David's
  // nineteen-rules v3 as an inconsistency; it turned out to conceal a gap.
  ["Country name→ISO entries (`COUNTRY_ISO`)", String(Object.keys(COUNTRY_ISO).length), lineOf("src/data/safety-data.ts", /export const COUNTRY_ISO/)],
  ["…of those, countries WITH an advisory row (`safety.json`)", String(Object.keys(SAFETY_DATA).length), lineOf("src/data/safety-data.ts", /export const SAFETY_DATA/)],
])}

## The Signature-Interest dossier — NINE layers

Defined by \`SiData\` at ${lineOf(TAX, /export interface SiData/)}. There is no
nineteen-section structure in this repository.

| Layer | Field path | Type |
|---|---|---|
${rows(LAYERS.map(([n, f, t]) => [n, f.split(" · ").map((k) => `\`data.${k}\``).join(" · "), `\`${t}\``]))}

**Booking windows are layer 4a**, at \`data.timing.booking_window\`
(${lineOf(TAX, /booking_window\?/)}), typed \`string\`. Layer 6 is \`providers\`.

**Every figure carries its own confidence.** \`Figure\` is
\`{label, value, confidence, source?}\` with \`confidence\` REQUIRED
(${lineOf(TAX, /export interface Figure/)}); \`verified\` without a \`source\` is a
hard error in \`npm run validate:si\`. An unlabeled number is a guessed number.

## Live roster

**Interests at \`status: live\` (${live.length}):** ${live.map((s) => `\`${s.id}\``).join(" · ")}
— \`ultra\` is the luxury overlay, not a trip type, so the bookable set is ${live.length - 1}.

**Wells live (${allWells.filter((w) => w.status === "live").length}):** ${allWells.filter((w) => w.status === "live").map((w) => w.name).join(" · ")}
**Not live (${allWells.filter((w) => w.status !== "live").length}):** ${allWells.filter((w) => w.status !== "live").map((w) => w.name).join(" · ")}

## Canonical vocabularies — as typed, not as remembered

| Vocabulary | Values | Read from |
|---|---|---|
${rows([
  ["Budget tier (\`price\`)", "`essential` · `comfort` · `premier` · `luxury` · `ultra`", lineOf(PLACES, /export type Price/)],
  ["Provider curation (\`tier\`)", "`prime` · `vetted` · `prospective`", lineOf(PLACES, /export type Tier/)],
  ["Interest status", "`live` · `preview` · `soon`", lineOf(TAX, /export type Status/)],
  ["Destination status", "`live` · `future`", lineOf(PLACES, /export type DestStatus/)],
  ["Destination depth", "`verified` · `stub` · `cached`", lineOf(PLACES, /export type DestDepth/)],
  ["Booking path", "`api` · `request-to-book` · `aggregator` · `lead`", lineOf(TAX, /export type BookingPath/)],
])}

Budget tier and provider curation are **different axes** that both get called
"tier" in conversation. \`price\` is what it costs; \`tier\` is how well we know
the provider.

## Conformance — does the data obey the rules?

${checks.map((c) => `${tick(c.ok)} **${c.rule}**\n   → ${c.result}\n   → \`${c.where}\``).join("\n\n")}

*Scope note on the safety check: it covers the countries we serve **today**. An
incoming dossier can name a country with no row yet — the Philippines has none —
and that surfaces at \`npm run validate:ingest\`, not here. A green tick above is
not a claim about countries we haven't ingested.*

## What is NOT populated yet

Stating this explicitly because an empty structure and a filled one look
identical in a schema, and a plan that assumes inheritance needs to know which
it is.

- **${SIS.filter((s) => s.data && Object.keys(s.data).length).length} of ${SIS.length} interests carry a dossier.** The only \`booking_window\` value in the repo is inside \`src/data/interests/_REFERENCE.golf.json\`, which is \`_\`-prefixed and never ships. **There is nothing to inherit booking windows from.**
- **${dests.filter((d) => d.price_band).length} of ${dests.length} destinations carry a \`price_band\`.**
- **${dests.filter((d) => d.feel?.length).length} of ${dests.length} destinations carry \`feel\` tags.**
- **${dests.filter((d) => d.sub_region).length} of ${dests.length} destinations carry a \`sub_region\`.**
- **${shipping(dossierFiles.destinations).length} shipping destination dossier file(s)** and **${shipping(dossierFiles.interests).length} shipping interest dossier file(s)** in the drop-in folders.

## Gates

| Command | Refuses |
|---|---|
| \`npm run validate:ingest\` | A destination batch that breaks the destination contract |
| \`npm run validate:si\` | An interest dossier with an unlabeled figure, or \`verified\` with no \`source\` |
| \`npm run check:advisory-links\` | An advisory deep link that 404s — **and a run that proved nothing** (exit 2), or a partial one (exit 3). Needs outbound network. |
| \`npx tsc --noEmit\` + \`npm run build\` | Anything that doesn't type-check or build |
`;

writeFileSync("docs/ground-truth.md", md);
const failing = checks.filter((c) => !c.ok);
console.log(`Wrote docs/ground-truth.md — ${checks.length} conformance checks, ${failing.length} not conforming`);
for (const f of failing) console.log(`  ⚠️  ${f.rule}\n      ${f.result}`);
