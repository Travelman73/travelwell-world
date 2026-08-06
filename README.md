# TravelWell.World

> A premium, editorial **Travel Operating System** — it routes a traveler from a *feeling* (Special Interest) → a *place* (Region) → *what excites them* (Activities) → *their needs* (the 10 Wells) → a *booked trip* (Itinerary + Book It), monetized through disclosed partners.

This is the production implementation of the high-fidelity design handoff, built on the team's stack:

**React + TypeScript + Vite · Tailwind CSS · Supabase (Postgres + Edge Functions) · Claude API**

The settled design system (`HANDOFF.md`) is recreated faithfully — colors, type, spacing, radii, shadows, component states, and copy. Imagery is placeholder (Unsplash); investor economics are illustrative placeholders and must be replaced with audited figures before real use.

## Quick start

```bash
npm install
cp .env.example .env.local   # fill in Supabase URL + anon key (optional for design preview)
npm run dev                  # http://localhost:5173
npm run build                # type-check + production build
npm run preview              # serve the build
```

The app runs without Supabase configured — data falls back to the in-repo design taxonomy and Atlas shows a graceful "design-preview" message. Wire Supabase + the Atlas Edge Function for live data and concierge.

## Architecture

```
src/
  data/        taxonomy.ts (25 SIs · 10+2 Wells · 13 Regions · locales · affinity)
               places.ts   (region detail · destinations · providers · guides · activities)
  lib/         icons.tsx (inline SVG set) · images.ts (Unsplash resolver)
               supabase.ts (client + askAtlas) · utils.ts
  store/       useStore.ts — Zustand: journey, trip, locale/RTL, global panels,
               persisted to the prototype's tww:* localStorage keys
  components/
    ui/        Button · Pill · StatusPill · SafetyChip · Ftc · IconChip · Card ·
               Eyebrow · StepIndicator/JourneyBar · SiPickBar
    shell/     Shell (layout) · Header · MegaMenu · Footer · Concierge (Atlas) ·
               TripTray · Emergency · Ambient (toast/whisper/backdrop) · Logo
  pages/       Home · SpecialInterests · SiDetail · Regions · RegionDetail ·
               Activities · WellsSurface · Wells · Providers · Destinations ·
               DestinationDetail · Itinerary · Luxury · Guides · GuideDetail ·
               FirstAidKit · Demo · SignUp · Profile · Plan · About · Sitemap · Go
  styles/      tokens.css (the design system, single source of truth) +
               shell/journey/wells/itinerary/checkout/onboarding/profile/
               luxury/investor/pages — ported verbatim from the handoff
supabase/
  migrations/0001_init.sql   Travel ID, journeys, trip blocks, provider catalog, RLS
  functions/atlas/index.ts   Claude-backed "Atlas" concierge (keeps the key server-side)
```

Styling approach: the settled high-fidelity CSS from the handoff is the styling
foundation (imported globally), and React components emit those class names plus
Tailwind utilities for layout. Tailwind's theme is bound to the CSS token
variables in `tailwind.config.ts`, so there is one source of truth.

## The Trust Language (enforced everywhere)

- **Live vs Preview** — real content gets a teal "Live" pill; placeholder/schema gets a stone "Preview" pill + desaturated media.
- **Activated at Launch** — Insure-Well & Ship-Well appear but are clearly un-actionable.
- **FTC disclosure** sits adjacent to every monetized/affiliate CTA — never hidden (`<Ftc>`).
- **Nanny-Well & Security-Well** appear only in Luxury/Ultra contexts.
- **Safety Card** — level 1–4, always color **+ number + label** (`<SafetyChip>`).
- **Atlas** (the concierge) suggests and shapes but **never books**, and never fabricates a price, provider, or safety fact. The "powered by Claude" credit stays visible.
- Empty / loading / error / RTL states, WCAG AA contrast, visible focus, keyboard paths.

## Atlas — the Claude concierge

`supabase/functions/atlas/index.ts` is a Deno Edge Function calling the Claude
Messages API (`claude-opus-4-8`, adaptive thinking) with a system prompt that
encodes Atlas's persona and the trust rules. The browser calls it via
`supabase.functions.invoke("atlas")` (see `src/lib/supabase.ts`), so the
Anthropic key never reaches the client.

### CLI setup (once per machine)

```bash
supabase login          # opens a browser to authorize
supabase link --project-ref xgjidkgctqqdprxtxeui   # ref lives in supabase/config.toml
```
If the browser flow won't work in your terminal (SSH / remote / Codespaces),
create a token at <https://supabase.com/dashboard/account/tokens> and use
`supabase login --token sbp_...` instead.

### Deploy

```bash
supabase functions deploy atlas
supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
supabase db push   # apply migrations
```

Per-function secrets are listed in each function's header comment
(`supabase/functions/*/index.ts`) — e.g. `livekit-token` needs
`LIVEKIT_API_KEY` / `LIVEKIT_API_SECRET` / `LIVEKIT_URL`.

## Supabase data model

`travel_ids` (Travel Personality — age *range*, never a birthday), `journeys`,
`trip_blocks`, plus a world-readable `special_interests` / `wells` / `regions` /
`providers` catalog. Row-Level Security scopes traveler data to the
authenticated user; the taxonomy/provider catalog is public-readable. Auth is
designed for magic-link / OTP (no passwords).

## Production checklist

- [ ] Swap placeholder Unsplash imagery for licensed photography (`src/lib/images.ts`).
- [ ] Replace illustrative investor economics with audited figures (`src/pages/Demo.tsx`).
- [ ] Seed the Supabase catalog tables from `src/data/*` (or move reads to Supabase).
- [ ] Wire Supabase Auth (magic link) into Sign Up / Sign In / Verify / Activation.
- [ ] Remove the demo state-switcher aids before launch.
- [ ] Add real safety data sources behind the Safety Card and Emergency overlay.

See `HANDOFF.md` for the original design brief and `public/screenshots/` for the visual references.
