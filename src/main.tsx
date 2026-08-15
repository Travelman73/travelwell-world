import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { requestPersistentStorage } from "./lib/persistence";

/** requestIdleCallback where it exists (not Safari < 16.4), a timeout elsewhere. */
const requestIdleCallbackSafe = (fn: () => void) =>
  typeof window !== "undefined" && "requestIdleCallback" in window
    ? (window as unknown as { requestIdleCallback: (cb: () => void) => void }).requestIdleCallback(fn)
    : setTimeout(fn, 1200);

// Order matters: Tailwind preflight first, then the settled design system,
// then the per-area stylesheets that compose on top of the tokens.
import "./index.css";
import "./styles/tokens.css";
import "./styles/shell.css";
import "./styles/journey.css";
import "./styles/wells.css";
import "./styles/itinerary.css";
import "./styles/checkout.css";
import "./styles/onboarding.css";
import "./styles/profile.css";
import "./styles/luxury.css";
import "./styles/investor.css";
import "./styles/pages.css";

// Ask the browser to keep our offline cache from being evicted. Deferred to
// after first paint on purpose: this is a background guarantee for the emergency
// panel, never something that should delay the first screen. See lib/persistence
// for why browsers are more likely to say yes once the app is genuinely in use.
requestIdleCallbackSafe(() => { void requestPersistentStorage(); });

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
