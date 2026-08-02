import { useEffect, Suspense } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { Header } from "./Header";
import { MegaMenu } from "./MegaMenu";
import { Footer } from "./Footer";
import { Concierge } from "./Concierge";
import { TripTray } from "./TripTray";
import { Emergency } from "./Emergency";
import { SafetyStack } from "./SafetyStack";
import { Ambient } from "./Ambient";
import { AtlasOrchestrator } from "./AtlasOrchestrator";
import { TourGuide } from "./TourGuide";
import { BackBar } from "./BackBar";
import { CookieConsent } from "./CookieConsent";
import { useStore, applyInitialLocale } from "@/store/useStore";
import { getCurrentUser, onAuthChange } from "@/lib/auth";
import { flushPendingTravelId } from "@/lib/travelId";
import { track, type EventEntity } from "@/lib/track";

// Map a route to a typed exploration event, so the log is queryable by entity
// (/si/sailing → view si sailing) rather than just raw paths.
function routeView(pathname: string): { entity: EventEntity; entityId: string } {
  const [a, b] = pathname.replace(/\/+$/, "").split("/").filter(Boolean);
  switch (a) {
    case "si": return { entity: "si", entityId: b };
    case "region": return { entity: "region", entityId: b };
    case "destination": return { entity: "destination", entityId: b };
    case "guide": return { entity: "guide", entityId: b };
    case "well": return { entity: "well", entityId: b };
    default: return { entity: "page", entityId: pathname || "/" };
  }
}

// Map a route to the page-scope slug used by src/styles/pages.css. Every page
// block in pages.css is scoped under [data-page="<slug>"] so per-page styles
// can never leak into another page (see the styles refactor).
const PAGE_SLUGS: Record<string, string> = {
  "special-interests": "special-interests", "si": "si-detail",
  "regions": "regions", "region": "region-detail", "activities": "activities",
  "wells": "wells", "wells-surface": "wells-surface", "well": "well-detail",
  "providers": "providers", "destinations": "destinations", "destination": "destination-detail",
  "guides": "guides", "guide": "guide-detail", "plan": "plan",
  "first-aid-kit": "first-aid-kit", "go": "go", "about": "about", "profile": "profile",
  "privacy": "legal", "terms": "legal", "disclosure": "legal", "contact": "legal",
  "signin": "sign-in", "verify": "verify-email", "sitemap": "sitemap",
  "itinerary": "itinerary", "luxury": "luxury", "demo": "demo", "vc-demo": "demo",
  "signup": "sign-up", "activation": "activation",
};
function pageSlug(pathname: string): string {
  const p = pathname.replace(/\/+$/, "");
  if (p === "") return "home";
  const first = p.split("/").filter(Boolean)[0] ?? "home";
  return PAGE_SLUGS[first] ?? first;
}

// Full-bleed auth/onboarding pages render without the standard footer.
const NO_FOOTER = new Set(["sign-in", "verify-email", "sign-up", "activation", "go"]);

export function Shell() {
  const { panel, closePanel } = useStore();
  const atlasDock = useStore((s) => s.atlasDock);
  const setLastPath = useStore((s) => s.setLastPath);
  const location = useLocation();

  // ESC closes any open panel.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") closePanel(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [closePanel]);

  // Apply persisted locale/dir once.
  useEffect(() => { applyInitialLocale(); }, []);

  // Hydrate auth session + subscribe (no-ops until Supabase is configured).
  // On sign-in, flush any Travel ID captured during Sign Up to the database.
  const setUser = useStore((s) => s.setUser);
  const showToast = useStore((s) => s.showToast);
  const hydrateJourney = useStore((s) => s.hydrateJourney);
  useEffect(() => {
    const onUser = (u: { id: string; email: string | null } | null) => {
      setUser(u);
      if (u) {
        // Flush the Sign-Up Travel ID first, then load/migrate this account's
        // journey so the itinerary resumes across devices.
        flushPendingTravelId(u.id)
          .then((saved) => { if (saved) showToast("Travel ID saved to your account ✓"); })
          .finally(() => hydrateJourney(u.id));
      }
    };
    getCurrentUser().then(onUser);
    return onAuthChange(onUser);
  }, [setUser, showToast, hydrateJourney]);

  // Close panels + scroll to top on route change; remember position + log the view.
  useEffect(() => {
    closePanel();
    window.scrollTo(0, 0);
    setLastPath(location.pathname);
    const v = routeView(location.pathname);
    track({ kind: "view", entity: v.entity, entityId: v.entityId, context: { path: location.pathname } });
  }, [location.pathname, closePanel, setLastPath]);

  // Lock body scroll while an overlay panel is open (menu / tray / emergency),
  // or while Atlas is open as a full sheet on mobile — so scrolling the overlay
  // doesn't bleed through to the page behind it. On desktop Atlas is a docked
  // card, not a full sheet, so it doesn't lock the page.
  useEffect(() => {
    const atlasSheet = atlasDock === "open" && typeof window !== "undefined"
      && window.matchMedia("(max-width: 700px)").matches;
    document.body.style.overflow = (panel || atlasSheet) ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [panel, atlasDock]);

  const slug = pageSlug(location.pathname);
  return (
    <>
      <a className="skip-link" href="#main">Skip to content</a>
      <Header />
      <MegaMenu />
      <main id="main" className="tw-main" data-page={slug}>
        <BackBar />
        {/* Route pages are code-split (React.lazy in App.tsx). The Suspense
            boundary lives here so the header, footer and panels stay mounted
            while the next page's chunk loads. */}
        <Suspense fallback={<div className="route-loading" role="status" aria-busy="true" aria-label="Loading" />}>
          <Outlet />
        </Suspense>
      </main>
      {!NO_FOOTER.has(slug) && <Footer />}
      <Concierge />
      <TripTray />
      <Emergency />
      <SafetyStack />
      <Ambient />
      <AtlasOrchestrator />
      <TourGuide />
      <CookieConsent />
    </>
  );
}
