import { useState } from "react";
import { Link } from "react-router-dom";
import { Icon } from "@/lib/icons";
import { REGION_SI } from "@/data/taxonomy";
import { regionImg } from "@/lib/images";
import { useStore } from "@/store/useStore";
import { useSpecialInterests, useRegions, useRegionCount } from "@/store/useCatalog";
import { track } from "@/lib/track";
import { Eyebrow, Pill } from "@/components/ui/primitives";
import { JourneyBar } from "@/components/ui/StepIndicator";
import { cx } from "@/lib/utils";
import { useT } from "@/lib/i18n";
import { useCatalogName } from "@/lib/i18n-catalog";

type Sort = "match" | "az" | "all";

function scoreFor(code: string, sis: string[]) {
  const tags = REGION_SI[code] || [];
  return sis.reduce((n, si) => n + (tags.includes(si) ? 1 : 0), 0);
}

export default function Regions() {
  const { journeySIs, setRegion } = useStore();
  const regionCount = useRegionCount();
  const t = useT();
  const ct = useCatalogName();
  const sis = useSpecialInterests();
  const allRegions = useRegions();
  const siById = (id: string) => sis.find((s) => s.id === id);
  const [sort, setSort] = useState<Sort>(journeySIs.length ? "match" : "all");

  const regions = [...allRegions];
  if (sort === "az") regions.sort((a, b) => a.name.localeCompare(b.name));
  else if (sort === "match" && journeySIs.length) regions.sort((a, b) => scoreFor(b.code, journeySIs) - scoreFor(a.code, journeySIs));

  // "Considered" signal: the traveler actively comparing regions for their interests.
  const compareSort = (s: Sort) => {
    setSort(s);
    track({ kind: "compare", entity: "region", context: { sort: s, sis: journeySIs, top: regions.slice(0, 3).map((r) => r.code) } });
  };

  return (
    <>
      <JourneyBar current={2} crumbs={[{ label: "Home", to: "/" }, { label: "Special Interests", to: "/special-interests" }, { label: "Regions" }]} />

      <div className="container jn-intro">
        <Eyebrow>{t("reg.eyebrow")}</Eyebrow>
        <h1>{t("reg.h1")}</h1>
        <p className="lead">{t("reg.lead")}</p>

        {journeySIs.length > 0 ? (
          <div className="jn-context">
            <div className="jn-context__ic"><Icon name="compass" small /></div>
            <div><b>{t("reg.ranked")}</b> {t("reg.rankedMid")} {journeySIs.map((s) => ct(`si.${s}.name`, siById(s)?.name ?? s)).filter(Boolean).join(" + ")} {t("reg.rankedTail")}</div>
            <span className="lit">{journeySIs.map((s) => <span key={s}>{ct(`si.${s}.name`, siById(s)?.name ?? s)}</span>)}</span>
          </div>
        ) : (
          <div className="jn-context" role="note">
            <div className="jn-context__ic"><Icon name="info" small /></div>
            <div>{t("reg.browsePre", { n: regionCount })} <Link to="/special-interests" style={{ fontWeight: 600 }}>{t("reg.browseLink")}</Link> {t("reg.browsePost")}</div>
          </div>
        )}

        <div className="jn-toolbar">
          <div className="rg-jump jn-filter" role="group" aria-label="Sort regions">
            <button aria-pressed={sort === "match"} onClick={() => compareSort("match")} disabled={!journeySIs.length}>{t("reg.sortMatch")}</button>
            <button aria-pressed={sort === "az"} onClick={() => compareSort("az")}>A–Z</button>
            <button aria-pressed={sort === "all"} onClick={() => compareSort("all")}>{t("reg.sortAll")}</button>
          </div>
          <span className="jn-sweet"><Icon name="globe" small /> {t("reg.pick", { n: regionCount })}</span>
        </div>
      </div>

      <div className="container" style={{ paddingBottom: 80 }}>
        <div className="rg-grid">
          {regions.map((r) => {
            const score = scoreFor(r.code, journeySIs);
            const strong = score >= 2;
            return (
              <Link
                key={r.code}
                data-region={r.code}
                className={cx("rg-card", r.status !== "live" && "rg-card--preview")}
                to={`/region/${r.code}`}
                onClick={() => setRegion(r.code)}
              >
                <div className="rg-card__media">
                  <img src={regionImg(r.code, 800)} alt="" loading="lazy" referrerPolicy="no-referrer" />
                  <div className="scrim" />
                  <span className="rg-card__code">{r.code}</span>
                  <span className="rg-card__top-badge"><Pill kind={r.status === "live" ? "live" : "preview"}>{r.status === "live" ? t("pill.live") : t("pill.preview")}</Pill></span>
                  <span className="rg-card__name">{ct(`region.${r.code}.name`, r.name)}</span>
                </div>
                <div className="rg-card__body">
                  <span className="rg-card__line">{ct(`region.${r.code}.line`, r.line)}</span>
                  <div className="rg-card__meta">
                    <span className="rg-card__stat"><span className="k">{t("reg.countries")}</span><span className="v">{r.countries}{r.sub ? ` · ${t("reg.subChip")}` : ""}</span></span>
                    <span className="rg-card__stat"><span className="k">{t("reg.gateways")}</span><span className="v rg-card__gw">{r.gateways}</span></span>
                  </div>
                  <div className="rg-card__foot">
                    {journeySIs.length ? (
                      <span className="rg-card__match">{strong ? t("reg.strong") : score > 0 ? t("reg.good") : t("reg.explore")}</span>
                    ) : (
                      <span className="rg-card__match" style={{ color: "var(--muted-foreground)" }}>{r.sub ? <span className="rg-sub-chip">{t("reg.subChip")}</span> : t("reg.explore")}</span>
                    )}
                    <span className="rg-card__cta">{t("reg.explore")} <Icon name="arrow" small /></span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </>
  );
}
