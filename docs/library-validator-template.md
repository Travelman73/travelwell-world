# Data-integrity validator — hand-over template for the research library (their D3)

**For:** CC, in `Travelwell-world/travelwell-world`.
**Why:** the dangling `kruger-national-park-south-africa` ref was found by luck. This
makes that class of bug impossible to commit. It's the highest-leverage item on the
D1–D5 list — everything after it gets cheaper and safer.

This is the **pattern we already run on the MVP side** (`scripts/validate-destinations.ts`,
`npm run validate:ingest`), re-shaped for the library's file-per-entity layout. Don't
copy ours literally — the repos differ (we validate a bundled catalog; you validate
~544 individual `.json` files). Copy the **architecture**, then use the drop-in below.

---

## What it must enforce (the four classes)

1. **Referential integrity** — every cross-reference resolves to a file that exists.
   `destination_id` · `provider_ids[]` · `safety_card_ref` · `si_anchors`.
   *This is the one that would have caught Kruger.*
2. **Enum whitelists** — one spelling per concept, and for anything crossing the
   border into the MVP, **our** spelling (tables below). Internal consistency alone
   isn't enough — a self-consistent repo can still fail our ingest gate.
3. **Required fields** — no entity missing the fields downstream code assumes.
4. **Id hygiene** — unique ids, one slug convention, no duplicates pointing at the
   same real-world place.

## The architecture (five steps — order matters)

1. **Load canon** into edit-once constants at the top of the file.
2. **Load every entity file** into typed buckets (destinations / providers / si / safety).
3. **Index ids per bucket** — you need the *complete* id universe before step 5.
4. **Per-file checks** — required fields, enums, id format, duplicates. Collect
   cross-references as you go; **don't resolve them yet.**
5. **Deferred cross-reference pass** — resolve every collected ref against the full
   index. *(Deferring is the trick: a ref may point at a file loaded later, so
   resolving inline produces false failures.)*

Then: print counts, list warnings, list errors, **exit non-zero if any error.**
Warnings inform; errors block. Never auto-fix — report and let a human decide.

---

## Drop-in script

Save as `scripts/validate-data.ts`. Zero dependencies; runs under `bun` or `node`.

```ts
/**
 * Data-integrity validator — the librarian at the door.
 * Fails the build on: a broken cross-reference, a non-canonical enum, a missing
 * required field, or a duplicate id. Report-only; never auto-fixes.
 *
 *   bun run scripts/validate-data.ts
 */
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join, basename } from "node:path";

/* ── 1. CANON — edit here, nowhere else ────────────────────────────────── */

// The MVP's 13-code scheme is canonical (David-confirmed 2026-08). While this
// repo still carries 15-scheme codes, validate against LIBRARY_REGIONS and flip
// the flag once the crosswalk is applied — then bad codes become hard errors.
const MVP_REGIONS = ["01F","02F","03F","04A","05A","06A","07A","08A","09P","10S","11C","12A","13A"];
const LIBRARY_REGIONS = ["01F","02A","03B","04B","05C","06D","07A","08E","09F","10C","11A","12A","13A","14A","15A"];
const REGIONS_ARE_MIGRATED = false;  // ← flip to true after the 15→13 crosswalk
const VALID_REGIONS = new Set(REGIONS_ARE_MIGRATED ? MVP_REGIONS : LIBRARY_REGIONS);

// Signature Interests — the MVP's canonical slugs. Anything else won't surface.
const SI_SLUGS = new Set(["ultra","tropical","romance","safari","expedition","adventure",
  "liveaboard","river","diveglobal","ocean","wellness","wildlife","glamping","family","group",
  "hiking","ski","olympic","senior","culinary","culture","deepdive","pilgrimage","entertainment",
  "nightlife","sports","spectator","prosports","compsports","sailing","yacht","wine"]);

// Budget tiers — exactly five, MVP-canonical.
const TIERS = new Set(["essential","comfort","premier","luxury","ultra"]);

// provider_type — one spelling per concept (underscore convention). ADD to this
// list deliberately; a typo should fail, not silently create a new category.
const PROVIDER_TYPES = new Set(["safari_operator","safari_lodge","hotel_chain","regional_airline",
  "cruise_line","expedition_operator","dmc","tour_operator","rail_operator","transfer_operator"]);

const ADVISORY = new Set(["L1","L2","L3","L4"]);
const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

// Findings. Errors block the build; warnings inform. Declared before the load
// block because parse failures are reported during loading.
const errs: string[] = [];
const warns: string[] = [];

/* ── 2. LOAD ───────────────────────────────────────────────────────────── */

const DIRS = {
  destination: "data/destinations",
  provider:    "data/providers",
  si:          "data/si",
  safety:      "data/safety",
};

type Entity = { kind: string; file: string; id: string; json: any };
const entities: Entity[] = [];

for (const [kind, dir] of Object.entries(DIRS)) {
  if (!existsSync(dir)) { console.log(`(skip: ${dir} not found)`); continue; }
  for (const f of readdirSync(dir).filter((f) => f.endsWith(".json"))) {
    const path = join(dir, f);
    let json: any;
    try { json = JSON.parse(readFileSync(path, "utf8")); }
    catch (e) { errs.push(`${path}: invalid JSON — ${(e as Error).message}`); continue; }
    // id = the filename stem minus the type suffix (kruger-south-africa.destination.json)
    const id = basename(f).replace(/\.(destination|provider|si|safety)?\.json$/, "");
    entities.push({ kind, file: path, id, json });
  }
}

/* ── 3. INDEX (must be complete before step 5) ─────────────────────────── */

const index: Record<string, Set<string>> = {};
const seen: Record<string, Set<string>> = {};
for (const e of entities) {
  (index[e.kind] ??= new Set()).add(e.id);
  const s = (seen[e.kind] ??= new Set());
  if (s.has(e.id)) errs.push(`${e.file}: duplicate ${e.kind} id "${e.id}"`);
  s.add(e.id);
}

/* ── 4. PER-FILE CHECKS (collect refs, don't resolve) ──────────────────── */

type Ref = { at: string; kind: string; ref: string; field: string };
const refs: Ref[] = [];
const need = (e: Entity, ...fields: string[]) => {
  for (const f of fields) if (e.json[f] == null || e.json[f] === "") errs.push(`${e.file}: missing required "${f}"`);
};

for (const e of entities) {
  const at = e.file;
  if (!SLUG_RE.test(e.id)) errs.push(`${at}: id "${e.id}" isn't a clean lowercase slug`);

  if (e.kind === "destination") {
    need(e, "name", "country", "region_id");
    const r = e.json.region_id;
    if (r && !VALID_REGIONS.has(r)) errs.push(`${at}: region_id "${r}" not in the ${REGIONS_ARE_MIGRATED ? "13" : "15"}-code scheme`);
    for (const si of e.json.si_anchors ?? []) if (!SI_SLUGS.has(si)) errs.push(`${at}: si_anchor "${si}" isn't a canonical SI slug`);
    for (const p of e.json.provider_ids ?? []) refs.push({ at, kind: "provider", ref: p, field: "provider_ids" });
    if (e.json.safety_card_ref) refs.push({ at, kind: "safety", ref: e.json.safety_card_ref, field: "safety_card_ref" });
    const lvl = e.json.safety?.advisory_level;
    if (lvl && !ADVISORY.has(lvl)) errs.push(`${at}: advisory_level "${lvl}" not L1–L4`);
    for (const t of e.json.tier_range ?? []) if (!TIERS.has(t)) errs.push(`${at}: tier_range "${t}" isn't a canonical tier`);
  }

  if (e.kind === "provider") {
    need(e, "name", "provider_type");
    const t = e.json.provider_type;
    if (t && !PROVIDER_TYPES.has(t)) errs.push(`${at}: provider_type "${t}" isn't whitelisted (add deliberately, or fix the spelling)`);
    for (const si of e.json.si_tags ?? e.json.si ?? []) if (!SI_SLUGS.has(si)) errs.push(`${at}: si tag "${si}" isn't a canonical SI slug`);
  }

  if (e.kind === "si") {
    // The Kruger class: an SI's top destinations must resolve — especially once
    // is_real flips true and the entry becomes live/clickable.
    for (const d of e.json.top_destinations ?? []) {
      const id = d?.destination_id;
      if (!id) { errs.push(`${at}: a top_destination has no destination_id`); continue; }
      if (d.is_real === true) refs.push({ at, kind: "destination", ref: id, field: "top_destinations[].destination_id" });
      else warns.push(`${at}: "${id}" is is_real:false (not checked — will be enforced when flipped true)`);
    }
  }
}

/* ── 5. DEFERRED CROSS-REFERENCE PASS ──────────────────────────────────── */

let broken = 0;
for (const { at, kind, ref, field } of refs) {
  if (!index[kind]?.has(ref)) {
    errs.push(`${at}: ${field} → "${ref}" resolves to no ${kind} file (broken reference)`);
    broken++;
  }
}

/* ── 6. REPORT ─────────────────────────────────────────────────────────── */

const counts = Object.entries(index).map(([k, v]) => `${k}:${v.size}`).join("  ");
console.log(`\n── DATA INTEGRITY ─────────────────────────`);
console.log(`entities:    ${entities.length}   (${counts})`);
console.log(`references:  ${refs.length} checked, ${broken} broken`);
console.log(`regions:     validating against the ${REGIONS_ARE_MIGRATED ? "13-code MVP" : "15-code library"} scheme`);
if (warns.length) { console.log(`\n⚠︎ ${warns.length} warnings:`); warns.forEach((w) => console.log("  · " + w)); }
if (errs.length) { console.log(`\n✗ ${errs.length} ERRORS:`); errs.forEach((e) => console.log("  ✗ " + e)); process.exit(1); }
console.log(`\n✓ Data layer is clean.`);
```

---

## Wire it in (this is what makes it real)

```jsonc
// package.json
"scripts": {
  "validate": "bun run scripts/validate-data.ts",
  "check": "bun run validate && bun test"   // fold into your existing check
}
```
Add it to CI so a PR with a broken ref **cannot merge**, and ideally a pre-commit hook
so it fails in seconds on the author's machine rather than in review.

## The canon tables (must match ours where it crosses the border)

| Vocabulary | Canonical values |
|---|---|
| **Regions (MVP, 13)** | `01F 02F 03F 04A 05A 06A 07A 08A 09P 10S 11C 12A 13A` |
| **Budget tiers** | `essential · comfort · premier · luxury · ultra` |
| **Provider curation tier** | `prime · vetted · prospective` *(distinct from price)* |
| **Provider handoff mode** | `api · widget · affiliate · first-party` |
| **Wells (12)** | `fly stay eat move gear beauty activities shop insure ship nanny security` |
| **SI slugs (32)** | `ultra tropical romance safari expedition adventure liveaboard river diveglobal ocean wellness wildlife glamping family group hiking ski olympic senior culinary culture deepdive pilgrimage entertainment nightlife sports spectator prosports compsports sailing yacht wine` |
| **Safety advisory** | `L1 · L2 · L3 · L4` |

## Sequencing note

Build this **before** the D4 enum pass, not after. Canonicalize with the validator
already in place and it both verifies the pass landed *and* prevents the drift from
returning. The 8 safari files (D1) are the first slice of D4 — land them, then this.

## Verified before hand-over

This script was extracted from this doc and run against a mock of your layout
(`data/destinations|providers|si|safety/*.json`). Three cases, all behaving:

| Case | Result |
|---|---|
| SI pointing at `kruger-national-park-south-africa` (the real bug) | ✗ *"resolves to no destination file (broken reference)"* — **exit 1** |
| Same repo with the ref corrected | ✓ *"Data layer is clean."* — **exit 0** |
| `provider_type: "safari-operator"` + `si: ["safaris"]` | ✗ 2 errors (non-whitelisted enum, non-canonical SI slug) — **exit 1** |

So it catches the bug that prompted this, passes clean data, and enforces the D4
spellings. Paste-and-run.

## Definition of done

- `bun run validate` prints **"✓ Data layer is clean."** on a full repo scan
- it **exits non-zero** on a deliberately broken ref (test it: point a
  `destination_id` at a nonexistent file and confirm the build fails)
- it's wired into CI and blocks merge
- `REGIONS_ARE_MIGRATED` flips to `true` the day the 15→13 crosswalk is applied
