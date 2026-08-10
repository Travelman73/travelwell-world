import { useState } from "react";
import { Icon } from "@/lib/icons";
import { useStore } from "@/store/useStore";

/**
 * Safety corner — a floating stack, always bottom-inline-start on every screen
 * (David, Jul 2026). Serious RED EMERGENCY pill at the bottom (most thumb-
 * reachable), two GREEN cross buttons above it:
 *   • Human Safety → nearest hospitals / urgent care / pharmacies
 *   • Pet Safety   → nearest vets / animal ER / groomers  (~4M travellers bring pets)
 *
 * FOOTPRINT (2026-08-10): the stack rests as icon-only circles and expands to its
 * full labels on hover, focus or tap. Measured, the labelled stack was 187px wide
 * and sat over the interest grid at EVERY width (65px into it at 1440, 145px at
 * 1280, the whole first tile at 1024) and over the journey selection bar
 * everywhere. Corners don't fix that — only size does. The labels stay in the DOM
 * throughout, so a screen reader always reads "Human Safety", and every button
 * keeps its own aria-label. EMERGENCY stays ONE TAP: it is never hidden behind a
 * toggle, only unlabelled until you reach for it.
 *
 * HONEST BY DESIGN: the green finders open a **maps search near the traveller**
 * (no data invented, no geolocation stored). This is a locator — NOT the
 * aspirational pet-safety *engine* (airline × import rules), which stays roadmap.
 * EMERGENCY opens the panel we already hold (universal 112 + local numbers +
 * first-aid). Accessible: real labelled buttons, ≥44px, visible focus, white
 * cross never carries meaning by colour alone (it's labelled).
 */
const maps = (q: string) => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;

const HUMAN = [
  { label: "Hospitals", q: "hospital near me" },
  { label: "Urgent care", q: "urgent care clinic near me" },
  { label: "Pharmacies", q: "pharmacy near me" },
];
const PET = [
  { label: "Veterinarians", q: "veterinarian near me" },
  { label: "Animal hospital / ER", q: "emergency animal hospital near me" },
  { label: "Pet groomers", q: "pet groomer near me" },
];

export function SafetyStack() {
  const { openPanel, panel, journeySIs } = useStore();
  const [sheet, setSheet] = useState<null | "human" | "pet">(null);
  if (panel === "emergency") return null; // the full panel is open; don't double up

  const items = sheet === "human" ? HUMAN : sheet === "pet" ? PET : [];

  return (
    // `data-lifted` raises the stack clear of the journey selection bar, which is
    // full-width and fixed to the same edge — the stack was sitting on top of the
    // traveler's own picks at every screen size.
    <div className="tw-safety-stack" data-lifted={journeySIs.length > 0 ? "true" : undefined} data-open={sheet ? "true" : undefined}>
      {sheet && (
        <>
          <div className="tw-safety-dismiss" onClick={() => setSheet(null)} aria-hidden="true" />
          <div className="tw-safety-sheet" role="menu" aria-label={sheet === "human" ? "Human safety — find nearby" : "Pet safety — find nearby"}>
            <div className="tw-safety-sheet__title">{sheet === "human" ? "Nearest help" : "Nearest pet care"}</div>
            {items.map((it) => (
              <a key={it.q} className="tw-safety-sheet__link" href={maps(it.q)} target="_blank" rel="noopener noreferrer" role="menuitem" onClick={() => setSheet(null)}>
                <Icon name="pin" small /> {it.label}
              </a>
            ))}
            <div className="tw-safety-sheet__note">
              Opens maps near you.{sheet === "human" ? " In a crisis, tap EMERGENCY." : " Pet-safety guidance is coming; this finds care now."}
            </div>
          </div>
        </>
      )}

      <button className="tw-safety-btn tw-safety-btn--green" aria-expanded={sheet === "human"} aria-haspopup="menu"
        onClick={() => setSheet(sheet === "human" ? null : "human")}>
        <span className="tw-safety-btn__cross"><Icon name="cross" small /></span>
        <span className="tw-safety-btn__label">Human Safety</span>
      </button>
      <button className="tw-safety-btn tw-safety-btn--green" aria-expanded={sheet === "pet"} aria-haspopup="menu"
        onClick={() => setSheet(sheet === "pet" ? null : "pet")}>
        <span className="tw-safety-btn__cross"><Icon name="paw" small /></span>
        <span className="tw-safety-btn__label">Pet Safety</span>
      </button>
      <button className="tw-safety-btn tw-safety-btn--red" onClick={() => openPanel("emergency")} aria-label="Emergency help — call for help now">
        <Icon name="sos" small />
        <span className="tw-safety-btn__label">EMERGENCY</span>
      </button>
    </div>
  );
}
