import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Icon } from "@/lib/icons";
import { useStore, type TripBlock } from "@/store/useStore";
import { useWells, useRegionByCode } from "@/store/useCatalog";
import { Pill } from "@/components/ui/primitives";
import { JourneyBar } from "@/components/ui/StepIndicator";
import { cx, cap } from "@/lib/utils";

const SLOTS = [
  { id: "dawn", t: "Dawn", r: "5–8a" },
  { id: "morning", t: "Morning", r: "8–12" },
  { id: "midday", t: "Midday", r: "12–3p" },
  { id: "afternoon", t: "Afternoon", r: "3–6p" },
  { id: "evening", t: "Evening", r: "6–9p" },
  { id: "night", t: "Night", r: "9p+" },
];
const WELL_SLOT: Record<string, string> = { fly: "dawn", activities: "morning", move: "midday", beauty: "afternoon", eat: "evening", stay: "night", shop: "afternoon", gear: "morning" };
const STATUS_SWATCH: Record<string, string> = { confirmed: "var(--safety-1)", pending: "var(--accent)", idea: "var(--muted-foreground)" };

const PARTY = [{ id: "A", name: "Amara" }, { id: "J", name: "Jhumur" }];

export default function Itinerary() {
  const { trip, region } = useStore();
  const navigate = useNavigate();
  const [whom, setWhom] = useState<string>("all");
  const covered = new Set(trip.map((b) => b.well)).size;
  const wells = useWells().filter((w) => !w.lux);
  const regionName = useRegionByCode(region || "05A")?.name || "East Africa";

  const counts = {
    confirmed: trip.filter((b) => b.status === "confirmed").length,
    pending: trip.filter((b) => b.status === "pending").length,
    idea: trip.filter((b) => b.status === "idea").length,
  };

  const bySlot = (slotId: string) => trip.filter((b) => (WELL_SLOT[b.well] || "afternoon") === slotId);

  function Block({ b }: { b: TripBlock }) {
    const dim = whom !== "all"; // demo: for-whom overlay dims non-matching blocks
    return (
      <div className={cx("it-block", `it-block--${b.status}`, dim && "dim")}>
        <div className="it-block__ic"><Icon name={b.icon} /></div>
        <div className="it-block__main">
          <div className="it-block__top">
            <div>
              <div className="it-block__name">{b.name}</div>
              <div className="it-block__sub">
                <span className="it-block__well"><Icon name={b.icon} small /> {b.meta}</span>
              </div>
            </div>
            <span className="it-block__status">
              <Pill kind={b.status === "confirmed" ? "live" : b.status === "pending" ? "gold" : "preview"}>{cap(b.status)}</Pill>
            </span>
          </div>
          <div className="it-block__foot">
            <div className="it-block__whom">
              <div className="it-block__whom-avs">{PARTY.map((p) => <span key={p.id} className="av">{p.id}</span>)}</div>
              <span className="it-block__whom-label">Everyone</span>
            </div>
            <div className="it-block__actions">
              {b.status !== "confirmed" && <button className="it-block__btn it-block__btn--primary"><Icon name="check" small /> Confirm</button>}
              <button className="it-block__icon-btn" aria-label="Options"><Icon name="chev" small /></button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <JourneyBar current={4} crumbs={[{ label: "Home", to: "/" }, { label: "Wells", to: "/wells-surface" }, { label: "Book It" }]} />
      <div className="it-head">
        <div className="it-head__inner">
          <div className="it-head__top">
            <div className="it-head__title-wrap">
              <div className="it-head__eyebrow"><span className="eyebrow">Your Itinerary · always saved</span></div>
              <h1>Kenya: Anniversary Safari</h1>
              <div className="it-head__meta">
                <span><Icon name="pin" small /> {regionName}</span>
                <span><Icon name="calendar" small /> Jul 12 – 22, 2026</span>
                <span><Icon name="heart" small /> 2 travelers</span>
              </div>
            </div>
            <div className="it-head__actions">
              <div className="it-head__party">{PARTY.map((p) => <span key={p.id} className="av">{p.id}</span>)}</div>
              <button className="btn btn-secondary" onClick={() => navigate("/wells-surface")}><Icon name="sparkles" small /> Speak with Atlas</button>
            </div>
          </div>
          <div className="it-summary">
            <div className="it-cov">
              <div className="it-cov__bar">{wells.map((w) => <i key={w.id} className={trip.some((b) => b.well === w.id) ? "on" : ""} />)}</div>
              <span className="it-cov__label"><b>{covered} of 10 Wells</b> covered</span>
            </div>
            <div className="it-statuses">
              <span className="it-stat"><span className="swatch" style={{ background: STATUS_SWATCH.confirmed }} /> {counts.confirmed} confirmed</span>
              <span className="it-stat"><span className="swatch" style={{ background: STATUS_SWATCH.pending }} /> {counts.pending} pending</span>
              <span className="it-stat"><span className="swatch" style={{ background: STATUS_SWATCH.idea }} /> {counts.idea} ideas</span>
            </div>
            <div className="it-overlay-toggle" role="group" aria-label="For whom" style={{ marginInlineStart: "auto" }}>
              <button aria-pressed={whom === "all"} onClick={() => setWhom("all")}>Everyone</button>
              {PARTY.map((p) => (
                <button key={p.id} aria-pressed={whom === p.id} onClick={() => setWhom(p.id)}>
                  <span className="mini-av">{p.id}</span> {p.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="it-layout">
        <div className="it-main">
          <div className="it-daynav">
            <button className="it-daynav__btn" aria-current="true"><div className="it-daynav__day">Day 1</div><div className="it-daynav__date">Jul 12</div></button>
            <button className="it-daynav__btn"><div className="it-daynav__day">Day 2</div><div className="it-daynav__date">Jul 13</div></button>
            <button className="it-daynav__btn"><div className="it-daynav__day">Day 3</div><div className="it-daynav__date">Jul 14</div></button>
            <button className="it-daynav__btn"><div className="it-daynav__day">+ Day</div><div className="it-daynav__date">Add</div></button>
          </div>

          <div className="it-day">
            <div className="it-day__head">
              <span className="it-day__num">Day 1</span>
              <span className="it-day__date">Sat · Jul 12</span>
              <span className="it-day__loc"><Icon name="pin" small /> {regionName}</span>
            </div>
            {SLOTS.map((slot) => {
              const blocks = bySlot(slot.id);
              const filled = blocks.length > 0;
              return (
                <div key={slot.id} className={cx("it-slot", filled && "it-slot--filled")}>
                  <div className="it-slot__time"><div className="t">{slot.t}</div><div className="r">{slot.r}</div></div>
                  <span className="it-slot__dot" />
                  <span className="it-slot__rail" />
                  <div className="it-slot__blocks">
                    {blocks.map((b, i) => <Block key={`${b.name}-${i}`} b={b} />)}
                    <button className="it-slot__add" onClick={() => navigate("/wells-surface")}><Icon name="arrow" small /> Add to {slot.t.toLowerCase()}</button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <aside className="it-side">
          <div className="it-panel">
            <div className="it-panel__head"><Icon name="compass" /><h3>Well coverage</h3><Pill kind="gold">{covered}/10</Pill></div>
            <div className="it-panel__body">
              <div className="it-gap-grid">
                {wells.map((w) => {
                  const cov = trip.some((b) => b.well === w.id);
                  return (
                    <div key={w.id} className={cx("it-gap-cell", cov ? "covered" : "gap")} title={w.name}>
                      <div className="it-gap-cell__iconwrap"><Icon name={w.icon} /></div>
                      <span className="it-gap-cell__lbl">{w.name.replace("-Well", "")}</span>
                    </div>
                  );
                })}
              </div>
              <button className="btn btn-secondary" style={{ width: "100%" }} onClick={() => navigate("/wells-surface")}>Fill the gaps</button>
            </div>
          </div>

          <div className="it-panel">
            <div className="it-panel__head"><Icon name="sparkles" /><h3>Atlas review</h3></div>
            <div className="it-panel__body">
              <div className="it-ai-suggestion">
                <div className="it-ai-suggestion__ic"><Icon name="sparkle" small /></div>
                <div className="it-ai-suggestion__text">Your Day 1 evening is open. A bush dinner under the stars would pair beautifully with a confirmed game drive.</div>
              </div>
              <div className="it-ai-actions" style={{ marginTop: 12, display: "flex", gap: 8 }}>
                <button className="it-ai-mini it-ai-mini--primary btn btn-primary" style={{ flex: 1 }} onClick={() => navigate("/wells-surface")}>Add it</button>
                <button className="it-ai-mini btn btn-secondary">Dismiss</button>
              </div>
              <p className="ftc" style={{ marginTop: 12 }}><Icon name="globe" small /> Atlas suggests; you always choose. It never books for you.</p>
            </div>
          </div>
        </aside>
      </div>
    </>
  );
}
