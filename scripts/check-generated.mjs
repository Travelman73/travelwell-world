#!/usr/bin/env node
/**
 * Assert every generated file matches what its generator currently produces.
 *
 *   npm run check:generated        (also the pre-commit hook)
 *
 * WHY. Half this repo's important artifacts are generated — the catalog seed
 * migrations, the ground-truth fact sheet, the slogan family, the advisory link
 * list and payload, the sitemap. Nothing points at them from the code, so a
 * source edit that should have regenerated one leaves it silently stale, and a
 * stale generated file is worse than a missing one: it looks authoritative and
 * carries a known-wrong value.
 *
 * That is not hypothetical. In two days it happened twice:
 *   · The slogan family said 9 live interests after `wine` dropped to preview.
 *     That file is regenerated before a trademark filing, so the stale count is
 *     the one that reaches the attorney.
 *   · The advisory link list still carried gov.uk/foreign-travel-advice/the-bahamas
 *     two days after we'd found that URL 404s and fixed the slug at the source.
 *     That file is what a person opens to check links by hand.
 *
 * Both were caught by running every generator and asking whether the repo
 * changed — never by remembering which files a given edit touches. Nobody
 * reliably remembers that, which is the argument for the check rather than the
 * habit.
 */
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";

const GENERATORS = [
  ["gen:catalog", "the seed migrations (0003, 0004, 0005, 0007)"],
  ["gen:sitemap", "public/sitemap.xml"],
  ["gen:ground-truth", "docs/ground-truth.md + docs/reset-facts.txt"],
  ["gen:taglines", "docs/tagline-family.md"],
  ["gen:advisory-links", "docs/advisory-links.md"],
  ["gen:advisory-payload", "docs/advisory-countries.json + migration 0015"],
];

// Everything a generator owns. Listed explicitly so an unrelated dirty file
// never fails the check — this asserts one thing and says which.
const OWNED = [
  "supabase/migrations/0003_seed_si_activities.sql",
  "supabase/migrations/0004_seed_providers_subregions.sql",
  "supabase/migrations/0005_seed_destinations_guides.sql",
  "supabase/migrations/0007_seed_local_signals.sql",
  "supabase/migrations/0015_advisory_schedule.sql",
  "public/sitemap.xml",
  "docs/ground-truth.md",
  // The paste block goes stale the same way everything else does — and it is the
  // one artifact whose whole purpose is being current somewhere the repo can't
  // be read, so an unguarded copy would be the worst of the set.
  "docs/reset-facts.txt",
  "docs/tagline-family.md",
  "docs/advisory-links.md",
  "docs/advisory-countries.json",
];

const git = (...args) => execFileSync("git", args, { encoding: "utf8" });

// THE INVARIANT: what you are about to commit must equal what the generators
// produce. Two distinct ways that breaks, and BOTH have to be caught — testing
// found each of them by trying to fool the check rather than by reasoning about
// it, which is the only way these get found:
//
//   1. The file's content CHANGED when the generators ran. Whatever was there
//      was not what the generators produce — a source edit that was never
//      regenerated, or a hand-edit to a "do not hand-edit" file. Regeneration
//      silently repairs the second case, so comparing against git afterwards
//      sees nothing wrong. Only a before/after content hash catches it.
//   2. The file now differs from the INDEX. It is correct on disk but the
//      commit doesn't include it — the classic "staged the source, forgot the
//      generated output."
//
// The first version of this checked neither properly: it snapshotted which
// files were already dirty and excluded them, so a hand-edited file was
// excluded and passed. A green tick over the exact failure it exists to catch —
// the same bug the advisory link checker had, found the same way.
const hash = (f) => {
  try { return createHash("sha256").update(readFileSync(f)).digest("hex"); }
  catch { return "«missing»"; }
};
const before = Object.fromEntries(OWNED.map((f) => [f, hash(f)]));

for (const [script, what] of GENERATORS) {
  try {
    execFileSync("npm", ["run", "--silent", script], { stdio: "pipe" });
  } catch (err) {
    console.error(`\n✗ Generator failed: npm run ${script}  (${what})`);
    console.error(String(err.stdout ?? "") + String(err.stderr ?? ""));
    process.exit(1);
  }
}

const rewritten = OWNED.filter((f) => hash(f) !== before[f]);
const unstaged = git("diff", "--name-only", "--", ...OWNED).split("\n").filter(Boolean);
const stale = [...new Set([...rewritten, ...unstaged])].sort();

if (stale.length) {
  console.error(`\n✗ STALE GENERATED FILES — ${stale.length} file(s) don't match their source:\n`);
  for (const f of stale) {
    const why = rewritten.includes(f)
      ? (unstaged.includes(f) ? "was out of date — regenerated, now needs staging" : "was hand-edited or stale — regenerated in place")
      : "correct on disk but not staged";
    console.error(`   ${f}\n      ${why}`);
  }
  console.error(`
All of them have been regenerated in your working tree. Review and stage them
with the change that caused it:

   git diff ${stale.join(" ")}
   git add ${stale.join(" ")}

Committing a source edit without its generated output is how a fact sheet, a
seed migration or a link list ends up authoritative and wrong. If a file was
hand-edited, the edit is gone — change the generator or the source instead.`);
  process.exit(1);
}

console.log(`✓ All ${OWNED.length} generated files match their source.`);
