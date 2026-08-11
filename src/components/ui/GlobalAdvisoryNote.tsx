import { Icon } from "@/lib/icons";
import { activeGlobalAdvisories } from "@/data/advisory-global";

/**
 * A worldwide advisory, on every destination's safety card.
 *
 * Deliberately NOT merged into the country level. It doesn't change Kenya's
 * number, and pretending it did would misreport both. It sits above the card as
 * its own thing, clearly labelled as worldwide and clearly attributed to the
 * government that issued it — a caution the US issues to US citizens is exactly
 * that, not a TravelWell verdict on the world.
 *
 * Renders nothing when no global advisory is in force, which is the normal state.
 */
export function GlobalAdvisoryNote() {
  const advisories = activeGlobalAdvisories();
  if (!advisories.length) return null;
  return (
    <>
      {advisories.map((a) => (
        <details className="gadv" key={a.id}>
          <summary className="gadv__sum">
            <span className="gadv__ic"><Icon name="info" small /></span>
            <span>
              <b>{a.issuer} {a.title}</b> — in force worldwide, not specific to this destination
            </span>
          </summary>
          <div className="gadv__body">
            <p className="gadv__quote">&ldquo;{a.text}&rdquo;</p>
            <p className="gadv__meta">
              Issued {a.issued} · confirmed still current by us {a.verified} ·{" "}
              <a href={a.url} target="_blank" rel="noopener noreferrer">read it in full <Icon name="arrow" small /></a>
            </p>
          </div>
        </details>
      ))}
    </>
  );
}
