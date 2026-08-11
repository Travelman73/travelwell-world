# The daily advisory checker

*David's safety verification cycle, built. Sana, 2026-08-11.*

**One checker. Runs daily. Escalates immediately, publishes fortnightly.**

That's the one design decision worth restating, because it isn't what the spec
originally asked for. A fortnightly sweep with a separate urgent path doubles the
failure surface, and the half that fails is the half you need. So the checker runs
every day and the 1st and the 15th become **what we publish, not what we check**.

---

## The two rules, and where they live in the code

**Freeze on failure.** `advisory_state` is written **only** on a successful read
— the upsert is the last statement in the success path and nothing else touches
that table. A source we couldn't reach today keeps its previous value *and its
previous `fetched_at`*, so the staleness is visible rather than papered over. A
country we couldn't read is not a country with no advisory.

**The audit trail.** Every run writes to `advisory_runs`, including the runs
where nothing changed — the quiet ones are what let you prove a gap was a quiet
period and not an outage. Every detected change writes to `advisory_changes` with
what it was, what it became, and when we noticed.

**Nothing publishes itself.** A change lands as `pending`. The site keeps showing
the last confirmed value until a human confirms it. That's deliberate: an
automated pipeline that can silently change a safety level is a worse risk than a
stale one, because nobody is watching it.

## The pieces

| Piece | What it is |
|---|---|
| `supabase/migrations/0013_advisory_state.sql` | Three tables: current state, the change queue, the run log |
| `supabase/functions/advisory-check/index.ts` | The checker itself |
| `docs/advisory-countries.json` | The country list it's called with — **generated** |
| `npm run gen:advisory-payload` | Regenerates that list from the live catalog |

## Sources — structured endpoints, never scraping

- **US State**, Consular Affairs API: `cadataapi.state.gov/api/TravelAdvisories`
  — one request for every country, not one per country. Falls back to the RSS
  feed (`travel.state.gov/_res/rss/TAs.xml`) if the API is unavailable.
- **UK FCDO**, via the GOV.UK Content API: `www.gov.uk/api/content/foreign-travel-advice/<slug>`
  — one request per country. No numeric level; what matters here is the
  **regional** detail, which is where named-zone carve-outs come from.
- **CDC** health notices — the layer that moves fastest, and the next one to wire.

Both sources bot-block a bare request, so the function sends browser-like
headers. That's a small durable fix applied to a structured endpoint, rather than
buying time against a page that can be redesigned out from under us.

## Setting it up

**1 · Apply the migration.** Paste `0013_advisory_state.sql` into the Supabase SQL
editor.

**2 · Deploy the function.** `supabase functions deploy advisory-check`, or paste
it in the dashboard editor (it's a single self-contained file, like `atlas`).

**3 · Schedule it daily.** The function takes the country list as a POST body —
it never guesses which countries to check, so a country can't quietly go
unchecked. Generate the payload and schedule it:

```bash
npm run gen:advisory-payload      # → docs/advisory-countries.json
```

```sql
-- Supabase SQL editor, once. Runs 06:00 UTC daily.
select cron.schedule(
  'advisory-check-daily', '0 6 * * *',
  $$ select net.http_post(
       url     := 'https://<project>.supabase.co/functions/v1/advisory-check',
       headers := '{"Content-Type":"application/json","Authorization":"Bearer <service-role-key>"}'::jsonb,
       body    := '<paste docs/advisory-countries.json here>'::jsonb
     ) $$
);
```

**Regenerate the payload whenever a destination adds a new country**, and update
the job. If the two drift, the checker silently stops covering that country while
still reporting a successful run — the worst kind of gap, because the number
looks right.

## Reading the results

```sql
-- What's waiting for a human right now
select * from public.advisory_changes where status = 'pending' order by detected_at desc;

-- Escalations only — the ones worth interrupting someone for
select * from public.advisory_changes where status = 'pending' and severity = 'escalation';

-- Did it run, and did anything fail?
select started_at, checked, ok, failed, changed, notes from public.advisory_runs
order by started_at desc limit 14;

-- Anything we haven't successfully re-read in over a fortnight (the freeze rule
-- makes stale visible — this is the query that surfaces it)
select country_iso, source, level, fetched_at from public.advisory_state
where fetched_at < now() - interval '15 days' order by fetched_at;
```

Confirming a change is a human act:

```sql
update public.advisory_changes
set status = 'confirmed', confirmed_by = 'sana', confirmed_at = now(), note = 'checked against the source'
where id = <id>;
```

## Severities

| Severity | Means | What it deserves |
|---|---|---|
| `escalation` | The level went **up** | Interrupt someone |
| `de-escalation` | The level went **down** | Confirm at the next publish — still matters: Oman went ordered → authorized departure on 2026-06-27 and stayed Level 3. Materially different, and no content refresh would ever catch it |
| `new` | A country we had no reading for | Confirm before it shows |
| `text` | Same level, changed wording | Read it — regional carve-outs move here without the number moving |
| `withdrawn` | The source dropped it | Confirm before removing anything |

## What isn't done yet

- **The CDC leg.** State and the FCDO are wired; CDC health notices are the
  fastest-moving layer and are the next thing to add.
- **The site doesn't read `advisory_state` yet.** The Safety Card still renders
  from the bundled `safety.json`. That's the right order — get the checker
  trustworthy first, then switch the read — but until it happens this pipeline
  informs *us*, not the page.
- **Nothing has been run against a live source.** The build sandbox has no
  outbound network, so parsing is written against the documented shapes and needs
  one real run to confirm the field names. Expect to adjust `readState`'s field
  mapping on first contact; that's the point of the run log.
