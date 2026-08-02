import { Link } from "react-router-dom";
import { Icon } from "@/lib/icons";
import { useStore } from "@/store/useStore";
import { useWells } from "@/store/useCatalog";
import { cap } from "@/lib/utils";

export function TripTray() {
  const { panel, closePanel, trip } = useStore();
  const wells = useWells().filter((w) => !w.lux);
  const open = panel === "tray";
  const covered = new Set(trip.map((b) => b.well)).size;

  return (
    <div className="tw-tray" data-open={open} role="dialog" aria-modal="false" aria-label="Your Trip" aria-hidden={!open} {...(open ? {} : ({ inert: "" } as any))}>
      <div className="tw-tray__head">
        <div>
          <div className="tw-concierge__title" style={{ fontSize: 18 }}>Your Trip</div>
          <div className="tw-concierge__sub">
            {trip.length === 0 ? "Nothing yet — let's begin" : `${trip.length} added · ${covered}/10 Wells covered`}
          </div>
        </div>
        <button className="tw-iconbtn" aria-label="Close trip" style={{ width: 36, height: 36, border: 0, background: "var(--surface-alt)" }} onClick={closePanel}>
          <Icon name="close" small />
        </button>
      </div>

      <div className="tw-tray__body">
        {trip.length === 0 ? (
          <div className="tw-tray__empty">
            <div className="tw-empty-ic"><Icon name="bag2" /></div>
            <h3 style={{ fontSize: 18 }}>Your trip starts here</h3>
            <p className="t-body-s" style={{ color: "var(--muted-foreground)", marginTop: 8 }}>
              Pick a Special Interest and I'll start filling your Wells. Everything you add is saved automatically.
            </p>
          </div>
        ) : (
          <>
            <div className="tw-trip-coverage" aria-label={`${covered} of 10 Wells covered`}>
              {wells.map((w) => <i key={w.id} className={trip.some((b) => b.well === w.id) ? "on" : ""} />)}
            </div>
            {trip.map((b, i) => (
              <div key={`${b.name}-${i}`} className="tw-trip-block">
                <div className="tw-trip-block__ic"><Icon name={b.icon} /></div>
                <div style={{ flex: 1 }}>
                  <div className="tw-trip-block__name">{b.name}</div>
                  <div className="tw-trip-block__meta">
                    {b.meta} · <span className={`pill ${b.status === "confirmed" ? "pill-live" : b.status === "pending" ? "pill-gold" : "pill-preview"}`} style={{ padding: "2px 8px", fontSize: 11 }}>{cap(b.status)}</span>
                  </div>
                </div>
              </div>
            ))}
          </>
        )}
      </div>

      <div className="tw-tray__foot">
        {trip.length === 0 ? (
          <Link className="btn btn-primary" to="/special-interests" style={{ width: "100%" }} onClick={closePanel}>Start your journey</Link>
        ) : (
          <>
            <Link className="btn btn-primary" to="/itinerary" style={{ width: "100%", marginBottom: 8 }} onClick={closePanel}>Open full itinerary</Link>
            <Link className="btn btn-ghost" to="/special-interests" style={{ display: "block", textAlign: "center" }} onClick={closePanel}>Keep building →</Link>
          </>
        )}
      </div>
    </div>
  );
}
