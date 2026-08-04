import { useCallback, useRef, useEffect } from "react";
import { playTtsAudio } from "./playTtsAudio";
import { processVoiceTranscript } from "./processTranscript";
import { withRetry, friendlyErrorMessage } from "./retry";
import { logVoiceCommand } from "./logVoiceCommand";
import type { VoiceAgentAction, VoiceAgentPhase } from "./types";

const PROCESSING_ERROR_RESET_DELAY_MS = 3000;

interface TranscriptProcessorDeps {
  setPhase: (phase: VoiceAgentPhase) => void;
  setFinalTranscript: (text: string) => void;
  setAgentResponse: (text: string) => void;
  setCurrentAction: (action: VoiceAgentAction | null) => void;
  setError: (error: string | null) => void;
  isProcessingRef: React.MutableRefObject<boolean>;
  clearResetPhaseTimer: () => void;
  scheduleIdleReset: (delay?: number) => void;
  onAction?: (action: VoiceAgentAction) => void;
  onError?: (error: string) => void;
}

export function useTranscriptProcessor(deps: TranscriptProcessorDeps) {
  const {
    setPhase, setFinalTranscript, setAgentResponse, setCurrentAction,
    setError, isProcessingRef, clearResetPhaseTimer, scheduleIdleReset,
  } = deps;

  const onActionRef = useRef(deps.onAction);
  const onErrorRef = useRef(deps.onError);
  useEffect(() => { onActionRef.current = deps.onAction; }, [deps.onAction]);
  useEffect(() => { onErrorRef.current = deps.onError; }, [deps.onError]);

  const stopSpeakingRef = useRef<(() => void) | null>(null);

  const processTranscript = useCallback(async (text: string) => {
    if (isProcessingRef.current || !text.trim()) return;

    clearResetPhaseTimer();
    isProcessingRef.current = true;
    setPhase("processing");
    setFinalTranscript(text);
    setAgentResponse("");
    const startTime = Date.now();

    try {
      const action = await withRetry(() => processVoiceTranscript(text));
      setCurrentAction(action);
      setAgentResponse(action.response);

      if (action.response) {
        setPhase("speaking");
        try {
          const { promise, stop } = playTtsAudio(action.response);
          stopSpeakingRef.current = stop;
          await promise;
        } catch {
          // TTS failure is non-critical
        } finally {
          stopSpeakingRef.current = null;
        }
      }

      logVoiceCommand(action, {
        transcript: text,
        durationMs: Date.now() - startTime,
        success: true,
      });

      setPhase("idle");
      onActionRef.current?.(action);
    } catch (err) {
      const message = friendlyErrorMessage(err);
      setError(message);
      setPhase("error");
      onErrorRef.current?.(message);

      logVoiceCommand(
        { action: "answer", response: message, data: {} },
        { transcript: text, durationMs: Date.now() - startTime, success: false }
      );

      scheduleIdleReset(PROCESSING_ERROR_RESET_DELAY_MS);
    } finally {
      isProcessingRef.current = false;
    }
  }, [clearResetPhaseTimer, scheduleIdleReset, setPhase, setFinalTranscript, setAgentResponse, setCurrentAction, setError, isProcessingRef]);

  const stopSpeaking = useCallback(() => {
    clearResetPhaseTimer();
    stopSpeakingRef.current?.();
    stopSpeakingRef.current = null;
    setPhase("idle");
  }, [clearResetPhaseTimer, setPhase]);

  return { processTranscript, stopSpeaking, stopSpeakingRef };
}
