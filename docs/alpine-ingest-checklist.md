# MVP-side receiving checklist — the alpine ingest (runbook)

What I run when CC hands over a green `alpine.json`. Path A scope: **destination
depth** (30+ resorts with jewels/safety/timing/FAQ). Live provider-supply is a
deferred pass — don't author 30× provider sets here.

Companion docs: `docs/alpine-ingest-brief.md` (what CC delivers),
`docs/dossier-ingest-shape.md` (the shape), `docs/live-row-reconcile-map.md`
(the 7 anchors, rows 39–45).

---

### 1. Gate the incoming file (before anything touches the repo)
- [ ] `npm run validate:ingest -- path/to/alpine.json` → **must print
      "✓ Clean against live canon — safe to ingest."** (0 errors). If red, it
      prints exactly what to fix — bounce it back to CC, don't hand-patch.
- [ ] Skim the warnings: every bookable jewel should have a `commission` lane;
      the 7 anchors should each carry `reconciles_live_mvp`.

### 2. Merge into `src/data/places.ts` → `DESTINATIONS`
- [ ] **The 7 anchors overwrite their existing rows by id** (`zermatt-switzerland`,
      `st-anton-austria`, …) — keep our slug as the `id`, take the richer dossier
      `data`/jewels/faq. Do **not** add a second row.
- [ ] **The ~25 net-new resorts append** under their region array, derived
      `<city>-<country>` id.
- [ ] **Region = `01F` (Western Europe)** for all of them — ski surfaces in 01F
      (`REGION_SI["01F"]` includes `ski`; 02F does **not**). Keep Italian alpine
      in 01F too, *not* 02F, or it won't show on the ski shelf.
- [ ] **Sub_region — the one judgment call.** 01F's four are *France · Germany &
      Austria · Benelux · Switzerland & the Alps*. Map: FR→France, AT→Germany &
      Austria, CH→Switzerland & the Alps. **Italy/Dolomites has no 01F bucket** —
      fold into *Switzerland & the Alps* (the Alps are trans-national) unless the
      volume earns a new "The Dolomites" sub_region (a Pacific-Northwest-style
      call — if I add one, update `SUBREGIONS["01F"]`, the master, and the count).
- [ ] `feel[]` is either empty or drawn ONLY from the closed 20-word vocabulary — never invented (see `dossier-ingest-shape.md`).

### 3. Regenerate the seed (never hand-edit 0005)
- [ ] `./node_modules/.bin/esbuild scripts/gen-catalog-seed.ts --bundle --platform=node --format=esm --outfile=scratchpad/gen.mjs && node scratchpad/gen.mjs`
- [ ] Confirm the run log shows the new destination count (was 44 → ~70+) and,
      if I touched sub_regions, the new sub-region count.

### 4. Apply to the DB (Supabase SQL editor, idempotent)
- [ ] Re-run **`0005_seed_destinations_guides.sql`** (destinations). It
      `on conflict do update`s and self-cleans `where id not in (source)` — so
      **every alpine row must be in places.ts** or it gets wiped.
- [ ] Re-run **`0004`** *only if* I added/changed a sub_region.

### 5. Verify (the QC gate — same bar as the rest of the app)
- [ ] `npx tsc --noEmit` and `npm run build` green.
- [ ] `npm run validate:ingest` (no arg → self-check the whole bundle) green.
- [ ] `npm run a11y` green (it already covers `/destination/zermatt-switzerland`
      and `/si/…`).
- [ ] Spot-check 3–4 new `/destination/<id>` pages: hero, **Don't-miss jewels**
      (with commission line), **Good to know** FAQ, and the safety card all
      render; 0 horizontal overflow at 390.
- [ ] `/si/ski` shows the deep shelf (the "whoa, look how much is here" moment).
- [ ] A destination whose safety is L2/L3 shows the right card colour + posture.

### 6. Ship
- [ ] Commit on the feature branch → `git checkout main && git merge --ff-only`
      → push both. Vercel deploys from `main`.

### 7. Deck ammunition (the "receipts")
- [ ] Capture the live numbers for David's slide: **N ski destinations across N
      regions, N safety-vetted providers** — the depth-proof, not a 3-example demo.
      (Providers stay at current depth this pass; note the count, build live
      supply post-raise.)

---

**Two things I will NOT do here (Path A guardrails):** author live provider/Well
supply for 30 resorts (deferred — deck shows counts), and touch Safari or the
voice work (those stay first; alpine is a parallel data track sequenced after
their polish).
