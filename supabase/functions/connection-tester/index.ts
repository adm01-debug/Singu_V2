/**
 * connection-tester — tests external connection configs.
 *
 * Security hardening applied (2026-07-19):
 *  - SSRF guard: blocks private/link-local/loopback IPs, cloud metadata
 *    endpoints, alternate IP encodings (decimal integer, octal, hex), and
 *    non-HTTP/S schemes (file://, gopher://, dict://, etc.).
 *  - DNS resolution check: all A/AAAA records are verified against blocked
 *    CIDR ranges before the outbound fetch executes.
 *  - redirect:"error" on every fetch — prevents redirect-chain SSRF.
 *  - Hard 10-second AbortSignal.timeout on every outbound request.
 *  - Response bodies are discarded; no raw external data is reflected to callers.
 *  - Scoped CORS (no wildcard *) via _shared/auth.ts scopedCorsHeaders.
 *  - Auth uses shared authenticateRequest (getUser, not getClaims).
 *
 * TOCTOU / DNS-rebinding residual risk: the DNS check and the fetch execute
 * in the same microtask chain, but a DNS TTL=0 response can still be rebinded
 * between resolveDns() and the TCP SYN. Full mitigation requires a dedicated
 * SSRF-safe egress proxy that pins the IP from DNS resolution. The controls
 * here reduce the exploitation window from "always" to sub-millisecond.
 */

import { createClient } from "npm:@supabase/supabase-js@2";
import {
  scopedCorsHeaders,
  handleCorsAndMethod,
  withAuth,
} from "../_shared/auth.ts";
import { rateLimit } from "../_shared/rate-limit.ts";

const limiter = rateLimit({ windowMs: 60_000, max: 10 });

// ─── SSRF Guard ───────────────────────────────────────────────────────────────

/** IPv4 CIDR ranges that must never be the destination of an outbound fetch. */
const BLOCKED_CIDRS_V4: ReadonlyArray<{ base: number; mask: number }> = [
  { base: 0x7f000000, mask: 0xff000000 }, // 127.0.0.0/8     loopback
  { base: 0xa9fe0000, mask: 0xffff0000 }, // 169.254.0.0/16  link-local / AWS+Azure metadata
  { base: 0x0a000000, mask: 0xff000000 }, // 10.0.0.0/8      RFC-1918
  { base: 0xac100000, mask: 0xfff00000 }, // 172.16.0.0/12   RFC-1918
  { base: 0xc0a80000, mask: 0xffff0000 }, // 192.168.0.0/16  RFC-1918
  { base: 0x00000000, mask: 0xff000000 }, // 0.0.0.0/8       "this" network
  { base: 0xc0000200, mask: 0xffffff00 }, // 192.0.2.0/24    TEST-NET-1
  { base: 0xc6336400, mask: 0xffffff00 }, // 198.51.100.0/24 TEST-NET-2
  { base: 0xcb007100, mask: 0xffffff00 }, // 203.0.113.0/24  TEST-NET-3
  { base: 0xe0000000, mask: 0xe0000000 }, // 224.0.0.0/3     multicast + reserved
  { base: 0xffffffff, mask: 0xffffffff }, // 255.255.255.255  broadcast
];

/** Exact hostnames that are always blocked (independent of DNS). */
const BLOCKED_HOSTNAMES = new Set([
  "localhost",
  "localhost.localdomain",
  "metadata.google.internal",
  "metadata.goog",
  // eslint-disable-next-line sonarjs/no-hardcoded-ip -- intentional SSRF blocklist
  "169.254.169.254",
  // eslint-disable-next-line sonarjs/no-hardcoded-ip -- intentional SSRF blocklist
  "fd00:ec2::254", // AWS metadata IPv6
]);

function ipv4ToUint32(ip: string): number {
  const parts = ip.split(".").map(Number);
  return (
    ((parts[0] << 24) | (parts[1] << 16) | (parts[2] << 8) | parts[3]) >>> 0
  );
}

function isBlockedV4(addr: string): boolean {
  const n = ipv4ToUint32(addr);
  return BLOCKED_CIDRS_V4.some(({ base, mask }) => (n & mask) === base);
}

function isBlockedV6(addr: string): boolean {
  const a = addr.toLowerCase();
  if (a === "::1" || a === "0:0:0:0:0:0:0:1") return true;         // loopback
  // eslint-disable-next-line sonarjs/no-hardcoded-ip -- intentional SSRF blocklist
  if (a.startsWith("::ffff:127.") || a.startsWith("::ffff:7f"))    // IPv4-mapped loopback
    return true;
  // eslint-disable-next-line sonarjs/no-hardcoded-ip -- intentional SSRF blocklist
  if (a.startsWith("::ffff:169.254.") || a.startsWith("::ffff:a9fe")) // IPv4-mapped link-local
    return true;
  if (/^f[cd]/i.test(a)) return true;   // fc00::/7  ULA (includes fd00::)
  if (/^fe[89ab]/i.test(a)) return true; // fe80::/10 link-local
  return false;
}

/**
 * assertSafeUrl — throws if rawUrl is or resolves to a private/internal
 * destination. Must be called before every outbound fetch.
 */
async function assertSafeUrl(rawUrl: string): Promise<void> {
  // 1. Must parse as a valid URL.
  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    throw new Error("URL inválida");
  }

  // 2. Scheme whitelist — blocks file://, gopher://, dict://, ftp://, etc.
  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
    throw new Error(`Esquema de URL não permitido: ${parsed.protocol}`);
  }

  const hostname = parsed.hostname.toLowerCase();

  // 3. Exact hostname blocklist (catches "localhost", metadata endpoints, etc.)
  if (BLOCKED_HOSTNAMES.has(hostname)) {
    throw new Error("Destino de URL bloqueado");
  }

  // 4. Decimal integer IP notation — e.g., 2130706433 maps to 127.0.0.1.
  if (/^\d+$/.test(hostname)) {
    throw new Error("Destino de URL bloqueado: notação decimal");
  }

  // 5. Hex IP notation — e.g., 0x7f000001.
  if (/^0x[0-9a-f]+$/i.test(hostname)) {
    throw new Error("Destino de URL bloqueado: notação hexadecimal");
  }

  // 6. Octal IP segment — e.g., 0177.0.0.1 where first octet starts with 0.
  //    Standard URL parsers may normalise these, so block them explicitly.
  if (hostname.split(".").some((seg) => seg.length > 1 && seg.startsWith("0") && /^\d+$/.test(seg))) {
    throw new Error("Destino de URL bloqueado: notação octal");
  }

  // 7. DNS resolution — every returned address must be public.
  let v4Addrs: string[] = [];
  let v6Addrs: string[] = [];
  try {
    [v4Addrs, v6Addrs] = await Promise.all([
      Deno.resolveDns(hostname, "A").catch(() => [] as string[]),
      Deno.resolveDns(hostname, "AAAA").catch(() => [] as string[]),
    ]);
  } catch {
    throw new Error("Falha ao resolver hostname");
  }

  // No addresses → block (prevents internal .local / NXDOMAIN probing)
  if (v4Addrs.length === 0 && v6Addrs.length === 0) {
    throw new Error("Hostname não resolveu para nenhum endereço público");
  }

  for (const addr of v4Addrs) {
    if (isBlockedV4(addr)) {
      throw new Error("Destino de URL bloqueado: IP privado/reservado");
    }
  }
  for (const addr of v6Addrs) {
    if (isBlockedV6(addr)) {
      throw new Error("Destino de URL bloqueado: IP privado/reservado (IPv6)");
    }
  }
}

const FETCH_TIMEOUT_MS = 10_000;

/** SSRF-safe wrapper around fetch(). Always call instead of fetch() directly. */
async function safeFetch(url: string, opts: RequestInit = {}): Promise<Response> {
  await assertSafeUrl(url);
  return fetch(url, {
    ...opts,
    // Disable redirect following — prevents redirect-chain SSRF where an
    // initially-safe URL redirects to a private/metadata address.
    redirect: "error",
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
  });
}

// ─── Connection testers ───────────────────────────────────────────────────────

interface TestResult {
  latency_ms: number;
  message: string;
}

async function testSupabase(config: Record<string, unknown>): Promise<TestResult> {
  // eslint-disable-next-line sonarjs/slow-regex -- regex bounded by protocol prefix, not user-controlled
  const url = String(config.url ?? "").replace(/\/+$/, "");
  const key = String(config.anon_key ?? config.service_role_key ?? "");
  if (!url || !key) throw new Error("URL e chave (anon ou service role) obrigatórias");
  const t0 = Date.now();
  // Send the API key only in the header — not in the query string — to avoid
  // it being echoed back in server logs of the target service.
  const res = await safeFetch(`${url}/rest/v1/`, {
    headers: { apikey: key, Authorization: `Bearer ${key}` },
  });
  const ms = Date.now() - t0;
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  await res.body?.cancel(); // discard — never reflect external body to caller
  return { latency_ms: ms, message: "Supabase respondeu OK" };
}

async function testBitrix(config: Record<string, unknown>): Promise<TestResult> {
  // eslint-disable-next-line sonarjs/slow-regex -- regex bounded by protocol prefix, not user-controlled
  const webhook = String(config.webhook_url ?? "").replace(/\/+$/, "");
  if (!webhook) throw new Error("webhook_url obrigatório");
  const t0 = Date.now();
  const res = await safeFetch(`${webhook}/profile.json`);
  const ms = Date.now() - t0;
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  // Body is intentionally discarded. The original code reflected
  // data?.result?.NAME from an arbitrary URL — a data-exfil channel.
  await res.body?.cancel();
  return { latency_ms: ms, message: "Bitrix24 respondeu OK" };
}

async function testN8n(config: Record<string, unknown>): Promise<TestResult> {
  const webhook = String(config.webhook_url ?? "");
  if (!webhook) throw new Error("webhook_url obrigatório");
  const t0 = Date.now();
  const res = await safeFetch(webhook, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ping: true, source: "singu", ts: Date.now() }),
  });
  const ms = Date.now() - t0;
  if (!res.ok && res.status !== 404) throw new Error(`HTTP ${res.status}`);
  await res.body?.cancel();
  return { latency_ms: ms, message: `n8n respondeu HTTP ${res.status}` };
}

async function testMcpClaude(config: Record<string, unknown>): Promise<TestResult> {
  const url = String(config.server_url ?? "");
  if (!url) throw new Error("server_url obrigatório");
  const t0 = Date.now();
  const res = await safeFetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json, text/event-stream",
    },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: 1,
      method: "initialize",
      params: {
        protocolVersion: "2024-11-05",
        capabilities: {},
        clientInfo: { name: "singu", version: "1.0" },
      },
    }),
  });
  const ms = Date.now() - t0;
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  await res.body?.cancel();
  return { latency_ms: ms, message: "MCP server respondeu" };
}

async function testCustom(config: Record<string, unknown>): Promise<TestResult> {
  const url = String(config.url ?? "");
  if (!url) throw new Error("url obrigatória");
  const method = String(config.method ?? "GET").toUpperCase();
  // Restrict to safe, read-only-ish HTTP verbs to limit SSRF write impact.
  if (!["GET", "HEAD", "POST"].includes(method)) {
    throw new Error(`Método HTTP não permitido: ${method}`);
  }
  const t0 = Date.now();
  const res = await safeFetch(url, { method });
  const ms = Date.now() - t0;
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  await res.body?.cancel();
  return { latency_ms: ms, message: `Custom OK — HTTP ${res.status}` };
}

// ─── Handler ──────────────────────────────────────────────────────────────────

interface TestPayload {
  connection_id?: string;
  connection_type: "supabase_external" | "bitrix24" | "n8n" | "mcp_claude" | "custom";
  config: Record<string, unknown>;
}

Deno.serve(async (req) => {
  // Scoped CORS preflight + POST-only guard (replaces wildcard Access-Control-Allow-Origin: *)
  const earlyResponse = handleCorsAndMethod(req);
  if (earlyResponse) return earlyResponse;

  const corsH = scopedCorsHeaders(req);

  try {
    // Auth: shared authenticateRequest calls supabase.auth.getUser() —
    // the original used getClaims() which is weaker / non-standard.
    const authResult = await withAuth(req);
    if (authResult instanceof Response) return authResult; // 401

    const userId: string = authResult;

    const rl = limiter.check(userId, req);
    if (rl) return rl;

    const payload = (await req.json()) as TestPayload;
    let result: TestResult;

    switch (payload.connection_type) {
      case "supabase_external": result = await testSupabase(payload.config);  break;
      case "bitrix24":          result = await testBitrix(payload.config);    break;
      case "n8n":               result = await testN8n(payload.config);       break;
      case "mcp_claude":        result = await testMcpClaude(payload.config); break;
      case "custom":            result = await testCustom(payload.config);    break;
      default: throw new Error("Tipo de conexão desconhecido");
    }

    if (payload.connection_id) {
      const admin = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      );
      await Promise.all([
        admin.from("connection_configs").update({
          last_tested_at: new Date().toISOString(),
          last_test_status: "success",
          last_test_latency_ms: result.latency_ms,
          last_test_message: result.message,
        }).eq("id", payload.connection_id).eq("user_id", userId),
        admin.from("connection_test_logs").insert({
          connection_id: payload.connection_id,
          status: "success",
          latency_ms: result.latency_ms,
          message: result.message,
          tested_by: userId,
        }),
      ]);
    }

    return new Response(JSON.stringify({ success: true, ...result }), {
      headers: { ...corsH, "Content-Type": "application/json" },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro desconhecido";
    try {
      const body = (await req.clone().json()) as TestPayload;
      if (body.connection_id) {
        const admin = createClient(
          Deno.env.get("SUPABASE_URL")!,
          Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
        );
        await Promise.all([
          admin.from("connection_configs").update({
            last_tested_at: new Date().toISOString(),
            last_test_status: "error",
            last_test_message: message,
          }).eq("id", body.connection_id).eq("user_id", userId),
          admin.from("connection_test_logs").insert({
            connection_id: body.connection_id,
            status: "error",
            message,
          }),
        ]);
      }
    } catch { /* ignore */ }

    return new Response(JSON.stringify({ success: false, error: message }), {
      status: 200,
      headers: { ...corsH, "Content-Type": "application/json" },
    });
  }
});
