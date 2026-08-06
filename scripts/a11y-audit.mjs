/**
 * TravelWell.World — automated accessibility gate (WCAG 2.1 A/AA).
 *
 * Canon (CLAUDE.md): "Checkable, not a vibe — automated a11y checks in the build
 * so a regression fails the build, same discipline as the dossier QC gate." This
 * loads the built app and runs axe-core across the key routes; ANY WCAG 2 A/AA
 * violation exits non-zero so CI fails.
 *
 * Run against a served build:
 *   npm run build && npm run preview &   # serves http://localhost:4173
 *   npm run a11y                         # scans it, exits 1 on any violation
 *
 * Env:
 *   A11Y_BASE       base URL (default http://localhost:4173)
 *   PW_EXECUTABLE   Chromium executable path (for sandboxes with a prebuilt browser)
 */
import { chromium } from "playwright";
import AxeBuilder from "@axe-core/playwright";

const BASE = process.env.A11Y_BASE || "http://localhost:4173";
const TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"];

// The demo-critical routes plus a spread of page shapes. Add routes here as pages ship.
const ROUTES = [
  "/", "/special-interests", "/regions", "/region/05A",
  "/destination/masai-mara", "/destination/zermatt-switzerland",
  "/itinerary", "/flights", "/wells-surface", "/luxury",
  "/guides", "/providers", "/about", "/first-aid-kit",
];

const browser = await chromium.launch({
  executablePath: process.env.PW_EXECUTABLE || undefined,
  args: ["--no-sandbox"],
});
const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
// Skip the first-visit cookie banner so it doesn't mask the page under test.
await context.addInitScript(() => { try { localStorage.setItem("tww:consent", "1"); } catch {} });
const page = await context.newPage();

let total = 0;
const byRule = {};
for (const route of ROUTES) {
  try {
    await page.goto(BASE + route, { waitUntil: "domcontentloaded", timeout: 20000 });
  } catch {
    console.error(`  ✗ could not load ${route}`);
    total += 1;
    continue;
  }
  await page.waitForTimeout(700); // let React settle / lazy chunk mount
  const { violations } = await new AxeBuilder({ page }).withTags(TAGS).analyze();
  const count = violations.reduce((n, v) => n + v.nodes.length, 0);
  total += count;
  if (count === 0) {
    console.log(`  ✓ ${route}`);
  } else {
    console.log(`  ✗ ${route} — ${count} violation node(s)`);
    for (const v of violations) {
      byRule[v.id] = (byRule[v.id] || 0) + v.nodes.length;
      console.log(`      [${v.impact}] ${v.id} (${v.nodes.length}) — ${v.help}`);
      v.nodes.slice(0, 3).forEach((n) => console.log(`         ${JSON.stringify(n.target)}`));
    }
  }
}

await browser.close();

console.log("\n────────────────────────────────────────");
if (total === 0) {
  console.log(`✅ a11y gate PASSED — ${ROUTES.length} routes, 0 WCAG 2 A/AA violations`);
  process.exit(0);
} else {
  console.log(`❌ a11y gate FAILED — ${total} violation node(s) across ${ROUTES.length} routes`);
  for (const [rule, n] of Object.entries(byRule).sort((a, b) => b[1] - a[1])) console.log(`   ${rule}: ${n}`);
  process.exit(1);
}
