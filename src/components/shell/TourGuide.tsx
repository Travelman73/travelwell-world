/**
 * TravelWell.World — TourGuide: the guided-walk choreography ENGINE (prototype).
 *
 * The generalization of the Atlas hero flow to the whole journey. Given the
 * active tour + beat (store), it: (1) spotlights the beat's target element on its
 * screen with a pulsing ring + an Atlas caption, (2) waits for the traveler to
 * actually click that target — never auto-advances (keeps "they always choose"),
 * (3) moves to the next beat, across routes. One lit affordance + one cue at a
 * time (the anti-confusion invariant).
 *
 * Entry: `/?tour=safari` auto-starts (the unattended VC-link case). Any button can
 * also call store.startTour(id). Renders into a portal so it floats above the app.
 */
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { useStore } from "@/store/useStore";
import { Icon } from "@/lib/icons";
import { TOURS } from "@/lib/tour";

function capStyle(rect: DOMRect, place: "above" | "below"): React.CSSProperties {
  const vw = window.innerWidth, vh = window.innerHeight;
  const width = Math.min(300, vw - 24);
  const left = Math.max(12, Math.min(rect.left + rect.width / 2 - width / 2, vw - width - 12));
  // Keep clear of the header and the bottom edge. Prefer the asked-for side, but
  // flip if it would run off-screen (a tall target near an edge).
  const TOP_SAFE = 76, BOT_SAFE = 120;
  const wantAbove = place === "above";
  const fitsAbove = rect.top > TOP_SAFE + 80;
  const fitsBelow = rect.bottom < vh - BOT_SAFE;
  const above = wantAbove ? (fitsAbove || !fitsBelow) : !fitsBelow;
  return above
    ? { top: Math.max(TOP_SAFE + 60, rect.top - 12), left, width, transform: "translateY(-100%)" }
    : { top: Math.min(rect.bottom + 12, vh - BOT_SAFE), left, width };
}

export function TourGuide() {
  const tour = useStore((s) => s.tour);
  const startTour = useStore((s) => s.startTour);
  const nextTourStep = useStore((s) => s.nextTourStep);
  const stopTour = useStore((s) => s.stopTour);
  const location = useLocation();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const [rect, setRect] = useState<DOMRect | null>(null);
  const targetRef = useRef<Element | null>(null);

  const def = tour ? TOURS[tour.id] : null;
  const beat = def && tour ? def.beats[tour.step] : null;
  const onRoute = !!beat && location.pathname === beat.route;

  // Auto-start from ?tour=<id> — the unattended entry a VC link uses.
  useEffect(() => {
    const id = params.get("tour");
    if (!id || tour || !TOURS[id]) return;
    startTour(id);
    const next = new URLSearchParams(params);
    next.delete("tour");
    setParams(next, { replace: true });
    const first = TOURS[id].beats[0].route;
    if (location.pathname !== first) navigate(first);
  }, [params, tour, location.pathname, navigate, setParams, startTour]);

  // Resolve the target on-route (patiently — lazy routes + async data mount late).
  useEffect(() => {
    targetRef.current = null;
    setRect(null);
    if (!beat || !onRoute) return;
    let tries = 0;
    let timer = 0;
    const find = () => {
      const el = document.querySelector(beat.selector);
      if (el) {
        targetRef.current = el;
        el.scrollIntoView({ block: "center", behavior: "smooth" });
        timer = window.setTimeout(() => setRect(el.getBoundingClientRect()), 380);
        return;
      }
      if (tries++ < 100) timer = window.setTimeout(find, 60); // ~6s grace
    };
    find();
    return () => window.clearTimeout(timer);
  }, [beat, onRoute]);

  // Keep the ring glued to the target as the page scrolls / reflows.
  useEffect(() => {
    if (!rect) return;
    const update = () => { if (targetRef.current) setRect(targetRef.current.getBoundingClientRect()); };
    window.addEventListener("scroll", update, true);
    window.addEventListener("resize", update);
    const iv = window.setInterval(update, 300);
    return () => { window.removeEventListener("scroll", update, true); window.removeEventListener("resize", update); window.clearInterval(iv); };
  }, [rect]);

  // Advance when the traveler clicks the spotlighted target (capture phase, so we
  // catch it before the element's own handler and regardless of stopPropagation).
  useEffect(() => {
    if (!beat || !onRoute || !def || !tour) return;
    const onClick = (e: MouseEvent) => {
      const t = targetRef.current;
      if (!t || !(e.target instanceof Node) || !t.contains(e.target)) return;
      // Atlas holds the option as the beat completes (mirrors the hero's Hold-it),
      // so the itinerary reveal downstream shows a real piece the walk just placed.
      if (beat.hold) useStore.getState().addToTrip(beat.hold);
      const isLast = tour.step >= def.beats.length - 1;
      if (isLast) { window.setTimeout(stopTour, 500); return; }
      nextTourStep();
      if (beat.advanceNav) navigate(beat.advanceNav);
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [beat, onRoute, def, tour, navigate, nextTourStep, stopTour]);

  if (!tour || !beat) return null;

  return createPortal(
    <div className="tw-tour" role="status" aria-live="polite">
      {rect && (
        <>
          <div
            className="tw-tour__ring"
            style={{ top: rect.top - 6, left: rect.left - 6, width: rect.width + 12, height: rect.height + 12 }}
          />
          <div className={"tw-tour__cap tw-tour__cap--" + (beat.place || "below")} style={capStyle(rect, beat.place || "below")}>
            <span className="tw-tour__avatar" aria-hidden="true"><Icon name="sparkles" small /></span>
            <span className="tw-tour__line">{beat.line}</span>
            <button className="tw-tour__skip" onClick={stopTour}>Skip</button>
          </div>
        </>
      )}
    </div>,
    document.body,
  );
}
