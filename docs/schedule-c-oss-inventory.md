# Schedule C — Third-party & open-source components

*Generated from `sanaafzal-create/travelwell-world` @ `main`, 2026-08. Paste into
the Founder Memorandum Schedule C. Regenerate before any data room — versions move.*

**Headline for diligence: 445 packages scanned across the full dependency tree.
Zero GPL, AGPL, SSPL, BUSL, Commons Clause or non-commercial licences.** Everything
is permissive (MIT / Apache-2.0 / ISC / BSD / BlueOak / MPL-2.0). Nothing in the
stack imposes copyleft obligations on TravelWell's own source.

## A. Shipped in the product (runtime dependencies)

| Component | Version | Licence | Purpose |
|---|---|---|---|
| react | ^18.3.1 | MIT | UI framework |
| react-dom | ^18.3.1 | MIT | DOM renderer |
| react-router-dom | ^6.26.2 | MIT | Routing |
| zustand | ^4.5.5 | MIT | State management |
| @supabase/supabase-js | ^2.45.4 | MIT | Database / auth / edge-function client |
| livekit-client | ^2.21.0 | Apache-2.0 | WebRTC transport for live voice |

## B. Build & test only (not shipped to users)

| Component | Version | Licence |
|---|---|---|
| vite | ^5.4.8 | MIT |
| @vitejs/plugin-react | ^4.3.1 | MIT |
| vite-plugin-pwa | ^1.3.0 | MIT |
| typescript | ^5.6.2 | Apache-2.0 |
| tailwindcss | ^3.4.13 | MIT |
| postcss | ^8.4.47 | MIT |
| autoprefixer | ^10.4.20 | MIT |
| playwright | ^1.62.1 | Apache-2.0 |
| axe-core | ^4.12.1 | **MPL-2.0** |
| @axe-core/playwright | ^4.12.1 | **MPL-2.0** |
| @types/react, @types/react-dom | ^18.3.x | MIT |

> **MPL-2.0 note (the only one worth a sentence):** axe-core is our automated
> accessibility gate. MPL-2.0 is file-level copyleft — it obliges you to share
> modifications *to those files*, and we have made none; we consume it unmodified,
> in the build pipeline only, and it is never distributed to users. No obligation
> attaches to TravelWell's source. Standard and unproblematic, but name it rather
> than let diligence find it.

## C. Transitive dependency census (445 packages)

| Licence | Count |
|---|---|
| MIT | 387 |
| ISC | 19 |
| Apache-2.0 | 14 |
| BlueOak-1.0.0 | 8 |
| BSD-3-Clause | 6 |
| BSD-2-Clause | 5 |
| MPL-2.0 | 2 |
| Apache-2.0 AND BSD-3-Clause | 1 |
| CC-BY-4.0 | 1 |
| 0BSD | 1 |
| MIT OR CC0-1.0 | 1 |

## D. Voice agent service (`voice-agent/`, deployed separately)

Runs as a standalone Node service; **not** part of the shipped web app.

| Component | Version | Licence |
|---|---|---|
| @livekit/agents | ^1.6.0 | Apache-2.0 |
| @livekit/agents-plugin-anthropic | ^1.6.0 | Apache-2.0 |
| @livekit/agents-plugin-cartesia | ^1.6.0 | Apache-2.0 |
| @livekit/agents-plugin-deepgram | ^1.6.0 | Apache-2.0 |
| @livekit/agents-plugin-silero | ^1.6.0 | Apache-2.0 |
| dotenv | ^16.4.0 | MIT |
| tsx, typescript | ^4 / ^5 | MIT / Apache-2.0 |

*Verify these from `voice-agent/node_modules` on the dev machine before signing —
they weren't installed in the environment this was generated from.*

## E. Fonts (redistributed to users — licence matters)

Loaded from Google Fonts: **Playfair Display**, **Inter**, **Noto Sans Arabic**,
**Noto Naskh Arabic** — all **SIL Open Font License 1.1**, which permits
commercial use and embedding. No royalty or attribution burden.

## F. Third-party services (terms of service, not licences)

Not "components," but technical diligence asks. Each is a commercial API used
under its own ToS; **all keys are held server-side** (Supabase secrets or the
agent's environment) and none is embedded in the client bundle.

| Service | Used for | Notes |
|---|---|---|
| Supabase | Postgres, auth, edge functions | our data platform |
| Anthropic (Claude) | Atlas's reasoning | paid API |
| Unsplash | destination photography | API terms require attribution — **we display photographer credit + link on every image** |
| Duffel | live flight search | provider is merchant of record |
| LiveKit Cloud | WebRTC transport | |
| Deepgram | speech-to-text | |
| Cartesia | text-to-speech | ElevenLabs is a drop-in alternative behind the same interface |

## G. First-party (not third-party — TravelWell's own)

For completeness, these are ours, not licensed in: the Atlas system prompts and
voice rules, the destination dossiers and safety data, the taxonomy (regions,
Signature Interests, the Wells), the design tokens and component library, the
ingest/validation/seed tooling, and the voice adapter seam.

---

*How to regenerate: `npm ls --all` for the tree, or re-run the census script used
here. Re-check before any data room — dependency versions and licences change.*
