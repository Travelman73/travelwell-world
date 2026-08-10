/**
 * TravelWell.World — Unsplash image client (talks to the `unsplash` Edge Function).
 *
 * The Access Key lives server-side (the Edge Function); the client never sees
 * it. useUnsplashImage() starts from the bundled fallback image so there's never
 * a blank/loading hole, then swaps in a destination-matched Unsplash photo when
 * it arrives — with the required attribution. Results are cached per query for
 * the session so we don't re-hit the API (rate limits) on every render.
 *
 * Degrades to the fallback whenever Supabase/the function/the key isn't there.
 */
import { useEffect, useState } from "react";
import { getSupabase } from "./supabase";

export interface UnsplashCredit { name: string; link: string }
export interface UnsplashPhoto { url: string; alt: string; credit: UnsplashCredit }

const cache = new Map<string, UnsplashPhoto | null>();
const inflight = new Map<string, Promise<UnsplashPhoto | null>>();

export async function fetchUnsplashPhoto(query: string): Promise<UnsplashPhoto | null> {
  if (cache.has(query)) return cache.get(query)!;
  if (inflight.has(query)) return inflight.get(query)!;
  const sb = getSupabase();
  if (!sb) return null;
  const p = (async () => {
    try {
      const { data, error } = await sb.functions.invoke("unsplash", { body: { query } });
      const photo = !error ? ((data as { photo?: UnsplashPhoto } | null)?.photo ?? null) : null;
      cache.set(query, photo);
      return photo;
    } catch {
      return null;
    } finally {
      inflight.delete(query);
    }
  })();
  inflight.set(query, p);
  return p;
}

/** Unsplash raw URLs take dynamic sizing params — keep transfer sizes sane. */
function sized(url: string, w: number): string {
  const sep = url.includes("?") ? "&" : "?";
  return `${url}${sep}auto=format&fit=crop&w=${w}&q=75`;
}

/**
 * Returns a bundled fallback `src` immediately, then a matched Unsplash photo
 * (with `credit`) once fetched. Render the credit when present (Unsplash
 * attribution requirement).
 */
export function useUnsplashImage(query: string, fallback: string, width = 1400): { src: string; credit?: UnsplashCredit } {
  const [photo, setPhoto] = useState<UnsplashPhoto | null>(null);
  useEffect(() => {
    let active = true;
    setPhoto(null);
    // An empty query means the caller already has its image (a pinned hero) —
    // don't spend an Unsplash request we're going to throw away.
    if (!query) return () => { active = false; };
    fetchUnsplashPhoto(query).then((p) => { if (active) setPhoto(p); });
    return () => { active = false; };
  }, [query]);
  return photo ? { src: sized(photo.url, width), credit: photo.credit } : { src: fallback };
}


/* ── Destination hero — the editorial override ────────────────────────────
 * By default a destination shows its own matched Unsplash photo, fetched by
 * "{name}, {country}". A dossier can override that from `data.hero`, so the
 * content team picks the image without anyone handing out an API key:
 *
 *   "hero": { "url": "https://…", "credit": { "name": "…", "link": "…" } }
 *   "hero": { "query": "Bonaire shore diving" }
 *
 * Precedence: hero.url  >  hero.query  >  automatic "{name}, {country}".
 *
 * `url` must be https (an http image breaks the page on a secure origin and is
 * a mixed-content warning). If a pinned image is an Unsplash photo, supply
 * `credit` too — their licence requires photographer attribution and we display
 * it; the automatic path gets credit for free, a pinned one can't.
 */
export interface DestinationHero {
  url?: string;
  query?: string;
  credit?: UnsplashCredit;
}

/**
 * The same editorial hero override, for a Special Interest. David is naming a
 * hero for all 35 interests in `data.hero` — without this the SI page ignored it
 * and every new interest sat on the generic mountain photo.
 *
 * Precedence: `data.hero.url` (pinned) > `data.hero.query` > the interest name.
 */
export function useSiImage(
  si: { name: string; data?: Record<string, unknown> },
  width: number,
  fallback: string,
): { src: string; credit?: UnsplashCredit } {
  const hero = (si.data as { hero?: DestinationHero } | undefined)?.hero;
  const pinned = hero?.url && /^https:\/\//i.test(hero.url) ? hero.url : undefined;
  const auto = useUnsplashImage(pinned ? "" : (hero?.query || si.name), fallback, width);
  return pinned ? { src: pinned, credit: hero?.credit } : auto;
}

export function useDestinationImage(
  dest: { name: string; country: string; img: string; data?: Record<string, unknown> },
  width: number,
  fallback: string,
): { src: string; credit?: UnsplashCredit } {
  const hero = (dest.data as { hero?: DestinationHero } | undefined)?.hero;
  const pinned = hero?.url && /^https:\/\//i.test(hero.url) ? hero.url : undefined;
  // Hooks can't be conditional — always call it, but pass "" when pinned so it
  // never fetches.
  const auto = useUnsplashImage(pinned ? "" : (hero?.query || `${dest.name}, ${dest.country}`), fallback, width);
  return pinned ? { src: pinned, credit: hero?.credit } : auto;
}
