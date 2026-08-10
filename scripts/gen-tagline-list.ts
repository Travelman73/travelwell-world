/**
 * Export the brand-slogan family in ACTIVE USE on the live site.
 *
 * Written for the trademark file: the attorney's question is whether a
 * registration protects the whole "If It's [X]… TravelWell" construction or only
 * the single filed phrase, and the evidence that question needs is a documented
 * list of the family actually in commerce. Generated from the live taxonomy, so
 * it can't drift from what the site renders.
 *
 * Run:
 *   ./node_modules/.bin/esbuild scripts/gen-tagline-list.ts --bundle \
 *     --platform=node --format=esm --outfile=scratchpad/tag.mjs && node scratchpad/tag.mjs
 * Writes docs/tagline-family.md.
 */
import { writeFileSync } from "node:fs";
import { SIS, SI_TAGLINE_SUBJECT, MASTER_TAGLINE_SUBJECT, SAFER_TAGLINE_SUBJECT, taglineSubject } from "../src/data/taxonomy";

const MARK = "TravelWell";
const line = (subject: string) => `If It's ${subject}… ${MARK}™`;

const stamp = process.env.TAGLINE_DATE || new Date().toISOString().slice(0, 10);

const live = SIS.filter((s) => s.status === "live");
const preview = SIS.filter((s) => s.status !== "live");
const row = (s: { id: string; name: string; status: string; data?: unknown }) => {
  const subject = taglineSubject(s as never);
  const src = SI_TAGLINE_SUBJECT[s.id] ? "locked map" : "falls back to full name";
  return `| \`${s.id}\` | ${s.name} | ${subject} | ${line(subject)} | ${src} |`;
};

const md = `# The TravelWell slogan family — in active use

*Generated from the live taxonomy by \`scripts/gen-tagline-list.ts\` on ${stamp}.
Do not hand-edit — regenerate.*

**The construction:** \`If It's [X]… TravelWell™\`

The subject \`[X]\` varies; the closing brand mark never does. The mark is one
word, always, and the line is English-only in every market — it is a coined brand
line, not copy, so it is not translated (the same rule as the "-Well" family).

Rendered by one component (\`Tagline\` in \`src/components/ui/primitives.tsx\`), so
every instance on the site is the same construction by build, not by convention.

## Summary

| | |
|---|---|
| Distinct variants in active use | **${2 + SIS.length}** |
| — master | 1 |
| — category (Safer Informed Travel) | 1 |
| — special-interest subjects | ${SIS.length} (${live.length} on live interests, ${preview.length} on preview interests) |
| Closing mark, every variant | \`${MARK}™\` |

## 1. The master variant

> **${line(MASTER_TAGLINE_SUBJECT)}**

In use site-wide: the home page, the mega-menu feature panel, the site footer,
and the Special-Interests master page.

## 2. The category variant

> **${line(SAFER_TAGLINE_SUBJECT)}**

The Safer-Informed positioning line. Also carried in the concierge's own voice
instructions, so it is used in conversation as well as in page copy.

## 3. The special-interest variants

One per interest, rendered on that interest's page and on its card on the home
page. **Live interests** are in commerce now; **preview interests** render the
line on a published page that is not yet bookable.

### Live interests (${live.length})

| id | Interest | Subject \`[X]\` | Rendered line | Subject source |
|---|---|---|---|---|
${live.map(row).join("\n")}

### Preview interests (${preview.length})

| id | Interest | Subject \`[X]\` | Rendered line | Subject source |
|---|---|---|---|---|
${preview.map(row).join("\n")}

## Notes for the file

- **The mark is one word in every variant.** A two-word "Travel Well" is not
  used as the brand anywhere on the site.
- **Some subjects are deliberately not the interest's full name** — \`romance\`
  renders "Love", \`ski\` renders "Winter", \`liveaboard\` renders "Liveaboards".
  Those short forms are the ones in commerce, and they are the ones this list
  records.
- **Subjects marked "falls back to full name"** have no short form set yet; the
  line still renders, using the interest's full name as \`[X]\`.
- The count grows as the interest board grows. Regenerate before filing.
`;

writeFileSync("docs/tagline-family.md", md);
console.log(`Wrote docs/tagline-family.md — ${2 + SIS.length} variants (${live.length} live SIs, ${preview.length} preview SIs)`);
