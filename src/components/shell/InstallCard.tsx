import { useEffect, useState } from "react";
import { Icon } from "@/lib/icons";

/**
 * The iOS install instructions — because Apple gives us no install prompt.
 *
 * Android and desktop Chrome fire `beforeinstallprompt` and show their own
 * banner; we need to do nothing there. Apple does not implement that event at
 * all, so on iPhone and iPad EVERY install is manual: Share → Add to Home
 * Screen. Without an instruction there is no install, and the PWA half of the
 * app plan quietly doesn't happen.
 *
 * Safari only, and that is not a preference — every iOS browser is WebKit
 * underneath, but Add to Home Screen lives in Safari's share sheet. Chrome and
 * Firefox on iOS cannot do it, so showing them these steps would be instructions
 * for a button they don't have.
 *
 * IN THE PAGE FLOW, NOT FLOATING. There are already bottom-fixed bars on home,
 * si-detail and itinerary at z-index 70, and the retired floating safety stack
 * taught us what overlapping content costs — it did it at every width. A strip
 * at the top of main pushes content instead of covering it, and can never sit on
 * top of the Emergency control.
 *
 * Dismissal sticks. Someone who has decided not to install should not be asked
 * on every page for the rest of the trip.
 */

const DISMISSED = "tww:installCardDismissed";

/** iPhone, iPod, and iPadOS 13+ which reports itself as a Mac with touch. */
function isIos(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  if (/iPad|iPhone|iPod/.test(ua)) return true;
  return /Macintosh/.test(ua) && navigator.maxTouchPoints > 1;
}

/** Safari specifically — CriOS/FxiOS/EdgiOS/OPiOS are the other iOS browsers. */
const isSafari = () =>
  typeof navigator !== "undefined" && !/CriOS|FxiOS|EdgiOS|OPiOS/.test(navigator.userAgent);

/** Already installed: standalone display mode, or Safari's legacy flag. */
function isInstalled(): boolean {
  if (typeof window === "undefined") return false;
  const legacy = (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
  return legacy || window.matchMedia?.("(display-mode: standalone)").matches === true;
}

/**
 * The iOS share glyph — a box with an arrow leaving the top. DRAWN, not
 * described, because "tap the share button" sends people hunting and the icon is
 * the thing they're actually looking for. Marked aria-hidden: the step text
 * names it in words for anyone who can't see it.
 */
function ShareGlyph() {
  return (
    <svg className="tw-install__glyph" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false">
      <path d="M12 3v11" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" fill="none" />
      <path d="M8.5 6.5 12 3l3.5 3.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <path d="M7 11H5.5A1.5 1.5 0 0 0 4 12.5v6A1.5 1.5 0 0 0 5.5 20h13a1.5 1.5 0 0 0 1.5-1.5v-6A1.5 1.5 0 0 0 18.5 11H17"
        stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </svg>
  );
}

export function InstallCard() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Read in an effect, never during render: `navigator` and `matchMedia` don't
    // exist when this is server-rendered, and SSG is a live plan.
    if (localStorage.getItem(DISMISSED) === "1") return;
    if (!isIos() || !isSafari() || isInstalled()) return;
    setShow(true);
  }, []);

  if (!show) return null;

  const dismiss = () => {
    localStorage.setItem(DISMISSED, "1");
    setShow(false);
  };

  return (
    <section className="tw-install" aria-labelledby="tw-install-h">
      <div className="tw-install__inner">
        <div className="tw-install__body">
          <h2 className="tw-install__h" id="tw-install-h">Keep TravelWell on your home screen</h2>
          <p className="tw-install__lead">
            Installed, it opens like an app &mdash; and your emergency numbers and safety cards
            stay available with no signal.
          </p>
          <ol className="tw-install__steps">
            <li>
              Tap <span className="tw-install__inline">Share <ShareGlyph /></span> at the bottom of Safari
            </li>
            <li>Scroll and choose <b>Add to Home Screen</b></li>
            <li>Tap <b>Add</b> &mdash; that&rsquo;s it</li>
          </ol>
        </div>
        <button className="tw-install__x" type="button" onClick={dismiss} aria-label="Dismiss install instructions">
          <Icon name="close" small />
        </button>
      </div>
    </section>
  );
}
