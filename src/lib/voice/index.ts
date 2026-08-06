/**
 * Voice seam factory — the ONE place a slot swaps (David's "one-line change").
 *
 *   createVoiceSession()                              → browser belt (today)
 *   createVoiceSession({ transport: "livekit", … })   → LiveKit belt (when wired)
 *
 * The app imports only from here and talks to the returned VoiceBelt — it never
 * imports a vendor. Swapping mouth "browser"→"cartesia" or ears "browser"→
 * "deepgram", or the belt "browser"→"livekit", is a config change here, nothing
 * in the UI moves. Anything not yet wired degrades to the browser slot (unless
 * degradeToBrowser:false), so the traveler is never left mute.
 */
import type { VoiceBelt, VoiceConfig, Mouth, Ears } from "./types";
import { browserMouth, browserEars } from "./browser";
import { cartesiaMouth } from "./cartesia";
import { elevenLabsMouth } from "./elevenlabs";
import { deepgramEars } from "./deepgram";
import { createLiveKitBelt } from "./livekit";
import { speak as webSpeak, stopSpeaking as webStop, markSpeaking } from "../voice";

export * from "./types";

const PREMIUM_MOUTHS: Record<string, Mouth> = { cartesia: cartesiaMouth, elevenlabs: elevenLabsMouth };

/** Default mouth from env (VITE_TWW_MOUTH=cartesia|elevenlabs|browser), so the
 *  Cartesia↔ElevenLabs A/B is a one-line flip on our real lines — no code edit. */
const ENV_MOUTH = (import.meta.env?.VITE_TWW_MOUTH as VoiceConfig["mouth"]) || undefined;

function pickMouth(want: VoiceConfig["mouth"], degrade: boolean): Mouth {
  const choice = want ?? ENV_MOUTH;
  const premium = choice ? PREMIUM_MOUTHS[choice] : undefined;
  if (premium && premium.supported()) return premium;
  if (premium && !degrade) return premium; // caller opted out of fallback → hand back the (unwired) premium slot
  return browserMouth;
}
function pickEars(want: VoiceConfig["ears"], degrade: boolean): Ears {
  if (want === "deepgram" && deepgramEars.supported()) return deepgramEars;
  if (want === "deepgram" && !degrade) return deepgramEars;
  return browserEars;
}

/** The browser belt: direct Web Speech, no WebRTC. Always available. */
function createBrowserBelt(mouth: Mouth, ears: Ears): VoiceBelt {
  let connected = false;
  return {
    transport: "browser",
    get connected() { return connected; },
    mouth, ears,
    async connect() { connected = true; },   // nothing to negotiate
    disconnect() { connected = false; ears.stop(); mouth.stop(); },
  };
}

export function createVoiceSession(config: VoiceConfig = {}): VoiceBelt {
  const degrade = config.degradeToBrowser !== false;
  const mouth = pickMouth(config.mouth, degrade);
  const ears = pickEars(config.ears, degrade);

  if (config.transport === "livekit") {
    // On this belt the agent supplies both slots (it transcribes and speaks
    // server-side), so only pass mouth/ears through when the caller overrode them.
    const belt = createLiveKitBelt({
      livekitUrl: config.livekitUrl,
      tokenEndpoint: config.tokenEndpoint,
      getToken: config.getToken,
      room: config.room,
      onAgentText: config.onAgentText,
      ...(config.mouth ? { mouth } : {}),
      ...(config.ears ? { ears } : {}),
    });
    return belt;
  }
  return createBrowserBelt(mouth, ears);
}

/* ── Atlas's voice, dispatched through the seam ────────────────────────────
 * The Concierge calls these instead of a vendor. The mouth is chosen by
 * VITE_TWW_MOUTH (browser | cartesia | elevenlabs) and ALWAYS degrades to the
 * browser, so with the premium slots still stubbed this is byte-identical to
 * today's behavior — the env flag just arms the swap. Both paths drive the
 * shared "Atlas is speaking" signal (subscribeSpeaking), so the UI never changes. */
let activeMouth: Mouth | null = null;

export async function atlasSpeak(text: string, locale = "en"): Promise<void> {
  const mouth = pickMouth(undefined, true); // env-configured, browser-degrading
  if (mouth === browserMouth) { activeMouth = null; webSpeak(text, locale); return; } // native signal via utterance events
  activeMouth = mouth;
  try {
    markSpeaking(true);
    await mouth.speak(text, { locale, onEnd: () => markSpeaking(false) });
  } catch {
    activeMouth = null;           // premium mouth failed → never leave Atlas mute
    webSpeak(text, locale);
  } finally {
    if (activeMouth === mouth) markSpeaking(false);
  }
}

export function atlasStopSpeaking(): void {
  if (activeMouth && activeMouth !== browserMouth) { try { activeMouth.stop(); } catch { /* noop */ } }
  activeMouth = null;
  webStop();
  markSpeaking(false);
}

/** Which mouth Atlas will use right now — for a tiny dev/status readout. */
export const activeMouthName = (): string => pickMouth(undefined, true).name;
