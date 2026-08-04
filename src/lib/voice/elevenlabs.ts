/**
 * MOUTH slot — ElevenLabs TTS. DROP-IN STUB (spike), same interface as Cartesia.
 *
 * The fidelity swap-in David wants to A/B by ear: Cartesia wins on *latency*
 * (fastest first-audio, so Atlas never reads as "I thought this was AI"),
 * ElevenLabs wins on *warmth/fidelity*. Same `Mouth` interface, so choosing
 * between them on our real lines is a one-line/env flip in the factory — no UI
 * moves. Pick by ear (see docs), then set the default.
 *
 * Wiring (the real build): stream text to ElevenLabs' streaming TTS via OUR edge
 * proxy / the LiveKit agent, receive audio chunks, play through an AudioContext
 * (or publish the track into the LiveKit room). The ELEVENLABS_API_KEY stays
 * SERVER-SIDE — the browser calls our proxy, never ElevenLabs directly (the
 * adapter-seam rule: the brain and the keys stay ours).
 *
 * Until wired, supported()=false so the factory degrades to browserMouth — the
 * traveler is never left mute, and the on-screen text is always the fallback.
 */
import type { Mouth } from "./types";

export const elevenLabsMouth: Mouth = {
  name: "elevenlabs-flash",
  supported: () => false, // flip true once the streaming proxy + audio playback are wired
  speak() { throw new Error("elevenLabsMouth: not wired yet (spike stub — see wiring notes)"); },
  stop() { /* close the stream + stop playback when wired */ },
};
