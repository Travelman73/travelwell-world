/**
 * TravelWell.World — Catalog read-layer (DB → bundle).
 *
 * The bundled taxonomy (src/data) is the offline-first default and ships with
 * the app; Postgres is the source of truth when reachable. This module fetches
 * the catalog and maps DB rows back to the app's typed shapes.
 *
 * Coverage: Special Interests + Activities (migration 0003), and the formerly
 * "fixed nouns" — Wells, Regions, Sub-regions, Providers (migrations 0002/0004,
 * all world-readable RLS). Each entity is fetched independently and only
 * returned if its query succeeds with rows; the store keeps the bundle for any
 * entity the DB doesn't supply. So a partial / unreachable DB never blanks the
 * UI — mirroring the graceful-degrade contract in supabase.ts.
 *
 * Still bundled-only: the SI→region affinity map (REGION_SI, ranking input),
 * editorial copy, destinations, guides, and well detail — these are richer
 * shapes / app logic rather than flat catalog rows.
 */
import { getSupabase } from "./supabase";
import type { SpecialInterest, Status, Well, Region, IconName } from "@/data/taxonomy";
import type { Activity, Provider, Tier, Price, Mode, Destination, Guide } from "@/data/places";

export interface DbCatalog {
  sis?: SpecialInterest[];
  activities?: Record<string, Activity[]>;
  wells?: Well[];
  regions?: Region[];
  subregions?: Record<string, string[]>;
  providers?: Record<string, Provider[]>;
  destinations?: Record<string, Destination[]>;
  guides?: Guide[];
}

export async function fetchCatalog(): Promise<DbCatalog | null> {
  const sb = getSupabase();
  if (!sb) return null;
  try {
    const [siRes, actRes, wellRes, regionRes, subRes, provRes, destRes, guideRes] = await Promise.all([
      sb.from("special_interests").select("id, name, signature, status, accent, is_lux, grp, data"),
      sb.from("activities").select("si_id, id, name, well, line, position").order("position", { ascending: true }),
      sb.from("wells").select("id, name, tag, body, status, icon, is_lux"),
      sb.from("regions").select("code, name, line, countries, gateways, status, has_sub"),
      sb.from("sub_regions").select("region_code, name, position").order("position", { ascending: true }),
      sb.from("providers").select("name, well, tier, price, mode, description, commission, si, region, booking_url"),
      sb.from("destinations").select("id, region_code, name, country, line, status, depth, img, sub_region, si, feel, tier_range, price_band, draw_rank, data, position").order("position", { ascending: true }),
      sb.from("guides").select("id, type, title, lede, read, updated, img, si, region, position").order("position", { ascending: true }),
    ]);

    const out: DbCatalog = {};

    const siRows = siRes.error ? [] : siRes.data ?? [];
    if (siRows.length) {
      out.sis = siRows.map((r) => ({
        id: r.id as string,
        name: r.name as string,
        sig: r.signature as string,
        status: r.status as Status,
        accent: r.accent as string,
        lux: Boolean(r.is_lux),
        group: r.grp as string,
        ...(r.data ? { data: r.data as Record<string, unknown> } : {}),
      }));
    }

    if (!actRes.error && (actRes.data?.length ?? 0)) {
      const activities: Record<string, Activity[]> = {};
      for (const r of actRes.data!) {
        (activities[r.si_id as string] ??= []).push({
          id: r.id as string,
          name: r.name as string,
          well: r.well as string,
          line: (r.line ?? "") as string,
        });
      }
      out.activities = activities;
    }

    if (!wellRes.error && (wellRes.data?.length ?? 0)) {
      out.wells = wellRes.data!.map((r) => ({
        id: r.id as string,
        name: r.name as string,
        tag: r.tag as string,
        body: r.body as string,
        status: r.status as Status,
        icon: r.icon as IconName,
        lux: Boolean(r.is_lux),
      }));
    }

    if (!regionRes.error && (regionRes.data?.length ?? 0)) {
      out.regions = regionRes.data!.map((r) => ({
        code: r.code as string,
        name: r.name as string,
        line: r.line as string,
        countries: Number(r.countries ?? 0),
        gateways: (r.gateways ?? "") as string,
        status: r.status as Status,
        sub: Boolean(r.has_sub),
      }));
    }

    if (!subRes.error && (subRes.data?.length ?? 0)) {
      const subregions: Record<string, string[]> = {};
      for (const r of subRes.data!) {
        (subregions[r.region_code as string] ??= []).push(r.name as string);
      }
      out.subregions = subregions;
    }

    if (!provRes.error && (provRes.data?.length ?? 0)) {
      const providers: Record<string, Provider[]> = {};
      for (const r of provRes.data!) {
        (providers[r.well as string] ??= []).push({
          name: r.name as string,
          well: r.well as string,
          tier: r.tier as Tier,
          price: r.price as Price,
          mode: r.mode as Mode,
          desc: (r.description ?? "") as string,
          commission: r.commission as string,
          si: (r.si ?? []) as string[],
          region: (r.region ?? undefined) as string | undefined,
          bookingUrl: (r.booking_url ?? undefined) as string | undefined,
        });
      }
      out.providers = providers;
    }

    if (!destRes.error && (destRes.data?.length ?? 0)) {
      const destinations: Record<string, Destination[]> = {};
      for (const r of destRes.data!) {
        (destinations[r.region_code as string] ??= []).push({
          id: r.id as string,
          name: r.name as string,
          country: r.country as string,
          line: r.line as string,
          status: (r.status ?? "live") as Destination["status"],
          depth: (r.depth ?? "verified") as Destination["depth"],
          img: r.img as string,
          ...(r.sub_region ? { sub_region: r.sub_region as string } : {}),
          // Rich dossier fields — carry them so the ingested depth (jewels, faq …)
          // reaches the page, not just the bundle's samples.
          ...(Array.isArray(r.si) ? { si: r.si as string[] } : {}),
          ...(Array.isArray(r.feel) ? { feel: r.feel as string[] } : {}),
          ...(Array.isArray(r.tier_range) ? { tier_range: r.tier_range as string[] } : {}),
          ...(r.price_band ? { price_band: r.price_band as string } : {}),
          ...(r.draw_rank ? { draw_rank: r.draw_rank as Destination["draw_rank"] } : {}),
          ...(r.data ? { data: r.data as Destination["data"] } : {}),
        });
      }
      out.destinations = destinations;
    }

    if (!guideRes.error && (guideRes.data?.length ?? 0)) {
      out.guides = guideRes.data!.map((r) => ({
        id: r.id as string,
        type: r.type as string,
        title: r.title as string,
        lede: r.lede as string,
        read: r.read as string,
        updated: r.updated as string,
        img: r.img as string,
        si: r.si as string,
        region: r.region as string,
      }));
    }

    return Object.keys(out).length ? out : null;
  } catch {
    return null;
  }
}
