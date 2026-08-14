# The daily advisory checker

*David's safety verification cycle, built. Sana, 2026-08-11.*

**One checker. Runs daily. Surfaces any move — in either direction — the same
day, and publishes fortnightly.**

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
| `supabase/migrations/0014_advisory_same_day.sql` | Adds `same_day` — both directions surface together |
| `supabase/migrations/0015_advisory_schedule.sql` | The daily 06:00 UTC job — **generated**, don't hand-edit |
| `supabase/functions/advisory-check/index.ts` | The checker itself |
| `docs/advisory-countries.json` | The country list it's called with — **generated** |
| `npm run gen:advisory-payload` | Regenerates that list *and* 0015, from the live catalog, in one command |

## Sources — structured endpoints, never scraping

**The FCDO is PRIMARY (David, 2026-08-13).** It is the source we can actually
read — 36 of 36 countries, no failures, every run since the checker went live —
and it carries the regional carve-outs that no other source publishes.

**Primary does not mean it supplies levels, and this is the part not to gloss.**
The FCDO publishes no numeric level at all. Our L1–L4 values remain the curated
baseline in `safety.json`, sourced from State. So while State is unreachable the
checker detects **change** but cannot detect a **level move** from the source
that numbers them. That is a real gap. It is why State access is worth chasing,
and it should not be softened into "we have it covered."

- **UK FCDO — primary**, via the GOV.UK Content API:
  `www.gov.uk/api/content/foreign-travel-advice/<slug>` — one request per
  country. No numeric level; the **regional** detail is the signal.
- **US State — enrichment**, Consular Affairs API:
  `cadataapi.state.gov/api/TravelAdvisories` — one request for every country.
  Still tried every run, so the day access is granted it starts working with no
  deploy. Falls back to the RSS feed (`travel.state.gov/_res/rss/TAs.xml`).
- **CDC** health notices — the layer that moves fastest, and the next one to wire.

**A blocked source is `degraded`, not 36 failures.** State's outage used to add
`countries.length` to `failed`, so a healthy run read like a catastrophic one —
which teaches everyone to ignore the number, and then the real failure goes
unnoticed too. Unreadable sources are now named in `notes.degraded` and in the
response body. "36 failures" and "one source is down" look identical in a count
and mean completely different things.

Both sources bot-block a bare request, so the function sends browser-like
headers. That's a small durable fix applied to a structured endpoint, rather than
buying time against a page that can be redesigned out from under us.

## Setting it up

**1 · Apply the migrations.** Paste `0013_advisory_state.sql`, then
`0014_advisory_same_day.sql`, into the Supabase SQL editor.

**2 · Deploy the function.** `supabase functions deploy advisory-check`, or paste
it in the dashboard editor (it's a single self-contained file, like `atlas`).
Note it's an **Edge Function**, not SQL — the code editor under Edge Functions →
advisory-check, never the SQL editor.

**3 · Enable `pg_cron` and `pg_net`.** Dashboard → Database → Extensions. Both,
once. (Migration 0015 checks for them and refuses to schedule anything without
them, rather than leaving a job that can't run.)

**4 · Put the service-role key in Vault.** `cron.schedule` stores its command as
plain text in `cron.job`, readable by anyone with database access — so a key
pasted into a job is a key sitting in a table forever, and it would be in the git
repo besides. Vault holds it encrypted and the job asks for it at run time. One
statement, in the SQL editor, and the key goes nowhere else — not into a file,
not into an email, not into a chat:

```sql
select vault.create_secret('<service-role-key>', 'advisory_check_key',
                           'Service-role key used by the daily advisory checker');
```

The name must be exactly `advisory_check_key` — that's what the job looks up.

**5 · Apply `0015_advisory_schedule.sql`.** Paste it into the SQL editor. That
schedules the job at **06:00 UTC daily** with the country list already inlined.

06:00 UTC is deliberate: the FCDO publishes on London business hours, so an
early-UTC run reads yesterday's settled state rather than catching a page
mid-edit, and anything it queues is waiting when someone opens the laptop.

**0015 is generated, not hand-written** — `npm run gen:advisory-payload` writes
`docs/advisory-countries.json` *and* the migration in one command. That is the
whole point: the payload the job actually sends and the payload in the repo have
to be the same bytes. **Regenerate whenever a destination adds a country, then
re-apply 0015** — it unschedules the old job before scheduling the new one, so
re-applying is the correct and only step. If the list and the job drift, the
checker silently stops covering that country while still reporting a successful
run — the worst shape a failure can take, because the number at the end still
looks right.

`timeout_milliseconds` is set to 120s in the job, and it's worth knowing why even
though it can't break a run. `net.http_post` is asynchronous — it hands back a
request id immediately and the cron job reports success either way, so a timeout
doesn't stop the checker; the function keeps running server-side and still writes
its tables. What pg_net's 5-second default costs you is the **response**:
`net._http_response` records a timeout instead of the run summary, and the first
place you'd look after a bad morning shows an error that didn't happen.

**6 · Prove it's actually scheduled.** A cron job that was never registered looks
identical to a quiet week, and `advisory_runs` can't tell you the difference —
it only records runs that happened.

```sql
-- The job exists and is active
select jobid, schedule, active from cron.job where jobname = 'advisory-check-daily';

-- It fired, and pg_net didn't fail before the function was reached
select status, return_message, start_time from cron.job_run_details
where jobid = (select jobid from cron.job where jobname = 'advisory-check-daily')
order by start_time desc limit 5;
```

`status = 'succeeded'` here means *the HTTP call was dispatched*, not that the
checker read anything — that answer is in `advisory_runs`, and the two are worth
reading together the first morning after scheduling.

Rather than wait until 06:00 to find out, fire the job's own command once by
hand. It reads `cron.job` rather than repeating the SQL, so what runs now is the
same bytes as what runs tomorrow — a hand-typed "test" that differs from the real
job proves the wrong thing:

```sql
do $$
declare cmd text;
begin
  select command into cmd from cron.job where jobname = 'advisory-check-daily';
  if cmd is null then raise exception 'No job named advisory-check-daily — 0015 was not applied.'; end if;
  execute cmd;
end $$;
```

Then read `advisory_runs` — a new row with `checked = 36` means the loop closed.

**If the response is a 400**, the request reached the function (the gateway let it
through and our own code answered) but the country list didn't arrive with it.
The 400 body carries a `diagnostic` block naming which of the three ways it went
wrong — no body at all, a body that wasn't JSON, or valid JSON without a
`countries` key — because at 06:00 those read identically and each has a
different fix. Two things to check first:

```sql
-- Is the stored job command intact, and does it still carry the payload?
select length(command) as chars, position('countries' in command) as has_payload
from cron.job where jobname = 'advisory-check-daily';

-- Does a minimal body get through? Isolates the mechanism from the payload.
select net.http_post(
  url     := 'https://xgjidkgctqqdprxtxeui.supabase.co/functions/v1/advisory-check',
  headers := jsonb_build_object('Content-Type', 'application/json',
               'Authorization', 'Bearer ' || (select decrypted_secret
                 from vault.decrypted_secrets where name = 'advisory_check_key')),
  body    := '{"countries":[{"iso":"KE","name":"Kenya","match":["kenya"],"fcdo_slug":"kenya"}]}'::jsonb,
  timeout_milliseconds := 60000);
```

A 400 rejection deliberately writes **no** `advisory_runs` row. A rejected call
never checked anything, and a row reading `checked: 0` is indistinguishable from
a real run that found nothing — the exact ambiguity the audit trail exists to
remove.

### The one that cost us an afternoon: a newline in the Vault secret

The first scheduled run came back 400, and the diagnostic showed the function had
received this as its **body**:

```
User-Agent: pg_net/0.20.3\r\nContent-Length: 89\r\n\r\n{"countries": [...
```

Two of pg_net's own headers, inside the body. That has exactly one cause: the
HTTP header section was terminated early, so everything written after it became
payload. The terminator is a blank line — and a key copied with a trailing line
break produces one. The header value ends in a newline, pg_net appends its own
CRLF, and those two form the empty line that ends the headers. Every header
pg_net writes next, and then the JSON, land in the body.

**Nothing about the symptom points at the key.** It reads as a malformed payload,
so you go looking at the payload, the dollar-quoting, the size of the job command
— all of which are fine.

The fix is in the job permanently: the Authorization value is built with
`trim(both E' \t\r\n' from decrypted_secret)`, and 0015's guard now refuses to
schedule if the stored secret has whitespace *inside* it (which is a corrupted
paste, not a key). To check a stored secret without printing it:

```sql
select name,
       length(decrypted_secret)                                as len,
       length(trim(both E' \t\r\n' from decrypted_secret))     as trimmed_len,
       decrypted_secret ~ '\s'                                 as has_whitespace
from vault.decrypted_secrets where name = 'advisory_check_key';
```

`len` above `trimmed_len` is the newline. To clean it in place, still without
printing it:

```sql
select vault.update_secret(
  (select id from vault.secrets where name = 'advisory_check_key'),
  (select trim(both E' \t\r\n' from decrypted_secret)
   from vault.decrypted_secrets where name = 'advisory_check_key'));
```

**The general lesson, worth carrying to any other job we schedule this way:** a
secret read from storage and concatenated into a header is an injection point for
whatever whitespace came along with it. Trim at the point of use, not at the point
of entry — you don't control how it got in.

## Reading the results

```sql
-- What needs a human TODAY — both directions
select country_iso, source, severity, from_level, to_level, detected_at
from public.advisory_changes
where status = 'pending' and same_day order by detected_at desc;

-- Everything pending, including the routine text changes
select * from public.advisory_changes where status = 'pending' order by detected_at desc;

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

## Severities — and why none of them wait

**Both directions are same-day (David, 2026-08-11).** The checker originally held
de-escalations for the fortnightly publish. That was wrong: Uganda dropping from
Level 4 to Level 3 turns four gorilla-trekking destinations from never-bookable
into bookable, and sitting on that for two weeks is being wrong in the direction
that merely *sounds* careful.

The label survives; it just no longer decides the timing.

| Severity | Means | Same-day? |
|---|---|---|
| `escalation` | The level went **up** | **Yes** — and an alert can shout louder for these |
| `de-escalation` | The level went **down** | **Yes.** Oman went ordered → authorized departure and stayed Level 3 — materially different, invisible to any content refresh |
| `new` | A country we had no reading for | **Yes** — confirm before it shows |
| `withdrawn` | The source dropped it | **Yes** — confirm before removing anything |
| `text` | Same level, changed wording | **Depends on the source** — see below |

**The `text` case is the one worth understanding.** On a source that publishes
numbers, a text-only change means the number did *not* move — genuinely lower
urgency. But **the FCDO publishes no numeric level at all**, so for it the text
*is* the signal: its regional exclusions, which is where named-zone carve-outs
come from, move here and nowhere else. Treating text as routine would have
silently demoted our only currently-working source to background noise.

So `text` is same-day for the FCDO and routine for State.

The judgement is stored on the row (`same_day`) at detection time rather than
re-derived when read, so the audit trail records what we decided when we saw it —
not what today's code would decide. Same discipline as freezing on failure.

## Deep-link verification (2026-08-13) — 72 of 108 proven, zero 404s

First clean run of `npm run check:advisory-links`, from a laptop rather than the
build sandbox.

| Source | Deep links | Result |
|---|---|---|
| **UK FCDO** | 36 | **all resolve** |
| **US CDC** | 36 | **all resolve** |
| **US State** | 36 | 403 — blocked to automation, slug unproven |
| | | **0 404s among everything reached** |

**The FCDO and CDC slug tables are verified.** Every one lands on the right
country page, which is what §7B asks for.

### The State API — the measured matrix, after three wrong readings

This question got answered wrong three times in two days, each time from a single
measurement. Here is the whole grid instead. **Do not re-diagnose this from one
data point; add a cell.**

`cadataapi.state.gov/api/TravelAdvisories`, response size:

| | curl-style UA | browser UA |
|---|---|---|
| **Laptop** (residential IP) | 200, `[]` | **200, 952 KB ✓** |
| **Edge Function** (datacenter IP) | 200, `[]` | 200, `[]` |

*Laptop cells measured 2026-08-13; Edge Function cells 2026-08-11, all three
header profiles in one run. The Edge Function's "browser-like" profile sends a
full Chrome 126 User-Agent — not a token gesture.*

**One cell works.** Both factors matter: a script-shaped User-Agent gets an empty
array even from a residential IP, and a full browser User-Agent gets an empty
array from a datacenter IP. **The origin is the constraint we cannot change from
Supabase**, so no amount of header tuning in the Edge Function will fix it. That
line of work is closed.

The other two State surfaces are simpler: `travel.state.gov` HTML pages 403 to
automation from **both** origins (bot protection on the website — a browser is
fine, which is what it is defending), and the RSS feed returns 343 bytes with
zero items to both.

**The three wrong readings, on the record, because the method matters more than
the answer:**

1. *"It's the egress"* — right by luck, on a 682KB measurement whose command was
   never recorded.
2. *"It returns `[]` to everyone, the egress theory is dead"* — from a laptop
   curl with no UA flag. The command was mine and I had not controlled for the
   variable I was testing.
3. The truth is both, and it took a 2×2 to see it.

**A measurement whose provenance is not recorded is not evidence**, and neither
is one that changes two variables at once. Reading 2 was as unsound as reading 1
even though it contradicted it.

**Consequences, which survive all of this:** FCDO-primary stands on its own
evidence (36 of 36, every run) and never depended on this. Requesting API access
is still right. And if we ever want State read automatically, it needs a
non-datacenter egress or a registered key — not a better header.

**The 36 State deep links** remain unproven, and are verifiable by hand in a
browser. No automated route exists today.

## Live-run findings (2026-08-11)

**The FCDO leg works.** 36 of 36 countries read, no failures, 36 changes queued as
`pending`. The full loop — fetch, diff, queue, freeze, audit — is proven on this
source. One slug was wrong and the run said so: the Bahamas is `bahamas`, not
`the-bahamas`. Fixed in `advisory-sources.ts`, which also corrects the
traveler-facing deep link.

**State answers 200 with nothing, from Supabase only. Settled — it is the egress,
not our request.**

Three header profiles were tried from the Edge Function in one run:

| Profile | Status | Bytes |
|---|---|---|
| curl-like (`User-Agent: curl/8.7.1`) | 200 | **2** |
| minimal (`Accept: application/json` only) | 200 | **2** |
| browser-like (full Chrome UA) | 200 | **2** |

Two bytes is `[]`. A well-formed, correctly-typed, **empty** JSON array, every
time. Meanwhile a plain `curl` from a laptop got **682,146 bytes** from the same
URL in the same window.

So the headers hypothesis is dead — and that is worth having tested, because it
was the cheap explanation and it would have been embarrassing to ask for an
egress allowlist without ruling it out. `cadataapi.state.gov` returns an empty
array to Supabase's datacenter IPs and real data to a laptop. It degrades
silently rather than returning 403, which is why this looked like a parsing bug
for two runs.

**There is no code fix.** The remaining options are environmental or
source-level:

1. **Ask State for access** — legitimate, free, slow. They publish this data to be
   consumed; a request for programmatic access is a reasonable one.
2. **Try `cadatacatalog.state.gov`** — a different host, possibly not behind the
   same filter. Cheapest thing to try, and untested.
3. **Route the State fetch through a non-datacenter egress** — costs money, adds a
   vendor, and arguably works against the filter's intent. Least favourite.
4. **Treat the FCDO as the primary source** — it works at 36/36 today. But it
   carries no numeric level, and our Safety Card is built on the L1–L4 scale, so
   this is a data-model change rather than a swap.

**The RSS is separately empty**, and not a fallback. Its probe shows a
well-formed feed — `<rss><channel><title>travel.state.gov: Travel
Advisories</title>` — with **343 bytes and zero `<item>` elements**, to the
laptop as well as to us. It isn't blocked; there is nothing in it.

## What isn't done yet## What isn't done yet

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
