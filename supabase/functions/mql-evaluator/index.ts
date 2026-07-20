import { createClient } from "npm:@supabase/supabase-js@2";
import { guardBody, scopedCorsHeaders, requireCronSecret} from "../_shared/auth.ts";


Deno.serve(async (req) => {
  const cors = scopedCorsHeaders(req);
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });

  const cronCheck = await requireCronSecret(req);
  if (cronCheck) return cronCheck;

  const { body: rawBody, error: bodyError } = await guardBody(req, 32 * 1024);
  if (bodyError) return bodyError;

  const auth = req.headers.get("Authorization");
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    auth ? { global: { headers: { Authorization: auth } } } : undefined,
  );

  try {
    const body = rawBody;
    const { contact_id, user_id_override } = (body as Record<string, unknown> | null) || {};

    // Single contact mode
    if (contact_id) {
      const { data, error } = await supabase.rpc("evaluate_mql", { _contact_id: contact_id });
      if (error) throw error;
      return new Response(JSON.stringify({ ok: true, result: data }), {
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    // Bulk mode (cron) — iterate active criteria users
    const { data: criteria } = await supabase
      .from("mql_criteria")
      .select("user_id")
      .eq("is_active", true);

    const userIds = Array.from(new Set((criteria || []).map((c: { user_id: string }) => c.user_id)));
    let qualified = 0;
    let evaluated = 0;

    for (const uid of userIds) {
      if (user_id_override && uid !== user_id_override) continue;

      // Pre-fetch contacts AND the user's active criteria in parallel (2 queries, not N)
      const [{ data: contacts }, { data: crit }] = await Promise.all([
        supabase
          .from("contacts")
          .select("id, lead_score")
          .eq("user_id", uid)
          .gte("lead_score", 40)
          .limit(500),
        supabase
          .from("mql_criteria")
          .select("id, conditions")
          .eq("user_id", uid)
          .eq("is_active", true)
          .order("priority", { ascending: false })
          .limit(1)
          .maybeSingle(),
      ]);

      if (!crit || !contacts?.length) continue;

      const minScore = (crit.conditions as { min_score?: number })?.min_score ?? 50;
      const contactIds = contacts.map((c: { id: string }) => c.id);

      // Batch-fetch existing MQL/SQL classifications for ALL contacts at once (1 query, not N)
      const { data: existingRows } = await supabase
        .from("mql_classifications")
        .select("contact_id")
        .eq("user_id", uid)
        .in("contact_id", contactIds)
        .in("status", ["mql", "sql"]);

      const alreadyClassified = new Set(
        (existingRows ?? []).map((r: { contact_id: string }) => r.contact_id)
      );

      // Pure in-memory pass — accumulate new rows, zero additional DB calls
      const newClassifications: Record<string, unknown>[] = [];
      for (const c of contacts) {
        evaluated++;
        if (alreadyClassified.has(c.id)) continue;
        if ((c.lead_score ?? 0) >= minScore) {
          newClassifications.push({
            user_id: uid,
            contact_id: c.id,
            criteria_id: crit.id,
            status: "mql",
            score_snapshot: c.lead_score,
            reason: "Cron auto-evaluation",
          });
        }
      }

      // Bulk insert all new classifications in one call (1 query, not N)
      if (newClassifications.length > 0) {
        await supabase.from("mql_classifications").insert(newClassifications as never[]);
        qualified += newClassifications.length;
      }
    }

    return new Response(JSON.stringify({ ok: true, evaluated, qualified, users: userIds.length }), {
      headers: { ...cors, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("mql-evaluator error:", e);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }
});
