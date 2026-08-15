#!/usr/bin/env node
/**
 * The mark is ONE WORD. This fails the build if the two-word form ships.
 *
 *   npm run build && npm run check:brand
 *
 * WHY IT SCANS `dist/` RATHER THAN `src/`. The two-word pun was retired on
 * 2026-08-09, and the retirement is documented in source comments that quote it —
 * so a source scan has to special-case its own documentation, and a check with
 * exceptions is a check that erodes. The built output has comments stripped and
 * every template, translation, meta tag and JSON-LD field already inlined, so it
 * is both stricter and simpler: if the string is in `dist/`, a reader can see it.
 *
 * David's reasoning, 2026-08-04, and the last line is why this exists at all:
 *   · A brand with two forms doesn't have one.
 *   · The filing protects the CONSTRUCTION — "If It's [anything]… TravelWell." —
 *     so every two-word instance is a variant of our own mark on our own site,
 *     working against a filing that has to show consistent use in commerce.
 *   · His voice dictation produces "Travel Well" when he says "TravelWell", so a
 *     page carrying both forms makes it impossible for anyone downstream to tell
 *     deliberate poetry from a transcription error. One form removes the
 *     guesswork permanently.
 *
 * He also asked specifically that the sweep cover metadata and structured data,
 * not just visible copy — page titles, meta descriptions, og: tags, alt text,
 * error strings, and above all the JSON-LD publisher/brand/Organization.name,
 * "because structured data is the machine-readable version of the mark, so it is
 * what an AI cites when it names us." Scanning the built output covers all of
 * those in one pass, including the ones no visible-copy review would look at.
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const ROOT = "dist";
// "travel well" NOT followed by another letter — so "travel wellness" is fine
// and "Travel Well." is not. Apostrophes and punctuation after are still caught.
const TWO_WORD = /travel\s+well(?![a-z])/i;
const SCAN = /\.(html|js|css|json|webmanifest|txt|xml|svg)$/i;

function walk(dir) {
  const out = [];
  for (const entry of readdirSync(dir)) {
    const p = join(dir, entry);
    if (statSync(p).isDirectory()) out.push(...walk(p));
    else if (SCAN.test(p)) out.push(p);
  }
  return out;
}

let files;
try {
  files = walk(ROOT);
} catch {
  console.error(`✗ No ${ROOT}/ to scan. Run \`npm run build\` first — this checks the SHIPPED output, not the source.`);
  process.exit(2);
}

const hits = [];
for (const f of files) {
  const text = readFileSync(f, "utf8");
  for (const [i, line] of text.split("\n").entries()) {
    const m = TWO_WORD.exec(line);
    if (!m) continue;
    const at = Math.max(0, m.index - 60);
    hits.push({ file: f, line: i + 1, excerpt: line.slice(at, m.index + 80).trim() });
  }
}

if (hits.length) {
  console.error(`\n✗ THE TWO-WORD FORM SHIPS — ${hits.length} occurrence(s) in the built output:\n`);
  for (const h of hits.slice(0, 20)) console.error(`   ${h.file}:${h.line}\n      …${h.excerpt}…`);
  if (hits.length > 20) console.error(`   …and ${hits.length - 20} more`);
  console.error(`
The mark is ONE WORD — TravelWell. A two-word instance is a variant of our own
mark on our own site, and for a filing resting on consistent use in commerce that
works against us. Fix it at the source, not here.

If the line is deliberate poetry, it still closes on the one-word mark: keep the
image ("The wild is calling.") and let the mark end it.`);
  process.exit(1);
}

console.log(`✓ One form only — scanned ${files.length} built files, no two-word occurrences.`);
