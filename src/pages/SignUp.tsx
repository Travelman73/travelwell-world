import { useState, useEffect, useRef, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { Icon } from "@/lib/icons";
import { useStore } from "@/store/useStore";
import { Eyebrow } from "@/components/ui/primitives";
import { savePendingTravelId } from "@/lib/travelId";
import { sendMagicLink, isSupabaseConfigured } from "@/lib/auth";
import {
  AGE_COHORTS, ADULT_COHORTS, cohortLabel, isMinorCohort,
  budgetOptionsFor, tierLabel, MAX_BUDGET_PICKS,
  ACTIVITY_LEVELS, ACCESS_NEEDS, activityLabel, accessLabel,
} from "@/lib/identity";

/**
 * THE BUILDER ENDS ON THE VISION (David, confirmed 2026-08).
 *
 * Every step before the last collects a CONSTANT — who they are, how they move,
 * what they can spend, who is with them. Those are true next year too. The
 * vision is the VARIABLE: beach this year, ski next, and it is re-asked at the
 * start of every trip rather than stored as identity.
 *
 * So the order isn't cosmetic, it's the architecture in sequence. Sign-up earns
 * the constants and finishes by asking what they're dreaming of; the trip flow
 * then OPENS on the vision, because the constants are already on file. "Earn the
 * picture, then interpret it" at sign-up; dream-first every trip after.
 *
 * `dream` used to sit sixth of seven, with budget as the finale — so the builder
 * closed on a price grid rather than on the traveller's own words. Steps are
 * selected by `key` (never by index) and validation is keyed too, so this array
 * IS the running order: reorder here and the flow follows.
 */
const STEPS = [
  { key: "you", label: "You", sub: "Name & email" },
  { key: "age", label: "Age range", sub: "Safe & exciting" },
  { key: "move", label: "How you move", sub: "Pace & access" },
  { key: "party", label: "Your party", sub: "Who's traveling" },
  { key: "budget", label: "Budget blend", sub: "Per-Well tiers" },
  { key: "notif", label: "Notifications", sub: "Who hears from us" },
  { key: "dream", label: "Your dream", sub: "In your own words" },
] as const;

const THEMES = [
  { v: "wild", t: "Wild & remote", s: "Big nature, few crowds" },
  { v: "sun", t: "Sun & sea", s: "Beaches, islands, slow days" },
  { v: "culture", t: "Culture & cities", s: "History, food, design" },
  { v: "restore", t: "Slow & restorative", s: "Wellness, space to breathe" },
  { v: "celebrate", t: "A big celebration", s: "Honeymoon, milestone, group" },
  { v: "offbeat", t: "Off the beaten path", s: "Surprise me" },
];
const LENGTHS = [
  { v: "weekend", t: "A weekend" }, { v: "week", t: "About a week" },
  { v: "twoweek", t: "Two weeks" }, { v: "month", t: "A month or more" }, { v: "unsure", t: "Not sure yet" },
];
const BUDGET_WELLS = [
  { id: "fly", name: "Fly-Well", icon: "plane", tag: "Getting there" },
  { id: "stay", name: "Stay-Well", icon: "bed", tag: "Where you rest" },
  { id: "eat", name: "Eat-Well", icon: "utensils", tag: "What you savor" },
  { id: "move", name: "Move-Well", icon: "car", tag: "Getting around" },
  { id: "gear", name: "Gear-Well", icon: "bag", tag: "What you carry" },
  { id: "beauty", name: "Beauty-Well", icon: "sparkle", tag: "Looking & feeling well" },
  { id: "activities", name: "Activities-Well", icon: "compass", tag: "What excites you" },
  { id: "shop", name: "Shop-Well", icon: "gift", tag: "Taking it home" },
  { id: "insure", name: "Insure-Well", icon: "shield", tag: "Peace of mind" },
  { id: "ship", name: "Ship-Well", icon: "box", tag: "Sending it ahead" },
];
const initials = (n: string) => (n || "?").trim().split(/\s+/).map((w) => w[0]).slice(0, 2).join("").toUpperCase() || "?";
const validEmail = (e: string) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e);
const relLabel = (r: string) => (({ partner: "Partner", child: "Child", family: "Family", companion: "Companion" }) as Record<string, string>)[r] || "Companion";

type Member = { name: string; age: string; rel: string };

export default function SignUp() {
  const navigate = useNavigate();
  const { openPanel, showToast } = useStore();
  const [step, setStep] = useState(0);
  const [name, setName] = useState(""); const [email, setEmail] = useState("");
  const [nameErr, setNameErr] = useState(false); const [emailErr, setEmailErr] = useState(false);
  const [age, setAge] = useState("");
  const [activity, setActivity] = useState("");
  const [access, setAccess] = useState<string[]>([]);
  const [ableNote, setAbleNote] = useState(""); const [knowNote, setKnowNote] = useState("");
  const [party, setParty] = useState<Member[]>([]);
  const [draft, setDraft] = useState<Member | null>(null);
  const [notif, setNotif] = useState<Record<string, string>>({});
  const [dream, setDream] = useState("");
  const [themes, setThemes] = useState<string[]>([]);
  const [length, setLength] = useState("");
  const [budget, setBudget] = useState<Record<string, string[]>>({});
  const [openDD, setOpenDD] = useState<string | null>(null);

  const isBuild = step >= STEPS.length;
  const lastStep = step === STEPS.length - 1;
  const pct = isBuild ? 100 : ((step + 1) / STEPS.length) * 100;

  // On reaching the build screen: stash the Travel ID and (if connected) send a
  // magic link. It's written to the DB once they verify (Shell flushes it).
  const persistedRef = useRef(false);
  useEffect(() => {
    if (!isBuild || persistedRef.current) return;
    persistedRef.current = true;
    savePendingTravelId({
      display_name: name || null,
      age_range: age || null,
      trip_intent: dream || null,
      interests: [],
      budget_ranges: budget,
      party,
      activity_level: activity || null,
      access_needs: access,
      capabilities: ableNote.trim() || null,
      dietary: null,
      accessibility: knowNote.trim() || null,
      consent: true,
    });
    if (isSupabaseConfigured && validEmail(email)) sendMagicLink(email);
  }, [isBuild, name, age, dream, budget, party, email, activity, access, ableNote, knowNote]);

  function validate(): boolean {
    const key = STEPS[step].key;
    if (key === "you") {
      let ok = true;
      if (!name.trim()) { setNameErr(true); ok = false; }
      if (!validEmail(email)) { setEmailErr(true); ok = false; }
      return ok;
    }
    if (key === "age" && !age) { showToast("Pick an age range to continue"); return false; }
    return true;
  }
  function next() {
    if (step < STEPS.length && !validate()) return;
    setStep((s) => s + 1);
  }
  const toggleTheme = (v: string) => setThemes((t) => (t.includes(v) ? t.filter((x) => x !== v) : t.length >= 3 ? t : [...t, v]));
  // Access is multi-select, but "Fully Mobile" is exclusive (clears the rest, and any need clears it).
  const toggleAccess = (v: string) => setAccess((cur) => {
    if (v === "fully-mobile") return cur.includes("fully-mobile") ? [] : ["fully-mobile"];
    const base = cur.filter((x) => x !== "fully-mobile");
    return base.includes(v) ? base.filter((x) => x !== v) : [...base, v];
  });
  const toggleBudget = (id: string, v: string) => {
    const cur = budget[id] || [];
    if (!cur.includes(v) && cur.length >= MAX_BUDGET_PICKS) { showToast(`Mix up to ${MAX_BUDGET_PICKS} ranges per Well`); return; }
    setBudget((b) => { const c = b[id] || []; return { ...b, [id]: c.includes(v) ? c.filter((x) => x !== v) : [...c, v] }; });
  };

  return (
    <div className="ob">
      <aside className="ob__rail">
        <Eyebrow>Sign up · Build your Travel ID</Eyebrow>
        <h1>Let's design the trip of a lifetime.</h1>
        <p className="ob__rail-lead">A few easy questions — no jargon, no commitment. By the end you'll have a Travel ID and a dream trip already started.</p>
        <div className="ob__tis">
          <div className="ob__tis-head"><span className="ob__tis-ic" /> Travel Intelligence</div>
          <p className="ob__tis-lead">As you answer, our Travel Intelligence System quietly builds your <b>Travel Personality</b> — so every suggestion fits you.</p>
          <ul className="ob__tis-list">
            <li><span className="ob__tis-dot" /> Your <b>pace</b> — slow or packed</li>
            <li><span className="ob__tis-dot" /> What <b>excites</b> you</li>
            <li><span className="ob__tis-dot" /> Your <b>budget ranges</b></li>
            <li><span className="ob__tis-dot" /> Who's <b>traveling</b> along</li>
          </ul>
        </div>
        <nav className="ob-steps" aria-label="Sign-up progress" tabIndex={0}>
          {STEPS.map((st, i) => {
            const state = i < step ? "done" : i === step ? "current" : "todo";
            return (
              <div className="ob-step" data-state={state} key={st.key}>
                <div className="ob-step__dot">{i < step ? <Icon name="check" small /> : i + 1}</div>
                <div><div className="ob-step__label">{st.label}</div><div className="ob-step__sub">{st.sub}</div></div>
              </div>
            );
          })}
        </nav>
      </aside>

      <section className="ob__panel">
        <div className="ob__bar">
          <div className="ob__progress"><i style={{ width: `${pct}%` }} /></div>
          <span className="ob__count">{isBuild ? "All set" : `Step ${step + 1} of ${STEPS.length}`}</span>
          <button className="ob__walk-link" onClick={() => openPanel("concierge")}>Walk me through it instead</button>
        </div>
        <div className="ob__scroll">
          <div className="ob__stepwrap" key={step} aria-live="polite">
            {!isBuild && STEPS[step].key === "you" && (
              <>
                <Eyebrow className="ob__eyebrow">First, the basics</Eyebrow>
                <h2 className="ob__title">Who's dreaming?</h2>
                <Why ic="globe">Your name personalizes everything; your email is just for your magic link and trip updates. <b>No password, ever.</b></Why>
                <div className="ob__fields">
                  <div className="fld">
                    <label htmlFor="f-name">Your name</label>
                    <input type="text" id="f-name" value={name} placeholder="e.g. Amara Okonkwo" aria-invalid={nameErr} onChange={(e) => { setName(e.target.value); setNameErr(false); }} />
                    {nameErr && <div className="fld__err" data-show="true"><Icon name="close" small /> Please tell us what to call you.</div>}
                  </div>
                  <div className="fld">
                    <label htmlFor="f-email">Email</label>
                    <input type="email" id="f-email" value={email} placeholder="you@email.com" aria-invalid={emailErr} onChange={(e) => { setEmail(e.target.value); setEmailErr(false); }} />
                    {emailErr && <div className="fld__err" data-show="true"><Icon name="close" small /> That doesn't look like an email yet.</div>}
                    <div className="fld__hint">We'll send a one-tap magic link here — nothing to remember.</div>
                  </div>
                </div>
              </>
            )}

            {!isBuild && STEPS[step].key === "age" && (
              <>
                <Eyebrow className="ob__eyebrow">A gentle question</Eyebrow>
                <h2 className="ob__title">Which age range fits you?</h2>
                <Why ic="shield">We use a <b>range, never your birthday</b> — only to shape pace and mobility (think: nightlife vs. nap-friendly pacing), <b>never your budget</b>. It's yours to change anytime.</Why>
                <div className="ob__fields">
                  <div className="choices choices--2" role="group" aria-label="Age range">
                    {ADULT_COHORTS.map((c) => (
                      <button key={c.key} className="choice" aria-pressed={age === c.key} onClick={() => setAge(c.key)} style={{ flexDirection: "column", alignItems: "flex-start", gap: 3 }}>
                        <span className="choice__t"><span className="choice__check"><Icon name="check" small /></span>{c.label} · {c.range}</span>
                        <span className="choice__s">{c.note}</span>
                      </button>
                    ))}
                    <button key="na" className="choice" aria-pressed={age === "na"} onClick={() => setAge("na")}>
                      <span className="choice__check"><Icon name="check" small /></span><span className="choice__t">Prefer not to say</span>
                    </button>
                  </div>
                </div>
              </>
            )}

            {!isBuild && STEPS[step].key === "move" && (
              <>
                <Eyebrow className="ob__eyebrow">Safer-Informed</Eyebrow>
                <h2 className="ob__title">How do you like to move?</h2>
                <Why ic="heart">Tell us <b>both sides</b> — what you're fully up for <b>and</b> anything to plan around. We use every answer to build the trip <b>around you — never to limit you.</b> Skip anything that doesn't apply.</Why>
                <div className="ob__fields">
                  <div className="fld">
                    <label>Your usual pace</label>
                    <div className="choices choices--2" role="group" aria-label="Activity level">
                      {ACTIVITY_LEVELS.map((a) => (
                        <button key={a.v} className="choice" aria-pressed={activity === a.v} onClick={() => setActivity(activity === a.v ? "" : a.v)} style={{ flexDirection: "column", alignItems: "flex-start", gap: 3 }}>
                          <span className="choice__t"><span className="choice__check"><Icon name="check" small /></span>{a.t}</span>
                          <span className="choice__s">{a.s}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="fld">
                    <label>Access & mobility <span className="opt">— pick any that fit</span></label>
                    <div className="chip-pick" role="group" aria-label="Access needs">
                      {ACCESS_NEEDS.map((a) => (
                        <button key={a.v} type="button" className="chip-toggle" aria-pressed={access.includes(a.v)} onClick={() => toggleAccess(a.v)}>{a.t}</button>
                      ))}
                    </div>
                  </div>
                  <div className="fld">
                    <label htmlFor="f-able">What are you fully up for? <span className="opt">— the fun stuff</span></label>
                    <textarea id="f-able" value={ableNote} onChange={(e) => setAbleNote(e.target.value)} placeholder="e.g. Long hikes, early starts, snorkeling — bring it on." />
                  </div>
                  <div className="fld">
                    <label htmlFor="f-know">Anything we should plan around? <span className="opt">— mobility, medical, safety</span></label>
                    <textarea id="f-know" value={knowNote} onChange={(e) => setKnowNote(e.target.value)} placeholder="e.g. A heart condition — easy on altitude and steep climbs. An afternoon rest is ideal." />
                    <div className="fld__hint"><Icon name="lock" small /> Private to your Travel ID. Anything you share here overrides the age-based defaults — so the trip fits <b>you</b>, not a number.</div>
                  </div>
                </div>
              </>
            )}

            {!isBuild && STEPS[step].key === "party" && (
              <>
                <Eyebrow className="ob__eyebrow">Your party</Eyebrow>
                <h2 className="ob__title">Who's coming with you?</h2>
                <Why ic="heart">A couple or family travels on <b>one itinerary and one budget</b>. Travelers who pay separately get their own party — you can link them later. Add anyone you'll book & pay for.</Why>
                <div className="ob__fields">
                  <div className="party-list">
                    <div className="party-member">
                      <div className="party-member__av">{initials(name || "You")}</div>
                      <div><div className="party-member__name">{name || "You"}</div><div className="party-member__meta">You · books & pays</div></div>
                      <span className="party-member__tag">Lead</span>
                    </div>
                    {party.map((m, i) => (
                      <div className="party-member" key={i}>
                        <div className="party-member__av">{initials(m.name)}</div>
                        <div><div className="party-member__name">{m.name}</div><div className="party-member__meta">{relLabel(m.rel)} · {cohortLabel(m.age)}</div></div>
                        <button className="party-member__remove" aria-label={`Remove ${m.name}`} onClick={() => setParty((p) => p.filter((_, x) => x !== i))}><Icon name="close" small /></button>
                      </div>
                    ))}
                  </div>
                  {draft ? (
                    <div className="party-form">
                      <div className="fld"><label htmlFor="pf-name">Their name</label><input type="text" id="pf-name" value={draft.name} placeholder="e.g. Maya" onChange={(e) => setDraft({ ...draft, name: e.target.value })} /></div>
                      <div className="fld"><label htmlFor="pf-age">Age range</label>
                        <select id="pf-age" value={draft.age} onChange={(e) => setDraft({ ...draft, age: e.target.value })}>
                          {AGE_COHORTS.map((c) => <option key={c.key} value={c.key}>{c.label} · {c.range}</option>)}
                        </select>
                      </div>
                      <div className="fld" style={{ gridColumn: "1/-1" }}><label htmlFor="pf-rel">Relationship</label>
                        <select id="pf-rel" value={draft.rel} onChange={(e) => setDraft({ ...draft, rel: e.target.value })}>
                          {[["partner", "Partner / spouse"], ["child", "Child"], ["family", "Family member"], ["companion", "Travel companion"]].map(([v, t]) => <option key={v} value={v}>{t}</option>)}
                        </select>
                      </div>
                      <div className="party-form__row">
                        <button className="btn btn-secondary" onClick={() => setDraft(null)}>Cancel</button>
                        <button className="btn btn-primary" onClick={() => { if (draft.name.trim()) { setParty((p) => [...p, draft]); setDraft(null); } }}>Add to party</button>
                      </div>
                    </div>
                  ) : (
                    <button className="party-add" onClick={() => setDraft({ name: "", age: "early-adult", rel: "partner" })}><Icon name="check" small /> Add a traveler</button>
                  )}
                  <p className="fld__hint">Traveling solo? That's perfect too — just continue.</p>
                </div>
              </>
            )}

            {!isBuild && STEPS[step].key === "notif" && (
              <>
                <Eyebrow className="ob__eyebrow">Notifications</Eyebrow>
                <h2 className="ob__title">Who hears from us, and how?</h2>
                <Why ic="message">You're always in the loop. A partner can opt into their own channel; <b>children get none</b>. Quiet by default — only what matters for the trip.</Why>
                <div className="ob__fields">
                  {[{ id: "you", name: name || "You", role: "You (always notified)", child: false }].concat(
                    party.map((m, i) => ({ id: "m" + i, name: m.name, role: relLabel(m.rel), child: isMinorCohort(m.age) }))
                  ).map((m) => {
                    const val = notif[m.id] || (m.id === "you" ? "email" : m.child ? "none" : "email");
                    return (
                      <div className="notif-row" key={m.id}>
                        <div className="party-member__av">{initials(m.name)}</div>
                        <div><div className="party-member__name">{m.name}</div><div className="party-member__meta">{m.role}</div>{m.child && <span className="party-member__meta">No notifications for children</span>}</div>
                        <div className="seg" role="group" aria-label={`Notify ${m.name}`}>
                          {["email", "sms", "both", "none"].map((o) => (
                            <button key={o} aria-pressed={val === o} disabled={m.child} onClick={() => setNotif((n) => ({ ...n, [m.id]: o }))}>{o === "email" ? "Email" : o === "sms" ? "SMS" : o === "both" ? "Both" : "None"}</button>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}

            {!isBuild && STEPS[step].key === "dream" && (
              <>
                <Eyebrow className="ob__eyebrow">Last one — your dream</Eyebrow>
                <h2 className="ob__title">Paint the trip in your own words.</h2>
                {/* The closing step, and the only one that changes trip to trip.
                    Everything before it is the constant; this is the variable,
                    which is why it ends the builder and opens every trip after. */}
                <Why ic="sparkles">Now we know who you are — tell us where you&rsquo;re dreaming of. A couple of sentences is plenty, vague ("somewhere warm") or specific. Atlas reads this to seed your first trip, and asks it fresh every time after.</Why>
                <div className="ob__fields">
                  <div className="fld">
                    <label htmlFor="f-dream">Your dream, in a line or two</label>
                    <textarea id="f-dream" value={dream} onChange={(e) => setDream(e.target.value)} placeholder="e.g. A safari for our 10th anniversary in July — romantic, a little wild, easy on the feet." />
                  </div>
                  <div className="fld">
                    <label>Pick a theme or two <span className="opt">— not the full catalog, just a feeling</span></label>
                    <div className="choices choices--3" role="group" aria-label="Theme">
                      {THEMES.map((t) => (
                        <button key={t.v} className="choice" aria-pressed={themes.includes(t.v)} onClick={() => toggleTheme(t.v)} style={{ flexDirection: "column", alignItems: "flex-start", gap: 4 }}>
                          <span className="choice__t">{t.t}</span><span className="choice__s">{t.s}</span>
                        </button>
                      ))}
                    </div>
                    <div className="fld__hint">1–2 is the sweet spot.</div>
                  </div>
                  <div className="fld">
                    <label>How long, roughly?</label>
                    <div className="choices choices--3" role="group" aria-label="Trip length">
                      {LENGTHS.map((l) => (
                        <button key={l.v} className="choice" aria-pressed={length === l.v} onClick={() => setLength(l.v)} style={{ justifyContent: "center" }}><span className="choice__t">{l.t}</span></button>
                      ))}
                    </div>
                  </div>
                </div>
              </>
            )}

            {!isBuild && STEPS[step].key === "budget" && (
              <>
                <Eyebrow className="ob__eyebrow">Budget ranges</Eyebrow>
                <h2 className="ob__title">Set your comfort, Well by Well.</h2>
                <Why ic="compass">Nobody lives at one price point. <b>Mix up to three ranges</b> in each Well and we'll show options across them (a nicer room, sensible flights, one splurge dinner). Fly-Well is by cabin class. This shapes which providers we surface.</Why>
                <button className="bdg-speak" type="button" onClick={() => openPanel("concierge")}>
                  <span className="bdg-speak__ic"><Icon name="sparkles" /></span>
                  <span className="bdg-speak__t">Rather just say it? <b>Speak with Atlas</b> — "luxury stays, business class, mid-range food" — and we'll fill these in.</span>
                  <span className="bdg-speak__mic"><Icon name="mic" /></span>
                </button>
                <div className="ob__fields bdg-list">
                  {BUDGET_WELLS.map((w) => {
                    const sel = budget[w.id] || [];
                    const opts = budgetOptionsFor(w.id);
                    return (
                      <div className="bdg-row" data-well={w.id} key={w.id}>
                        <div className="bdg-row__head">
                          <div className="budget-well__ic"><Icon name={w.icon} /></div>
                          <div><div className="party-member__name">{w.name}</div><div className="party-member__meta">{w.tag}</div></div>
                          {sel.length > 0 && <span className="bdg-row__count">{sel.length}</span>}
                        </div>
                        <div className="bdg-drop">
                          <button className="bdg-drop__trigger" type="button" aria-expanded={openDD === w.id} onClick={() => setOpenDD(openDD === w.id ? null : w.id)}>
                            {sel.length
                              ? <span className="bdg-drop__chips">{sel.map((v) => <span className="bdg-chip" key={v}>{tierLabel(w.id, v)}</span>)}</span>
                              : <span className="bdg-drop__ph">{w.id === "fly" ? "Choose cabin class…" : "Mix up to 3 ranges…"}</span>}
                            <span className="bdg-drop__chev"><Icon name="chev" small /></span>
                          </button>
                          {openDD === w.id && (
                            <div className="bdg-drop__menu" role="listbox" aria-multiselectable="true" aria-label={`${w.name} ranges`} style={{ display: "block" }}>
                              {opts.map((r) => (
                                <button key={r.v} className="bdg-opt" type="button" role="option" aria-selected={sel.includes(r.v)} aria-disabled={!sel.includes(r.v) && sel.length >= MAX_BUDGET_PICKS} onClick={() => toggleBudget(w.id, r.v)}>
                                  <span className="bdg-opt__box"><Icon name="check" small /></span>
                                  <span className="bdg-opt__t">{r.t}</span><span className="bdg-opt__s">{r.s}</span>
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}

            {isBuild && <BuildScreen name={name} age={age} party={party} themes={themes} length={length} budget={budget} dream={dream} activity={activity} access={access} navigate={navigate} emailed={isSupabaseConfigured} email={email} />}

            {!isBuild && (
              <>
                <div className="ob__inline-actions">
                  {step > 0 ? <button className="btn btn-secondary" onClick={() => setStep((s) => s - 1)}>← Back</button> : <span />}
                  <button className="btn btn-primary" onClick={next}>{lastStep ? "Build my Travel ID →" : "Continue →"}</button>
                </div>
                <p className="ob__footnote"><Icon name="shield" small /> No password needed — we'll send a magic link. We never ask your birthday, only an age range. You can edit or delete everything later.</p>
              </>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

const Why = ({ ic, children }: { ic: string; children: ReactNode }) => (
  <div className="ob__why"><Icon name={ic} /><span>{children}</span></div>
);

function BuildScreen({ name, age, party, themes, length, budget, dream, activity, access, navigate, emailed, email }: {
  name: string; age: string; party: Member[]; themes: string[]; length: string; budget: Record<string, string[]>; dream: string; activity: string; access: string[]; navigate: (to: string) => void; emailed: boolean; email: string;
}) {
  const paceLine = [activityLabel(activity), ...access.map(accessLabel)].filter(Boolean).join(" · ");
  const members = [{ name: name || "You", role: "Lead traveler · books & pays", lead: true, age }]
    .concat(party.map((m) => ({ name: m.name, role: relLabel(m.rel), lead: false, age: m.age })));
  const themeNames = themes.map((v) => THEMES.find((t) => t.v === v)?.t).filter(Boolean) as string[];
  const lengthName = LENGTHS.find((l) => l.v === length)?.t || "Flexible";
  return (
    <div className="build">
      <div className="build__burst"><Icon name="check" /></div>
      <Eyebrow className="ob__eyebrow">Your party is ready</Eyebrow>
      <h2 className="ob__title">{members.length > 1 ? `${members.length} Travel IDs built` : "Your Travel ID is built"} — and your dream trip has started.</h2>
      <p className="t-lead" style={{ marginTop: 14 }}>Everything's saved to this device. Next we'll switch a few things on (email, safety location, alerts) — or you can dive straight into designing.</p>
      {emailed && (
        <div className="jn-context" role="status" style={{ justifyContent: "center" }}>
          <Icon name="message" small />
          <span>We emailed a magic link to <b>{email}</b> — tap it to save your Travel ID to your account and reach it from any device.</span>
        </div>
      )}
      <div className="id-cards">
        {members.map((m, i) => (
          <div className="id-card" key={i}>
            <div className="id-card__top">
              <div className="id-card__av">{initials(m.name)}</div>
              <div style={{ flex: 1, minWidth: 0 }}><div className="id-card__name">{m.name}</div><div className="id-card__role">{m.role}</div></div>
            </div>
            <div className="id-card__body">
              <div className="id-attr"><div className="id-attr__k">Age range</div><div className="id-attr__v">{cohortLabel(m.age)}</div></div>
              <div className="id-attr"><div className="id-attr__k">{m.lead && paceLine ? "How you move" : "Trip length"}</div><div className="id-attr__v">{m.lead && paceLine ? paceLine : lengthName}</div></div>
              <div className="id-attr" style={{ gridColumn: "1/-1" }}><div className="id-attr__k">Themes</div>
                <div className="id-card__chips">{(themeNames.length ? themeNames : ["Open to ideas"]).map((t) => <span className="pill pill-live" style={{ background: "var(--secondary)" }} key={t}>{t}</span>)}</div>
              </div>
              {m.lead && (
                <div className="id-attr" style={{ gridColumn: "1/-1" }}><div className="id-attr__k">Budget blend</div>
                  <div className="id-card__chips">{BUDGET_WELLS.map((w) => <span className="pill pill-preview" key={w.id}>{w.name}: {(budget[w.id] || []).map((v) => tierLabel(w.id, v)).join(", ") || "elevated"}</span>)}</div>
                </div>
              )}
              {m.lead && dream && (
                <div className="id-attr" style={{ gridColumn: "1/-1" }}><div className="id-attr__k">The dream</div><div className="id-attr__v" style={{ fontFamily: "var(--font-display)", fontStyle: "italic", fontWeight: 400 }}>"{dream}"</div></div>
              )}
            </div>
          </div>
        ))}
      </div>
      <div className="card" style={{ marginTop: 24, padding: 20, display: "flex", gap: 14, alignItems: "center", textAlign: "start" }}>
        <div className="icon-chip" style={{ background: "var(--secondary)" }}><Icon name="sparkles" /></div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 600 }}>Your dream trip is started</div>
          <div className="t-body-s" style={{ color: "var(--muted-foreground)" }}>We seeded an Activities-Well block from your dream. It's waiting in Your Trip.</div>
        </div>
        <span className="pill pill-gold">Started</span>
      </div>
      <div style={{ display: "flex", gap: 12, justifyContent: "center", marginTop: 28, flexWrap: "wrap" }}>
        <button className="btn btn-primary" onClick={() => navigate("/activation")} style={{ height: 52, padding: "0 28px", fontSize: 16 }}>Finish setting up →</button>
        <button className="btn btn-secondary" onClick={() => navigate("/special-interests")} style={{ height: 52 }}>Skip — start designing</button>
      </div>
      <p className="ftc" style={{ justifyContent: "center", marginTop: 18 }}><Icon name="globe" small /> You can edit or delete your Travel ID anytime from Profile. We never sold or shared it — it lives on your device.</p>
    </div>
  );
}
