import { createClient } from "npm:@supabase/supabase-js@2";
import { z } from "npm:zod@3.23.8";
import { rateLimit } from "../_shared/rate-limit.ts";
import { extractTraceId, tracedLogger } from "../_shared/tracing.ts";
import { scopedCorsHeaders } from "../_shared/auth.ts";
import {
  isValidIdempotencyKey,
  verifyWebhookHmac,
} from "../_shared/webhook-signature.ts";

const limiter = rateLimit({
  windowMs: 60_000,
  max: 60,
  message: "Muitas requisições. Aguarde antes de tentar novamente.",
});

const PayloadSchema = z.record(z.unknown()).refine(
  (v) => JSON.stringify(v).length <= 256 * 1024,
  { message: "Payload excede 256KB" },
);

Deno.serve(async (req) => {
  const cors = scopedCorsHeaders(req);
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Método não permitido" }), {
      status: 405,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }
  const t0 = Date.now();

  const traceId = extractTraceId(req);
  const log = tracedLogger(traceId, "incoming-webhook");

  const sourceIp =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("cf-connecting-ip") ??
    "unknown";
  const userAgent = req.headers.get("user-agent") ?? "unknown";

  const limited = limiter.check(sourceIp, req);
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

  const contentLength = Number(req.headers.get("content-length") ?? "0");
  if (Number.isFinite(contentLength) && contentLength > 512 * 1024) {
    return new Response(JSON.stringify({ error: "Payload excede 512KB" }), {
      status: 413,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }
  const rawBodyText = await req.text();
  if (new TextEncoder().encode(rawBodyText).byteLength > 512 * 1024) {
    return new Response(JSON.stringify({ error: "Payload excede 512KB" }), {
      status: 413,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }
  let rawBody: unknown;
  try {
    rawBody = JSON.parse(rawBodyText);
  } catch {
    return new Response(JSON.stringify({ error: "JSON inválido" }), {
      status: 400,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }

  const parsed = PayloadSchema.safeParse(rawBody);
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

  if (!webhook.require_signature || !webhook.webhook_secret) {
    return new Response(JSON.stringify({ error: "Webhook desativado até configurar assinatura HMAC" }), {
      status: 503,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }

  const sig = req.headers.get("x-lovable-signature") ?? "";
  const ts = req.headers.get("x-lovable-timestamp") ?? "";
  const idempotencyKey = req.headers.get("x-webhook-idempotency-key") ?? "";
  const tsNum = Number(ts);
  const window = (webhook.replay_window_seconds ?? 300) * 1000;
  if (
    !sig ||
    !ts ||
    !isValidIdempotencyKey(idempotencyKey) ||
    !Number.isFinite(tsNum) ||
    Math.abs(Date.now() - tsNum) > window
  ) {
    return new Response(JSON.stringify({ error: "Headers de assinatura ausentes ou expirados" }), {
      status: 401,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }
  const signatureValid = await verifyWebhookHmac(
    webhook.webhook_secret,
    ts,
    idempotencyKey,
    rawBodyText,
    sig,
  );
  if (!signatureValid) {
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

  if (webhook.allowed_origins?.length) {
    const origin = req.headers.get("origin") ?? "";
    const ok = webhook.allowed_origins.some((allowedOrigin: string) => origin === allowedOrigin);
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

  const { error: cleanupError } = await admin
    .from("incoming_webhook_nonces")
    .delete()
    .eq("webhook_id", webhook.id)
    .lt("expires_at", new Date().toISOString());
  if (cleanupError) {
    log.error("idempotency_cleanup_failed", { error: cleanupError.message });
    return new Response(JSON.stringify({ error: "Falha ao limpar idempotência" }), {
      status: 500,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }

  const expiresAt = new Date(tsNum + window).toISOString();
  const { error: nonceError } = await admin.from("incoming_webhook_nonces").insert({
    webhook_id: webhook.id,
    idempotency_key: idempotencyKey,
    expires_at: expiresAt,
  });
  if (nonceError) {
    if (nonceError.code !== "23505") {
      log.error("idempotency_store_failed", { error: nonceError.message });
      return new Response(JSON.stringify({ error: "Falha ao registrar idempotência" }), {
        status: 500,
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }
    return new Response(JSON.stringify({ error: "Requisição duplicada" }), {
      status: 409,
      headers: { ...cors, "Content-Type": "application/json" },
    });
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
      console.error("incoming-webhook insert error:", error);
      httpStatus = 500;
      errorMessage = "Falha ao processar webhook";
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

  // Flush stats update and audit log in parallel (both independent)
  await Promise.all([
    dryRun
      ? Promise.resolve()
      : admin.from("incoming_webhooks").update({
          total_calls: (webhook.total_calls ?? 0) + 1,
          total_errors: (webhook.total_errors ?? 0) + (errorMessage ? 1 : 0),
          last_called_at: new Date().toISOString(),
        }).eq("id", webhook.id),
    admin.from("incoming_webhook_logs").insert({
      webhook_id: webhook.id,
      status: errorMessage ? "error" : "success",
      http_status: httpStatus,
      payload,
      response: insertResult,
      error_message: errorMessage,
      source_ip: sourceIp,
      user_agent: userAgent,
      latency_ms: Date.now() - t0,
    }),
  ]);

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
