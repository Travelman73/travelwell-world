-- TravelWell.World — the safety verification cycle (David's spec, 2026-08-10).
--
-- ONE checker, running DAILY, with two outputs — not a fortnightly sweep with a
-- bolt-on urgent path. Splitting them doubles the failure surface, and the half
-- that fails is the half you need. So: check every day, escalate the moment
-- something moves, and publish on the 1st and the 15th. "The 1st and the 15th
-- become what we publish, not what we check."
--
-- Three tables, one job each:
--   advisory_state    what we currently believe, per country per source
--   advisory_changes  the human-confirm queue — nothing auto-publishes
--   advisory_runs     the audit trail: what did we know, and when did we know it
--
-- TWO RULES BUILT IN (David's, non-negotiable):
--   FREEZE ON FAILURE. A fetch that fails must never blank or downgrade what we
--   hold. `advisory_state` is only ever written on a SUCCESSFUL read; a failure
--   writes a row to advisory_runs and leaves the last known good value standing,
--   with its original fetched_at so the staleness is visible rather than hidden.
--   THE AUDIT TRAIL. Every run and every detected change is recorded, including
--   the runs where nothing happened. "What did we know and when" has to be
--   answerable months later, and the question will be asked at the worst moment.
--
-- Apply: paste into the Supabase SQL editor (or supabase db push).

-- ── What we currently believe ──────────────────────────────────────────────
create table if not exists public.advisory_state (
  country_iso  text not null,                    -- ISO 3166-1 alpha-2
  source       text not null,                    -- 'state' | 'fcdo' | 'cdc'
  level        smallint,                         -- 1..4 where the source has levels; null where it doesn't
  level_label  text,                             -- the source's own words for the level
  headline     text,                             -- the source's summary line, verbatim
  -- The source's OWN last-updated date, not ours. A source that hasn't moved in
  -- eight months is a fact about the advisory, not about our freshness.
  source_updated_at timestamptz,
  -- When WE last successfully read it. Only ever advances on success (freeze rule).
  fetched_at   timestamptz not null default now(),
  -- Hash of the payload we parsed, so a text-only edit is detectable without
  -- storing the whole document.
  raw_hash     text,
  confidence   text not null default 'verified'  -- 'verified' | 'estimate'
    check (confidence in ('verified', 'estimate')),
  primary key (country_iso, source)
);

-- ── The change queue — nothing publishes itself ────────────────────────────
create table if not exists public.advisory_changes (
  id           bigserial primary key,
  country_iso  text not null,
  source       text not null,
  from_level   smallint,
  to_level     smallint,
  from_label   text,
  to_label     text,
  -- 'escalation' is the one that pages someone. A de-escalation still matters
  -- (Oman went ordered → authorized departure on 2026-06-27 and stayed Level 3 —
  -- a materially different situation that no content refresh would catch).
  severity     text not null
    check (severity in ('escalation', 'de-escalation', 'new', 'text', 'withdrawn')),
  detected_at  timestamptz not null default now(),
  status       text not null default 'pending'
    check (status in ('pending', 'confirmed', 'dismissed')),
  confirmed_by text,
  confirmed_at timestamptz,
  note         text
);
create index if not exists advisory_changes_pending
  on public.advisory_changes (status, detected_at desc);

-- ── The audit trail — including the quiet runs ─────────────────────────────
create table if not exists public.advisory_runs (
  id           bigserial primary key,
  started_at   timestamptz not null default now(),
  finished_at  timestamptz,
  checked      integer not null default 0,       -- lookups attempted
  ok           integer not null default 0,       -- succeeded
  failed       integer not null default 0,       -- failed → those countries stayed frozen
  changed      integer not null default 0,       -- queued for confirmation
  -- Per-source failure detail, so "State blocked us for three days" is visible
  -- rather than inferred from a gap.
  notes        jsonb
);
create index if not exists advisory_runs_recent on public.advisory_runs (started_at desc);

-- ── RLS ────────────────────────────────────────────────────────────────────
alter table public.advisory_state   enable row level security;
alter table public.advisory_changes enable row level security;
alter table public.advisory_runs    enable row level security;

-- advisory_state is READ-ONLY PUBLIC: the site shows the level and the date we
-- verified it, so the browser needs it. Writes are service-role only (the Edge
-- Function), which bypasses RLS — so there is no write policy here on purpose.
do $$
begin
  create policy "read advisory_state" on public.advisory_state for select using (true);
exception when duplicate_object then null;
end $$;

-- The queue and the run log are internal. RLS on with NO policies = the browser
-- sees nothing; only the service role reaches them.

comment on table public.advisory_state is
  'Current known advisory per country per source. Written only on a successful fetch — a failed run leaves the previous row untouched (freeze on failure).';
comment on table public.advisory_changes is
  'Detected changes awaiting human confirmation. Nothing here publishes itself.';
comment on table public.advisory_runs is
  'Every run of the daily checker, including runs where nothing changed.';
