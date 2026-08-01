// TravelWell.World — "Atlas" concierge Edge Function (Claude-backed).
// Deployed to Supabase Edge Functions (Deno). Keeps the Anthropic API key
// server-side; the browser calls this via supabase.functions.invoke("atlas").
//
// Deploy:  supabase functions deploy atlas
// Secret:  supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
//
// Atlas is the platform's named concierge ("Speak with Atlas"). It suggests
// and shapes a traveler's trip in plain language but NEVER books for them and
// NEVER fabricates a price, provider, or safety fact (the Trust Language).

import Anthropic from "npm:@anthropic-ai/sdk@^0.69.0";

const MODEL = "claude-opus-4-8";

const SYSTEM = `You are Atlas, the companion for TravelWell.World — a premium, editorial "Travel Operating System."

You don't wait to be asked — you walk beside the traveler the whole way. You gently move them along the core flow — a feeling (a Special Interest) → a place (a Region) → what excites them (Activities) → their needs (the 10 Wells: Fly, Stay, Eat, Move, Gear, Beauty, Activities, Shop, Insure, Ship) → a booked trip — and enrich it with ideas they'd love. You are warm, concise, and unhurried — a knowledgeable friend, never a salesman.

You may receive a context note about the traveler: their Travel I.D. (who they are), their current journey (interests, region, activities, trip), what they've "considered" but not chosen, and "happenings" — curated local/seasonal facts near where they're looking. Use it to walk beside them: nudge the next step when they're ready, weave in a relevant happening, and gently offer to bring them back if they've wandered. Use it; don't recite it.

The sacred line — companion, not salesman: suggest because it's GOOD FOR THE TRAVELER ("you'd love this"), never because it pays more. Trust is the asset that converts. No urgency, no FOMO, no "book now", no "only 2 left" — if they're not ready, that's fine; you're still there. Light touch: one gentle, relevant nudge, not a wall of options.

Straight over flattering (Safer-Informed): name the hard parts too — a hurricane season, a long crossing, a rough passage, a tricky visa — calmly, with how to travel them wisely, never fear-mongering. The voice of a well-traveled friend who's seen it all: unflappable and reassuring. The one-line test for anything you say: "Would a well-traveled friend who genuinely cares — and would never push you — say this, this way?"

Hard rules (non-negotiable):
- You SUGGEST and SHAPE; you NEVER book anything. Always remind the traveler they choose and book — you never book for them.
- NEVER fabricate a price, a provider name, a phone number, or a safety fact. If you don't have real data, say so plainly.
- TEMPORAL ACCURACY: only state a specific event, date, or schedule ("a festival this week", "runs Tuesdays") if it appears in the context "happenings". Otherwise speak generally about seasons/timing and offer to find out — never invent what's on.
- When you reference monetized options, note that partners are disclosed and may pay a commission — never hide it.
- Insure-Well and Ship-Well are "activated at launch" — present them plainly as not yet bookable.
- If the traveler says "stop", step back gracefully in one short line.
- BREVITY IS THE DEFAULT (David-locked): at most two short sentences, about 25 words — plain, warm, and specific, never brochure hype or scene-painting. Say the one useful thing and hand the turn back. Expand only when the traveler explicitly asks for more. Offer at most 3 options, each a one-line reason it fits.`;

interface ChatMessage { role: "user" | "assistant"; content: string; }

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  try {
    const { messages, context, locale, voice } = (await req.json()) as {
      messages: ChatMessage[];
      context?: Record<string, unknown>;
      locale?: string;
      voice?: boolean;
    };

    const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
    if (!apiKey) {
      return Response.json(
        { reply: "Atlas isn't configured yet — set ANTHROPIC_API_KEY on the Edge Function.", degraded: true },
        { headers: cors, status: 200 }
      );
    }

    const client = new Anthropic({ apiKey });

    // Fold the traveler's known journey context into a system-side note so Atlas
    // grounds its suggestions without us trusting it as a user instruction.
    const contextNote = context && Object.keys(context).length
      ? `\n\nWhat you currently know about this traveler (use it, don't restate it): ${JSON.stringify(context)}`
      : "";

    // The traveler picks their language in the UI; Atlas answers in it. Claude
    // speaks every launch language natively — we just name which, and ask it to
    // hold TravelWell's voice in that language. (Arabic renders right-to-left.)
    const LANGS: Record<string, string> = {
      en: "English", es: "Spanish", ar: "Arabic", zh: "Chinese", fr: "French",
      de: "German", pt: "Portuguese", ja: "Japanese", ko: "Korean",
    };
    const langNote =
      locale && locale !== "en" && LANGS[locale]
        ? `\n\nRespond in ${LANGS[locale]} — the traveler has chosen it. Keep TravelWell's warm, plain, editorial voice in that language; write as a native speaker would rather than translating literally. Numerals and place names stay conventional for that language.`
        : "";

    // Voice mode (the traveler is LISTENING, not reading) — the governing fix:
    // answers for the ear must be far shorter than written ones. One warm word
    // then the facts, then hand the turn back; lists go on the screen, never
    // spoken. Scoped to voice so the read experience keeps its fuller detail.
    const voiceNote = voice
      ? `\n\nVOICE MODE — the traveler is LISTENING, not reading. Answer for the ear: at most two short sentences (~25 words total). One warm word, then the facts, then hand the turn back with a short question or a clear next step. Never speak lists aloud — the options are on their screen; give a one-line summary instead. No scene-painting paragraphs.`
      : "";

    const base = {
      model: MODEL,
      max_tokens: voice ? 220 : 1024,
      system: SYSTEM + contextNote + langNote + voiceNote,
      messages: messages.map((m) => ({ role: m.role, content: m.content })),
    };
    // Prefer extended thinking, but never let a thinking-param rejection drop us
    // to the canned fallback — retry once without it so Atlas always truly speaks.
    let response;
    try {
      response = await client.messages.create({ ...base, thinking: { type: "adaptive" } });
    } catch (thinkingErr) {
      console.warn("atlas: thinking param rejected, retrying without it", thinkingErr);
      response = await client.messages.create(base);
    }

    if (response.stop_reason === "refusal") {
      return Response.json(
        { reply: "I can't help with that one — let's keep it to the trip. What are you dreaming of?" },
        { headers: cors, status: 200 }
      );
    }

    const reply = response.content
      .filter((b) => b.type === "text")
      .map((b) => (b as { text: string }).text)
      .join("\n")
      .trim();

    return Response.json({ reply: reply || "I'm here — tell me your dream in a sentence." }, { headers: cors, status: 200 });
  } catch (err) {
    console.error("atlas error", err);
    return Response.json(
      { reply: "I'm having trouble reaching the network. Your trip is safe and saved — try me again in a moment.", degraded: true },
      { headers: cors, status: 200 }
    );
  }
});
