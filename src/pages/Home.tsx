import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Icon } from "@/lib/icons";
import { siImg, img } from "@/lib/images";
import { taglineSubject } from "@/data/taxonomy";
import { useStore } from "@/store/useStore";
import { useSpecialInterests } from "@/store/useCatalog";
import { ButtonLink, Button, Eyebrow, Tagline } from "@/components/ui/primitives";
import { cx } from "@/lib/utils";
import { useT } from "@/lib/i18n";
import { useCatalogName, useChip } from "@/lib/i18n-catalog";
import { MARQUEE_EVENTS, whenLabel } from "@/lib/marquee";

/* ---- "How it works" steps (mirrors the design's custom inline SVGs) ---- */
const STEPS = [
  { n: 1, icon: "sparkle", titleKey: "step1.title", bodyKey: "step1.body" },
  { n: 2, icon: "globe", titleKey: "step2.title", bodyKey: "step2.body" },
  { n: 3, icon: "menu", titleKey: "step3.title", bodyKey: "step3.body" },
  { n: 4, icon: "shield", titleKey: "step4.title", bodyKey: "step4.body" },
];

/* ---- Featured SIs: David's 6, paired by row ---- */
const FEAT_ORDER = ["romance", "tropical", "safari", "expedition", "ultra", "river"];

/* ---- The four cinematic "Operating System" feature bands ---- */
const OS_BANDS = [
  {
    side: "left", num: "25", numSub: "", eyebrow: "os.band1.eyebrow", title: "os.band1.title",
    body: "os.band1.body",
    chips: ["Safari & Wildlife", "Culinary Journeys", "Wellness & Spa", "+22 more"], to: "/special-interests", cta: "os.band1.cta",
    bg: "radial-gradient(120% 90% at 25% 15%, #d8b35e 0%, transparent 55%), linear-gradient(120deg, #8a5a2a 0%, #4a3019 55%, #28190d 100%)",
    image: "desertDunes",
  },
  {
    side: "right", num: "10", numSub: "", eyebrow: "os.band2.eyebrow", title: "os.band2.title",
    body: "os.band2.body",
    chips: ["Fly-Well", "Stay-Well", "Eat-Well"], soonChip: "Insure-Well · soon", to: "/wells", cta: "os.band2.cta",
    bg: "radial-gradient(120% 90% at 75% 20%, #56a89c 0%, transparent 55%), linear-gradient(240deg, #2c6e68 0%, #1c4541 55%, #102825 100%)",
    image: "oceanAerial",
  },
  {
    side: "left", num: "13", numSub: "", eyebrow: "os.band3.eyebrow", title: "os.band3.title",
    body: "os.band3.body",
    chips: ["01F · Western Europe", "05A · East Africa", "11C · Caribbean", "+10 more"], to: "/regions", cta: "os.band3.cta",
    bg: "radial-gradient(120% 90% at 25% 15%, #7b91c4 0%, transparent 55%), linear-gradient(120deg, #3a4f7a 0%, #25304f 55%, #141a2e 100%)",
    image: "mountainValley",
  },
  {
    side: "right", num: "6", numSub: "to choose from", eyebrow: "os.band4.eyebrow", title: "os.band4.title",
    body: "os.band4.body",
    chips: ["Top picks first", "Straight about commissions", "You decide & book"], to: "/wells-surface", cta: "os.band4.cta",
    bg: "radial-gradient(120% 90% at 75% 20%, #cf9468 0%, transparent 55%), linear-gradient(240deg, #9c5b3b 0%, #5e3520 55%, #2e1a10 100%)",
    image: "luxuryPool",
  },
] as const;

/* ============================================================================
   Atlas "live looping demo" — faithful React port of the prototype's script.
   Sequence: greet → user types in the input → user bubble → typing dots →
   bot reply → 3 reco cards → closing line → loop. Honors reduced-motion and
   only starts when scrolled into view.
   ========================================================================== */
type DemoItem =
  | { t: "bot" | "user"; html: string }
  | { t: "typing" }
  | { t: "reco"; n: number; name: string; why: string };

const RECOS: [string, string][] = [
  ["Angama Mara", "Clifftop suites over the Mara — <b>romance + safari</b>"],
  ["Governors’ Camp", "Front-row Great Migration — <b>fits your July dates</b>"],
  ["Mahali Mzuri", "Branson’s tented camp — <b>made for two</b>"],
];
const USER_TEXT = "A safari for our anniversary in July";

function TalkDemo() {
  const [items, setItems] = useState<DemoItem[]>([]);
  const [typed, setTyped] = useState("");
  const rootRef = useRef<HTMLDivElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (bodyRef.current) bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
  }, [items]);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let token = 0;
    let cancelled = false;
    const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

    async function run() {
      const mine = ++token;
      setItems([]);
      setTyped("");

      if (reduce) {
        setItems([
          { t: "bot", html: "Hi! Tell me your dream in a sentence — I’ll start building it." },
          { t: "user", html: USER_TEXT + " 🦁" },
          { t: "bot", html: "The Great Migration peaks then. Here are <b>3 that fit you</b>:" },
          ...RECOS.map(([name, why], i) => ({ t: "reco" as const, n: i + 1, name, why })),
          { t: "bot", html: "Want me to add these to your trip? ✨" },
        ]);
        return;
      }

      await wait(500); if (mine !== token || cancelled) return;
      setItems([{ t: "bot", html: "Hi! Tell me your dream in a sentence — I’ll start building it." }]);
      await wait(900); if (mine !== token || cancelled) return;

      for (let i = 0; i <= USER_TEXT.length; i++) {
        if (mine !== token || cancelled) return;
        setTyped(USER_TEXT.slice(0, i));
        await wait(34);
      }
      await wait(450); if (mine !== token || cancelled) return;
      setTyped("");
      setItems((p) => [...p, { t: "user", html: USER_TEXT + " 🦁" }]);
      await wait(650); if (mine !== token || cancelled) return;

      setItems((p) => [...p, { t: "typing" }]);
      await wait(1300); if (mine !== token || cancelled) return;
      setItems((p) => {
        const c = [...p];
        c[c.length - 1] = { t: "bot", html: "The Great Migration peaks then. Here are <b>3 that fit you</b>:" };
        return c;
      });

      for (let i = 0; i < RECOS.length; i++) {
        await wait(520); if (mine !== token || cancelled) return;
        setItems((p) => [...p, { t: "reco", n: i + 1, name: RECOS[i][0], why: RECOS[i][1] }]);
      }
      await wait(650); if (mine !== token || cancelled) return;
      setItems((p) => [...p, { t: "bot", html: "Want me to add these to your trip? ✨" }]);

      await wait(3600); if (mine !== token || cancelled) return;
      run(); // loop
    }

    let started = false;
    const begin = () => { if (started) return; started = true; run(); };
    let obs: IntersectionObserver | undefined;
    try {
      obs = new IntersectionObserver((entries) => { if (entries.some((e) => e.isIntersecting)) begin(); }, { threshold: 0.3 });
      if (rootRef.current) obs.observe(rootRef.current);
    } catch { /* ignore */ }
    const safety = setTimeout(begin, 1200);

    return () => { cancelled = true; token++; clearTimeout(safety); obs?.disconnect(); };
  }, []);

  return (
    <div className="talk__demo" aria-hidden="true" ref={rootRef}>
      <div className="talk__demo-head">
        <div className="talk__demo-av"><Icon name="sparkles" small /></div>
        <div>
          <div className="talk__demo-title">Speak with Atlas</div>
          <div className="talk__demo-sub"><span className="dot" /> Your Concierge · online</div>
        </div>
        <span className="talk__demo-tag">Live demo</span>
      </div>
      <div className="talk__demo-body" ref={bodyRef}>
        {items.map((it, idx) => {
          if (it.t === "reco") {
            return (
              <div className="talk-rec" key={idx}>
                <div className="talk-rec__num">{it.n}</div>
                <div>
                  <div className="talk-rec__name">{it.name}</div>
                  <div className="talk-rec__why" dangerouslySetInnerHTML={{ __html: it.why }} />
                </div>
              </div>
            );
          }
          if (it.t === "typing") {
            return <div className="talk-msg talk-msg--bot" key={idx}><span className="talk-typing"><span /><span /><span /></span></div>;
          }
          return <div className={`talk-msg talk-msg--${it.t}`} key={idx} dangerouslySetInnerHTML={{ __html: it.html }} />;
        })}
      </div>
      <div className="talk__demo-foot">
        <div className="talk__demo-input"><span>{typed}</span><span className="caret" /></div>
        <div className="talk__demo-mic"><Icon name="mic" small /></div>
        <div className="talk__demo-send"><Icon name="send" small /></div>
      </div>
    </div>
  );
}

/* ============================================================================ */
export default function Home() {
  const { openPanel, startTour } = useStore();
  const navigate = useNavigate();
  const t = useT();
  const ct = useCatalogName();
  const chip = useChip();
  const sis = useSpecialInterests();
  const featured = FEAT_ORDER.map((id) => sis.find((s) => s.id === id)).filter(Boolean) as NonNullable<ReturnType<typeof sis.find>>[];

  const TALK_FEATS = [
    { icon: "message", bKey: "talk.feat1.b", sKey: "talk.feat1.s" },
    { icon: "sound", bKey: "talk.feat2.b", sKey: "talk.feat2.s" },
    { icon: "sparkle", bKey: "talk.feat3.b", sKey: "talk.feat3.s" },
    { icon: "check", bKey: "talk.feat4.b", sKey: "talk.feat4.s" },
  ];

  return (
    <>
      {/* ---- HERO ---- */}
      <section className="hero band-ivory">
        <div className="hero__inner">
          <div className="hero__copy">
            <Eyebrow>{t("hero.eyebrow")}</Eyebrow>
            <h1 style={{ marginTop: 14 }}>{t("hero.title1")}<span className="accent">{t("hero.title2")}</span></h1>
            <p className="hero__lead t-lead" style={{ color: "var(--foreground)" }}>
              {t("hero.lead")}
            </p>
            <div className="hero__cta">
              <ButtonLink to="/special-interests" style={{ height: 52, padding: "0 28px", fontSize: 16 }}>{t("hero.cta1")}</ButtonLink>
              <Button variant="secondary" style={{ height: 52 }} onClick={() => openPanel("concierge")}>{t("hero.cta2")}</Button>
            </div>
            {/* Guided-walk entry: Atlas takes you through the whole journey hands-free
                (also reachable unattended via /?tour=safari). */}
            <button
              className="hero__tour"
              onClick={() => { startTour("safari"); navigate("/special-interests"); }}
            >
              <Icon name="sparkles" small /> Take the guided tour
            </button>
            <p className="hero__taps"><span>{t("hero.taps1")}</span><span className="dot" /><span>{t("hero.taps2")}</span></p>
          </div>
          <div className="hero__media">
            <div className="m1" style={{ position: "absolute", inset: "48px 0", borderRadius: "var(--radius-lg)", boxShadow: "var(--e2)", overflow: "hidden" }}>
              <img src={img("safariGiraffe", 1100)} alt="" referrerPolicy="no-referrer"
                style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
            </div>
            <div className="m-tag">
              <div className="ic-chip"><Icon name="plane" /></div>
              <div className="txt"><div className="t">Safari &amp; Wildlife · East Africa</div><div className="s"><span className="live-dot" /> A live journey, ready to design</div></div>
            </div>
          </div>
        </div>
      </section>

      {/* ---- WHAT IS TRAVELWELL ---- */}
      <section className="section band-linen what">
        <div className="container">
          <div className="what__head">
            <Eyebrow>{t("what.eyebrow")}</Eyebrow>
            <h2 className="what__title">{t("what.title1")}<span className="accent">{t("what.title2")}</span></h2>
            <p className="what__lead">
              {t("what.lead")}
            </p>
          </div>
          <div className="what__steps">
            {STEPS.map((s) => (
              <div className="what__step" key={s.n}>
                <span className="what__step-n">{s.n}</span>
                <div className="what__step-ic"><Icon name={s.icon} /></div>
                <h3>{t(s.titleKey)}</h3>
                <p>{t(s.bodyKey)}</p>
              </div>
            ))}
          </div>
          <div className="what__cta">
            <ButtonLink to="/special-interests" style={{ height: 52, padding: "0 28px", fontSize: 16 }}>{t("what.cta")}</ButtonLink>
            <span className="what__cta-note">{t("what.ctaNote")}</span>
          </div>
        </div>
      </section>

      {/* ---- FEATURED SPECIAL INTERESTS (selectable) ---- */}
      <section className="section band-ivory">
        <div className="container">
          <div className="section__head">
            <div>
              <Eyebrow>{t("feat.eyebrow")}</Eyebrow>
              <h2>{t("feat.title")}</h2>
              <p>{t("feat.lead")}</p>
            </div>
            <Link className="section__link" to="/special-interests">{t("feat.link")} <Icon name="arrow" small /></Link>
          </div>
          <div className="si-rail">
            {featured.map((s) => {
              const live = s.status === "live";
              const media = {
                backgroundImage: `linear-gradient(150deg, color-mix(in oklch, ${s.accent} 30%, transparent), rgba(20,18,14,.55)), url('${siImg(s.id, 800)}')`,
                backgroundSize: "cover", backgroundPosition: "center",
              };
              return (
                <div key={s.id} className={cx("si-card", !live && "is-preview")}>
                  <div className="si-card__media" style={media}>
                    <span className={cx("si-card__pill pill", live ? "pill-live" : "pill-preview")} style={{ background: "rgba(255,255,255,.92)" }}>{live ? t("pill.live") : t("pill.preview")}</span>
                  </div>
                  <div className="si-card__body">
                    <h3>{ct(`si.${s.id}.name`, s.name)}</h3>
                    <Tagline subject={taglineSubject(s)} className="sig" />
                    <div className="si-card__foot">
                      <span>{s.lux ? t("card.lux") : t("card.all")}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ---- MARQUEE MOMENTS — the TLEU forward calendar (the Sooner story) ---- */}
      <section className="section band-linen">
        <div className="container">
          <div className="section__head">
            <div>
              <Eyebrow>{t("mrq.eyebrow")}</Eyebrow>
              <h2>{t("mrq.title")}</h2>
              <p style={{ maxWidth: "56ch" }}>{t("mrq.lead")}</p>
            </div>
            <Link className="section__link" to="/calendar">{t("mrq.seeAll")} <Icon name="arrow" small /></Link>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(230px, 1fr))", gap: 12 }}>
            {MARQUEE_EVENTS.slice(0, 8).map((e) => (
              <Link key={e.id} to="/calendar" className="mrq-tile" style={{ border: "1px solid var(--border)", borderRadius: 14, padding: 14, background: "var(--surface-alt)", display: "flex", flexDirection: "column", gap: 6, textDecoration: "none", color: "inherit" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", minHeight: 22 }}>
                  {e.flagship && <span style={{ background: "var(--gold-deep)", color: "white", fontSize: 11, padding: "2px 8px", borderRadius: 999 }}>{t("mrq.flagship")}</span>}
                  {e.regionName && <span className="t-body-s" style={{ color: "var(--muted-foreground)" }}>{ct(`region.${e.regionCode}.name`, e.regionName)}</span>}
                </div>
                <div style={{ fontWeight: 600, fontSize: 15, lineHeight: 1.3 }}>{e.title}</div>
                <div className="t-body-s" style={{ color: "var(--muted-foreground)", display: "flex", alignItems: "center", gap: 5 }}><Icon name="pin" small /> {whenLabel(e)}</div>
                {e.bookBy && <div style={{ fontSize: 12.5, color: "var(--gold-deep)", fontWeight: 600 }}>{t("mrq.bookBy")}: {e.bookBy}</div>}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ---- A TRAVEL OPERATING SYSTEM — cinematic bands ---- */}
      <section className="section band-ivory" style={{ paddingTop: 0 }}>
        <div className="container">
          <div className="os-intro">
            <Eyebrow>{t("os.eyebrow")}</Eyebrow>
            <h2>{t("os.title")}</h2>
            <p>{t("os.lead")}</p>
          </div>

          {OS_BANDS.map((b) => (
            <article key={b.title} className={`os-feature os-feature--${b.side}`}>
              <div className="os-feature__bg" style={{ background: b.bg }} />
              <img src={img(b.image, 1500)} alt="" referrerPolicy="no-referrer"
                style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", zIndex: 1 }} />
              <div className="os-feature__scrim" />
              <div className="os-feature__content">
                <div className="os-feature__num">{b.num}{b.numSub && <span style={{ fontSize: ".42em", fontWeight: 600, verticalAlign: "middle", opacity: 0.85 }}> {b.numSub}</span>}</div>
                <Eyebrow>{t(b.eyebrow)}</Eyebrow>
                <h3>{t(b.title)}</h3>
                <p>{t(b.body)}</p>
                <div className="os-feature__chips">
                  {b.chips.map((c) => <span key={c} className="os-feature__chip">{chip(c)}</span>)}
                  {"soonChip" in b && b.soonChip && <span className="os-feature__chip soon">{chip(b.soonChip)}</span>}
                </div>
                <Link className="os-feature__cta" to={b.to}>{t(b.cta)} <Icon name="arrow" small /></Link>
              </div>
            </article>
          ))}

          <div style={{ textAlign: "center", marginTop: 40 }}>
            <ButtonLink to="/about" variant="gold" style={{ height: 50, padding: "0 28px", fontSize: 15 }}>{t("os.arch")}</ButtonLink>
          </div>
        </div>
      </section>

      {/* ---- TALK TO ME — Atlas feature + looping demo ---- */}
      <section className="section band-ivory" style={{ paddingTop: 0 }}>
        <div className="container">
          <div className="talk">
            <div className="talk__inner">
              <div className="talk__copy">
                <span className="eyebrow talk__eyebrow"><span className="dot" /> {t("talk.eyebrow")}</span>
                <h2>{t("talk.title1")}<em>{t("talk.title2")}</em></h2>
                <p className="talk__lead">{t("talk.lead")}</p>
                <div className="talk__feats">
                  {TALK_FEATS.map((f) => (
                    <div className="talk__feat" key={f.bKey}>
                      <div className="fic"><Icon name={f.icon} /></div>
                      <div><b>{t(f.bKey)}</b><span>{t(f.sKey)}</span></div>
                    </div>
                  ))}
                </div>
                <div className="talk__cta-row">
                  <Button onClick={() => openPanel("concierge")} style={{ height: 52, padding: "0 26px", fontSize: 16 }}>
                    <Icon name="sparkles" small /> {t("talk.cta")}
                  </Button>
                  <span className="note">{t("talk.note")}</span>
                </div>
              </div>
              <TalkDemo />
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
