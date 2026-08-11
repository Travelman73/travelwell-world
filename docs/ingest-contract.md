# The ingest contract — LOCKED

*David's three questions, answered so nothing gets reshaped again. Sana, 2026-08.*

The short version: **drop a JSON file in `src/data/destinations/`, run the
validator, open a PR.** No hand-merging, no reshaping, no touching `places.ts`.

---

## 1. The gold reference destination

**`src/data/destinations/_REFERENCE.example.json`** — one destination with every
field populated: the full row *plus* a complete `data` object (safety, timing,
jewels with commission + si, faq, seo, booking, geo). Match it byte-for-byte.

Files beginning with `_` are ignored by the generator, so the reference can live
in the real folder without ever shipping as a row. **Strip every `_comment` key
from real batches.**

Notes on the fields that matter most:
- **`faq`** is `{ q, a, source }` and feeds FAQPage structured data — it's the
  block AI answer engines quote. Highest-value field in the file.
- **`jewels[]`** each want **`si`** (which interest it serves) and **`commission`**
  (the earning lane) wherever the jewel is bookable. That's the money.
- **`seo`** — include it. Note it can't take effect until server-rendering ships
  (a client-rendered page can't vary its meta per route), but it costs nothing to
  carry and will be live the day that lands.
- **`reconciles_live_mvp`** — only for the 45 places already live in the MVP; see
  `docs/live-row-reconcile-map.md`. Everything else is net-new and needs no linkage.

## 2. The handoff — drop-in JSON, one file per batch

**Deliver:** `src/data/destinations/<batch-name>.json` — e.g.
`dive-liveaboard.json`, `alpine.json`. **`data` is inline**, one object per
destination. No separate files, no rows authored into `places.ts`.

**Format:** either a flat array (each row carrying `region_code`), or an object
keyed by region code. Both work — pick whichever your generator emits naturally.

**Deliver as a PR.** The generator picks the file up automatically — the same
"add a file and it works" path providers already have — so there is nothing on
my side to reshape or hand-merge.

**Collision rule:** a batch row with the same `id` as an existing row **wins and
replaces it.** That's deliberate: it's how a shallow hand-authored anchor
(Zermatt, Cape Town) gets upgraded by its full dossier without creating a
duplicate.

**Before you send, run:**
```bash
npm run validate:ingest -- src/data/destinations/<batch-name>.json
```
Green (`✓ Clean against live canon — safe to ingest`) means it drops straight in.
Red prints exactly what to fix — region codes, id format, non-canonical spellings,
jewel/FAQ shape, and every cross-reference resolved. Iterate until green.

Then on my side it's one command and a re-run of the migration:
```bash
./node_modules/.bin/esbuild scripts/gen-catalog-seed.ts --bundle --platform=node \
  --format=esm --outfile=scratchpad/gen.mjs && node scratchpad/gen.mjs
```

## 2b. The `img` token — answered (it barely matters)

**`img` is only the instant placeholder.** Destination heroes and cards fetch the
real, matched photo from Unsplash using `"{name}, {country}"` and swap it in; the
token is what shows for the moment before that resolves (and if Unsplash is
unavailable). So it does **not** need to be a real picture of the place.

**You can use any of these 20 tokens, or omit `img` entirely:**
`safariGiraffe · lion · safariJeep · elephant · tropicalBeach · oceanAerial ·
maldivesResort · mountainValley · desertDunes · northernLights · baliRice · paris ·
venice · marrakech · dubai · kyoto · santorini · restaurant · spaWellness · luxuryPool`

Pick the nearest vibe (a dive site → `oceanAerial`, an alpine resort →
`mountainValley`). **Omitting it is fine** — the generator supplies a default.

*Previously an unrecognised token rendered an empty `<img>` src. It now falls back
to a neutral image, so a token we've never seen can't break a page. That was worth
catching before 36 dive destinations arrived with tokens none of which existed.*

### The editorial hero override — your pick wins (no API key needed)

You asked to take hero images off Sana's plate. You can, **without anyone
handing out the Unsplash key** (which we don't send by email — the repo is
public and an emailed key is a key we no longer control). Put it in the dossier:

```jsonc
"hero": { "query": "Cape Town Table Mountain aerial" }        // steer the auto-search
"hero": { "url": "https://…/photo.jpg",                        // OR pin an exact image
          "credit": { "name": "Photographer", "link": "https://…" } }
```

**Precedence: `hero.url` > `hero.query` > automatic `"{name}, {country}"`.**
Omit `hero` entirely and nothing changes — the page fetches its own matched photo
as it does today.

Two rules the validator enforces: **`url` must be https** (an http image breaks on
a secure page), and if it's an Unsplash photo **include `credit`** — their licence
requires photographer attribution, which the automatic path gets for free but a
pinned one can't. We display the credit, and we only say "/ Unsplash" when it
actually is one.

## 3. The 30-second confirm

**Is `main` stable?** Yes. The destination schema hasn't changed since 2026-07-10
and nothing is mid-change on it. The `data` jsonb, `si[]`, `feel[]`,
`tier_range[]`, `price_band`, `draw_rank`, `depth`, `sub_region` are all live in
production. Build against `main` with confidence.

**Level-4 content-holds — use `status: "live"`, `depth: "verified"`.**

That surprises people, so the reasoning: `status` and `depth` describe the
*content*, not its bookability. An L4 dossier is a real, finished, live page — we
want it served, indexed and read; we just don't want a Book button on it. So:

| field | value | why |
|---|---|---|
| `status` | `"live"` | the page exists and should be served (`future` = not shown at all) |
| `depth` | `"verified"` | it's a full dossier, not a stub |
| `data.safety.advisory_level` | `"L4"` | **this** is what drives suppression |
| `data.safety.booking_hold` | `true` | explicit — the validator warns if L4 lacks it |

Keeping suppression in the safety layer rather than in `status` is deliberate: it
means an advisory can change daily without anyone re-editing the dossier, which is
exactly what the live-advisory system needs.

### The cascade — and your carve-out now actually renders

Country advisory is the baseline; a dossier's own `data.safety.advisory_level`
**overrides it for that destination**. This is what a named-zone carve-out is: the
FCDO's 7 km volcanic exclusion on Flores, which State doesn't carry, belongs on
the Komodo dossier, not in the country record.

*Until 2026-08-10 the page read only the country level, so a carve-out validated,
stored, and then displayed the country's number anyway. It's wired now.*

Two behaviours worth knowing when you author one:
- **A carve-out that differs from its country is labelled as such on the card** —
  it names the country-wide level too. A traveler who just read the government
  page and sees a different number here needs to know which is which.
- **`booking_hold: true` (or `L4`, which implies it) prints a plain line saying we
  won't sell a trip there.** The page stays; the sale doesn't.

A dossier that carries `data.safety` with **notes but no `advisory_level`** is
treated as enrichment, not a carve-out — the note is added to the country card
rather than replacing its level.

### The traveler's own check — deep links, not a gesture

Every destination page now names the sources, publishes our verification date,
and links **to that country's page** on State, the FCDO and the CDC. Slugs live in
`src/data/advisory-sources.ts`; where we have no confirmed slug the link falls
back to that source's index and says so on the page, because a deep link that
404s reads as "we checked" when we didn't.

**`npm run check:advisory-links` fetches every generated URL and reports what
resolves.** It needs outbound network — run it from an environment that has some,
and fix any slug it flags in that one file.

---

## 4. Special-Interest dossiers — the nine layers, locked

*Added 2026-08-09, from David & Claude's "How we build & showcase every Special
Interest" note. Same discipline as destinations: a shape, a folder, a gate.*

The nine layers **are** the schema. One key per layer, in David's order, in the
`special_interests.data` jsonb (migration 0012, live in production):

| # | Layer | Key |
|---|---|---|
| 1 | The market — sized and range-cited | `market` |
| 2 | Demand streams (play vs watch) | `streams` |
| 3 | Source countries — the targeting map | `sources` |
| 4 | Seasons + booking windows / the event look-ahead | `timing` / `events` |
| 5 | The global map | `map` |
| 6 | The money and the booking rails | `providers` |
| 7 | Traveler Q&A | `faq` |
| 8 | Connective tissue — Wells, whispers, safety | `wells` / `whispers` / `safety` |
| 9 | Ship-ready — SEO/GEO + schema | `seo` / `schema` |

**Every layer is optional.** A dossier can land in stages and the page renders
whatever is present — it never shows an empty shelf. Extra keys pass straight
through the jsonb, so a later pass needs no migration.

### The one hard rule: no unlabeled numbers

Every figure is `{ label, value, confidence, source? }`, and **`confidence` is
required** — `verified` or `estimate`. The gate rejects an unlabeled number,
because an unlabeled number is a guessed number, and a guessed number is the one
mistake this whole system exists to make impossible.

`verified` **also requires a `source`.** Verified means someone can check it. If
the citing firm isn't pinned down yet, the figure is an `estimate` until it is —
that's the rule working, not a gap. (The gold reference deliberately shows both:
the US figures name NGF and are verified; the Korea/Japan/Germany figures came
without a named firm and are carried as estimates.)

`value` is a **string** on purpose — the real research carries ranges, arrows and
currencies (`"$26B → $60B"`, `"€2,041/trip"`) that a numeric column would flatten.

### The handoff

**Gold reference:** `src/data/interests/_REFERENCE.golf.json` — Golf Globally,
every layer populated, from the anatomy showcase. `_`-prefixed files are ignored
by the generator, so it lives in the real folder without ever shipping.

**Deliver:** `src/data/interests/<batch>.json` — an array, or
`{ "special_interests": [ … ] }`. Drop the file in, open a PR; the generator
picks it up automatically.

**Merge rule — differs from destinations, on purpose.** An SI batch row is
**shallow-merged** onto the bundled row, not a straight replace. The common case
is a dossier that only adds `data` to an interest that already exists, and a
replace would blank its name, accent and status. So a **data-only patch is
valid**: `{ "id": "safari", "data": { … } }` and nothing else. A **net-new**
interest must bring the full row (`name`, `sig`, `status`, `accent`, `group`).

**Before you send:**
```bash
npm run validate:si -- src/data/interests/<batch>.json
```

What it checks beyond the figures rule: status/accent/group shape · events are
absolute dated series (`year` or ISO `starts_on` — never "season", and a `year`
that disagrees with its `starts_on` is an error) · `booking_path` is one of
`api | request-to-book | aggregator | lead` (the API-first check) · `well` and
`map.regions` resolve to live canon · **`map.destinations` resolve to real MVP
destination ids** (a name pointing at nothing is a broken shelf) · FAQ has both
q and a.

### What renders today

`timing`, `events` and `faq` render on the SI page now, and `faq` + dated
`events` emit `FAQPage` / `Event` JSON-LD alongside `TouristTrip` — the layer-9
manifest, made real. A **preview** interest with a dossier shows its depth too
(content-only, no Book button — the same rule as an L4 destination).

`market`, `streams` and `sources` land in the jsonb now and are read by the
investor surface, not the traveler's page — a $26B market figure isn't something
a honeymooner needs on a hero.

**One field worth not forgetting:** `tagline_subject`. Without it the brand line
falls back to the full name — *"If It's Golf Globally… TravelWell™"* instead of
*"If It's Golf… TravelWell™"*. A tight noun. English-only; the slogan never
localizes. David's hand-locked map in `taxonomy.ts` still overrides it.

---

## What's on each side

- **Yours:** conformed JSON batches matching the reference, validator green.
- **Mine:** regenerate, apply the migration, wire anything new the fields unlock.

Deeper shape spec: `docs/dossier-ingest-shape.md`. Reconcile anchors:
`docs/live-row-reconcile-map.md`.
