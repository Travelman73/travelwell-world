import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Icon } from "@/lib/icons";
import { useStore } from "@/store/useStore";
import { useSpecialInterests } from "@/store/useCatalog";
import { Eyebrow } from "@/components/ui/primitives";
import { fetchTravelId, saveTravelId, type TravelIdRecord } from "@/lib/travelId";
import {
  deriveIdentity, DEMO_IDENTITY, cohortLabel, activityLabel, tierLabel,
  nextCohort, shiftActivity, shiftBudget,
} from "@/lib/identity";

type AgeChoice = "keep" | "bump";
type Energy = "better" | "same" | "easier";
type BudgetDir = "steady" | "more" | "leaner";

const ENERGY_OPTS: { v: Energy; t: string; s: string }[] = [
  { v: "better", t: "Better than ever", s: "Push the pace up a notch" },
  { v: "same", t: "About the same", s: "Keep it as it was" },
  { v: "easier", t: "Taking it easier", s: "Ease the pace a notch" },
];
const BUDGET_OPTS: { v: BudgetDir; t: string; s: string }[] = [
  { v: "more", t: "A bit more to spend", s: "Nudge each Well up a tier" },
  { v: "steady", t: "Holding steady", s: "Keep my blend" },
  { v: "leaner", t: "Keeping it leaner", s: "Nudge each Well down a tier" },
];

export default function WelcomeBack() {
  const navigate = useNavigate();
  const { user, showToast } = useStore();
  const sis = useSpecialInterests();
  const [rec, setRec] = useState<TravelIdRecord | null>(null);
  useEffect(() => { if (user) fetchTravelId(user.id).then(setRec); else setRec(null); }, [user]);

  const id = deriveIdentity(rec, DEMO_IDENTITY);
  const curAge = rec?.age_range ?? DEMO_IDENTITY.cohortAge ?? null;
  const curActivity = rec?.activity_level ?? DEMO_IDENTITY.activity;
  const curBudget = rec?.budget_ranges && Object.keys(rec.budget_ranges).length ? rec.budget_ranges : DEMO_IDENTITY.budget;

  const [age, setAge] = useState<AgeChoice>("keep");
  const [energy, setEnergy] = useState<Energy>("same");
  const [budgetDir, setBudgetDir] = useState<BudgetDir>("steady");
  const [interests, setInterests] = useState<string[]>(id.interests);
  const [vision, setVision] = useState("");
  // Reset the interest picker when the real record loads in.
  useEffect(() => { setInterests(id.interests); /* eslint-disable-next-line */ }, [rec]);

  const bumpedAge = nextCohort(curAge);
  const newActivity = energy === "better" ? shiftActivity(curActivity, 1) : energy === "easier" ? shiftActivity(curActivity, -1) : curActivity;
  const paceChanged = newActivity !== curActivity;
  // A representative Well to preview the budget nudge (first one they've set).
  const sampleWell = Object.keys(curBudget).find((w) => (curBudget[w] || []).length) || "stay";
  const previewBudget = budgetDir === "steady" ? curBudget : shiftBudget(curBudget, budgetDir === "more" ? 1 : -1);
  const budgetChanged = budgetDir !== "steady";

  const toggleInterest = (sid: string) => setInterests((c) => (c.includes(sid) ? c.filter((x) => x !== sid) : [...c, sid]));
  const suggestions = sis.filter((s) => s.status === "live" && s.id !== "ultra" && !interests.includes(s.id)).slice(0, 4);

  async function refresh() {
    const updates: Partial<TravelIdRecord> = {};
    if (age === "bump" && bumpedAge && bumpedAge !== curAge) updates.age_range = bumpedAge;
    if (paceChanged && newActivity) updates.activity_level = newActivity;
    if (budgetChanged) updates.budget_ranges = previewBudget;
    if (JSON.stringify(interests) !== JSON.stringify(id.interests)) updates.interests = interests;
    if (vision.trim()) updates.trip_intent = vision.trim();

    if (user && Object.keys(updates).length) await saveTravelId({ user_id: user.id, ...updates });
    showToast(Object.keys(updates).length ? "Refreshed — welcome back." : "Great — nothing to change. Let's go.");
    navigate("/special-interests");
  }

  return (
    <div className="wb">
      <div className="wb__head">
        <Eyebrow>Welcome back · the check-in</Eyebrow>
        <h1>Good to see you again, {id.name}.</h1>
        <p className="wb__lead">Nothing to redo — we kept everything. Let's just catch up on what's changed since {id.since}, then pick up right where you left off.</p>
        <div className="wb__const">
          <span className="wb__const-ic"><Icon name="check" small /></span>
          <span>Keeping your <b>Identity Card</b> — party of {id.party.length}, {activityLabel(curActivity) || "your pace"}, your budget blend and interests. Confirm the changes below and we refresh, never rebuild.</span>
        </div>
      </div>

      <div className="wb__steps">
        {/* 1 — age */}
        <section className="wb-card">
          <div className="wb-card__n">1</div>
          <div className="wb-card__body">
            <h2>A year can shift the pace</h2>
            <p className="wb-card__q">Last time you were <b>{cohortLabel(curAge)}</b>. Still about right?</p>
            <div className="wb-choices">
              <button className="choice" aria-pressed={age === "keep"} onClick={() => setAge("keep")}>
                <span className="choice__check"><Icon name="check" small /></span><span className="choice__t">Still me</span>
              </button>
              {bumpedAge && bumpedAge !== curAge && (
                <button className="choice" aria-pressed={age === "bump"} onClick={() => setAge("bump")}>
                  <span className="choice__check"><Icon name="check" small /></span>
                  <span><span className="choice__t">I've moved up a range</span><span className="choice__s">Now {cohortLabel(bumpedAge)}</span></span>
                </button>
              )}
            </div>
          </div>
        </section>

        {/* 2 — energy / capabilities */}
        <section className="wb-card">
          <div className="wb-card__n">2</div>
          <div className="wb-card__body">
            <h2>Still up for what you did last trip?</h2>
            <p className="wb-card__q">Be straight with us — we shape the days around you, never the other way round.</p>
            <div className="wb-choices wb-choices--3">
              {ENERGY_OPTS.map((o) => (
                <button key={o.v} className="choice" aria-pressed={energy === o.v} onClick={() => setEnergy(o.v)} style={{ flexDirection: "column", alignItems: "flex-start", gap: 3 }}>
                  <span className="choice__t"><span className="choice__check"><Icon name="check" small /></span>{o.t}</span>
                  <span className="choice__s">{o.s}</span>
                </button>
              ))}
            </div>
            {paceChanged && <p className="wb-card__delta"><Icon name="arrow" small /> Pace becomes <b>{activityLabel(newActivity)}</b> — you can fine-tune it anytime.</p>}
          </div>
        </section>

        {/* 3 — budget */}
        <section className="wb-card">
          <div className="wb-card__n">3</div>
          <div className="wb-card__body">
            <h2>Has your budget moved?</h2>
            <p className="wb-card__q">Nobody sits at one price point forever. A quick nudge across every Well.</p>
            <div className="wb-choices wb-choices--3">
              {BUDGET_OPTS.map((o) => (
                <button key={o.v} className="choice" aria-pressed={budgetDir === o.v} onClick={() => setBudgetDir(o.v)} style={{ flexDirection: "column", alignItems: "flex-start", gap: 3 }}>
                  <span className="choice__t"><span className="choice__check"><Icon name="check" small /></span>{o.t}</span>
                  <span className="choice__s">{o.s}</span>
                </button>
              ))}
            </div>
            {budgetChanged && (
              <p className="wb-card__delta"><Icon name="arrow" small /> e.g. {sampleWell === "fly" ? "Fly-Well" : sampleWell.charAt(0).toUpperCase() + sampleWell.slice(1) + "-Well"}: <b>{(curBudget[sampleWell] || []).map((k) => tierLabel(sampleWell, k)).join(" · ")}</b> → <b>{(previewBudget[sampleWell] || []).map((k) => tierLabel(sampleWell, k)).join(" · ")}</b></p>
            )}
          </div>
        </section>

        {/* 4 — interests */}
        <section className="wb-card">
          <div className="wb-card__n">4</div>
          <div className="wb-card__body">
            <h2>Anything new calling you?</h2>
            <p className="wb-card__q">Tap to keep what still fits, or add something you're curious about now.</p>
            <div className="wb-chips">
              {interests.map((sid) => {
                const si = sis.find((s) => s.id === sid);
                return <button key={sid} className="chip-toggle" aria-pressed onClick={() => toggleInterest(sid)}><span className="dot" style={{ background: si?.accent || "var(--primary)" }} /> {si?.name || sid} <Icon name="close" small /></button>;
              })}
            </div>
            {suggestions.length > 0 && (
              <>
                <p className="wb-card__addlbl">Add an interest</p>
                <div className="wb-chips">
                  {suggestions.map((s) => (
                    <button key={s.id} className="chip-toggle" aria-pressed={false} onClick={() => toggleInterest(s.id)}><Icon name="check" small /> {s.name}</button>
                  ))}
                </div>
              </>
            )}
          </div>
        </section>

        {/* 5 — this trip's vision (the variable) */}
        <section className="wb-card wb-card--vision">
          <div className="wb-card__n"><Icon name="sparkles" small /></div>
          <div className="wb-card__body">
            <h2>What are you picturing this time?</h2>
            <p className="wb-card__q">This is the part that changes every trip. A line or two is plenty.</p>
            <div className="fld">
              <textarea id="wb-vision" value={vision} onChange={(e) => setVision(e.target.value)} placeholder="e.g. Somewhere with snow this year — cosy evenings, a little skiing, nothing rushed." />
            </div>
            {id.vision && <p className="wb-card__last"><Icon name="read" small /> Last time you said: <span className="wb-card__lastq">“{id.vision}”</span></p>}
          </div>
        </section>
      </div>

      <div className="wb__foot">
        <button className="btn btn-primary" onClick={refresh} style={{ height: 54, padding: "0 30px", fontSize: 16 }}>Refresh & keep planning →</button>
        <button className="btn btn-secondary" onClick={() => { showToast("Kept as-is — welcome back."); navigate("/special-interests"); }}>Keep it exactly as it is</button>
      </div>
      <p className="wb__sig">Built once, refreshed every trip — never rebuilt. <span className="tw">Travel Well.</span></p>
    </div>
  );
}
