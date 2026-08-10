import { Link } from "react-router-dom";
import { Icon } from "@/lib/icons";
import { Eyebrow } from "@/components/ui/primitives";
import { cx } from "@/lib/utils";

// Map a prototype file name to the app route (null = no link).
const ROUTE: Record<string, string> = {
  "Home.html": "/", "plan.html": "/plan", "Sign Up.html": "/signup", "Activation.html": "/activation",
  "Sign In.html": "/signin", "Verify Email.html": "/verify", "Profile.html": "/profile",
  "special-interests.html": "/special-interests", "si-detail.html": "/si/safari", "regions.html": "/regions",
  "region-detail.html": "/region/05A", "activities.html": "/activities", "wells-surface.html": "/wells-surface",
  "destinations.html": "/destinations", "destination-detail.html": "/destination/angama",
  "wells.html": "/wells", "well-detail.html": "/well/fly", "providers.html": "/providers", "go.html": "/go",
  "itinerary.html": "/itinerary", "guides.html": "/guides", "guide-detail.html": "/guide/morocco-top8",
  "luxury.html": "/luxury", "first-aid-kit.html": "/first-aid-kit", "demo.html": "/demo", "vc-demo.html": "/vc-demo",
  "about.html": "/about", "Sitemap.html": "/sitemap",
};

type Node = { n: string; f: string; d: string; s?: string; child?: boolean };
const MODS: { ic: string; t: string; c: string; nodes: Node[] }[] = [
  { ic: "compass", t: "Entry & Home", c: "Start here", nodes: [
    { n: "Home", f: "Home.html (index.html)", d: "live", s: "Hero · what-we-do · pick interests · Atlas" },
    { n: "Plan Your Trip", f: "plan.html", d: "live", s: "Seasonal banner · Well-coverage checklist" },
  ] },
  { ic: "bag", t: "Onboarding · Travel ID", c: "Account", nodes: [
    { n: "Sign Up — 6-step wizard", f: "Sign Up.html", d: "flow", s: "Builds Travel Personality + budget ranges" },
    { n: "Activation", f: "Activation.html", d: "flow", s: "Verify · location · notify · whispers" },
    { n: "Sign In / Welcome Back", f: "Sign In.html", d: "live" },
    { n: "Verify Email", f: "Verify Email.html", d: "live" },
    { n: "Profile / Travel ID", f: "Profile.html", d: "live", s: "Identity Card + editable sections" },
  ] },
  { ic: "globe", t: "The Dream Journey", c: "Core spine", nodes: [
    { n: "Special Interests", f: "special-interests.html", d: "flow", s: "6 live + future taxonomy" },
    { n: "↳ Interest detail", f: "si-detail.html", d: "flow", child: true },
    { n: "Regions (13)", f: "regions.html", d: "flow", s: "Ranked by interest affinity" },
    { n: "↳ Region detail (+ sub-regions)", f: "region-detail.html", d: "flow", child: true },
    { n: "Activities", f: "activities.html", d: "flow", s: "Multi-select → pre-fills Wells" },
    { n: "Wells surface", f: "wells-surface.html", d: "flow", s: "The heart — providers, Book It" },
    { n: "Destinations", f: "destinations.html", d: "live" },
    { n: "↳ Destination detail (+ Safety Card)", f: "destination-detail.html", d: "live", child: true },
  ] },
  { ic: "bed", t: "Wells & Partners", c: "Fulfillment", nodes: [
    { n: "Wells index (10 + 2 luxury)", f: "wells.html", d: "live", s: "Body-metaphor architecture" },
    { n: "↳ Well detail", f: "well-detail.html", d: "live", child: true },
    { n: "Providers catalog", f: "providers.html", d: "live", s: "Filterable · Prime-first · FTC" },
    { n: "↳ /go partner redirect", f: "go.html", d: "live", child: true },
  ] },
  { ic: "calendar", t: "Itinerary & Booking", c: "Build & book", nodes: [
    { n: "Itinerary builder", f: "itinerary.html", d: "flow", s: "6 time blocks · idea→pending→confirmed" },
    { n: "Book It checkout", f: "(in itinerary)", d: "flow", s: "API · widget · affiliate tracks", child: true },
  ] },
  { ic: "sparkle", t: "Content & Premium", c: "Editorial + lux", nodes: [
    { n: "Travel Guides", f: "guides.html", d: "live" },
    { n: "↳ Guide detail", f: "guide-detail.html", d: "live", child: true },
    { n: "Luxury & Ultra-Luxury", f: "luxury.html", d: "live", s: "Chooser-first · ?tier=ultra" },
    { n: "First Aid Kit", f: "first-aid-kit.html", d: "live", s: "Product · QR Safety Card · pre-order" },
  ] },
  { ic: "shield", t: "Investor / System", c: "Demo", nodes: [
    { n: "Public Demo", f: "demo.html", d: "sys", s: "Platform · revenue architecture" },
    { n: "VC Demo (gated)", f: "vc-demo.html", d: "sys", s: "Code TWW2026 · worked economics" },
    { n: "About / Architecture", f: "about.html", d: "sys", s: "OS layers · spec-first" },
  ] },
  { ic: "gift", t: "Design Reference", c: "Internal", nodes: [
    { n: "Foundations / Tokens", f: "Foundations.html", d: "ref" },
    { n: "Global Shell", f: "Global Shell.html", d: "ref" },
    { n: "Logo Concepts I & II", f: "Logo Concepts.html", d: "ref" },
    { n: "Site Map (this page)", f: "Sitemap.html", d: "ref" },
  ] },
];
const DOT: Record<string, string> = { live: "dot-live", flow: "dot-flow", sys: "dot-sys", ref: "dot-ref" };

const SPINE = [
  { n: "STEP 1", t: "Interests", f: "special-interests.html", to: "/special-interests" },
  { n: "STEP 2", t: "Region", f: "regions.html", to: "/regions" },
  { n: "STEP 3", t: "Activities", f: "activities.html", to: "/activities" },
  { n: "STEP 4", t: "The Wells", f: "wells-surface.html", to: "/wells-surface" },
  { n: "STEP 5", t: "Itinerary · Book It", f: "itinerary.html", to: "/itinerary" },
];

function NodeRow({ node }: { node: Node }) {
  const to = ROUTE[node.f] ?? null;
  const inner = (
    <>
      <span className={cx("sm-node__dot", DOT[node.d])} />
      <span className="sm-node__name">{node.n}{node.s && <span className="sm-node__sub">{node.s}</span>}</span>
      <span className="sm-node__file">{node.f}</span>
    </>
  );
  return to
    ? <Link className={cx("sm-node", node.child && "sm-node--child")} to={to}>{inner}</Link>
    : <div className={cx("sm-node", node.child && "sm-node--child")}>{inner}</div>;
}

export default function Sitemap() {
  return (
    <>
      <div className="sm-head">
        <Eyebrow>Reference · Navigation</Eyebrow>
        <h1>TravelWell.World — <span className="gold">site map</span>.</h1>
        <p>Every screen in the prototype, grouped by area. The teal spine is the core "Dream Journey" — the path most visitors take. Click any node to open it.</p>
        <div className="sm-legend">
          <span className="sm-leg"><span className="sw dot-live" /> Core page</span>
          <span className="sm-leg"><span className="sw dot-flow" /> Journey step</span>
          <span className="sm-leg"><span className="sw dot-sys" /> System / investor</span>
          <span className="sm-leg"><span className="sw dot-ref" /> Design reference</span>
        </div>
      </div>

      <div className="sm-wrap">
        <div className="sm-spine"><div className="sm-spine__inner">
          <Eyebrow>The experience spine</Eyebrow>
          <h2>How a traveler moves from a feeling to a booked trip</h2>
          <div className="sm-flow">
            {SPINE.map((s, i) => (
              <span key={s.n} style={{ display: "contents" }}>
                <Link className="sm-step" to={s.to}>
                  <div className="sm-step__n">{s.n}</div><div className="sm-step__t">{s.t}</div><div className="sm-step__f">{s.f}</div>
                </Link>
                {i < SPINE.length - 1 && <div className="sm-arrow">→</div>}
              </span>
            ))}
          </div>
        </div></div>

        <div className="sm-grid">
          {MODS.map((m) => (
            <div className="sm-mod" key={m.t}>
              <div className="sm-mod__head"><span className="sm-mod__ic"><Icon name={m.ic} /></span><span className="sm-mod__t">{m.t}</span><span className="sm-mod__c">{m.c}</span></div>
              <div className="sm-mod__body">
                {m.nodes.map((n) => <NodeRow key={n.n} node={n} />)}
              </div>
            </div>
          ))}
        </div>

        <div className="sm-foot" style={{ marginTop: 28 }}>
          <div className="sm-note"><b>For David:</b> Start at the <b>Home page</b>, then follow the teal spine left→right to experience the full journey. Pages with a "Preview" state (most Special Interests, some regions/destinations) are intentionally shown as "coming soon" to demonstrate the straight live-vs-placeholder system. The bottom <b>state-switcher pills</b> on some screens are demo aids to preview different states — they'd be removed in production.</div>
        </div>
      </div>
    </>
  );
}
