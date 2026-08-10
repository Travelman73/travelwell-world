/**
 * TravelWell.World — Catalog store (the dynamic read-layer for components).
 *
 * Seeded synchronously from the bundled taxonomy, so the first render is
 * instant and works fully offline (the bundle is the fallback). On app boot
 * `hydrate()` pulls the catalog from Postgres and, per entity, folds in
 * whatever the DB supplies: DB rows win on conflict, bundle entries fill any
 * gaps — so we never lose shipped content, and catalog rows added or edited in
 * the DB show up after a refresh without a redeploy.
 *
 * Components read the catalog through this store (the use* hooks) instead of
 * importing the bundle directly, so the swap to DB-served content is invisible
 * to them. Bundle order is preserved (it drives grouped/ordered display);
 * DB-only entries are appended.
 *
 * Non-React callers (e.g. lib/journey.ts) keep using the bundle helpers in
 * src/data — they only need stable lookups (a well's icon) and run before
 * hydration; the bundle is the correct source there.
 */
import { create } from "zustand";
import {
  SIS as BUNDLE_SIS,
  boardSis,
  WELLS as BUNDLE_WELLS,
  LUX_WELLS as BUNDLE_LUX_WELLS,
  REGIONS as BUNDLE_REGIONS,
  SUBREGIONS as BUNDLE_SUBREGIONS,
  type SpecialInterest,
  type Well,
  type Region,
} from "@/data/taxonomy";
import {
  ACTIVITIES as BUNDLE_ACTIVITIES,
  PROVIDERS as BUNDLE_PROVIDERS,
  DESTINATIONS as BUNDLE_DESTINATIONS,
  GUIDES as BUNDLE_GUIDES,
  type Activity,
  type Provider,
  type Destination,
  type Guide,
} from "@/data/places";
import { fetchCatalog } from "@/lib/catalog";

const BUNDLE_ALL_WELLS: Well[] = [...BUNDLE_WELLS, ...BUNDLE_LUX_WELLS];

interface CatalogState {
  sis: SpecialInterest[];
  activities: Record<string, Activity[]>;
  wells: Well[];
  regions: Region[];
  subregions: Record<string, string[]>;
  providers: Record<string, Provider[]>;
  destinations: Record<string, Destination[]>;
  guides: Guide[];
  /** Where the live catalog came from — useful for debugging / a future badge. */
  source: "bundle" | "db";
  hydrate: () => Promise<void>;
}

/** Merge DB rows over the bundle by key, preserving bundle order and appending DB-only rows. */
function mergeByKey<T>(bundle: T[], db: T[], key: (t: T) => string): T[] {
  const byKey = new Map(bundle.map((x) => [key(x), x]));
  for (const x of db) byKey.set(key(x), x);
  return [...byKey.values()];
}

export const useCatalog = create<CatalogState>((set) => ({
  // THE BOARD only. Retired interests keep their Postgres row (the seed would
  // otherwise delete them) but must never reach a tile, a counter or a picker —
  // so they're filtered out once, here, rather than at twelve call sites where
  // one would eventually be missed. Filtering in the selector instead would
  // return a fresh array on every render and thrash zustand's equality check.
  sis: boardSis(BUNDLE_SIS) as SpecialInterest[],
  activities: BUNDLE_ACTIVITIES,
  wells: BUNDLE_ALL_WELLS,
  regions: BUNDLE_REGIONS,
  subregions: BUNDLE_SUBREGIONS,
  providers: BUNDLE_PROVIDERS,
  destinations: BUNDLE_DESTINATIONS,
  guides: BUNDLE_GUIDES,
  source: "bundle",
  hydrate: async () => {
    const db = await fetchCatalog();
    if (!db) return; // offline / unconfigured / empty → keep the bundle

    set((s) => ({
      sis: db.sis ? (boardSis(mergeByKey(BUNDLE_SIS, db.sis, (x) => x.id)) as SpecialInterest[]) : s.sis,
      activities: db.activities ? { ...BUNDLE_ACTIVITIES, ...db.activities } : s.activities,
      wells: db.wells ? mergeByKey(BUNDLE_ALL_WELLS, db.wells, (x) => x.id) : s.wells,
      regions: db.regions ? mergeByKey(BUNDLE_REGIONS, db.regions, (x) => x.code) : s.regions,
      subregions: db.subregions ? { ...BUNDLE_SUBREGIONS, ...db.subregions } : s.subregions,
      providers: db.providers ? { ...BUNDLE_PROVIDERS, ...db.providers } : s.providers,
      destinations: db.destinations ? { ...BUNDLE_DESTINATIONS, ...db.destinations } : s.destinations,
      guides: db.guides ? mergeByKey(BUNDLE_GUIDES, db.guides, (x) => x.id) : s.guides,
      source: "db",
    }));
  },
}));

/* Reactive helpers mirroring the old taxonomy/places call-sites. */
export const useSpecialInterests = () => useCatalog((s) => s.sis);
export const useActivities = () => useCatalog((s) => s.activities);
export const useWells = () => useCatalog((s) => s.wells);
export const useRegions = () => useCatalog((s) => s.regions);
export const useSubregions = () => useCatalog((s) => s.subregions);
export const useProviders = () => useCatalog((s) => s.providers);
export const useDestinations = () => useCatalog((s) => s.destinations);
export const useGuides = () => useCatalog((s) => s.guides);

/**
 * PUBLISHED COUNTS — always derived from the catalog the pages actually render,
 * never typed as a literal.
 *
 * Canon (CLAUDE.md) forbids publishing a count that disagrees with the taxonomy,
 * and a hardcoded number is exactly how that happens: the interest catalog grew
 * to 32 while fifteen places on the site — the mega-menu, the About counters, the
 * footer, the investor deck page, three translated strings — went on saying 25.
 * Nobody edits fifteen places reliably. So they read from here instead, and the
 * number is right by construction the moment David's board lands.
 *
 * These read the LIVE catalog (DB-first, bundle fallback), so the published
 * number always matches the tiles a traveler can actually see.
 */
export const useSiCount = () => useCatalog((s) => s.sis.length);
export const useRegionCount = () => useCatalog((s) => s.regions.length);
/**
 * The FULL Well roster — 13 (David-locked, 2026-08-10: "THE 13 WELLS").
 *
 * This counted only `live` Wells until his board note, which is why the site read
 * "10" against his 13: two answers to the same question. He was right on both
 * branches he offered — the counter was reading a subset AND one Well (Pets-Well)
 * was genuinely missing from the data. The published number is now the roster,
 * matching how he names it; the Wells page still marks the not-yet-live ones
 * "Soon", so nobody is told something is bookable when it isn't.
 */
export const useWellCount = () => useCatalog((s) => s.wells.length);
/**
 * LIVE Wells only — the denominator for trip COVERAGE ("3 of 10 Wells covered").
 * Deliberately different from the published roster above: a traveler can only
 * cover a Well that exists, so counting Insure/Ship/Pets here would make every
 * trip look permanently incomplete. Roster = what we offer; live = what a trip
 * can actually fill.
 */
export const useLiveWellCount = () => useCatalog((s) => s.wells.filter((w) => w.status === "live").length);

/** Reactive single-item lookups (recompute when the underlying list changes). */
export const useWellById = (id: string) => useCatalog((s) => s.wells.find((w) => w.id === id));
export const useRegionByCode = (code: string) => useCatalog((s) => s.regions.find((r) => r.code === code));
