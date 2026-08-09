import { useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { Icon } from "@/lib/icons";
import { type Well } from "@/data/taxonomy";
import { useWells, useSiCount, useRegionCount, useWellCount } from "@/store/useCatalog";

/* ============================================================================
   TravelWell.World — Platform Demo (public) + gated VC Demo.
   Faithful rebuild of design_handoff_travelwell/demo.html + vc-demo.html.
   Both are standalone in the prototype but render inside the app Shell here,
   so we render page content only (the Shell provides header/footer).
   Every figure below is an illustrative placeholder, mirrored from the
   prototype's <script> data arrays — replace with audited data before use.
   ========================================================================== */

const ACCESS_CODE = "TWW2026";

// Placeholder-economics styling: the design wraps the "—" sentinels in .ph.
const Ph = ({ children }: { children: ReactNode }) => <span className="ph">{children}</span>;

/* ---- public demo data (mirrors demo.html <script>) ---- */
/** The taxonomy stat reads the live catalog — this page is shown to investors, so
 *  a stale count here is the most expensive place to have one. */
const stats = (si: number, regions: number, wells: number): { v: ReactNode; k: string; tag: string }[] => [
  { v: <><Ph>—</Ph>K</>, k: "Monthly travelers", tag: "Illustrative" },
  { v: <><Ph>$—</Ph>M</>, k: "Annualized GMV", tag: "Illustrative" },
  { v: `${si} / ${regions} / ${wells}`, k: "Interests · Regions · Wells", tag: "Live taxonomy" },
  { v: "200+", k: "Vetted providers", tag: "Onboarding" },
];

// All twelve Wells, each a revenue line (David: the VCs need to SEE all of them).
const REV: { id: string; model: string; take: string }[] = [
  { id: "stay", model: "Commission on bookings", take: "10–18%" },
  { id: "fly", model: "Affiliate + GDS", take: "1–3%" },
  { id: "eat", model: "Reservation + experience fees", take: "8–15%" },
  { id: "move", model: "Transfer commission", take: "10–20%" },
  { id: "activities", model: "Experience commission", take: "15–25%" },
  { id: "gear", model: "Retail affiliate", take: "4–10%" },
  { id: "beauty", model: "Booking commission", take: "10–20%" },
  { id: "shop", model: "Retail affiliate", take: "5–12%" },
  { id: "nanny", model: "Vetted-childcare commission", take: "10–20%" },
  { id: "security", model: "Close-protection commission", take: "10–15%" },
  { id: "insure", model: "Travel-insurance commission · at launch", take: "20–40%" },
  { id: "ship", model: "Logistics & shipping commission · at launch", take: "8–15%" },
];

const engines = (si: number, regions: number, wells: number): { ic: string; t: string; s: string }[] => [
  { ic: "compass", t: "SI-anchored SEO", s: `${si} interests × ${regions} regions × ${wells} Wells = thousands of high-intent landing pages, each a search entry point.` },
  { ic: "message", t: "The Concierge", s: "Conversational planning captures travelers who don't know where to start — and keeps them on-platform." },
  { ic: "sparkles", t: "Editorial desk", s: "Guides and seasonal content draw organic traffic and feed travelers into the journey." },
];

const DIFF: { ic: string; t: string; s: string }[] = [
  { ic: "globe", t: "Fixed taxonomy", s: "A structured demand graph, not an unbounded catalog — defensible, rankable, and machine-legible." },
  { ic: "shield", t: "Straight by design", s: "Live-vs-placeholder, FTC disclosure everywhere, real economics. Trust is the moat." },
  { ic: "bag2", t: "One itinerary, every Well", s: "We own the whole trip, not one booking — repeat surface area across ten needs." },
];

const osLayers = (wellNames: string[], si: number, regions: number): { n: string; c: string; chips: string[] }[] => [
  { n: "Demand layer", c: "taxonomy", chips: [`${si} Special Interests`, `${regions} Regions`, "Activities graph"] },
  { n: "Fulfillment layer", c: "wells", chips: wellNames.concat(["+ Nanny", "+ Security"]) },
  { n: "Engine layer", c: "engines", chips: ["Atlas concierge", "Provider matching", "Itinerary sync", "Safety Cards", "Seasonal logic"] },
  { n: "Data layer", c: "schemas", chips: ["Travel ID", "Itinerary blocks", "Provider catalog", "Commission ledger"] },
];

const STACK = ["React", "TypeScript", "Tailwind", "Supabase", "Postgres", "Edge functions", "Claude API", "Stripe (tokenized)", "Vercel", "Algolia"];

/* ---- VC demo data (mirrors vc-demo.html <script>) ---- */
const STD_TRIP: { well: string; item: string; gross: number; rate: string }[] = [
  { well: "fly", item: "Kenya Airways + bush flights", gross: 3800, rate: "2%" },
  { well: "stay", item: "Angama Mara · 4 nights", gross: 12400, rate: "14%" },
  { well: "activities", item: "Balloon + game drives + culture", gross: 4200, rate: "20%" },
  { well: "eat", item: "Bush dinners + Nairobi tables", gross: 1600, rate: "10%" },
  { well: "move", item: "Private transfers", gross: 900, rate: "15%" },
  { well: "beauty", item: "Couples spa", gross: 600, rate: "15%" },
];

// The Ultra sample — money made visible at luxury scale: two couples, private jet
// to Paris, commission itemized per Well and totalled (~$24K on one trip). The
// idea David's first MVP proved (Paris/Springsteen), rebuilt in the live engine.
const LUX_TRIP: { well: string; item: string; gross: number; rate: string }[] = [
  { well: "fly", item: "Private jet · Teterboro → Paris (round trip)", gross: 175000, rate: "3%" },
  { well: "stay", item: "Le Bristol · two suites · 5 nights", gross: 33000, rate: "15%" },
  { well: "activities", item: "Louvre after-hours · private Versailles · Champagne estate", gross: 23500, rate: "20%" },
  { well: "shop", item: "Personal shopper · Avenue Montaigne", gross: 46000, rate: "8%" },
  { well: "eat", item: "Michelin tastings · private chef · Seine dinner cruise", gross: 14000, rate: "12%" },
  { well: "gear", item: "Travel wardrobe + luggage", gross: 9000, rate: "8%" },
  { well: "security", item: "Discreet close protection · 2 outings", gross: 8000, rate: "12%" },
  { well: "move", item: "Chauffeured Mercedes S-Class · 5 days", gross: 7000, rate: "15%" },
  { well: "nanny", item: "Bilingual nanny · evenings", gross: 4500, rate: "15%" },
  { well: "beauty", item: "Couples spa · Dior Institut", gross: 3500, rate: "15%" },
];

const ROADMAP: { q: string; items: string[] }[] = [
  { q: "Q3 2026", items: ["Public launch", "Insure-Well live", "Stripe checkout"] },
  { q: "Q4 2026", items: ["Ship-Well live", "3 launch locales", "Registry"] },
  { q: "Q1 2027", items: ["Cross-device accounts", "Linked-group travel", "API partners x10"] },
  { q: "Q2 2027", items: ["Live status (flight/lift)", "eSIM nudges", "B2B concierge"] },
];

/* ============================================================================
   The shared disclaimer band.
   ========================================================================== */
function Disclaimer({ children }: { children: ReactNode }) {
  return (
    <div className="inv-disclaimer">
      <div className="inv-disclaimer__inner">
        <Icon name="info" small />
        <span>{children}</span>
      </div>
    </div>
  );
}

/* ============================================================================
   Public platform demo.
   ========================================================================== */
function PublicDemo() {
  const wells = useWells();
  // Published counts, from the live catalog (see useCatalog).
  const siCount = useSiCount();
  const regionCount = useRegionCount();
  const wellCount = useWellCount();
  const allWells: Record<string, Well> = {};
  wells.forEach((w) => { allWells[w.id] = w; });
  const OS_LAYERS = osLayers(wells.filter((w) => !w.lux).map((w) => w.name), siCount, regionCount);
  const STATS = stats(siCount, regionCount, wellCount);
  const ENGINES = engines(siCount, regionCount, wellCount);
  return (
    <div className="inv">
      <Disclaimer>
        <b>Illustrative figures.</b> Every metric on this page is a design placeholder — replace with audited data before any investor use. TravelWell never fabricates economics.
      </Disclaimer>

      <main id="main">
        <section className="inv-hero">
          <div className="inv-wrap inv-hero__inner">
            <span className="eyebrow">Platform Demo · Public</span>
            <h1>A Travel Operating System.</h1>
            <p>Not a booking site with a blog — an engine that organizes global travel demand into a fixed taxonomy and routes every traveler from interest to booked trip, monetized through disclosed partners.</p>
            <div className="inv-hero__tabs">
              <Link className="inv-hero__tab" to="/demo" aria-current="true">Public</Link>
              <Link className="inv-hero__tab" to="/vc-demo">VC Demo →</Link>
              <Link className="inv-hero__tab" to="/about">Architecture →</Link>
            </div>
            <div className="inv-stats" style={{ marginTop: 36 }}>
              {STATS.map((s) => (
                <div className="inv-stat" key={s.k}>
                  <div className="inv-stat__v">{s.v}</div>
                  <div className="inv-stat__k">{s.k}</div>
                  <span className="inv-stat__tag">{s.tag}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="inv-section">
          <div className="inv-wrap">
            <div className="inv-section__head">
              <span className="eyebrow">Revenue architecture</span>
              <h2>Every Well is a revenue line</h2>
              <p>Ten interconnected needs, each monetized through disclosed partners — diversified across booking models so no single channel is a point of failure.</p>
            </div>
            <div className="inv-rev">
              {REV.map((r) => {
                const w = allWells[r.id];
                return (
                  <div className="inv-rev__row" key={r.id}>
                    <div className="inv-rev__ic"><Icon name={w.icon} /></div>
                    <div style={{ flex: 1 }}>
                      <div className="inv-rev__name">{w.name}</div>
                      <div className="inv-rev__model">{r.model}</div>
                    </div>
                    <div className="inv-rev__take">
                      <div className="v">{r.take}</div>
                      <div className="l">take rate</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <section className="inv-section">
          <div className="inv-wrap">
            <div className="inv-section__head">
              <span className="eyebrow">Traffic engines</span>
              <h2>How travelers arrive</h2>
            </div>
            <div className="inv-cards">
              {ENGINES.map((c) => (
                <div className="inv-card" key={c.t}>
                  <div className="inv-card__ic"><Icon name={c.ic} /></div>
                  <div className="inv-card__t">{c.t}</div>
                  <div className="inv-card__s">{c.s}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="inv-section">
          <div className="inv-wrap">
            <div className="inv-section__head">
              <span className="eyebrow">Why it wins</span>
              <h2>Differentiators</h2>
            </div>
            <div className="inv-cards">
              {DIFF.map((c) => (
                <div className="inv-card" key={c.t}>
                  <div className="inv-card__ic"><Icon name={c.ic} /></div>
                  <div className="inv-card__t">{c.t}</div>
                  <div className="inv-card__s">{c.s}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="inv-section">
          <div className="inv-wrap">
            <div className="inv-section__head">
              <span className="eyebrow">The OS</span>
              <h2>Architecture, layer by layer</h2>
              <p>A spec-first system: every layer is defined before it's built.</p>
            </div>
            <div className="inv-os">
              {OS_LAYERS.map((l) => (
                <div className="inv-os__layer" key={l.n}>
                  <div className="inv-os__label">
                    <div className="n">{l.n}</div>
                    <div className="c">{l.c}</div>
                  </div>
                  <div className="inv-os__chips">
                    {l.chips.map((c) => <span className="inv-os__chip" key={c}>{c}</span>)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="inv-section">
          <div className="inv-wrap">
            <div className="inv-section__head">
              <span className="eyebrow">Built on</span>
              <h2>Tech stack</h2>
            </div>
            <div className="inv-stack">
              {STACK.map((t) => <span className="inv-stack__item" key={t}>{t}</span>)}
            </div>
          </div>
        </section>

        <section className="inv-section" style={{ paddingBottom: 80 }}>
          <div className="inv-wrap">
            <div className="inv-os__layer" style={{ justifyContent: "space-between" }}>
              <div>
                <div className="inv-section__head" style={{ margin: 0 }}>
                  <h2 style={{ fontSize: 24 }}>Want the worked numbers?</h2>
                  <p>The VC demo adds a real itinerary, commission detail and a scaling model.</p>
                </div>
              </div>
              <Link className="btn btn-gold" to="/vc-demo">Open the VC demo →</Link>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

/* ============================================================================
   VC demo — access gate.
   ========================================================================== */
function Gate({ onUnlock }: { onUnlock: () => void }) {
  const [code, setCode] = useState("");
  const [err, setErr] = useState(false);

  const submit = () => {
    if (code.trim().toUpperCase() === ACCESS_CODE) {
      setErr(false);
      onUnlock();
    } else {
      setErr(true);
    }
  };

  return (
    <div className="inv">
      <main id="main">
        <div className="inv-gate">
          <div className="inv-gate__card">
            <div className="inv-gate__ic"><Icon name="lock" /></div>
            <h1>Investor access</h1>
            <p>This demo includes a worked itinerary with commission detail and a scaling model. Enter your access code to continue.</p>
            <div className="inv-gate__field">
              <input
                type="text"
                placeholder="ACCESS CODE"
                aria-label="Access code"
                autoComplete="off"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") submit(); }}
              />
            </div>
            <div className="inv-gate__err" data-show={err ? "true" : undefined}>
              <Icon name="info" small /> That code isn't right. Try again or request access.
            </div>
            <div className="inv-gate__hint">
              Demo code: <b style={{ color: "#fff" }}>{ACCESS_CODE}</b> · or{" "}
              <a href="#" style={{ color: "var(--accent)" }} onClick={(e) => e.preventDefault()}>request access</a>
            </div>
            <button className="btn btn-gold" style={{ width: "100%", marginTop: 20, height: 50 }} onClick={submit}>
              Unlock demo
            </button>
            <div style={{ marginTop: 16 }}>
              <Link to="/demo" style={{ color: "var(--dark-band-muted)", fontSize: 13 }}>← Back to public demo</Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

/* ============================================================================
   VC demo — worked-economics dashboard.
   ========================================================================== */
function VcDashboard() {
  const wells = useWells();
  const allWells: Record<string, Well> = {};
  wells.forEach((w) => { allWells[w.id] = w; });
  const [tier, setTier] = useState<"std" | "ultra">("std");
  const trip = tier === "ultra" ? LUX_TRIP : STD_TRIP;
  let totalGross = 0;
  let totalComm = 0;
  const rows = trip.map((r) => {
    const w = allWells[r.well];
    const comm = Math.round((r.gross * parseFloat(r.rate)) / 100);
    totalGross += r.gross;
    totalComm += comm;
    return { ...r, w, comm };
  });

  // scaling calculator state
  const [trips, setTrips] = useState(2500);
  const [val, setVal] = useState(8500);
  const [take, setTake] = useState(12);
  const annual = trips * val * (take / 100) * 12;
  const m = annual / 1e6;
  const outNumber = m >= 1000 ? `${(m / 1000).toFixed(1)}B` : `${m.toFixed(1)}M`;

  return (
    <div className="inv">
      <Disclaimer>
        <b>Illustrative figures.</b> Commission rates and totals below are design placeholders pending audited data. Structure is real; numbers are not.
      </Disclaimer>

      <main id="main">
        <section className="inv-hero">
          <div className="inv-wrap inv-hero__inner">
            <span className="eyebrow">VC Demo · Unlocked</span>
            <h1>The economics of one real trip.</h1>
            <p>A worked itinerary — every Well, every provider, every commission line — then how it scales.</p>
            <div className="inv-hero__tabs">
              <button type="button" className="inv-hero__tab" aria-current={tier === "std" ? "true" : undefined} onClick={() => setTier("std")}>Standard trip</button>
              <button type="button" className="inv-hero__tab" aria-current={tier === "ultra" ? "true" : undefined} onClick={() => setTier("ultra")}>Ultra trip</button>
            </div>
          </div>
        </section>

        <section className="inv-section">
          <div className="inv-wrap">
            <div className="inv-section__head">
              <span className="eyebrow">Worked itinerary</span>
              <h2>{tier === "ultra" ? "Paris à Deux · two couples · 5 nights" : "Kenya Anniversary Safari · 10 nights"}</h2>
              <p>{tier === "ultra" ? "Four travelers · private jet · Ultra tier" : "Two travelers · East Africa · comfort–premium tier"}</p>
            </div>
            <div className="inv-table">
              <div className="inv-table__row head">
                <div>Well · provider</div>
                <div className="num hide-sm">Gross</div>
                <div className="num hide-sm">Rate</div>
                <div className="num">Commission</div>
              </div>
              {rows.map((r) => (
                <div className="inv-table__row" key={r.well}>
                  <div className="well"><Icon name={r.w.icon} small /> {r.item}</div>
                  <div className="num hide-sm">${r.gross.toLocaleString()}</div>
                  <div className="num hide-sm">{r.rate}</div>
                  <div className="num gold">${r.comm.toLocaleString()}</div>
                </div>
              ))}
              <div className="inv-table__row total">
                <div className="well">Trip total</div>
                <div className="num hide-sm">${totalGross.toLocaleString()}</div>
                <div className="num hide-sm"></div>
                <div className="num gold">${totalComm.toLocaleString()}</div>
              </div>
            </div>
          </div>
        </section>

        <section className="inv-section">
          <div className="inv-wrap">
            <div className="inv-section__head">
              <span className="eyebrow">Scaling model</span>
              <h2>What it looks like at volume</h2>
              <p>Drag to model monthly trips and average take. Outputs are illustrative.</p>
            </div>
            <div className="inv-calc">
              <div className="inv-calc__row">
                <span className="inv-calc__label">Trips / month</span>
                <span className="inv-calc__slider">
                  <input type="range" min={100} max={20000} step={100} value={trips} onChange={(e) => setTrips(+e.target.value)} />
                </span>
                <span className="inv-calc__val">{trips.toLocaleString()}</span>
              </div>
              <div className="inv-calc__row">
                <span className="inv-calc__label">Avg. trip value</span>
                <span className="inv-calc__slider">
                  <input type="range" min={1500} max={80000} step={500} value={val} onChange={(e) => setVal(+e.target.value)} />
                </span>
                <span className="inv-calc__val">${val.toLocaleString()}</span>
              </div>
              <div className="inv-calc__row">
                <span className="inv-calc__label">Blended take rate</span>
                <span className="inv-calc__slider">
                  <input type="range" min={5} max={25} step={1} value={take} onChange={(e) => setTake(+e.target.value)} />
                </span>
                <span className="inv-calc__val">{take}%</span>
              </div>
              <div className="inv-calc__out">
                <span className="l">Modeled annual net revenue <span style={{ color: "var(--accent)" }}>· illustrative</span></span>
                <span className="v">${outNumber} <Ph>· est.</Ph></span>
              </div>
            </div>
          </div>
        </section>

        <section className="inv-section" style={{ paddingBottom: 80 }}>
          <div className="inv-wrap">
            <div className="inv-section__head">
              <span className="eyebrow">Roadmap</span>
              <h2>The next four quarters</h2>
            </div>
            <div className="inv-roadmap">
              {ROADMAP.map((r) => (
                <div className="inv-rm" key={r.q}>
                  <div className="inv-rm__q">{r.q}</div>
                  <ul className="inv-rm__items">
                    {r.items.map((i) => (
                      <li key={i}><Icon name="check" small /> {i}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

/* ============================================================================
   Entry component. /demo → public; /vc-demo → gated VC demo.
   ========================================================================== */
export default function Demo({ gated = false }: { gated?: boolean }) {
  const [unlocked, setUnlocked] = useState(false);

  if (!gated) return <PublicDemo />;
  if (!unlocked) return <Gate onUnlock={() => { setUnlocked(true); window.scrollTo(0, 0); }} />;
  return <VcDashboard />;
}
