# Alpine / Winter-Ski ingest brief — for CC (the research library)

**Goal:** conform the alpine library (~30+ dossiers — France · Switzerland ·
Austria · Italy) to the MVP ingest shape so it drops in clean and Winter/Ski
reads *deep* for the VC demo. The MVP-side machinery is built and the format is
already proven against our 7 live anchors (a dry-run passed 0 errors) — so this
is a conform-and-hand-over job, not an open build.

Full shape spec: `docs/dossier-ingest-shape.md`. This brief is the alpine-specific
short list — the three things that actually decide whether it lands clean.

---

## 1. Region — all alpine → the 13-code scheme, and it's already live
Every alpine resort maps to a **13-code MVP region** (Western Europe **`01F`** for
FR/CH/AT; **`02F`** if the dossier files Italy/Dolomites there). **Map 15→13 via
the reconciliation table — never ship a 15-scheme code** (the validator hard-errors
on one). These regions are already live, so **no region flip is needed** — the
dossiers just need the right code.

## 2. Ids + the 7 reconcile anchors (avoid duplicate rows)
- **Id = `<city>-<country>`**, lowercase, hyphenated, **full country spelled out**
  (`chamonix-france`, not `chamonix-fr`). It's derived from `name` + `country`.
- **Seven alpine places are ALREADY live in the MVP.** Their dossiers **must set
  `data.reconciles_live_mvp` to the exact slug below**, or the derived id drifts and
  you create a duplicate row. The other ~25 resorts are **net-new** — no linkage,
  just their derived id.

  | Place | `reconciles_live_mvp` (use verbatim) | note |
  |---|---|---|
  | Zermatt, Switzerland | `zermatt-switzerland` | |
  | St. Anton am Arlberg, Austria | `st-anton-austria` | ⚠ derived id would drift to `st-anton-am-arlberg-austria` — use the short slug |
  | Chamonix, France | `chamonix-france` | |
  | St. Moritz, Switzerland | `st-moritz-switzerland` | |
  | Courchevel, France | `courchevel-france` | |
  | Cortina d'Ampezzo, Italy | `cortina-dampezzo-italy` | ⚠ apostrophe drifts the derived id — use this slug |
  | Kitzbühel, Austria | `kitzbuhel-austria` | ü→u |

  (Master list of all 45 live anchors: `docs/live-row-reconcile-map.md`.)

## 3. The `data` body — v1 tier, and don't skip the money
Carry the **v1 ingest tier** into `data` (jsonb): **`safety` + `timing` +
`jewels` + `faq`.** Defer `seo` / supply / `ultra` to a later pass — omit, don't
half-fill.
- **`jewels[]`** — each needs `name`, and where bookable a **`commission`** (the
  earning lane — the money) **and `si: "ski"`** (the Signature Interest it serves).
  The dry-run flagged every jewel with no commission lane; fill it wherever the
  jewel is bookable.
- **`faq[]`** — `{ q, a, source }`, answer-first. It auto-emits FAQPage schema
  (the AI-citation), so it's high value — include the top traveler + safety Qs.
- **`safety`** — `advisory_level` must be `L1|L2|L3|L4`. Alpine risk is
  weather/avalanche; note "ski in-bounds / hire a guide off-piste," not fear.
- **`feel[]` / vibe:** leave empty — it's populated later from the Identity Card,
  not dossier prose.

---

## The gate — how we both know it's clean
Before hand-over (and again on our side), run the MVP border validator:

```
npm run validate:ingest -- path/to/alpine.json      # a .json array, region-keyed object, or a dir
```

It checks region codes, id format, the reconcile links, canonical SI/tier/feel
spellings, the jewel/FAQ shape, **and resolves every "see also" cross-reference**
(a link to a place that doesn't exist is a hard error — the exact bug we're
guarding against). **Green = "✓ Clean against live canon — safe to ingest."**
It exits non-zero on any error and prints exactly what to fix, so iterate until
it's green, then hand it over.

**Definition of done:** ~30+ alpine dossiers, all `01F`/`02F`, the 7 anchors
reconciled, jewels carrying commission + `si`, FAQ present, `npm run
validate:ingest` green.
