import { createClient } from "npm:@supabase/supabase-js@2";
import { z } from "npm:zod@3.23.8";
import { rateLimit } from "../_shared/rate-limit.ts";
import { extractTraceId, tracedLogger } from "../_shared/tracing.ts";
import { scopedCorsHeaders } from "../_shared/auth.ts";


const limiter = rateLimit({
  windowMs: 60_000,
  max: 60,
  message: "Muitas requisições. Aguarde antes de tentar novamente.",
});

const PayloadSchema = z.record(z.unknown()).refine(
  (v) => JSON.stringify(v).length <= 256 * 1024,
  { message: "Payload excede 256KB" },
);

async function verifyHmac(
  secret: string,
  timestamp: string,
  rawBody: string,
  signature: string,
): Promise<boolean> {
  try {
    const enc = new TextEncoder();
    const key = await crypto.subtle.importKey(
      "raw",
      enc.encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"],
    );
    const sig = await crypto.subtle.sign("HMAC", key, enc.encode(`${timestamp}.${rawBody}`));
    const hex = Array.from(new Uint8Array(sig))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
    const expected = `sha256=${hex}`;
    if (expected.length !== signature.length) return false;
    let diff = 0;
    for (let i = 0; i < expected.length; i++) {
      diff |= expected.charCodeAt(i) ^ signature.charCodeAt(i);
    }
    return diff === 0;
  } catch {
    return false;
  }
}

Deno.serve(async (req) => {
  const cors = scopedCorsHeaders(req);
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  const t0 = Date.now();

  const traceId = extractTraceId(req);
  const log = tracedLogger(traceId, "incoming-webhook");

  const sourceIp =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("cf-connecting-ip") ??
    "unknown";
  const userAgent = req.headers.get("user-agent") ?? "unknown";

  const limited = limiter.check(sourceIp);
  if (limited) return limited;

  log.info("request_received", { method: req.method, sourceIp, userAgent });

  const url = new URL(req.url);
  const pathToken = url.pathname.split("/").pop();
  const headerToken = req.headers.get("x-webhook-token");
  const token = pathToken && pathToken !== "incoming-webhook" ? pathToken : headerToken;
  const dryRun = url.searchParams.get("dry_run") === "true";

  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const rawBody = await req.text();
  let rawPayload: unknown = {};
  try {
    rawPayload = rawBody ? JSON.parse(rawBody) : {};
  } catch {
    rawPayload = {};
  }
  const parsed = PayloadSchema.safeParse(rawPayload);
  if (!parsed.success) {
    return new Response(
      JSON.stringify({ error: "Payload inválido", details: parsed.error.flatten() }),
      { status: 400, headers: { ...cors, "Content-Type": "application/json" } },
    );
  }
  const payload = parsed.data;

  if (!token) {
    return new Response(JSON.stringify({ error: "Token obrigatório" }), {
      status: 401,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }

  const { data: webhook, error: whErr } = await admin
    .from("incoming_webhooks")
    .select("*")
    .eq("token", token)
    .eq("is_active", true)
    .maybeSingle();

  if (whErr || !webhook) {
    return new Response(JSON.stringify({ error: "Webhook inválido ou inativo" }), {
      status: 404,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }

  // Verificação HMAC + anti-replay
  if (webhook.require_signature) {
    const sig = req.headers.get("x-lovable-signature") ?? "";
    const ts = req.headers.get("x-lovable-timestamp") ?? "";
    const tsNum = Number(ts);
    const window = (webhook.replay_window_seconds ?? 300) * 1000;
    if (!sig || !ts || !Number.isFinite(tsNum) || Math.abs(Date.now() - tsNum) > window) {
      return new Response(JSON.stringify({ error: "Timestamp ausente ou expirado" }), {
        status: 401,
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }
    const ok = webhook.webhook_secret
      ? await verifyHmac(webhook.webhook_secret, ts, rawBody, sig)
      : false;
    if (!ok) {
      await admin.from("incoming_webhook_logs").insert({
        webhook_id: webhook.id,
        status: "error",
        http_status: 401,
        payload,
        error_message: "Assinatura HMAC inválida",
        source_ip: sourceIp,
        user_agent: userAgent,
        latency_ms: Date.now() - t0,
      });
      return new Response(JSON.stringify({ error: "Assinatura inválida" }), {
        status: 401,
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }
  }

  // Origem (opcional)
  if (webhook.allowed_origins?.length) {
    const origin = req.headers.get("origin") ?? "";
    const ok = webhook.allowed_origins.some((o: string) => origin.includes(o));
    if (!ok) {
      await admin.from("incoming_webhook_logs").insert({
        webhook_id: webhook.id,
        status: "error",
        http_status: 403,
        payload,
        error_message: "Origem não permitida",
        source_ip: sourceIp,
        user_agent: userAgent,
        latency_ms: Date.now() - t0,
      });
      return new Response(JSON.stringify({ error: "Origem não permitida" }), {
        status: 403,
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }
  }

  // Quotas mensais
  if (!dryRun) {
    const { data: quota } = await admin.rpc("increment_webhook_quota", {
      _webhook_id: webhook.id,
    });
    const q = quota as { exceeded?: boolean; overage_blocked?: boolean } | null;
    if (q?.exceeded && q?.overage_blocked) {
      await admin.from("incoming_webhook_logs").insert({
        webhook_id: webhook.id,
        status: "error",
        http_status: 429,
        payload,
        error_message: "Quota mensal excedida",
        source_ip: sourceIp,
        user_agent: userAgent,
        latency_ms: Date.now() - t0,
      });
      return new Response(JSON.stringify({ error: "Quota mensal excedida", quota: q }), {
        status: 429,
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }
  }

  // Mapear payload
  const mapping = (webhook.field_mapping ?? {}) as Record<string, string>;
  const mapped: Record<string, unknown> = {};
  for (const [target, path] of Object.entries(mapping)) {
    const parts = path.split(".");
    let v: unknown = payload;
    for (const p of parts) v = (v as Record<string, unknown> | null)?.[p];
    if (v !== undefined) mapped[target] = v;
  }
  const finalRow = Object.keys(mapped).length ? mapped : payload;

  const tableMap: Record<string, string> = {
    contact: "contacts",
    company: "companies",
    deal: "deals",
    interaction: "interactions",
    note: "notes",
  };
  const targetTable = tableMap[webhook.target_entity];

  let insertResult: unknown = null;
  let httpStatus = 200;
  let errorMessage: string | null = null;

  if (dryRun) {
    insertResult = { dry_run: true, mapped_row: finalRow, target_table: targetTable };
  } else if (targetTable) {
    const row = { ...finalRow, user_id: webhook.created_by };
    const { data, error } = await admin.from(targetTable).insert(row).select().maybeSingle();
    if (error) {
      httpStatus = 500;
      errorMessage = error.message;
      await admin.from("incoming_webhook_dlq").insert({
        webhook_id: webhook.id,
        payload,
        source_ip: sourceIp,
        user_agent: userAgent,
        last_error: error.message,
        next_retry_at: new Date(Date.now() + 2 * 60_000).toISOString(),
      });
    } else insertResult = data;
  } else {
    insertResult = { received: true, payload: finalRow };
  }

  if (!dryRun) {
    await admin
      .from("incoming_webhooks")
      .update({
        total_calls: (webhook.total_calls ?? 0) + 1,
        total_errors: (webhook.total_errors ?? 0) + (errorMessage ? 1 : 0),
        last_called_at: new Date().toISOString(),
      })
      .eq("id", webhook.id);
  }

  await admin.from("incoming_webhook_logs").insert({
    webhook_id: webhook.id,
    status: errorMessage ? "error" : "success",
    http_status: httpStatus,
    payload,
    response: insertResult,
    error_message: errorMessage,
    source_ip: sourceIp,
    user_agent: userAgent,
    latency_ms: Date.now() - t0,
  });

  return new Response(
    JSON.stringify({
      success: !errorMessage,
      data: insertResult,
      error: errorMessage,
      dry_run: dryRun,
    }),
    {
      status: httpStatus,
      headers: { ...cors, "Content-Type": "application/json" },
    },
  );
});
