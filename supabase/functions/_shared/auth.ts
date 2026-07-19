import { createClient } from "npm:@supabase/supabase-js@2";

/**
 * Constant-time string comparison to prevent timing attacks.
 * Uses XOR over UTF-8 bytes so the loop always runs the full length.
 */
function timingSafeStringEqual(a: string, b: string): boolean {
  const enc = new TextEncoder();
  const aBytes = enc.encode(a);
  const bBytes = enc.encode(b);
  const len = Math.max(aBytes.length, bBytes.length);
  let diff = aBytes.length ^ bBytes.length; // non-zero when lengths differ
  for (let i = 0; i < len; i++) {
    diff |= (aBytes[i] ?? 0) ^ (bBytes[i] ?? 0);
  }
  return diff === 0;
}

// Allowed origins for CORS — restrict to known app domains
const ALLOWED_ORIGINS = [
  "https://dialogue-diamond.lovable.app",
  "https://id-preview--08cba815-22fa-42db-9361-0cffd81afd61.lovable.app",
];

const ALLOWED_ORIGIN_SUFFIXES = [
  ".lovable.app",
  ".lovableproject.com",
];

function getOrigin(req?: Request): string {
  if (!req) return ALLOWED_ORIGINS[0];
  const origin = req.headers.get("Origin") || "";
  const isKnownOrigin = ALLOWED_ORIGINS.includes(origin);
  const isAllowedPreviewOrigin = ALLOWED_ORIGIN_SUFFIXES.some((suffix) => origin.endsWith(suffix));

  if (isKnownOrigin || isAllowedPreviewOrigin) {
    return origin;
  }

  return ALLOWED_ORIGINS[0];
}

export const corsHeaders = {
  "Access-Control-Allow-Origin": ALLOWED_ORIGINS[0],
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/** Returns CORS headers scoped to the request's origin */
export function scopedCorsHeaders(req: Request) {
  return {
    "Access-Control-Allow-Origin": getOrigin(req),
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Vary": "Origin",
  };
}

/** Resolve CORS headers — scoped when req is provided, static fallback otherwise */
function resolveCors(req?: Request) {
  if (req) return scopedCorsHeaders(req);
  return corsHeaders;
}

/**
 * authenticateRequest — Validates JWT from the Authorization header.
 * Returns the authenticated user ID or throws "UNAUTHORIZED".
 */
export async function authenticateRequest(req: Request): Promise<string> {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    throw new Error("UNAUTHORIZED");
  }
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } } }
  );
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user?.id) throw new Error("UNAUTHORIZED");
  return user.id;
}

/** Standard JSON error response with CORS headers (scoped when req provided). */
export function jsonError(message: string, status: number, req?: Request): Response {
  return new Response(
    JSON.stringify({ error: message }),
    { status, headers: { ...resolveCors(req), "Content-Type": "application/json" } }
  );
}

/**
 * jsonConflict — Resposta padronizada HTTP 409 para conflitos de versão (optimistic locking).
 * Emite payload JSON estruturado para o frontend reconhecer via campo `error: "CONCURRENT_EDIT"`.
 */
export function jsonConflict(
  payload: { entity: string; id: string; attemptedVersion: number; traceId?: string },
  req?: Request,
): Response {
  return new Response(
    JSON.stringify({
      error: "CONCURRENT_EDIT",
      entity: payload.entity,
      id: payload.id,
      attemptedVersion: payload.attemptedVersion,
      traceId: payload.traceId,
    }),
    { status: 409, headers: { ...resolveCors(req), "Content-Type": "application/json" } },
  );
}

/** Standard JSON success response with CORS headers (scoped when req provided). */
export function jsonOk(data: unknown, req?: Request): Response {
  return new Response(
    JSON.stringify(data),
    { headers: { ...resolveCors(req), "Content-Type": "application/json" } }
  );
}

/**
 * handleCorsAndMethod — Guards OPTIONS preflight and enforces POST-only.
 * Returns a Response to send immediately, or null to continue processing.
 */
export function handleCorsAndMethod(req: Request): Response | null {
  const headers = scopedCorsHeaders(req);
  if (req.method === "OPTIONS") {
    return new Response(null, { headers });
  }
  if (req.method !== "POST") {
    return jsonError("Method not allowed", 405, req);
  }
  return null;
}

/**
 * withAuth — Runs authenticateRequest and returns 401 on failure.
 * Returns the user ID on success, or a Response to send on failure.
 */
export async function withAuth(req: Request): Promise<string | Response> {
  try {
    return await authenticateRequest(req);
  } catch {
    return jsonError("Unauthorized", 401, req);
  }
}

// ─── Sentinel value for service-role callers ───
const SERVICE_ROLE_SENTINEL = "__SERVICE_ROLE__" as const;

/**
 * isServiceRoleCaller — checks if the auth result came from a service-role key.
 */
export function isServiceRoleCaller(authResult: string): boolean {
  return authResult === SERVICE_ROLE_SENTINEL;
}

/**
 * withAuthOrServiceRole — Accepts either a user JWT or the service_role key.
 * If the Authorization header carries the service_role key, returns the sentinel.
 * Otherwise delegates to withAuth (user JWT).
 */
export async function withAuthOrServiceRole(req: Request): Promise<string | Response> {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return jsonError("Unauthorized", 401);
  }
  const token = authHeader.replace("Bearer ", "");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (serviceRoleKey && timingSafeStringEqual(token, serviceRoleKey)) {
    return SERVICE_ROLE_SENTINEL;
  }
  return withAuth(req);
}

/**
 * requireCronSecret — Validates `x-cron-secret` header against CRON_SECRET env.
 * Returns a 401 Response on failure, or null to continue.
 */
export function requireCronSecret(req: Request): Response | null {
  const secret = Deno.env.get("CRON_SECRET");
  if (!secret) {
    console.error("CRON_SECRET not configured");
    return jsonError("Server misconfigured", 500);
  }
  const provided = req.headers.get("x-cron-secret") ?? "";
  if (!timingSafeStringEqual(provided, secret)) {
    return jsonError("Unauthorized", 401);
  }
  return null;
}

/**
 * requireWebhookSecret — Validates a custom header against an env secret.
 * @param req        The incoming request
 * @param envName    Name of the env var holding the secret (e.g. "EVOLUTION_API_SECRET")
 * @param headerName Name of the header to check (e.g. "x-evolution-secret")
 * Returns a 401 Response on failure, or null to continue.
 */
export function requireWebhookSecret(
  req: Request,
  envName: string,
  headerName: string,
): Response | null {
  const secret = Deno.env.get(envName);
  if (!secret) {
    console.error(`${envName} not configured`);
    return jsonError("Server misconfigured", 500);
  }
  const provided = req.headers.get(headerName) ?? "";
  if (!timingSafeStringEqual(provided, secret)) {
    return jsonError("Unauthorized", 401);
  }
  return null;
}
