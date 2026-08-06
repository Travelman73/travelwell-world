# Dossier → MVP ingest shape (the drop-in target)

The shape each conformed dossier normalizes into so it lands **drop-in ready** for
the catalog generator. Author into `src/data/places.ts` → regenerate `0005` →
run. Do **not** write rows straight to the DB (the generated `0005` has a
self-cleaning `delete … where id not in (source)` that would wipe out-of-pipeline rows).

## The border gate — run it BEFORE ingest (`npm run validate:ingest`)
`scripts/validate-destinations.ts` is the MVP-side validator: it checks incoming
dossiers against the **live** canon (region codes, SI/Well/tier spellings, the
`<city>-<country>` id rule, sub_regions, the jewel/FAQ v1 shape, `reconciles_live_mvp`
resolution) **and resolves every cross-reference** — a "see also" pointing at a
place that doesn't exist is the exact bug that would ship then translate ×9. It
exits non-zero on any error, so it gates a PR.
- **Incoming library JSON:** `npm run validate:ingest -- path/to/dossiers` (a `.json`
  array/region-map, or a directory of `.json`).
- **Self-check (regression guard on our own bundle):** `npm run validate:ingest`.
The 38 legacy live slugs (`bali`, `kyoto`, `machu`…) are grandfathered as the
reconcile anchors; net-new ids must be `<city>-<country>`.

---

## Where it lands
`src/data/places.ts` → `DESTINATIONS`, a `Record<regionCode, Destination[]>`.
The key is the **13-code MVP region scheme** (`01F`, `05A`, `11C`, …). Each
destination object goes in its region's array.

## The `Destination` object (exact fields)

```ts
{
  id:          string;   // "<city>-<country>" — REQUIRED, canonical (see rules)
  name:        string;   // display name, e.g. "Cape Town"
  country:     string;   // full country name, e.g. "South Africa"
  line:        string;   // one editorial hook (the card subtitle)
  status:      "live" | "future";                 // shown, or coming-soon (content-only)
  depth:       "verified" | "stub" | "cached";     // how deep the dossier is
  img:         string;   // image key (existing key or an Unsplash query term)
  sub_region?: string;   // country-internal string, VERBATIM from the master
  si?:         string[]; // Signature Interest slugs served (real taxonomy ids)
  feel?:       string[]; // feel/archetype tags (SI + feel used together, never alone)
  tier_range?: string[]; // budget bands present, subset of the 5 (see rules)
  price_band?: string;   // coarse overall label (one of the 5 tiers)
  draw_rank?:  "anchor" | "core" | "emerging";     // surface order
  data?:       object;   // the full rich dossier as JSON (see `data` shape below)
}
```

The generator reads every one of these fields, so emit **full object literals**
— not the `D(...)` shorthand (that only sets the first seven and is for the
legacy bundle rows).

## Field rules (the ones the DB + app enforce)
- **`id` — canonical, no exceptions.** `<city>-<country>`, full country spelled
  out, lowercase, hyphenated: `cape-town-south-africa`, `new-york-united-states`,
  `queenstown-new-zealand`. Never a bare slug (`cape-town`), never a code
  (`-za`), never `mx` for Mexico. Comes **verbatim from the conformed dossier's
  canonical key** — don't derive from memory (edge cases: `st-lucia`,
  Patagonia spanning Chile/Argentina, etc.). **Also renormalize the ~38 legacy
  bundle rows** (`paris` → `paris-france`, `masai-mara` → `maasai-mara-kenya`) so
  the table ends up on one scheme.
- **`status`** = `live` (shown now) or `future` (content-only / coming-soon). Not `stub`.
- **`depth`** = `verified` (full sourced dossier) · `stub` (a line + image) · `cached` (Atlas-written, unverified). Separate axis from status.
- **`sub_region`** = the country-internal string **verbatim** from `docs/sub-region-master.md` / the dossier — never sketched.
- **`si`** = real Signature-Interest slugs only (e.g. `safari`, `tropical`, `culinary`, `ski`). Unknown slugs won't error but won't surface.
- **`feel` = a CONTROLLED vocabulary, never free-invented.** Map each dossier's prose to 2–4 tags from this fixed set (so the ~570 cluster and the SI + feel + region match engine can use them). Free-form per-dossier tags are the failure mode — they don't cluster and are useless downstream. The set: `dramatic · serene · rugged · refined · wild · polished · cosmopolitan · buzzy · festive · romantic · secluded · family-friendly · coastal · alpine · historic · tropical · urban · remote · pastoral · adventurous`. If a recurring concept is genuinely missing, add it to THIS list deliberately — not ad hoc inside a dossier.
- **`tier_range` = the full budget spread present** (subset of the canonical five: `essential` · `comfort` · `premier` · `luxury` · `ultra`) — keep the whole range; it's what budget filtering reads. **`price_band` = the median tier of that range** (mechanical, reproducible; a single coarse *positioning* label). Both come from the five only.
- **`draw_rank`** = `anchor` | `core` | `emerging` (or omit). Dossiers that carry a **numeric** rank map as **`1 → anchor`, `2 → core`, `3 → emerging`**, and clamp anything ≥ 3 to `emerging`.
- **`img`** = an image key already in the set if one fits, else a short Unsplash query term (the app has an Unsplash fallback).
- **region code** = correct 13-code value; it's a FK to `regions(code)`, so a bad code **errors** the ingest.

## The `data` jsonb (the rich body)
Free-form JSON — the DB stores it as-is; the app consumes it as the render/SEO/
dossier sockets ship. Keep it structured and consistent. Recommended top-level keys:

```jsonc
{
  "seo":      { "title": "...", "meta": "...", "canonical": "...", "hreflang": {...}, "jsonld": {...} },
  "safety":   { "advisory_level": "L1|L2|L3|L4", "posture": "...", "booking_hold": false, "notes": "..." },
  "jewels":   [ { "name": "...", "tier": "premier", "price_band": "...", "when": "...", "blurb": "..." } ],
  // ── Buffet block (AEO top-load) — the ripe material AI cites first ──
  "facts":    [ { "headline": "...", "text": "...", "number": "...", "source": "..." } ],  // fast facts (hard number + source each)
  "faq":      [ { "q": "...", "a": "...", "source": "..." } ],  // traveler questions, answer-first → EMITS FAQPage schema
  "quotes":   [ { "text": "...", "attribution": "TravelWell advisor desk" } ],  // attributed pull-quotes
  "booking":  { "windows": [...], "commission_lane": "..." },  // NOTE: confirmation_return is NOT here — it's provider-level (see below)
  "timing":   { "season": "...", "best_months": [8,9], "notes": "..." },
  "trails":   [ ... ],   // booking lanes / provider hooks, if present
  "source":   { "last_verified": "2026-07-13", "confidence": "high" }
}
```
Near-term consumers: `seo`, `safety`, `jewels` (rendering + safety spine +
layered page) and the **buffet block** (`facts` / `faq` / `quotes` — the
AEO top-load). Everything else rides along. If a dossier lacks a section, omit
the key — don't fabricate.

### ✅ v1 ingest tier — carry this now (Sana's Call 2, David-locked 2026-08)
`data` is jsonb, so "extend" costs no migration — it's a decision about *what we
commit to carrying* this pass. **This pass carries the render spine + the money +
the AI-citation:**
- **`safety`** + **`timing`** — as today.
- **`jewels[]`** — now with **`si`** (the Signature-Interest slug it serves) **and
  `commission`** (that jewel's earning path/lane — the money) on each entry, plus
  `name` / `tier` / `when` / `blurb`.
- **`faq[]`** — `{ q, a, source }`; auto-emits `FAQPage` JSON-LD (the AI-citation).

These now render in the app: the destination page shows a **Don't-miss jewels**
block (with the commission lane) and a **Good to know** FAQ accordion, and the
catalog read carries `data` from the DB (not just the bundle). Reference row:
`zermatt-switzerland` in `src/data/places.ts`.

**Deferred to a later pass (ingest when ready — the jsonb holds them freely, no
migration):** `seo`, `trails`/supply, `ultra`, `facts`, `quotes`. Omit them now
rather than half-fill.

**`vibe[]` / `feel[]` — leave empty on ingest (deliberate).** It's a live field but
not in the dossier recipe; we populate it later from the **Identity Card's read of
the traveler's vision** (the living Travel ID), not from dossier prose. Seen, not
dropped.

**The buffet block drives AI citation (AEO), so it maps 1:1 to the source:**
- `facts` = the fast facts, each with a **hard number** and a **`source`** — one claim per entry so the AI can lift it as a standalone chunk.
- `faq` = the traveler questions, **answer-first**, one per Signature Interest **plus the top 2–3 safety questions** (safety is the open lane), each with a `source`. **`faq` auto-emits `FAQPage` JSON-LD** via `src/lib/jsonld.ts` — no separate schema step; put the buffet Q&A here and the structured data writes itself.
- `quotes` = 3–4 attributed pull-quotes (advisor desk / named DMC / TCI relationships).
These are the *same* material as the deep dossier, lifted to the top — additive, no rewrite. (Rendered + citable once the SSG socket serves the page HTML.)

**`confirmation_return` is provider-level, not a place property.** It's how a
*given supplier* returns a booking confirmation into the itinerary
(`email-parse` everywhere to start → `api` as each provider ships it → `none`
otherwise) — it lives on the **provider / booking-lane record**, set when the
supplier ledger is built, and drives the booking-return flow. Do **not**
populate it from dossier prose; leave it out of the destination's `data` (or
`"none"` if a slot is expected).

## Conforming the library JSON → this shape (the key + the drift fixes)

**The key we ingest on:** our MVP primary key is **`id` = `<city>-<country>`**, **derived from each dossier's `name` + `country`** (slugified, full country, per the id rules above) — e.g., `machu-picchu-peru`. That's the key for ALL 458; it does not depend on your `destination_id` (whose two conventions, or absence on 40 files, don't matter — carry it into `data.dossier_id` for traceability regardless).
- **`reconciles_live_mvp` is only needed for the ≤38 dossiers that match an already-live MVP row** (not ~454). A dossier reconciles only if it's the *same place* as one of the 38 rows currently in the app. For those, set `data.reconciles_live_mvp` to the row's **current slug** (e.g. `masai-mara`, `machu`, `cape-town-south-africa`) so the dossier maps onto that row despite any spelling drift, instead of creating a duplicate. **The current 38 live slugs are listed in `src/data/places.ts` `DESTINATIONS`** (Sana can hand them over).
- **The other ~420 dossiers are net-new** — no `reconciles_live_mvp` needed; they just get their derived `<city>-<country>` id. (The derived id is itself the reconciliation: same place → same id → same slot.)

**Block mapping (dossier JSON → this shape):** `name`/`country`/`region_code`/`sub_region` → same top-level fields · `sis_present` → `si[]` (as slugs, below) · `key_facts` → `data.facts` · `safety` → `data.safety` · booking-window/`tdt` → `data.timing` + `data.booking` · `supply` → `data.trails` / provider ledger · `ultra` → `data.ultra` · `seo` → `data.seo` · `jewels` → `data.jewels` (+ the buffet `data.faq` / `data.quotes`).

**Resolve the five drifts to ONE shape (normalize on the pass):**
1. **`coordinates`** → the three forms (object `{lat,lng}`, array `[lat,lng]`, string) all normalize to one: an **object of numbers** `{ "lat": -13.16, "lng": -72.54 }` in **`data.geo`**.
2. **`sis_present`** → our canonical **SI slugs** in `si[]` — map codes/full-names to: `ultra, tropical, romance, safari, expedition, adventure, liveaboard, river, diveglobal, ocean, wellness, wildlife, glamping, family, group, hiking, ski, olympic, senior, culinary, culture, deepdive, pilgrimage, entertainment, nightlife, sports, spectator, prosports, compsports, sailing, yacht, wine`. (You hold the code legend — e.g. `RHN`/`GEA`; we hold the target slugs. Drop any status suffix — status lives on the destination, not the SI tag.)
3. **`si_subtypes`** → always an **object keyed by SI slug** (`{ "safari": [...], "wine": [...] }`) in `data.si_subtypes` (never a flat list).
4. **`seo`** → one canonical object in `data.seo`: `{ title, meta, canonical, keywords[], hreflang, jsonld_type, author_byline, content_freshness }`. Keep whatever's present; **omit missing keys** (don't fabricate `meta_description`/`slug`/keywords where absent).
5. **Nested-array field names** → one name each, across every file: jewels use **`name`** + **`si`** slug (not `si_tag`); ultra uses **`positioning`** (fold in `why_ultra`) + **`earning_path`** (fold in `earning`); supply uses **`si`** (not `si_tag`). One vocabulary everywhere.

If a field is genuinely absent, omit it — never invent. A strict parser then sees one shape across all ~570.

## The 98 "no-block" (prose-only) dossiers — ingest them, don't hold them

98 of the library dossiers carry **no structured blocks** — narrative prose, no
`key_facts` / `safety` / `jewels` to map into `data`. The call: **bring them in
now as `depth: stub`, don't quarantine them.** Reasoning:
- **They're not a safety risk to surface, because the MCP + app safety spine has a
  country-level fallback** (`src/data/safety.json` → `supabase/functions/mcp/safety-fallback.ts`).
  A block-less destination with no `data.safety` still gets a real
  advisory_level/booking_hold **derived from its country** (marked `derived:true`),
  so the L4-held / L3-gated / L1-L2-free gate still fires. The usual reason to hold
  a thin dossier — "we can't gate it safely" — doesn't apply.
- **Map each to the minimum object:** `id` (`<city>-<country>` from name+country),
  `name`, `country`, `line` (first strong prose sentence), `region_code`, `status`
  (`future`/preview unless it's a live row), `depth: "stub"`, `img` (Unsplash query),
  and `si`/`feel` **only if cleanly inferable** from the prose. **Omit every `data.*`
  block — never fabricate one to look verified** (the omit-don't-invent rule). The
  validator treats stubs as warnings, not errors, so they pass clean.
- **Upgrade path (phase 2, optional):** run the prose through an extraction pass to
  *draft* structured blocks → ingest those as **`depth: "cached"`** (Atlas-written,
  unverified, clearly flagged), promoted to `verified` only when a human confirms.
  Not required for the first ingest — the stub form is shippable as-is.

Net: the 98 add real breadth (more places an agent/traveler can find) at zero safety
cost, and the depth axis (`stub` → `cached` → `verified`) carries their honesty.

## Worked example
```ts
"06A": [
  {
    id: "cape-town-south-africa",
    name: "Cape Town",
    country: "South Africa",
    line: "Where the mountain meets two oceans",
    status: "live",
    depth: "verified",
    img: "capeTown",
    sub_region: "Cape Town & the Winelands",
    si: ["safari", "wine", "ocean", "romance"],
    feel: ["dramatic", "cosmopolitan", "coastal"],
    tier_range: ["comfort", "premier", "luxury", "ultra"],
    price_band: "premier",
    draw_rank: "anchor",
    data: {
      seo: { title: "Cape Town Travel Guide | TravelWell", meta: "…", canonical: "/destination/cape-town-south-africa" },
      safety: { advisory_level: "L2", posture: "book-freely", booking_hold: false },
      jewels: [ { name: "Table Mountain cableway", tier: "comfort", when: "clear mornings", blurb: "…" } ],
      timing: { season: "Nov–Mar", best_months: [11,12,1,2,3] },
      source: { last_verified: "2026-07-13", confidence: "high" }
    }
  }
]
```

## Ingest flow (the clean path — no doing it twice)
1. Normalize each dossier into the object above, grouped under its region code, in `src/data/places.ts`.
2. Regenerate the seed: `./node_modules/.bin/esbuild scripts/gen-catalog-seed.ts --bundle --platform=node --format=esm --outfile=scratchpad/gen.mjs && node scratchpad/gen.mjs`
3. Sana re-runs `0005_seed_destinations_guides.sql` in Supabase (idempotent; self-heals the `data` / `sub_region` / `depth` columns and swaps the status constraint to `live|future`).

Result: `id` = `<city>-<country>`, rich body in `data` jsonb, `sub_region` + `depth` as first-class columns — the whole library on one target, in one pass.
