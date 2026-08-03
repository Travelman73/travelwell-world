import { useState, useEffect, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { Icon } from "@/lib/icons";
import { useStore } from "@/store/useStore";
import { useSpecialInterests } from "@/store/useCatalog";
import { Eyebrow } from "@/components/ui/primitives";
import { cx } from "@/lib/utils";
import { fetchTravelId, type TravelIdRecord } from "@/lib/travelId";
import { deriveIdentity, tierLabel, tierPeak, activityLabel, accessLabel, type DisplayIdentity } from "@/lib/identity";
import { signOut } from "@/lib/auth";

// Demo identity — the warm showcase when nobody's signed in. Real records override
// every field (see deriveIdentity). The permanent *constant*; the vision is separate.
const DEMO = {
  id: "TW-2A9F-K3",
  name: "Amara",
  cohortAge: "established",
  since: "Jun 2026",
  party: [
    { name: "Amara", initial: "A", cohort: "Established Adult · 35–44", tag: "You", lead: true },
    { name: "Jhumur", initial: "J", cohort: "Established Adult · 35–44", tag: "Partner", lead: false },
  ],
  interests: ["safari", "romance", "culinary"],
  budget: { stay: ["premier", "luxury"], fly: ["business"], eat: ["premier"], move: ["comfort"], activities: ["comfort", "premier"] } as Record<string, string[]>,
  activity: "moderately-active",
  access: ["no-stairs", "frequent-rest"],
  capabilities: "Happy on gentle game-drive tracks and short nature walks; comfortable with early starts.",
  accessibility: "Step-free rooms preferred; a rest in the afternoon.",
  dietary: "Pescatarian (Jhumur) · No shellfish",
  vision: "An unhurried anniversary safari — golden-hour game drives, candlelit dinners under the stars, and a few slow mornings with coffee and a view.",
};

const BUDGET_WELLS = [
  { id: "stay", name: "Stay-Well", icon: "bed" }, { id: "fly", name: "Fly-Well", icon: "plane" },
  { id: "eat", name: "Eat-Well", icon: "utensils" }, { id: "move", name: "Move-Well", icon: "car" },
  { id: "activities", name: "Activities-Well", icon: "compass" },
];

function InterestChips({ interests }: { interests: string[] }) {
  const sis = useSpecialInterests();
  return (
    <div className="idp-chips">
      {interests.map((id) => { const si = sis.find((s) => s.id === id); return si ? <span className="idp-chip" key={id}><span className="dot" style={{ background: si.accent }} />{si.name}</span> : <span className="idp-chip" key={id}>{id}</span>; })}
    </div>
  );
}

/** The permanent Identity Card — the CONSTANT (who they are). No trip vision here. */
function IdentityCard({ id }: { id: DisplayIdentity }) {
  return (
    <div className="idp">
      <div className="idp__top">
        <div className="idp__top-row">
          <div className="idp__seal"><Icon name="globe" /></div>
          <div>
            <div className="idp__kicker">TravelWell · Identity Card</div>
            <div className="idp__title">{id.name}</div>
          </div>
        </div>
        <div className="idp__no">
          <span>ID · {id.id}</span>
          <span>PARTY · {id.party.length}</span>
          {id.cohort && <span>AGE · {id.cohort.range}</span>}
          <span>SINCE · {id.since.toUpperCase()}</span>
        </div>
      </div>
      <div className="idp__body">
        <div className="idp__col">
          <h3>Traveling party</h3>
          <div className="idp-party">
            {id.party.map((m) => (
              <div className="idp-member" key={m.name + m.tag}>
                <div className="idp-member__av">{m.initial}</div>
                <div><div className="idp-member__name">{m.name}</div><div className="idp-member__meta">{m.tag === "You" ? "You" : m.tag} · {m.cohort}</div></div>
                <span className={cx("idp-member__tag pill", m.lead ? "pill-live" : "pill-preview")}>{m.tag}</span>
              </div>
            ))}
          </div>
          <h3 style={{ marginTop: 22 }}>Travels for</h3>
          <InterestChips interests={id.interests} />
        </div>
        <div className="idp__col">
          <h3>Budget style, per Well</h3>
          <div className="idp-chips">
            {BUDGET_WELLS.map((w) => {
              const sel = id.budget[w.id] || [];
              if (!sel.length) return null;
              return <span className="idp-chip" style={{ background: "var(--surface-alt)", border: "1px solid var(--border)" }} key={w.id}><Icon name={w.icon} small /> {sel.map((k) => tierLabel(w.id, k)).join(" · ")}</span>;
            })}
          </div>
          <h3 style={{ marginTop: 20 }}>How you move</h3>
          <div className="idp-chips">
            {activityLabel(id.activity) && <span className="idp-chip" style={{ background: "var(--surface-alt)", border: "1px solid var(--border)" }}><Icon name="compass" small /> {activityLabel(id.activity)}</span>}
            {id.access.map((a) => <span className="idp-chip" style={{ background: "var(--surface-alt)", border: "1px solid var(--border)" }} key={a}><Icon name="check" small /> {accessLabel(a)}</span>)}
            {id.dietary && <span className="idp-chip" style={{ background: "var(--surface-alt)", border: "1px solid var(--border)" }}><Icon name="utensils" small /> {id.dietary}</span>}
            {!id.activity && !id.access.length && !id.dietary && <span className="idp-member__meta">Fully mobile · no notes</span>}
          </div>
        </div>
      </div>
      <div className="idp__foot">
        <span className="idp__sig">The constant — who you are. Refreshed every trip, never rebuilt. <span className="tw">Travel Well.</span></span>
        <span className="pill pill-live">{id.synced ? "Saved to your account" : "Saved on this device"}</span>
      </div>
    </div>
  );
}

export default function Profile() {
  const { openPanel, showToast, user, setUser } = useStore();
  const [editing, setEditing] = useState<string | null>(null);
  const [rec, setRec] = useState<TravelIdRecord | null>(null);

  // When signed in, load the Travel ID from the database.
  useEffect(() => {
    if (user) fetchTravelId(user.id).then(setRec);
    else setRec(null);
  }, [user]);

  const id = deriveIdentity(rec, DEMO);

  const Sec = ({ k, icon, title, children }: { k: string; icon: string; title: ReactNode; children: ReactNode }) => {
    if (editing === k) {
      return (
        <div className="pf-sec pf-edit">
          <div className="pf-sec__head"><div className="pf-sec__ic"><Icon name={icon} /></div><div className="pf-sec__title">{title}</div></div>
          <div className="pf-sec__body">
            <div className="pf-edit__fields"><p className="fld__hint"><Icon name="info" small /> Editing is a demo here — changes re-tune your trip in the full product.</p></div>
            <div className="pf-edit__actions">
              <button className="btn btn-secondary" onClick={() => setEditing(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={() => { setEditing(null); showToast("Saved — your trip will re-tune around these changes."); }}>Save changes</button>
            </div>
          </div>
        </div>
      );
    }
    return (
      <div className="pf-sec">
        <div className="pf-sec__head">
          <div className="pf-sec__ic"><Icon name={icon} /></div><div className="pf-sec__title">{title}</div>
          <button className="pf-sec__edit" onClick={() => setEditing(k)}><Icon name="arrow" small /> Edit</button>
        </div>
        <div className="pf-sec__body">{children}</div>
      </div>
    );
  };

  return (
    <div className="pf">
      <div className="pf__head">
        <div>
          <Eyebrow>Your Travel ID</Eyebrow>
          <h1>{id.name}'s travel identity</h1>
          {id.synced
            ? <p className="t-body-s" style={{ color: "var(--muted-foreground)", marginTop: 4 }}><Icon name="check" small /> Synced from your account · {user?.email}</p>
            : <p className="t-body-s" style={{ color: "var(--muted-foreground)", marginTop: 4 }}>Built once, refreshed every trip — you never start over.</p>}
        </div>
        <div className="pf__head-actions">
          {user
            ? <button className="btn btn-secondary" onClick={async () => { await signOut(); setUser(null); showToast("Signed out"); }}>Sign out</button>
            : <Link className="btn btn-secondary" to="/signup"><Icon name="arrow" small /> Rebuild from scratch</Link>}
          <Link className="btn btn-primary" to="/itinerary">Open my trip →</Link>
        </div>
      </div>

      <IdentityCard id={id} />

      {/* The VARIABLE — the current trip's vision, deliberately separate from the
          permanent identity above. This is what the Lifetime Loop re-asks each trip. */}
      <div className="pf-vision">
        <div className="pf-vision__head">
          <span className="pf-vision__eyebrow"><Icon name="sparkles" small /> This trip · the variable</span>
          <span className="pill pill-gold">Changes every trip</span>
        </div>
        <p className="pf-vision__quote">“{id.vision}”</p>
        <div className="pf-vision__foot">
          <span className="pf-vision__note">Your identity above stays constant — only the vision changes. Next trip, Atlas just asks what you're picturing now.</span>
          <button className="btn btn-secondary" onClick={() => openPanel("concierge")}><Icon name="sparkle" small /> Picture a new trip</button>
        </div>
      </div>

      <h2 className="t-h3" style={{ marginTop: 36, marginBottom: 4 }}>Edit any detail</h2>
      <p className="t-body-s" style={{ color: "var(--muted-foreground)", marginBottom: 18 }}>Change anything here and your dream trip quietly re-tunes. No account required — this lives on your device.</p>

      <div className="pf-sections">
        <Sec k="party" icon="heart" title="Traveling party">
          {id.party.map((m) => <div className="pf-row" key={m.name + m.tag}><span className="pf-row__k">{m.name}</span><span className="pf-row__v">{m.cohort} · {m.tag}</span></div>)}
        </Sec>

        <Sec k="interests" icon="compass" title="Interests"><InterestChips interests={id.interests} /></Sec>

        <Sec k="budget" icon="gift" title="Budget, per Well">
          <div className="pf-budget">
            {BUDGET_WELLS.map((w) => {
              const sel = id.budget[w.id] || [];
              const maxPct = tierPeak(w.id, sel);
              const labels = sel.map((k) => tierLabel(w.id, k)).join(" · ") || "—";
              return (
                <div className="pf-budget__row" key={w.id}>
                  <span className="pf-budget__name"><Icon name={w.icon} small /> {w.name}</span>
                  <span className="pf-budget__track"><span className="pf-budget__fill" style={{ width: `${maxPct}%` }} /></span>
                  <span className="pf-budget__tier">{labels}</span>
                </div>
              );
            })}
          </div>
        </Sec>

        <Sec k="care" icon="shield" title={<>Safer-Informed <span className="pf-sec__badge">Both sides</span></>}>
          <div className="pf-row"><span className="pf-row__k">Pace</span><span className="pf-row__v">{activityLabel(id.activity) || "Not set"}</span></div>
          <div className="pf-row"><span className="pf-row__k">Access</span><span className="pf-row__v">{id.access.map(accessLabel).join(" · ") || "Fully mobile"}</span></div>
          <div className="pf-row"><span className="pf-row__k">Fully up for</span><span className="pf-row__v">{id.capabilities || "—"}</span></div>
          <div className="pf-row"><span className="pf-row__k">Good to know</span><span className="pf-row__v">{id.accessibility || "Nothing noted"}</span></div>
          <div className="pf-row"><span className="pf-row__k">Dietary</span><span className="pf-row__v">{id.dietary || "None noted"}</span></div>
          <p className="pf-sec__promise"><Icon name="heart" small /> We use every answer to build the trip <b>around</b> you — never to limit you.</p>
        </Sec>
      </div>

      <div className="pf-danger">
        <div><Icon name="info" /></div>
        <div><div className="pf-danger__t">Reset your Travel ID</div><div className="pf-danger__s">Clear everything in your Identity Card and start fresh. Your itinerary is kept.</div></div>
        <button className="btn btn-danger" onClick={() => openPanel("concierge")}>Reset Travel ID</button>
      </div>
    </div>
  );
}
