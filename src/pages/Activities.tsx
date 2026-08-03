import { useNavigate, Link } from "react-router-dom";
import { Icon } from "@/lib/icons";
import { useStore } from "@/store/useStore";
import { useSpecialInterests, useActivities, useWells } from "@/store/useCatalog";
import { Eyebrow } from "@/components/ui/primitives";
import { JourneyBar } from "@/components/ui/StepIndicator";
import { cx } from "@/lib/utils";

export default function Activities() {
  const navigate = useNavigate();
  const { journeySIs, journeyActs, toggleAct, openPanel } = useStore();
  const catalogSis = useSpecialInterests();
  const activities = useActivities();
  const wells = useWells();
  const noInterests = journeySIs.filter((s) => activities[s]?.length).length === 0;
  const sis = journeySIs.filter((s) => activities[s]?.length);
  const groups = (sis.length ? sis : ["safari"]).map((s) => ({ si: catalogSis.find((x) => x.id === s), items: activities[s] || [] })).filter((g) => g.si);

  // Which Wells light up, by count of chosen activities mapping to them.
  const allWells = wells;
  const wellCounts: Record<string, number> = {};
  groups.forEach((g) => g.items.forEach((a) => { if (journeyActs.includes(a.id)) wellCounts[a.well] = (wellCounts[a.well] || 0) + 1; }));
  const litWells = Object.keys(wellCounts).length;
  const litList = allWells.filter((w) => wellCounts[w.id] > 0);

  return (
    <>
      <JourneyBar current={2} crumbs={[{ label: "Home", to: "/" }, { label: "Interests", to: "/special-interests" }, { label: "Regions", to: "/regions" }, { label: "Activities" }]} />

      <div className="container jn-intro">
        <Eyebrow>The Dream Journey · Fine-tune (optional)</Eyebrow>
        <h1>What excites you most?</h1>
        <p className="lead">Pick the moments you're dreaming of. Each one quietly pre-fills the right Well with matched providers — so the next step is already half-done.</p>
        {noInterests && (
          <div className="jn-context" role="note">
            <Icon name="info" small />
            <span>You haven't picked any interests yet, so these are <b>sample Safari activities</b>. <Link to="/special-interests" style={{ fontWeight: 600 }}>Pick what moves you</Link> for activities tailored to you — or <button className="btn-ghost" style={{ padding: 0, fontWeight: 600 }} onClick={() => openPanel("concierge")}>ask Atlas</button>.</span>
          </div>
        )}
      </div>

      <div className="container">
        <div className="ac-layout">
          <div className="ac-groups">
            {groups.map(({ si, items }) => (
              <section className="ac-group" key={si!.id}>
                <div className="ac-group__head">
                  <span className="ac-group__accent" style={{ background: si!.accent }} />
                  <div><div className="ac-group__title">{si!.name}</div><div className="ac-group__sig">{si!.sig}</div></div>
                </div>
                <div className="ac-grid">
                  {items.map((a) => {
                    const on = journeyActs.includes(a.id);
                    const w = wells.find((x) => x.id === a.well);
                    return (
                      <button key={a.id} className={cx("ac-card", on && "is-selected")} aria-pressed={on} onClick={() => toggleAct(a.id)}>
                        <span className="ac-card__check"><Icon name="check" small /></span>
                        <span className="ac-card__name">{a.name}</span>
                        <span className="ac-card__line">{a.line}</span>
                        <span className="ac-card__well"><Icon name={w?.icon || "compass"} small /> {w?.name}</span>
                      </button>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>

          <aside className="ac-side">
            <div className="ac-side__card">
              <div className="ac-side__head">
                <h3>How your picks map</h3>
                <p>Every activity fills a Well for you.</p>
              </div>
              <div className="ac-side__body">
                {litList.length === 0 ? (
                  <div className="ac-side__empty"><Icon name="compass" /><div style={{ marginTop: 8 }}>Select activities and watch your Wells light up.</div></div>
                ) : (
                  litList.map((w) => (
                    <div key={w.id} className="ac-well-row lit">
                      <span className="ac-well-row__ic"><Icon name={w.icon} /></span>
                      <span className="ac-well-row__name">{w.name}</span>
                      <span className="ac-well-row__count">{wellCounts[w.id]}</span>
                    </div>
                  ))
                )}
              </div>
              <div className="ac-side__foot">
                <button className="btn btn-primary" onClick={() => navigate("/wells-surface")}>Continue to Wells →</button>
                <div className="ac-summary">
                  {journeyActs.length === 0 ? "Pick a few to begin" : `${journeyActs.length} activit${journeyActs.length === 1 ? "y" : "ies"} → ${litWells} Well${litWells === 1 ? "" : "s"} pre-filled`}
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </>
  );
}
