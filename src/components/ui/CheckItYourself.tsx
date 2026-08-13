import { Icon } from "@/lib/icons";
import { advisoryLinks } from "@/data/advisory-sources";

/**
 * "Don't take our word for it" — §7B.
 *
 * We publish the date we verified, name the sources, hand over the link, and say
 * plainly to read the advisory before going. That last part is the point: our
 * card is a summary with a date on it, and the government page is the live truth.
 * Telling a traveler to check it themselves is the Safer-Informed promise doing
 * its job, not a disclaimer.
 *
 * Links are DEEP — that country's page on each source, not the source's homepage.
 * Where we have no confirmed slug the link falls back to the source's index and
 * SAYS so, because a link that 404s reads as "we checked" when we didn't.
 */
export function CheckItYourself({
  country, iso, verified, unverified, reported,
}: { country: string; iso: string | null; verified?: string; unverified?: boolean; reported?: boolean }) {
  const links = advisoryLinks(country, iso);
  return (
    <section className="chk" aria-labelledby="chk-h">
      <h4 className="chk__h" id="chk-h">
        <Icon name="shield" small /> Check it yourself before you go
      </h4>
      <p className="chk__lead">
        {unverified
          ? <>We don&rsquo;t have a verified advisory for {country} on file yet. Read the official one before you book.</>
          /* A reported reading is acted on but not claimed as verified — saying
             "verified on the date shown" with no date would be the worse lie. */
          : reported
          ? <>Our reading of {country} comes from a report we haven&rsquo;t independently confirmed against an official advisory. Read the official one before you book.</>
          : <>Our reading of {country} was verified {verified ? <b>{verified}</b> : "on the date shown"}. Advisories change between our checks &mdash; read the official one before you travel.</>}
      </p>
      <ul className="chk__list">
        {links.map((l) => (
          <li key={l.source.id}>
            <a href={l.href} target="_blank" rel="noopener noreferrer">
              {l.source.name} <Icon name="arrow" small />
            </a>
            <span className="chk__issuer">{l.source.issuer}</span>
            {!l.deep && <span className="chk__note">no country page linked &mdash; opens their index</span>}
          </li>
        ))}
      </ul>
      <p className="chk__foot">
        If your government isn&rsquo;t listed, check its advisory too &mdash; levels differ between countries for the same place.
      </p>
    </section>
  );
}
