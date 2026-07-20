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

    // Bulk mode (cron) — pre-batch ALL reads in 3 parallel queries instead of 3N
    const { data: criteria } = await supabase
      .from("mql_criteria")
      .select("user_id")
      .eq("is_active", true);

    const userIds = Array.from(new Set((criteria || []).map((c: { user_id: string }) => c.user_id)))
      .filter((uid: string) => !user_id_override || uid === user_id_override);

    let qualified = 0;
    let evaluated = 0;

    if (userIds.length === 0) {
      return new Response(JSON.stringify({ ok: true, evaluated: 0, qualified: 0, users: 0 }), {
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    // 3 parallel queries for ALL users at once (eliminates N*3 round-trips)
    const [contactsResult, criteriaResult] = await Promise.all([
      supabase.from("contacts").select("id, user_id, lead_score").in("user_id", userIds).gte("lead_score", 40).limit(50_000),
      supabase.from("mql_criteria").select("id, user_id, conditions").in("user_id", userIds).eq("is_active", true).order("priority", { ascending: false }).limit(1000),
    ]);

    // Build per-user maps
    type ContactRow = { id: string; user_id: string; lead_score: number };
    type CritRow = { id: string; user_id: string; conditions: unknown };
    const contactsByUser = new Map<string, ContactRow[]>();
    for (const c of (contactsResult.data ?? []) as ContactRow[]) {
      const arr = contactsByUser.get(c.user_id) ?? [];
      arr.push(c);
      contactsByUser.set(c.user_id, arr);
    }
    const critByUser = new Map<string, CritRow>();
    for (const c of (criteriaResult.data ?? []) as CritRow[]) {
      if (!critByUser.has(c.user_id)) critByUser.set(c.user_id, c);
    }

    // Collect all candidate contact IDs for one batch classification lookup
    const allCandidateIds: string[] = [];
    for (const uid of userIds) {
      const contacts = contactsByUser.get(uid) ?? [];
      for (const c of contacts) allCandidateIds.push(c.id);
    }

    const { data: existingRows } = allCandidateIds.length > 0
      ? await supabase.from("mql_classifications").select("contact_id").in("contact_id", allCandidateIds).in("status", ["mql", "sql"])
      : { data: [] };
    const alreadyClassified = new Set((existingRows ?? []).map((r: { contact_id: string }) => r.contact_id));

    // Pure in-memory accumulation across all users
    const allNewClassifications: Record<string, unknown>[] = [];

    for (const uid of userIds) {
      const contacts = (contactsByUser.get(uid) ?? []).slice(0, 500);
      const crit = critByUser.get(uid);
      if (!crit || !contacts.length) continue;

      const minScore = (crit.conditions as { min_score?: number })?.min_score ?? 50;
      for (const c of contacts) {
        evaluated++;
        if (alreadyClassified.has(c.id)) continue;
        if ((c.lead_score ?? 0) >= minScore) {
          allNewClassifications.push({
            user_id: uid, contact_id: c.id, criteria_id: crit.id,
            status: "mql", score_snapshot: c.lead_score, reason: "Cron auto-evaluation",
          });
        }
      }
    }

    // Single bulk insert for all users (1 query total)
    if (allNewClassifications.length > 0) {
      await supabase.from("mql_classifications").insert(allNewClassifications as never[]);
      qualified = allNewClassifications.length;
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
