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
    const belt = createLiveKitBelt({
      livekitUrl: config.livekitUrl,
      tokenEndpoint: config.tokenEndpoint,
      mouth, ears,
    });
    return belt;
  }
  return createBrowserBelt(mouth, ears);
}
