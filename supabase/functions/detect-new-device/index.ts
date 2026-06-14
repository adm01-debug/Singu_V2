import { jsonError, jsonOk, handleCorsAndMethod, withAuth } from "../_shared/auth.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

Deno.serve(async (req) => {
  const corsOrMethod = handleCorsAndMethod(req);
  if (corsOrMethod) return corsOrMethod;

  const authResult = await withAuth(req);
  if (authResult instanceof Response) return authResult;
  const userId = authResult;

  try {
    const body = await req.json();
    const { fingerprint, device_name, browser, os, ip_address } = body;

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
      // Update last used
      await supabase
        .from("user_known_devices")
        .update({ last_used_at: new Date().toISOString() })
        .eq("id", existing.id);

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

    // Create notification
    if (newDevice) {
      await supabase.from("device_login_notifications").insert({
        user_id: userId,
        device_id: newDevice.id,
        ip_address,
        location: body.location ?? null,
      });
    }

    return jsonOk({ is_new: true, is_trusted: false }, req);
  } catch (err) {
    return jsonError("Internal error", 500, req);
  }
});
