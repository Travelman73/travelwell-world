/**
 * TravelWell — live voice (the LiveKit belt) as a React hook.
 *
 * This is the REAL-TIME conversation mode: the traveler talks, Atlas hears and
 * answers out loud, with no send button. It's deliberately separate from the
 * default mic (which is dictation into the composer — you review, then send).
 *
 * THE KEY DIFFERENCE, and why this hook doesn't call `send()`:
 * in live mode the AGENT WORKER holds the brain (our Claude prompt, server-side)
 * and is already answering over audio. So the app must MIRROR the conversation,
 * not drive it — calling send() would make a second brain reply to every turn.
 * We only paint what the worker reports: the traveler's words and Atlas's words.
 *
 * Degrades honestly: if LiveKit isn't configured (no secrets) or the room won't
 * join, `start()` reports it and we stay on the browser belt — the traveler is
 * never left mute, and the on-screen text always carries the conversation.
 */
import { useCallback, useRef, useState } from "react";
import { createVoiceSession, type VoiceBelt } from "./voice/index";
import { getLiveKitToken } from "./supabase";
import { useStore } from "@/store/useStore";

export interface LiveVoiceState {
  /** true once the room is joined and the mic is publishing */
  live: boolean;
  /** true once the AGENT is actually in the room. Joining the room is not the
   *  same as Atlas being there — the worker can take 10s+ to pick up the job, and
   *  telling someone to "just talk" before then makes them talk to nobody. */
  agentReady: boolean;
  /** true while joining (token → WebRTC → mic permission) */
  connecting: boolean;
  start: () => Promise<void>;
  stop: () => void;
}

export function useLiveVoice(): LiveVoiceState {
  const [live, setLive] = useState(false);
  const [agentReady, setAgentReady] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const beltRef = useRef<VoiceBelt | null>(null);

  const stop = useCallback(() => {
    try { beltRef.current?.disconnect(); } catch { /* noop */ }
    beltRef.current = null;
    setLive(false);
    setAgentReady(false);
    setConnecting(false);
  }, []);

  const start = useCallback(async () => {
    if (beltRef.current || connecting) return;
    setConnecting(true);
    const { addAtlasMessage, showToast } = useStore.getState();
    try {
      const belt = createVoiceSession({
        transport: "livekit",
        degradeToBrowser: false,          // in live mode, fail loudly rather than pretend
        getToken: getLiveKitToken,
        // Atlas's words → the on-screen mirror (he's already speaking them aloud).
        onAgentText: (text: string) => addAtlasMessage({ role: "assistant", content: text }),
        onAgentPresent: (present: boolean) => setAgentReady(present),
      });
      // The traveler's words, as the worker finalizes each turn.
      belt.ears.start({
        onFinal: (text: string) => { if (text.trim()) addAtlasMessage({ role: "user", content: text.trim() }); },
        onError: () => { /* the mirror carries it; don't interrupt the conversation */ },
      });
      await belt.connect();
      beltRef.current = belt;
      setLive(true);
    } catch (err) {
      // Most common causes: LiveKit secrets not set, the agent worker isn't
      // running, or the traveler denied the mic.
      const msg = err instanceof Error ? err.message : String(err);
      showToast(
        /token|configured/i.test(msg)
          ? "Live voice isn't switched on yet — you can still type or use the mic."
          : "Couldn't start live voice. You can still type or use the mic.",
      );
      stop();
    } finally {
      setConnecting(false);
    }
  }, [connecting, stop]);

  return { live, agentReady, connecting, start, stop };
}
