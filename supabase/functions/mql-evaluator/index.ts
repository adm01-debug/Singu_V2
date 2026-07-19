import { createClient } from "npm:@supabase/supabase-js@2";
import { scopedCorsHeaders, requireCronSecret} from "../_shared/auth.ts";


Deno.serve(async (req) => {
  const cors = scopedCorsHeaders(req);
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });

  const cronCheck = await requireCronSecret(req);
  if (cronCheck) return cronCheck;

  const auth = req.headers.get("Authorization");
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    auth ? { global: { headers: { Authorization: auth } } } : undefined,
  );

  try {
    const body = await req.json().catch(() => ({}));
    const { contact_id, user_id_override } = body || {};

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
      const { data: contacts } = await supabase
        .from("contacts")
        .select("id, lead_score")
        .eq("user_id", uid)
        .gte("lead_score", 40)
        .limit(500);

      for (const c of contacts || []) {
        evaluated++;
        const { data: existing } = await supabase
          .from("mql_classifications")
          .select("id")
          .eq("contact_id", c.id)
          .eq("user_id", uid)
          .in("status", ["mql", "sql"])
          .maybeSingle();
        if (existing?.id) continue;

        // Re-evaluate via direct insert (RPC uses auth.uid which may be null in cron)
        const { data: crit } = await supabase
          .from("mql_criteria")
          .select("id, conditions")
          .eq("user_id", uid)
          .eq("is_active", true)
          .order("priority", { ascending: false })
          .limit(1)
          .maybeSingle();
        if (!crit) continue;
        const minScore = (crit.conditions as { min_score?: number })?.min_score ?? 50;
        if ((c.lead_score ?? 0) >= minScore) {
          await supabase.from("mql_classifications").insert({
            user_id: uid,
            contact_id: c.id,
            criteria_id: crit.id,
            status: "mql",
            score_snapshot: c.lead_score,
            reason: "Cron auto-evaluation",
          } as never);
          qualified++;
        }
      }
    }

    return new Response(JSON.stringify({ ok: true, evaluated, qualified, users: userIds.length }), {
      headers: { ...cors, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }
});
