import { Link } from "react-router-dom";
import { Icon } from "@/lib/icons";
import { Eyebrow } from "@/components/ui/primitives";

// How it works — the four simple steps (they map to the live 4-step journey:
// Special Interests -> Regions -> the Wells -> Book It).
const STEPS = [
  { n: 1, ic: "sparkles", t: "Ways to travel", s: "Pick the interests that move you — safari, romance, ski and more." },
  { n: 2, ic: "globe", t: "World regions", s: "Choose where in the world — each with real destinations and a Safety Card." },
  { n: 3, ic: "compass", t: "Trip needs", s: "Fill the Wells — Stay, Eat, Move and the rest — with matched providers." },
  { n: 4, ic: "bag2", t: "Itinerary", s: "Watch it come together in one saved, bookable trip." },
];

// Six promises, kept on every page — the traveler-facing voice of the unbreakable
// laws (Honest · Open · Safe · Yours).
const PROMISES = [
  { t: "Honest about what's real", s: "Live vs. coming-soon is always clear — never dressed up as more than it is." },
  { t: "Open about how we earn", s: "When a partner pays us a commission, we say so, right there on the page." },
  { t: "Your safety travels with you", s: "The Emergency Button and an accurate Safety Card ride every destination." },
  { t: "The trip is always yours", s: "Atlas suggests; you always choose and book. No pressure, no “only 2 left.”" },
  { t: "Everything in one place", s: "One itinerary holds the whole trip — flights, stays, dining and all of it." },
  { t: "Built for everyone", s: "Big type, keyboard paths, read-or-hear — usable by every traveler." },
];

const CHIPS = ["Honest", "Open", "Safe", "Yours"];

export default function About() {
  return (
    <div className="ab">
      <div className="ab-hero">
        <Eyebrow>About TravelWell</Eyebrow>
        <h1>One place to dream, plan and book your whole trip.</h1>
        <p>Most trips are planned across a dozen tabs — one site for flights, another for hotels, another for things to do. TravelWell brings it all together. Tell us how you love to travel, and we guide you — step by step — to a complete, booked journey.</p>
      </div>

      <section className="ab" style={{ padding: 0, marginTop: 28 }}>
        <div className="ab-stat-row">
          <div className="ab-stat"><div className="ab-stat__v">25</div><div className="ab-stat__k">ways to travel</div></div>
          <div className="ab-stat"><div className="ab-stat__v">13</div><div className="ab-stat__k">regions</div></div>
          <div className="ab-stat"><div className="ab-stat__v">10</div><div className="ab-stat__k">trip needs covered</div></div>
          <div className="ab-stat"><div className="ab-stat__v">1</div><div className="ab-stat__k">itinerary</div></div>
        </div>
      </section>

      <section className="rd-section" style={{ maxWidth: "none", padding: "56px 0 0" }}>
        <div className="rd-section__head"><div><Eyebrow>How it works</Eyebrow><h2 className="t-h2">Four simple steps — from a feeling to a booked trip.</h2></div></div>
        <div className="ab-steps">
          {STEPS.map((s) => (
            <div className="ab-step" key={s.n}>
              <div className="ab-step__top">
                <span className="ab-step__ic"><Icon name={s.ic} /></span>
                <span className="ab-step__n">{s.n}</span>
              </div>
              <div className="ab-step__t">{s.t}</div>
              <div className="ab-step__s">{s.s}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="rd-section" style={{ maxWidth: "none", padding: "56px 0 0" }}>
        <div className="rd-section__head">
          <div>
            <Eyebrow>Our promises to you</Eyebrow>
            <h2 className="t-h2">Six promises, kept on every page.</h2>
            <p>Honesty about what's real. Openness about how we earn. Your safety, wherever you go. Not fine print — the way every page works.</p>
          </div>
        </div>
        <div className="ab-promise-chips">{CHIPS.map((c) => <span className="ab-chip" key={c}>{c}</span>)}</div>
        <div className="ab-laws" style={{ marginTop: 16 }}>
          {PROMISES.map((l, i) => (
            <div className="ab-law" key={l.t}>
              <span className="ab-law__n">{i + 1}</span>
              <div><div className="ab-law__t">{l.t}</div><div className="ab-law__s">{l.s}</div></div>
            </div>
          ))}
        </div>
      </section>

      <section className="ab-close">
        <div className="ab-close__bg" aria-hidden="true" />
        <div className="ab-close__inner">
          <Eyebrow className="ab-close__eyebrow">Ready when you are</Eyebrow>
          <h2 className="ab-close__title">Your dream trip,<br /><span className="ab-close__em">one step at a time</span>.</h2>
          <p className="ab-close__sub">No account needed to start. Pick what moves you, and watch a real, bookable journey take shape — or ask Atlas, and just talk it through.</p>
          <div className="ab-close__actions">
            <Link className="btn btn-gold" to="/special-interests" style={{ height: 56, padding: "0 32px", fontSize: 16 }}>Start the journey →</Link>
            <Link className="btn ab-close__ghost" to="/demo">Curious how it's built?</Link>
          </div>
          <div className="ab-close__stats">
            <span><b>25</b> ways to travel</span><span className="ab-close__dot" />
            <span><b>13</b> regions</span><span className="ab-close__dot" />
            <span><b>10</b> trip needs</span><span className="ab-close__dot" />
            <span><b>1</b> itinerary</span>
          </div>
          <p className="ab-close__sig">However far you go — <span className="tw">Travel Well.</span></p>
        </div>
      </section>
    </div>
  );
}
