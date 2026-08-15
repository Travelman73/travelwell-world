import { Link, useSearchParams, useNavigate, Navigate } from "react-router-dom";
import { Icon } from "@/lib/icons";
import { useStore } from "@/store/useStore";
import { useWellById, useProviders, useDestinations } from "@/store/useCatalog";
import { Eyebrow, Button, Ftc } from "@/components/ui/primitives";
import { resolveDestId } from "@/data/places";
import { resolveSafety, isoForCountry } from "@/data/safety-data";

/**
 * Affiliate redirect interstitial — straight handoff + "mark as booked" return.
 *
 * AND THE SAFETY CHOKEPOINT. `/go` is the single door out to a partner, which
 * makes it the one place a safety rule can be enforced once instead of on every
 * booking control. Gating buttons does not hold: they multiply, and one gets
 * missed — which is exactly what happened with Level 4, where the safety card
 * said "not bookable" while every Book It button below it stayed live.
 *
 * `?dest=<id>` carries WHICH destination is being booked. Without it this page
 * knows a provider and a Well and nothing about where in the world the traveller
 * is going, so it cannot look up an advisory even in principle.
 *
 * HONEST LIMIT, stated because it matters more than the code: no caller supplies
 * `dest` yet. `WellsSurface` and `Providers` are Well- and region-scoped and
 * genuinely don't know a destination, and the destination page's Book It opens
 * Atlas rather than routing through here. So today this is a capability with one
 * live consumer — a hand-built or shared link — not yet a gate across the
 * product. Making it one means deciding whether destination-originated bookings
 * should route through `/go`, which is a product call, not plumbing.
 *
 * The rule enforced here is the absolute one only: LEVEL 4 NEVER BOOKS, no
 * consent override (David, 2026-08-05). The Level 3 consent gate is a separate
 * screen waiting on his content and his attorney's wording.
 */
export default function Go() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { addToTrip, openPanel } = useStore();
  const destinations = useDestinations();
  const toParam = params.get("to");
  const to = toParam ?? "";
  const wellId = params.get("well") || "stay";
  const well = useWellById(wellId);
  // Real affiliate redirect when the provider has a booking URL (David's intel);
  // otherwise Atlas offers to connect the traveler directly — a working handoff,
  // never a dead end.
  const providers = useProviders();
  const bookingUrl = (providers[wellId] || []).find((p) => p.name === to)?.bookingUrl;

  // Resolve the destination if one was passed. Legacy slugs resolve too, since a
  // shared or saved link may carry a pre-rename id.
  const destId = resolveDestId(params.get("dest") || undefined);
  const dest = destId
    ? Object.values(destinations).flat().find((d) => d.id === destId)
    : undefined;
  const safety = dest ? resolveSafety(dest, isoForCountry(dest.country)) : null;

  // GUARD: /go is a mid-booking handoff — only meaningful when a provider was
  // passed in. Reached cold (a restored tab, a bare /go URL) it has no partner to
  // hand off to, so it must not strand the visitor on an orphaned "Continuing to
  // our partner" screen. Home instead.
  //
  // BELOW THE HOOKS DELIBERATELY. This return used to sit above `useWellById`,
  // `useProviders` and now `useDestinations` — so a render that took it called
  // three fewer hooks than one that didn't. That is stable while the URL never
  // changes under a mounted component and breaks the moment it does (navigating
  // /go?to=X → /go), which is React's "rendered fewer hooks than expected" crash.
  // Latent, not theoretical, and cheaper to fix while the file is open.
  if (!toParam) return <Navigate to="/" replace />;

  // LEVEL 4 NEVER BOOKS. Refused here as well as at the button, deliberately —
  // the button block is the first line of defence and this is the one that holds
  // when a link is shared, restored from a tab, or reached by a path nobody
  // predicted. Belt and braces is the correct posture for the rule David called
  // absolute.
  if (safety?.bookingHold) {
    return (
      <div className="container" style={{ padding: "96px 0", maxWidth: 560 }}>
        <div className="card" style={{ padding: 32 }}>
          <Eyebrow>We&rsquo;ve stopped this booking</Eyebrow>
          <h1 className="t-h2" style={{ marginTop: 8 }}>
            {dest!.name} is under a &ldquo;Do Not Travel&rdquo; advisory.
          </h1>
          <p className="t-body" style={{ marginTop: 12 }}>
            {dest!.country} currently carries <b>Level {safety.lvl} &mdash; {safety.label}</b>. We
            don&rsquo;t sell trips to a place while its government advisory says do not travel,
            and there&rsquo;s no way to agree past this one.
          </p>
          <p className="t-body" style={{ marginTop: 12, color: "var(--muted-foreground)" }}>
            The page stays up so you can read the situation for yourself, including the
            official advisory and what it says about specific areas.
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 24 }}>
            <Link className="btn btn-primary" to={`/destination/${dest!.id}`}>
              Read the advisory for {dest!.name} <Icon name="arrow" small />
            </Link>
            <Button variant="secondary" onClick={() => openPanel("concierge")}>
              <Icon name="sparkles" small /> Ask Atlas for somewhere comparable
            </Button>
          </div>
        </div>
      </div>
    );
  }

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
