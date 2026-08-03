-- TravelWell.World — the Safer-Informed capabilities overlay (Identity Builder Step 2).
--
-- David-locked: onboarding asks BOTH sides — what you're fully able to do AND
-- anything to plan around — and every fact builds the trip AROUND the traveler,
-- never hands them limitations. A stated factor overrides the age default and is
-- the socket the L3 safety gates read. Structured so Atlas (and, later, the gate
-- engine) can reason over it rather than parse free text.
--
--   activity_level — pace: very-active | moderately-active | lightly-active | leisurely
--   access_needs   — multi: wheelchair | cane | frequent-rest | no-stairs | some-stairs | fully-mobile
--   capabilities   — free text, the ENABLING side ("what you're fully up for")
--   (accessibility — existing free text, repurposed as the "anything to know" side)
--
-- Apply:  paste into the Supabase SQL editor (or supabase db push).
-- Idempotent. Schema-only — no data reseed needed.

alter table public.travel_ids add column if not exists activity_level text;
alter table public.travel_ids add column if not exists access_needs   text[] not null default '{}';
alter table public.travel_ids add column if not exists capabilities   text;
