import { useCallback, useRef, useEffect } from "react";
import { useScribe, CommitStrategy } from "@elevenlabs/react";
import { supabase } from "@/integrations/supabase/client";
import { useVoiceState } from "./voice/useVoiceState";
import { useTranscriptProcessor } from "./voice/useTranscriptProcessor";
import { friendlyErrorMessage } from "./voice/retry";
import { logger } from "@/lib/logger";
import type { UseVoiceAgentOptions } from "./voice/types";

export type { VoiceAgentAction, VoiceAgentPhase } from "./voice/types";

const SESSION_START_TIMEOUT_MS = 8000;
const SCRIBE_CONNECT_OPTIONS = {
  modelId: "scribe_v2_realtime",
  microphone: {
    echoCancellation: true,
    noiseSuppression: true,
    autoGainControl: true,
  },
} as const;

export function useVoiceAgent({ onAction, onError }: UseVoiceAgentOptions = {}) {
  const state = useVoiceState();
  const {
    phase, setPhase, partialTranscript, setPartialTranscript,
    finalTranscript, agentResponse, error, currentAction,
    setError, isStartingRef, clearResetPhaseTimer,
    clearSessionStartTimer, scheduleIdleReset, resetAll,
    sessionStartTimerRef,
  } = state;

  const { processTranscript, stopSpeaking, stopSpeakingRef } = useTranscriptProcessor({
    ...state,
    onAction,
    onError,
  });

  const disconnectScribeRef = useRef<() => void>(() => undefined);
  const processTranscriptRef = useRef(processTranscript);
  useEffect(() => { processTranscriptRef.current = processTranscript; }, [processTranscript]);

  const forceDisconnectScribe = useCallback(() => {
    clearSessionStartTimer();
    try {
      disconnectScribeRef.current();
    } catch (e) {
      logger.warn("[Voice] Failed to disconnect Scribe:", e);
    }
  }, [clearSessionStartTimer]);

  const handleScribeErrorRef = useRef<(err: unknown) => void>(() => undefined);

  const scribe = useScribe({
    modelId: "scribe_v2_realtime",
    commitStrategy: CommitStrategy.VAD,
    onConnect: () => logger.log("[Voice] Scribe socket connected"),
    onSessionStarted: () => {
      logger.log("[Voice] Scribe session started");
      isStartingRef.current = false;
      clearResetPhaseTimer();
      clearSessionStartTimer();
      setError(null);
      setPhase("listening");
    },
    onDisconnect: () => {
      logger.log("[Voice] Scribe disconnected");
      isStartingRef.current = false;
      clearSessionStartTimer();
      setPartialTranscript("");
      setPhase((current) =>
        current === "processing" || current === "speaking" || current === "error"
          ? current
          : "idle"
      );
    },
    onError: (err: unknown) => handleScribeErrorRef.current(err),
    onPartialTranscript: (data: { text: string }) => setPartialTranscript(data.text),
    onCommittedTranscript: (data: { text: string }) => {
      if (data.text.trim()) {
        setPartialTranscript("");
        processTranscriptRef.current(data.text.trim());
      }
    },
  });

  disconnectScribeRef.current = () => scribe.disconnect();

  const handleScribeError = useCallback((err: unknown) => {
    logger.error("[Voice] Scribe runtime error:", err);
    isStartingRef.current = false;
    clearResetPhaseTimer();
    clearSessionStartTimer();
    forceDisconnectScribe();
    setPartialTranscript("");

    const message = friendlyErrorMessage(err);
    setError(message);
    setPhase("error");
    scheduleIdleReset();
  }, [clearResetPhaseTimer, clearSessionStartTimer, forceDisconnectScribe, scheduleIdleReset, setError, setPhase, setPartialTranscript, isStartingRef]);

  useEffect(() => { handleScribeErrorRef.current = handleScribeError; }, [handleScribeError]);

  const startListening = useCallback(async () => {
    const scribeStatus = scribe.status ?? "disconnected";
    if (isStartingRef.current || scribeStatus === "connecting") return;

    clearResetPhaseTimer();
    clearSessionStartTimer();

    if (scribeStatus !== "disconnected" || scribe.isConnected) {
      forceDisconnectScribe();
    }

    isStartingRef.current = true;
    setError(null);
    setPartialTranscript("");
    setPhase("idle");

    try {
      const { data, error: tokenError } = await supabase.functions.invoke("elevenlabs-scribe-token");
      if (tokenError || !data?.token) {
        logger.error("[Voice] Token error:", tokenError);
        throw new Error("Não foi possível obter token de transcrição");
      }

      logger.log("[Voice] Token obtained, connecting to Scribe...");

      sessionStartTimerRef.current = setTimeout(() => {
        if (!isStartingRef.current) return;
        handleScribeError(new Error("Scribe session start timeout"));
      }, SESSION_START_TIMEOUT_MS);

      await scribe.connect({
        token: data.token,
        ...SCRIBE_CONNECT_OPTIONS,
      });

      logger.log("[Voice] Scribe connection initiated");
    } catch (err) {
      isStartingRef.current = false;
      clearSessionStartTimer();
      logger.error("[Voice] startListening error:", err);
      const message = friendlyErrorMessage(err);
      setError(message);
      setPhase("error");
      scheduleIdleReset();
    }
  }, [clearResetPhaseTimer, clearSessionStartTimer, forceDisconnectScribe, handleScribeError, scheduleIdleReset, scribe, setError, setPhase, setPartialTranscript, isStartingRef, sessionStartTimerRef]);

  const stopListening = useCallback(() => {
    isStartingRef.current = false;
    clearResetPhaseTimer();
    clearSessionStartTimer();
    try { scribe.disconnect(); } catch { /* desconexão best-effort */ }

    if (phase === "listening") {
      if (partialTranscript.trim()) {
        processTranscript(partialTranscript.trim());
      } else {
        setPhase("idle");
      }
    } else if (phase !== "processing" && phase !== "speaking") {
      setPhase("idle");
    }
  }, [clearResetPhaseTimer, clearSessionStartTimer, partialTranscript, phase, processTranscript, scribe, setPhase, isStartingRef]);

  const reset = useCallback(() => {
    try { scribe.disconnect(); } catch { /* desconexão best-effort */ }
    stopSpeakingRef.current?.();
    stopSpeakingRef.current = null;
    resetAll();
  }, [scribe, resetAll, stopSpeakingRef]);

  useEffect(() => {
    return () => {
      clearResetPhaseTimer();
      clearSessionStartTimer();
      try { disconnectScribeRef.current(); } catch { /* desconexão best-effort */ }
      stopSpeakingRef.current?.();
      stopSpeakingRef.current = null;
    };
  }, [clearResetPhaseTimer, clearSessionStartTimer, stopSpeakingRef]);

  return {
    phase,
    partialTranscript,
    finalTranscript,
    agentResponse,
    error,
    currentAction,
    isConnected: scribe.isConnected,
    startListening,
    stopListening,
    stopSpeaking,
    reset,
  };
}
