import { useSearchParams, useNavigate, Navigate } from "react-router-dom";
import { Icon } from "@/lib/icons";
import { useStore } from "@/store/useStore";
import { useWellById, useProviders } from "@/store/useCatalog";
import { Eyebrow, Button, Ftc } from "@/components/ui/primitives";

/** Affiliate redirect interstitial — straight handoff + "mark as booked" return. */
export default function Go() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { addToTrip, openPanel } = useStore();
  // GUARD: /go is a mid-booking handoff — it's only meaningful when a provider
  // was passed in. Reached cold (a restored/bookmarked tab, a bare /go URL), it
  // has no partner to hand off to, so it must not strand the visitor on an
  // orphaned "Continuing to our partner" screen. Send them Home instead.
  const toParam = params.get("to");
  if (!toParam) return <Navigate to="/" replace />;
  const to = toParam;
  const wellId = params.get("well") || "stay";
  const well = useWellById(wellId);
  // Real affiliate redirect when the provider has a booking URL (David's intel);
  // otherwise Atlas offers to connect the traveler directly — a working handoff,
  // never a dead end.
  const providers = useProviders();
  const bookingUrl = (providers[wellId] || []).find((p) => p.name === to)?.bookingUrl;

  return (
    <div className="container" style={{ padding: "96px 0", maxWidth: 540 }}>
      <div className="card" style={{ padding: 32, textAlign: "center" }}>
        <div className="icon-chip" style={{ margin: "0 auto 16px", width: 56, height: 56 }}><Icon name="arrow" /></div>
        <Eyebrow>Heading off-site</Eyebrow>
        <h1 className="t-h2" style={{ marginTop: 8 }}>Continuing to {to}</h1>
        <p className="t-body" style={{ color: "var(--muted-foreground)", marginTop: 10 }}>
          You're being handed to a disclosed affiliate partner to complete this booking. When you're done, come back and mark it as booked — we'll add it to your trip.
        </p>
        <Ftc style={{ justifyContent: "center", marginTop: 18 }}>
          This is an affiliate link. We may earn a commission at no extra cost to you.
        </Ftc>
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 24 }}>
          {bookingUrl ? (
            <a className="btn btn-primary" href={bookingUrl} target="_blank" rel="noopener noreferrer">Continue to {to} <Icon name="arrow" small /></a>
          ) : (
            <Button onClick={() => openPanel("concierge")}><Icon name="sparkles" small /> Ask Atlas to connect you with {to}</Button>
          )}
          <Button variant="secondary" onClick={() => { addToTrip({ well: wellId, icon: well?.icon || "compass", name: to, meta: `${well?.name || "Booked"} · affiliate`, status: "confirmed" }); navigate("/itinerary"); }}>
            <Icon name="check" small /> I booked it — add to my trip
          </Button>
          <Button variant="ghost" onClick={() => navigate(-1)}>Cancel, take me back</Button>
        </div>
      </div>
    </div>
  );
}
