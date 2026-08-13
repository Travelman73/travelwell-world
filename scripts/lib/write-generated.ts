/**
 * Write a generated file, but ONLY when its substance changed.
 *
 * WHY THIS EXISTS. Two of our generators stamp today's date into their header.
 * That makes them non-idempotent: run the same generator twice on different days
 * with identical inputs and you get two different files. Harmless on its own —
 * fatal for the pre-commit check, which asserts "regenerate everything and the
 * repo should be unchanged." A date stamp breaks that invariant every midnight,
 * the check fails for no reason, and a check that cries wolf is a check people
 * pass with --no-verify. Then it catches nothing at all.
 *
 * So: compare with the volatile parts masked out. If only the date differs, the
 * file is left ALONE and keeps its old stamp.
 *
 * That also makes the stamp mean something better than it did. It now reads as
 * "the date this content last changed" rather than "the last time somebody
 * happened to run the command" — which is the more useful fact, and the one you
 * actually want on a document that goes to a trademark attorney.
 */
import { readFileSync, writeFileSync } from "node:fs";

export function writeGenerated(
  path: string,
  content: string,
  volatile: RegExp[] = [],
): "written" | "unchanged" {
  const mask = (s: string) => volatile.reduce((acc, re) => acc.replace(re, "«volatile»"), s);
  let prev: string | null = null;
  try { prev = readFileSync(path, "utf8"); } catch { /* new file — fall through and write */ }

  if (prev !== null && mask(prev) === mask(content)) return "unchanged";
  writeFileSync(path, content);
  return "written";
}

/** The date-stamp shapes our generators use. Kept here so they can't drift apart. */
export const VOLATILE_DATE = [
  /\d{4}-\d{2}-\d{2}/g,   // 2026-08-13
];
