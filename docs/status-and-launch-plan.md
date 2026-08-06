# TravelWell — Status Read & Launch-Plan Shape

*Engineering foundation status + the shape of the road to launch. Living document — evolves with the build. Owner: Sana (engineering).*

---

## PART 1 — Where the foundation actually stands

### ✅ Built and solid (in production)
- **Data spine & catalog read-layer** — Postgres + RLS, DB-served catalog with a bundle fallback (migrations 0001–0010). 13 regions, 32 SIs (6 live), 12 Wells, 62 providers, 38 destinations, 9 guides, sub-regions, local signals. One canonical vocabulary end-to-end: one SI list, one region scheme, the 5 budget tiers, the commission-gate set, the live/future switch.
- **The matching keystone** — providers filter by SI + region with graceful fallback; verified live on the Caribbean set (tropical+11C → 15 stays; region-less airlines pass; wellness narrows correctly).
- **Atlas (the messenger)** — Claude-backed Edge Function, grounded in the live journey; **persistent conversation spine** shipped (survives navigation + reload — the narrative-continuity foundation).
- **Traveler journey & Travel I.D.** — persisted to the DB, resumes across devices; age *ranges*, never birthdays (privacy by design).
- **Auth** — Supabase magic-link (sign-up → verify → activation).
- **Images** — server-side Unsplash proxy with a cache table (consistent, rate-safe).
- **Provider ingest pipeline** — the seed generator ingests provider CSVs directly; new sets drop in by adding a file.
- **Deploy** — Vercel from `main`.

### 🟡 Half-built / stubbed (works, not finished)
- **Booking** — affiliate **handoff** (`/go` → `booking_url`) with a checkout UI shell (3 tracks). **Locked as the permanent model** (David): the provider is merchant of record, the traveler books and pays them directly, Atlas never touches payment. Keeps us at PCI SAQ A, off the liability hook — a feature, not a gap. No payment processing to build, ever.
- **Atlas guided journey** — the *spine* is built; **Guided Mode** (Atlas driving page-to-page, pre-setting choices, the glow/spotlight) is Phase 2–4, not built.
- **Content depth** — destinations are shallow (a line + image). The **deep dossier model** (jsonb: jewels, safety, SEO, booking-window) is validated (Cape Town ingest test passed) but not built/ingested. Providers cover ~2 regions partially.
- **Voice** — Web Speech input works; degrades cleanly where unsupported.
- **Analytics** — event logging to DB exists; no attribution or outbound.

### 🔴 Still ahead before soft launch
- **Guided Mode (Phase 2)** — the guided walk; the product promise.
- **Destination data model + first real dossiers** for the live-6 SIs in launch regions.
- **SEO rendering** — we are a client-rendered SPA; crawlers get one static title/meta for every route. The ATTRACT/SEO landing-page strategy needs server-render or prerender + per-route meta + structured data + sitemap. **The biggest launch-blocker for the traffic model.**
- **Test suite + CI** — none today.
- **Analytics/attribution socket** + basic observability.

---

## PART 2 — The full-launch plan (shape)

**Phase A — Foundation hardening & sockets (pre-soft-launch)**
1. Destination **data model + ingest** (jsonb: sub_region, depth, booking-window designed in now) — **and experiences carry structured fit-rules** so Atlas can architect, not just recommend. 🏋️ *(see the trip-architect data requirements below)*
2. First **real dossiers** for the live-6 SIs in 2–3 launch regions.
3. **Guided Mode Phase 2** — Atlas leads the journey. 🏋️
4. **SEO rendering** (prerender/SSR + per-route meta + sitemap + JSON-LD). 🏋️ **Socket 1 status: ✅ spike-passed · tool locked (`vite-react-ssg`, no fallback needed) · ready to build · gated on rung-2 funding.** No unknowns to re-litigate — when funded, we build straight through.
5. **Test + CI** baseline; analytics **attribution socket** + **marketing-permission fields** on the profile (room, not sends).
6. **Booking = affiliate handoff, locked** — provider is merchant of record; Atlas surfaces → hands off → confirmation returns. No payments to build. Bake the plain-language rule into Atlas ("you'll book right with them," never "I'll hold it for you").

**Phase B — Soft launch** — live-6 SIs, launch regions, English, handoff booking, guided flow, real content depth, SEO pages ranking. Prove the engines.

**Phase C — The self-building world (World-Engine)**
7. **Cache-back** (Atlas writes researched places back; precedent live in the image cache).
8. **1st-of-month verification sweep** + **founder-confirm queue** (safety/booking/commission gated). 🏋️ *Automation-heavy: scheduler, resumability, per-field gating.*

**Phase D — Full launch scale-out**
9. **i18n / 9 languages** — today a locale/RTL *switcher* only, no translated content. Full launch = translate all UI + content, Atlas in-language, RTL QA. 🏋️🏋️ *Biggest single lift.*
10. **Marketing outbound** — email/SMS reactivation, permission + timing on the profile.
11. **Content at scale** — top-12 deep per sub-region across regions; provider coverage across all wells.
12. Hardening, observability, trust/safety verification at scale, trademark filings.

> **We never touch the card; the provider is always merchant of record** (locked — see CLAUDE.md). Today that's the affiliate handoff (`/go`). The agent-era evolution (David, 2026-07) is that **Atlas may *close* the booking on our own surface** — orchestrate discover→decide→book with no leaky handoff — *but the provider/aggregator stays merchant of record and holds the card* (Duffel Payments, aggregator billing, Stripe hosted checkout). We still never touch card data (PCI SAQ A) and never become seller of record. **Becoming merchant of record ourselves is a separate, deliberate, funded decision** (PCI-DSS + bonding + liability), not a drift.

**Heavy lifts / where people concentrate:** i18n, SEO rendering, the monthly-sweep automation, content production at scale.

### 14-day launch-surface assessment (Jul 2026 — "what's genuinely flippable")
David's question: past the 6-SI soft launch, how much more can go *genuinely* live in ~14 days for a VC demo — real, not planned. Audited the catalog. **The core finding: `live` vs `preview` is almost entirely a status decision, not a content gap.** Every preview region carries the same depth as the live ones (each ~2–4 destinations, mostly 2–3 `verified` + 1 `stub`); the only region with a real provider roster is 05A (39, safari) + 11C (~23 CSV, Caribbean) — and the *live* regions launched without per-region provider rosters too. So the fastest real wins are flipping content we already built and filling the empty rooms in what's already live — not new build.

Prioritized by impact ÷ effort:
1. **Fill hollow spots in what's already live (do first — a live-but-empty room is the worst VC look).** **12A United States is live with 0 destination dossiers** (10 sub-regions, no places) — ingest 3–4 US city dossiers from the stockpile. Upgrade `stub` destinations toward `verified` where the stockpile allows (12 stubs across the catalog).
2. **Flip the content-ready preview regions (near one-line flips + a QC pass).** 06A Southern Africa (2 verified + heavy TLEU coverage: Cape Town whale/festive, Vic Falls, safari dry season), 03F Nordics (aurora/Lapland), 08A East Asia, 09P Oceania, 13A Canada. Each is at content-parity with the 7 live regions. **Hold 10S until the Mexico anchor lands (David's call).** This takes the live world from **7 → up to 12 regions.** Gate each flip on: QC the existing dossiers + a working affiliate handoff, so it's not a hollow flip.
3. **Flip 3–4 high-appeal, content-backed SIs.** `wine` (6 acts), `culinary` (5), `culture` (4), `wellness` (4) all have activities + map onto already-live regions — widens the funnel cheaply. (Live SIs don't depend on the ACTIVITIES map, so this is a QC-and-flip, not a build.)
4. **Surface the TLEU forward calendar.** 70 events are ingested but nothing renders them yet — a modest region/SI-page module ("marquee moments + book-by windows") turns banked data into a *visible*, unique differentiator. Medium effort, high demo value.

**Ski — the honest read (David wants it as a launch target):** ski is the *least* ready of the obvious candidates. **0 ski activities, 0 ski destination dossiers, 0 ski providers** — the only ski data is 2 TLEU lookahead events (Alps, Lapland) that don't surface. Flipping ski genuinely live needs real content (Alps/Japan/Rockies dossiers) + supply (chalet/lift/instructor providers) + activities. It's a **fast-follow ingest, not a status flip** — achievable in the window *only if* the 370-dossier stockpile already holds ski dossiers ready to drop in. Don't promise it day-1 live without confirming that stock.

**Two accuracy guardrails for the VC framing (so we show real, not planned):**
- **"Ranking" is not yet live.** The dossiers are built, but SEO/SSG rendering is unshipped (gated on the raise; proven by spike). Frame as: rich live product now, the ranking engine is the near-term build the raise funds — don't say "ranking today."
- **Languages are not a live asset.** i18n is a locale/RTL *switcher* only — no translated content (Part 2, item 9). "Live in 4 languages" isn't true yet.

### Moat readiness scorecard + the language-leverage play (Jul 2026, VC-research pass)
The VC research named five moats OpenAI/Booking can't easily copy. Mapped to what's actually shipped, so the raise leans on real ground:
- **Hand-built destination intelligence — STRONG, real.** 38 live dossiers (26 verified) + ~370 stockpile. Our best-demonstrable moat. Gaps: only 38 of ~370 ingested; ranking (SEO) not live.
- **Deeper identity engine — REAL CORE, demoable.** The speak/type → Atlas captures → writes the vision back → confirm loop is genuinely built (`useSpeech` + Atlas). The "deepens every trip" layer is still socket. This is the head-to-head vs Layla's "identity-first planning" — keep the onboarding→writeback flow crisp for the demo.
- **Multi-language — GAP today, but the highest-leverage 14-day win.** No i18n framework, no translated content, all UI copy hardcoded English. BUT we're AI-native: **Atlas already speaks es/ar/zh/fr** — the concierge (the heart of the product) is made multilingual by passing `locale` through the invoke into the system prompt (`supabase.ts` → `atlas/index.ts`), a small, contained change; the model does the rest. The full i18n retrofit (externalize every string) remains the 🏋️🏋️ biggest single lift and is NOT a 14-day job — so scope to **demonstrable multilingual**: Atlas-in-language + localize the core flow screens (home, onboarding, one region, one destination, the Wells rail) + Arabic RTL QA. That converts the moat VCs care most about from "declared" to "shown" cheaply — the single highest-ROI item in the window.
- **Safety / duty-of-care spine — REAL DATA, currently invisible.** `safety.json` + `emergency-numbers.ts` + the L1–L4 gate model are real, but the floating safety button isn't built (flagged in the Fora audit). Wiring the always-present safety button that surfaces existing data is a modest, high-signal demo win — turns a real-but-hidden moat visible.
- **Pet-safety engine — ASPIRATIONAL BRAND CONCEPT, NOT a build item (David, Jul 2026).** The every-30-days pet engine (airline pet-rules + destination-country entry requirements, surfaced pre-booking) is a **Hero-Video / brand vision that lives in Notion — never built as code**, and not scheduled. Treat it as a **brand promise / roadmap concept**, not a near-term build; do not describe it as live (VC plan corrected). ~4M travelers bring pets — the market's real; the engine is vision, not yet a plan. (If we ever build it, it's an extension of the existing green-cross safety spine.)
- **Commission-view idea — REVIVE from the first MVP (David, Jul 2026).** The Luxury Paris itinerary (Springsteen trip, Teterboro→Paris jet, a button opening the full itinerary with each item's commission %/$ and a ~$24K total) was **real but in the pivoted-away first MVP** — the hand-built approach we left behind. Don't port the artifact; **carry the *idea* — commission made visible, shown when we choose** — into the current MVP. It already has a home: the **VC-only commission reveal on the itinerary** (Scene 6 of `docs/atlas-demo-script.md`), built with the itinerary engine.
- **Supplier depth — THIN / concentrated (weakest real moat).** 62 providers but ~all in 05A (39, safari) + 11C (~23, Caribbean); most regions have ~0 named suppliers. Deepening this is the Fora/host-agency play (separate thread), not a 14-day build sprint — don't overclaim breadth.

**Refined 14-day priority for maximum *demonstrable* moat:** (1) Atlas-in-language + core-flow localization (make the top moat real); (2) flip content-ready preview regions 7→12 + fill the empty US; (3) make the safety spine visible (floating button on existing data); (4) surface the TLEU forward calendar; (5) tighten onboarding→vision-writeback (the identity moat vs Layla). Full i18n retrofit, supplier-breadth, SEO ranking, and ski stay honestly framed as post-window / funded-socket / fast-follow.

**Demo timing — target moved to ~Aug 15, best-not-fastest (David, Jul 2026).**
Off Aug 1; new working target **~Aug 15, reassessed weekly** — and if doing it right needs another
week or two, we take it. The reasoning is the canon, not just the date:
- **Unattended × rushed = the bad combination.** The VCs click through alone — nobody in the room to
  smooth a rough spot. If the voice isn't full-launch quality or the guided journey has a gap, there's
  no one there to save it. So **getting it right beats getting it fast** (the Ferrari standard — best,
  not fastest).
- **The date is synced to reality, not forced onto it.** A real date can't be set until the LiveKit
  voice spike runs and the demo mechanics (the guided walk) settle — the target tracks the build, not
  the reverse.
- **No fire drill.** Keep the real work moving — LiveKit spike, the Safari spine, the ingest, the
  guided-walk engine — at a pace that produces something that actually works unattended.

### Live MVP inventory snapshot (Jul 2026 — for the depth-and-bookability audit)
What's actually **live and clickable in the app** (vs the research library's *built* counts,
which CC audits separately). The deck states both honestly — "N built, M live, rest ingesting" —
so a VC who clicks never catches a gap. Point-in-time; regenerate after any ingest.
- **Totals:** 40 destinations, **29 verified** (deep) + 11 stub/preview. But most verified rows are
  *breadth* — roughly one anchor per region — not SI-depth. Genuine SI-depth today is Safari (deep) and
  Winter/Ski (moderate, just ingested).
- **Safari (05A East Africa + 06A Southern Africa) — the star, deep.** ~5 live-deep destinations
  (Maasai Mara, Serengeti, Ngorongoro verified; Volcanoes stub; + 2 Southern Africa), **39 providers**,
  full safety spine. Sellable now (Duffel + direct).
- **Winter/Ski (01F) — deepened.** **7 live-deep dedicated alpine** across CH/FR/AT/IT (Zermatt,
  St-Anton, Chamonix + St. Moritz, Courchevel, Cortina d'Ampezzo [a 2026 Olympic host], Kitzbühel),
  **19 ski providers**, real safety/timing/jewels on each. Library has ~33 *built* — so "33 built, 7
  live, rest ingesting." Bookable now (Duffel + direct, no IATAN). Still hand-authored — full dossiers
  swap in on the alpine ingest.
- **Romance/Marriages/Honeymoons — thin-live.** A few general Mediterranean (02F) anchors; little
  romance-*specific* depth or providers yet. Preview beyond the anchors.
- **Tropical · River · Liveaboard · Expedition — live shelves, ~0 deep destinations.** The SI is live
  (door opens) but the destinations behind it are preview/absent. Honest gap.
- **Attribution caveat:** legacy D() rows carry no `si` tags, so per-SI counts lean on region — don't
  publish a raw per-SI table without de-noising (region-primary sweeps non-SI rows in, e.g. Paris into ski).

**Demo language call — English flawless + Arabic RTL flip, only those two (David, Jul 2026, LOCKED).**
The VCs are US-based, so **English is the one that gets read — it must be flawless.** The other
languages are **not there to be read by the investor**; they exist to **prove the engine is multilingual
from the bones.** So the WOW is *not* polished copy in nine markets — it's a **live language switch on one
screen where the whole interface reflows in front of them.** The call:
1. **English — flawless** (the reading language, the one that matters).
2. **Arabic — the one showcase language for a live flip**, chosen because it's **RTL**: the whole UI
   mirrors and flips, the dramatic "this is real internationalization" proof. (Arabic was already our
   first template — plays straight into what's built.)
3. **Polish only English + Arabic to native-speaker quality, and only on the demo-path screens** — not
   all nine for the demo; a VC only ever sees the flip.
4. **Honest framing (the line we won't cross):** *"English and Arabic are demo-polished; full nine-market
   translation is native-speaker-reviewed at launch."* We show a real engine, we don't blow smoke.

### Unattended guided-walk — the make-or-break open question (David, Jul 2026; to lock in a session)
**We won't be in the room.** The VCs open the demo and click through alone, so it has to **guide a
stranger through the whole safari walk with nobody driving**: onboarding → picks → options → itinerary
reveal → the language flip → the close. The Atlas hero flow ("look down here" → the chip pulses → they
tap) is the proven **atom** for ONE beat; the build is that same guided hand across **every** beat — "at
every step the traveler always knows what to do next." Not a solo solve: David maps the experience (what
each beat should *feel* like), engineering maps the mechanics, a joint session locks it. **Engineering
seed (starting to turn it over — NOT built yet):**
- **Generalize the hero atom into a data-driven choreography** — an ordered list of beats, each =
  `{ Atlas line, target element to spotlight/pulse, the action we wait for, advance condition }`. The
  current hero flow is exactly one hard-coded instance of this shape.
- **Spotlight any element on any screen** — lift the pulse out of the concierge into a portal-based
  coach-mark + an Atlas caption anchored to any target (an onboarding field, an option card, the
  itinerary, the language toggle), so "the one lit thing" works everywhere, not just on Well chips.
- **Advance only on the real action, never auto-play** — each beat waits for the traveler to actually do
  it (preserves "they always choose"); if they stall, re-pulse a gentle nudge. Interactive, not a video.
- **A cross-route tour controller** — lives above the router (the `AtlasOrchestrator` whisper loop is the
  precedent; state in the store), survives navigation, and knows what to spotlight next on each screen.
- **The anti-confusion invariant at every beat: exactly ONE lit affordance + one Atlas cue** — never two
  competing calls to action (the same principle as the mic/send hierarchy fix).
- **Graceful off-script recovery** — if they wander, offer a "resume the walk" pill rather than trapping
  them. The **language flip is just one scripted beat** in this same engine.

### Universe-inventory readiness (Jul 2026 — demonstrable vs architected)
> **⚠️ Universe set corrected — David 2026-08 (supersedes the Sports/Olympics framing below).** The universes are now **FOUR front doors, David's exact names: General Travel · TravelWell-Ultra · TLEU / TravelWell Live Entertainment Universe · Romance, Marriages & Honeymoons**, with **Adventure floated but NOT locked — it is four, not five** (its case rides `safari` + `expedition`, both high-commission/premium). **Olympics and team-Sports travel are OUT as universes** — David is deliberately staying clear of athlete/team movement (a 75-yr US near-monopoly). **The sports play is a single Signature Interest: `spectator`** — ticket + travel for *spectators* (pro football's ~8–15% of a 65k-avg gate travels; plus colleges, marathons, Ironman), an underserved lane we can actually work. So: no Olympics/CCSTT/team-travel universe build; `olympic`/`sports`/`prosports`/`compsports` SIs are **parked** (leave as `preview`, don't invest); `spectator` is the one to grow. The **subject-not-person schema seam stays** (it serves Romance wedding-blocks / groups too) — just no longer "Olympic"-driven. Reconcile the paragraphs below against this note.

David frames the offering as a family of "universes." Mapped to what's actually in the repo, so the VC deck shows built product and *labels* the roadmap as roadmap:
- **General Travel (mothership) — REAL, demonstrable today.** The live MVP: 6 SIs (→ more on flip), 7 live regions (→ 12), 38 dossiers, Atlas (speak/type), the Wells, PWA, safety data. This is the proof.
- **TravelWell-Ultra — REAL, demonstrable today as the luxury overlay.** `ultra` is a *live* SI/overlay + a budget tier; `LUX_WELLS` (Nanny-Well, Security-Well — ultra-only via `WellAudience`) are live. Not a separate app, but a genuine, shippable ultra layer across the product — a crisp "ultra mode" walkthrough is real.
- **TLEU (Live Events Universe) — REAL as data, invisible until surfaced.** 70 events ingested into `local_signals`; nothing renders them yet. Demonstrable within days once the calendar module ships (14-day item #4). Highest built-ratio quick win of the universes.
- **Sports Travel Universe (Team / Spectator / Olympics+Winter / Pro Cycling / colleges-CCSTT / Pro sports) — ARCHITECTED, not built.** The 6 sports-family SIs (`group`, `olympic`, `sports`, `spectator`, `prosports`, `compsports`) exist only as `preview` **names with 0 activities / 0 content**. **There is no college/CCSTT data, no "12-engine OS", no Olympics/cycling/team dataset anywhere in the repo** — the sole artifact is a handful of TLEU events tagged `prosports-spectator` (which don't surface). Per our own foundation-socket canon this is deliberate: the team/Olympic universe is a **schema seam, not a build** ("Schema seam now, not a build"; multi-year dated event-series designed-in). **VC framing:** present this as *architectural readiness* — the pluggable SI board, subject-not-person schema, and multi-year event-series model mean these universes plug in with no rewrite — **not** as live inventory. Do not show "1,600 colleges / CCSTT / Pro Cycling" as shipped.
  - **Caution on the "1,600" number:** in the repo, 1,600 is the **destination** corpus (≈87 sub-regions × ~12–20 places = "big world, built once"), *not* 1,600 colleges. Don't let the two merge in the deck.

---

## PART 3 — Sockets to hold open now (cheap now, expensive later)
- **Soul / lifetime loop** → the **traveler profile is the seed**: identity + history + evolving intent, not a signup form. Rank and reach out for lifetime over booking.
- **Team/Olympic universe** → make "traveler" an entity that could be a person *or* a team/institution; keep the SI board pluggable (the 8 sports SIs slot in). Schema seam now, not a build.
- **Atlas** → the vessel. Spine done; Guided Mode + narrative continuity + live-research (cache-back) make him carry the relationship.
- **Marketing socket** → attribution (ad lane in) + permission/timing (reach back out), both on the profile. Leave the fields; don't build the sends yet.

### Concrete foundation choices to keep it pluggable
Derived from the Olympic/team-travel synthesis. These shape *how* we pour the
profile and the World-Engine fields — not new build, just the right shape.
- **Subject, not user.** Model the profile as a *subject* (person is the default) and allow a person to belong to 0..N entities with a **role** (athlete, coach, medic, ops director). Avoids a rewrite when a "traveler" becomes a team or institution. *Touches the profile schema — decide before it hardens.*
- **Multi-year dated event-series.** Build the booking-window fields as **absolute dated windows with an arbitrary look-ahead horizon** (years out) + lead-time — not season/months only. The Olympic quad needs 2–4 year look-ahead; cheap to design in, a migration to retrofit.
- **Trips can have participants with roles.** Extend the existing `TripBlock.whom` hint toward role-scoped participants, so "show each person only their next task" has a home later without reshaping the trip model.
- **Universe dimension on the catalog.** Keep the tank universe-taggable so a universe (TWW-main / Ultra / Sports / TLEU) filters the shared data — "one tank, many front doors."

### The living Travel ID — Identity Builder + Lifetime Loop (David-locked; spec 2026-05-28, age model 2026-07-29)
David's spine for the whole product: **we're not booking a trip, we're building a Travel ID for life.** A short six-step onboarding *conversation* (not a form) produces the traveler's **Identity Card**; a lifetime loop refreshes it every trip after, so a returning traveler never starts over — Atlas already knows who they are and just confirms what's changed. Full source: `docs/identity-builder-and-age-budget.md` (David's file, filed verbatim).
- **The six-step Identity Builder (conversation, scrolls as Atlas guides):**
  1. **Who are you** — name + **age range** (12 cohorts, below).
  2. **How you like to move** — activity level (Very / Moderately / Lightly Active · Leisurely Strolls) + access needs (Wheelchair · Cane · Frequent Rest · No/Some Stairs · Fully Mobile). Sets itinerary shape + tempo.
  3. **Budget style** — **per Well, not one tier** (Essential · Comfort · Premier · Luxury · Ultra). The human default is **"Mix my ranges" — pick up to three** to float between per Well; nudge higher/lower anytime. **Fly-Well is the exception**: cabin classes (First · Business · Premium Economy · Economy), not the five tiers.
  4. **Who's traveling** — party (adults · children w/ ages · seniors w/ ages) → activates Family / Senior / Group / Premium.
  5. **What kind of trip** — interests, or "Mix my interests" → the matching Worlds.
  6. **In your own words** — the vision, a couple of sentences, interpreted into Worlds/activities/budget/mobility/timing.
- **The `constant` vs the `variable` (the key data-model insight):** the ID holds the **constant** (who they are — steps 1–4ish); the **vision (step 6) is the variable** that changes every trip (beach this year, ski next). Don't store the vision *as* identity — store it as the current-trip intent, re-asked each loop.
- **Age is its own axis — age shapes pace/tone/mobility/itinerary, NEVER budget** (locked; matches the "Destination axes / separate axes" discipline). **12 cohorts** (seniors split 65–74 / 75–84 / 85+, supersedes the old single 65+): Infant&Toddler 0–3 · Young Child 4–8 · Tween 9–12 · Teen 13–17 · Young Adult 18–24 · Early Adult 25–34 · Established Adult 35–44 · Peak Earner 45–54 · Pre-Retirement 55–64 · Young Senior 65–74 · Senior 75–84 · Senior+ 85+. Each carries an energy/rest picture (per the source file) that Atlas uses to set pace — a stored *range*, never a birthday (privacy-by-design, matches today's Travel I.D.).
- **Safer-Informed capabilities overlay (this is where the motto is earned):** up front and warmly, Atlas asks **both sides — what physical limitations/safety issues to know about AND what you're fully able to do** (pace, rest/naps, accessibility, any medical factor). **The promise, always: every fact builds the trip AROUND the traveler — enabling, never handing them limitations.** An explicit capability/limitation **overrides the age default** (a 35-yr-old with a heart condition = a 65-yr-old with one). Ties to the locked Safer-Informed principle and the safety gates.
- **The Lifetime Loop — Attract → Guide → Extend → Reactivate → Repeat.** Built once, refreshed every trip. On return (maybe a year on) Atlas does a short warm check-in on the deltas: **age** (cohort may shift) · **health** (better/worse/same — "still up to what you did last trip?") · **budget** (moved/held) · **interests** (grown/changed) · **this trip's vision**. Never start over — confirm, refresh, and the options always look like what they just described. *Win the lifetime, not the booking; grow into their friends & family.*
- **Voice guardrail (David, 2026-07-29):** keep **"honest / honestly" out of Atlas's vocabulary entirely** (reinforces the standing CLAUDE.md voice rule — prefer *accurate / plainly / straight*). Atlas stays tight: ~two sentences / ~25 words, senior-first big type. *(Traveler-facing app copy scrubbed to match — About page done 2026-08; internal planning docs are not Atlas voice.)*
- **Integration read (what's real vs socket today):** the **speak/type → Atlas captures → writes the vision back → confirm** loop is genuinely built (`useSpeech` + `atlas/index.ts`); age-*ranges* + Travel I.D. persist to the DB and resume across devices. **Built (Aug 2026):** (a) the **permanent Identity Card** — the card leads with the person and durable facts, and the **vision is split out as the per-trip variable** (`src/lib/identity.ts` `deriveIdentity` + `Profile.tsx`); (b) **Sign-Up captured in canon vocabulary** — the 12 age cohorts (adult subset for self, all 12 for party) + per-Well tiers Essential…Ultra / Fly cabin classes, "Mix my ranges" capped at 3 per Well; (c) the **Safer-Informed capabilities overlay** — a new "How you move" onboarding step captures pace + access + **both sides** (`capabilities` = fully-up-for, `accessibility` = plan-around), stored structured (migration `0011`), shown on the card + a "Both sides" Profile section, and fed to Atlas (`insights.ts` profile.pace/access/ableTo/planAround) with a system-prompt rule to **build AROUND the traveler, never limit them** and let a stated factor **override the age default**. It's the socket the L3 gates will read (the gate *enforcement* itself is still ahead). (d) the **Lifetime Loop check-in** is built (`/welcome-back`, wired from Sign-In's recognized state): a returning traveler gets a short warm diff over the stored ID — age (confirm or bump a cohort), energy (better/same/easier → shifts the activity level), budget (steady/more/leaner → nudges every per-Well tier a notch), interests (confirm + add), and the **vision re-asked as the variable** — then it writes the deltas back via `saveTravelId` and drops them into the journey. Refresh, never rebuild. All ride the existing profile schema + the "subject-not-user" seam — no fork. **VC ask (#7):** the whole **Sign-up + Sign-in + full Onboarding** is now a first-class demo surface — the clearest "not like every other travel site" moment.

### Romance, Marriages & Honeymoons — the first fully-specified front door (David, Jul 2026; re-confirmed Aug 2026)
David's "crown" universe package. **Not a build ask; it's the picture + market/architecture proof for the VC.** The key point for us: it's a **presentation layer, nothing forks in the code** — and that's not a hope, it's already proven: **`/luxury` is exactly this pattern today** (a branded universe front door on the shared engine). Romance is the same move on the sealed **`romance` SI** (live, display "Romance, Marriages & Honeymoons", accent `#A8527A`) — its own name/landing/tone/tagline on the surface, same identity tank / Atlas / commission / safety / itinerary underneath. **David-locked (Aug 2026): it's a confirmed front-door universe — one of the four (General · Ultra · Live Entertainment · Romance) — and does NOT need to be live online for the VC; the market / monetization / vendor-ecosystem depth carries it in the deck. The `romance` slug stays sealed — do not touch it.**
- **Tagline (locked):** *"If It's Love… TravelWell."* — already renders on the SI page via the `Tagline` primitive (`romance → "Love"` in `SI_TAGLINE_SUBJECT`). Joins the brand slogan family. TravelWell stays one word.
- **Build-toward socket (David, Aug 2026): a per-universe Atlas vocabulary.** Romance gets its own register — how Atlas talks about weddings, honeymoons, blocks — layered on the same brain (a system-prompt/context overlay selected by universe, never a forked Atlas). Nothing to build now; just don't assume Atlas's voice is one-size — leave room for a universe-scoped tone overlay. A full monetization package lives in the business plan (not the repo).
- **Slowmance — locked campaign copy** (verbatim, `TWW-Romance-Slowmance-Copy-LOCKED`): own "the exhale," one place / long single stay / "don't race your honeymoon, live it." Do not re-draft without David.
- **Product tie-in that DOES land in the build: "pace before place."** The Slowmance cue = Atlas asks **pace before geography** in onboarding — which slots straight into the 4-step onboarding order (vision → activities → **pace** → budget) we're already shaping. Real, not just marketing.
- **Why it's the crown (VC "why now"):** honeymoons ~$119B (2026) → ~$202B (2034); the reframe stat — **avg destination wedding ≈ 39 guests, ~72% travel → one wedding ≈ 40 bookings**; Mexico+Europe+Caribbean ≈ 80% of US destination weddings (own the top ~20 places). Stats are the median where analysts disagree (built to survive a hard question).
- **Monetization shape** (maps onto our provider/commission model): rank **full-service planners first** (one-stop + best commission lane); **the block is the money** (wedding room-blocks + villa-blocks = the ~40-traveler concentrated node); all-inclusive resort portals (host/IATA lane); DMC-direct + insurance.
- **Content-team warm lead** (`TWW-Romance-Content-Team-WARM-LEAD`): a TCI husband-and-wife photo/video team, known to David — a provider who **pays us commission** AND yields **ownable marketing content** from real booked trips. Slots into the provider ledger as a commission-lane + content node; **gated on a signed content/model release** before any footage is used.
- **Four front doors — David-locked, 2026-08. Use his exact names:** **General Travel** · **TravelWell-Ultra** · **TLEU / TravelWell Live Entertainment Universe** · **Romance, Marriages & Honeymoons** — each a themed layer over an SI/tier slice of the one tank. **It is four, not five:** Adventure was floated (it would ride `safari` + `expedition`) but is **not locked** — never publish it as a universe. **Not universes:** Olympics and team-Sports travel (dropped); the sports play is the `spectator` SI only. Marginal cost of the next door is a fraction of the first; that compounding is the moat.

**Deliberately NOT pre-fit** (they attach to the core, they don't reshape it): the Equipment Intelligence Engine (carnets, chain-of-custody) and the 12 team-travel engines (Academic Constraint, Compliance, …). Keep the Wells/matching/booking core generic; don't contort the foundation guessing at them.

### Provider capability ledger + confirmation return (confirmed)
From the trip-architect thread — how a booking confirmation lands back in the itinerary without Atlas ever touching payment.
- **Confirmation return is an upgradeable field, not a fixed mechanism** — `api` where the provider supports it (clean + instant into the living itinerary), `email-parse` as the universal fallback (TripIt-style), `none` otherwise. Provider is always merchant of record; the method upgrades over time (email → API), tracked like the affiliate → embedded-commission upgrade.
- **Capability fields carry provenance, not just a flag.** On the provider record, each capability (commission lane, confirmation-return method) carries `source` + `last_verified` (date) + `confidence` — so we always know *when* we last confirmed it and *where* it came from.
- **Machine-writable from day one.** These fields are writable by an automated process, not only a human — so a watcher plugs in clean (human-edit-only would force a migration later).
- **Launch-phase consumer, not "someday":** a narrow autonomous **changelog sweep** on the 8–12 top providers with public API docs (Expedia, Booking, Viator, GetYourGuide tier) fetches their public changelog on a schedule, diffs it with AI, and writes capability upgrades (e.g., "shipped an API") into the ledger on its own. The full network watcher (newsletters, whole provider base) comes with the raise. So the machine-writable socket has a real consumer at launch — and it's a VC proof point (the platform watching its own supply and self-updating).

### Booking hand-off — retention design ("don't lose them to the net jungle")
The moment a traveler leaves to book with a provider is where we can lose them. Design principle: **keep the commission and keep the traveler are separable problems** — solve each with the right tool, don't compromise one for the other.
- **Hard constraint (name it so we don't chase a dead end):** a *web app* cannot put a "Back to TravelWell" bar over a provider's page. Booking sites block iframing (`X-Frame-Options` / CSP `frame-ancestors`), and framing would also break their payment flow **and** our affiliate attribution (the network needs a direct click). So the framed-window idea is not a web option.
- **Keep the commission:** the clean **direct new-tab redirect** to the provider's affiliate URL (what `/go` does today) is exactly what the network wants — don't touch it.
- **Keep the traveler — via our data + our tab, not their screen:**
  1. **Deep-link the hand-off** — carry region + dates + activity so they land on the exact property/charter, not a homepage (per-provider URL templating; biggest always-works win).
  2. **New-tab open keeps our tab alive** (already the case) — home is one tab-switch away; the `/go` return surface waits there.
  3. **Capture the placement *before* they leave** — placed ≠ booked, so the item is in the itinerary marked "handed-off" the instant they tap book. Even if they vanish, **we don't lose the trip.**
  4. **Atlas backstop + self-filing confirmation** — Atlas re-engages ("did you lock in the dive?"), and the confirmation-return field (email-parse → API) files the booking back into the itinerary on its own — the trip completes even if they never click back.
- **Roadmap — the true framed bar:** the "provider opens in an in-app browser with our bar + a Done→Atlas button and a dismiss callback" is a **native-app / installable-PWA** capability (`SFSafariViewController` iOS / `Chrome Custom Tabs` Android). That's David's exact vision — build it when we ship the app/PWA shell, not as a web hack.

### Return & confirmation flow (itinerary-engine spec — phone-first, non-tech traveler as the lens)
From David's cold-test. Three small, high-leverage fixes turn this from fragile to solid. **All three confirmed by David (Jul 2026) — locked to build.** Build gating: it gets its **own itinerary-engine run**, deliberately *not* colliding with the European node builds — David pings when that session opens. Build in the order below.
- **Save at hand-off, not on return (the gap to close).** The trip already lives server-side and reloads on sign-in (`hydrateJourney`/`replaceBlocks`) ✅ — but today the *affiliate* path only writes the item when they come back and tap "I booked it." Write the placement as **"handed-off / pending" the instant they tap book, before the redirect**, so the trip remembers even if they never return. (`placed ≠ booked`.)
- **Never "confirmed" without real details (a live bug today).** The current "I booked it" button flips the item to `confirmed` with *no* details — a hollow record. Add detail fields to the itinerary item (**date, time, party size, confirmation number, price**) and gate the `confirmed` status on them. "Yeah I did it" *starts* the capture, never closes it. Capture manually via Atlas **one question at a time, conversational — not a form** (email-parse / API fill it automatically where available).
- **Return = a magic-link email into the loaded trip** (the phone-first primary path). We already sign in by magic link, so the return email is that same link pointed at `/itinerary` — one tap, no password, lands them right where they left off. The *send* (reactivation: "did you lock in that dinner?") rides the EmailEventBus. Better than any browser-based return, because email is a channel we control.
- **Per-lane commission — where the money actually sits:** **affiliate** (CJ/AWIN/Viator/GYG) commission fires on the *network's* cookie at click time, so we get paid even if we miss details — missing detail only costs the *itinerary record + our reconciliation*. **Direct/DMC** (the 15–21% host-IATA lane) tracking is often *ours*, so detail-capture can be tied to *claiming/proving* the commission — **this is the real revenue risk**, and another reason detail-capture matters most on the high-commission bookings.
- **Device-aware return directions** — trivial to detect (we already read the viewport), but *largely unnecessary* if the magic-link email is the primary return, since one tap works on every device. A small enhancement, not a need. The true framed in-app "back to TravelWell" bar remains a native/PWA feature (see above).

### Collect & Build Together (itinerary behavior — traveler authors, Atlas guides)
The itinerary engine is **NOT an auto-optimizer** — it's a collect-pile → guided placement → traveler-decided sequencing. Slots onto the model we already have:
- **Collect pile = the `idea` status we already have.** A loved-but-unplaced option is `idea`; placing it is `idea → placed` (then handed-off → confirmed). So "grab everything you love, no pick-one pressure" needs no new state — flag as `idea`.
- **The load-bearing line: the timing/fit data *informs* Atlas's suggestions; the traveler *decides*.** The engine **enforces only the safety spine** — the derived buffers from fit-rules (no-fly-after-diving, arrival rest, recovery morning). *Everything discretionary* (which day the vineyard, morning vs afternoon light, what pairs with what) is a **suggestion the traveler places**, never an auto-arrange. Atlas offers what he knows ("prettiest in afternoon light," "good table only Tuesday" — from fit-rules + `local_signals` timing), proposes, then asks.
- **Feel-checks from a light density signal.** The engine can compute a day's "how packed" (count + pace/intensity fit-tags) to *prompt* Atlas's "starting to feel crowded? / does this flow?" — but it **never auto-rebalances**; it surfaces and asks, and reshapes only on the traveler's word.
- **Traveler-decided sequencing.** The itinerary is a canvas the traveler arranges; on any reshuffle only the **derived safety buffers recompute** — the traveler's chosen order stands. Atlas keeps the pen in their hand.
- **Guardrail (into Atlas's prompt):** never say "I'll set your itinerary at the best time and order" as if he decides it; never hand back a finished trip they didn't shape; never rush the feel-checks.

### Booking toolbox — Atlas closes on our surface (agent-era, David 2026-07)
The evolution from handoff → **close on our own surface**, built the SAFE way (path a): Atlas orchestrates discover→decide→book, **the provider/aggregator stays merchant of record and holds the card, we never touch card data** (see the payments canon). We **LOAD proven tools behind our own thin interface** — same swappable-seam rule as voice; never welded to one supplier or rail. Four lanes, in build-order:
- **Connectivity (inventory pipes).** **Duffel first** (flights — 300+ airlines under Duffel's credentials, no IATAN; **Duffel Payments = merchant of record**, so we never hold the card; sandbox free to wire now). **Sandbox account stood up (David, Jul 2026) — TEST mode only.** Two locked constraints: **(a) Duffel = Flights ONLY** — skip Duffel Stays and Cars; hotels come through the dedicated aggregators (Hotelbeds / RateHawk), so we never wire Duffel's hotel product by accident. **(b) Go-live is gated** on a signed Services Agreement + KYC + confirmed US-seller-of-travel terms (held until Duffel's sales call); until then everything is sandbox — no real money, no real tickets. Test token lives as a **Supabase secret** (never `VITE_`, never in the repo). Then **hotel aggregators** (Hotelbeds / TBO / Expedia for volume, consortia for the ultra crown — supplier/aggregator is MoR). Then the **villa ladder** (Exceptional Villas, Top Villas, Nocturne/WIMCO ultra, Luxury Experiences TCI — commission/advisor, no deposit). **CLIA cruise/dive/expedition** is bookable now (we hold CLIA).
- **Payment rails.** **Stripe via hosted checkout** (card goes to Stripe, never our servers → PCI SAQ A holds), PayPal next. Loaded, not married; prefer supplier-as-MoR (Duffel Payments / aggregator billing) so we stay off the seller-of-record hook. Live agent-payment protocols (ACP/UCP/AP2) come at funding.
  - **Sandbox account stood up (David, Jul 2026) — TEST mode only** (TravelWell.World LLC; live payments held until funded + business/bank verification). Set up as **"pick what you need," NOT Stripe's Managed Payments** (that 3.5%/txn add-on is Stripe-as-merchant-of-record — brutal on big travel tickets). Correct call to steer off the fee.
  - **The nuance to hold (this is the back door David named):** Stripe hosted checkout buys us **PCI SAQ A** (we never touch card data) — but that is **NOT** merchant-of-record protection. Stripe is a **processor, not a MoR shield.** The moment travel funds land in **our** Stripe balance as principal, **we become the seller/merchant of record** — bonding, chargebacks, refunds, fraud land on us — even though the card never hit our servers. Two separate protections; hosted checkout only buys the first.
  - **Canon-clean way to use Stripe (path a):** the **provider/DMC is the merchant of record** — either supplier-native rails (Duffel Payments for flights; aggregator billing for hotels) or **Stripe Connect with the provider/DMC as the connected account** taking the charge (direct charges), us as the **platform earning an application fee**. That keeps MoR with the provider *and* keeps us SAQ A, **with no 3.5%**. Stripe is also fine for **our own service/concierge/subscription fees**, where we genuinely *are* the seller. **Stripe-as-principal for travel inventory (funds to us) = becoming merchant of record = the deliberate, funded path-b decision** — never a default, never a drift.

### Booking architecture — the three paths + the scale requirement (David, Jul 2026; session to lock)
The frame *above* the toolbox. **Requirement: everyone books ON OUR SITE, at scale, automated** — not us
processing one booking at a time by hand. The **human-advisor host model (Fora-style) is out** — it can't
scale to what we're building (the deeper reason the Fora deal is off). We get started by **"dancing with the
music that's out there"**: use the best rails available today, sign up with everyone we can, grab the best
connections playing right now, and **refresh on the 30-day cadence** as newer/better ones come online. It's a
transition dream→reality — the parts won't all mesh on day one; we adjust tension on the drive belts as we go
(expected, not a problem).
- **Path 1 — lead with what genuinely automates now (the spine).** Duffel (flights), Viator/GetYourGuide
  (activities), Hotelbeds/bedbanks (hotels): instant-confirm, API, at scale, today. Most of every trip.
- **Path 2 — request-to-book for inventory with no instant API yet.** The traveler still books **on our
  site**; our system routes and confirms automatically or near-automatically. This is exactly the locked
  itinerary state machine — idea → placed → handed-off → **confirmed** — with the confirmation-return field
  **upgradeable email-parse → api**. The socket we've been pouring already anticipates async confirm.
- **Path 3 — aggregators as the bridge.** Bedbanks / channel aggregators already carry many non-API brands
  (even all-inclusives) via API — we reach those brands THROUGH the aggregator without a direct connection.

**THE open question to lock (David wants it turning over):** for non-API inventory, is **instant, millisecond
confirmation a HARD requirement** on our site — or is **"books on our site, confirmed within minutes/hours,
automatically"** acceptable? That single answer decides how much high-margin inventory launches vs defers.
*(Engineering lean, not final: minutes/hours-automated should be acceptable — the itinerary already models a
pending→confirmed state, and a hard millisecond bar would exclude most high-margin non-API inventory — as long
as the UX sets the expectation cleanly (a visible "confirming…" state, never a fake instant) and it never gates
the instant-confirm spine.)*

**Intel ask (standing).** Watch for any provider / brand / platform announcing they're going **API /
agent-ready / AI-agent-integrated** (publications, LinkedIn, industry news, wherever). When the industry
migrates to where we already are, we want to know FIRST and connect early — the human complement to the
self-updating changelog watcher.

**Why it matters — the real asset.** Not the booking plumbing — the **lifetime customer + their Atlas identity
profile.** They come back; each time, more of the industry has gone agent-ready, so more of their trip books
seamlessly. **Friction shrinks while the relationship deepens.** Build the plumbing swappable; bank the identity.

### Flight rail — Stage 1 live; frame the copy as a stage, not "never" (David, Jul 2026)
Duffel flight search is **live** — Atlas returns real airline fares on our own surface, behind our own
`searchFlights()` seam (Duffel swappable; Sabre drops in later, no rebuild). **Search-only by design for
the raise** — the whole value, de-risked, zero payment surface. But it's **Stage 1, not forever.**
- **On-screen copy is Stage-1 framed, never "forever."** Retire "TravelWell never touches your card" —
  it's true today but contradicts the Stage-2 story. Use **"for now, you book directly with the
  airline."** (The *architecture* is unchanged — Stage 1 is still provider-as-MoR / PCI SAQ A; only the
  *messaging* stops implying "never.")
- **The VC line (David's exact wording):** *"Duffel integrated: Atlas searches 300+ airlines and returns
  real airline fares on our own surface today. Search-only by design for now; the raise funds the flip to
  full live booking with payments through TravelWell — bonded, seller-of-travel, merchant-of-record."*
  ("Integrated," not "signed" — the Live Services Agreement is the piece we hold on purpose.)

### MoR staging — Stage 1 now, Stage 2 on purpose (David-locked, Jul 2026)
Merchant-of-record is **staged, not binary**. Both stages are deliberate; we never *drift* between them.
- **Stage 1 (now → funded/scaled):** provider-as-MoR, always. Our money never lands as principal — only commissions, application fees, subscriptions are ours. We can't carry seller-of-record liability (PCI scope + bonding + chargebacks) unfunded, so we don't. **Keep guarding this line.**
- **Stage 2 (the deliberate flip, post-funding):** to play in the **big-player lanes — Ultra Virtuoso + IATA — we DO become MoR.** That's the **TravelWell-Ultra dominance play**; MoR is what unlocks it. Rough gate: **~$2M gross travel sales (the Virtuoso threshold)** — flip when the numbers justify it, **bonded and ready, walked in on purpose**, never backed into.
- **Why stage the rail now:** the **Airwallex + Stripe treasury stack** (grabbed free now, scoped to *our* money) **doubles as the ready-made MoR rail** for Stage 2. Building the road before we drive it. **Build everything swappable toward the flip** (same seam rule) so Stage 2 is a deliberate config decision, not a rebuild — and never an accidental one.
- **Agent-readiness (forward pillar).** Expose our data so AI agents find + read us — MCP + a capability manifest + a structured feed. **This is the same structured-data work as the AEO/SEO fix** (`llms.txt`, JSON-LD already shipped), pointed at agents instead of search engines. Cheap; build alongside.
- **Credentials.** **TIDS first** (cheap, quick — needs the site live, which the deploy/DNS work unblocks), then **ASTA** (credibility), **CLIA** held; **IATAN** is the post-funding key.
- **Free-now vs funded-later.** Grab relationships now, no commitment: Duffel sandbox, a Stripe account, Viator/GetYourGuide affiliate, the TIDS application, villa advisor sign-ups (commission-only). Pay only once volume flows: paid hotel contracts, live checkout endpoints, IATAN, own-Amadeus. *(Stage the whole toolbox sitting ready; don't pay before we push volume.)*
- **Cadence:** the space moves weekly — a weekly pulse + a 30-day scan feed how we revise the live site (David runs the watch; it shapes build priorities).

### Atlas conversational layer — locked doctrine (build at the conversational/itinerary-engine phase)
Two locked docs: the **Atlas Opening** (dream-first intake → a structured *vision object*: SI primary/secondary, feel/archetype, region-pull, style→tier) and the **Content-Only Redirect Protocol** (L1/L2 book freely; L3 books only if it passes all three safety gates; L4 & L3-blocked are content-only — talk about it, no Book button).
- **Rides on what's built:** the persistent Atlas spine (holds the vision), the subject-based profile (the vision object seeds identity), and the dossier's `advisory_level` + `posture` (`booking_hold` = the content-only switch).
- **New data field:** a `feel` / `archetype` tag on destinations — the redirect matches on **SI + feel + region proximity** (never one axis alone; SI-only offers a bad cousin). We carry SI + region but not feel yet — add it to the destination record.
- **New build:** the conversational intake + vision-object schema; the layered-match ranking (rank by layers shared); the **two-tone** explanation branch (L4 brief/firm; L3-blocked reasoned + sourced).
- **Locked life-safety language** goes verbatim into Atlas's system prompt — speak "safety" plainly, keep travelers **informed**, and **never promise the outcome "safe."** Spec together with David when the engine is ready.

**Confirmed with David (locked):**
- **One profile with memberships** — capture the human once; every team they're on hangs off that one profile, by role.
- **Institutional data stays architecturally separable from consumer data — from day one.** We don't build the compliance machinery yet (minors, medical, accreditation, FERPA), but the profile is poured so the two never have to be pulled apart later.
- **The "next-task" operational layer is a separate product on the shared tank** — not welded into the consumer app. Kept apart at the seam even when they share the data.

### Atlas Guided-Flow WOW — voice choreographs the UI (build-toward; David spec v1, 2026-07-13)
The layer that makes "Atlas walks beside you" physically visible: Atlas's spoken/written guidance **choreographs the interface in real time** — he says "look down here," and the relevant element (e.g. the Stay-Well button) **pulses** with a warm breathing glow, directing the eye to the next move; the pulse stops the instant the traveler engages.
- **Principles (soul, not gimmick):** (1) Atlas points, the traveler always chooses — the pulse invites, never auto-clicks (consistent with payments-never + offer-don't-push); (2) one pulse at a time (a guide, not a slot machine); (3) warm/breathing, never a flashing nag; (4) it answers to Atlas's *words*, not a timer — the voice↔visual sync **is** the magic; (5) it gets out of the way once its job is done; (6) accessible by default — respects `prefers-reduced-motion`, and Atlas's spoken direction carries the same cue for anyone who can't see the motion (WCAG AA standing canon).
- **Engineering read (Sana):** this is a **new seam**, not a flip. Atlas today returns prose only (`atlas` Edge Function → text; `useAtlas`/Concierge render it). Choreography needs Atlas to emit a small **structured UI directive** (e.g. `{focus:"stay"}`) alongside its words, plus a shell handler that pulses the target in sync + an aria-live accessible equivalent. Modest but real engineering.
- **Build-state: ARCHITECTED, not built. Two paths:** (a) **full living engine** — Atlas dynamically drives any element from real guidance (the true product; competes with the rendering blocker — not forced live in the window); (b) **demo-hero flow** — ONE scripted choreographed path (onboarding → "look down here" → Stay-Well pulses → opens → Atlas continues inside), achievable as a contained hero-path **without stealing hours from rendering** (different surface). If greenlit it's the VC showstopper; if not, show it as architected depth. **Rendering stays priority #1; hero-path only on explicit go.**

### Winter/Ski SI — launch readiness (from the audit, filed 2026-07-13)
- **Alps = ingest-then-flip, not a pure flip.** ~20 alpine dossiers (Switzerland/Austria/Bavaria) are built, SI-tagged, and carry servable jewels — **but in the research library (`Travelman73/tww-research-library`), NOT the MVP.** In the MVP the `ski` SI is still `preview` (named "Ski & Snow") with zero ski destinations. Launching Alps Winter/Ski therefore needs: (a) ingest the alpine dossiers into the MVP catalog, then (b) flip the SI live — same two-doors shape as SEO. The audit's "BUILT-IN-REPO" means the research repo, not the live platform.
- **Answers to the audit's 5 asks:** (1) flip = the `status` field (preview→live) on SI/region/destination, seeded DB (0002/0003) + bundle; recommended trigger = ≥2 verified dossiers + ≥1 working affiliate handoff per core Well. (2) supplier-ingest = provider CSV (`src/data/providers/*.csv`, `mode` = affiliate/widget/api + `booking_url`) → regenerate 0004. (3) slug: the MVP reads SI by slug `ski`; the "Ski & Snow"→"Winter/Ski" normalize on the 3 Nordic dossiers is a **research-library** task (outside MVP GitHub scope); the MVP SI *display name* is still "Ski & Snow" — a one-line rename on David's confirm. (4) **affiliate-only lanes are enough to flip the Alps**; Ski.com embedded + Club Med host-portal are upgrades, not gates. (5) fast-follow order: **Alps → Japan (highest inbound) → Rockies** (both greenfield dossier builds).
- **Part B (Winter-Olympics / CCSTT team-travel): ARCHITECTED, not live** — the VC depth story (12-engine OS, 14 revenue highways, the Mixed Winter Team scenario), riding the same one-Atlas / one-data-tank foundation. Present as "designed and spec-locked, not running" — never as a live product.

### Trip-architect & living-itinerary data (fold into the data-model phase)
From the Atlas Trip-Architect / Living-Itinerary doc. These are what make Atlas a *companion*, not a catalog — and they must be in the schema from day one, or Atlas can only recommend, never architect or accompany.
- **Fit-rules on every experience** — `duration` (door-to-door), `before` (arrival buffer / acclimatization / prerequisite), `after` (e.g. no-fly-after-diving, recovery), `pairs_with`, `pace/intensity`, `time-of-day`, `season`. Author as a **small canonical vocabulary** (tags Atlas can reason over), not prose. **Inherit by experience type** — e.g. "no-fly-after-diving" authored once for diving, overridable per instance; cleaner for Atlas and less to research.
- **Itinerary = first-class dated object** — an ordered set of placed experiences across dated days; **every day carries day-number + weekday + date** (people anchor to the weekday). Viewable (≈ quarter-screen, read alongside Atlas), Atlas-held (read / update / surface any day), with proactive "tomorrow" surfacing on an afternoon/evening trigger.
- **Separate placed from booked** — a placement lives in the trip before booking; booking is a state (idea → placed → handed-off → confirmed), the confirmation returning from the provider. Arrival buffers / recovery mornings are **derived** from fit-rules, so re-sequencing recomputes them rather than stranding them.
- **Trips are plural** — one traveler owns many trips across the lifetime loop; design the itinerary per-trip, and ready for later role-scoped participants (the team socket).
- **The layered page needs almost no new data** — the dossier already carries the calm surface (hook, ~5 facts, safety card, the "know more" gate) and the depth (jewels = curated Layer 1, trails = booking lanes; "our best first" = order by curation tier). It's a reveal-on-demand UI over data we've already shaped.
- **Destination key convention (locked):** `<city>-<country>`, **full country name spelled out, lowercase, hyphenated** — e.g. `cape-town-south-africa` (never `cape-town`, `-za`, or `-SA`; `mexico`, never `mx`). Collision-proof at global scale (many Valladolids, San Josés, Córdobas). The key comes verbatim from each conformed dossier as the library lands — don't derive from memory (edge cases like "St. Lucia / St. Lucia" or "Patagonia / Chile-Argentina" need the dossier's canonical, not a naive slug). Cape Town is renamed to `cape-town-south-africa` as the locked template anchor; the rest adopt the key as their dossiers conform.

---

## Recommended starting points
- **SEO rendering** — highest-risk blocker for the whole traffic thesis; universally underestimated. **De-risked by a spike (Jul 2026):** a server-render of a real content page (`/region/06A`) produced ~6.8 KB of crawlable HTML with the region, destinations, and blurb in the markup, and per-page `<head>` (title/meta/canonical/hreflang/`TouristDestination` JSON-LD) generates cleanly from the dossier `seo` fields. The app is **SSR-safe** (guarded `localStorage`, `useUnsplashImage` fallback, synchronous bundle catalog — no crashes in Node). SSG is the confirmed approach, and the tool is decided: **`vite-react-ssg`** — a contained spike (Jul 2026) ran `vite-react-ssg build` over the real app and produced crawlable static HTML for **every route** (all 13 regions + 38 destinations via `getStaticPaths`, plus home/legal/SI pages), content in the markup, client hydration intact, zero SSR crashes. **No Vike fallback needed.** Host stays **Vercel** (Cloudflare move dropped — a separate cost conversation, not coupled to the render fix). Remaining full-socket work: routes-as-data + `getStaticPaths` wired into the real entry, **per-page `<head>` from the dossier `seo` fields** (proven separately), the **content-change → rebuild** trigger (below), and switching the production build command over.

**The rebuild trigger — tie it to the real content flow.** New dossiers land in the research library (`Travelman73/tww-research-library`) and a monthly sweep adds more. The flow to wire: **content lands → ingested into the MVP DB (Supabase) → a Vercel Deploy Hook fires → SSG rebuilds → new pages go crawlable**, with no manual step. Both sources — a fresh dossier *and* the monthly sweep — call the same deploy hook, so David never has to think about it: content lands, the site rebuilds, the bots see the new pages. (Later, when cache-back writes atlas-sourced pages, they ride the same hook.)

**Why rendering is the highest-leverage socket — the stockpile.** ~**370 destination dossiers are already built** in the research library — organic runway already paid for by the deep-build work, that can't earn until the pages are live. The day SSG ships and the corpus is ingested, **all 370 go crawlable and start their Google indexing/ranking clocks at once** — banking runway, not creating it. So rendering-early isn't just "look legit for reviewers"; it's what gives every page the weeks-to-months of runway to be ranking *by the time its demand wave stirs* (the organic clock starts before the paid fire_date). The first rebuild prerenders the full corpus — SSG handles the scale easily (the spike built ~50 pages in seconds; 370 is still a fast static build).
- **Destination data model** — every other piece (dossiers, cache-back, sweep, World-Engine) hangs off it.
- **i18n** — consciously scheduled *last* before full launch, resourced as its own workstream; prove the engine in English first.
