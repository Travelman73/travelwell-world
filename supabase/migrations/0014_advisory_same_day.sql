-- TravelWell.World — both directions, same day (David, 2026-08-11).
--
-- The checker originally split escalations from de-escalations: an escalation
-- interrupted someone, a de-escalation waited for the fortnightly publish. That
-- was wrong, and David's example is why: Uganda dropping from Level 4 to Level 3
-- turns four gorilla-trekking destinations from never-bookable into bookable.
-- Holding that for two weeks isn't caution — it's being wrong in the direction
-- that merely sounds careful.
--
-- So any level move, either direction, is same-day. The severity LABEL stays,
-- because knowing which way a thing moved is useful; it just no longer gates the
-- timing.
--
-- The judgement is stored on the row rather than re-derived at read time, so the
-- audit trail records what we decided AT DETECTION, not what today's code would
-- decide. That's the same discipline as freezing on failure.
--
-- Apply: paste into the Supabase SQL editor (or supabase db push). Requires 0013.

alter table public.advisory_changes
  add column if not exists same_day boolean not null default true;

-- Existing rows predate the column. They were all `new` (the first FCDO sweep),
-- which is same-day under the new rule, so the default is already correct — but
-- be explicit rather than relying on it.
update public.advisory_changes set same_day = true where same_day is null;

create index if not exists advisory_changes_same_day
  on public.advisory_changes (same_day, status, detected_at desc);

comment on column public.advisory_changes.same_day is
  'Needs a human today. Any level move (either direction), first appearance or withdrawal. Also true for a text-only change on a source with no numeric level (the FCDO), where the text IS the signal.';
