# LiveKit voice spike — outcome + integration plan

The spike David asked for, to scope the voice build honestly. Given the sandbox
has no vendor keys and blocks the vendor endpoints, the spike is what a spike
should be: **prove the integration *shape* and size the real build** — not a live
call. What it produced is real and on `main`.

## What the spike built (verified: build + tsc + 10/10 factory tests green)
The **swappable voice seam** — `src/lib/voice/`:
- `types.ts` — the contract: a **belt** carrying two swappable slots, **mouth** (TTS)
  and **ears** (STT).
- `browser.ts` — the browser belt (Web Speech mouth + ears). The guaranteed floor.
- `cartesia.ts` / `deepgram.ts` — the premium slots, as drop-in stubs with the exact
  wiring notes.
- `livekit.ts` — the LiveKit belt (WebRTC), stub with the full architecture.
- `index.ts` — `createVoiceSession(config)`: **the one place a slot swaps.**
- `supabase/functions/livekit-token/` — the token-server edge-function skeleton.

**The swap is literally one line**, as David wants:
```ts
createVoiceSession();                                    // browser (today)
createVoiceSession({ transport: "livekit",
  mouth: "cartesia", ears: "deepgram",
  livekitUrl, tokenEndpoint });                          // the real stack
```
Anything unwired **degrades to the browser slot** (unless `degradeToBrowser:false`),
so the traveler is never left mute — and the on-screen mirror always carries the text.

## Architecture (the real build)
```
Browser (Atlas UI)  ──►  VoiceBelt (our seam)  ──►  mouth / ears slots
     │                        │
     │  1. asks our           │  belt = "livekit"
     │  livekit-token edge fn │
     ▼                        ▼
 { url, token }        LiveKit room (WebRTC, carries Safari)
                              │
                              ▼
                    LiveKit AGENT WORKER (server-side)
                      ├─ our Claude brain  (UNCHANGED edge logic — stays ours)
                      ├─ Cartesia mouth    (publishes audio track)
                      ├─ Deepgram ears     (subscribes mic, streams transcript)
                      ├─ semantic endpointing (turn-taking, built into LiveKit)
                      └─ data channel → the MIRROR (text of each turn to the UI)
```
The brain never lives inside a vendor's agent format — LiveKit only moves audio +
turn signals. That keeps the no-welded-box rule.

## Config vs real build (the honest split)
- **Config / one-line (done or trivial):** which belt + slots; the degrade behavior;
  the seam the UI talks to.
- **Real build (the work, needs accounts + keys):**
  1. **LiveKit account + `livekit-token` live** — enable the SDK import + minting in the
     skeleton, set `LIVEKIT_API_KEY/SECRET/URL` secrets. *Small once the account exists.*
  2. **The LiveKit agent worker** — the server process that runs our brain + Cartesia +
     Deepgram in the room. *This is the largest piece — it's a new deployable service,
     not an edge function.*
  3. **Cartesia mouth** — WS streaming TTS → audio track, key server-side. *Medium.*
  4. **Deepgram ears** — mic capture → WS streaming STT → transcript, key server-side. *Medium.*
  5. **The mirror** — agent emits each turn's text over a data channel; UI shows it while
     Atlas speaks. *Small-medium (the UI half is mostly there).*
  6. **Wire the Concierge UI to `createVoiceSession`** instead of calling `speak()` directly.
     *Small.*

## The three pieces — provider picks (David's ask: best-in-class, never cheapest)

- **Listening / STT — Deepgram Nova (latest).** Best-in-class streaming; the reason it
  fits *our* problem: **keyterm prompting** — we bias the recognizer toward proper nouns
  (place names, provider names, SI words like "liveaboard," "Sossusvlei") so real accents +
  place words don't get mangled. That directly answers "handles accents, names, place
  words." Swap-in: AssemblyAI.
- **Speaking / TTS — my call, and it's "audition, don't guess."** Two real contenders:
  **Cartesia Sonic** (fastest first-audio — and in live conversation *latency is felt*, dead
  air reads as "not real AI") vs **ElevenLabs** (the warmest, most human — David's reference
  point). Recommendation: **wire Cartesia first for the real-time feel, then audition
  ElevenLabs on the actual Atlas lines and pick by ear.** The seam makes it a one-line swap,
  so we choose on how it *sounds saying our script*, not on spec sheets. Warm > synthetic is
  the bar; both clear it, so we let the ear decide.
- **Real-time flow / the hard piece — LiveKit belt.** WebRTC, **semantic endpointing**
  (knows a breath isn't a full stop) and **barge-in/interrupt** handled by the framework —
  this is where "talk and listen naturally, both directions, interrupt and respond" actually
  lives. Carries Safari. We do NOT roll our own turn-taking.
- **The mirror** — Atlas speaks his whole answer AND shows it on screen at once (real
  conversation + accessibility + the dialect safety net when STT mishears an accent).

**What I need to make it excellent (David asked this directly):**
1. **The LiveKit account** — the one blocker to spike the agent worker and turn the ~3–4wk
   *range* into a committed date. (Free tier = the real quality; no upgrade needed for the pitch.)
2. **API keys** for Deepgram + Cartesia + ElevenLabs (all free credits/trials — best tier, ~$0 through the pitch).
3. **A real iPhone + Safari** as a named test device — the single hardest surface to trust live.
4. **The actual Atlas demo lines/scenarios** to tune against — so we tune latency + pronunciation
   on real content (place names, the safari script), not filler.

## Browser test targets (David's two engines)
- **Chromium** (Chrome + Edge — same engine; the "Chrome won't open, Edge does" report is a
  config glitch, not incompatibility).
- **WebKit** (Safari — the fussy one for live audio; **named iPhone/Safari target, especially
  for Japan**). LiveKit carries both; this is the reason to pick LiveKit over Pipecat.

## Demo-readiness path (shortest route to a live voice demo)
1. Stand up a LiveKit account; flip on `livekit-token` (secrets + SDK import). *Free tier fine.*
2. Build the agent worker with our brain + Cartesia + Deepgram. **← the long pole.**
3. Wire the Concierge to the seam; turn on the mirror.
4. Test on Chromium + a real iPhone Safari.

Slots 3–5 are known, well-trodden vendor integrations; the agent worker is the piece to
start now and protect the schedule around. Everything else is assembly on the seam that's
already poured.

## Cost & tiers — corrected (David, Jul 2026)
Voice was **never a cost/"funded" wall** — that framing was wrong, owned and corrected.
The real-time stack runs at **pennies per minute of speech**, and the pitch phase is
effectively free: Deepgram ships a **$200 credit**, Cartesia/LiveKit have generous free
usage. Crucially, **"free tier" here is NOT a stripped-down quality tier** — the free
credits run the **same top models** (Deepgram Nova, Cartesia Sonic) on the **same LiveKit
WebRTC infra**. It's a *usage cap*, not a quality cap. So we show a VC the **best** stack
*and* pay ~nothing during the pitch — no compromise, no "keyboard demo." Paid plans matter
only when post-launch volume exceeds the credits — a billing threshold, not a quality gate.

**So the only real constraint is engineering TIME.** Decision (David): the date serves the
product — we take the time to make full live voice flawless, then present.

## Honest time estimate (voice workstream)
Estimate, not fake precision. Firms up after a ~2–3 day agent-worker spike on the real account.

**Build to "running live end-to-end" (~1.5–2 weeks):**
- `livekit-token` live (enable SDK minting): ~0.5 day
- **The agent worker** (LiveKit Agents: Deepgram STT + Cartesia TTS + a custom LLM node that
  runs OUR Atlas brain/prompt/safety, turn-detection built in) + deploy: **~4–6 days ← the meat**
- Concierge wired to the seam (token→join→mic→live transcript→playback) + the mirror: ~2–3 days

**Test/harden to "trust it in a live room, no stumbles" (~1.5–2 weeks):**
- Cross-browser incl. **real iPhone Safari** (mic permission, audio-autoplay unlock, barge-in,
  reconnection) — **the top risk**: ~3–5 days
- Latency + endpointing tuning (never cut people off, never lag): ~2–3 days
- Failure modes (bad network, loud airport, thick accent → the mirror as safety net): ~2–3 days
- Dry-run rehearsals on the actual demo device + network: ~1–2 days

**Total: ~3–4 focused weeks** to full live voice that's trustworthy in a room. Safari live-audio
is the single risk that could stretch the testing half. The agent worker is the long pole and the
biggest unknown — give me the LiveKit account and ~2–3 days on it and I convert this range into a
committed date.

## Spike PROVEN — Atlas hears & talks back live (David, 2026-08)
The long pole is no longer estimated — it runs. The real-time pipeline assembles
and speaks against live infrastructure, and the brain stayed **ours + swappable**
(Claude in our edge function, never inside a vendor's agent format). This is the
de-risk the pitch stands on. Alongside Duffel (real flights on our own surface),
both critical-path proofs are running — for ~$0.

### The mouth A/B — Cartesia ↔ ElevenLabs, decide by ear (David-locked)
Both are behind the same `Mouth` interface (`src/lib/voice/cartesia.ts`,
`src/lib/voice/elevenlabs.ts`), so choosing is a **one-line/env flip, no UI move**:
set `VITE_TWW_MOUTH=cartesia|elevenlabs` (or pass `mouth` to `createVoiceSession`)
and listen on our real lines. Rule of thumb: **Cartesia for latency** (felt in
conversation — Atlas never reads as "I thought this was AI"), **ElevenLabs for
warmth/fidelity**. Sana picks by ear; then we set the default. *(Both slots are
stubs until the streaming proxy + audio playback are wired — `supported()=false`
degrades to browser so no one is left mute; the API keys stay server-side.)*

### The gate before the room (David-locked): real iPhone Safari
Safari live-audio (mic permission, autoplay unlock, barge-in, reconnection) is the
top risk — **test on a real iPhone, not a laptop.** Find the quirks now, not in the
room. Once the by-ear pick + the Safari-journey UI wiring + a real-device dry run
are done, we set the exact demo-rehearsal date. Deliverable for David: a short
screen capture of Atlas running (the WOW-flow equivalent for voice).
