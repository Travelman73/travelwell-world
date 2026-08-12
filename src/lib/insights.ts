/**
 * TravelWell.World — Atlas grounding context.
 *
 * Assembles what Atlas should know about the traveler *right now* so it can walk
 * beside them rather than answer cold: their Travel I.D., their current journey
 * (interests → region → activities → trip), what they've explored but not chosen
 * (from the journey_events log), and the curated "happenings" near where they're
 * looking. Passed as the `context` to the atlas Edge Function.
 *
 * All best-effort: every piece degrades to nothing when signed out / offline, so
 * Atlas simply knows less rather than erroring.
 */
import { getSupabase } from "./supabase";
import { fetchTravelId } from "./travelId";
import { cohortLabel, activityLabel, accessLabel } from "./identity";
import { fetchSignals } from "./signals";
import { useStore } from "@/store/useStore";
import { useCatalog } from "@/store/useCatalog";
import { resolveDestId } from "@/data/places";

interface Considered {
  regions: string[];
  interests: string[];
  guides: string[];
  providers: string[];
}

/** Parse the current route into a place anchor, so Atlas knows where they are. */
function hereFrom(path: string | null): { kind: "destination" | "region" | "si"; id: string } | null {
  if (!path) return null;
  const [a, b] = path.replace(/\/+$/, "").split("/").filter(Boolean);
  if (!b) return null;
  // A legacy link still tells Atlas where they actually are.
  if (a === "destination") return { kind: "destination", id: resolveDestId(b) ?? b };
  if (a === "region") return { kind: "region", id: b };
  if (a === "si") return { kind: "si", id: b };
  return null;
}

/** What the traveler viewed but didn't commit to — the considered-not-chosen trail. */
async function summarizeConsidered(
  userId: string,
  heldSIs: string[],
  region: string | null,
  tripNames: Set<string>
): Promise<Considered> {
  const sb = getSupabase();
  const out: Considered = { regions: [], interests: [], guides: [], providers: [] };
  if (!sb) return out;
  try {
    const { data } = await sb
      .from("journey_events")
      .select("kind, entity, entity_id, context")
      .eq("user_id", userId)
      .order("occurred_at", { ascending: false })
      .limit(150);
    const seen = {
      regions: new Set<string>(),
      interests: new Set<string>(),
      guides: new Set<string>(),
      providers: new Set<string>(),
    };
    for (const r of data ?? []) {
      const id = r.entity_id as string | null;
      const ctx = (r.context ?? {}) as { providers?: string[] };
      if (r.kind === "view" && r.entity === "region" && id && id !== region) seen.regions.add(id);
      else if (r.kind === "view" && r.entity === "si" && id && !heldSIs.includes(id)) seen.interests.add(id);
      else if (r.kind === "view" && r.entity === "guide" && id) seen.guides.add(id);
      // Well-browse logs the top provider names it showed → "looked at, didn't add".
      else if (r.kind === "view" && r.entity === "well" && Array.isArray(ctx.providers)) {
        for (const name of ctx.providers) if (!tripNames.has(name)) seen.providers.add(name);
      }
    }
    out.regions = [...seen.regions].slice(0, 6);
    out.interests = [...seen.interests].slice(0, 6);
    out.guides = [...seen.guides].slice(0, 4);
    out.providers = [...seen.providers].slice(0, 6);
  } catch {
    /* ignore — Atlas just knows less */
  }
  return out;
}

export async function buildAtlasContext(): Promise<Record<string, unknown>> {
  const s = useStore.getState();
  const cat = useCatalog.getState();
  const nameOfSI = (id: string) => cat.sis.find((x) => x.id === id)?.name ?? id;
  const nameOfRegion = (code: string) => cat.regions.find((x) => x.code === code)?.name ?? code;

  const here = hereFrom(s.lastPath);
  const month = new Date().getMonth() + 1;
  const tripNames = new Set(s.trip.map((b) => b.name));

  // Run the independent fetches together.
  const [profileRec, considered, signals] = await Promise.all([
    s.user ? fetchTravelId(s.user.id) : Promise.resolve(null),
    s.user
      ? summarizeConsidered(s.user.id, s.journeySIs, s.region, tripNames)
      : Promise.resolve<Considered>({ regions: [], interests: [], guides: [], providers: [] }),
    fetchSignals({
      destination: here?.kind === "destination" ? here.id : null,
      region: s.region ?? (here?.kind === "region" ? here.id : null),
      si: s.journeySIs,
      month,
    }),
  ]);

  const ctx: Record<string, unknown> = {
    interests: s.journeySIs.map((id) => ({ id, name: nameOfSI(id) })),
    region: s.region ? { code: s.region, name: nameOfRegion(s.region) } : null,
    activities: s.journeyActs.length,
    trip: s.trip.slice(0, 8).map((b) => ({ well: b.well, name: b.name, status: b.status })),
  };

  if (here) ctx.viewing = here.kind === "si" ? { kind: "si", name: nameOfSI(here.id) } : here.kind === "region" ? { kind: "region", name: nameOfRegion(here.id) } : here;

  if (profileRec) {
    ctx.profile = {
      name: profileRec.display_name ?? undefined,
      ageRange: profileRec.age_range ? cohortLabel(profileRec.age_range) : undefined,
      dream: profileRec.trip_intent ?? undefined,
      dietary: profileRec.dietary ?? undefined,
      // Safer-Informed overlay — BOTH sides. Atlas builds AROUND these, never
      // hands the traveler limitations; a stated factor overrides the age default.
      pace: activityLabel(profileRec.activity_level) ?? undefined,
      access: profileRec.access_needs?.length ? profileRec.access_needs.map(accessLabel) : undefined,
      ableTo: profileRec.capabilities ?? undefined,
      planAround: profileRec.accessibility ?? undefined,
      // Budget-by-Well, so Atlas can shape suggestions to what they'll spend.
      budget: profileRec.budget_ranges && Object.keys(profileRec.budget_ranges).length ? profileRec.budget_ranges : undefined,
    };
  }

  if (considered.regions.length || considered.interests.length || considered.guides.length || considered.providers.length) {
    ctx.considered = {
      regions: considered.regions.map(nameOfRegion),
      interests: considered.interests.map(nameOfSI),
      guides: considered.guides,
      providers: considered.providers,
    };
  }

  // The curated "happenings" Atlas may speak — never invents beyond these.
  ctx.happenings = signals.slice(0, 6).map((sig) => ({
    title: sig.title,
    blurb: sig.blurb,
    href: sig.href,
    season: sig.season,
    horizon: sig.horizon,
  }));

  return ctx;
}
