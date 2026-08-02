import { useState } from "react";
import { Link } from "react-router-dom";
import { Icon } from "@/lib/icons";
import type { Provider, Price, Tier } from "@/data/places";
import type { Well } from "@/data/taxonomy";
import { Eyebrow } from "@/components/ui/primitives";
import { useStore } from "@/store/useStore";
import { useWells, useProviders, useRegions } from "@/store/useCatalog";
import { matchProviders } from "@/lib/matching";
import { track } from "@/lib/track";

const TIER: Record<Tier, string> = { prime: "★ Prime", vetted: "Vetted", prospective: "Prospective" };
const PRICE_LABEL: Record<Price, string> = { essential: "Essential", comfort: "Comfort", premier: "Premier", luxury: "Luxury", ultra: "Ultra" };
const PRICE_DOT: Record<Price, string> = { essential: "#3F7E55", comfort: "#2C6E68", premier: "#C2A35B", luxury: "#BE9233", ultra: "#A8873F" };
const PAGE = 6;

/* ---- the traveler's trip context (mock, mirrors the itinerary) ---- */
const TRIP = {
  title: "Kenya: Anniversary Safari",
  region: "East Africa",
  party: "2 travelers",
  dates: "Jul 12–22, 2026",
  budget: "comfort" as Price,
  interests: ["safari", "romance"],
  // Wells active in this trip, in priority order
  wells: ["stay", "activities", "eat", "fly", "move", "beauty"],
};

const tierRank: Record<Tier, number> = { prime: 0, vetted: 1, prospective: 2 };

/* contextual reason a provider fits this trip */
function whyFits(p: Provider, regionName: string): React.ReactNode[] {
  const reasons: React.ReactNode[] = [];
  if (p.price === TRIP.budget) reasons.push(<>fits your <b>{PRICE_LABEL[p.price]}</b> budget</>);
  else if ((p.price === "premier" || p.price === "luxury" || p.price === "ultra") && TRIP.budget === "comfort") reasons.push(<>a worthwhile <b>splurge</b> for an anniversary</>);
  if (p.tier === "prime") reasons.push(<><b>Prime</b> — most deeply vetted</>);
  reasons.push(<>in <b>{regionName}</b></>);
  return reasons.slice(0, 2);
}

function sortProviders(list: Provider[]): Provider[] {
  return list.slice().sort((a, b) =>
    (a.price === TRIP.budget ? -1 : 0) - (b.price === TRIP.budget ? -1 : 0) ||
    tierRank[a.tier] - tierRank[b.tier] || a.name.localeCompare(b.name));
}

export default function Providers() {
  const { addToTrip, openPanel, journeySIs, region } = useStore();
  const providers = useProviders();
  const wells = useWells();
  const regions = useRegions();
  const allWells: Record<string, Well> = {};
  wells.forEach((wl) => (allWells[wl.id] = wl));
  const [activeWell, setActiveWell] = useState(TRIP.wells[0]);
  const [shown, setShown] = useState(PAGE);

  // Step 2 of the keystone: the provider list now responds to the real journey
  // (chosen SIs + region) instead of the mock TRIP. Region/title/dates on the
  // context card stay illustrative until journey metadata is captured.
  const regionName = region ? regions.find((r) => r.code === region)?.name ?? TRIP.region : TRIP.region;

  const selectWell = (wid: string) => {
    setActiveWell(wid);
    setShown(PAGE);
    // "Considered" signal: which Well's providers they browsed (+ the top names),
    // so Atlas can later note what they looked at but didn't add.
    track({ kind: "view", entity: "well", entityId: wid, context: { surface: "providers", providers: (providers[wid] || []).slice(0, 3).map((p) => p.name) } });
  };

  const w = allWells[activeWell];
  const { matched, fellBack } = matchProviders(providers[activeWell] || [], { si: journeySIs, region });
  const pool = sortProviders(matched);
  const visible = pool.slice(0, shown);

  return (
    <>
      <div className="jn-subhead">
        <div className="jn-subhead__inner">
          <nav className="jn-crumbs" aria-label="Breadcrumb">
            <Link to="/">Home</Link><span className="sep">/</span>
            <Link to="/wells">The Wells</Link><span className="sep">/</span>
            <span className="here">Providers</span>
          </nav>
          <Link className="btn btn-ghost" to="/itinerary">Open your trip →</Link>
        </div>
      </div>

      {/* trip context */}
      <div className="pr-ctx">
        <div className="pr-ctx__inner">
          <span className="pr-ctx__ic"><Icon name="bag" /></span>
          <div>
            <div className="pr-ctx__t">{TRIP.title}</div>
            <div className="pr-ctx__m">
              <span><Icon name="pin" small /> {regionName}</span>
              <span><Icon name="calendar" small /> {TRIP.dates}</span>
              <span><Icon name="heart" small /> {TRIP.party}</span>
              <span><Icon name="gift" small /> {PRICE_LABEL[TRIP.budget]} budget</span>
            </div>
          </div>
          <Link className="btn btn-secondary pr-ctx__edit" to="/profile">Edit trip</Link>
        </div>
      </div>

      <main id="main">
        <div className="container">
          <div className="pr-intro">
            <Eyebrow>Matched to your trip</Eyebrow>
            <h1>Providers chosen for the two of you.</h1>
            <p className="lead">No endless catalog — just the vetted partners that fit your Wells, your region and your budget. Pick a Well to see its best matches.</p>
          </div>

          <div className="pr-wells" role="group" aria-label="Filter by Well">
            {TRIP.wells.map((wid) => {
              const ww = allWells[wid];
              const n = (providers[wid] || []).length;
              return (
                <button key={wid} className="pr-wellchip" aria-pressed={wid === activeWell} onClick={() => selectWell(wid)}>
                  <Icon name={ww.icon} small /> {ww.name.replace("-Well", "")} <span className="pr-wellchip__n">{n}</span>
                </button>
              );
            })}
          </div>

          <div className="pr-sechead">
            <h2>{w.name}</h2>
            <span className="sub">· {w.tag}</span>
            <span className="count">showing {visible.length} of {pool.length}</span>
          </div>

          {fellBack && (
            <p style={{ color: "var(--muted-foreground)", fontSize: 13.5, margin: "0 0 14px", display: "flex", gap: 6, alignItems: "center" }}>
              <Icon name="info" small /> Showing our current partners — we're adding matches for {regionName} as the catalog grows.
            </p>
          )}

          <div className="pr-grid">
            {visible.length ? (
              visible.map((p) => {
                const affiliate = p.mode === "affiliate";
                const prospective = p.tier === "prospective";
                return (
                  <article className="pv" key={p.name} data-pv={p.name}>
                    <div className="pv__body">
                      <div className="pv__top"><h3 className="pv__name">{p.name}</h3><span className={`pv__tier pv__tier--${p.tier}`}>{TIER[p.tier]}</span></div>
                      <p className="pv__desc">{p.desc}</p>
                      <div className="pv__attrs">
                        <span className="pv__attr"><Icon name={w.icon} small /> {w.name}</span>
                        <span className="pv__attr"><span className="dot" style={{ background: PRICE_DOT[p.price] }} />{PRICE_LABEL[p.price]}</span>
                        {prospective && <span className="pv__attr" style={{ color: "var(--muted-foreground)" }}><Icon name="info" small /> Prospective — not yet signed</span>}
                      </div>
                      <div className="pv__why"><Icon name="sparkle" small /> <span>{whyFits(p, regionName).map((r, i) => <span key={i}>{i > 0 ? " · " : ""}{r}</span>)}</span></div>
                    </div>
                    <div className="pv__foot">
                      <div className="pv__cta-row">
                        {affiliate ? (
                          <>
                            <a className="btn btn-primary" href={`/go?to=${encodeURIComponent(p.name)}`}>Visit partner</a>
                            <span className="pv__mode"><Icon name="arrow" small /> via /go</span>
                          </>
                        ) : (
                          <>
                            <button className="btn btn-primary" onClick={() => addToTrip({ well: w.id, icon: w.icon, name: p.name, meta: `${w.name} · ${TRIP.region}`, status: "idea" })}>Book It</button>
                            <span className="pv__mode"><Icon name="check" small /> In TravelWell</span>
                          </>
                        )}
                      </div>
                      {affiliate && <p className="pv__ftc"><Icon name="info" small /> <span>{p.commission}. We may earn a commission if you book through this link — at no extra cost to you.</span></p>}
                    </div>
                  </article>
                );
              })
            ) : (
              <div style={{ gridColumn: "1/-1", textAlign: "center", padding: "48px 20px", color: "var(--muted-foreground)" }}>
                <Icon name="info" />
                <div style={{ marginTop: 10 }}>No vetted partners here yet for {TRIP.region} — we're curating them now.</div>
              </div>
            )}
          </div>

          <div className="pr-more">
            {pool.length > shown && (
              <button className="btn btn-secondary" onClick={() => setShown((s) => s + PAGE)}>
                Show {Math.min(PAGE, pool.length - shown)} more in {w.name.replace("-Well", "")}
              </button>
            )}
          </div>

          <p className="pr-foot-note">
            <Icon name="shield" small /> <span>Every match is scoped to your trip. Looking for something specific? <a href="#" onClick={(e) => { e.preventDefault(); openPanel("concierge"); }} style={{ fontWeight: 600 }}>Ask the Concierge</a>.</span>
          </p>
        </div>
        <div style={{ height: 80 }} />
      </main>
    </>
  );
}
