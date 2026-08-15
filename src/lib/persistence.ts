/**
 * Ask the browser to keep our offline cache — the answer to the eviction risk.
 *
 * THE PROBLEM (David's app plan §5, "the one thing that matters more than any of
 * this"): the service worker pre-caches the app shell, the safety card and the
 * emergency numbers, so they render with no signal. But cached storage is
 * EVICTABLE. A traveller who installs, doesn't open it for three weeks, and then
 * needs it in a dead zone may find the cache gone. For a safety feature that is
 * not acceptable, and his instinct to want belt-and-braces was right.
 *
 * THE PART HE DIDN'T KNOW EXISTS: browsers expose `navigator.storage.persist()`,
 * which asks for storage that is exempt from automatic eviction. Granted, the
 * data survives storage pressure and disuse until the user deletes it
 * deliberately. We were never asking. This asks.
 *
 * HOW BROWSERS DECIDE — worth knowing, because it shapes when we call it:
 *  · Chrome and Edge grant it silently on engagement signals — installed as a
 *    PWA, bookmarked, high site-engagement score. No prompt.
 *  · Firefox prompts the user.
 *  · Safari grants it to installed home-screen apps and applies its own
 *    seven-day eviction rule to sites the user hasn't engaged with.
 *
 * So it is most likely to be granted for exactly the traveller we care about —
 * the one who installed TravelWell to their home screen. Asking early and
 * repeatedly gets refused; asking once, after the app is actually in use, is the
 * shape that works.
 *
 * THIS DOES NOT REPLACE THE DOWNLOADABLE FALLBACK David asked about. It raises
 * the floor. A saved card the traveller holds — a share-sheet export or a wallet
 * pass — is independent of any browser policy, and it is still worth building.
 * This is the cheap half that should have been there already.
 */

export type PersistenceState =
  | { supported: false }
  | { supported: true; persisted: boolean; asked: boolean };

let state: PersistenceState = { supported: false };

/** What we know right now — for a diagnostic surface, or a caveat in the UI. */
export const persistenceState = (): PersistenceState => state;

/**
 * Ask once. Safe to call on every load: if the browser already granted it,
 * `persisted()` returns true and we don't ask again.
 */
export async function requestPersistentStorage(): Promise<PersistenceState> {
  if (typeof navigator === "undefined" || !navigator.storage?.persist) {
    state = { supported: false };
    return state;
  }
  try {
    // Already granted on a previous visit — nothing to ask for.
    const already = await navigator.storage.persisted();
    if (already) {
      state = { supported: true, persisted: true, asked: false };
      return state;
    }
    const granted = await navigator.storage.persist();
    state = { supported: true, persisted: granted, asked: true };
    if (!granted) {
      // Not an error and not worth alarming anyone: most browsers grant this
      // once the site has real engagement, so a "no" on an early visit is
      // expected and the next visit may well succeed.
      console.info("[tww] persistent storage not granted yet — the offline safety cache may be evicted after long disuse.");
    }
    return state;
  } catch {
    state = { supported: false };
    return state;
  }
}

/**
 * Roughly how much we're holding, when the browser will say. Useful for the
 * airplane-mode check in David's device matrix: it answers "is the cache
 * actually there" without unplugging anything.
 */
export async function storageEstimate(): Promise<{ usedKB: number; quotaKB: number } | null> {
  if (typeof navigator === "undefined" || !navigator.storage?.estimate) return null;
  try {
    const { usage = 0, quota = 0 } = await navigator.storage.estimate();
    return { usedKB: Math.round(usage / 1024), quotaKB: Math.round(quota / 1024) };
  } catch {
    return null;
  }
}
