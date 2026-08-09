import { Link } from "react-router-dom";
import { Icon } from "@/lib/icons";
import { Eyebrow, BrandMark } from "@/components/ui/primitives";
import { useSiCount, useRegionCount, useWellCount } from "@/store/useCatalog";

/** The counters read the live catalog — a published count that disagrees with
 *  the taxonomy is the exact failure canon warns about (CLAUDE.md). */
const stats = (si: number, regions: number, wells: number) => [
  { ic: "heart", v: String(si), t: "Ways to travel", sub: "— from safaris to spas" },
  { ic: "globe", v: String(regions), t: "World regions", sub: "to explore" },
  { ic: "bag2", v: String(wells), t: "Trip needs,", sub: "each with its own “Well”" },
  { ic: "check", v: "1", t: "Itinerary", sub: "that holds it all", hl: true },
];

// How it works — the four steps as a vertical timeline (they map to the live
// 4-step journey: Special Interests → Regions → the Wells → Book It).
const steps = (si: number, regions: number, wells: number) => [
  {
    ic: "heart", title: "Tell us what moves you",
    desc: "Start with a feeling, not a form. Pick the ways you love to travel — they light up as you choose.",
    chips: ["Safaris", "Romance", "Food & wine", "Wellness"], more: `${si} ways to travel`,
    to: "/special-interests", link: "Choose your interests",
  },
  {
    ic: "globe", title: "Pick where in the world",
    desc: "Thirteen regions, ranked by how well they fit what you chose — so the best matches rise to the top.",
    chips: ["East Africa", "The Mediterranean", "Southeast Asia", "The Caribbean"], more: `${regions} regions`,
    to: "/regions", link: "Browse the regions",
  },
  {
    ic: "bag2", title: "We fill in every need",
    desc: "Every part of your trip has its own “Well” — flights, stays, dining, getting around — each pre-filled with our best matches for you.",
    chips: ["Flights", "Places to stay", "Dining", "Getting around", "Activities"], more: `${wells} needs covered`,
    to: "/wells-surface", link: "Meet the Wells",
  },
  {
    ic: "check", title: "Book it, all in one place",
    desc: "Everything you pick lands in one itinerary, day by day. Book with trusted partners — and if we earn a commission, we say so right there. Atlas is beside you the whole way.",
    chips: ["Trusted partners", "Clear pricing", "One itinerary", "Help from Atlas"],
    to: "/itinerary", link: "See an itinerary",
  },
];

// Six promises, kept on every page — the traveler-facing voice of the unbreakable laws.
const PROMISES = [
  { ic: "check", t: "We're clear about what's ready", s: "If something is still coming soon, we say so — plainly, right on the page." },
  { ic: "info", t: "We tell you how we earn", s: "If a booking earns us a commission, you'll see a note right beside it. It never costs you extra." },
  { ic: "bag2", t: "Everything lands in one trip", s: "Whatever you add — a flight, a dinner, a safari — it's saved to one itinerary, automatically." },
  { ic: "shield", t: "Your safety travels with you", s: "Every destination has a Safety Card — nearest hospital, your embassy, the local emergency number." },
  { ic: "message", t: "Easy for everyone", s: "Type or talk. Read or listen. Works with a keyboard alone — and in your language." },
  { ic: "sparkles", t: "You're always in charge", s: "Atlas suggests; you decide. Nothing is ever booked without you." },
];

export default function About() {
  const siCount = useSiCount();
  const regionCount = useRegionCount();
  const wellCount = useWellCount();
  const STATS = stats(siCount, regionCount, wellCount);
  const STEPS = steps(siCount, regionCount, wellCount);
  return (
    <div className="ab">
      <div className="ab-hero">
        <Eyebrow>About TravelWell</Eyebrow>
        <h1>One place to dream, plan and book your whole trip.</h1>
        <p>Most trips are planned across a dozen tabs — one site for flights, another for hotels, another for things to do. TravelWell brings it all together. Tell us how you love to travel, and we guide you — step by step — to a complete, booked journey.</p>
      </div>

      <div className="ab-stat-row">
        {STATS.map((s) => (
          <div className={"ab-stat" + (s.hl ? " ab-stat--hl" : "")} key={s.t}>
            <span className="ab-stat__ic"><Icon name={s.ic} /></span>
            <div className="ab-stat__v">{s.v}</div>
            <div className="ab-stat__k"><b>{s.t}</b> {s.sub}</div>
          </div>
        ))}
      </div>

      <section className="ab-sec">
        <div className="ab-sec__head"><h2 className="t-h2">How it works</h2><p>Four simple steps — from a feeling to a booked trip.</p></div>
        <div className="ab-flow">
          {STEPS.map((st, i) => (
            <div className="ab-flow__step" key={st.title}>
              <div className="ab-flow__node"><Icon name={st.ic} /></div>
              <div className="ab-flow__card">
                <div className="ab-flow__eyebrow">Step {i + 1} of 4</div>
                <h3 className="ab-flow__title">{st.title}</h3>
                <p className="ab-flow__desc">{st.desc}</p>
                <div className="ab-flow__chips">
                  {st.chips.map((c) => <span className="ab-chip" key={c}>{c}</span>)}
                  {st.more && <span className="ab-chip ab-chip--more">… {st.more}</span>}
                </div>
                <Link className="ab-flow__link" to={st.to}>{st.link} <Icon name="arrow" small /></Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="ab-sec">
        <div className="ab-sec__head"><h2 className="t-h2">Our promises to you</h2></div>
        <div className="ab-trust">
          <div className="ab-trust__bg" aria-hidden="true" />
          <span className="ab-trust__ic"><Icon name="shield" /></span>
          <div className="ab-trust__body">
            <div className="ab-trust__eyebrow">Six promises, kept on every page</div>
            <div className="ab-trust__title">Travel planning you can <span className="em">trust</span>.</div>
            <p className="ab-trust__desc">Clear about what's real. Open about how we earn. Your safety, wherever you go. Not fine print — the way every page works.</p>
            <div className="ab-trust__pillars">Clear · Open · Safe · Yours</div>
          </div>
        </div>
        <div className="ab-promises">
          {PROMISES.map((p) => (
            <div className="ab-promise" key={p.t}>
              <span className="ab-promise__ic"><Icon name={p.ic} small /></span>
              <div><div className="ab-promise__t">{p.t}</div><div className="ab-promise__s">{p.s}</div></div>
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
            <span><b>{siCount}</b> ways to travel</span><span className="ab-close__dot" />
            <span><b>{regionCount}</b> regions</span><span className="ab-close__dot" />
            <span><b>{wellCount}</b> trip needs</span><span className="ab-close__dot" />
            <span><b>1</b> itinerary</span>
          </div>
          <p className="ab-close__sig">However far you go — <span className="tw"><BrandMark /></span></p>
        </div>
      </section>
    </div>
  );
}
