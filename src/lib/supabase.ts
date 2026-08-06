/**
 * TravelWell.World — Supabase client.
 * Reads credentials from Vite env (see .env.example). The client is created
 * lazily and tolerates missing env in local/design preview so the UI still
 * renders; data calls degrade gracefully (mirrors the Concierge "degraded"
 * state — your trip is safe and saved locally).
 */
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(url && anonKey);

let client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient | null {
  if (!isSupabaseConfigured) return null;
  if (!client) client = createClient(url, anonKey);
  return client;
}

/**
 * Calls the `atlas` Edge Function (Claude-backed concierge). Falls back to a
 * graceful degraded message when Supabase isn't configured, so the prototype
 * still demonstrates the conversation shape without leaking keys client-side.
 */
export async function askAtlas(
  messages: { role: "user" | "assistant"; content: string }[],
  context?: Record<string, unknown>,
  locale?: string,
  voice?: boolean
): Promise<{ reply: string; degraded?: boolean }> {
  const sb = getSupabase();
  if (!sb) {
    return {
      reply:
        "I'm running in design-preview mode right now, so I can't reach the network — but everything you plan is saved. Connect Supabase + the Atlas function and I'll plan from a single sentence.",
      degraded: true,
    };
  }
  try {
    const { data, error } = await sb.functions.invoke("atlas", {
      body: { messages, context, locale, voice },
    });
    if (error) throw error;
    return { reply: (data as { reply: string }).reply };
  } catch {
    return {
      reply:
        "I'm having trouble reaching the network. Let me get that in a moment — your trip is safe and saved.",
      degraded: true,
    };
  }
}

/**
 * Mint a LiveKit room token via the `livekit-token` edge function (the LiveKit
 * API key/secret stay server-side). Returns null when Supabase or LiveKit isn't
 * configured, so the caller degrades to the browser belt rather than erroring —
 * the traveler is never left mute.
 */
export async function getLiveKitToken(
  room = "atlas"
): Promise<{ url: string; token: string; room: string } | null> {
  const sb = getSupabase();
  if (!sb) return null;
  try {
    const { data, error } = await sb.functions.invoke("livekit-token", { body: { room } });
    if (error) throw error;
    const d = data as { url?: string; token?: string; room?: string; degraded?: boolean };
    if (d?.degraded || !d?.token || !d?.url) return null;   // secrets not set yet
    return { url: d.url, token: d.token, room: d.room ?? room };
  } catch {
    return null;
  }
}
