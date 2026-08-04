import { supabase } from "@/integrations/supabase/client";
import { logger } from "@/lib/logger";

/**
 * getAuthToken — Retrieves a valid auth token for voice API calls.
 * Tries the current session first, then refreshes if expired.
 * Falls back to the anon key as a last resort.
 */
export async function getAuthToken(): Promise<string> {
  const { data: { session } } = await supabase.auth.getSession();
  if (session?.access_token) return session.access_token;

  logger.warn("[Voice Auth] Session expired, attempting refresh...");
  const { data: refreshed } = await supabase.auth.refreshSession();
  if (refreshed?.session?.access_token) return refreshed.session.access_token;

  logger.warn("[Voice Auth] Refresh failed, falling back to anon key");
  return import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
}

/**
 * refreshAuthToken — Forces a session refresh and returns the new token.
 * Returns null if refresh fails.
 */
export async function refreshAuthToken(): Promise<string | null> {
  const { data: refreshed } = await supabase.auth.refreshSession();
  return refreshed?.session?.access_token ?? null;
}
