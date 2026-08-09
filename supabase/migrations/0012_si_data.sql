-- TravelWell.World — rich dossier body for Special Interests.
--
-- The `special_interests` table was thin (id, name, signature, status, accent,
-- is_lux, grp), so a full SI dossier — market sizing, spend tiers, commission
-- map, flagship operators, seasonality, the Q&A block — had nowhere to live.
-- This gives SIs the same shape destinations already have: one `data` jsonb.
--
-- Deliberately NOT adding a `category` column: `grp` already IS the category
-- (it's free text, no CHECK constraint), so a second field would just be two
-- names for one thing and would drift. New group values like
-- 'journeys-of-a-lifetime' need no migration — only an entry in SI_GROUPS in
-- src/data/taxonomy.ts so the UI knows how to render and order it.
--
-- Apply:  paste into the Supabase SQL editor (or supabase db push).
-- Idempotent. Schema-only — no data reseed needed.

alter table public.special_interests add column if not exists data jsonb;
