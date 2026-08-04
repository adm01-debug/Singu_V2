import { createClient } from "npm:@supabase/supabase-js@2";
import { scopedCorsHeaders, guardBody } from "../_shared/auth.ts";
import { rateLimit } from "../_shared/rate-limit.ts";
import { validate } from "../_shared/validate.ts";

const limiter = rateLimit({ windowMs: 60_000, max: 30 });

Deno.serve(async (req) => {
  const cors = scopedCorsHeaders(req);
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  if (req.method !== "POST") return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405, headers: { ...cors, "Content-Type": "application/json" } });

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const limited = limiter.check(ip, req);
  if (limited) return limited;

  const { body: rawBody, error: bodyError } = await guardBody(req, 64 * 1024);
  if (bodyError) return bodyError;

  const v = validate(rawBody, {
    token: { type: 'string', required: true, maxLength: 512 },
    label: { type: 'string', maxLength: 200 },
  });
  if (!v.ok) return new Response(JSON.stringify({ error: v.error }), { status: 400, headers: { ...cors, "Content-Type": "application/json" } });

  try {
    const { token, label } = v.data as { token: string; label?: string };

    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data, error } = await supabase.rpc("record_buyer_view", { _token: token, _label: label ?? null });
    if (error) {
      console.error("deal-room-buyer-view rpc error:", error);
      return new Response(JSON.stringify({ error: "Internal server error" }), { status: 500, headers: { ...cors, "Content-Type": "application/json" } });
    }

    return new Response(JSON.stringify({ recorded: data }), { headers: { ...cors, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("deal-room-buyer-view error:", e);
    return new Response(JSON.stringify({ error: "Internal server error" }), { status: 500, headers: { ...cors, "Content-Type": "application/json" } });
  }
});
