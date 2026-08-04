import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Icon } from "@/lib/icons";
import { useStore, type IoMode } from "@/store/useStore";
import { useAtlas } from "@/lib/useAtlas";
import { useSpeechInput } from "@/lib/useSpeech";
import { subscribeSpeaking } from "@/lib/voice";
import { atlasSpeak, atlasStopSpeaking } from "@/lib/voice/index";
import { renderMarkdown, stripMarkdown } from "@/lib/markdown";
import { useSpecialInterests } from "@/store/useCatalog";
import { useT } from "@/lib/i18n";
import { useCatalogName } from "@/lib/i18n-catalog";

// Atlas Guided-Flow WOW — the hero demo strip. Atlas points to one Well at a
// time; the traveler always taps for themselves. (Demo-hero: a single scripted
// choreography, built on the real focus→UI seam so it generalizes later.)
const HERO_WELLS = [
  { id: "fly", name: "Fly-Well", icon: "plane" },
  { id: "stay", name: "Stay-Well", icon: "bed" },
  { id: "eat", name: "Eat-Well", icon: "utensils" },
  { id: "move", name: "Move-Well", icon: "car" },
  { id: "activities", name: "Activities-Well", icon: "compass" },
];

export function Concierge() {
  const { io, setIo, journeySIs, region, trip, addToTrip, showToast } = useStore();
  const navigate = useNavigate();
  const t = useT();
  const ct = useCatalogName();
  const allSis = useSpecialInterests();
  // Live trip-interests offered as vision chips (skip the ultra overlay).
  const visionChoices = allSis.filter((s) => s.status === "live" && s.id !== "ultra").slice(0, 8);
  // Conversation lives in the store now (persists across navigation + reload).
  const { messages, busy, primed, dock, send, setMessages, setPrimed, open, collapse, reset } = useAtlas();
  const isOpen = dock === "open";
  const [input, setInput] = useState("");
  const bodyRef = useRef<HTMLDivElement>(null);

  // Atlas Guided-Flow WOW state: which Well Atlas is pointing to (pulses), the
  // spoken cue for screen readers, and the reveal after the traveler engages.
  const [heroActive, setHeroActive] = useState(false);
  const [heroFocus, setHeroFocus] = useState<string | null>(null);
  const [heroCue, setHeroCue] = useState("");
  const [heroReveal, setHeroReveal] = useState(false);
  const heroTimers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const clearHeroTimers = () => { heroTimers.current.forEach(clearTimeout); heroTimers.current = []; };
  useEffect(() => () => clearHeroTimers(), []);

  // Vision loop (moat #5): Atlas captures the dream, writes it back verbatim so
  // the traveler sees they were heard, then confirms before a single option.
  const [visionStage, setVisionStage] = useState<"off" | "ask" | "card" | "done">("off");
  const [visionDream, setVisionDream] = useState("");
  const [visionPicks, setVisionPicks] = useState<string[]>([]);
  const resetVision = () => { setVisionStage("off"); setVisionDream(""); setVisionPicks([]); };

  // Voice input — dictation into the composer, NOT auto-send. Tapping the mic
  // streams your words live into the input box; tapping stop (or saying "stop")
  // just ENDS the recording and leaves the text sitting in the box, so you read
  // it, fix any misheard word, and send it yourself. You stay in control of when
  // it goes to Atlas — the mic is a keyboard alternative, not a send button.
  const { supported: voiceSupported, listening, start: startVoice, stop: stopVoice } =
    useSpeechInput(setInput, (finalText) => { setInput(finalText.trim()); });
  const onMic = () => {
    if (listening) { stopVoice(); return; }
    if (!voiceSupported) { showToast("Voice input isn't supported in this browser yet — please type for now."); return; }
    atlasStopSpeaking(); // don't let Atlas talk over the traveler
    startVoice();
  };

  useEffect(() => {
    if (isOpen && bodyRef.current) bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
  }, [messages, busy, isOpen]);

  // The mirror: when the traveler chose to HEAR Atlas, speak each new reply
  // aloud (in their language) while the same text stays on screen. Routed through
  // the voice seam (atlasSpeak) — browser TTS by default, Cartesia/ElevenLabs via
  // VITE_TWW_MOUTH once wired; the UI never learns which mouth is talking.
  const lastSpokenRef = useRef(-1);
  useEffect(() => {
    if (io === "read" || !isOpen) return;
    const i = messages.length - 1;
    if (i < 0) return;
    const m = messages[i];
    if (m.role === "assistant" && i !== lastSpokenRef.current) {
      lastSpokenRef.current = i;
      atlasSpeak(stripMarkdown(m.content), useStore.getState().locale);
    }
  }, [messages, io, isOpen]);
  // Stop the voice when the panel closes.
  useEffect(() => { if (!isOpen) atlasStopSpeaking(); }, [isOpen]);

  // Speaking signal: track when Atlas's voice is actually playing so the message
  // he's reading can show a tiny animated "speaking" mark (the mirror of the
  // listening widget). Subscribes to the voice adapter — never to a TTS vendor.
  const [speaking, setSpeaking] = useState(false);
  useEffect(() => subscribeSpeaking(setSpeaking), []);

  function onSend(text: string) {
    const trimmed = text.trim();
    // Don't send an empty message, while Atlas is replying, or mid-dictation
    // (the transcript isn't final until you stop — stop, then send).
    if (!trimmed || busy || listening) return;
    atlasStopSpeaking();
    setInput("");
    // In the vision loop's "ask" stage, capture the dream and write it back
    // verbatim (Atlas heard every word) instead of routing to the model.
    if (visionStage === "ask") {
      const st = useStore.getState();
      st.addAtlasMessage({ role: "user", content: trimmed });
      setVisionDream(trimmed);
      setVisionStage("card");
      st.addAtlasMessage({ role: "assistant", content: t("vis.heard") });
      return;
    }
    void send(trimmed);
  }

  function begin(mode: "guided" | "conversation") {
    setPrimed(true);
    if (mode === "guided") {
      // The vision loop: ask for the dream, write it back, confirm, then plan.
      setVisionDream(""); setVisionPicks([]); setVisionStage("ask");
      setMessages([{ role: "assistant", content: t("vis.ask") }]);
    } else {
      resetVision();
      setMessages([]);
    }
  }

  // Confirm the written-back vision: seed the chosen interests, close the loop,
  // and offer the door into the plan (Atlas points; the traveler still chooses).
  function confirmVision() {
    const st = useStore.getState();
    visionPicks.forEach((id) => { if (!st.journeySIs.includes(id)) st.toggleSI(id); });
    setVisionStage("done");
    st.addAtlasMessage({ role: "assistant", content: t("vis.done") });
  }

  // Play the scripted hero choreography: Atlas speaks, then on his cue the
  // Stay-Well chip pulses. He points; the traveler chooses (never auto-clicks).
  function runHero() {
    clearHeroTimers();
    setPrimed(true);
    setMessages([]);
    setHeroReveal(false);
    setHeroFocus(null);
    setHeroCue("");
    setHeroActive(true);
    useStore.getState().setAtlasBusy(true);
    heroTimers.current.push(setTimeout(() => {
      useStore.getState().setAtlasBusy(false);
      useStore.getState().addAtlasMessage({ role: "assistant", content: "Alright — you've told me the dream. Now let's find where you'll rest your head. Look down here…" });
      setHeroFocus("stay");
      setHeroCue("Atlas is pointing to Stay-Well — select it to open.");
    }, 1400));
  }

  // The traveler taps the pulsing Well: the pulse stops the instant they engage,
  // and Atlas continues from inside it.
  function onWellTap(id: string) {
    if (!heroActive || heroFocus !== id) return; // only the pointed-to Well advances
    clearHeroTimers();
    setHeroFocus(null);
    setHeroCue("");
    useStore.getState().setAtlasBusy(true);
    heroTimers.current.push(setTimeout(() => {
      useStore.getState().setAtlasBusy(false);
      useStore.getState().addAtlasMessage({ role: "assistant", content: "Here's where I'd start for you — Angama Mara, perched right above the Mara Triangle. Want me to hold it in your trip?" });
      setHeroReveal(true);
    }, 1000));
  }

  const ioBtn = (mode: IoMode, label: string, icon?: string) => (
    <button data-io={mode} aria-pressed={io === mode} onClick={() => setIo(mode)}>
      {icon && <Icon name={icon} small />} {label}
    </button>
  );

  return (
    <>
      {/* Collapsed: Atlas stays beside you as a gentle pill — tap to reopen, full
          history intact. Shown whenever there's a live conversation to return to. */}
      {dock === "collapsed" && (
        <button className="tw-atlas-fab" aria-label="Open Atlas, your Concierge" onClick={open}>
          <Icon name="sparkles" />
          {messages.length > 0 && <span className="tw-atlas-fab__dot" aria-hidden="true" />}
        </button>
      )}

      <div className="tw-concierge" data-open={isOpen} role="dialog" aria-modal="false" aria-label="Speak with Atlas — your Concierge" aria-hidden={!isOpen} {...(isOpen ? {} : ({ inert: "" } as any))}>
        <div className="tw-concierge__head">
          <div className="tw-concierge__avatar"><Icon name="sparkles" /></div>
          <div style={{ flex: 1 }}>
            <div className="tw-concierge__title">Speak with Atlas</div>
            <div className="tw-concierge__sub"><span className="dot" /> Your Concierge · powered by Atlas</div>
          </div>
          {primed && messages.length > 0 && (
            <button className="tw-concierge__restart" aria-label="Start over" title="Start over" onClick={() => { reset(); setInput(""); clearHeroTimers(); setHeroActive(false); setHeroFocus(null); setHeroReveal(false); setHeroCue(""); resetVision(); }}>
              Start over
            </button>
          )}
          <button className="tw-iconbtn" aria-label="Close Concierge" title="Close" style={{ width: 36, height: 36, border: 0, background: "var(--surface-alt)" }} onClick={collapse}>
            <Icon name="close" small />
          </button>
        </div>

        <div className="tw-concierge__context">
          <span>Knows:</span>
          {journeySIs.length === 0 && region == null ? (
            <span className="ctx-chip">Anonymous · just browsing</span>
          ) : (
            <>
              {journeySIs.slice(0, 2).map((s) => <span key={s} className="ctx-chip">{s}</span>)}
              {region && <span className="ctx-chip">{region}</span>}
              <span className="ctx-chip">Trip · {trip.length} blocks</span>
            </>
          )}
        </div>

        <div className="tw-concierge__body" ref={bodyRef}>
          {!primed ? (
            <div className="tw-primer">
              <div className="tw-concierge__avatar"><Icon name="sparkles" /></div>
              <h3 style={{ fontSize: 20 }}>Hello — I'm Atlas, your Concierge.</h3>
              <p className="t-body-s" style={{ color: "var(--muted-foreground)", marginTop: 8, maxWidth: "34ch", marginInline: "auto" }}>
                I can plan from a single sentence, or just keep you company while you browse. You can <b>type or talk</b>, and I can <b>read or speak</b> back — your choice, remembered.
              </p>
              {/* Self-demonstrating language beat: a cold visitor witnesses the
                  multilingual moat on landing, no action needed. Arabic carries
                  its own dir/lang so it shapes + renders right-to-left in place.
                  aria-label states it plainly for anyone who can't see it. */}
              <div
                className="tw-langbeat"
                aria-label="Atlas speaks your language — English, Spanish, Arabic, Chinese, and French"
                style={{ display: "flex", flexWrap: "wrap", gap: 6, justifyContent: "center", alignItems: "center", marginTop: 14 }}
              >
                <span className="t-body-s" style={{ width: "100%", color: "var(--muted-foreground)", marginBottom: 2 }}>I speak your language, too —</span>
                {[
                  { t: "Hello", lang: "en", dir: "ltr" },
                  { t: "Hola", lang: "es", dir: "ltr" },
                  { t: "مرحباً", lang: "ar", dir: "rtl" },
                  { t: "你好", lang: "zh", dir: "ltr" },
                  { t: "Bonjour", lang: "fr", dir: "ltr" },
                ].map((g) => (
                  <span
                    key={g.lang}
                    lang={g.lang}
                    dir={g.dir as "ltr" | "rtl"}
                    style={{ padding: "2px 10px", border: "1px solid var(--border)", borderRadius: 999, fontSize: 13, lineHeight: 1.6 }}
                  >
                    {g.t}
                  </span>
                ))}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 18 }}>
                <button className="btn btn-primary" onClick={() => begin("guided")}>Walk me through it</button>
                {/* The "build your own" door: clears the pre-loaded Safari journey so
                    Atlas follows the traveler anywhere — beside the scripted demo below. */}
                <button className="btn btn-secondary" onClick={() => { useStore.getState().resetJourney(); begin("conversation"); showToast("Fresh start — tell me anywhere you'd like to go."); }}>
                  Build your own trip — go anywhere
                </button>
                <button className="btn btn-secondary" style={{ borderColor: "var(--gold-deep)", color: "var(--gold-deep)" }} onClick={runHero}>
                  <Icon name="sparkles" small /> See how Atlas guides you
                </button>
              </div>
              <div className="tw-stop-row"><Icon name="check" small /> You're in control — Atlas suggests, and never books for you.</div>
            </div>
          ) : (
            <>
              {messages.length === 0 && (
                <div className="tw-msg tw-msg--bot">
                  Tell me your dream in a sentence — “a safari for our anniversary in July” — and I'll start shaping it. I never book for you; you always choose.
                </div>
              )}
              {messages.map((m, i) => {
                const isSpokenNow = speaking && m.role !== "user" && i === messages.length - 1;
                return (
                  <div key={i} className={`tw-msg tw-msg--${m.role === "user" ? "user" : "bot"}`}>
                    {m.role === "user" ? m.content : renderMarkdown(m.content)}
                    {isSpokenNow && (
                      <button
                        type="button"
                        className="tw-speaking"
                        aria-label="Atlas is speaking — tap to stop"
                        title="Speaking… tap to stop"
                        onClick={() => atlasStopSpeaking()}
                      >
                        <i /><i /><i />
                      </button>
                    )}
                  </div>
                );
              })}
              {busy && (
                <div className="tw-msg tw-msg--bot">
                  <span className="tw-typing"><span /><span /><span /></span>
                </div>
              )}
              {heroActive && (
                <div className="tw-wells-strip" role="group" aria-label="Atlas is guiding you through the Wells">
                  {HERO_WELLS.map((w) => (
                    <button
                      key={w.id}
                      type="button"
                      className={"tw-well-chip" + (heroFocus === w.id ? " is-pulsing" : "")}
                      aria-label={w.name + (heroFocus === w.id ? " — Atlas is pointing here, select to open" : "")}
                      onClick={() => onWellTap(w.id)}
                    >
                      <Icon name={w.icon} small /> {w.name}
                    </button>
                  ))}
                </div>
              )}
              {/* Accessible spine: Atlas's spoken direction, announced for anyone
                  who can't perceive the pulse (WCAG AA standing canon). */}
              <div role="status" aria-live="assertive" style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(0 0 0 0)", whiteSpace: "nowrap" }}>{heroCue}</div>
              {heroReveal && (
                <div className="tw-hero-reveal">
                  <Icon name="bed" small />
                  <div style={{ flex: 1 }}><b>Angama Mara</b><div className="t-body-s" style={{ color: "var(--muted-foreground)" }}>Stay-Well · suggested by Atlas</div></div>
                  <button className="btn btn-primary" style={{ height: 40 }} onClick={() => { addToTrip({ well: "stay", icon: "bed", name: "Angama Mara", meta: "Stay-Well · suggested by Atlas", status: "idea" }); showToast("Held in your trip — you always choose, and you always book."); }}>Hold it</button>
                </div>
              )}
              {(visionStage === "card" || visionStage === "done") && (
                <div className="tw-vision">
                  <div className="tw-vision__dream">
                    <span className="tw-vision__label">{t("vis.dreamLabel")}</span>
                    <p>“{visionDream}”</p>
                  </div>
                  <div className="tw-vision__label">{t("vis.pickPrompt")}</div>
                  <div className="tw-wells-strip" role="group" aria-label={t("vis.pickPrompt")}>
                    {visionChoices.map((s) => {
                      const on = visionPicks.includes(s.id);
                      return (
                        <button
                          key={s.id}
                          type="button"
                          className={"tw-well-chip" + (on ? " is-picked" : "")}
                          aria-pressed={on}
                          disabled={visionStage === "done"}
                          onClick={() => setVisionPicks((p) => (p.includes(s.id) ? p.filter((x) => x !== s.id) : [...p, s.id]))}
                        >
                          {ct(`si.${s.id}.name`, s.name)}
                        </button>
                      );
                    })}
                  </div>
                  {visionStage === "card" && (
                    <button className="btn btn-primary" style={{ alignSelf: "flex-start" }} onClick={confirmVision}>
                      <Icon name="check" small /> {t("vis.confirm")}
                    </button>
                  )}
                  {visionStage === "done" && (
                    <button className="btn btn-primary" style={{ alignSelf: "flex-start" }} onClick={() => { collapse(); navigate("/regions"); }}>
                      {t("vis.cta")} <Icon name="arrow" small />
                    </button>
                  )}
                </div>
              )}
              {!heroActive && !busy && messages.length > 0 && messages[messages.length - 1].role === "assistant" && (
                <button
                  className="btn btn-ghost" style={{ alignSelf: "flex-start" }}
                  onClick={() => addToTrip({ well: "stay", icon: "bed", name: "Angama Mara", meta: "Stay-Well · suggested by Atlas", status: "idea" })}
                >
                  + Add a suggested stay to my trip
                </button>
              )}
            </>
          )}
        </div>

        <div className="tw-concierge__foot">
          <div className="tw-io-toggle" role="group" aria-label="How should I respond?">
            {ioBtn("read", t("io.read"), "read")}
            {ioBtn("hear", t("io.hear"), "sound")}
            {ioBtn("both", t("io.both"))}
          </div>
          {primed && !listening && (
            <div className="t-body-s" style={{ color: "var(--muted-foreground)", fontSize: 12.5, margin: "2px 2px 6px" }}>{t("atlas.cue")}</div>
          )}
          {listening && (
            <div className="tw-listening-live" role="status" aria-live="polite">
              <span className="tw-listen-orb" aria-hidden="true"><Icon name="mic" /></span>
              <span className="tw-wave" aria-hidden="true">{Array.from({ length: 6 }).map((_, i) => <i key={i} style={{ animationDelay: `${i * 0.09}s` }} />)}</span>
              <span className="tw-listen-copy"><b>Listening…</b> tap stop when you're done — your words are in the box, then you send.</span>
            </div>
          )}
          <div className="tw-input">
            <input
              type="text" placeholder={listening ? "Listening… speak now" : "Ask me anything — in English · Español · العربية · 中文 · Français"} aria-label="Message Atlas — ask in English, Spanish, Arabic, Chinese, or French"
              value={input} onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") onSend(input); }}
            />
            <button className="tw-input__mic" aria-label={listening ? "Stop recording" : "Talk instead of type"} aria-pressed={listening} onClick={onMic}><Icon name={listening ? "stop" : "mic"} /></button>
            <button className="tw-input__send" aria-label="Send" disabled={listening || busy} onClick={() => onSend(input)}><Icon name="send" small /></button>
          </div>
          <div className="tw-stop-row"><Icon name="check" small /> You're in control — Atlas suggests, and never books for you.</div>
        </div>
      </div>
    </>
  );
}
