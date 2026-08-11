// TravelWell.World — the daily advisory checker (David's verification cycle).
//
// ONE checker, run DAILY. It escalates the moment something moves and writes
// everything to an audit log; the 1st and the 15th are when we PUBLISH, not when
// we check. A separate "urgent path" was the alternative and it doubles the
// failure surface — the half that breaks is the half you need.
//
// Deploy:  supabase functions deploy advisory-check
// Schedule: daily via pg_cron / Supabase scheduled functions (see docs/advisory-checker.md)
// Secrets: SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY are injected by the platform.
//
// ── Two rules, both David's, both load-bearing ──────────────────────────────
// FREEZE ON FAILURE. A failed fetch never writes state. The previous value
// stands, with its original fetched_at, so the staleness is visible instead of a
// blank or a silent downgrade. A country we couldn't read today is NOT a country
// with no advisory.
// THE AUDIT TRAIL. Every run is logged, including the quiet ones. "What did we
// know and when did we know it" gets asked at the worst possible moment.
//
// ── Structured endpoints, never scraping ────────────────────────────────────
// State publishes a Consular Affairs API and an RSS feed; the FCDO answers
// through the GOV.UK Content API. Both bot-block a bare request, so we ask like a
// browser — but applied to a structured endpoint, not to a page that can be
// redesigned out from under us.
//
// NOTHING HERE PUBLISHES ITSELF. A detected change lands in advisory_changes as
// `pending` for a human to confirm. The site keeps showing the last confirmed
// value until someone says otherwise.

import { createClient } from "npm:@supabase/supabase-js@2";

const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36";
const HEADERS = {
  "User-Agent": UA,
  Accept: "application/json, text/xml, text/html;q=0.9, */*;q=0.8",
  "Accept-Language": "en-GB,en;q=0.9",
};

const STATE_API = "https://cadataapi.state.gov/api/TravelAdvisories";
const STATE_RSS = "https://travel.state.gov/_res/rss/TAs.xml";
const GOVUK_CONTENT = "https://www.gov.uk/api/content/foreign-travel-advice";

type SourceId = "state" | "fcdo" | "cdc";

interface Reading {
  country_iso: string;
  source: SourceId;
  level: number | null;
  level_label: string | null;
  headline: string | null;
  source_updated_at: string | null;
  raw_hash: string;
}

/** Small stable hash — detects a text-only edit without storing the document. */
async function hash(s: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return Array.from(new Uint8Array(buf)).slice(0, 12).map((b) => b.toString(16).padStart(2, "0")).join("");
}

/** "Level 3: Reconsider Travel" → 3. Returns null rather than guessing. */
function levelFrom(text: string | null | undefined): number | null {
  if (!text) return null;
  const m = /level\s*([1-4])/i.exec(text);
  return m ? Number(m[1]) : null;
}

async function getJson(url: string): Promise<unknown> {
  const res = await fetch(url, { headers: HEADERS, redirect: "follow" });
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  return await res.json();
}

/**
 * State's Consular Affairs API returns every advisory in one call — 1 request
 * for ~200 countries, not 200 requests. If it's blocked we fall back to the RSS
 * feed, which carries the same levels in the item titles.
 */
async function readState(isoByName: Record<string, string>): Promise<Reading[]> {
  const out: Reading[] = [];
  const push = async (name: string, title: string, updated: string | null, body: string) => {
    const iso = isoByName[name.trim().toLowerCase()];
    if (!iso) return;                      // a country we don't carry — skip, don't invent
    out.push({
      country_iso: iso,
      source: "state",
      level: levelFrom(title) ?? levelFrom(body),
      level_label: title || null,
      headline: body.slice(0, 500) || null,
      source_updated_at: updated,
      raw_hash: await hash(`${title}|${body}`),
    });
  };

  try {
    const data = await getJson(STATE_API) as Array<Record<string, unknown>>;
    for (const row of data ?? []) {
      const name = String(row.Country ?? row.country ?? row.Title ?? "");
      const title = String(row.Title ?? row.title ?? "");
      const body = String(row.Summary ?? row.summary ?? row.Description ?? "");
      const updated = (row.PubDate ?? row.pubDate ?? row.Updated ?? null) as string | null;
      if (name) await push(name, title, updated ? new Date(updated).toISOString() : null, body);
    }
    return out;
  } catch (apiErr) {
    console.warn("[advisory] State API unavailable, trying RSS:", apiErr);
  }

  // RSS fallback — titles look like "Kenya - Level 2: Exercise Increased Caution".
  const res = await fetch(STATE_RSS, { headers: HEADERS, redirect: "follow" });
  if (!res.ok) throw new Error(`state rss ${res.status}`);
  const xml = await res.text();
  for (const m of xml.matchAll(/<item>([\s\S]*?)<\/item>/g)) {
    const item = m[1];
    const title = (/<title>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/title>/.exec(item)?.[1] ?? "").trim();
    const date = (/<pubDate>([\s\S]*?)<\/pubDate>/.exec(item)?.[1] ?? "").trim();
    const name = title.split(" - ")[0];
    if (name) await push(name, title, date ? new Date(date).toISOString() : null, title);
  }
  return out;
}

/**
 * The FCDO through the GOV.UK Content API — one request per country. The FCDO
 * has no numeric level; it has advice text and, crucially, REGIONAL exclusions,
 * which is where our named-zone carve-outs come from. We record the headline and
 * the change hash; a human reads the detail when the hash moves.
 */
async function readFcdo(slugs: Array<{ iso: string; slug: string }>): Promise<{ readings: Reading[]; failures: string[] }> {
  const readings: Reading[] = [];
  const failures: string[] = [];
  for (const { iso, slug } of slugs) {
    try {
      const doc = await getJson(`${GOVUK_CONTENT}/${slug}`) as Record<string, any>;
      const headline: string = doc?.description ?? doc?.details?.parts?.[0]?.title ?? "";
      const updated: string | null = doc?.public_updated_at ?? null;
      // The alert/summary block is what actually moves; hash it, not the whole doc.
      const alert = String(doc?.details?.alert_status ?? "") + String(doc?.details?.parts?.[0]?.body ?? "");
      readings.push({
        country_iso: iso,
        source: "fcdo",
        level: null,
        level_label: null,
        headline: headline.slice(0, 500) || null,
        source_updated_at: updated,
        raw_hash: await hash(alert || headline),
      });
    } catch (err) {
      failures.push(`${iso}:${(err as Error).message.slice(0, 40)}`);
    }
    await new Promise((r) => setTimeout(r, 120));   // a polite client
  }
  return { readings, failures };
}

function severityFor(from: number | null, to: number | null, hashChanged: boolean):
  "escalation" | "de-escalation" | "new" | "text" | null {
  if (from === null && to !== null) return "new";
  if (from !== null && to !== null && to > from) return "escalation";
  if (from !== null && to !== null && to < from) return "de-escalation";
  return hashChanged ? "text" : null;
}

Deno.serve(async (req: Request) => {
  const sb = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false } },
  );

  const { data: run } = await sb.from("advisory_runs").insert({}).select("id").single();
  const runId = run?.id;
  const notes: Record<string, unknown> = {};
  let checked = 0, ok = 0, failed = 0, changed = 0;

  try {
    // The country list is OURS — we only check what we actually serve, which is
    // why this is ~90 lookups and not 200. Passed in so the function has no
    // build-time dependency on the app bundle.
    const body = req.method === "POST" ? await req.json().catch(() => ({})) : {};
    const countries: Array<{ iso: string; name: string; match?: string[]; fcdo_slug?: string }> = body.countries ?? [];
    if (!countries.length) {
      return Response.json({ error: "POST { countries: [{iso, name, fcdo_slug}] } — the checker never guesses the list" }, { status: 400 });
    }
    // Index every alias, not just our display name: State says "United Arab
    // Emirates" where we say "UAE". Matching on our name alone would drop those
    // countries from the run while it still reported success — the worst kind of
    // gap, because the number looks right.
    const isoByName: Record<string, string> = {};
    for (const c of countries) {
      for (const n of [c.name, ...(c.match ?? [])]) {
        if (n) isoByName[n.trim().toLowerCase()] = c.iso.toUpperCase();
      }
    }

    const { data: prevRows } = await sb.from("advisory_state").select("*");
    const prev = new Map((prevRows ?? []).map((r: any) => [`${r.country_iso}:${r.source}`, r]));

    const readings: Reading[] = [];

    // ── State ──────────────────────────────────────────────────────────────
    try {
      const r = await readState(isoByName);
      readings.push(...r);
      notes.state = { read: r.length };
    } catch (err) {
      // FREEZE: no state rows written for this source; the previous values stand.
      notes.state = { failed: (err as Error).message.slice(0, 120) };
      failed += countries.length;
      console.error("[advisory] State unreadable — holding last known values:", err);
    }

    // ── FCDO ───────────────────────────────────────────────────────────────
    const slugs = countries.filter((c) => c.fcdo_slug).map((c) => ({ iso: c.iso.toUpperCase(), slug: c.fcdo_slug! }));
    if (slugs.length) {
      const { readings: fr, failures } = await readFcdo(slugs);
      readings.push(...fr);
      failed += failures.length;
      notes.fcdo = { read: fr.length, failed: failures.length, examples: failures.slice(0, 5) };
    }

    // ── Diff, queue, and only THEN write state ─────────────────────────────
    for (const r of readings) {
      checked++;
      const key = `${r.country_iso}:${r.source}`;
      const before = prev.get(key);
      const sev = before
        ? severityFor(before.level ?? null, r.level, before.raw_hash !== r.raw_hash)
        : "new";

      if (sev) {
        await sb.from("advisory_changes").insert({
          country_iso: r.country_iso,
          source: r.source,
          from_level: before?.level ?? null,
          to_level: r.level,
          from_label: before?.level_label ?? null,
          to_label: r.level_label,
          severity: sev,
        });
        changed++;
      }

      // Written ONLY here, on a successful read. This is the freeze rule: a
      // source we couldn't reach never reaches this line, so its row keeps its
      // previous value and its previous fetched_at.
      await sb.from("advisory_state").upsert({
        country_iso: r.country_iso,
        source: r.source,
        level: r.level,
        level_label: r.level_label,
        headline: r.headline,
        source_updated_at: r.source_updated_at,
        fetched_at: new Date().toISOString(),
        raw_hash: r.raw_hash,
        confidence: r.level === null ? "estimate" : "verified",
      });
      ok++;
    }

    await sb.from("advisory_runs").update({
      finished_at: new Date().toISOString(), checked, ok, failed, changed, notes,
    }).eq("id", runId);

    // An escalation is the one worth waking someone for.
    const { data: escalations } = await sb
      .from("advisory_changes")
      .select("country_iso, source, from_level, to_level")
      .eq("status", "pending").eq("severity", "escalation");

    return Response.json({ runId, checked, ok, failed, changed, escalations: escalations ?? [] });
  } catch (err) {
    console.error("[advisory] run failed", err);
    await sb.from("advisory_runs").update({
      finished_at: new Date().toISOString(), checked, ok, failed, changed,
      notes: { ...notes, fatal: (err as Error).message.slice(0, 200) },
    }).eq("id", runId);
    // A failed run is a logged fact, not a 500 that a scheduler retries blindly.
    return Response.json({ runId, error: "run failed — previous values held", checked, ok, failed }, { status: 200 });
  }
});
