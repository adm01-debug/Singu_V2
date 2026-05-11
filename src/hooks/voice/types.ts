/**
 * Voice Agent Action — Structured command returned by AI after processing a transcript.
 * Each action maps to a specific UI behavior in the application.
 */
export interface VoiceAgentAction {
  /** The type of action to execute */
   action: "search" | "navigate" | "answer" | "create_interaction" | "create_reminder" | "create_relative";
     /** Relative info (for action="create_relative") */
     relative?: {
       name?: string;
       relationship?: string;
       occupation?: string;
     };
  /** Friendly response text to speak back to the user via TTS */
  response: string;
  /** Additional data payload for the action */
  data?: {
    /** Search query string (for action="search") */
    query?: string;
    /** Navigation route path (for action="navigate") */
    route?: string;
    /** Contact name referenced in the command */
    contactName?: string;
    /** Optional search filters */
    filters?: {
      tag?: string;
      company?: string;
      sentiment?: string;
    };
  };
}

/**
 * Voice Agent Phase — Represents the current state of the voice assistant lifecycle.
 * - idle: Ready, waiting for user interaction
 * - listening: Microphone active, capturing speech
 * - processing: AI is interpreting the transcript
 * - speaking: TTS is playing the response
 * - error: An error occurred, will auto-reset
 */
export type VoiceAgentPhase = "idle" | "listening" | "processing" | "speaking" | "error";

/**
 * UseVoiceAgentOptions — Configuration for the useVoiceAgent hook.
 */
export interface UseVoiceAgentOptions {
  /** Callback fired when an action is successfully processed */
  onAction?: (action: VoiceAgentAction) => void;
  /** Callback fired when an error occurs during any phase */
  onError?: (error: string) => void;
}
