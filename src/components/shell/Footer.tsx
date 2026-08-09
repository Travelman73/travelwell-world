import { Link } from "react-router-dom";
import { useT } from "@/lib/i18n";
import { useSiCount, useRegionCount, useWellCount } from "@/store/useCatalog";
import { Tagline } from "@/components/ui/primitives";
import { MASTER_TAGLINE_SUBJECT } from "@/data/taxonomy";

export function Footer() {
  const t = useT();
  // Published counts read the live catalog — never a literal (see useCatalog).
  const siCount = useSiCount();
  const regionCount = useRegionCount();
  const wellCount = useWellCount();
  return (
    <footer className="tw-footer">
      <div className="tw-footer__inner">
        <div className="tw-footer__top">
          <div className="tw-footer__brand">
            <Link className="tw-logo" to="/" dir="ltr">Travel<span className="lwell">Well</span><span className="lworld">.world</span></Link>
            <p className="tw-footer__sig"><Tagline subject={MASTER_TAGLINE_SUBJECT} /></p>
          </div>
          <div className="tw-footer__col">
            <h5>{t("foot.system")}</h5>
            <Link to="/about">{t("foot.about")}</Link>
            <Link to="/special-interests">{t("foot.si", { n: siCount })}</Link>
            <Link to="/regions">{t("foot.regions", { n: regionCount })}</Link>
            <Link to="/wells">{t("foot.wells", { n: wellCount })}</Link>
            <Link to="/providers">{t("foot.providers")}</Link>
          </div>
          <div className="tw-footer__col">
            <h5>{t("foot.journeys")}</h5>
            <Link to="/plan">{t("foot.plan")}</Link>
            <Link to="/guides">{t("foot.guides")}</Link>
            <Link to="/luxury">{t("foot.luxury")}</Link>
            <Link to="/destinations">{t("foot.destinations")}</Link>
            <Link to="/itinerary">{t("foot.itinerary")}</Link>
          </div>
          <div className="tw-footer__col">
            <h5>{t("foot.partners")}</h5>
            <Link to="/demo">{t("foot.demo")}</Link>
            <Link to="/vc-demo">{t("foot.vcdemo")}</Link>
            <Link to="/first-aid-kit">{t("foot.firstaid")}</Link>
            <Link to="/sitemap">{t("foot.sitemap")}</Link>
            <Link to="/disclosure">{t("foot.disclosure")}</Link>
          </div>
          <div className="tw-footer__col">
            <h5>{t("foot.company")}</h5>
            <Link to="/about">{t("nav.about")}</Link>
            <Link to="/contact">{t("foot.contact")}</Link>
            <Link to="/privacy">{t("foot.privacy")}</Link>
            <Link to="/terms">{t("foot.terms")}</Link>
          </div>
        </div>
        <div className="tw-footer__bottom">
          <span>{t("foot.copy")}</span>
          <span className="tw-footer__legal">
            <Link to="/privacy">{t("foot.privacy")}</Link>
            <Link to="/terms">{t("foot.terms")}</Link>
            <Link to="/disclosure">{t("foot.disclosure")}</Link>
            <Link to="/contact">{t("foot.contact")}</Link>
          </span>
        </div>
      </div>
    </footer>
  );
}
