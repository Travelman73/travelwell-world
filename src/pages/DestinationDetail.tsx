import { Link, useParams } from "react-router-dom";
import { destinationJsonLd, useJsonLd } from "@/lib/jsonld";
import { Icon } from "@/lib/icons";
import { resolveDestId, type Destination, type Provider } from "@/data/places";
import type { Region, Well } from "@/data/taxonomy";
import { img } from "@/lib/images";
import { useDestinationImage } from "@/lib/unsplash";
import { useStore } from "@/store/useStore";
import { useRegions, useWells, useProviders, useDestinations, useGuides } from "@/store/useCatalog";
import { cx } from "@/lib/utils";
import { resolveSafety, isoForCountry, SAFE_HEADER_COLOR } from "@/data/safety-data";
import { CheckItYourself } from "@/components/ui/CheckItYourself";
import { GlobalAdvisoryNote } from "@/components/ui/GlobalAdvisoryNote";
import { getEmergencyNumbers, UNIVERSAL_EMERGENCY } from "@/data/emergency-numbers";

const TIER: Record<string, string> = { prime: "★ Prime", vetted: "Vetted", prospective: "Prospective" };

/**
 * Find a destination by id across every region's list; return it with its region
 * and sibling list. Accepts a LEGACY slug (`/destination/paris` → `paris-france`)
 * — shared links and saved trips still carry the pre-rename ids, and the fallback
 * below hands back a *different* destination rather than erroring, so an
 * unresolved id shows a confidently wrong page. Resolve before matching.
 */
function findDestination(
  regions: Region[],
  destinations: Record<string, Destination[]>,
  rawId?: string
): { dest: Destination; region: Region; list: Destination[] } {
  const id = resolveDestId(rawId);
  const fallbackRegion = regions.find((r) => r.code === "05A")!;
  for (const r of regions) {
    const list = destinations[r.code] || [];
    const dest = list.find((d) => d.id === id);
    if (dest) return { dest, region: r, list };
  }
  const list = destinations[fallbackRegion.code] || [];
  const stub: Destination = { id: "x", name: id || "This place", country: fallbackRegion.name, line: "A destination in " + fallbackRegion.name, status: "live", depth: "stub", img: "mountainValley" };
  return { dest: list[0] || stub, region: fallbackRegion, list };
}

function providersByWell(allWells: Record<string, Well>, providers: Record<string, Provider[]>, regionCode?: string): { well: Well; items: Provider[] }[] {
  const groups: { well: Well; items: Provider[] }[] = [];
  (["stay", "activities", "eat", "move"] as const).forEach((wid) => {
    const all = providers[wid] || [];
    // Prefer providers curated for THIS region (the matching is the product);
    // fall back to the general pool only if we don't carry region-specific ones.
    const regional = regionCode ? all.filter((p) => p.region === regionCode) : [];
    const pool = (regional.length ? regional : all).slice(0, 4);
    if (pool.length) groups.push({ well: allWells[wid], items: pool });
  });
  return groups;
}

export default function DestinationDetail() {
  const { id } = useParams();
  const { openPanel } = useStore();
  const regions = useRegions();
  const wells = useWells();
  const providers = useProviders();
  const destinations = useDestinations();
  const guides = useGuides();
  const allWells: Record<string, Well> = {};
  wells.forEach((w) => { allWells[w.id] = w; });
  const { dest: DEST, region: R, list } = findDestination(regions, destinations, id);
  const country = DEST.country || R.name;
  // AEO: emit TouristDestination + FAQ (buffet Q&A) structured data so answer
  // engines can parse the page into quotable chunks. (Authoritative once the
  // SSG socket bakes it into the served <head>; client-injected here for now.)
  useJsonLd(destinationJsonLd(DEST, R.name, typeof window !== "undefined" ? window.location.href : ""));
  const stub = DEST.depth !== "verified";
  const data = DEST.data;                       // the dossier body (jewels, faq, …)
  const jewels = data?.jewels ?? [];
  const faq = data?.faq ?? [];

  // Destination-matched Unsplash hero, with the bundled image as instant fallback.
  const hero = useDestinationImage(DEST, 1800, img(DEST.img, 1800));

  const iso = isoForCountry(country);
  // THE CASCADE: country advisory, then this destination's own carve-out if the
  // dossier declares one (ingest contract §3). Previously only the country level
  // was read, so a named-zone exclusion in a dossier never reached the page.
  const s = resolveSafety(DEST, iso);
  // Local emergency line joins off the same ISO key (David's emergency-numbers data).
  const localEmergency = iso ? (getEmergencyNumbers(iso).emergency || UNIVERSAL_EMERGENCY) : UNIVERSAL_EMERGENCY;

  const groups = providersByWell(allWells, providers, R.code);

  const relGuides = (() => {
    // Interest-matched (moat #6 — "it knows where you are"). Destinations that
    // declare their Signature Interests (all the full-literal ones, incl. alpine)
    // match by SI only — so a Zermatt page shows ski guides, never safari or a
    // culinary guide that happens to share the alpine region code. Legacy rows with
    // no SIs (the D() safari set) fall back to region match so they still surface
    // their safari guides. Empty until a region's guides ingest beats off-topic ones.
    const sis = DEST.si ?? [];
    const matched = sis.length
      ? guides.filter((gg) => sis.includes(gg.si))
      : guides.filter((gg) => gg.region === R.code);
    return matched.slice(0, 2);
  })();

  return (
    <>
      <div className="jn-subhead">
        <div className="jn-subhead__inner">
          <nav className="jn-crumbs" aria-label="Breadcrumb">
            <Link to="/">Home</Link><span className="sep">/</span>
            <Link to="/regions">Regions</Link><span className="sep">/</span>
            <Link to={`/region/${R.code}`}>{R.name}</Link><span className="sep">/</span>
            <span className="here">{DEST.name}</span>
          </nav>
        </div>
      </div>

      <section className={cx("dd-hero", stub && "dd-hero--stub")}>
        <div className="dd-hero__img"><img src={hero.src} alt={DEST.name} referrerPolicy="no-referrer" loading="lazy" /></div>
        <div className="dd-hero__scrim" />
        {hero.credit && (
          <span style={{ position: "absolute", bottom: 8, insetInlineEnd: 12, zIndex: 3, fontSize: 11, color: "rgba(255,255,255,.8)" }}>
            {/* Only claim Unsplash when it IS one — a pinned editorial hero may come
                from an operator or our own shoot, and mislabelling the source is
                both wrong and an attribution problem. */}
            Photo · <a href={hero.credit.link} target="_blank" rel="noopener noreferrer" style={{ color: "inherit", textDecoration: "underline" }}>{hero.credit.name}</a>
            {/unsplash\.com/i.test(hero.credit.link) ? " / Unsplash" : ""}
          </span>
        )}
        <div className="dd-hero__inner">
          <div className="dd-hero__country">{country} · {R.name}</div>
          <h1 className="dd-hero__title">{DEST.name}</h1>
          <p className="dd-hero__line">{DEST.line}</p>
          <div className="dd-hero__badges">
            {stub
              ? <span className="pill pill-preview" style={{ background: "rgba(255,255,255,.86)" }}>Preview destination</span>
              : <span className="pill pill-live" style={{ background: "rgba(255,255,255,.92)" }}>Live destination</span>}
            <span className="pill pill-engine">In the {R.name} journey</span>
          </div>
        </div>
      </section>

      <div className="dd-body">
        <div className="dd-main">
          <p className="dd-desc">{DEST.line}. {stub ? "" : "Below, everything you need here — grouped by the Wells that matter, with vetted providers and straight pricing."}</p>

          {stub && (
            <div className="dd-stub-notice">
              <Icon name="info" small />
              <span><b>This destination is a preview.</b> We have it in our taxonomy but haven't finished curating providers here yet. You can still add it to your trip as an idea, and we'll fill it in — or write it in via the Wells step.</span>
            </div>
          )}

          {!stub && groups.map((gr) => (
            <div className="dd-stack" key={gr.well.id}>
              <div className="dd-stack__head">
                <div className="dd-stack__ic"><Icon name={gr.well.icon} /></div>
                <div>
                  <div className="dd-stack__name">{gr.well.name}</div>
                  <div className="dd-stack__tag">{gr.well.tag}</div>
                </div>
                <span className="dd-stack__count">{gr.items.length} options</span>
              </div>
              <div className="dd-pvlist">
                {gr.items.map((p) => (
                  <div className="dd-pv" key={p.name}>
                    <div className="dd-pv__top">
                      <div className="dd-pv__name">{p.name}</div>
                      <span className={`dd-pv__tier dd-pv__tier--${p.tier}`}>{TIER[p.tier]}</span>
                    </div>
                    <div className="dd-pv__desc">{p.desc}</div>
                    <div className="dd-pv__row">
                      <button className="btn btn-primary" onClick={() => openPanel("concierge")} style={{ minHeight: 38, padding: "0 16px", fontSize: 13 }}>Book It</button>
                      <span className="pv__mode" style={{ fontSize: 11.5, color: "var(--muted-foreground)" }}>{p.mode === "affiliate" ? "Opens partner site" : "Book in TravelWell"}</span>
                    </div>
                    {p.mode === "affiliate" && (
                      <p className="dd-pv__ftc"><Icon name="info" small /> <span>{p.commission}. We may earn a commission — at no extra cost to you.</span></p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}

          {jewels.length > 0 && (
            <div className="dd-jewels">
              <h2 className="dd-jewels__title">Don't-miss jewels</h2>
              <div className="dd-jewels__list">
                {jewels.map((j, i) => (
                  <div className="dd-jewel" key={i}>
                    <span className="dd-jewel__ic"><Icon name="sparkle" small /></span>
                    <div className="dd-jewel__b">
                      <div className="dd-jewel__head">
                        <span className="dd-jewel__name">{j.name}</span>
                        {j.tier && <span className="dd-jewel__tier">{j.tier.charAt(0).toUpperCase() + j.tier.slice(1)}</span>}
                      </div>
                      {j.blurb && <p className="dd-jewel__blurb">{j.blurb}</p>}
                      {(j.when || j.commission) && (
                        <div className="dd-jewel__meta">
                          {j.when && <span><Icon name="calendar" small /> {j.when}</span>}
                          {j.commission && <span><Icon name="info" small /> {j.commission}</span>}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {faq.length > 0 && (
            <div className="dd-faq">
              <h2 className="dd-faq__title">Good to know</h2>
              {faq.map((f, i) => (
                <details className="dd-faq__item" key={i}>
                  <summary className="dd-faq__q">{f.q}</summary>
                  <div className="dd-faq__a">{f.a}{f.source && <span className="dd-faq__src"> · {f.source}</span>}</div>
                </details>
              ))}
            </div>
          )}
        </div>

        <aside className="dd-side">
          <div className="safety-card">
            {/* An unverified card must NOT assert a level we don't have — show "?"
                and "Not yet verified" instead of inventing "Level 1 of 4". */}
            <div className="safety-card__top" style={{ background: SAFE_HEADER_COLOR[s.lvl] }}>
              <div className="safety-card__lvl">{s.unverified ? "?" : s.lvl}</div>
              <div>
                <div className="safety-card__title">{s.unverified ? "Safety Card · Not yet verified" : `Safety Card · Level ${s.lvl} of 4`}</div>
                <div className="safety-card__level-label">{s.label}</div>
              </div>
            </div>
            <div className="safety-card__body">
              {s.carveOut && (
                // A traveler who just read the country advisory will see a
                // different number here. Name both, or it reads as an error.
                <div className="safety-row safety-row--carve">
                  <span className="safety-row__ic"><Icon name="pin" small /></span>
                  <span>
                    <span className="safety-row__k">This destination specifically:</span> the {country}-wide advisory is
                    Level {s.carveOut.countryLevel} ({s.carveOut.countryLabel}); this place carries its own level, shown above.
                  </span>
                </div>
              )}
              {s.bookingHold && (
                <div className="safety-row safety-row--hold">
                  <span className="safety-row__ic"><Icon name="info" small /></span>
                  <span><span className="safety-row__k">Not bookable with us right now.</span> We keep the page so you can read it &mdash; we won&rsquo;t sell you a trip here while this stands.</span>
                </div>
              )}
              <div className="safety-row"><span className="safety-row__ic"><Icon name="info" small /></span><span>{s.summary}</span></div>
              {s.considerations.map((c, i) => (
                <div className="safety-row" key={i}><span className="safety-row__ic"><Icon name="pin" small /></span><span>{c}</span></div>
              ))}
              {s.medical && (
                <div className="safety-row"><span className="safety-row__ic"><Icon name="cross" small /></span><span><span className="safety-row__k">Medical:</span> {s.medical}</span></div>
              )}
              <div className="safety-row"><span className="safety-row__ic"><Icon name="hospital" small /></span><span><span className="safety-row__k">Nearest hospital surfaced via</span> the Emergency Button</span></div>
              <div className="safety-row"><span className="safety-row__ic"><Icon name="phone" small /></span><span><span className="safety-row__k">Local emergency:</span> {localEmergency}{localEmergency !== UNIVERSAL_EMERGENCY ? ` / ${UNIVERSAL_EMERGENCY}` : ""}</span></div>
            </div>
            <div className="safety-card__foot">
              <span className="safety-card__source"><Icon name="shield" small /> {s.source}</span>
              {s.verified && <span style={{ marginInlineStart: "auto" }}>Verified {s.verified}</span>}
            </div>
          </div>

          {/* Worldwide advisories sit ABOVE the country level, never folded into
              it — a global caution doesn't change this country's number, and
              merging them would misreport both. */}
          <GlobalAdvisoryNote />

          <CheckItYourself country={country} iso={iso} verified={s.verified} unverified={s.unverified} />

          <div className="dd-quick">
            <h4>At a glance</h4>
            <div className="dd-quick__row"><span className="dd-quick__k">Country</span><span className="dd-quick__v">{country}</span></div>
            <div className="dd-quick__row"><span className="dd-quick__k">Region</span><span className="dd-quick__v">{R.name}</span></div>
            <div className="dd-quick__row"><span className="dd-quick__k">Gateways</span><span className="dd-quick__v" style={{ fontFamily: "var(--font-mono)", fontSize: 12 }}>{R.gateways}</span></div>
            <div className="dd-quick__row"><span className="dd-quick__k">Status</span><span className="dd-quick__v">{stub ? "Preview" : "Live"}</span></div>
          </div>

          <div className="dd-addcta">
            <p>Love it here? Add {DEST.name} to your trip and keep building.</p>
            <button className="btn btn-primary" style={{ width: "100%" }} onClick={() => openPanel("concierge")}>Add {DEST.name} to trip</button>
          </div>
        </aside>
      </div>

      <div className="dd-related">
        <h2>Keep exploring</h2>
        <p className="dd-related__sub">Guides to read before you go, and nearby places worth adding to your trip.</p>
        <div className="dd-rel-grid">
          {relGuides.map((gg) => (
            <Link className="dd-rel" to={`/guide/${gg.id}`} key={gg.id}>
              <div className="dd-rel__media"><img src={img(gg.img, 500)} alt="" loading="lazy" referrerPolicy="no-referrer" /><span className="dd-rel__chip dd-rel__chip--guide">Guide</span></div>
              <div className="dd-rel__b"><div className="dd-rel__t">{gg.title}</div><div className="dd-rel__m"><Icon name="info" small /> {gg.read} read</div></div>
            </Link>
          ))}
          {list.filter((d) => d.id !== DEST.id).slice(0, 2).map((d) => (
            <Link className="dd-rel" to={`/destination/${d.id}`} key={d.id}>
              <div className="dd-rel__media"><img src={img(d.img, 500)} alt="" loading="lazy" referrerPolicy="no-referrer" /><span className="dd-rel__chip dd-rel__chip--nearby">Nearby</span></div>
              <div className="dd-rel__b"><div className="dd-rel__t">{d.name}</div><div className="dd-rel__m"><Icon name="pin" small /> {d.country}</div></div>
            </Link>
          ))}
        </div>
      </div>
      <div style={{ height: 80 }} />
    </>
  );
}
