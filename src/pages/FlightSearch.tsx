import { useState } from "react";
import { Link } from "react-router-dom";
import { Icon } from "@/lib/icons";
import { Eyebrow, Ftc } from "@/components/ui/primitives";
import { useStore } from "@/store/useStore";
import { searchFlights, type FlightOffer, type FlightSearchResult } from "@/lib/flights";

// Search-only Fly-Well surface. Talks to our own `searchFlights()` seam — never
// Duffel directly. Payments-never: the traveler books with the airline (the
// merchant of record); "Add to trip" only places a Fly-Well idea (placed ≠
// booked). TEST/sandbox offers until go-live.

const todayIso = () => new Date().toISOString().slice(0, 10);
const plusDaysIso = (n: number) => new Date(Date.now() + n * 864e5).toISOString().slice(0, 10);

/** "PT7H30M" → "7h 30m" (defensive; returns "" on anything unexpected). */
function humanDuration(iso: string | null): string {
  if (!iso) return "";
  const m = /^PT(?:(\d+)H)?(?:(\d+)M)?/.exec(iso);
  if (!m) return "";
  const [, h, min] = m;
  return [h && `${h}h`, min && `${min}m`].filter(Boolean).join(" ");
}

function timeOf(dt: string | null): string {
  if (!dt) return "";
  const d = new Date(dt);
  return isNaN(d.getTime()) ? "" : d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}
function dateOf(dt: string | null): string {
  if (!dt) return "";
  const d = new Date(dt);
  return isNaN(d.getTime()) ? "" : d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function money(amount: string | null, currency: string | null): string {
  if (amount == null) return "—";
  const n = parseFloat(amount);
  if (isNaN(n)) return `${amount} ${currency ?? ""}`.trim();
  try {
    return new Intl.NumberFormat(undefined, { style: "currency", currency: currency || "USD", maximumFractionDigits: 0 }).format(n);
  } catch {
    return `${Math.round(n)} ${currency ?? ""}`.trim();
  }
}

const CABINS = [
  { v: "economy", label: "Economy" },
  { v: "premium_economy", label: "Premium" },
  { v: "business", label: "Business" },
  { v: "first", label: "First" },
] as const;

export default function FlightSearch() {
  const { addToTrip, showToast } = useStore();
  const [origin, setOrigin] = useState("");
  const [dest, setDest] = useState("");
  const [depart, setDepart] = useState(plusDaysIso(30));
  const [ret, setRet] = useState("");
  const [adults, setAdults] = useState(1);
  const [cabin, setCabin] = useState<(typeof CABINS)[number]["v"]>("economy");

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<FlightSearchResult | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const codeOk = (s: string) => /^[A-Za-z]{3}$/.test(s.trim());
  const canSearch = codeOk(origin) && codeOk(dest) && !!depart && !loading;

  async function onSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!canSearch) return;
    setLoading(true);
    setErr(null);
    setResult(null);
    const slices = [{ origin: origin.trim().toUpperCase(), destination: dest.trim().toUpperCase(), date: depart }];
    if (ret) slices.push({ origin: dest.trim().toUpperCase(), destination: origin.trim().toUpperCase(), date: ret });
    const r = await searchFlights({ slices, adults, cabin });
    setResult(r);
    setLoading(false);
  }

  function addOffer(o: FlightOffer) {
    const first = o.slices[0];
    const last = o.slices[o.slices.length - 1];
    const route = first ? `${first.origin} → ${last?.destination ?? first.destination}${o.slices.length > 1 ? " · round-trip" : ""}` : o.airline;
    addToTrip({
      well: "fly",
      icon: "plane",
      name: `${route} · ${o.airline}`,
      meta: `Fly-Well · ${money(o.price.amount, o.price.currency)}`,
      status: "idea",
    });
    showToast("Flight idea saved to your trip");
  }

  const offers = result?.offers ?? [];
  const unconfigured = result?.mode === "unconfigured";
  const degraded = result?.degraded && !unconfigured;

  return (
    <>
      <div className="jn-subhead">
        <div className="jn-subhead__inner">
          <nav className="jn-crumbs" aria-label="Breadcrumb">
            <Link to="/">Home</Link><span className="sep">/</span>
            <Link to="/wells">Wells</Link><span className="sep">/</span>
            <span className="here">Fly-Well · Flights</span>
          </nav>
        </div>
      </div>

      <div className="container jn-intro">
        <Eyebrow>Fly-Well</Eyebrow>
        <h1>Find your flight.</h1>
        <p className="lead">Search 300+ airlines in one place. You book directly with the airline — we just find you the way there.</p>
      </div>

      <div className="container" style={{ paddingBottom: 80 }}>
        <form className="card" onSubmit={onSearch} style={{ padding: 22, display: "grid", gap: 16 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <div className="fld">
              <label htmlFor="fl-from">From <span style={{ color: "var(--muted-foreground)", fontWeight: 400 }}>(airport code)</span></label>
              <input id="fl-from" placeholder="e.g. JFK" value={origin} maxLength={3}
                autoCapitalize="characters" autoComplete="off" spellCheck={false}
                onChange={(e) => setOrigin(e.target.value.toUpperCase())} aria-invalid={!!origin && !codeOk(origin)} />
            </div>
            <div className="fld">
              <label htmlFor="fl-to">To <span style={{ color: "var(--muted-foreground)", fontWeight: 400 }}>(airport code)</span></label>
              <input id="fl-to" placeholder="e.g. LHR" value={dest} maxLength={3}
                autoCapitalize="characters" autoComplete="off" spellCheck={false}
                onChange={(e) => setDest(e.target.value.toUpperCase())} aria-invalid={!!dest && !codeOk(dest)} />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <div className="fld">
              <label htmlFor="fl-depart">Depart</label>
              <input id="fl-depart" type="date" value={depart} min={todayIso()} onChange={(e) => setDepart(e.target.value)} />
            </div>
            <div className="fld">
              <label htmlFor="fl-return">Return <span style={{ color: "var(--muted-foreground)", fontWeight: 400 }}>(optional)</span></label>
              <input id="fl-return" type="date" value={ret} min={depart || todayIso()} onChange={(e) => setRet(e.target.value)} />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 14, alignItems: "end" }}>
            <div className="fld">
              <label htmlFor="fl-adults">Travelers</label>
              <input id="fl-adults" type="number" min={1} max={9} value={adults}
                onChange={(e) => setAdults(Math.min(9, Math.max(1, +e.target.value || 1)))} />
            </div>
            <div className="fld">
              <span id="fl-cabin-lbl" style={{ display: "block", marginBottom: 6, fontWeight: 600, fontSize: 13 }}>Cabin</span>
              <div role="radiogroup" aria-labelledby="fl-cabin-lbl" style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {CABINS.map((c) => (
                  <button type="button" key={c.v} role="radio" aria-checked={cabin === c.v}
                    onClick={() => setCabin(c.v)}
                    className={cabin === c.v ? "chip chip--on" : "chip"}
                    style={{ padding: "8px 14px", minHeight: 40, borderRadius: 999, cursor: "pointer",
                      border: "1px solid var(--border)", fontSize: 13, fontWeight: 600,
                      background: cabin === c.v ? "var(--foreground)" : "transparent",
                      color: cabin === c.v ? "var(--background)" : "var(--foreground)" }}>
                    {c.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <button type="submit" className="btn btn-primary" disabled={!canSearch}
            style={{ height: 52, fontSize: 16, opacity: canSearch ? 1 : 0.55 }}>
            {loading ? "Searching…" : <><Icon name="plane" small /> Search flights</>}
          </button>
        </form>

        {/* Results */}
        <div style={{ marginTop: 28 }} aria-live="polite">
          {loading && <p className="t-body-s" style={{ color: "var(--muted-foreground)" }}>Finding the best ways there…</p>}

          {err && <p className="t-body-s" style={{ color: "var(--muted-foreground)" }}>{err}</p>}

          {unconfigured && (
            <div className="jn-context">
              <div className="jn-context__ic"><Icon name="info" small /></div>
              <div><b>Flight search isn't live yet.</b> The flight rail is wired but the sandbox connection isn't switched on in this environment — offers will appear here once it is.</div>
            </div>
          )}

          {degraded && (
            <div className="jn-context">
              <div className="jn-context__ic"><Icon name="info" small /></div>
              <div><b>Couldn't reach the flight rail just now.</b> Your trip is safe and saved — try the search again in a moment.</div>
            </div>
          )}

          {result && !loading && !unconfigured && !degraded && offers.length === 0 && (
            <p className="t-body-s" style={{ color: "var(--muted-foreground)" }}>No flights found for those dates. Try nearby dates or a different route.</p>
          )}

          {offers.length > 0 && (
            <>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                <Eyebrow>{offers.length} option{offers.length > 1 ? "s" : ""}</Eyebrow>
                {result?.mode === "test" && (
                  <span className="pill pill-preview" title="Sandbox results — not a real ticket">Test / sandbox</span>
                )}
              </div>

              <div className="fl-list">
                {offers.map((o) => (
                  <div className="fl-card" key={o.id}>
                    <div className="fl-card__head">
                      <div className="fl-airline">
                        <span className="fl-airline__badge">{o.airlineCode || <Icon name="plane" small />}</span>
                        <span className="fl-airline__name">{o.airline}</span>
                      </div>
                      <div className="fl-price">
                        <span className="fl-price__amt">{money(o.price.amount, o.price.currency)}</span>
                        <span className="fl-price__lbl">total{adults > 1 ? ` · ${adults} travelers` : ""}</span>
                      </div>
                    </div>
                    <div className="fl-legs">
                      {o.slices.map((s, i) => (
                        <div className="fl-leg" key={i}
                          aria-label={`${i === 0 ? "Outbound" : "Return"}: ${s.origin} ${timeOf(s.departsAt)} to ${s.destination} ${timeOf(s.arrivesAt)}, ${humanDuration(s.durationIso)}, ${s.stops === 0 ? "nonstop" : `${s.stops} stop${s.stops > 1 ? "s" : ""}`}`}>
                          <span className="fl-leg__dir"><Icon name={i === 0 ? "plane" : "arrow"} small /> {i === 0 ? "Depart" : "Return"}</span>
                          <div className="fl-pt"><span className="fl-pt__code">{s.origin}</span><span className="fl-pt__time">{timeOf(s.departsAt)}</span></div>
                          <div className="fl-path">
                            <span className="fl-path__dur">{humanDuration(s.durationIso) || "—"}</span>
                            <span className="fl-path__line" aria-hidden="true"><i /><Icon name="plane" small /><i /></span>
                            <span className={"fl-path__stops" + (s.stops === 0 ? " is-nonstop" : "")}>{s.stops === 0 ? "nonstop" : `${s.stops} stop${s.stops > 1 ? "s" : ""}`}</span>
                          </div>
                          <div className="fl-pt fl-pt--end"><span className="fl-pt__code">{s.destination}</span><span className="fl-pt__time">{timeOf(s.arrivesAt)}</span></div>
                          <span className="fl-leg__date"><Icon name="calendar" small /> {dateOf(s.departsAt)}</span>
                        </div>
                      ))}
                    </div>
                    <div className="fl-card__foot">
                      <button className="btn btn-secondary fl-add" onClick={() => addOffer(o)}><Icon name="heart" small /> Add to trip</button>
                    </div>
                  </div>
                ))}
              </div>

              <Ftc style={{ marginTop: 16 }}>
                For now, you book directly with the airline — they take the payment and are the merchant of record.
                "Add to trip" saves a flight idea to your itinerary; nothing is booked or held until you complete it with the airline.
              </Ftc>
            </>
          )}
        </div>
      </div>
    </>
  );
}
