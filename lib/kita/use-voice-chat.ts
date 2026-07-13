"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { fetchKitaConversation, sendKitaMessage, type TalkPayload } from "./submit-message";

export type VoiceChatState = "idle" | "listening" | "thinking" | "speaking";

interface SpeechRecognitionAlternativeLike {
  transcript: string;
  confidence: number;
}

interface SpeechRecognitionResultLike {
  isFinal: boolean;
  length: number;
  [index: number]: SpeechRecognitionAlternativeLike;
}

interface SpeechRecognitionEventLike extends Event {
  resultIndex: number;
  results: ArrayLike<SpeechRecognitionResultLike>;
}

interface SpeechRecognitionErrorEventLike extends Event {
  error: string;
}

interface SpeechRecognitionLike extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onend: (() => void) | null;
  onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null;
  onstart: (() => void) | null;
}

type SpeechRecognitionCtor = new () => SpeechRecognitionLike;

const SILENCE_TIMEOUT_MS = 1200;
const SPEAKING_PULSE_DECAY = 0.85;

function getSpeechRecognitionCtor(): SpeechRecognitionCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

function isSpeechSynthesisSupported(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

function pickBestVoice(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | null {
  if (voices.length === 0) return null;
  const lang = typeof navigator !== "undefined" ? navigator.language : "en-US";
  const scored = voices
    .map((voice) => {
      let score = 0;
      if (!voice.localService) score += 2;
      if (voice.lang === lang) score += 2;
      else if (voice.lang?.startsWith(lang.split("-")[0])) score += 1;
      if (/natural|neural|enhanced|premium/i.test(voice.name)) score += 2;
      return { voice, score };
    })
    .sort((a, b) => b.score - a.score);
  return scored[0]?.voice ?? null;
}

export interface UseVoiceChatOptions {
  onMessagesUpdated: (payload: TalkPayload) => void;
  onError?: (message: string) => void;
}

export interface UseVoiceChatResult {
  isSupported: boolean;
  active: boolean;
  state: VoiceChatState;
  interimTranscript: string;
  audioLevel: number;
  speakingPulse: number;
  permissionDenied: boolean;
  start: () => void;
  stop: () => void;
}

export function useVoiceChat({ onMessagesUpdated, onError }: UseVoiceChatOptions): UseVoiceChatResult {
  const recognitionSupported = getSpeechRecognitionCtor() !== null;
  const synthesisSupported = isSpeechSynthesisSupported();
  const isSupported = recognitionSupported && synthesisSupported;

  const [active, setActive] = useState(false);
  const [state, setState] = useState<VoiceChatState>("idle");
  const [interimTranscript, setInterimTranscript] = useState("");
  const [audioLevel, setAudioLevel] = useState(0);
  const [speakingPulse, setSpeakingPulse] = useState(0);
  const [permissionDenied, setPermissionDenied] = useState(false);

  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const meterFrameRef = useRef<number | null>(null);
  const speakingFrameRef = useRef<number | null>(null);
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const finalTranscriptRef = useRef("");
  const activeRef = useRef(false);
  const voiceRef = useRef<SpeechSynthesisVoice | null>(null);

  useEffect(() => {
    if (!synthesisSupported) return;
    function loadVoices() {
      voiceRef.current = pickBestVoice(window.speechSynthesis.getVoices());
    }
    loadVoices();
    window.speechSynthesis.addEventListener("voiceschanged", loadVoices);
    return () => window.speechSynthesis.removeEventListener("voiceschanged", loadVoices);
  }, [synthesisSupported]);

  const stopAudioMeter = useCallback(() => {
    if (meterFrameRef.current !== null) {
      cancelAnimationFrame(meterFrameRef.current);
      meterFrameRef.current = null;
    }
    analyserRef.current = null;
    if (audioContextRef.current) {
      void audioContextRef.current.close().catch(() => undefined);
      audioContextRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setAudioLevel(0);
  }, []);

  const runAudioMeter = useCallback(() => {
    const analyser = analyserRef.current;
    if (!analyser) return;
    const buffer = new Uint8Array(analyser.frequencyBinCount);

    function tick() {
      if (!analyserRef.current) return;
      analyserRef.current.getByteTimeDomainData(buffer);
      let sumSquares = 0;
      for (let i = 0; i < buffer.length; i += 1) {
        const normalized = (buffer[i] - 128) / 128;
        sumSquares += normalized * normalized;
      }
      const rms = Math.sqrt(sumSquares / buffer.length);
      setAudioLevel(Math.min(1, rms * 4));
      meterFrameRef.current = requestAnimationFrame(tick);
    }
    tick();
  }, []);

  const stopSpeakingPulse = useCallback(() => {
    if (speakingFrameRef.current !== null) {
      cancelAnimationFrame(speakingFrameRef.current);
      speakingFrameRef.current = null;
    }
    setSpeakingPulse(0);
  }, []);

  const bumpSpeakingPulse = useCallback(() => {
    setSpeakingPulse(1);
    if (speakingFrameRef.current !== null) return;
    function decay() {
      setSpeakingPulse((current) => {
        const next = current * SPEAKING_PULSE_DECAY;
        if (next < 0.02) {
          speakingFrameRef.current = null;
          return 0;
        }
        speakingFrameRef.current = requestAnimationFrame(decay);
        return next;
      });
    }
    speakingFrameRef.current = requestAnimationFrame(decay);
  }, []);

  const speak = useCallback(
    (text: string): Promise<void> =>
      new Promise((resolve) => {
        if (!synthesisSupported || !text.trim()) {
          resolve();
          return;
        }
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        if (voiceRef.current) utterance.voice = voiceRef.current;
        utterance.rate = 1;
        utterance.pitch = 1;
        utterance.onboundary = () => bumpSpeakingPulse();
        utterance.onstart = () => setState("speaking");
        utterance.onend = () => {
          stopSpeakingPulse();
          resolve();
        };
        utterance.onerror = () => {
          stopSpeakingPulse();
          resolve();
        };
        window.speechSynthesis.speak(utterance);
      }),
    [bumpSpeakingPulse, stopSpeakingPulse, synthesisSupported],
  );

  const beginListening = useCallback(() => {
    const recognition = recognitionRef.current;
    if (!recognition || !activeRef.current) return;
    finalTranscriptRef.current = "";
    setInterimTranscript("");
    setState("listening");
    try {
      recognition.start();
    } catch {
      // already started; ignore
    }
  }, []);

  const submitTranscript = useCallback(
    async (transcript: string) => {
      const trimmed = transcript.trim();
      if (!trimmed) {
        if (activeRef.current) beginListening();
        return;
      }

      setState("thinking");
      setInterimTranscript("");

      try {
        const payload = await sendKitaMessage(trimmed);
        onMessagesUpdated(payload);
        const lastAssistant = [...payload.messages].reverse().find((m) => m.role === "assistant");
        if (lastAssistant) await speak(lastAssistant.content);
      } catch (submitError) {
        onError?.(
          submitError instanceof Error
            ? submitError.message
            : "Kita couldn't reply just now. Please try again.",
        );
      }

      if (activeRef.current) beginListening();
      else setState("idle");
    },
    [beginListening, onError, onMessagesUpdated, speak],
  );

  const setupRecognition = useCallback(() => {
    const Ctor = getSpeechRecognitionCtor();
    if (!Ctor) return null;
    const recognition = new Ctor();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = typeof navigator !== "undefined" ? navigator.language : "en-US";

    recognition.onresult = (event) => {
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const result = event.results[i];
        const transcript = result[0]?.transcript ?? "";
        if (result.isFinal) {
          finalTranscriptRef.current = `${finalTranscriptRef.current} ${transcript}`.trim();
        } else {
          interim += transcript;
        }
      }
      setInterimTranscript(interim);

      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = setTimeout(() => {
        if (!activeRef.current) return;
        recognitionRef.current?.stop();
      }, SILENCE_TIMEOUT_MS);
    };

    recognition.onerror = (event) => {
      if (event.error === "not-allowed" || event.error === "permission-denied") {
        setPermissionDenied(true);
        activeRef.current = false;
        setActive(false);
        setState("idle");
      }
    };

    recognition.onend = () => {
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
        silenceTimerRef.current = null;
      }
      if (!activeRef.current) {
        setState("idle");
        return;
      }
      void submitTranscript(finalTranscriptRef.current);
    };

    return recognition;
  }, [submitTranscript]);

  const start = useCallback(() => {
    if (!isSupported || activeRef.current) return;
    setPermissionDenied(false);
    activeRef.current = true;
    setActive(true);

    void (async () => {
      try {
        await fetchKitaConversation();
      } catch {
        // conversation likely already loaded by the panel; safe to continue
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        streamRef.current = stream;
        const AudioContextCtor =
          window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
        if (AudioContextCtor) {
          const context = new AudioContextCtor();
          const source = context.createMediaStreamSource(stream);
          const analyser = context.createAnalyser();
          analyser.fftSize = 512;
          source.connect(analyser);
          audioContextRef.current = context;
          analyserRef.current = analyser;
          runAudioMeter();
        }
      } catch {
        setPermissionDenied(true);
        activeRef.current = false;
        setActive(false);
        setState("idle");
        return;
      }

      recognitionRef.current = setupRecognition();
      if (!recognitionRef.current) {
        setPermissionDenied(true);
        activeRef.current = false;
        setActive(false);
        return;
      }
      beginListening();
    })();
  }, [beginListening, isSupported, runAudioMeter, setupRecognition]);

  const stop = useCallback(() => {
    activeRef.current = false;
    setActive(false);
    setState("idle");
    setInterimTranscript("");
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
    recognitionRef.current?.abort();
    recognitionRef.current = null;
    if (synthesisSupported) window.speechSynthesis.cancel();
    stopSpeakingPulse();
    stopAudioMeter();
  }, [stopAudioMeter, stopSpeakingPulse, synthesisSupported]);

  useEffect(() => () => stop(), [stop]);

  return {
    isSupported,
    active,
    state,
    interimTranscript,
    audioLevel,
    speakingPulse,
    permissionDenied,
    start,
    stop,
  };
}
