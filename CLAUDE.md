# CLAUDE.md — TravelWell.World (MVP platform repo)

Standing conventions for anyone (human or assistant) working in this repo:
`sanaafzal-create/travelwell-world`. This is the **live MVP platform** — a
React + Vite + TypeScript + Tailwind SPA, backed by Supabase (Postgres + RLS +
Edge Functions), deployed on Vercel from `main`. It is **not** the research
library (`Travelman73/tww-research-library`) — that repo has its own rules.

> **One source of truth per artifact (learned the hard way, 2026-08).** Application
> code (`src/lib/*`, components, migrations) lives **here and only here**; the
> library repos hold *data/dossiers*, never copies of MVP code. A stale pre-commit
> copy of `auth/travelId/catalog/safety-data` was found sitting in another repo
> seven weeks after the same work shipped here — harmless because it was never
> merged, but restoring it would have regressed ~6 weeks of decisions. If MVP code
> turns up in another repo, it is **stale by definition** — archive it, never
> merge it back.

## Voice & naming
- **"TravelWell" is one word.** Never "Travel Well" as the brand.
- Prefer **accurate / plainly / straight** over "honest / honestly / upfront." Keep **"honest/honestly" out of Atlas's vocabulary** (David 2026-07-29).
- **The brand slogan system (David-locked, 2026-08 — "built across the board"):** the formula is **"If It's [X]… TravelWell."**, ending in the **one-word brand mark** ("Well" accented: pine on light grounds, gold on dark). `[X]` = **Travel** (master), **any Signature Interest** (its short subject — see `SI_TAGLINE_SUBJECT` in `taxonomy.ts`; `romance → "Love"`, `safari → "Safari"`, …), or **Safer Informed Travel**. Render it via the `Tagline` primitive (`src/components/ui/primitives.tsx`); it's on every SI page + the Special-Interests master. **The two-word pun sign-off "…Travel Well." is RETIRED (2026-08-09, on the trademark attorney's advice — a two-word variant weakens the claim).** It appears nowhere in user-facing copy, metadata, structured data, or Atlas's prompts; sign-offs close on the one-word mark via the `BrandMark` primitive. The documented family in active use is generated to `docs/tagline-family.md` (`npm run gen:taglines`) — regenerate before any filing. The slogan is a coined brand line → **English-only, never localized** (like the Well names).
- **Well names always render in full and hyphenated — `Stay-Well`, `Eat-Well`, … everywhere (David 2026-08).** Never strip the `-Well` suffix or show the bare root ("Stay") in UI copy.

## Canonical vocabularies (match these character-for-character)
- **Budget tiers (`price`):** `essential` · `comfort` · `premier` · `luxury` · `ultra`.
- **Provider curation (`tier`):** `prime` · `vetted` · `prospective` (distinct from price).
- **Provider handoff (`mode`):** `api` · `widget` · `affiliate` · `first-party`.
- **7 launch Signature Interests (live):** `tropical`, `romance` (display "Romance, Marriages & Honeymoons"), `liveaboard`, `river`, `safari`, `expedition`, `ski` (display "Winter/Ski"). Everything else is `preview` (future). `ultra` is the Luxury tier/overlay, **not** a trip SI. **`ski` was promoted to live for the demo (David, Jul 2026) — its *status* is live, but the shelf is empty until alpine destinations are ingested (ingest-then-flip, not a pure flip; see status-and-launch-plan).** `wellness`/`culinary`/`culture` were previously live and are back to `preview` to match the confirmed seven.
- **Wells (`well`):** the source of truth is `WELLS` + `LUX_WELLS` in `src/data/taxonomy.ts` — **12 total, 10 live + 2 soon.** Live (10): `fly` Fly-Well · `stay` Stay-Well · `eat` Eat-Well · `move` Move-Well · `gear` Gear-Well · `beauty` Beauty-Well · `activities` **Activities**-Well (plural) · `shop` Shop-Well · `nanny` Nanny-Well (lux) · `security` Security-Well (lux). Soon / **not live** (2): `insure` Insure-Well · `ship` Ship-Well. Don't publish a different count or omit live wells (Eat/Gear/Shop are easy to drop by accident) — reconcile any UI or external copy against this list before it ships. **Well *names* stay English across all markets (David-locked): the "-Well" family is a coined brand and the wordplay doesn't translate — one brand name in all nine languages. Only a Well's *tag/tagline* localizes (see `well.*.tag` in `src/lib/i18n-catalog.ts`); the name never does.**
- **Regions:** the 13-code MVP scheme (e.g. `05A` East Africa, `11C` Caribbean & Atlantic, `10S` Latin America). **It is THE official scheme (David-confirmed 2026-08) — the research library's 15-code scheme conforms to it, mapping 15→13 via the reconciliation table at ingest, never the reverse.** It is the source of truth; confirm any external region code against it.
- **`sub_region`:** country-internal style; strings are authoritative and come verbatim from the canonical master (`docs/sub-region-master.md`) / David's dossiers, wired per region — never sketched from memory.
- **Destination key (`id`):** `<city>-<country>`, full country name spelled out, lowercase, hyphenated (e.g. `cape-town-south-africa`). Collision-proof at global scale.
- **Destination axes:** `status` = `live` | `future` (shown or not); `depth` = `verified` | `stub` | `cached` (how deep). Separate axes.

## Locked principles
- **Payments: never touch the card; the provider is always merchant of record.** Atlas may **close the booking on our own surface** (orchestrate discover → decide → book — no leaky handoff), *but* the **provider/aggregator stays merchant of record and holds the card** (Duffel Payments, aggregator billing, or Stripe's hosted checkout where the card goes to Stripe, never our servers). So TravelWell **never touches card data** (stays PCI SAQ A) and **never becomes the seller of record** — which keeps chargebacks, refunds, fraud, and US seller-of-travel bonding off us. There is no tier where Atlas holds the card.
  - **Two things stay separate, on purpose (David-locked) — so merchant-of-record never sneaks in the back door:** **customer ownership** is *always ours* — Atlas closes on our surface and owns the relationship + the data; the traveler never gets handed off. **Merchant of record** is *always the provider's* — who legally sells, holds the card, and eats refunds/chargebacks/fraud/bonding. **We get full customer ownership from the first without ever taking the second.** "Own the customer" does **not** imply "be the merchant" — never conflate them.
  - **Becoming merchant of record (taking the payment ourselves) is a separate, deliberate, funded decision** (PCI-DSS scope + bonding + liability) — never a drift. It's **staged (David-locked): Stage 1 = provider-as-MoR now; Stage 2 = a deliberate post-funding flip** to unlock the big-player lanes (Ultra Virtuoso + IATA — the TravelWell-Ultra dominance play), gated ~$2M gross travel sales (Virtuoso threshold), walked in bonded and on purpose. Stage the treasury rail (Airwallex/Stripe, our-money-only) now; build swappable toward the flip. Plain-language today: *"you're paying [the provider] directly, right here,"* never *"I'll hold it for you."*
- **Safer-Informed:** we keep travelers **informed** so they can be as safe as possible — we **never promise "safe"** (an outcome we don't control). L1/L2 book freely; L3 books only if it passes all three safety gates; L4 and L3-blocked are content-only (no Book button).
- **Never commit secrets.** The repo is public. `ANTHROPIC_API_KEY` and `UNSPLASH_ACCESS_KEY` live as **Supabase secrets** — never `VITE_`, never in the repo. Never put a model identifier in commits, PRs, or code.
- **Voice = adapter seam, never welded (David).** The vendor landscape (STT/TTS/turn-detection/frameworks) shifts month to month, so any voice capability goes **behind our own thin interface** — the app calls `speak()`/listen, never a vendor directly (today: browser Web Speech in `src/lib/useSpeech.ts` + `src/lib/voice.ts`; tomorrow: LiveKit belt + Deepgram ears + a **Cartesia _or_ ElevenLabs** mouth drop in behind the same seam — both live as sibling `Mouth` adapters (`src/lib/voice/`), so the pick is a one-line/env flip (`VITE_TWW_MOUTH`), decided by ear on real lines: Cartesia for latency, ElevenLabs for fidelity). **The real-time voice pipeline is spike-PROVEN (David, 2026-08): Atlas hears + talks back live, brain still ours.** **Never build Atlas's logic inside a vendor's all-in-one agent format** (OpenAI Realtime, ElevenLabs Conversational, Deepgram Voice Agent) — that welds us. The **brain stays ours** (Claude in our own edge function). The on-screen text is always the guaranteed fallback (ties to Accessibility). Voice answers are terse (the "voice mode" brevity rules) — voice needs ~60–70% shorter replies than text.

## Accessibility — build to WCAG AA (locked design standard)
Stylish **and** usable by everyone. The elderly and low-vision traveler are among our best-spending markets — building genuinely *for* them is a **moat** (David), not a compliance chore — and "Atlas walks beside everyone" has to be true in the pixels, so accessibility is baked in from the first screen, never bolted on later (retrofitting a hardened UI is expensive). This is standing canon, right alongside the payments-never rule and the voice rule. Hold a real, checkable AA bar:
- **Contrast** meets AA (≥ 4.5:1 body, ≥ 3:1 large text) — audit muted grays on tinted grounds; no classy-but-unreadable light-gray-on-white.
- **Text resizes** without breaking (rem units; nothing that clips on zoom); a sensible default size.
- **Tap targets** big enough for a real thumb (~44px).
- **Every control labeled** for screen readers; **visible keyboard focus**; **never color alone** for meaning; respect `prefers-reduced-motion`.
- **Checkable, not a vibe** — automated a11y checks in the build so a regression fails the build, same discipline as the dossier QC gate.

## Foundation sockets (locked canon — pour the seams now, build the machinery later)
Not built yet, but the foundation is shaped to receive them clean (an institutional/entity universe — a team, a federation, a wedding block — plugs in with no rework). **Universe set — FOUR, David-locked 2026-08 (his exact names): `General Travel` · `TravelWell-Ultra` · `TLEU / TravelWell Live Entertainment Universe` · `Romance, Marriages & Honeymoons`. Olympics and team-Sports travel are NOT universes; the sports play is the `spectator` SI only.** (Adventure was floated as a possible fifth and is **not** locked — don't publish it as a universe.) The subject-not-person seam stays (it also serves Romance wedding-blocks/groups). Detail in `docs/status-and-launch-plan.md`.
- **A traveler is a *subject*, not just a person.** One profile, captured once; a person belongs to teams/institutions by **role** (athlete, coach, medic, ops director); an entity (team, federation) can itself be a "traveler." Don't scatter person-only assumptions.
- **Consumer and institutional data stay on separate seams from day one.** Don't build the compliance machinery (minors, medical, accreditation, FERPA) until needed — just never entangle the two, because untangling later is the expensive mistake and keeping the seam clean now is nearly free.
- **One tank, many products.** The "next-task" operational OS is its **own product on the shared data tank** — same data, separate spigot — never welded into the consumer app.
- **Booking windows are absolute, multi-year dated event-series** (not season/months) — serves the marketing engine and the Olympic quad from one timing model.

## Placement & booking canon (locked — build-toward)
Shapes the experience / itinerary / provider records from the first pour so Atlas is a companion, not a catalog. Detail in `docs/status-and-launch-plan.md`.
- **Experiences carry structured fit-rules** — `duration / before / after / pairs_with / pace / time-of-day / season` as a fixed tag vocabulary, **inherited by experience type** (author "no-fly-after-diving" once for diving). Atlas *derives* the connective buffers (arrival rest, no-fly window, recovery morning) from these and **recomputes them on any reshuffle** — the safety spine is enforced, never stranded.
- **Itinerary is a first-class dated object** — ordered placed-experiences across dated days (day-number + weekday + date, always paired). **Placed ≠ booked** (idea → placed → handed-off → confirmed). One traveler owns many trips.
- **Provider capability ledger** — capability fields (commission lane, confirmation-return method) carry `source` + `last_verified` + `confidence` and are **machine-writable from day one**. Confirmation-return is an **upgradeable field** (`email-parse` everywhere to start → `api` as each provider ships it). Provider is always merchant of record; Atlas never touches payment.
- **Self-updating changelog watcher ships at launch** (narrow: the 8–12 public-API providers) as the machine-writable socket's first consumer; the full network watcher waits for the raise.

## The catalog → DB pipeline (important)
- The catalog is **authored in `src/data/`** (`places.ts`, `taxonomy.ts`, `*.json`) and in provider CSVs under `src/data/providers/`.
- `scripts/gen-catalog-seed.ts` (run via esbuild) **generates** the seed SQL migrations (`0003`–`0007`). **Do not hand-edit those generated files** — change the source in `src/data/` and regenerate.
  - Regenerate: `./node_modules/.bin/esbuild scripts/gen-catalog-seed.ts --bundle --platform=node --format=esm --outfile=scratchpad/gen.mjs && node scratchpad/gen.mjs`
- The app reads the catalog **DB-first with a bundle fallback** (`src/store/useCatalog.ts` + `src/lib/catalog.ts`). Production reads Supabase; the bundle covers offline/preview.
- After changing the catalog: regenerate the seed **and** re-run the affected migration in the Supabase SQL editor. Seeds are idempotent (`on conflict do update`); some self-heal schema (add columns, swap constraints) so a single re-run reconciles.
- **Drop-in dossiers — two folders, two gates.** Destinations: `src/data/destinations/*.json` → `npm run validate:ingest`. Special Interests: `src/data/interests/*.json` → `npm run validate:si`. `_`-prefixed files are references and never ship. Destination batches **replace** on id collision; SI batches **shallow-merge** (a data-only `{id, data}` patch is valid and must not blank the row).
- **The SI dossier is nine layers (David-locked 2026-08)** — `market · streams · sources · timing+events · map · providers · faq · wells/whispers/safety · seo/schema` in `special_interests.data` (migration 0012), typed as `SiData` in `taxonomy.ts`. **Every figure is `{label, value, confidence, source?}` and `confidence` is REQUIRED** (`verified` | `estimate`); `verified` without a `source` is a hard error. An unlabeled number is a guessed number — the gate refuses it. Contract: `docs/ingest-contract.md` §4; gold reference `src/data/interests/_REFERENCE.golf.json`.

## Working rules
- Run **`npm run build`** and **`npx tsc --noEmit`** green before committing.
- Develop on a feature branch; merge to `main` (fast-forward). Vercel deploys from `main`.
- Use the scratchpad dir for throwaway scripts; don't leave probes or unused deps in the repo.
- Planning/roadmap lives in `docs/status-and-launch-plan.md`; the sub_region canon in `docs/sub-region-master.md`.
