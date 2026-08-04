import { logger } from "@/lib/logger";
import { getAuthToken, refreshAuthToken } from "./auth";

/**
 * voiceFetch — Authenticated fetch wrapper for voice edge functions.
 *
 * Features:
 * - Attaches auth token + apikey headers automatically
 * - Auto-retries once on 401 with refreshed session token
 * - Configurable AbortController timeout
 *
 * @param path  Edge function path (e.g. "voice-agent", "elevenlabs-tts")
 * @param body  JSON-serialisable request body
 * @param timeoutMs  Abort timeout in milliseconds (default 15 000)
 * @returns The raw Response object
 */
export async function voiceFetch(
  path: string,
  body: Record<string, unknown>,
  timeoutMs = 15000,
): Promise<Response> {
  const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/${path}`;
  const apikey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

  const authToken = await getAuthToken();

  const makeRequest = (token: string, signal: AbortSignal) =>
    fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey,
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
      signal,
    });

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    let response = await makeRequest(authToken, controller.signal);

    if (response.status === 401) {
      logger.warn(`[voiceFetch] 401 on ${path}, refreshing session…`);
      const newToken = await refreshAuthToken();
      if (newToken) {
        response = await makeRequest(newToken, controller.signal);
      }
    }

    return response;
  } finally {
    clearTimeout(timer);
  }
}
