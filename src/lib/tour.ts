/**
 * TravelWell.World — the guided-walk choreography (prototype engine).
 *
 * This is the generalization of the Atlas hero flow: instead of one hard-coded
 * beat inside the concierge dock, a tour is a DATA-DRIVEN ordered list of beats,
 * each one = { Atlas line, target to spotlight, and the real action that advances
 * it }. The engine (src/components/shell/TourGuide.tsx) spotlights the target on
 * its screen, waits for the traveler to actually do the step (never auto-plays),
 * and moves to the next — across routes.
 *
 * This is the seed for the unattended-demo "guided hand" (see
 * docs/status-and-launch-plan.md → "Unattended guided-walk"). A VC opens a link
 * like `/?tour=safari` and Atlas walks them the whole way with nobody driving.
 *
 * Anchors are decoupled from styling via data-* attributes / stable classes, so
 * the tour never breaks when a component is restyled.
 */
import type { TripBlock } from "@/store/useStore";

export interface TourBeat {
  /** Exact pathname where this beat lives (the engine only spotlights on-route). */
  route: string;
  /** The element to spotlight (first match). Prefer data-* anchors. */
  selector: string;
  /** Atlas's one-line cue — short, spoken-length. */
  line: string;
  /** Where to place the caption relative to the target. */
  place?: "above" | "below";
  /** Navigate here after the beat completes, when the target's own click doesn't
   *  already move the traveler forward (e.g. a select-in-place action). */
  advanceNav?: string;
  /** Atlas "holds" an option as the beat completes — mirrors the hero's Hold-it,
   *  so the itinerary reveal downstream shows a real piece the walk just placed. */
  hold?: TripBlock;
  /** Switch the whole UI to this locale as the beat completes (the live language
   *  flip — e.g. "ar" mirrors everything to RTL). The tap is intercepted so we
   *  switch directly instead of opening the locale menu. */
  setLocale?: string;
  /** Caption language / direction — so an Arabic close renders as real RTL text. */
  lang?: string;
  rtl?: boolean;
}

export interface TourDef {
  id: string;
  label: string;
  beats: TourBeat[];
}

/** The first real walk: the Safari / East Africa spine we already have deep. */
export const SAFARI_TOUR: TourDef = {
  id: "safari",
  label: "Safari · East Africa",
  beats: [
    {
      route: "/special-interests",
      selector: '[data-si="safari"]',
      line: "Let's shape your safari — tap Safari to add it to your journey.",
      place: "below",
      advanceNav: "/regions", // selecting the SI stays in place; Atlas moves the scene
    },
    {
      route: "/regions",
      selector: '[data-region="05A"]',
      line: "Now — where. East Africa is the cradle of the safari. Open it.",
      place: "below",
    },
    {
      route: "/region/05A",
      selector: ".rd-dest",
      line: "Here's where I'd begin. Tap a camp to see how deep the intel goes.",
      place: "above",
    },
    {
      route: "/destination/masai-mara",
      selector: ".dd-pv",
      line: "These are your options — vetted stays, straight pricing. I'll hold this one for you.",
      place: "above",
      advanceNav: "/itinerary",
      hold: { well: "stay", icon: "bed", name: "Angama Mara", meta: "Stay-Well · held by Atlas", status: "idea" },
    },
    {
      route: "/itinerary",
      selector: ".it-head",
      line: "And here's your trip taking shape — every piece I hold, kept in order and always saved.",
      place: "below",
    },
    {
      // The showcase moment: the live language flip. Tapping the globe mirrors the
      // ENTIRE interface to Arabic RTL in place — "the engine is real," not nine
      // polished markets (the demo language call).
      route: "/itinerary",
      selector: ".tw-locale__btn",
      line: "One last thing — I speak your language. Watch this.",
      place: "below",
      setLocale: "ar",
    },
    {
      // The close, now in Arabic on the mirrored UI.
      route: "/itinerary",
      selector: ".it-head",
      line: "أينما ذهبت، أنا معك — لنسافر بإتقان.",
      place: "below",
      lang: "ar",
      rtl: true,
    },
  ],
};

export const TOURS: Record<string, TourDef> = { safari: SAFARI_TOUR };
