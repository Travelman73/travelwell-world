/**
 * TravelWell.World — voice seam types (the "belt + slots" contract).
 *
 * VOICE = ADAPTER SEAM (David-locked): the app talks to THIS interface only —
 * never to a vendor. One belt holds two swappable slots, mouth (TTS) and ears
 * (STT); swapping a slot is a one-line change in the factory, never an app edit.
 * Today: browser Web Speech. Tomorrow: LiveKit belt + Cartesia mouth + Deepgram
 * ears drop in behind the same three interfaces. The brain (Claude in our edge
 * function) is never inside a vendor's agent format — that's the welded box we
 * refuse.
 *
 * On-screen text is always the guaranteed fallback (WCAG AA + dialect safety
 * net): the mirror shows Atlas's whole answer while he speaks it.
 */

export interface SpeakOptions {
  locale?: string;
  onStart?: () => void;
  onEnd?: () => void;
}

/** MOUTH slot — Atlas talking back (TTS). */
export interface Mouth {
  readonly name: string;
  speak(text: string, opts?: SpeakOptions): Promise<void> | void;
  stop(): void;
  supported(): boolean;
}

export interface EarsHandlers {
  /** running transcript as the person speaks (drives the live words on screen) */
  onPartial?: (text: string) => void;
  /** final transcript when the turn ends (send this to Atlas) */
  onFinal?: (text: string) => void;
  onError?: (err: unknown) => void;
  onEnd?: () => void;
}

/** EARS slot — live words from the traveler (STT). */
export interface Ears {
  readonly name: string;
  start(handlers: EarsHandlers, locale?: string): Promise<void> | void;
  stop(): void;
  supported(): boolean;
}

/** BELT — the transport that carries the slots. "browser" = direct Web Speech,
 *  no WebRTC; "livekit" = a LiveKit room (WebRTC, cross-browser incl. Safari). */
export interface VoiceBelt {
  readonly transport: "browser" | "livekit";
  connect(): Promise<void>;
  disconnect(): void;
  readonly connected: boolean;
  readonly mouth: Mouth;
  readonly ears: Ears;
}

export interface VoiceConfig {
  transport?: "browser" | "livekit";
  mouth?: "browser" | "cartesia" | "elevenlabs";
  ears?: "browser" | "deepgram";
  /** LiveKit room URL (wss://…) — from env, not hardcoded. */
  livekitUrl?: string;
  /** our edge function that mints a room token (keys stay server-side). */
  tokenEndpoint?: string;
  /** preferred token path: mint through the app's Supabase client (handles auth). */
  getToken?: (room: string) => Promise<{ url: string; token: string; room: string } | null>;
  /** which LiveKit room to join (default "atlas"). */
  room?: string;
  /** THE MIRROR — Atlas's own words, to paint on screen while he speaks them.
   *  Only meaningful on the livekit belt, where the agent holds the brain. */
  onAgentText?: (text: string) => void;
  /** never leave the traveler mute: fall back to the browser belt if a premium
   *  slot isn't wired/available. Default true. */
  degradeToBrowser?: boolean;
}
