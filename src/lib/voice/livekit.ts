/**
 * BELT — LiveKit (WebRTC). The real client side of the voice spike.
 *
 * The recommended belt: web-native/WebRTC-first (Atlas lives in a browser),
 * carries Safari/WebKit (critical for iPhone live audio), turn-detection
 * (semantic endpointing) handled server-side by the agent worker.
 *
 * How the pieces fit:
 *   1. This client asks our `livekit-token` edge function for a room token
 *      (LIVEKIT_API_KEY/SECRET live as Supabase secrets — never in the browser).
 *   2. It joins the room over WebRTC, publishes the mic, and plays the agent's
 *      audio track.
 *   3. The AGENT WORKER (`voice-agent/`, a separate service) sits in the same
 *      room running Deepgram ears + Cartesia/ElevenLabs mouth + our Claude brain,
 *      and publishes each turn's TEXT on the `transcript` data topic.
 *   4. The mirror: that text drives the on-screen words while Atlas speaks —
 *      the guaranteed fallback (WCAG AA + dialect safety net).
 *
 * The brain stays OURS and outside LiveKit's format — LiveKit only moves audio +
 * turn signals. That preserves the no-welded-box rule.
 *
 * `livekit-client` is imported DYNAMICALLY so it code-splits into its own chunk:
 * travelers who never turn on live voice never download it, and the browser belt
 * (the default) is unaffected.
 */
import type { VoiceBelt, Mouth, Ears, EarsHandlers, SpeakOptions } from "./types";
import { browserMouth, browserEars } from "./browser";

export interface LiveKitBeltOpts {
  livekitUrl?: string;
  tokenEndpoint?: string;
  room?: string;
  mouth?: Mouth;
  ears?: Ears;
}

interface TokenResponse { url?: string; token?: string; room?: string; degraded?: boolean; note?: string }

/** Decode the `transcript` data-channel payload the agent worker publishes. */
interface TranscriptMsg { text?: string; final?: boolean; role?: "user" | "assistant" }

export function createLiveKitBelt(opts: LiveKitBeltOpts): VoiceBelt {
  let connected = false;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let room: any = null;
  let audioEl: HTMLAudioElement | null = null;
  let earHandlers: EarsHandlers | null = null;
  let speakingCb: SpeakOptions | null = null;

  /** The agent transcribes and speaks; the client only surfaces what it hears. */
  const agentEars: Ears = {
    name: "livekit-agent",
    supported: () => true,
    start(handlers) { earHandlers = handlers; },   // fed by the data channel below
    stop() { earHandlers = null; },
  };

  /**
   * On this belt the AGENT decides what to say (brain-side), so speak() isn't the
   * normal path — it's the scripted-line hook (the guided walk). It asks the agent
   * to voice a specific line over the data channel; the audio still arrives as a
   * track, so the "Atlas is speaking" signal is driven by playback, not by us.
   */
  const agentMouth: Mouth = {
    name: "livekit-agent",
    supported: () => true,
    async speak(text: string, o?: SpeakOptions) {
      speakingCb = o ?? null;
      if (!room?.localParticipant) return;
      const payload = new TextEncoder().encode(JSON.stringify({ say: text, locale: o?.locale }));
      await room.localParticipant.publishData(payload, { reliable: true, topic: "say" });
    },
    stop() {
      if (!room?.localParticipant) return;
      const payload = new TextEncoder().encode(JSON.stringify({ stop: true }));
      room.localParticipant.publishData(payload, { reliable: true, topic: "say" }).catch(() => {});
    },
  };

  return {
    transport: "livekit",
    get connected() { return connected; },
    mouth: opts.mouth ?? agentMouth,
    ears: opts.ears ?? agentEars,

    async connect() {
      if (!opts.tokenEndpoint) throw new Error("liveKitBelt: no tokenEndpoint configured");

      // 1. Mint a join token server-side (keys never touch the browser).
      const res = await fetch(opts.tokenEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ room: opts.room ?? "atlas" }),
      });
      const data = (await res.json()) as TokenResponse;
      if (data.degraded || !data.token) {
        throw new Error(`liveKitBelt: ${data.note ?? "token endpoint returned no token"}`);
      }
      const url = opts.livekitUrl ?? data.url;
      if (!url) throw new Error("liveKitBelt: no LiveKit URL (set LIVEKIT_URL secret or pass livekitUrl)");

      // 2. Join the room. Dynamic import → its own chunk, loaded only now.
      const { Room, RoomEvent, Track } = await import("livekit-client");
      room = new Room({ adaptiveStream: true, dynacast: true });

      // 3. Play the agent's audio as soon as it arrives.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      room.on(RoomEvent.TrackSubscribed, (track: any) => {
        if (track.kind !== Track.Kind.Audio) return;
        audioEl = track.attach() as HTMLAudioElement;
        audioEl.autoplay = true;
        // The speaking signal follows real playback, whichever mouth the agent uses.
        audioEl.addEventListener("play", () => speakingCb?.onStart?.());
        audioEl.addEventListener("ended", () => speakingCb?.onEnd?.());
        audioEl.style.display = "none";
        document.body.appendChild(audioEl);
      });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      room.on(RoomEvent.TrackUnsubscribed, (track: any) => {
        track.detach().forEach((el: HTMLElement) => el.remove());
        audioEl = null;
      });

      // 4. The mirror — the agent's transcript text over the data channel.
      room.on(RoomEvent.DataReceived, (payload: Uint8Array, _p: unknown, _k: unknown, topic?: string) => {
        if (topic && topic !== "transcript") return;
        try {
          const msg = JSON.parse(new TextDecoder().decode(payload)) as TranscriptMsg;
          if (!msg.text) return;
          if (msg.final) earHandlers?.onFinal?.(msg.text);
          else earHandlers?.onPartial?.(msg.text);
        } catch { /* ignore malformed frames */ }
      });

      room.on(RoomEvent.Disconnected, () => { connected = false; });

      await room.connect(url, data.token);

      // 5. SAFARI/iOS: autoplay is blocked until a user gesture. connect() is
      //    called from a tap (the mic button), so unlocking here is the reliable
      //    moment. If it throws we continue muted-but-connected rather than fail —
      //    the on-screen mirror still carries the conversation.
      try { await room.startAudio(); } catch { /* unlocked on the next gesture */ }

      // 6. Publish the mic (prompts for permission on first use).
      await room.localParticipant.setMicrophoneEnabled(true);

      connected = true;
    },

    disconnect() {
      try { room?.localParticipant?.setMicrophoneEnabled(false); } catch { /* noop */ }
      try { room?.disconnect(); } catch { /* noop */ }
      audioEl?.remove();
      audioEl = null;
      earHandlers = null;
      speakingCb = null;
      room = null;
      connected = false;
    },
  };
}

/** Kept so the factory's browser-degrade path has slots if the belt is unavailable. */
export const fallbackSlots = { mouth: browserMouth, ears: browserEars };
