import { Routes, Route, useNavigate, useLocation } from "react-router-dom";
import { useEffect, useRef, lazy } from "react";
import { Shell } from "@/components/shell/Shell";
import { useCatalog } from "@/store/useCatalog";
import { useStore } from "@/store/useStore";

// Pages are code-split: each becomes its own chunk, fetched on first visit.
// The Suspense boundary that covers these lives in Shell (around <Outlet/>).
const Home = lazy(() => import("@/pages/Home"));
const SpecialInterests = lazy(() => import("@/pages/SpecialInterests"));
const SiDetail = lazy(() => import("@/pages/SiDetail"));
const Regions = lazy(() => import("@/pages/Regions"));
const RegionDetail = lazy(() => import("@/pages/RegionDetail"));
const Activities = lazy(() => import("@/pages/Activities"));
const WellsSurface = lazy(() => import("@/pages/WellsSurface"));
const Wells = lazy(() => import("@/pages/Wells"));
const Providers = lazy(() => import("@/pages/Providers"));
const Destinations = lazy(() => import("@/pages/Destinations"));
const DestinationDetail = lazy(() => import("@/pages/DestinationDetail"));
const Itinerary = lazy(() => import("@/pages/Itinerary"));
const FlightSearch = lazy(() => import("@/pages/FlightSearch"));
const Luxury = lazy(() => import("@/pages/Luxury"));
const Guides = lazy(() => import("@/pages/Guides"));
const Calendar = lazy(() => import("@/pages/Calendar"));
const GuideDetail = lazy(() => import("@/pages/GuideDetail"));
const FirstAidKit = lazy(() => import("@/pages/FirstAidKit"));
const Demo = lazy(() => import("@/pages/Demo"));
const SignUp = lazy(() => import("@/pages/SignUp"));
const SignIn = lazy(() => import("@/pages/SignIn"));
const VerifyEmail = lazy(() => import("@/pages/VerifyEmail"));
const Activation = lazy(() => import("@/pages/Activation"));
const WelcomeBack = lazy(() => import("@/pages/WelcomeBack"));
const Profile = lazy(() => import("@/pages/Profile"));
const Plan = lazy(() => import("@/pages/Plan"));
const About = lazy(() => import("@/pages/About"));
const Privacy = lazy(() => import("@/pages/Privacy"));
const Terms = lazy(() => import("@/pages/Terms"));
const Disclosure = lazy(() => import("@/pages/Disclosure"));
const Contact = lazy(() => import("@/pages/Contact"));
const Sitemap = lazy(() => import("@/pages/Sitemap"));
const Go = lazy(() => import("@/pages/Go"));
const Placeholder = lazy(() => import("@/pages/Placeholder").then((m) => ({ default: m.Placeholder })));

// Don't resume into auth/utility flows — only the trip-building journey.
const NO_RESUME = new Set(["", "signin", "signup", "verify", "activation", "go", "sitemap"]);
function isResumable(path: string): boolean {
  if (!path || path === "/") return false;
  const first = path.replace(/\/+$/, "").split("/").filter(Boolean)[0] ?? "";
  return !NO_RESUME.has(first);
}

/**
 * Pick up where they left off: on the first landing at "/" in a session, send
 * the traveler to their last journey position. Only from root (never hijacks a
 * deep link) and only once per session (clicking the logo home still works).
 */
function ResumeRedirect() {
  const navigate = useNavigate();
  const location = useLocation();
  // Capture the resume target at first render — before Shell's route effect
  // overwrites lastPath with the current ("/") path.
  const target = useRef(useStore.getState().lastPath);
  const done = useRef(false);
  useEffect(() => {
    if (done.current) return;
    done.current = true; // one-shot per mount
    if (location.pathname !== "/") return; // only resume from root, never hijack a deep link
    try { if (sessionStorage.getItem("tww:resumed")) return; } catch { /* ignore */ }
    if (target.current && isResumable(target.current)) {
      try { sessionStorage.setItem("tww:resumed", "1"); } catch { /* ignore */ }
      navigate(target.current, { replace: true });
    }
  }, [location.pathname, navigate]);
  return null;
}

export default function App() {
  // Hydrate the catalog from Postgres once on boot. No-ops gracefully (keeps
  // the bundle) when Supabase isn't configured or is unreachable.
  const hydrate = useCatalog((s) => s.hydrate);
  useEffect(() => {
    hydrate();
  }, [hydrate]);

  return (
    <>
    <ResumeRedirect />
    <Routes>
      <Route element={<Shell />}>
        <Route path="/" element={<Home />} />
        <Route path="/plan" element={<Plan />} />
        <Route path="/guides" element={<Guides />} />
        <Route path="/calendar" element={<Calendar />} />
        <Route path="/guide/:id" element={<GuideDetail />} />
        <Route path="/about" element={<About />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="/disclosure" element={<Disclosure />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/special-interests" element={<SpecialInterests />} />
        <Route path="/si/:id" element={<SiDetail />} />
        <Route path="/regions" element={<Regions />} />
        <Route path="/region/:code" element={<RegionDetail />} />
        <Route path="/activities" element={<Activities />} />
        <Route path="/wells" element={<Wells />} />
        <Route path="/wells-surface" element={<WellsSurface />} />
        <Route path="/well/:id" element={<WellsSurface />} />
        <Route path="/providers" element={<Providers />} />
        <Route path="/destinations" element={<Destinations />} />
        <Route path="/destination/:id" element={<DestinationDetail />} />
        <Route path="/itinerary" element={<Itinerary />} />
        <Route path="/flights" element={<FlightSearch />} />
        <Route path="/luxury" element={<Luxury />} />
        <Route path="/first-aid-kit" element={<FirstAidKit />} />
        <Route path="/demo" element={<Demo />} />
        <Route path="/vc-demo" element={<Demo gated />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/signin" element={<SignIn />} />
        <Route path="/verify" element={<VerifyEmail />} />
        <Route path="/activation" element={<Activation />} />
        <Route path="/welcome-back" element={<WelcomeBack />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/sitemap" element={<Sitemap />} />
        <Route path="/go" element={<Go />} />
        <Route path="*" element={<Placeholder title="Not found" eyebrow="404" lead="That page wandered off the map. Let's get you back on the trail." />} />
      </Route>
    </Routes>
    </>
  );
}
