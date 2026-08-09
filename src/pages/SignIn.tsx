import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Icon } from "@/lib/icons";
import { img } from "@/lib/images";
import { useStore } from "@/store/useStore";
import { sendMagicLink, isSupabaseConfigured } from "@/lib/auth";
import { Eyebrow, BrandMark } from "@/components/ui/primitives";

const USER = { name: "Amara", initial: "A", email: "amara@email.com" };
const TRIP = { name: "Kenya: Anniversary Safari", region: "East Africa", dates: "Jul 12–22, 2026", party: "2 travelers", coverage: 3, total: 6, img: "safariGiraffe" };

type State = "unknown" | "sent" | "recognized";

const QUOTES: Record<State, string> = {
  recognized: "Your Kenya is right where you left it.",
  sent: "One tap, and you're home again.",
  unknown: "Every great trip starts with hello.",
};

export default function SignIn() {
  const navigate = useNavigate();
  const { openPanel, showToast } = useStore();
  const [state, setState] = useState<State>("unknown");
  const [email, setEmail] = useState("");
  const [err, setErr] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) { setErr(true); return; }
    setErr(false);
    if (isSupabaseConfigured) {
      const { ok, error } = await sendMagicLink(email);
      if (!ok) { showToast(error === "unconfigured" ? "Sign-in isn't connected yet" : "Couldn't send the link — try again"); return; }
    }
    setState("sent");
  }

  const TalkBtn = ({ sub }: { sub: string }) => (
    <button className="si-talk" onClick={() => openPanel("concierge")}>
      <span className="si-talk__av"><Icon name="sparkle" /></span>
      <span><span className="si-talk__t">Speak with Atlas</span><span className="si-talk__s">{sub}</span></span>
      <span className="si-talk__arrow"><Icon name="arrow" /></span>
    </button>
  );

  return (
    <div className="si-wrap">
      <aside className="si-art">
        <div className="si-art__img"><img src={img("safariGiraffe", 1400)} alt="" referrerPolicy="no-referrer" /></div>
        <div className="si-art__scrim" />
        <Link className="si-art__logo" to="/">Travel<span className="lwell">Well</span><span className="lworld">.world</span></Link>
        <div className="si-art__quote">
          <Eyebrow>Welcome back</Eyebrow>
          <h2>{QUOTES[state]}</h2>
          <p className="si-art__sig">Pick up the thread. <span className="tw"><BrandMark /></span></p>
        </div>
      </aside>

      <section className="si-panel">
        <div className="si-card" key={state}>
          {state === "unknown" && (
            <>
              <div className="si-icon-lg"><Icon name="globe" /></div>
              <Eyebrow className="si-eyebrow">Sign in</Eyebrow>
              <h1 className="si-title">Let's find your trips.</h1>
              <p className="si-sub">We don't recognize this device yet. Enter your email and we'll send a magic link — or start fresh, no account needed.</p>
              <form className="si-form" onSubmit={submit} noValidate>
                <div className="fld">
                  <label htmlFor="si-email">Email address</label>
                  <input type="email" id="si-email" placeholder="you@email.com" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                  {err && <div className="fld__err" style={{ display: "flex" }}><Icon name="info" small /> Please enter a valid email address.</div>}
                </div>
                <button type="submit" className="btn btn-primary" style={{ height: 54, fontSize: 16, width: "100%" }}>Send me a magic link</button>
              </form>
              <div className="si-or">new to TravelWell?</div>
              <Link className="btn btn-secondary" to="/signup" style={{ width: "100%", height: 50 }}>Create a Travel ID</Link>
              <div style={{ marginTop: 16 }}><TalkBtn sub="Explore without an account — I'll guide you." /></div>
            </>
          )}

          {state === "sent" && (
            <>
              <div className="si-icon-lg"><Icon name="message" /></div>
              <Eyebrow className="si-eyebrow">New device · passwordless</Eyebrow>
              <h1 className="si-title">Check your inbox.</h1>
              <p className="si-sub">We sent a one-tap magic link to sign you in securely. No password, ever — just open the email and you're back.</p>
              <div className="si-mail-to"><Icon name="message" small /> {email || USER.email}</div>
              <div className="si-actions" style={{ marginTop: 26 }}>
                <button className="btn btn-primary" onClick={() => { showToast(`Welcome back, ${USER.name} — you're signed in`); setState("recognized"); }}>I opened the link →</button>
              </div>
              <p className="si-resend">Didn't get it? <button onClick={() => showToast("Fresh magic link sent")}>Resend link</button> · <button onClick={() => setState("unknown")}>Use a different email</button></p>
              <div className="si-nudge">
                <Icon name="shield" small />
                <span>The link expires in 15 minutes and works once. If it expires, just request a fresh one.</span>
              </div>
            </>
          )}

          {state === "recognized" && (
            <>
              <div className="si-avatar">{USER.initial}</div>
              <Eyebrow className="si-eyebrow">Signed in on this device</Eyebrow>
              <h1 className="si-title">Welcome back, {USER.name}.</h1>
              <p className="si-sub">Ready when you are. Continue the trip you were designing, start something new — or take a quick check-in so it fits the you of today.</p>
              <button className="si-checkin" onClick={() => navigate("/welcome-back")}>
                <span className="si-checkin__ic"><Icon name="sparkles" /></span>
                <span className="si-checkin__b"><span className="si-checkin__t">A quick check-in</span><span className="si-checkin__s">A year on? Confirm what's changed — we refresh, never rebuild.</span></span>
                <span className="si-checkin__arrow"><Icon name="arrow" /></span>
              </button>
              <div className="si-actions">
                <div className="si-trip">
                  <div className="si-trip__media">
                    <img src={img(TRIP.img, 800)} alt="" referrerPolicy="no-referrer" />
                    <span className="pill pill-live" style={{ background: "rgba(255,255,255,.92)" }}>In progress</span>
                  </div>
                  <div className="si-trip__body">
                    <div className="si-trip__name">{TRIP.name}</div>
                    <div className="si-trip__meta"><Icon name="pin" small /> {TRIP.region} <span>·</span> {TRIP.dates} <span>·</span> {TRIP.party}</div>
                    <div className="si-trip__coverage" title={`${TRIP.coverage} of ${TRIP.total} Wells planned`}>
                      {Array.from({ length: TRIP.total }, (_, i) => <i key={i} className={i < TRIP.coverage ? "on" : ""} />)}
                    </div>
                    <div className="si-trip__meta" style={{ marginTop: 8 }}>{TRIP.coverage} of {TRIP.total} Wells planned · saved automatically</div>
                    <div className="si-trip__foot">
                      <Link className="btn btn-primary" to="/itinerary">Continue this trip →</Link>
                    </div>
                  </div>
                </div>
                <button className="btn btn-secondary" onClick={() => navigate("/special-interests")}>Start a new trip</button>
              </div>
              <div className="si-or">or, not sure where to begin?</div>
              <TalkBtn sub="Tell me what changed and I'll adjust your trip." />
            </>
          )}
        </div>
      </section>
    </div>
  );
}
