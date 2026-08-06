/**
 * TravelWell.World — Atlas voice AGENT WORKER (LiveKit Agents v1.6, Node).
 *
 * The server process that lives in a LiveKit room and runs the real stack —
 * Deepgram ears, Cartesia mouth, our Claude brain — with LiveKit's turn-taking
 * + barge-in, mirroring each spoken turn as text over a data channel.
 *
 * BRAIN STAYS OURS (canon): the LLM is Claude with OUR Atlas voice prompt +
 * safety language (via the Agent's instructions). LiveKit only moves audio +
 * turn signals — Atlas's logic is never inside a vendor's agent format.
 *
 * Verified against @livekit/agents@1.6 type defs. Run it (npm run dev) against a
 * live LiveKit project to complete the spike; talk to it via LiveKit's hosted
 * Agents Playground (agents-playground.livekit.io) pointed at your project.
 */
import "dotenv/config"; // load voice-agent/.env into process.env (must be first)
import { type JobContext, ServerOptions, cli, defineAgent, voice } from "@livekit/agents";
import * as deepgram from "@livekit/agents-plugin-deepgram";
import * as cartesia from "@livekit/agents-plugin-cartesia";
import * as anthropic from "@livekit/agents-plugin-anthropic";
import * as silero from "@livekit/agents-plugin-silero";
import { fileURLToPath } from "node:url";

// Lean VOICE-MODE Atlas prompt (canonical prompt lives in supabase/functions/atlas).
// Voice needs ~60–70% shorter answers than text — 2 sentences, warm beat → fact →
// hand back, never speak lists, never fabricate, never book, never promise "safe".
const ATLAS_VOICE_PROMPT = `You are Atlas, TravelWell.World's concierge, speaking aloud.
Keep every turn to at most two short sentences. One warm beat, then the fact, then hand the turn back.
Never read lists aloud — they're on the traveler's screen; point to them instead.
Never invent a price, provider, or safety fact. If you don't have it, say so plainly.
You suggest and shape; you NEVER book — the traveler always chooses and books.
Speak safety straight and keep them informed; never promise the outcome "safe".`;

// Hard words to bias the recognizer (from docs/atlas-demo-script.md Appendix A).
const KEYTERMS = [
  "Maasai Mara", "Serengeti", "Ngorongoro", "Angama Mara", "Mahali Mzuri",
  "Governors' Camp", "Sossusvlei", "AlUla", "Nairobi", "liveaboard",
];

export default defineAgent({
  entry: async (ctx: JobContext) => {
    await ctx.connect();

    const session = new voice.AgentSession({
      vad: await silero.VAD.load(),
      // EARS — Deepgram, with keyterm prompting so accents/place-words resolve.
      stt: new deepgram.STT({ model: "nova-3", keyterm: KEYTERMS }),
      // BRAIN — Claude (plugin default model), our prompt via the Agent below.
      llm: new anthropic.LLM(),
      // MOUTH — Cartesia Sonic. Pin the model + voice EXPLICITLY (the empty-options
      // default rides sonic-3, which isn't enabled on every account — a silent
      // no-audio failure at synthesis). sonic-2 is long-GA and reliable. The voice
      // id is Cartesia's known-good default; audition a warmer concierge voice by ear
      // later — it's a one-field change here, never an app edit. Swapping to
      // ElevenLabs is likewise one line (cartesia -> elevenlabs plugin).
      tts: new cartesia.TTS({
        model: "sonic-2",
        voice: "f786b574-daa5-4673-aa0c-cbe3e8534c02",
      }),
      // Turn-taking (semantic endpointing) + barge-in are the session's job.
    });

    // Surface any pipeline failure (bad key, unavailable model, provider 4xx) in
    // the worker terminal instead of it manifesting as silent no-audio.
    session.on(voice.AgentSessionEventTypes.Error, (ev: unknown) => {
      console.error("[atlas] session error:", (ev as { error?: unknown })?.error ?? ev);
    });

    // THE MIRROR: forward each turn's text over the room data channel so the UI
    // shows Atlas's whole answer while he speaks it. Best-effort (never blocks).
    session.on(voice.AgentSessionEventTypes.ConversationItemAdded, (ev: unknown) => {
      try {
        const item = (ev as { item?: { role?: string; textContent?: string; content?: unknown } })?.item;
        const text = item?.textContent ?? (typeof item?.content === "string" ? item.content : undefined);
        if (!text) return;
        const payload = new TextEncoder().encode(JSON.stringify({ role: item?.role, text }));
        // `reliable` is REQUIRED by rtc-node's protobuf — omitting it throws
        // "cannot encode field ... reliable: required field not set" on every turn,
        // which silently killed the mirror (the try/catch below can't catch it:
        // publishData returns a promise, so it surfaced as an unhandled rejection).
        void ctx.room.localParticipant
          ?.publishData(payload, { topic: "transcript", reliable: true })
          .catch((err: unknown) => console.error("[atlas] mirror publish failed:", err));
      } catch { /* mirror is best-effort */ }
    });

    await session.start({
      agent: new voice.Agent({ instructions: ATLAS_VOICE_PROMPT }),
      room: ctx.room,
    });

    // Atlas speaks FIRST on join. Two jobs: (1) a warm concierge open is the right
    // demo feel, and (2) it fires TTS immediately — independent of STT/endpointing —
    // so a no-audio bug is isolated in one breath: if you hear this line, the mouth
    // works and any later silence is the input/turn path; if you don't, the worker
    // log now shows the exact Cartesia/Anthropic error.
    session.say("Hi, I'm Atlas. Where in the world are you dreaming of?");
  },
});

// `node index.js dev` (via tsx) connects to your LiveKit project and waits for rooms.
cli.runApp(new ServerOptions({ agent: fileURLToPath(import.meta.url) }));
