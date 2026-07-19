import { createClient } from "npm:@supabase/supabase-js@2";
import { scopedCorsHeaders, withAuth } from "../_shared/auth.ts";
import { rateLimit } from "../_shared/rate-limit.ts";

const limiter = rateLimit({ windowMs: 60_000, max: 5 });

const EXTERNAL_URL = Deno.env.get("SUPABASE_DB_URL")
  ? undefined
  : Deno.env.get("EXTERNAL_SUPABASE_URL");
const EXTERNAL_KEY = Deno.env.get("EXTERNAL_SUPABASE_ANON_KEY");

function getExternalClient() {
  const url = EXTERNAL_URL || Deno.env.get("SUPABASE_DB_URL") || "";
  const key = EXTERNAL_KEY || Deno.env.get("SUPABASE_ANON_KEY") || "";
  return createClient(url, key);
}

Deno.serve(async (req) => {
  const cors = scopedCorsHeaders(req);
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: cors });
  }

  const authResult = await withAuth(req);
  if (authResult instanceof Response) return authResult;

  const limited = limiter.check(authResult);
  if (limited) return limited;

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    // Use external-data edge function to query email_logs
    const authHeader = req.headers.get("Authorization") || "";
    const edgeUrl = `${supabaseUrl}/functions/v1/external-data`;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY") || "";

    // Get latest email
    const latestRes = await fetch(edgeUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: authHeader || `Bearer ${anonKey}`,
        apikey: anonKey,
      },
      body: JSON.stringify({
        action: "select",
        table: "email_logs",
        select: "id,sent_at,from_email,to_email,status",
        order: { column: "sent_at", ascending: false },
        range: { from: 0, to: 0 },
      }),
    });

    const latestData = await latestRes.json();
    const latestEmail = Array.isArray(latestData?.data)
      ? latestData.data[0]
      : null;

    // Get count last 24h
    const now = new Date();
    const h24Ago = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();

    const countRes = await fetch(edgeUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: authHeader || `Bearer ${anonKey}`,
        apikey: anonKey,
      },
      body: JSON.stringify({
        action: "rpc",
        functionName: "get_email_pipeline_stats",
        params: { p_since: h24Ago },
      }),
    });

    const countData = await countRes.json();
    let stats = countData?.data;

    // Fallback: if RPC doesn't exist, use basic count
    if (!stats || countData?.error) {
      const fallbackRes = await fetch(edgeUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: authHeader || `Bearer ${anonKey}`,
          apikey: anonKey,
        },
        body: JSON.stringify({
          action: "select",
          table: "email_logs",
          select: "id,from_email,sent_at",
          order: { column: "sent_at", ascending: false },
          range: { from: 0, to: 999 },
        }),
      });

      const fallbackData = await fallbackRes.json();
      const allEmails = Array.isArray(fallbackData?.data)
        ? fallbackData.data
        : [];

      const recent = allEmails.filter(
        (e: { sent_at?: string }) =>
          e.sent_at && new Date(e.sent_at).getTime() > new Date(h24Ago).getTime()
      );

      // Group by seller
      const bySeller: Record<string, number> = {};
      for (const e of recent) {
        const key = (e as { from_email?: string }).from_email || "unknown";
        bySeller[key] = (bySeller[key] || 0) + 1;
      }

      stats = {
        total_24h: recent.length,
        by_seller: Object.entries(bySeller).map(([email, count]) => ({
          from_email: email,
          count,
        })),
      };
    }

    // Determine status
    let status: "healthy" | "degraded" | "offline" = "offline";
    let lastEmailAt: string | null = null;

    if (latestEmail?.sent_at) {
      lastEmailAt = latestEmail.sent_at;
      const diffMs = now.getTime() - new Date(latestEmail.sent_at).getTime();
      const diffHours = diffMs / (1000 * 60 * 60);

      if (diffHours < 1) {
        status = "healthy";
      } else if (diffHours < 24) {
        status = "degraded";
      }
      // else: status permanece "offline" (valor inicial)
    }

    const result = {
      status,
      last_email_at: lastEmailAt,
      checked_at: now.toISOString(),
      stats_24h: stats,
    };

    return new Response(JSON.stringify(result), {
      headers: { ...cors, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      headers: { ...cors, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
