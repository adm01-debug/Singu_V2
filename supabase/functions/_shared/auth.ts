import { createClient } from "npm:@supabase/supabase-js@2";

/**
 * Timing-safe string comparison using crypto.subtle HMAC-SHA-256.
 *
 * Design rationale
 * ─────────────────
 * • A new ephemeral HMAC key is generated on every call, so an attacker
 *   cannot pre-compute target digests offline.
 * • Both inputs are zero-padded to the same byte length before signing,
 *   so the underlying cryptographic operation always processes identical-size
 *   buffers regardless of input length.
 * • Both HMAC-SHA-256 digests are exactly 32 bytes, so the constant-time
 *   XOR accumulator loop runs exactly 32 iterations on every call — it
 *   never short-circuits.
 * • A raw byte-length XOR is OR-ed into the accumulator *before* the loop;
 *   this ensures strings of different byte lengths never compare as equal
 *   without leaking which side is longer through early termination.
 *
 * NOTE: This function is async because crypto.subtle.sign() returns a
 * Promise.  All callers (requireCronSecret, requireWebhookSecret,
 * withAuthOrServiceRole) have been updated to await it accordingly.
 *
 * @param a - First string (typically the value extracted from the request)
 * @param b - Second string (typically the expected secret from env)
 * @returns Promise resolving to true iff `a` and `b` are byte-for-byte equal
 */
export async function timingSafeStringEqual(a: string, b: string): Promise<boolean> {
  const enc = new TextEncoder();
  const aBytes: Uint8Array = enc.encode(a);
  const bBytes: Uint8Array = enc.encode(b);

  // Pad both to the same length so sign() always receives identical-size input.
  // Zero-padding is safe: the raw length difference is captured separately below.
  const maxLen = Math.max(aBytes.length, bBytes.length);
  const aPadded = new Uint8Array(maxLen);
  const bPadded = new Uint8Array(maxLen);
  aPadded.set(aBytes);
  bPadded.set(bBytes);

  // Generate a fresh ephemeral key on every call.
  // Non-extractable, sign-only — prevents any key-reuse or extraction attack.
  const key: CryptoKey = await crypto.subtle.generateKey(
    { name: "HMAC", hash: "SHA-256" },
    false,     // non-extractable
    ["sign"],
  );

  // Sign both padded buffers concurrently for efficiency.
  // Each resulting MAC is exactly 32 bytes (SHA-256 output size).
  const [macA, macB]: [ArrayBuffer, ArrayBuffer] = await Promise.all([
    crypto.subtle.sign("HMAC", key, aPadded),
    crypto.subtle.sign("HMAC", key, bPadded),
  ]);

  const macABytes = new Uint8Array(macA); // always 32 bytes
  const macBBytes = new Uint8Array(macB); // always 32 bytes

  // Seed the accumulator with the raw byte-length difference so that strings
  // of unequal length can never pass even if the padded MACs somehow collide
  // (astronomically unlikely, but defence-in-depth).
  let diff: number = aBytes.length ^ bBytes.length;
  for (let i = 0; i < macABytes.length; i++) {
    diff |= macABytes[i]! ^ macBBytes[i]!;
  }
  return diff === 0;
}

// Allowed origins for CORS — restrict to known app domains
const ALLOWED_ORIGINS = [
  "https://singu-v2.vercel.app",
  "https://dialogue-diamond.lovable.app",
  "https://id-preview--08cba815-22fa-42db-9361-0cffd81afd61.lovable.app",
  "http://localhost:8080",
  "http://localhost:3000",
];

const ALLOWED_ORIGIN_SUFFIXES = [
  ".lovable.app",
  ".lovableproject.com",
];

function getOrigin(req?: Request): string {
  if (!req) return ALLOWED_ORIGINS[0];
  const origin = req.headers.get("Origin") || "";
  const isKnownOrigin = ALLOWED_ORIGINS.includes(origin);
  const isAllowedPreviewOrigin = ALLOWED_ORIGIN_SUFFIXES.some((suffix) => origin.endsWith(suffix))
    || /^https:\/\/singu-v2-[a-z0-9-]+-juca1\.vercel\.app$/.test(origin);

  if (isKnownOrigin || isAllowedPreviewOrigin) {
    return origin;
  }

  return ALLOWED_ORIGINS[0];
}

export const corsHeaders = {
  "Access-Control-Allow-Origin": ALLOWED_ORIGINS[0],
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-lovable-timestamp, x-webhook-idempotency-key, x-lovable-signature",
};

/** Returns CORS headers scoped to the request's origin */
export function scopedCorsHeaders(req: Request) {
  return {
    "Access-Control-Allow-Origin": getOrigin(req),
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-trace-id, x-request-id, x-lovable-timestamp, x-webhook-idempotency-key, x-lovable-signature",
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
 * withAuthOrServiceRole — Accepts either a verified user JWT or the exact
 * service_role secret configured in the function environment.
 */
export async function withAuthOrServiceRole(req: Request): Promise<string | Response> {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return jsonError("Unauthorized", 401, req);
  }
  const token = authHeader.slice("Bearer ".length);
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (serviceRoleKey && await timingSafeStringEqual(token, serviceRoleKey)) {
    return SERVICE_ROLE_SENTINEL;
  }

  try {
    return await authenticateRequest(req);
  } catch {
    return jsonError("Unauthorized", 401, req);
  }
}

/**
 * requireCronSecret — Validates `x-cron-secret` header against CRON_SECRET env.
 * Returns a 401 Response on failure, or null to continue.
 *
 * Async because the underlying secret comparison uses crypto.subtle.
 * Callers must await this function.
 */
export async function requireCronSecret(req: Request): Promise<Response | null> {
  const secret = Deno.env.get("CRON_SECRET");
  if (!secret) {
    console.error("CRON_SECRET not configured");
    return jsonError("Server misconfigured", 500);
  }
  const provided = req.headers.get("x-cron-secret") ?? "";
  if (!await timingSafeStringEqual(provided, secret)) {
    return jsonError("Unauthorized", 401);
  }
  return null;
}

/**
 * guardBody — size-checked JSON parse helper.
 *
 * Uses Content-Length for a fast-path rejection, then reads the actual bytes
 * to enforce the limit regardless of header spoofing. Returns a typed result
 * union so callers avoid try/catch.
 *
 * Usage:
 *   const { body, error } = await guardBody(req);
 *   if (error) return error;     // 400 or 413 Response already built
 *   const { field } = body as MyType;
 *
 * @param req      The incoming Request
 * @param maxBytes Payload size ceiling in bytes (default: 256 KB)
 */
export async function guardBody(
  req: Request,
  maxBytes = 256 * 1024,
): Promise<{ body: unknown; error: null } | { body: null; error: Response }> {
  const cl = parseInt(req.headers.get("content-length") ?? "0", 10);
  if (!isNaN(cl) && cl > maxBytes) {
    return { body: null, error: jsonError("Payload too large", 413) };
  }
  let buf: ArrayBuffer;
  try {
    buf = await req.arrayBuffer();
  } catch {
    return { body: null, error: jsonError("Failed to read request body", 400) };
  }
  if (buf.byteLength > maxBytes) {
    return { body: null, error: jsonError("Payload too large", 413) };
  }
  try {
    const body = JSON.parse(new TextDecoder().decode(buf));
    return { body, error: null };
  } catch {
    return { body: null, error: jsonError("Invalid JSON body", 400) };
  }
}

/**
 * requireWebhookSecret — Validates a custom header against an env secret.
 * @param req        The incoming request
 * @param envName    Name of the env var holding the secret (e.g. "EVOLUTION_API_SECRET")
 * @param headerName Name of the header to check (e.g. "x-evolution-secret")
 * Returns a 401 Response on failure, or null to continue.
 *
 * Async because the underlying secret comparison uses crypto.subtle.
 * Callers must await this function.
 */
export async function requireWebhookSecret(
  req: Request,
  envName: string,
  headerName: string,
): Promise<Response | null> {
  const secret = Deno.env.get(envName);
  if (!secret) {
    console.error(`${envName} not configured`);
    return jsonError("Server misconfigured", 500);
  }
  const provided = req.headers.get(headerName) ?? "";
  if (!await timingSafeStringEqual(provided, secret)) {
    return jsonError("Unauthorized", 401);
  }
  return null;
}
