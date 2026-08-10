import { useEffect, useMemo, useState } from "react";
import { Icon } from "@/lib/icons";
import { useStore } from "@/store/useStore";
import {
  UNIVERSAL_EMERGENCY,
  detectCountryCode,
  getEmergencyNumbers,
} from "@/data/emergency-numbers";

type Tab = "call" | "nearby" | "cardiac" | "choking";

/** The "find care near me" locators, moved here from the floating safety stack.
 *  They open a maps search near the traveler — nothing invented, nothing stored.
 *  They are locators, not crisis controls, so they belong one tap inside the
 *  safety surface rather than floating over every page. */
const maps = (q: string) => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;
const NEARBY: { group: string; note: string; items: { label: string; q: string }[] }[] = [
  {
    group: "For people", note: "Hospitals, urgent care and pharmacies near you.",
    items: [
      { label: "Hospitals", q: "hospital near me" },
      { label: "Urgent care", q: "urgent care clinic near me" },
      { label: "Pharmacies", q: "pharmacy near me" },
    ],
  },
  {
    group: "For pets", note: "Around four million people a year travel with a pet.",
    items: [
      { label: "Veterinarians", q: "veterinarian near me" },
      { label: "Animal hospital / ER", q: "emergency animal hospital near me" },
      { label: "Pet groomers", q: "pet groomer near me" },
    ],
  },
];

/**
 * Emergency panel — location-aware emergency numbers + first-aid protocols.
 *
 * Always surfaces the universal number (112) so something actionable renders
 * even when we can't detect a country. Local police/ambulance/fire are resolved
 * from a best-effort, network-free country guess (browser timezone). Protocols
 * are factual first-aid steps — guidance only, not medical care.
 *
 * Data: src/data/emergency-numbers.ts (framework-free; no network).
 */
export function Emergency() {
  const { panel, closePanel } = useStore();
  const open = panel === "emergency";

  const [tab, setTab] = useState<Tab>("call");
  const [country, setCountry] = useState<string | null>(null);

  // Best-effort, network-free country detection when the panel opens.
  useEffect(() => {
    if (!open) return;
    setTab("call");
    try {
      setCountry(detectCountryCode());
    } catch {
      setCountry(null);
    }
  }, [open]);

  const local = country ? getEmergencyNumbers(country) : null;

  // Build a de-duplicated list of distinct local lines, dropping any that just
  // repeat the universal number (so we don't show four identical "911" rows).
  const localLines = useMemo(() => {
    if (!local) return [] as Array<{ label: string; number: string }>;
    const seen = new Set<string>([UNIVERSAL_EMERGENCY]);
    const out: Array<{ label: string; number: string }> = [];
    const push = (label: string, number?: string) => {
      if (!number || seen.has(number)) return;
      seen.add(number);
      out.push({ label, number });
    };
    push("Emergency", local.emergency);
    push("Ambulance / Medical", local.ambulance);
    push("Police", local.police);
    push("Fire", local.fire);
    return out;
  }, [local]);

  return (
    <div className="tw-emergency" data-open={open} role="dialog" aria-modal="true" aria-label="Emergency help" aria-hidden={!open} {...(open ? {} : ({ inert: "" } as any))}>
      <div className="tw-emergency__scrim" onClick={closePanel} />
      <div className="tw-emergency__card">
        <div className="tw-emergency__head">
          <div className="ring"><Icon name="sos" /></div>
          <div style={{ flex: 1 }}>
            <h2 style={{ fontSize: 22 }}>Emergency Help</h2>
            <p className="t-body-s" style={{ color: "var(--muted-foreground)", marginTop: 2 }}>The universal number, your local lines, and quick first-aid steps.</p>
          </div>
          <button className="tw-iconbtn" aria-label="Close" style={{ width: 36, height: 36, border: 0, background: "var(--surface-alt)" }} onClick={closePanel}>
            <Icon name="close" small />
          </button>
        </div>

        {/* Tabs — Call / Cardiac / Choking */}
        <div role="tablist" aria-label="Emergency sections" style={{ display: "flex", gap: 8, padding: "12px 24px 0" }}>
          <TabButton id="call" active={tab} onClick={setTab}>Call</TabButton>
          <TabButton id="nearby" active={tab} onClick={setTab}>Nearby</TabButton>
          <TabButton id="cardiac" active={tab} onClick={setTab}>Cardiac</TabButton>
          <TabButton id="choking" active={tab} onClick={setTab}>Choking</TabButton>
        </div>

        {/* Fixed-height scroll region so the card height stays constant across tabs. */}
        <div className="tw-emergency__body">
        {tab === "call" && (
          <>
            {/* Universal number — ALWAYS rendered, no matter what we detect. */}
            <div style={{ padding: "14px 24px 4px" }}>
              <a className="btn btn-primary" href={`tel:${UNIVERSAL_EMERGENCY}`} style={{ width: "100%", justifyContent: "center", fontSize: 18 }}>
                <Icon name="phone" small /> Call {UNIVERSAL_EMERGENCY} — Emergency
              </a>
              <p className="t-body-s" style={{ color: "var(--muted-foreground)", marginTop: 8 }}>
                112 reaches emergency services across much of the world. If it doesn’t connect, use the local number below.
              </p>
            </div>

            <div className="tw-emergency__list">
              {localLines.length > 0 ? (
                <>
                  <div className="tw-emerg-item" style={{ background: "none", boxShadow: "none" }}>
                    <div className="tw-emerg-item__ic"><Icon name="pin" /></div>
                    <div>
                      <div className="tw-emerg-item__name">{local?.country} — local numbers</div>
                      <div className="tw-emerg-item__meta">Based on your device region — confirm if you’ve travelled.</div>
                    </div>
                  </div>
                  {localLines.map((line) => (
                    <div className="tw-emerg-item" key={`${line.label}-${line.number}`}>
                      <div className="tw-emerg-item__ic"><Icon name="phone" /></div>
                      <div>
                        <div className="tw-emerg-item__name">{line.label}</div>
                        <div className="tw-emerg-item__meta">{local?.country}</div>
                      </div>
                      <a className="btn btn-secondary tw-emerg-item__call" href={`tel:${line.number}`}>Call {line.number}</a>
                    </div>
                  ))}
                  {local?.notes && (
                    <p className="t-body-s" style={{ color: "var(--muted-foreground)", padding: "0 24px" }}>{local.notes}</p>
                  )}
                </>
              ) : (
                <div className="tw-emerg-item" style={{ background: "none", boxShadow: "none" }}>
                  <div className="tw-emerg-item__ic"><Icon name="globe" /></div>
                  <div>
                    <div className="tw-emerg-item__name">Local numbers unavailable</div>
                    <div className="tw-emerg-item__meta">We couldn’t detect your region. Use 112 above, or check the local number for the country you’re in.</div>
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        {tab === "nearby" && (
          <div style={{ padding: "14px 24px 4px" }}>
            {NEARBY.map((g) => (
              <div key={g.group} style={{ marginBottom: 18 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
                  <Icon name={g.group === "For pets" ? "paw" : "cross"} small />
                  <strong>{g.group}</strong>
                </div>
                <p className="t-body-s" style={{ color: "var(--muted-foreground)", marginBottom: 8 }}>{g.note}</p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {g.items.map((it) => (
                    <a key={it.q} className="btn btn-secondary" href={maps(it.q)} target="_blank" rel="noopener noreferrer">
                      <Icon name="pin" small /> {it.label}
                    </a>
                  ))}
                </div>
              </div>
            ))}
            <p className="t-body-s" style={{ color: "var(--muted-foreground)" }}>
              These open a maps search near you — we don't store your location. In a crisis, use the Call tab first.
            </p>
          </div>
        )}

        {tab === "cardiac" && (
          <Protocol
            icon="heart"
            title="Chest Pain / Heart Attack"
            steps={[
              "Call the emergency number on the Call tab. Stay on the line.",
              "Sit or lie down immediately. Do NOT walk around.",
              "Chew aspirin (325mg, or 4×81mg) if available and not allergic.",
              "Unlock your phone. Show this screen to any bystander.",
            ]}
          />
        )}

        {tab === "choking" && (
          <Protocol
            icon="cross"
            title="Choking — Cannot Breathe or Speak"
            steps={[
              "Ask: “Are you choking?” — if they nod or cannot speak, act now.",
              "Lean them forward. Give 5 firm back blows between the shoulder blades with the heel of your hand.",
              "Stand behind. Arms around the waist. One fist above the navel, below the chest; other hand over the fist. Pull sharply in and up — 5 times.",
              "Alternate 5 back blows and 5 abdominal thrusts. Keep repeating.",
              "LifeVac (if you have one): seal the mask over mouth and nose, push down, then pull up firmly. The one-way valve helps avoid pushing the object deeper.",
            ]}
            notes={[
              "If they become unconscious: lower them gently to the floor, call emergency services, and begin CPR — compressions may dislodge the object. Check the mouth before each rescue breath.",
              "Infant under 1: face-down on your forearm, 5 back blows; turn face-up, 5 chest thrusts (two fingers, centre of chest). Do NOT perform abdominal thrusts on infants.",
            ]}
          />
        )}
        </div>

        <div style={{ padding: "8px 24px 22px" }}>
          <p className="ftc">
            <Icon name="globe" small /> Guidance only — call local emergency services. TravelWell does not provide medical care, and numbers are surfaced from verified data, never fabricated. Confirm with local authorities on the ground.
          </p>
        </div>
      </div>
    </div>
  );
}

function TabButton({ id, active, onClick, children }: { id: Tab; active: Tab; onClick: (t: Tab) => void; children: React.ReactNode }) {
  const on = active === id;
  return (
    <button
      role="tab"
      aria-selected={on}
      className={on ? "btn btn-secondary" : "btn btn-ghost"}
      style={{ flex: 1, justifyContent: "center" }}
      onClick={() => onClick(id)}
    >
      {children}
    </button>
  );
}

function Protocol({ icon, title, steps, notes }: { icon: string; title: string; steps: string[]; notes?: string[] }) {
  return (
    <div style={{ padding: "14px 24px 4px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
        <Icon name={icon} small />
        <strong>{title}</strong>
      </div>
      <ol style={{ display: "flex", flexDirection: "column", gap: 8, paddingInlineStart: 18, margin: 0 }}>
        {steps.map((s, i) => (
          <li key={i} className="t-body-s">{s}</li>
        ))}
      </ol>
      {notes?.map((n, i) => (
        <p key={i} className="t-body-s" style={{ color: "var(--muted-foreground)", marginTop: 10 }}>{n}</p>
      ))}
    </div>
  );
}
