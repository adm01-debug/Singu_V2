import { jsonError, jsonOk, handleCorsAndMethod, withAuth, guardBody } from "../_shared/auth.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { rateLimit } from "../_shared/rate-limit.ts";
import { z } from "npm:zod@3.23.8";

const bodySchema = z.object({
  ip:         z.string().ip().max(45).optional(),
  country:    z.string().length(2).optional(),
  city:       z.string().max(100).optional(),
  user_agent: z.string().max(512).optional(),
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

  const { body: raw, error: bodyError } = await guardBody(req, 16 * 1024);
  if (bodyError) return bodyError;

  try {
    const parsed = bodySchema.safeParse(raw ?? {});
    if (!parsed.success) {
      return jsonError(parsed.error.issues[0]?.message ?? "Invalid request body", 400, req);
    }
    const { ip, country, city, user_agent } = parsed.data;

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Check security settings
    const { data: settings } = await supabase
      .from("access_security_settings")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    if (!settings) return jsonOk({ allowed: true, reason: "no_settings" }, req);

    // IP restriction check
    if (settings.enable_ip_restriction && ip) {
      const { data: allowedIPs } = await supabase
        .from("ip_whitelist")
        .select("ip_address")
        .eq("user_id", userId)
        .eq("is_active", true);

      if (Array.isArray(allowedIPs) && allowedIPs.length > 0) {
        const isAllowed = allowedIPs.some(r => r.ip_address === ip);
        if (!isAllowed) {
          supabase.from("access_blocked_log").insert({
            user_id: userId, ip_address: ip, reason: "ip_not_whitelisted", user_agent,
          }).catch((e: unknown) => console.error("access_blocked_log insert error:", e));
          return jsonOk({ allowed: false, reason: "ip_blocked" }, req);
        }
      }
    }

    // Geo-blocking check
    if (settings.enable_geo_blocking && country) {
      const { data: allowedCountries } = await supabase
        .from("geo_allowed_countries")
        .select("country_code")
        .eq("user_id", userId)
        .eq("is_active", true);

      if (Array.isArray(allowedCountries) && allowedCountries.length > 0) {
        const isAllowed = allowedCountries.some(c => c.country_code === country);
        if (!isAllowed) {
          supabase.from("access_blocked_log").insert({
            user_id: userId, ip_address: ip, country_code: country, city, reason: "geo_blocked", user_agent,
          }).catch((e: unknown) => console.error("access_blocked_log insert error:", e));
          return jsonOk({ allowed: false, reason: "geo_blocked" }, req);
        }
      }
    }

    return jsonOk({ allowed: true }, req);
  } catch {
    return jsonError("Internal error", 500, req);
  }
});
