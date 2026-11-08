import { bestEffortWrite } from "../_shared/best-effort-write.ts";
import { jsonError, jsonOk, handleCorsAndMethod, withAuth, guardBody } from "../_shared/auth.ts";
import { rateLimit } from "../_shared/rate-limit.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { z } from "npm:zod@3.23.8";

const bodySchema = z.object({
  fingerprint:  z.string().min(1).max(512),
  device_name:  z.string().max(200).optional(),
  browser:      z.string().max(100).optional(),
  os:           z.string().max(100).optional(),
  ip_address:   z.string().ip().max(45).optional(),
  location:     z.string().max(200).optional(),
});

const limiter = rateLimit({ windowMs: 60_000, max: 20 });

Deno.serve(async (req) => {
  const corsOrMethod = handleCorsAndMethod(req);
  if (corsOrMethod) return corsOrMethod;

  const authResult = await withAuth(req);
  if (authResult instanceof Response) return authResult;
  const userId = authResult;

  const rl = limiter.check(userId, req);
  if (rl) return rl;

  const { body: rawBody, error: bodyError } = await guardBody(req, 64 * 1024);
  if (bodyError) return bodyError;

  try {
    const parsed = bodySchema.safeParse(rawBody);
    if (!parsed.success) {
      return jsonError(parsed.error.issues[0]?.message ?? "Invalid request body", 400, req);
    }
    const { fingerprint, device_name, browser, os, ip_address, location } = parsed.data;

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Check if device is known
    const { data: existing } = await supabase
      .from("user_known_devices")
      .select("id, is_trusted")
      .eq("user_id", userId)
      .eq("device_fingerprint", fingerprint)
      .maybeSingle();

    if (existing) {
      // Update last used (best-effort, does not affect response)
      await bestEffortWrite(supabase
        .from("user_known_devices")
        .update({ last_used_at: new Date().toISOString() })
        .eq("id", existing.id), "user_known_devices update error:");

      return jsonOk({ is_new: false, is_trusted: existing.is_trusted }, req);
    }

    // Register new device
    const { data: newDevice } = await supabase
      .from("user_known_devices")
      .insert({
        user_id: userId,
        device_fingerprint: fingerprint,
        device_name: device_name ?? `${browser} em ${os}`,
        browser,
        os,
        is_trusted: false,
      })
      .select("id")
      .single();

    // Create notification (best-effort)
    if (newDevice) {
      await bestEffortWrite(supabase.from("device_login_notifications").insert({
        user_id: userId,
        device_id: newDevice.id,
        ip_address,
        location: location ?? null,
      }), "device_login_notifications insert error:");
    }

    return jsonOk({ is_new: true, is_trusted: false }, req);
  } catch {
    return jsonError("Internal error", 500, req);
  }
});
