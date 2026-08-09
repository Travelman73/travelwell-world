import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import type { Destination } from "@/data/places";
import type { Region } from "@/data/taxonomy";
import { useRegions, useDestinations } from "@/store/useCatalog";
import { img } from "@/lib/images";
import { useDestinationImage } from "@/lib/unsplash";
import { Eyebrow } from "@/components/ui/primitives";
import { cx } from "@/lib/utils";

interface DestWithRegion extends Destination {
  region: string;
}

/** A destination grid card. Uses the SAME Unsplash query as the destination
 *  detail hero (`name, country`) so the card and the page show the same photo. */
function DestCard({ d }: { d: DestWithRegion }) {
  const photo = useDestinationImage(d, 700, img(d.img, 700));
  return (
    <Link className={cx("dx-card", d.depth !== "verified" && "dx-card--stub")} to={`/destination/${d.id}`}>
      <img src={photo.src} alt={d.name} loading="lazy" referrerPolicy="no-referrer" />
      <span className="dx-card__scrim" />
      <span className="dx-card__badge">
        {d.depth === "verified" ? (
          <span className="pill pill-live" style={{ background: "rgba(255,255,255,.92)" }}>Live</span>
        ) : (
          <span className="pill pill-preview" style={{ background: "rgba(255,255,255,.86)" }}>Preview</span>
        )}
      </span>
      <span className="dx-card__body">
        <span className="dx-card__country">{d.country}</span>
        <span className="dx-card__name">{d.name}</span>
        <span className="dx-card__line">{d.line}</span>
      </span>
    </Link>
  );
}

function allDests(destinations: Record<string, Destination[]>): DestWithRegion[] {
  const out: DestWithRegion[] = [];
  Object.entries(destinations).forEach(([code, list]) => {
    list.forEach((d) => out.push({ ...d, region: code }));
  });
  return out;
}

function regionsWithDests(regions: Region[], destinations: Record<string, Destination[]>) {
  return regions.filter((r) => destinations[r.code]);
}

export default function Destinations() {
  const [params] = useSearchParams();
  const regions = useRegions();
  const destinations = useDestinations();
  const [activeRegion, setActiveRegion] = useState(params.get("r") || "all");

  const list: DestWithRegion[] =
    activeRegion === "all"
      ? allDests(destinations)
      : (destinations[activeRegion] || []).map((d) => ({ ...d, region: activeRegion }));
  const R = regions.find((r) => r.code === activeRegion);

  const select = (code: string) => {
    setActiveRegion(code);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <>
      <div className="jn-subhead">
        <div className="jn-subhead__inner">
          <nav className="jn-crumbs" aria-label="Breadcrumb">
            <Link to="/">Home</Link>
            <span className="sep">/</span>
            <Link to="/regions">Regions</Link>
            <span className="sep">/</span>
            <span className="here" id="crumb">
              {R ? `${R.name} · Destinations` : "Destinations"}
            </span>
          </nav>
        </div>
      </div>

      <main id="main">
        <div className="container">
          <div className="dx-intro">
            <Eyebrow>Destinations</Eyebrow>
            <h1 id="dx-title">{R ? `Destinations in ${R.name}` : "Places worth the journey."}</h1>
            <p className="lead" id="dx-lead">
              Every destination sits inside its region — so you can browse without losing your place in the trip you're building.
            </p>
            <div className="dx-region-strip" id="dx-region-strip">
              <button
                className="dx-region-chip"
                aria-pressed={activeRegion === "all"}
                onClick={() => select("all")}
              >
                All regions
              </button>
              {regionsWithDests(regions, destinations).map((r) => (
                <button
                  key={r.code}
                  className="dx-region-chip"
                  aria-pressed={activeRegion === r.code}
                  onClick={() => select(r.code)}
                >
                  {r.name}
                </button>
              ))}
            </div>
          </div>
          <div className="dx-grid" id="dx-grid">
            {list.map((d) => (
              <DestCard key={`${d.region}-${d.id}`} d={d} />
            ))}
          </div>
        </div>
      </main>
    </>
  );
}
