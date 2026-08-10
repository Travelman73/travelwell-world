import { Tagline } from "@/components/ui/primitives";
import { SAFER_TAGLINE_SUBJECT } from "@/data/taxonomy";

/**
 * The motto, near the top of EVERY page.
 *
 * This is trademark evidence before it is branding: the attorney wants the marks
 * in visible, repeated use, and a mark sitting only in a footer is weaker
 * evidence than one at the top (David, 2026-08-10 — his call is Monday 8:15).
 *
 * David's one design constraint, kept: it must NOT compete with the nav, the
 * Atlas entry point or the Emergency button. It's a line that says who we are,
 * not a call to action — so it sits in its own quiet band directly under the
 * header, reads at a calm weight, and is deliberately unmissable rather than
 * loud. It doesn't stick; only the header does, so it never eats screen while
 * someone is working.
 *
 * The wording comes from the same `Tagline` primitive as every other instance,
 * which is the point: exact and identical everywhere by build, not by
 * convention. The ellipsis and the closing full stop are part of the mark.
 */
export function MottoBand() {
  return (
    <div className="tw-motto">
      <Tagline subject={SAFER_TAGLINE_SUBJECT} className="tw-motto__line" />
    </div>
  );
}
