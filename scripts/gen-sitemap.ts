/**
 * Sitemap generator — writes `public/sitemap.xml` from the live catalog.
 *
 * Why this exists: robots.txt already points crawlers at /sitemap.xml, but the
 * file was only ever going to be produced by the SSG build (still gated on
 * funding) — so the URL 404'd and nothing told Google our destination pages
 * exist. This generates it from the same bundled catalog the app reads, so it's
 * correct today and stays correct as the catalog grows.
 *
 * Public content only. Private/gated/transactional routes are deliberately
 * excluded (a traveler's profile or a gated demo must never be indexed).
 *
 * Run:  npm run gen:sitemap        (also runs automatically before `npm run build`)
 */
import { writeFileSync } from "node:fs";
import { REGIONS, SIS } from "../src/data/taxonomy";
import { DESTINATIONS, GUIDES } from "../src/data/places";

const ORIGIN = "https://travelwell.world";

/** Public, indexable routes. Ordered roughly by importance. */
const STATIC_ROUTES: { path: string; priority: number; changefreq: string }[] = [
  { path: "/", priority: 1.0, changefreq: "weekly" },
  { path: "/special-interests", priority: 0.9, changefreq: "weekly" },
  { path: "/regions", priority: 0.9, changefreq: "weekly" },
  { path: "/destinations", priority: 0.9, changefreq: "weekly" },
  { path: "/guides", priority: 0.8, changefreq: "weekly" },
  { path: "/wells", priority: 0.8, changefreq: "monthly" },
  { path: "/plan", priority: 0.7, changefreq: "monthly" },
  { path: "/providers", priority: 0.6, changefreq: "weekly" },
  { path: "/calendar", priority: 0.6, changefreq: "weekly" },
  { path: "/luxury", priority: 0.6, changefreq: "monthly" },
  { path: "/first-aid-kit", priority: 0.6, changefreq: "monthly" },
  { path: "/about", priority: 0.5, changefreq: "monthly" },
  { path: "/contact", priority: 0.3, changefreq: "yearly" },
  { path: "/disclosure", priority: 0.3, changefreq: "yearly" },
  { path: "/privacy", priority: 0.2, changefreq: "yearly" },
  { path: "/terms", priority: 0.2, changefreq: "yearly" },
];

// NEVER indexed: traveler-private, auth, gated, or hand-off routes.
// (/profile /itinerary /signin /signup /verify /activation /welcome-back
//  /vc-demo /go — a person's trip and a gated investor demo stay out of search.)

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

type Url = { loc: string; priority: number; changefreq: string };
const urls: Url[] = STATIC_ROUTES.map((r) => ({ loc: ORIGIN + r.path, ...r }));

// Signature Interests — a landing page per way-to-travel.
for (const si of SIS) {
  urls.push({ loc: `${ORIGIN}/si/${si.id}`, priority: si.status === "live" ? 0.8 : 0.5, changefreq: "weekly" });
}
// Regions.
for (const r of REGIONS) {
  urls.push({ loc: `${ORIGIN}/region/${r.code}`, priority: r.status === "live" ? 0.8 : 0.5, changefreq: "weekly" });
}
// Destinations — the dossier pages. These carry the Q&A + FAQPage JSON-LD, so
// they're the ones that matter most for search and AI citation.
let destCount = 0;
for (const list of Object.values(DESTINATIONS)) {
  for (const d of list) {
    if (d.status !== "live") continue;                       // don't index future placeholders
    urls.push({
      loc: `${ORIGIN}/destination/${d.id}`,
      priority: d.depth === "verified" ? 0.9 : 0.6,          // deep dossiers rank first
      changefreq: "monthly",
    });
    destCount++;
  }
}
// Guides.
for (const g of GUIDES) urls.push({ loc: `${ORIGIN}/guide/${g.id}`, priority: 0.7, changefreq: "monthly" });

const today = process.env.SITEMAP_DATE || new Date().toISOString().slice(0, 10);
const body = urls
  .map((u) => `  <url>\n    <loc>${esc(u.loc)}</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>${u.changefreq}</changefreq>\n    <priority>${u.priority.toFixed(1)}</priority>\n  </url>`)
  .join("\n");

const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemap.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`
  .replace("http://www.sitemap.org", "http://www.sitemaps.org"); // correct namespace

writeFileSync("public/sitemap.xml", xml);
console.log(`sitemap.xml → ${urls.length} urls  (${destCount} destinations, ${SIS.length} interests, ${REGIONS.length} regions, ${GUIDES.length} guides, ${STATIC_ROUTES.length} static)`);
