import { logger } from "@/lib/logger";
import type { VoiceAgentAction } from "./types";

/**
 * logVoiceCommand — Logs a voice command for analytics and debugging.
 * Fire-and-forget — never throws.
 *
 * @param action - The parsed voice action
 * @param meta.transcript - The original user transcript
 * @param meta.durationMs - Total processing time in milliseconds
 * @param meta.success - Whether the command was successfully processed
 */
export function logVoiceCommand(
  action: VoiceAgentAction,
  meta: { transcript: string; durationMs?: number; success?: boolean }
): void {
  try {
    logger.log("[Voice] Command:", {
      action: action.action,
      transcript: meta.transcript,
      durationMs: meta.durationMs,
      success: meta.success,
    });
  } catch {
    // Silent — logging must never break the voice flow
  }
}
