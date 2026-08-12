# The 45 live-row reconcile map (for the library normalize)

> **APPLIED 2026-08-12 — the MVP rows now carry the target ids in column 3.**
> 34 of the 44 live rows were renamed to `<city>-<country>` (`paris` →
> `paris-france`, `kruger` → `greater-kruger-south-africa`), against this table.
> Three ⚠ rows needed the call this table left to the dossier, and no dossier
> exists yet, so the recommendation was taken and **stays reversible**:
> `alps` → `swiss-alps-switzerland`, `patagonia` → `patagonia-chile-argentina`,
> and `st-lucia` kept as-is rather than `saint-lucia`. If a dossier's canonical
> key disagrees, the dossier still wins — change the id and add the old one to
> `LEGACY_DEST_ID`.
>
> **Column 2 still works and still means what it meant.** `reconciles_live_mvp`
> resolves through `LEGACY_DEST_ID` (`src/data/places.ts`) and the ingest
> validator accepts legacy slugs, so every dossier already authored against
> `kruger` lands on the right row. Nothing needs re-authoring. Two dossiers
> claiming the same row under different spellings now collide at the gate rather
> than creating a duplicate, which is what this map was for.

These are the **only** dossiers that need `reconciles_live_mvp` — the 45 places
already live in the MVP (38 original + 7 alpine anchors, rows 39–45). Every other dossier is net-new (no linkage; it just
gets its derived `<city>-<country>` id).

**Instruction for CC:** for the dossier that matches each **Place** below, set
`data.reconciles_live_mvp` to the **Current slug** (column 2) — that's what maps
it onto the existing row despite spelling drift. Its derived `id` should be the
**Target `<city>-<country>`** (column 3). Rows marked ⚠ need a judgment call on
the target id — use the dossier's canonical key, don't guess from the messy
legacy slug.

| # | Current slug | Place | Target `<city>-<country>` | Flag |
|---|---|---|---|---|
| 1 | `paris` | Paris, France | `paris-france` | |
| 2 | `amsterdam` | Amsterdam, Netherlands | `amsterdam-netherlands` | |
| 3 | `santorini` | Santorini, Greece | `santorini-greece` | |
| 4 | `amalfi` | Amalfi Coast, Italy | `amalfi-coast-italy` | |
| 5 | `barcelona` | Barcelona, Spain | `barcelona-spain` | |
| 6 | `algarve` | The Algarve, Portugal | `algarve-portugal` | drop the article "The" |
| 7 | `reykjavik` | Reykjavík & Ring Road, Iceland | `reykjavik-iceland` | drop "& Ring Road", de-accent |
| 8 | `lofoten` | Lofoten Islands, Norway | `lofoten-islands-norway` | |
| 9 | `dubai` | Dubai, UAE | `dubai-united-arab-emirates` | spell the country out |
| 10 | `petra` | Petra & Wadi Rum, Jordan | `petra-jordan` | drop "& Wadi Rum" (or keep both — dossier decides) |
| 11 | `alula` | AlUla, Saudi Arabia | `alula-saudi-arabia` | |
| 12 | `serengeti` | Serengeti, Tanzania | `serengeti-tanzania` | |
| 13 | `ngorongoro` | Ngorongoro Crater, Tanzania | `ngorongoro-tanzania` | drop "Crater" (or keep — dossier decides) |
| 14 | `volcanoes` | Volcanoes NP, Rwanda | `volcanoes-national-park-rwanda` | expand "NP" |
| 15 | `cape-town-south-africa` | Cape Town, South Africa | `cape-town-south-africa` | ✓ already canonical (template anchor) |
| ⚠ 16 | `kruger` | Greater Kruger, South Africa | `greater-kruger-south-africa` | **4 spellings in circulation** — link by PLACE, set `reconciles_live_mvp: "kruger"` |
| 17 | `sossusvlei` | Sossusvlei, Namibia | `sossusvlei-namibia` | |
| 18 | `bali` | Bali, Indonesia | `bali-indonesia` | |
| 19 | `bangkok` | Bangkok, Thailand | `bangkok-thailand` | |
| 20 | `siem-reap` | Siem Reap, Cambodia | `siem-reap-cambodia` | |
| 21 | `kyoto` | Kyoto, Japan | `kyoto-japan` | |
| 22 | `tokyo` | Tokyo, Japan | `tokyo-japan` | |
| 23 | `seoul` | Seoul, South Korea | `seoul-south-korea` | |
| 24 | `queenstown` | Queenstown, New Zealand | `queenstown-new-zealand` | |
| 25 | `bora-bora` | Bora Bora, French Polynesia | `bora-bora-french-polynesia` | |
| 26 | `cartagena` | Cartagena, Colombia | `cartagena-colombia` | |
| 27 | `vancouver` | Vancouver, Canada | `vancouver-canada` | |
| 28 | `banff` | Banff & Lake Louise, Canada | `banff-canada` | drop "& Lake Louise" (or split into two — dossier decides) |
| ⚠ 29 | `masai-mara` | **Maasai Mara**, Kenya | `maasai-mara-kenya` | **spelling drift** (masai→maasai) — the exact reason the linkage matters |
| ⚠ 30 | `machu` | Machu Picchu, Peru | `machu-picchu-peru` | short legacy slug |
| ⚠ 31 | `gbr` | Great Barrier Reef, Australia | `great-barrier-reef-australia` | abbrev slug |
| ⚠ 32 | `turks` | Turks & Caicos, **Turks & Caicos** | `turks-and-caicos` | name == country; collapse to one |
| ⚠ 33 | `st-lucia` | St. Lucia, **St. Lucia** | `saint-lucia` (or `st-lucia`) | name == country; "St."→"Saint"? dossier decides |
| ⚠ 34 | `exuma` | The Exumas, Bahamas | `exuma-bahamas` | article + singular/plural — dossier decides |
| ⚠ 35 | `patagonia` | Patagonia, **Chile / Argentina** | `patagonia-chile-argentina` (?) | **spans two countries** — needs the dossier's canonical key |
| ⚠ 36 | `alps` | The Alps, Switzerland | `swiss-alps-switzerland` (?) | region, multi-country — dossier's canonical key decides |
| ⚠ 37 | `amalfi-x` | **"Lake District, Germany"** | — | **broken placeholder row** — country/name mismatch; confirm the real place (or drop) before linking |
| ⚠ 38 | `kyoto-x` | **"Phuket & Phi Phi, Thailand"** | `phuket-thailand` | **mislabeled slug** (`kyoto-x` but it's Phuket) — link by *place*, not slug |

| 39 | `zermatt-switzerland` | Zermatt, Switzerland | `zermatt-switzerland` | already `<city>-<country>` |
| 40 | ⚠ `st-anton-austria` | St. Anton am Arlberg, Austria | `st-anton-austria` (**not** `st-anton-am-arlberg-austria`) | derived id drifts — keep the short slug, link by place |
| 41 | `chamonix-france` | Chamonix, France | `chamonix-france` | clean |
| 42 | `st-moritz-switzerland` | St. Moritz, Switzerland | `st-moritz-switzerland` | clean |
| 43 | `courchevel-france` | Courchevel, France | `courchevel-france` | clean |
| 44 | ⚠ `cortina-dampezzo-italy` | Cortina d'Ampezzo, Italy | `cortina-dampezzo-italy` (**not** `cortina-d-ampezzo-italy`) | apostrophe drifts the derived id — keep our slug |
| 45 | `kitzbuhel-austria` | Kitzbühel, Austria | `kitzbuhel-austria` | ü→u; clean |

*(Rows 1–28 are clean matches; 29–38 (⚠) need a judgment call. The two `-x` rows (`amalfi-x`, `kyoto-x`) are placeholder/mislabeled and are the two to double-check.)*

## Alpine anchors (39–45) — the Winter/Ski depth-ingest gate
The 7 alpine resorts are **already live** and were the first hand-authored ski shelf, so they were never in the original 38. When CC's alpine library lands, its dossiers for **these seven places must set `reconciles_live_mvp` to the slug above** — otherwise their derived ids create duplicates (a dry-run confirmed **St. Anton** → `st-anton-am-arlberg-austria` and **Cortina** → `cortina-d-ampezzo-italy` both drift off our anchor slug). Every *other* alpine dossier (the ~25 net-new resorts) is net-new — no linkage, just its derived `<city>-<country>` id. All alpine rows are region **01F** (Western Europe), which is already live, so no region flip is needed.

## ⚠ Kruger — the worked example of why this map exists (2026-08)
Four spellings for **one place** have been in circulation across the two repos:

| Where | String |
|---|---|
| MVP live slug (the anchor) | `kruger` |
| This map's target id | `greater-kruger-south-africa` |
| Library destination file | `kruger-south-africa` |
| Library SI cross-ref (was a dangling ref, since fixed) | `kruger-national-park-south-africa` |

**The rule: link by PLACE, never by guessing the slug.** The Kruger dossier must set
`data.reconciles_live_mvp: "kruger"` — that's the only string that lands it on the
existing row. Anything else creates a duplicate. (Our validator hard-errors on a
`reconciles_live_mvp` that isn't a live MVP id, so this gets caught at the border —
but it's cheaper to author it right.)

## The flags, grouped
- **Broken/placeholder rows (fix first):** `amalfi-x` (name/country mismatch), `kyoto-x` (slug says Kyoto, place is Phuket). Confirm the real destination before linking — or replace.
- **Spelling drift (why the linkage exists):** `masai-mara` → Maasai Mara, and **`kruger` (4 spellings — see above)**. Link by the current slug so the conformed dossier lands on the right row, not a duplicate.
- **Multi-country / region edge cases (dossier canonical key decides the id):** `patagonia` (Chile/Argentina), `alps` (Switzerland/region).
- **name == country (collapse):** `turks`, `st-lucia`.
- **Descriptors / articles / abbreviations to normalize:** algarve, reykjavik, petra, ngorongoro, volcanoes, banff, exuma, dubai (spell out UAE), gbr.

For any ⚠ id, the **dossier's own canonical key wins** — the target column is a recommendation, not a mandate.
