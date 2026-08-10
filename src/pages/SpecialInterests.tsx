import { useState } from "react";
import { Link } from "react-router-dom";
import { Icon } from "@/lib/icons";
import { SI_GROUPS, MASTER_TAGLINE_SUBJECT } from "@/data/taxonomy";
import { siImg } from "@/lib/images";
import { useStore } from "@/store/useStore";
import { useSpecialInterests } from "@/store/useCatalog";
import { Eyebrow, Tagline } from "@/components/ui/primitives";
import { JourneyBar } from "@/components/ui/StepIndicator";
import { SiPickBar } from "@/components/ui/SiPickBar";
import { cx } from "@/lib/utils";
import { useT } from "@/lib/i18n";
import { useCatalogName } from "@/lib/i18n-catalog";

type Filter = "all" | "live" | "soon";

export default function SpecialInterests() {
  const { journeySIs, toggleSI } = useStore();
  const t = useT();
  const ct = useCatalogName();
  const SIS = useSpecialInterests();
  // Default to the live set so the page opens showing what's ready now (no
  // "coming soon" clutter on first view); the roadmap is one tap away.
  const [filter, setFilter] = useState<Filter>("live");

  const match = (status: string) =>
    filter === "all" || (filter === "live" && status === "live") || (filter === "soon" && status !== "live");

  return (
    <>
      <JourneyBar current={1} crumbs={[{ label: "Home", to: "/" }, { label: "Special Interests" }]} />

      <div className="container jn-intro">
        <Eyebrow>{t("sip.eyebrow")}</Eyebrow>
        <h1>{t("sip.h1")}</h1>
        <p className="lead">
          {t("sip.lead")}
        </p>
        <Tagline subject={MASTER_TAGLINE_SUBJECT} className="jn-tagline" />

        <div className="jn-toolbar">
          <span className="jn-sweet"><Icon name="sparkle" small /> {t("sip.sweet")} — <b style={{ color: "var(--foreground)" }}>{t("sip.sweetTail")}</b></span>
          <div className="jn-filter" role="group" aria-label="Filter interests">
            <button aria-pressed={filter === "live"} onClick={() => setFilter("live")}>{t("sip.now")}</button>
            <button aria-pressed={filter === "all"} onClick={() => setFilter("all")}>{t("sip.all")}</button>
            <button aria-pressed={filter === "soon"} onClick={() => setFilter("soon")}>{t("sip.soon")}</button>
          </div>
        </div>
      </div>

      <div className="container" style={{ paddingBottom: 80 }}>
        {SI_GROUPS.map((group) => {
          const items = SIS.filter((s) => s.group === group.id && match(s.status));
          if (!items.length) return null;
          const live = SIS.filter((s) => s.group === group.id && s.status === "live").length;
          const total = SIS.filter((s) => s.group === group.id).length;
          return (
            <section className="si-group" key={group.id}>
              <div className="si-group__head">
                <h2 className="si-group__title">{t(`grp.${group.id}.name`)}</h2>
                <span className="si-group__blurb">{t(`grp.${group.id}.blurb`)}</span>
                <span className="si-group__count">{live} {t("grp.live")} · {total} {t("grp.total")}</span>
              </div>
              <div className="si-grid">
                {items.map((s) => {
                  const isSoon = s.status !== "live";
                  const picked = journeySIs.includes(s.id);
                  const name = ct(`si.${s.id}.name`, s.name);
                  return (
                    /* TWO TARGETS, not one (David-agreed 2026-08-10). The CARD
                       opens the interest so the traveler chooses with their eyes
                       open; a distinct, loud control adds it. They are siblings,
                       never nested — a button inside a link is invalid markup and
                       breaks keyboard and screen-reader behaviour both ways. */
                    <div
                      key={s.id}
                      data-si={s.id}
                      data-picked={picked ? "true" : undefined}
                      className={cx("si-tile", isSoon && "si-tile--soon")}
                    >
                      <Link
                        className="si-tile__open"
                        to={`/si/${s.id}`}
                        aria-label={isSoon ? t("sip.openSoonLabel", { name }) : t("sip.openLabel", { name })}
                      >
                        <span className="si-tile__img">
                          <img src={siImg(s.id, 700)} alt="" loading="lazy" referrerPolicy="no-referrer" />
                        </span>
                        <span className="si-tile__scrim" />
                        <span className="si-tile__accent" style={{ background: s.accent }} />
                        <span className="si-tile__body">
                          <span className="si-tile__name">{name}</span>
                          <span className="si-tile__sig">{s.sig.charAt(0).toUpperCase() + s.sig.slice(1)}</span>
                        </span>
                        <span className="si-tile__view">{isSoon ? t("pill.preview") : t("sip.view")} <Icon name="arrow" small /></span>
                      </Link>

                      {isSoon ? (
                        <span className="si-soon-badge">{t("sip.soon")}</span>
                      ) : (
                        /* The loudest thing on the card, per David — a solid
                           labelled pill, not a subtle heart. Two picks is the
                           sweet spot, so easier browsing must not make
                           over-selecting easier. */
                        <button
                          className="si-tile__add"
                          aria-pressed={picked}
                          aria-label={picked ? t("sip.removeLabel", { name }) : t("sip.addLabel", { name })}
                          onClick={() => toggleSI(s.id)}
                        >
                          <Icon name={picked ? "check" : "plus"} small />
                          <span className="si-tile__add-t">{picked ? t("sip.added") : t("sip.add")}</span>
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>

      <SiPickBar />
    </>
  );
}
