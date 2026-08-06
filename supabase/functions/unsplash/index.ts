// TravelWell.World — Unsplash image proxy (Edge Function, Deno).
//
// Keeps the Unsplash Access Key server-side (never in the browser bundle or the
// repo). The client calls this with a query (e.g. a destination name); we return
// one photo's URL + required attribution.
//
// Cached: each query is fetched from Unsplash at most ONCE and stored in
// public.unsplash_cache; every later request (grid card AND detail hero, any
// visitor) is served from the cache. So the same place shows the same photo
// everywhere, and we never blow the Unsplash rate limit on big grids. The
// download endpoint is triggered only on a real (cache-miss) fetch, per
// Unsplash's API Guidelines.
//
// Deploy:  supabase functions deploy unsplash
// Secret:  supabase secrets set UNSPLASH_ACCESS_KEY=...   (Access Key only)
// Needs migration 0009 (public.unsplash_cache).

import { createClient } from "npm:@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const UTM = "?utm_source=travelwell&utm_medium=referral";

const sbUrl = Deno.env.get("SUPABASE_URL");
const svcKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const db = sbUrl && svcKey ? createClient(sbUrl, svcKey, { auth: { persistSession: false } }) : null;

const ok = (photo: unknown) => Response.json({ photo }, { headers: cors, status: 200 });

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  try {
    const { query, orientation = "landscape" } = (await req.json()) as { query: string; orientation?: string };
    const key = Deno.env.get("UNSPLASH_ACCESS_KEY");
    if (!key || !query) return Response.json({ degraded: true }, { headers: cors, status: 200 });

    const cacheKey = query.trim().toLowerCase();

    // 1. Cache hit → serve it, no Unsplash call.
    if (db) {
      const { data: hit } = await db
        .from("unsplash_cache")
        .select("url, alt, credit_name, credit_link")
        .eq("query", cacheKey)
        .maybeSingle();
      if (hit) return ok({ url: hit.url, alt: hit.alt, credit: { name: hit.credit_name, link: hit.credit_link } });
    }

    // 2. Miss → fetch once from Unsplash. Pull the top 10 by RELEVANCE, then keep
    //    the strongest of them by likes. Relevance first keeps the photo actually
    //    of the place; likes then picks the best shot among those — so we never
    //    trade "the right place" for "a popular mountain". Automatic for every
    //    destination, new ones included; nothing hand-picked.
    const url = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&orientation=${orientation}&per_page=10&order_by=relevant&content_filter=high`;
    const res = await fetch(url, { headers: { Authorization: `Client-ID ${key}`, "Accept-Version": "v1" } });
    if (!res.ok) return Response.json({ degraded: true }, { headers: cors, status: 200 });
    const data = await res.json();
    const results = Array.isArray(data?.results) ? data.results : [];
    // Strictly-greater comparison, so ties (and missing `likes`) keep Unsplash's
    // relevance order — i.e. the earlier, more relevant photo wins a tie.
    const photo = results.reduce(
      (best: any, cur: any) => ((cur?.likes ?? 0) > (best?.likes ?? 0) ? cur : best),
      results[0],
    );
    if (!photo) return ok(null);

    // Unsplash API Guideline: trigger the download endpoint on real use.
    if (photo.links?.download_location) {
      fetch(photo.links.download_location, { headers: { Authorization: `Client-ID ${key}` } }).catch(() => {});
    }

    const out = {
      url: photo.urls?.raw ?? photo.urls?.regular,
      alt: photo.alt_description ?? query,
      credit: {
        name: photo.user?.name ?? "Unsplash",
        link: (photo.user?.links?.html ?? "https://unsplash.com") + UTM,
      },
    };

    // 3. Store for next time (fire-and-forget).
    if (db) {
      db.from("unsplash_cache")
        .upsert({ query: cacheKey, url: out.url, alt: out.alt, credit_name: out.credit.name, credit_link: out.credit.link }, { onConflict: "query" })
        .then(() => {}, () => {});
    }

    return ok(out);
  } catch (err) {
    console.error("unsplash error", err);
    return Response.json({ degraded: true }, { headers: cors, status: 200 });
  }
});
