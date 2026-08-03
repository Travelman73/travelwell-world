import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Icon } from "@/lib/icons";
import { REGION_DETAIL, SUBREGION_TOP, type Destination } from "@/data/places";
import { useRegions, useSubregions, useDestinations } from "@/store/useCatalog";
import { regionImg, img } from "@/lib/images";
import { useUnsplashImage } from "@/lib/unsplash";
import { useStore } from "@/store/useStore";
import { Eyebrow } from "@/components/ui/primitives";
import { JourneyBar } from "@/components/ui/StepIndicator";
import { cx } from "@/lib/utils";

const AIRPORTS: Record<string, string> = {
  CDG: "Paris", LHR: "London", AMS: "Amsterdam", BCN: "Barcelona", FCO: "Rome", ATH: "Athens",
  CPH: "Copenhagen", OSL: "Oslo", HEL: "Helsinki", DXB: "Dubai", DOH: "Doha", AUH: "Abu Dhabi",
  NBO: "Nairobi", JRO: "Kilimanjaro", KGL: "Kigali", CPT: "Cape Town", JNB: "Johannesburg", WDH: "Windhoek",
  BKK: "Bangkok", SIN: "Singapore", DPS: "Bali (Denpasar)", NRT: "Tokyo", ICN: "Seoul", HKG: "Hong Kong",
  SYD: "Sydney", AKL: "Auckland", NAN: "Nadi, Fiji", MEX: "Mexico City", LIM: "Lima", GIG: "Rio de Janeiro",
  NAS: "Nassau", PUJ: "Punta Cana", SJU: "San Juan", JFK: "New York", LAX: "Los Angeles", ORD: "Chicago",
  YYZ: "Toronto", YVR: "Vancouver", YUL: "Montréal",
};

/** Region's destination card — same Unsplash query as the destination hero so
 *  the card and the page it opens show the same photo. */
function RdDestCard({ d }: { d: Destination }) {
  const photo = useUnsplashImage(`${d.name}, ${d.country}`, img(d.img, 600), 600);
  return (
    <Link className={cx("rd-dest", d.depth !== "verified" && "rd-dest--stub")} to={`/destination/${d.id}`}>
      <img src={photo.src} alt={d.name} loading="lazy" referrerPolicy="no-referrer" />
      <span className="rd-dest__scrim" />
      <span className="rd-dest__badge">
        {d.depth === "verified"
          ? <span className="pill pill-live" style={{ background: "rgba(255,255,255,.92)" }}>Live</span>
          : <span className="pill pill-preview" style={{ background: "rgba(255,255,255,.86)" }}>Preview</span>}
      </span>
      <span className="rd-dest__body">
        <span className="rd-dest__country">{d.country}</span>
        <span className="rd-dest__name">{d.name}</span>
        <span className="rd-dest__line">{d.line}</span>
      </span>
    </Link>
  );
}

export default function RegionDetail() {
  const { code = "" } = useParams();
  const { setRegion } = useStore();
  const regions = useRegions();
  const subregions = useSubregions();
  const destinations = useDestinations();
  const R = regions.find((r) => r.code === code) || regions.find((r) => r.code === "05A")!;
  const heroPhoto = useUnsplashImage(R.name, regionImg(R.code, 1800), 1800);
  const DET = REGION_DETAIL[R.code] || ({} as (typeof REGION_DETAIL)[string]);
  const DESTS = destinations[R.code] || [];
  const isSub = Boolean(DET.sub);
  const subList = subregions[R.code] || [];
  const [open, setOpen] = useState(0);

  return (
    <>
      <JourneyBar current={2} crumbs={[{ label: "Home", to: "/" }, { label: "Regions", to: "/regions" }, { label: R.name }]} />

      <section className="rd-hero">
        <div className="rd-hero__img"><img src={heroPhoto.src} alt={R.name} referrerPolicy="no-referrer" /></div>
        <div className="rd-hero__scrim" />
        {heroPhoto.credit && (
          <span style={{ position: "absolute", bottom: 8, insetInlineEnd: 12, zIndex: 3, fontSize: 11, color: "rgba(255,255,255,.8)" }}>
            Photo · <a href={heroPhoto.credit.link} target="_blank" rel="noopener noreferrer" style={{ color: "inherit", textDecoration: "underline" }}>{heroPhoto.credit.name}</a> / Unsplash
          </span>
        )}
        <div className="rd-hero__inner">
          <div className="rd-hero__code">REGION {R.code}</div>
          <h1 className="rd-hero__title">{R.name}</h1>
          <p className="rd-hero__line">{R.line}</p>
          <div className="rd-hero__badges">
            {R.status === "live"
              ? <span className="pill pill-live" style={{ background: "rgba(255,255,255,.92)" }}>Live region</span>
              : <span className="pill pill-preview" style={{ background: "rgba(255,255,255,.86)" }}>Preview region</span>}
            <span className="pill pill-engine">{DET.countries ? DET.countries.length : R.countries} {isSub ? "country" : "countries"}</span>
            {isSub && <span className="pill" style={{ background: "var(--accent)", color: "var(--accent-foreground)" }}>{subList.length} travel sub-regions</span>}
          </div>
        </div>
      </section>

      <div className="rd-body">
        <p className="rd-blurb">{DET.blurb || R.line}</p>
        <div className="rd-facts">
          <div className="rd-fact">
            <div className="rd-fact__k">{isSub ? "Country" : "Member countries"}</div>
            <div className="rd-fact__v"><div className="rd-countries">{(DET.countries || []).map((c) => <span key={c} className="rd-country">{c}</span>)}</div></div>
            <div className="rd-fact__cap">{(DET.countries || []).length} {isSub ? "nation" : "countries"} in this {isSub ? "region" : "world region"}{isSub ? "" : " · visa-friendly routings"}</div>
          </div>
          <div className="rd-fact">
            <div className="rd-fact__k">Gateway airports</div>
            <div className="rd-fact__v">
              <div className="rd-gw-chips">
                {R.gateways.split("·").map((c) => c.trim()).map((g) => (
                  <div key={g} className="rd-gw-chip"><span className="code">{g}</span><span className="city">{AIRPORTS[g] || "International gateway"}</span></div>
                ))}
              </div>
            </div>
            <div className="rd-fact__cap">Primary international arrivals · connections region-wide</div>
          </div>
          <div className="rd-fact">
            <div className="rd-fact__k">When to go</div>
            <div className="rd-fact__v">
              <div className="rd-seasons">
                {(DET.season || []).map((s) => (
                  <div key={s.l} className="rd-season"><span className="rd-season__l">{s.l}</span><span className="rd-season__m">{s.m}</span><span className="rd-season__n">{s.note}</span></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {DESTS.length > 0 && (
        <section className="rd-section">
          <div className="rd-section__head">
            <div><h2>Destinations within</h2><p>Hand-picked places — stay inside the region as you build.</p></div>
            <Link className="btn btn-secondary" to="/destinations">See all <Icon name="arrow" small /></Link>
          </div>
          <div className="rd-dest-grid">
            {DESTS.map((d) => (
              <RdDestCard key={d.id} d={d} />
            ))}
          </div>
        </section>
      )}

      {isSub && (
        <section className="rd-section">
          <div className="rd-section__head">
            <div><h2>Travel sub-regions</h2><p>{R.name} is big — we split it into {subList.length} labeled sub-regions, each with its own ranked Top list.</p></div>
          </div>
          <div className="rd-subs">
            {subList.map((name, i) => {
              const top = SUBREGION_TOP[name] || [];
              const isOpen = open === i;
              return (
                <div key={name} className="rd-sub">
                  <button className="rd-sub__head" aria-expanded={isOpen} onClick={() => setOpen(isOpen ? -1 : i)}>
                    <span className="rd-sub__num">{String(i + 1).padStart(2, "0")}</span>
                    <span className="rd-sub__name">{name}</span>
                    <span className="rd-sub__chev"><Icon name="chev" small /></span>
                  </button>
                  {isOpen && (
                    <div className="rd-sub__panel">
                      <div className="rd-sub__toplabel">Top in {name}</div>
                      <div className="rd-top">
                        {top.map((t, ti) => (
                          <Link key={t} className="rd-top__item" to={`/destination/${t.toLowerCase().replace(/[^a-z]+/g, "-")}`}>
                            <span className="rd-top__rank">{ti + 1}</span><span className="rd-top__name">{t}</span>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}

      <div className="rd-continue">
        <div className="rd-continue__card">
          <div style={{ flex: 1, minWidth: 240 }}>
            <Eyebrow>Step 2 of 4 complete</Eyebrow>
            <h3 style={{ marginTop: 6 }}>{R.name} it is. Ready to build your trip?</h3>
            <p>Next, open the Wells — Stay, Eat, Move and more — and I'll fill them with matched providers. Want to fine-tune first? Pick your activities.</p>
          </div>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <Link className="btn btn-secondary" to="/regions">← Change region</Link>
            <Link className="btn btn-secondary" to="/activities" onClick={() => setRegion(R.code)}>Pick activities</Link>
            <Link className="btn btn-primary" to="/wells-surface" onClick={() => setRegion(R.code)} style={{ height: 52, padding: "0 26px" }}>Build your trip →</Link>
          </div>
        </div>
      </div>
    </>
  );
}
