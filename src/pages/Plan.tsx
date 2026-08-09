import { Link } from "react-router-dom";
import { Icon } from "@/lib/icons";
import { siImg, img } from "@/lib/images";
import { useStore } from "@/store/useStore";
import { useSpecialInterests, useWells, useGuides, useSiCount } from "@/store/useCatalog";
import { Eyebrow, ButtonLink, StatusPill } from "@/components/ui/primitives";

export default function Plan() {
  const { trip } = useStore();
  const sis = useSpecialInterests();
  const siCount = useSiCount();
  const wells = useWells().filter((w) => !w.lux);
  const guides = useGuides();
  const covered = new Set(trip.map((b) => b.well)).size;
  const liveSIs = sis.filter((s) => s.status === "live");
  const month = new Date(2026, 5).toLocaleString("en", { month: "long" });

  return (
    <>
      <div className="container jn-intro">
        <Eyebrow>Plan your trip</Eyebrow>
        <h1>Everything, in one place.</h1>
        <p className="lead">A seasonal read, your Well coverage, and the interests and guides to keep you moving — all in one calm view.</p>
      </div>

      <div className="container" style={{ paddingBottom: 80 }}>
        <div className="jn-context" style={{ marginBottom: 32 }}>
          <div className="jn-context__ic"><Icon name="sun" small /></div>
          <div><b>It's {month} 2026.</b> Prime season for the Great Migration in East Africa and warm seas across the Mediterranean.</div>
        </div>

        <Eyebrow>Your 10-Well coverage</Eyebrow>
        <div className="it-gap-grid" style={{ gridTemplateColumns: "repeat(5, 1fr)", marginTop: 14, display: "grid", gap: 8 }}>
          {wells.map((w) => {
            const cov = trip.some((b) => b.well === w.id);
            return (
              <Link key={w.id} to="/wells-surface" className={`it-gap-cell ${cov ? "covered" : "gap"}`} title={w.name}>
                <div className="it-gap-cell__iconwrap"><Icon name={w.icon} /></div>
                <span className="it-gap-cell__lbl">{w.name}</span>
              </Link>
            );
          })}
        </div>
        <p className="t-body-s" style={{ color: "var(--muted-foreground)", marginTop: 12 }}><b>{covered}/10 Wells</b> covered in your current trip. <Link to="/wells-surface">Fill the gaps →</Link></p>

        <Link to="/flights" className="card" style={{ marginTop: 20, padding: 20, display: "flex", gap: 16, alignItems: "center", color: "inherit", textDecoration: "none" }}>
          <div className="jn-context__ic" style={{ flexShrink: 0 }}><Icon name="plane" /></div>
          <div style={{ flex: 1 }}>
            <h3 className="t-h3" style={{ fontSize: 18 }}>Search flights</h3>
            <p className="t-body-s" style={{ color: "var(--muted-foreground)", marginTop: 4 }}>Fly-Well · 300+ airlines in one place. You book directly with the airline.</p>
          </div>
          <Icon name="arrow" small />
        </Link>

        <section style={{ marginTop: 48 }}>
          <div className="section__head"><div><Eyebrow>Start with a feeling</Eyebrow><h2>Live interests, ready now.</h2></div><Link className="section__link" to="/special-interests">All {siCount} <Icon name="arrow" small /></Link></div>
          <div className="si-grid">
            {liveSIs.slice(0, 6).map((s) => (
              <Link key={s.id} className="si-tile" to={`/si/${s.id}`}>
                <div className="si-tile__img"><img src={siImg(s.id, 600)} alt="" loading="lazy" referrerPolicy="no-referrer" /></div>
                <div className="si-tile__scrim" /><div className="si-tile__accent" style={{ background: s.accent }} />
                <div className="si-tile__body"><span className="si-tile__name">{s.name}</span><span className="si-tile__sig">{s.sig}</span></div>
              </Link>
            ))}
          </div>
        </section>

        <section style={{ marginTop: 48 }}>
          <div className="section__head"><div><Eyebrow>Read before you go</Eyebrow><h2>Featured guides.</h2></div><Link className="section__link" to="/guides">All guides <Icon name="arrow" small /></Link></div>
          <div className="si-grid" style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
            {guides.slice(0, 3).map((g) => (
              <Link key={g.id} className="card" to={`/guide/${g.id}`} style={{ overflow: "hidden", color: "inherit" }}>
                <div style={{ height: 150, position: "relative" }}>
                  <img src={img(g.img, 600)} alt="" loading="lazy" referrerPolicy="no-referrer" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  <span className="pill pill-gold" style={{ position: "absolute", top: 12, left: 12 }}>{g.type}</span>
                </div>
                <div style={{ padding: 18 }}><h3 className="t-h3" style={{ fontSize: 18 }}>{g.title}</h3><p className="t-body-s" style={{ color: "var(--muted-foreground)", marginTop: 6 }}>{g.read}</p></div>
              </Link>
            ))}
          </div>
        </section>

        <div className="card" style={{ marginTop: 48, padding: 28, display: "flex", gap: 20, alignItems: "center", flexWrap: "wrap" }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}><h3 className="t-h3">Ship-Well &amp; Insure-Well</h3><StatusPill status="soon" /></div>
            <p className="t-body-s" style={{ color: "var(--muted-foreground)", marginTop: 6 }}>These Wells appear now but activate at launch — clearly, never as a false promise.</p>
          </div>
          <ButtonLink to="/wells" variant="secondary">See all Wells</ButtonLink>
        </div>
      </div>
    </>
  );
}
