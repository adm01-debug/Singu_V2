import { createClient } from "npm:@supabase/supabase-js@2";
import { scopedCorsHeaders, guardBody } from "../_shared/auth.ts";
import { rateLimit } from "../_shared/rate-limit.ts";

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

  try {
    const { token, label } = rawBody as { token?: string; label?: string };
    if (!token) return new Response(JSON.stringify({ error: "token required" }), { status: 400, headers: { ...cors, "Content-Type": "application/json" } });

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
