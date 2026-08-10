/**
 * Structured data (JSON-LD) for AI answer engines + search (AEO).
 *
 * Emits schema.org `TouristDestination` + — when a dossier carries buffet Q&A
 * in `data.faq` — a `FAQPage`, so crawlers parse the page into clean, quotable
 * chunks (David's buffet-block strategy, machine-readable).
 *
 * AUTHORITATIVE when baked into the server-rendered <head> (the SSG socket —
 * that's where this belongs long-term). Injected client-side here as a stopgap:
 * JS-rendering crawlers (Google) read it now; pure answer-engine bots need the
 * SSG render to see it. So this is real prep, not the finish line.
 */
import { useEffect } from "react";
import type { Destination } from "@/data/places";
import type { SiData } from "@/data/taxonomy";

/**
 * The organization record lives STATICALLY in index.html so a crawler that
 * doesn't run JavaScript still reads the brand spelled correctly — it is the
 * field an answer engine quotes when it names us. Page-level objects reference
 * it by @id rather than restating the name, so the brand string exists in
 * exactly one place and can't drift to two words in one of them.
 */
const PUBLISHER = { "@id": "https://travelwell.world/#organization" };

interface Faq { q: string; a: string; source?: string }

/** Build the JSON-LD objects for a destination page. */
export function destinationJsonLd(d: Destination, regionName: string, url: string): object[] {
  const out: object[] = [
    {
      "@context": "https://schema.org",
      "@type": "TouristDestination",
      name: d.name,
      description: d.line,
      address: { "@type": "PostalAddress", addressCountry: d.country, addressRegion: regionName },
      publisher: PUBLISHER,
      ...(url ? { url } : {}),
    },
  ];
  const faq = (d.data as { faq?: Faq[] } | undefined)?.faq;
  if (faq?.length) {
    out.push({
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: faq.map((f) => ({
        "@type": "Question",
        name: f.q,
        acceptedAnswer: { "@type": "Answer", text: f.source ? `${f.a} (Source: ${f.source})` : f.a },
      })),
    });
  }
  return out;
}

/**
 * Build the JSON-LD for a Special-Interest page from its nine-layer dossier —
 * `TouristTrip` always, plus `FAQPage` (layer 7) and one `Event` per dated
 * entry in the look-ahead (layer 4b). These are the three types the dossier's
 * own layer-9 manifest names.
 */
export function siJsonLd(
  si: { id: string; name: string; sig: string; data?: SiData },
  url: string
): object[] {
  const d = si.data ?? {};
  const out: object[] = [
    {
      "@context": "https://schema.org",
      "@type": "TouristTrip",
      name: si.name,
      description: d.seo?.description || si.sig,
      publisher: PUBLISHER,
      ...(url ? { url } : {}),
      ...(d.seo?.keywords?.length ? { keywords: d.seo.keywords.join(", ") } : {}),
    },
  ];
  if (d.faq?.length) {
    out.push({
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: d.faq.map((f) => ({
        "@type": "Question",
        name: f.q,
        acceptedAnswer: { "@type": "Answer", text: f.source ? `${f.a} (Source: ${f.source})` : f.a },
      })),
    });
  }
  for (const e of d.events ?? []) {
    // Only emit an Event when we have a real date. schema.org requires startDate,
    // and a year alone would have to be faked into "2027-01-01" — a wrong date is
    // worse than no structured data, so year-only entries render but don't emit.
    if (!e.starts_on) continue;
    out.push({
      "@context": "https://schema.org",
      "@type": "Event",
      name: e.name,
      startDate: e.starts_on,
      ...(e.ends_on ? { endDate: e.ends_on } : {}),
      ...(e.place ? { location: { "@type": "Place", name: e.place } } : {}),
      ...(e.note ? { description: e.note } : {}),
    });
  }
  return out;
}

/** Inject JSON-LD into <head> for the current page; cleans up on unmount. */
export function useJsonLd(objs: object[]) {
  const key = JSON.stringify(objs);
  useEffect(() => {
    if (typeof document === "undefined") return;
    const nodes = (JSON.parse(key) as object[]).map((obj) => {
      const s = document.createElement("script");
      s.type = "application/ld+json";
      s.text = JSON.stringify(obj);
      document.head.appendChild(s);
      return s;
    });
    return () => nodes.forEach((n) => n.remove());
  }, [key]);
}
