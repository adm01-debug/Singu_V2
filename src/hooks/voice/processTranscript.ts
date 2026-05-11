import { voiceFetch } from "./voiceFetch";
import type { VoiceAgentAction } from "./types";

 const VALID_ACTIONS = new Set(["search", "navigate", "answer", "create_interaction", "create_reminder", "create_relative"]);

/**
 * processVoiceTranscript — Sends a voice transcript to the AI edge function
 * and returns a structured VoiceAgentAction.
 *
 * Features:
 * - 15s abort timeout (via voiceFetch)
 * - Auto-retry on 401 with session refresh
 * - Strict action validation
 */
export async function processVoiceTranscript(transcript: string): Promise<VoiceAgentAction> {
  const sanitized = transcript.trim().slice(0, 1000);
  if (!sanitized) {
    return { action: "answer", response: "Não recebi nenhum comando. Pode repetir?", data: {} };
  }

  try {
    const response = await voiceFetch("voice-agent", { transcript: sanitized }, 15000);

    if (!response.ok) {
      const errorBody = await response.text().catch(() => "");
      throw new Error(`AI processing failed: ${response.status} ${errorBody}`);
    }

    const data = await response.json();
    return validateAction(data as VoiceAgentAction);
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") {
      throw new Error("timeout");
    }
    throw err;
  }
}

/**
 * validateAction — Ensures the AI response has a valid action and response string.
 * Falls back to a safe "answer" action if malformed.
 */
function validateAction(action: VoiceAgentAction): VoiceAgentAction {
  if (!action?.action || !action?.response || !VALID_ACTIONS.has(action.action)) {
    return {
      action: "answer",
      response: action?.response || "Desculpe, não entendi. Pode repetir?",
      data: {},
    };
  }
  return action;
}
