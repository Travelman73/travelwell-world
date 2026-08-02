import { Link } from "react-router-dom";
import { useState, useRef, useEffect } from "react";
import { Icon } from "@/lib/icons";
import { LOCALES } from "@/data/taxonomy";
import { useStore } from "@/store/useStore";
import { useT } from "@/lib/i18n";
import { Logo } from "./Logo";

export function Header() {
  const { locale, setLocale, openPanel, trip, user } = useStore();
  const t = useT();
  const [localeOpen, setLocaleOpen] = useState(false);
  const localeRef = useRef<HTMLDivElement>(null);
  const L = LOCALES.find((l) => l.code === locale) || LOCALES[0];

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (localeRef.current && !localeRef.current.contains(e.target as Node)) setLocaleOpen(false);
    };
    document.addEventListener("click", onDoc);
    return () => document.removeEventListener("click", onDoc);
  }, []);

  return (
    <header className="tw-header">
      <div className="tw-header__bar">
        <button className="tw-iconbtn tw-burger" aria-label="Menu" onClick={() => openPanel("mega")}>
          <Icon name="menu" />
        </button>
        <Logo />
        <nav className="tw-nav" aria-label="Primary">
          <button className="tw-nav__trigger" aria-controls="tw-mega" onClick={() => openPanel("mega")}>
            {t("nav.worlds")} <Icon name="chev" small className="chev" />
          </button>
          <Link className="tw-nav__link" to="/plan">{t("nav.plan")}</Link>
          <Link className="tw-nav__link" to="/guides">{t("nav.guides")}</Link>
          <Link className="tw-nav__link" to="/about">{t("nav.about")}</Link>
        </nav>
        <div className="tw-header__spacer" />
        <div className="tw-header__actions">
          {user
            ? <Link className="tw-signin" to="/profile" title="Your Travel ID">{user.email ? user.email.split("@")[0] : "Account"}</Link>
            : <Link className="tw-signin" to="/signin">{t("nav.signin")}</Link>}
          <div className="tw-locale" ref={localeRef}>
            <button
              className="tw-locale__btn"
              aria-label="Change language"
              aria-haspopup="true"
              aria-expanded={localeOpen}
              onClick={(e) => { e.stopPropagation(); setLocaleOpen((o) => !o); }}
            >
              <Icon name="globe" small /> <span className="loc-lbl">{L.code.toUpperCase()}</span> <Icon name="chev" small />
            </button>
            {localeOpen && (
              <div className="tw-locale__menu">
                <div className="tw-locale__group">Launch languages</div>
                {LOCALES.filter((l) => l.tier === "launch").map((l) => (
                  <button
                    key={l.code} className="tw-locale__item"
                    aria-current={l.code === locale || undefined}
                    onClick={() => { setLocale(l.code); setLocaleOpen(false); }}
                  >
                    {l.label}<span className="native">{l.native}</span>
                  </button>
                ))}
                <div className="tw-locale__group">Coming soon</div>
                {LOCALES.filter((l) => l.tier === "staged").map((l) => (
                  <button
                    key={l.code} className="tw-locale__item"
                    aria-current={l.code === locale || undefined}
                    onClick={() => { setLocale(l.code); setLocaleOpen(false); }}
                  >
                    {l.label}<span className="native">{l.native}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          <button className="tw-iconbtn tw-iconbtn--emergency" aria-label="Emergency help" onClick={() => openPanel("emergency")}>
            <Icon name="cross" />
          </button>
          <button className="tw-iconbtn" aria-label="Your Trip" onClick={() => openPanel("tray")}>
            <Icon name="bag2" />
            {trip.length > 0 && <span className="badge">{trip.length}</span>}
          </button>
          <button className="tw-talk-btn" aria-label={t("nav.atlas")} onClick={() => openPanel("concierge")}>
            <Icon name="sparkles" small /> <span className="lbl">{t("nav.atlas")}</span>
          </button>
        </div>
      </div>
    </header>
  );
}
