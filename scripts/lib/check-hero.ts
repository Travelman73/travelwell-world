/**
 * The editorial hero image, and the licence that has to travel with it.
 *
 * ONE RULE, ONE PLACE. Both gates check `data.hero` — destinations and Signature
 * Interests — and they had drifted: the destination gate warned about a missing
 * credit, the SI gate said nothing at all. Two answers to one question is how a
 * rule stops being a rule, so it lives here and both import it.
 *
 * WHY A PINNED URL IS DIFFERENT FROM A QUERY. `data.hero` is read at render
 * (`src/lib/unsplash.ts` — `useSiImage` / `useDestinationImage`): a pinned
 * https URL wins outright, otherwise `query` drives the image search, otherwise
 * the place's name does. A query is not a choice of photograph — the proxy
 * resolves it and attributes at render. A pinned URL IS a choice: a specific
 * third-party photograph, selected by us, published on an editorial page. That
 * is the one that needs its provenance recorded, and the one that draws a
 * letter if it isn't.
 *
 * David's nineteen-rules v3 listed this as "image copyright and licensing
 * provenance — no rule exists anywhere, and it needs one before launch." It was
 * narrower than that: the `credit` field already existed and nothing required
 * filling it. This is the rule.
 */
export interface HeroIssues {
  errs: string[];
  warns: string[];
}

export function checkHero(at: string, raw: unknown, out: HeroIssues): void {
  if (raw == null) return;
  if (typeof raw !== "object" || Array.isArray(raw)) {
    out.errs.push(`${at}: data.hero must be an object { url?, query?, credit? }`);
    return;
  }
  const hero = raw as { url?: unknown; query?: unknown; credit?: unknown };
  const isHttps = typeof hero.url === "string" && /^https:\/\//i.test(hero.url);

  if (hero.url != null && !isHttps) {
    out.errs.push(`${at}: data.hero.url must be an absolute https:// URL — an http image is blocked on a secure page (got ${JSON.stringify(hero.url)})`);
  }

  if (isHttps) {
    const c = hero.credit as { name?: unknown; link?: unknown; source?: unknown } | undefined;
    if (!c || typeof c !== "object" || Array.isArray(c)) {
      out.errs.push(`${at}: data.hero pins a URL with no "credit" — a photograph we chose and publish needs its provenance recorded: { name, link?, source? }`);
    } else if (!c.name) {
      out.errs.push(`${at}: data.hero.credit has no "name" — who took it, or who licensed it to us.`);
    } else if (!c.link && !c.source) {
      out.warns.push(`${at}: data.hero.credit names "${String(c.name)}" but carries neither "link" nor "source" — nothing to check the licence against later.`);
    }
  }

  if (!isHttps) {
    if (hero.query != null && typeof hero.query !== "string") {
      out.errs.push(`${at}: data.hero.query must be a string (the image search phrase)`);
    }
    if (hero.query == null) {
      out.warns.push(`${at}: data.hero is present but pins neither a url nor a query — it falls through to the name-matched photo, same as carrying no hero at all.`);
    }
  }
}
