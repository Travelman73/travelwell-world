/**
 * TravelWell.World — the "mouth" adapter (Atlas speaking back).
 *
 * VOICE = ADAPTER SEAM (David's locked rule): the app talks to this small
 * interface — speak() / stopSpeaking() — never to a vendor directly. Today it's
 * the browser's built-in speech synthesis: free, on-device, no vendor, no key.
 * Tomorrow a premium TTS (Cartesia Sonic-3, ElevenLabs…) drops in BEHIND this
 * same interface and Atlas + the UI never change. That's the vaporware armor —
 * we're never welded to a mouth vendor.
 *
 * The on-screen text is always the guaranteed fallback (WCAG AA canon): the
 * voice is for those who can't read the screen; the text for those who can't
 * hear the voice.
 */
const LANG_TAG: Record<string, string> = {
  en: "en-US", es: "es-ES", ar: "ar-SA", zh: "zh-CN", fr: "fr-FR",
  de: "de-DE", pt: "pt-PT", ja: "ja-JP", ko: "ko-KR",
};

export const speechOutputSupported = () =>
  typeof window !== "undefined" && "speechSynthesis" in window;

// Speaking state — so the UI can show a tiny "Atlas is speaking" signal while
// the voice plays. Kept behind this adapter (part of the seam): whatever TTS
// vendor sits here tomorrow, the UI just subscribes to on/off and never learns
// who's talking. Simple pub/sub — no dependency, notify only on change.
let speaking = false;
const speakingListeners = new Set<(s: boolean) => void>();
function setSpeaking(next: boolean) {
  if (next === speaking) return;
  speaking = next;
  speakingListeners.forEach((l) => l(next));
}
/** Subscribe to speaking on/off; returns an unsubscribe. */
export function subscribeSpeaking(cb: (s: boolean) => void) {
  speakingListeners.add(cb);
  return () => { speakingListeners.delete(cb); };
}
export const isSpeaking = () => speaking;

/** Speak text aloud in the traveler's language. Cancels any in-flight speech. */
export function speak(text: string, locale = "en") {
  try {
    const synth = window.speechSynthesis;
    if (!synth || !text) return;
    synth.cancel();
    setSpeaking(false); // the cancel above may not fire onend; reset explicitly
    const u = new SpeechSynthesisUtterance(text);
    u.lang = LANG_TAG[locale] || "en-US";
    u.rate = 1;
    u.pitch = 1;
    u.volume = 1;
    u.onstart = () => setSpeaking(true);
    u.onend = () => setSpeaking(false);
    u.onerror = () => setSpeaking(false);
    synth.speak(u);
  } catch {
    /* no speech synthesis available — the on-screen text carries it */
  }
}

export function stopSpeaking() {
  try { window.speechSynthesis?.cancel(); } catch { /* noop */ }
  setSpeaking(false);
}
