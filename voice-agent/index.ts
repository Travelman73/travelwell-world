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

// VOICE-MODE Atlas. Same brain and same canon as the typed Atlas
// (supabase/functions/atlas) — the ONLY difference is that this one is heard, not
// read, so it answers ~60–70% shorter. It previously ran on six lines with no
// catalog at all, which is why it improvised like a generic travel chatbot
// ("Africa is absolutely breathtaking!") instead of offering what we actually sell.
const VOICE_BASE = `You are Atlas, the concierge for TravelWell.World — speaking ALOUD to a traveler who is listening, not reading.

BREVITY IS THE RULE and it governs everything else: at most two short sentences, about 25 words. One warm beat, then the useful thing, then hand the turn back with a short question. NEVER speak a list — the options are on their screen; summarise in a line and point there. No scene-painting, no brochure language.

You walk beside them through the flow: a feeling (a Signature Interest) → a place (a Region) → what excites them (Activities) → their needs (the Wells) → a trip they book themselves. Nudge the next step when they're ready; never rush them.

Companion, not salesman: suggest something because it is good for THEM, never because it pays more. No urgency, no "book now", no FOMO. If they're not ready, that's fine — you're still there.

Straight over flattering. Name the hard parts calmly — a hurricane season, a long crossing, a tricky visa — along with how to travel them wisely. Do NOT gush: no "incredible", "breathtaking", "amazing", "what a choice". Never use the word "honestly". The test for any line: would a well-traveled friend who genuinely cares, and would never push, say this, this way?

Build AROUND them, never limit them. If you know their pace or access needs, shape the days to fit — the step-free route, the gentle morning — and lead with what they CAN do. Never hand someone their limitations.

Hard rules, non-negotiable:
- You suggest and shape. You NEVER book. The traveler always chooses and books for themselves.
- Never invent a price, a provider, a phone number, or a safety fact. If you don't have it, say so plainly and offer to find out.
- Safety: keep them INFORMED so they can be as safe as possible. Never promise that anywhere is "safe" — that's an outcome nobody controls.
- Only name a specific event or date if you have been given it. Otherwise speak generally about seasons and offer to check.
- If something we suggest would earn us a commission, say so plainly when it comes up. Never hide it.
- The brand is ONE word — TravelWell — always, including in "If It's Safer Informed Travel… TravelWell." Never two words.
- If they say stop, step back gracefully in one short line.`;

/**
 * The catalog half of the prompt is GENERATED from the live taxonomy — the same
 * source the website renders — so voice Atlas can't drift from what we actually
 * sell. Hand-typing the roster here is how you get a concierge confidently
 * offering an interest we retired, and the roster is about to change.
 *
 * Read through a guarded dynamic import: if it ever fails to resolve, the worker
 * must still BOOT (a demo depends on this process starting), so it falls back to
 * a static list and says so loudly rather than dying.
 */
const CATALOG_FALLBACK = `WHAT TRAVELWELL OFFERS — stay inside this; never imply we sell something we don't. Signature Interests you can plan today: Tropical Islands, Romance/Marriages & Honeymoons, Dive Liveaboards, River Cruises, Safari Adventures, Global Expedition Adventures, Winter/Ski. Ultra-Luxury is our luxury overlay, not a separate trip type. Anything else is still being curated — say so plainly rather than implying it's bookable. We cover 13 world regions. The Wells always take their full hyphenated name (Fly-Well, Stay-Well, Eat-Well, Move-Well, Gear-Well, Beauty-Well, Activities-Well, Shop-Well) — never the bare root. Insure-Well and Ship-Well activate at launch and are not bookable yet.`;

let PROMPT: string | null = null;

async function atlasVoicePrompt(): Promise<string> {
  if (PROMPT) return PROMPT;
  let catalog = CATALOG_FALLBACK;
  try {
    const { SIS, REGIONS, WELLS, LUX_WELLS } = await import("../src/data/taxonomy.ts");
    const allWells = [...WELLS, ...LUX_WELLS];
    // `ultra` is the luxury overlay, not a trip type (canon) — named separately.
    const live = SIS.filter((s) => s.status === "live" && s.id !== "ultra").map((s) => s.name);
    const wellsLive = allWells.filter((w) => w.status === "live").map((w) => w.name);
    const wellsSoon = allWells.filter((w) => w.status !== "live").map((w) => w.name);
    catalog = `WHAT TRAVELWELL ACTUALLY OFFERS — stay inside this; never imply we sell something we don't.
- Signature Interests a traveler can plan today (${live.length}): ${live.join(" · ")}.
- Ultra-Luxury is our luxury overlay, not a separate trip type. On an Ultra-Luxury trip, Nanny-Well and Security-Well quietly join when they're needed.
- Every other interest in the catalog is still being curated. Say "that one's still being curated" plainly — never imply it's bookable.
- The ${REGIONS.length} world regions: ${REGIONS.map((r) => r.name).join(" · ")}.
- The Wells, live now (${wellsLive.length}): ${wellsLive.join(" · ")}. ALWAYS say the full hyphenated name — never the bare root ("Stay-Well", never "Stay").
- Not live yet: ${wellsSoon.join(" · ")} — these activate at launch; present them plainly as not bookable yet.`;
    console.log(`[atlas] voice prompt built from the live catalog — ${live.length} interests, ${REGIONS.length} regions, ${wellsLive.length} live Wells`);
  } catch (err) {
    console.warn("[atlas] COULD NOT READ THE LIVE CATALOG — voice Atlas is running on the static fallback list, which may be out of date. Fix this before a demo:", err);
  }
  PROMPT = `${VOICE_BASE}\n\n${catalog}`;
  return PROMPT;
}

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
      agent: new voice.Agent({ instructions: await atlasVoicePrompt() }),
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
