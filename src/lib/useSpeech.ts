/**
 * TravelWell.World — voice input (Web Speech API).
 *
 * Browser-native speech-to-text: free, no key, no server, runs on-device. Used
 * by the Atlas concierge and (later) onboarding so a traveler can speak answers
 * instead of typing — David's "speak AND type, interchangeably" requirement.
 *
 * Degrades cleanly: `supported` is false where the API isn't available
 * (Firefox, some iOS) so the UI can fall back to typing rather than pretend to
 * listen. Transcripts stream into the caller's text field as the person speaks.
 *
 * The Web Speech API isn't in the standard TS DOM lib, so we model the minimal
 * shape we use.
 */
import { useCallback, useRef, useState } from "react";

interface SpeechAlt { transcript: string }
interface SpeechResult { 0: SpeechAlt }
interface SpeechEvent { results: ArrayLike<SpeechResult> }
/** `error` is the SpeechRecognitionErrorEvent code: not-allowed, service-not-allowed,
 *  network, no-speech, audio-capture, aborted … */
interface SpeechErrorEvent { error?: string }
interface Recognition {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((e: SpeechEvent) => void) | null;
  onerror: ((e: SpeechErrorEvent) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
}
type RecognitionCtor = new () => Recognition;

/** Plain-language causes — what a traveler (or Sana at 2am) can act on. */
const SPEECH_ERRORS: Record<string, string> = {
  "not-allowed": "Microphone blocked. Allow mic access for this site, and check macOS System Settings → Privacy & Security → Microphone.",
  "service-not-allowed": "This browser won't allow speech recognition. Chrome handles it best — or just type.",
  "audio-capture": "No microphone found. Check your input device, then try again.",
  network: "Speech recognition needs a network connection and couldn't reach it.",
  "no-speech": "I didn't catch anything — try again a little closer to the mic.",
  aborted: "Voice input was interrupted.",
};

// Trailing spoken stop command (optionally "ok"/"atlas" prefixed, "listening"/"recording" suffixed).
const STOP_CMD = /(?:^|\s)(?:ok(?:ay)?\s+)?(?:atlas\s+)?stop(?:\s+(?:listening|recording))?[.!?]*$/i;

function getCtor(): RecognitionCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as { SpeechRecognition?: RecognitionCtor; webkitSpeechRecognition?: RecognitionCtor };
  return w.SpeechRecognition || w.webkitSpeechRecognition || null;
}

/**
 * @param onText    called on every interim result with the running transcript,
 *                  so the UI can stream what's being heard live into the input.
 * @param onFinish  called once when recording ends (stop button, spoken "stop",
 *                  or natural end) with the FINAL, cleaned transcript. This is
 *                  dictation, not auto-send: the caller drops the text into the
 *                  composer and leaves it there — the traveler reviews it and
 *                  sends it themselves. The mic is a keyboard alternative.
 */
export function useSpeechInput(
  onText: (text: string) => void,
  onFinish?: (text: string) => void,
  lang = "en-US",
  /** Called with a human-readable reason when recognition fails. Without this the
   *  mic just stops looking like it's listening and nobody knows why — which is
   *  exactly the wrong failure mode in front of a room. */
  onError?: (reason: string) => void,
) {
  const [listening, setListening] = useState(false);
  const recRef = useRef<Recognition | null>(null);
  const finalRef = useRef("");
  // Keep callbacks in refs so `start` stays stable yet always calls the latest
  // closures (avoids sending against a stale `messages` array).
  const onTextRef = useRef(onText);
  const onFinishRef = useRef(onFinish);
  const onErrorRef = useRef(onError);
  onTextRef.current = onText;
  onFinishRef.current = onFinish;
  onErrorRef.current = onError;
  const supported = !!getCtor();

  const stop = useCallback(() => {
    // Triggers `onend`, which fires onFinish — a single, consistent finish path.
    recRef.current?.stop();
  }, []);

  const start = useCallback(() => {
    const Ctor = getCtor();
    if (!Ctor) return false;
    const rec = new Ctor();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = lang;
    finalRef.current = "";
    rec.onresult = (e) => {
      let raw = "";
      for (let i = 0; i < e.results.length; i++) raw += e.results[i][0].transcript;
      const text = raw.replace(/\s+/g, " ").trim();
      // Spoken "stop" ends recording (in addition to the Done button). Matches a
      // trailing "stop" / "ok stop" / "atlas stop" / "stop listening" and strips
      // it so the command word never lands in the message.
      if (STOP_CMD.test(text)) {
        const cleaned = text.replace(STOP_CMD, "").trim();
        finalRef.current = cleaned;
        onTextRef.current(cleaned);
        rec.stop();
        return;
      }
      finalRef.current = text;
      onTextRef.current(text);
    };
    rec.onend = () => {
      setListening(false);
      recRef.current = null;
      onFinishRef.current?.(finalRef.current);
    };
    rec.onerror = (e) => {
      setListening(false);
      recRef.current = null;
      const code = e?.error ?? "unknown";
      // eslint-disable-next-line no-console
      console.warn("[voice] speech recognition error:", code);
      onErrorRef.current?.(SPEECH_ERRORS[code] ?? `Voice input stopped (${code}).`);
    };
    recRef.current = rec;
    rec.start();
    setListening(true);
    return true;
  }, [lang]);

  return { supported, listening, start, stop };
}
