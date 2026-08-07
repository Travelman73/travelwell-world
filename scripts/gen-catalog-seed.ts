/**
 * One-off generator: emits the catalog seed migrations from the real bundled
 * catalog, so the seeds can never drift from the app. Run via esbuild so it
 * reads the actual TS source:
 *
 *   ./node_modules/.bin/esbuild scripts/gen-catalog-seed.ts --bundle \
 *     --platform=node --format=esm --outfile=scratchpad/gen.mjs && node scratchpad/gen.mjs
 *
 * Emits:
 *   0003_seed_si_activities.sql  — special_interests + activities
 *   0004_seed_providers_subregions.sql — providers + sub_regions
 * Re-run whenever the catalog changes to refresh the seeds.
 */
import { writeFileSync, readFileSync, readdirSync } from "node:fs";
import { SIS, SUBREGIONS, REGIONS } from "../src/data/taxonomy";
import { ACTIVITIES, PROVIDERS, DESTINATIONS, GUIDES } from "../src/data/places";
import { LOCAL_SIGNALS } from "../src/data/local-signals";

// Provider research arrives as CSVs in src/data/providers/ (David's sets,
// conformed to the 10-column schema). The seed generator ingests them directly
// — no transcription — so a new set drops in by adding a file. si is
// pipe-separated slugs; region blank = cross-region (e.g. airlines).
interface CsvProvider {
  name: string; well: string; tier: string; price: string; mode: string;
  desc: string; commission: string; si: string[]; region?: string; bookingUrl?: string;
}
function parseCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = "", inQ = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (inQ) {
      if (c === '"') { if (line[i + 1] === '"') { cur += '"'; i++; } else inQ = false; }
      else cur += c;
    } else if (c === '"') inQ = true;
    else if (c === ",") { out.push(cur); cur = ""; }
    else cur += c;
  }
  out.push(cur);
  return out;
}
function readProviderCsvs(): CsvProvider[] {
  const dir = "src/data/providers";
  let files: string[] = [];
  try { files = readdirSync(dir).filter((f) => f.endsWith(".csv")); } catch { return []; }
  const rows: CsvProvider[] = [];
  for (const f of files.sort()) {
    const lines = readFileSync(`${dir}/${f}`, "utf8").trim().split(/\r?\n/).filter(Boolean);
    const header = parseCsvLine(lines[0]).map((h) => h.trim());
    for (const line of lines.slice(1)) {
      const cells = parseCsvLine(line);
      const rec: Record<string, string> = {};
      header.forEach((h, i) => { rec[h] = (cells[i] ?? "").trim(); });
      rows.push({
        name: rec.name, well: rec.well, tier: rec.tier, price: rec.price, mode: rec.mode,
        desc: rec.description, commission: rec.commission,
        si: rec.si ? rec.si.split("|").map((s) => s.trim()).filter(Boolean) : [],
        region: rec.region || undefined,
        bookingUrl: rec.booking_url || undefined,
      });
    }
  }
  return rows;
}

// TLEU look-ahead events (David's Travel-Linked Event Universe) arrive as one
// JSON array in src/data/tleu-events.json, pre-shaped to the local_signals row
// (snake_case + a meta object per event). The generator ingests them straight
// into the 0007 seed alongside the authored LOCAL_SIGNALS — no transcription.
// Two normalizations happen here so the file stays David's verbatim map:
//   • id is authored null → we mint a stable `tleu-<slug(title)>` primary key.
//   • wells "lodging" → "stay" (our canonical well id; there is no "lodging").
// region_code is validated against REGIONS below (the table FK would error on a
// bad code); SI slugs are soft (text[], no FK) so future-SI tags like
// prosports-spectator ride along quietly until those interests ship.
interface TleuEvent {
  id: string | null; destination_id: string | null; region_code: string | null;
  si?: string[]; wells?: string[]; kind: string; horizon: string;
  title: string; blurb?: string; starts_on?: string | null; ends_on?: string | null;
  recurrence?: { months?: number[]; days?: number[] }; season?: string;
  source?: string; priority?: number; meta?: Record<string, unknown>;
}
const slug = (s: string) =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
const WELL_REMAP: Record<string, string> = { lodging: "stay" };
function readTleuEvents(validRegions: Set<string>): LocalSignal[] {
  let raw: TleuEvent[] = [];
  try { raw = JSON.parse(readFileSync("src/data/tleu-events.json", "utf8")); }
  catch { return []; }
  const seen = new Set<string>();
  return raw.map((e) => {
    let id = e.id ?? `tleu-${slug(e.title)}`;
    while (seen.has(id)) id = `${id}-2`;
    seen.add(id);
    if (e.region_code && !validRegions.has(e.region_code)) {
      throw new Error(`TLEU event "${e.title}" has unknown region_code ${e.region_code}`);
    }
    return {
      id,
      kind: e.kind as LocalSignal["kind"],
      horizon: e.horizon as LocalSignal["horizon"],
      title: e.title,
      blurb: e.blurb,
      destination: e.destination_id ?? undefined,
      region: e.region_code ?? undefined,
      si: e.si,
      wells: (e.wells ?? []).map((w) => WELL_REMAP[w] ?? w),
      season: e.season,
      recurrence: e.recurrence,
      startsOn: e.starts_on ?? undefined,
      endsOn: e.ends_on ?? undefined,
      priority: e.priority,
      source: (e.source ?? "curated") as LocalSignal["source"],
      meta: e.meta,
    };
  });
}

const q = (s: string | null | undefined) => (s == null ? "null" : `'${s.replace(/'/g, "''")}'`);
const pgArr = (xs?: string[]) => `'{${(xs ?? []).map((x) => `"${x.replace(/"/g, '\\"')}"`).join(",")}}'`;
const jsonb = (o: unknown) => (o == null ? "null" : `'${JSON.stringify(o).replace(/'/g, "''")}'::jsonb`);

const siRows = SIS.map(
  (s) => `  (${q(s.id)}, ${q(s.name)}, ${q(s.sig)}, ${q(s.status)}, ${q(s.accent)}, ${s.lux}, ${q(s.group)})`
).join(",\n");
const siIdList = SIS.map((s) => q(s.id)).join(", ");

const actRows = Object.entries(ACTIVITIES)
  .flatMap(([siId, acts]) =>
    acts.map((a, i) => `  (${q(siId)}, ${q(a.id)}, ${q(a.name)}, ${q(a.well)}, ${q(a.line)}, ${i})`)
  )
  .join(",\n");

const sql = `-- TravelWell.World — seed the Special Interests + Activities catalog.
--
-- GENERATED by scripts/gen-catalog-seed.ts from the bundled catalog (SIS +
-- ACTIVITIES, including David's special-interests.json). Do not hand-edit —
-- regenerate after catalog changes. Idempotent (ON CONFLICT DO UPDATE), so it
-- doubles as the refresh path and the next slice of catalog -> DB.
--
-- Apply:  supabase db push   (or paste into the Supabase SQL editor)
-- Requires 0001 (tables) and 0002 (wells, for the activities.well FK).

-- Special Interests -----------------------------------------------------------
insert into public.special_interests (id, name, signature, status, accent, is_lux, grp) values
${siRows}
on conflict (id) do update set
  name = excluded.name, signature = excluded.signature, status = excluded.status,
  accent = excluded.accent, is_lux = excluded.is_lux, grp = excluded.grp;

-- Self-clean, same discipline as the destinations seed: an SI RETIRED in
-- src/data/taxonomy.ts must also leave the DB. Without this the seed was
-- insert-and-upsert only, so a removed interest would linger in Postgres and —
-- because the app reads DB-first with the bundle only as fallback — keep showing
-- in production after it had been deleted from the source. Silent and confusing.
delete from public.special_interests where id not in (${siIdList});

-- Activities ------------------------------------------------------------------
-- Laddered experiences per Special Interest. si_id is a plain key (not all
-- activity groups map to a canonical SI in the prototype); well FKs to wells.
create table if not exists public.activities (
  si_id     text not null,
  id        text not null,
  name      text not null,
  well      text not null references public.wells(id),
  line      text,
  position  int not null default 0,
  primary key (si_id, id)
);

alter table public.activities enable row level security;
do $$
begin
  create policy "read activities" on public.activities for select using (true);
exception when duplicate_object then null;
end $$;

insert into public.activities (si_id, id, name, well, line, position) values
${actRows}
on conflict (si_id, id) do update set
  name = excluded.name, well = excluded.well, line = excluded.line, position = excluded.position;
`;

writeFileSync("supabase/migrations/0003_seed_si_activities.sql", sql);
console.log("Wrote supabase/migrations/0003_seed_si_activities.sql");
console.log(`  ${SIS.length} special interests, ${Object.values(ACTIVITIES).flat().length} activities`);

// ---------------------------------------------------------------------------
// 0004 — Providers + Sub-regions
// ---------------------------------------------------------------------------
// Bundle providers (places.ts) + CSV providers, deduped on the (name, well)
// natural key so the generated INSERT never hits the same conflict row twice.
const allProviders: CsvProvider[] = [...Object.values(PROVIDERS).flat(), ...readProviderCsvs()];
const seenPk = new Set<string>();
const provRows = allProviders
  .filter((p) => { const k = `${p.name}|${p.well}`; if (seenPk.has(k)) return false; seenPk.add(k); return true; })
  .map((p) => `  (${q(p.name)}, ${q(p.well)}, ${q(p.tier)}, ${q(p.price)}, ${q(p.mode)}, ${q(p.desc)}, ${q(p.commission)}, ${pgArr(p.si)}, ${p.region ? q(p.region) : "null"}, ${p.bookingUrl ? q(p.bookingUrl) : "null"})`)
  .join(",\n");

const subRows = Object.entries(SUBREGIONS)
  .flatMap(([code, names]) => names.map((name, i) => `  (${q(code)}, ${q(name)}, ${i})`))
  .join(",\n");

const sql4 = `-- TravelWell.World — seed Providers + Sub-regions.
--
-- GENERATED by scripts/gen-catalog-seed.ts from the bundled catalog (PROVIDERS
-- in places.ts + SUBREGIONS in taxonomy.ts). Do not hand-edit — regenerate
-- after catalog changes. Idempotent (ON CONFLICT DO UPDATE).
--
-- Apply:  supabase db push   (or paste into the Supabase SQL editor)
-- Requires 0001 (providers table + RLS) and 0002 (wells/regions, for the FKs).

-- Providers -------------------------------------------------------------------
-- The providers table (0001) has a generated uuid pk; add a natural key so the
-- seed is idempotent and can act as the refresh path.
create unique index if not exists providers_name_well_key on public.providers (name, well);

-- Step 1 of the matching keystone: give providers an SI dimension and a region
-- dimension, so the catalog can express "Caribbean dive providers". Additive —
-- matching that reads these lands in a later step.
alter table public.providers add column if not exists si          text[] not null default '{}';
alter table public.providers add column if not exists region      text;
alter table public.providers add column if not exists booking_url text;
create index if not exists providers_region_idx on public.providers (region);

insert into public.providers (name, well, tier, price, mode, description, commission, si, region, booking_url) values
${provRows}
on conflict (name, well) do update set
  tier = excluded.tier, price = excluded.price, mode = excluded.mode,
  description = excluded.description, commission = excluded.commission,
  si = excluded.si, region = excluded.region, booking_url = excluded.booking_url;

-- Sub-regions -----------------------------------------------------------------
create table if not exists public.sub_regions (
  region_code text not null references public.regions(code) on delete cascade,
  name        text not null,
  position    int not null default 0,
  primary key (region_code, name)
);

alter table public.sub_regions enable row level security;
do $$
begin
  create policy "read sub_regions" on public.sub_regions for select using (true);
exception when duplicate_object then null;
end $$;

insert into public.sub_regions (region_code, name, position) values
${subRows}
on conflict (region_code, name) do update set position = excluded.position;
`;

writeFileSync("supabase/migrations/0004_seed_providers_subregions.sql", sql4);
console.log("Wrote supabase/migrations/0004_seed_providers_subregions.sql");
console.log(`  ${seenPk.size} providers (${Object.values(PROVIDERS).flat().length} bundle + ${readProviderCsvs().length} csv), ${Object.values(SUBREGIONS).flat().length} sub-regions`);

// ---------------------------------------------------------------------------
/**
 * Conformed dossier batches, dropped in as JSON — the same "add a file, it just
 * works" path providers already have. The research library delivers
 * `src/data/destinations/<batch>.json` and this picks it up automatically:
 * nothing to hand-merge into places.ts, nothing to reshape.
 *
 * Each file is either an array of destinations, or an object keyed by region
 * code. Every row must carry `region_code` (or sit under its region key).
 * A batch row with the same `id` as a bundled row WINS — that's how a shallow
 * hand-authored anchor gets upgraded by its full dossier.
 */
function readDestinationBatches(): Record<string, DestRow[]> {
  const dir = "src/data/destinations";
  let files: string[] = [];
  try { files = readdirSync(dir).filter((f) => f.endsWith(".json") && !f.startsWith("_")); } catch { return {}; }
  const out: Record<string, DestRow[]> = {};
  for (const f of files.sort()) {
    const raw = JSON.parse(readFileSync(`${dir}/${f}`, "utf8"));
    const rows: DestRow[] = Array.isArray(raw)
      ? raw
      : Object.entries(raw).flatMap(([code, list]) =>
          (list as DestRow[]).map((d) => ({ ...d, region_code: d.region_code ?? code })));
    for (const d of rows) {
      const code = d.region_code;
      if (!code) throw new Error(`${f}: destination "${d.id ?? d.name}" has no region_code`);
      (out[code] ??= []).push(d);
    }
  }
  return out;
}
type DestRow = { id?: string; name: string; country: string; region_code?: string } & Record<string, unknown>;

/** Bundled catalog + dropped-in batches, batches winning on id collision. */
function mergedDestinations(): Record<string, DestRow[]> {
  const merged: Record<string, DestRow[]> = {};
  for (const [code, list] of Object.entries(DESTINATIONS)) merged[code] = [...(list as unknown as DestRow[])];
  for (const [code, list] of Object.entries(readDestinationBatches())) {
    const target = (merged[code] ??= []);
    for (const d of list) {
      // `img` is a placeholder token only (the real photo comes from Unsplash by
      // name+country), so a batch may omit it — default rather than reject a good
      // dossier over a cosmetic field the DB happens to mark not-null.
      if (!d.img) d.img = "mountainValley";
      const i = target.findIndex((x) => x.id === d.id);
      if (i >= 0) target[i] = d; else target.push(d);   // batch wins
    }
  }
  return merged;
}

// 0005 — Destinations + Guides
// ---------------------------------------------------------------------------
const DESTS = mergedDestinations();
const allDests = Object.values(DESTS).flat();
const destRows = Object.entries(DESTS)
  .flatMap(([code, list]) =>
    list.map((d, i) => `  (${q(d.id)}, ${q(code)}, ${q(d.name)}, ${q(d.country)}, ${q(d.line)}, ${q(d.status)}, ${q(d.depth)}, ${q(d.img)}, ${d.sub_region ? q(d.sub_region) : "null"}, ${pgArr(d.si)}, ${pgArr(d.feel)}, ${pgArr(d.tier_range)}, ${d.price_band ? q(d.price_band) : "null"}, ${d.draw_rank ? q(d.draw_rank) : "null"}, ${jsonb(d.data)}, ${i})`)
  )
  .join(",\n");
const destIdList = allDests.map((d) => q(d.id)).join(", ");

const guideRows = GUIDES.map(
  (g, i) =>
    `  (${q(g.id)}, ${q(g.type)}, ${q(g.title)}, ${q(g.lede)}, ${q(g.read)}, ${q(g.updated)}, ${q(g.img)}, ${q(g.si)}, ${q(g.region)}, ${i})`
).join(",\n");

const sql5 = `-- TravelWell.World — seed Destinations + Guides.
--
-- GENERATED by scripts/gen-catalog-seed.ts from the bundled catalog
-- (DESTINATIONS + GUIDES in places.ts). Do not hand-edit — regenerate after
-- catalog changes. Idempotent (ON CONFLICT DO UPDATE).
--
-- Apply:  supabase db push   (or paste into the Supabase SQL editor)
-- Requires 0001 (tables) and 0002 (regions, for the destinations.region_code FK).

-- Destinations ----------------------------------------------------------------
create table if not exists public.destinations (
  id          text primary key,
  region_code text not null references public.regions(code) on delete cascade,
  name        text not null,
  country     text not null,
  line        text not null,
  status      text not null check (status in ('live','future')),
  depth       text not null default 'verified' check (depth in ('verified','stub','cached')),
  img         text not null,
  sub_region  text,
  si          text[] not null default '{}',   -- Signature Interests this place serves
  feel        text[] not null default '{}',   -- feel/archetype tags (SI + feel used together, never one alone)
  tier_range  text[] not null default '{}',   -- budget bands present (essential…ultra)
  price_band  text,                            -- coarse overall price label
  draw_rank   text check (draw_rank in ('anchor','core','emerging')),  -- surface order
  data        jsonb,                           -- full dossier (safety, booking, jewels, seo, timing…)
  position    int not null default 0
);

alter table public.destinations enable row level security;
do $$
begin
  create policy "read destinations" on public.destinations for select using (true);
exception when duplicate_object then null;
end $$;

-- Two-axis model (David-locked): status = shown | coming-soon; depth = how deep.
-- Evolve a pre-existing table (was status live|stub, no depth/sub_region)
-- idempotently BEFORE the upsert. Set depth from the old status, then flip the
-- shown-but-thin 'stub' rows to status 'live' (they stay shown; depth carries
-- the thinness), then swap the status constraint to live|future.
alter table public.destinations add column if not exists depth      text;
alter table public.destinations add column if not exists sub_region text;
update public.destinations set depth = case when status = 'stub' then 'stub' else 'verified' end where depth is null;
update public.destinations set status = 'live' where status = 'stub';
alter table public.destinations drop constraint if exists destinations_status_check;
alter table public.destinations add  constraint destinations_status_check check (status in ('live','future'));
alter table public.destinations drop constraint if exists destinations_depth_check;
alter table public.destinations add  constraint destinations_depth_check check (depth in ('verified','stub','cached'));
alter table public.destinations alter column depth set default 'verified';
-- Serving signals (the traveler-fit axes) + the dossier document. Self-heal an
-- existing table so a single re-run adds them.
alter table public.destinations add column if not exists si         text[] not null default '{}';
alter table public.destinations add column if not exists feel       text[] not null default '{}';
alter table public.destinations add column if not exists tier_range text[] not null default '{}';
alter table public.destinations add column if not exists price_band text;
alter table public.destinations add column if not exists draw_rank  text;
alter table public.destinations drop constraint if exists destinations_draw_rank_check;
alter table public.destinations add  constraint destinations_draw_rank_check check (draw_rank is null or draw_rank in ('anchor','core','emerging'));
alter table public.destinations add column if not exists data       jsonb;
create index if not exists destinations_si_idx        on public.destinations using gin (si);
create index if not exists destinations_draw_rank_idx on public.destinations (draw_rank);

insert into public.destinations (id, region_code, name, country, line, status, depth, img, sub_region, si, feel, tier_range, price_band, draw_rank, data, position) values
${destRows}
on conflict (id) do update set
  region_code = excluded.region_code, name = excluded.name, country = excluded.country,
  line = excluded.line, status = excluded.status, depth = excluded.depth, img = excluded.img,
  sub_region = excluded.sub_region, si = excluded.si, feel = excluded.feel, tier_range = excluded.tier_range,
  price_band = excluded.price_band, draw_rank = excluded.draw_rank, data = excluded.data, position = excluded.position;

-- Seed is authoritative: drop any destination no longer in the catalog — e.g.
-- a row left behind by a key rename (cape-town -> cape-town-south-africa). Safe
-- while every destination comes from this seed; once cache-back writes
-- atlas-sourced rows, scope this by a source column instead.
delete from public.destinations where id not in (${destIdList});

-- Guides ----------------------------------------------------------------------
create table if not exists public.guides (
  id        text primary key,
  type      text not null,
  title     text not null,
  lede      text not null,
  read      text not null,
  updated   text not null,
  img       text not null,
  si        text not null,
  region    text not null,
  position  int not null default 0
);

alter table public.guides enable row level security;
do $$
begin
  create policy "read guides" on public.guides for select using (true);
exception when duplicate_object then null;
end $$;

insert into public.guides (id, type, title, lede, read, updated, img, si, region, position) values
${guideRows}
on conflict (id) do update set
  type = excluded.type, title = excluded.title, lede = excluded.lede, read = excluded.read,
  updated = excluded.updated, img = excluded.img, si = excluded.si, region = excluded.region,
  position = excluded.position;
`;

writeFileSync("supabase/migrations/0005_seed_destinations_guides.sql", sql5);
console.log("Wrote supabase/migrations/0005_seed_destinations_guides.sql");
console.log(`  ${allDests.length} destinations (${Object.values(DESTINATIONS).flat().length} bundled + ${allDests.length - Object.values(DESTINATIONS).flat().length} dropped-in), ${GUIDES.length} guides`);

// ---------------------------------------------------------------------------
// 0007 — Local & temporal signals (the "knows what's happening" layer)
// ---------------------------------------------------------------------------
const TLEU_SIGNALS = readTleuEvents(new Set(REGIONS.map((r) => r.code)));
const ALL_SIGNALS = [...LOCAL_SIGNALS, ...TLEU_SIGNALS];
const signalRows = ALL_SIGNALS.map(
  (s) =>
    `  (${q(s.id)}, ${s.destination ? q(s.destination) : "null"}, ${s.region ? q(s.region) : "null"}, ` +
    `${pgArr(s.si)}, ${pgArr(s.wells)}, ${q(s.kind)}, ${q(s.horizon)}, ${q(s.title)}, ${q(s.blurb)}, ${q(s.href)}, ` +
    `${s.startsOn ? q(s.startsOn) : "null"}, ${s.endsOn ? q(s.endsOn) : "null"}, ${jsonb(s.recurrence)}, ` +
    `${q(s.season)}, ${q(s.source)}, ${s.priority ?? 0}, ${s.validFrom ? q(s.validFrom) : "null"}, ${s.validTo ? q(s.validTo) : "null"}, ${jsonb(s.meta)})`
).join(",\n");

const sql7 = `-- TravelWell.World — Local & temporal signals (Atlas's "knows what's happening").
--
-- GENERATED by scripts/gen-catalog-seed.ts from src/data/local-signals.ts.
-- Do not hand-edit — regenerate after authoring. Idempotent (ON CONFLICT).
-- World-readable: Atlas + Whispers read it; curated now, feeds/provider later.
--
-- Apply:  supabase db push   (or paste into the Supabase SQL editor)
-- Requires 0001 + 0002 (regions) and 0005 (destinations, for the FKs).

-- destination_id is a free-text place key (signals name places we don't model
-- in the destinations catalog yet), so it is intentionally NOT a foreign key.
create table if not exists public.local_signals (
  id            text primary key,
  destination_id text,
  region_code   text references public.regions(code),
  si            text[] not null default '{}',
  wells         text[] not null default '{}',
  kind          text not null check (kind in ('event','schedule','opening','lookahead')),
  horizon       text not null default 'now' check (horizon in ('now','soon','lookahead')),
  title         text not null,
  blurb         text,
  href          text,
  starts_on     date,
  ends_on       date,
  recurrence    jsonb,
  season        text,
  source        text not null default 'curated' check (source in ('curated','feed','provider')),
  priority      int  not null default 0,
  valid_from    timestamptz,
  valid_to      timestamptz,
  meta          jsonb,
  updated_at    timestamptz not null default now()
);

-- Drop the destination FK for DBs where an earlier 0007 created it (idempotent).
alter table public.local_signals drop constraint if exists local_signals_destination_id_fkey;
-- Structured extras (TLEU look-ahead: ticket_drop / book_by / sells_out /
-- high_intent / upsell_ladder, etc.). Self-heal an existing table.
alter table public.local_signals add column if not exists meta jsonb;

create index if not exists local_signals_dest_idx   on public.local_signals (destination_id);
create index if not exists local_signals_region_idx on public.local_signals (region_code);

alter table public.local_signals enable row level security;
do $$
begin
  create policy "read local_signals" on public.local_signals for select using (true);
exception when duplicate_object then null;
end $$;

insert into public.local_signals
  (id, destination_id, region_code, si, wells, kind, horizon, title, blurb, href, starts_on, ends_on, recurrence, season, source, priority, valid_from, valid_to, meta) values
${signalRows}
on conflict (id) do update set
  destination_id = excluded.destination_id, region_code = excluded.region_code, si = excluded.si, wells = excluded.wells,
  kind = excluded.kind, horizon = excluded.horizon, title = excluded.title, blurb = excluded.blurb, href = excluded.href,
  starts_on = excluded.starts_on, ends_on = excluded.ends_on, recurrence = excluded.recurrence, season = excluded.season,
  source = excluded.source, priority = excluded.priority, valid_from = excluded.valid_from, valid_to = excluded.valid_to,
  meta = excluded.meta, updated_at = now();
`;

writeFileSync("supabase/migrations/0007_seed_local_signals.sql", sql7);
console.log("Wrote supabase/migrations/0007_seed_local_signals.sql");
console.log(`  ${ALL_SIGNALS.length} local signals (${LOCAL_SIGNALS.length} authored + ${TLEU_SIGNALS.length} TLEU)`);
