import { Link } from "react-router-dom";
import { Icon } from "@/lib/icons";
import { useStore } from "@/store/useStore";
import { useSpecialInterests, useWells, useRegions } from "@/store/useCatalog";
import { ButtonLink } from "@/components/ui/primitives";

export function MegaMenu() {
  const { panel, closePanel } = useStore();
  const sis = useSpecialInterests();
  const open = panel === "mega";
  const featuredSI = sis.filter((s) => s.status === "live").slice(0, 5);
  const wells = useWells().filter((w) => !w.lux).slice(0, 8);
  const regions = useRegions().slice(0, 8);
  const close = () => closePanel();

  return (
    <div className="tw-mega" data-open={open} role="region" aria-label="Worlds of Adventure" aria-hidden={!open} {...(open ? {} : ({ inert: "" } as any))}>
      <button className="tw-mega__close" aria-label="Close menu" onClick={close}>
        <Icon name="close" />
      </button>
      <div className="tw-mega__inner">
        <div className="tw-mega__col">
          <div className="tw-mega__feature">
            <span className="eyebrow">Start here</span>
            <h3>Design Your Dream Journey</h3>
            <p className="sig">If it's the trip of a lifetime… <span style={{ color: "var(--accent)" }}>Travel Well.</span></p>
          </div>
          <h4>Special Interests · 25</h4>
          <div className="tw-mega__si-grid">
            {featuredSI.map((s) => (
              <Link key={s.id} className="tw-mega__link" to={`/si/${s.id}`} onClick={close}>
                <Icon name="compass" />{s.name}
              </Link>
            ))}
          </div>
          <Link className="tw-mega__viewall" to="/special-interests" onClick={close}>
            View all 25 interests <Icon name="arrow" small />
          </Link>
        </div>
        <div className="tw-mega__col">
          <h4>The Wells · 10</h4>
          {wells.map((w) => (
            <Link key={w.id} className="tw-mega__link" to={`/wells#${w.id}`} onClick={close}>
              <Icon name={w.icon} />{w.name}{w.status === "soon" && <span className="tag">Soon</span>}
            </Link>
          ))}
          <Link className="tw-mega__viewall" to="/wells" onClick={close}>All Wells &amp; partners <Icon name="arrow" small /></Link>
        </div>
        <div className="tw-mega__col">
          <h4>Regions · 13</h4>
          {regions.map((r) => (
            <Link key={r.code} className="tw-mega__link" to={`/region/${r.code}`} onClick={close}>
              <Icon name="pin" />{r.name}
            </Link>
          ))}
          <Link className="tw-mega__viewall" to="/regions" onClick={close}>All 13 regions <Icon name="arrow" small /></Link>
        </div>
        <div className="tw-mega__col">
          <h4>Plan &amp; Discover</h4>
          <Link className="tw-mega__link" to="/plan" onClick={close}><Icon name="compass" />Plan Your Trip</Link>
          <Link className="tw-mega__link" to="/destinations" onClick={close}><Icon name="pin" />Destinations</Link>
          <Link className="tw-mega__link" to="/providers" onClick={close}><Icon name="bag2" />Providers</Link>
          <Link className="tw-mega__link" to="/guides" onClick={close}><Icon name="read" />Guides</Link>
          <Link className="tw-mega__link" to="/itinerary" onClick={close}><Icon name="check" />Your Itinerary</Link>
          <h4 style={{ marginTop: 18 }}>Premium &amp; System</h4>
          <Link className="tw-mega__link tw-mega__link--gold" to="/luxury" onClick={close}><Icon name="sparkle" />Luxury &amp; Ultra-Luxury</Link>
          <Link className="tw-mega__link" to="/about" onClick={close}><Icon name="globe" />About / Architecture</Link>
          <Link className="tw-mega__link" to="/demo" onClick={close}><Icon name="sparkles" />Investor Demo</Link>
        </div>
        <div className="tw-mega__signature">
          <p className="signature">A Travel Operating System — <span className="tw">Travel Well.</span></p>
          <ButtonLink to="/special-interests" onClick={close}>Design Your Next Adventure</ButtonLink>
        </div>
      </div>
    </div>
  );
}
