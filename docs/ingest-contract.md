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

---

## What's on each side

- **Yours:** conformed JSON batches matching the reference, validator green.
- **Mine:** regenerate, apply the migration, wire anything new the fields unlock.

Deeper shape spec: `docs/dossier-ingest-shape.md`. Reconcile anchors:
`docs/live-row-reconcile-map.md`.
