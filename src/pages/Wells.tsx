import { Link } from "react-router-dom";
import { Icon } from "@/lib/icons";
import { type Well, WELL_AUDIENCE } from "@/data/taxonomy";
import { WELL_DETAIL } from "@/data/places";
import { useWells } from "@/store/useCatalog";
import { Eyebrow, BrandMark } from "@/components/ui/primitives";
import { cx } from "@/lib/utils";
import { useT } from "@/lib/i18n";
import { useCatalogName, useChip } from "@/lib/i18n-catalog";

function WellCard({ w }: { w: Well }) {
  const t = useT();
  const ct = useCatalogName();
  const chip = useChip();
  const det = WELL_DETAIL[w.id] || {};
  const soon = w.status === "soon";
  const cats = (det.cats || []).slice(0, 4);
  return (
    <Link
      className={cx("wi-card", soon && "wi-card--soon", w.lux && "wi-card--lux")}
      to={soon ? "#" : `/well/${w.id}`}
      aria-disabled={soon || undefined}
      onClick={soon ? (e) => e.preventDefault() : undefined}
    >
      <div className="wi-card__ic"><Icon name={w.icon} /></div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="wi-card__name">
          {w.name}{" "}
          {soon
            ? <span className="pill pill-soon">{t("wl.activated")}</span>
            : <span className="wi-card__body-tag">{w.body}</span>}
        </div>
        <div className="wi-card__tag">{ct(`well.${w.id}.tag`, w.tag)}</div>
        <div className="wi-card__cats">
          {cats.map((c) => <span key={c} className="wi-card__cat">{chip(c)}</span>)}
        </div>
        {soon
          ? <div className="wi-card__foot" style={{ color: "var(--muted-foreground)" }}><Icon name="info" small /> {t("wl.comingFoot")}</div>
          : <div className="wi-card__foot">{t("wl.meet")} <Icon name="arrow" small /></div>}
      </div>
    </Link>
  );
}

export default function Wells() {
  const t = useT();
  const allWells = useWells();
  const wells = allWells.filter((w) => !w.lux); // the core ten
  const universalExtras = allWells.filter((w) => WELL_AUDIENCE[w.id] === "universal"); // Nanny — every family
  const ultraExtras = allWells.filter((w) => WELL_AUDIENCE[w.id] === "ultra"); // Security — Ultra only

  return (
    <main id="main">
      <section className="wi-hero">
        <div className="wi-hero__inner">
          <Eyebrow>{t("wl.eyebrow")}</Eyebrow>
          <h1>{t("wl.h1")}</h1>
          <p>{t("wl.lead")}</p>
          <p className="wi-hero__sig">A Travel Operating System. <span className="tw"><BrandMark world /></span></p>
        </div>
      </section>

      <div className="wi-body">
        <div className="wi-sectlabel" style={{ marginTop: 0 }}>{t("wl.tenLabel")}</div>
        <div className="wi-grid">
          {wells.map((w) => <WellCard key={w.id} w={w} />)}
        </div>

        {/* The +2 Wells beyond the core ten, each tiered to the need (David's call):
            Nanny is universal (every family); Security is Ultra-only. NOTE: copy
            here is first-pass — flagged for David's wordsmith in the review. */}
        <div className="wi-lux-band" style={{ marginTop: 22 }}>
          <div className="wi-lux-band__head">
            <span className="wi-card__ic" style={{ width: 44, height: 44, background: "color-mix(in oklch,var(--accent) 22%,white)", color: "var(--gold-deep)" }}><Icon name="sparkles" /></span>
            <div>
              <span className="eyebrow" style={{ color: "var(--gold-deep)" }}>Two more Wells, tiered to the need</span>
              <h2 className="t-h3" style={{ marginTop: 2 }}>Beyond the core ten</h2>
            </div>
          </div>
          <p className="wi-lux-band__note">
            <b>Nanny-Well</b> is for every family, on any trip (we just never go cheap on who watches the kids).
            {" "}<b>Security-Well</b> — discreet close protection — is reserved for Ultra-Luxury, where it's genuinely needed.
          </p>
          <div className="wi-grid" style={{ marginTop: 18 }}>
            {[...universalExtras, ...ultraExtras].map((w) => (
              <div key={w.id} style={{ position: "relative" }}>
                <span className="pill" style={{ position: "absolute", top: 10, insetInlineEnd: 10, zIndex: 2, background: WELL_AUDIENCE[w.id] === "ultra" ? "var(--accent)" : "var(--secondary)", color: WELL_AUDIENCE[w.id] === "ultra" ? "var(--accent-foreground)" : "var(--primary)" }}>
                  {WELL_AUDIENCE[w.id] === "ultra" ? "Ultra-Luxury" : "Every family"}
                </span>
                <WellCard w={w} />
              </div>
            ))}
          </div>
        </div>
      </div>
      <div style={{ height: 80 }} />
    </main>
  );
}
