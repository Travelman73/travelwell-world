/**
 * NEVER PROMISE "SAFE". Locked canon, and until now nothing enforced it.
 *
 * We keep travellers INFORMED so they can be as safe as possible. We do not
 * promise safety — that is an outcome nobody controls, and a guarantee we cannot
 * stand behind. Travel-safety content also sits in the highest-scrutiny category
 * search engines have, and our FAQ answers auto-emit FAQPage structured data, so
 * a promise doesn't just appear on a page — it ships as a machine-readable claim.
 *
 * David locked the rule on 2026-08-02 and swept the research library for it,
 * finding 17 across 152 rows. Our own hand-written data had never been swept,
 * because the rule reached the library and not this repo. It carried ELEVEN:
 * three destination notes he spotted, and eight country-level summaries he did
 * not — the worse set, because a country summary renders on the Safety Card of
 * every destination in that country. "Switzerland is very safe" appeared under
 * Zermatt and St. Moritz both.
 *
 * THE FIX IS NEVER TO DELETE THE QUESTION. People search "is X safe" and that
 * question deserves an answer; it just gets the real risk instead of a promise.
 * For the Alps that is the mountain, not crime: "an orderly Alpine resort; the
 * practical risk to plan for is the mountain — check the avalanche bulletin
 * daily."
 *
 * WHAT THIS DOES NOT FLAG, deliberately: "safer", "safety", "keep valuables
 * safe", "safe-deposit". The offence is asserting that a PLACE is safe, not the
 * word itself — a matcher that fires on every "safe" would be muted within a
 * week, and a muted check is worse than none.
 */
export interface SafetyLanguageHit {
  match: string;
  context: string;
}

/**
 * Assertions that a place IS safe, in the forms that actually get written:
 *   "Austria is very safe" · "the resort is safe" · "the beaches are safe"
 *   "remains perfectly safe" · "feels completely safe" · "there's no danger"
 * The subject-agnostic verb+adverb+`safe` shape catches paraphrases too, which a
 * literal list of phrases would miss.
 */
const PROMISE =
  /\b(?:is|are|was|were|remains?|stays?|feels?|seems?)\s+(?:\w+\s+){0,2}?safe\b(?!\w)|(?:perfectly|completely|totally|entirely|absolutely|100%)\s+safe\b|no\s+danger\b|nothing\s+to\s+worry\s+about\b/gi;

/** Every safety promise in a blob of text, with enough context to find it. */
export function findSafetyPromises(text: unknown): SafetyLanguageHit[] {
  if (typeof text !== "string" || !text) return [];
  const hits: SafetyLanguageHit[] = [];
  for (const m of text.matchAll(PROMISE)) {
    const at = m.index ?? 0;
    hits.push({
      match: m[0].trim(),
      context: text.slice(Math.max(0, at - 55), at + m[0].length + 45).trim(),
    });
  }
  return hits;
}

/**
 * Walk a dossier's safety block and FAQ answers. Both render, and the FAQ also
 * emits structured data — so a promise there is published twice, once for a
 * reader and once for a machine that will quote it back.
 */
export function checkSafetyLanguage(
  at: string,
  data: unknown,
  out: { errs: string[]; warns: string[] },
): void {
  if (!data || typeof data !== "object") return;
  const d = data as { safety?: Record<string, unknown>; faq?: Array<{ q?: unknown; a?: unknown }> };

  for (const [field, value] of Object.entries(d.safety ?? {})) {
    for (const hit of findSafetyPromises(value)) {
      out.errs.push(`${at}: safety.${field} promises safety — "${hit.match}". Describe the real risk instead. …${hit.context}…`);
    }
  }
  // Only the ANSWER. A question may — and should — ask whether somewhere is safe;
  // that is what people search for, and removing it loses the traffic and the
  // chance to answer well.
  for (const [i, f] of (d.faq ?? []).entries()) {
    for (const hit of findSafetyPromises(f?.a)) {
      out.errs.push(`${at}: faq #${i + 1} answer promises safety — "${hit.match}". Keep the question, answer it with the real risk. …${hit.context}…`);
    }
  }
}
