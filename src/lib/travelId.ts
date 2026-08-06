/**
 * TravelWell — Travel ID persistence (public.travel_ids, RLS by auth.uid()).
 *
 * Read/write the signed-in traveler's profile. No-ops gracefully when Supabase
 * isn't configured. The shape mirrors the 0001_init migration so a row maps
 * straight onto the Profile screen and the Sign Up wizard output.
 */
import { getSupabase } from "./supabase";

export interface TravelIdRecord {
  user_id: string;
  display_name: string | null;
  age_range: string | null;
  trip_intent: string | null; // the free-text "dream"
  interests: string[];        // 1–3 special-interest ids
  budget_ranges: Record<string, string[]>; // { wellId: ranges[] }
  party: PartyMember[];       // everyone on the trip (the SignUp party builder)
  // Safer-Informed capabilities overlay (Identity Builder Step 2, migration 0011):
  activity_level: string | null;   // pace: very-active | moderately-active | lightly-active | leisurely
  access_needs: string[];          // wheelchair | cane | frequent-rest | no-stairs | some-stairs | fully-mobile
  capabilities: string | null;     // the ENABLING side — "what you're fully up for"
  dietary: string | null;
  accessibility: string | null;    // the "anything to plan around" side
  consent: boolean;
}

/** A member of the travelling party (mirrors the SignUp wizard's Member). */
export interface PartyMember { name: string; age: string; rel: string }

export async function fetchTravelId(userId: string): Promise<TravelIdRecord | null> {
  const sb = getSupabase();
  if (!sb) return null;
  const { data, error } = await sb.from("travel_ids").select("*").eq("user_id", userId).maybeSingle();
  if (error) return null;
  return (data as TravelIdRecord) ?? null;
}

export async function saveTravelId(
  rec: Partial<TravelIdRecord> & { user_id: string }
): Promise<{ ok: boolean; error?: string }> {
  const sb = getSupabase();
  if (!sb) return { ok: false, error: "unconfigured" };
  const payload: Record<string, unknown> = { ...rec, updated_at: new Date().toISOString() };
  let { error } = await sb.from("travel_ids").upsert(payload, { onConflict: "user_id" });
  // Resilience: newer optional columns land in later migrations (party → 0008,
  // the capabilities overlay → 0011). If one isn't applied yet, drop the column the
  // error names and retry — Postgres reports missing columns one at a time, so loop
  // over the optional set. Persists everything else rather than losing the whole
  // Travel ID; self-heals once the migration runs.
  const OPTIONAL_COLS = ["party", "activity_level", "access_needs", "capabilities"];
  for (let i = 0; error && i < OPTIONAL_COLS.length; i++) {
    const hit = OPTIONAL_COLS.find((c) => c in payload && new RegExp(c, "i").test(error!.message));
    if (!hit) break;
    delete payload[hit];
    ({ error } = await sb.from("travel_ids").upsert(payload, { onConflict: "user_id" }));
  }
  return error ? { ok: false, error: error.message } : { ok: true };
}

/* ---- Pending Travel ID (passwordless flow) -------------------------------
 * Sign Up collects the Travel ID before the user has a session. We stash it
 * locally, send a magic link, and flush it to Postgres once they verify and a
 * session exists (see Shell). */
const PENDING_KEY = "tww:pendingTravelId";
export type PendingTravelId = Omit<TravelIdRecord, "user_id">;

export function savePendingTravelId(rec: PendingTravelId): void {
  try { localStorage.setItem(PENDING_KEY, JSON.stringify(rec)); } catch { /* ignore */ }
}
export function loadPendingTravelId(): PendingTravelId | null {
  try { const v = localStorage.getItem(PENDING_KEY); return v ? (JSON.parse(v) as PendingTravelId) : null; } catch { return null; }
}
export function clearPendingTravelId(): void {
  try { localStorage.removeItem(PENDING_KEY); } catch { /* ignore */ }
}

/** Once signed in, write any pending Travel ID to the DB and clear it. */
export async function flushPendingTravelId(userId: string): Promise<boolean> {
  const pending = loadPendingTravelId();
  if (!pending) return false;
  const { ok } = await saveTravelId({ user_id: userId, ...pending });
  if (ok) clearPendingTravelId();
  return ok;
}

