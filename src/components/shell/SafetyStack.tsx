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
  const { openPanel, panel } = useStore();
  const [sheet, setSheet] = useState<null | "human" | "pet">(null);
  if (panel === "emergency") return null; // the full panel is open; don't double up

  const items = sheet === "human" ? HUMAN : sheet === "pet" ? PET : [];

  return (
    <div className="tw-safety-stack">
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
        <span className="tw-safety-btn__cross"><Icon name="cross" small /></span> Human Safety
      </button>
      <button className="tw-safety-btn tw-safety-btn--green" aria-expanded={sheet === "pet"} aria-haspopup="menu"
        onClick={() => setSheet(sheet === "pet" ? null : "pet")}>
        <span className="tw-safety-btn__cross"><Icon name="cross" small /></span> Pet Safety
      </button>
      <button className="tw-safety-btn tw-safety-btn--red" onClick={() => openPanel("emergency")} aria-label="Emergency help — call for help now">
        <Icon name="sos" small /> EMERGENCY
      </button>
    </div>
  );
}
