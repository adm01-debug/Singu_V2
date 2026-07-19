import { createClient } from "npm:@supabase/supabase-js@2";
import { z } from "npm:zod@3.23.8";
import { scopedCorsHeaders, requireCronSecret} from "../_shared/auth.ts";


/* ─── Schemas ──────────────────────────────────────────────── */

const DistributeSchema = z.object({
  action: z.literal("distribute"),
  contact_id: z.string().uuid().optional(),
  company_id: z.string().uuid().optional(),
  rule_id: z.string().uuid().optional(),
  role_filter: z.enum(["sdr", "closer", "any"]).default("any"),
});

const RedistributeSchema = z.object({
  action: z.literal("redistribute"),
  inactivity_days: z.number().int().min(1).max(90).default(7),
});

const ResetSchema = z.object({
  action: z.literal("reset_daily"),
});

const RequestSchema = z.discriminatedUnion("action", [
  DistributeSchema,
  RedistributeSchema,
  ResetSchema,
]);

/* ─── Helpers ──────────────────────────────────────────────── */

function json(data: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });
}

function createSupabaseAdmin() {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );
}

async function authenticateUser(
  supabase: ReturnType<typeof createClient>,
  authHeader: string | null,
) {
  if (!authHeader) throw new Error("Não autorizado");
  const token = authHeader.replace("Bearer ", "");
  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) throw new Error("Token inválido");
  return user;
}

/* ─── Handlers ─────────────────────────────────────────────── */

async function handleDistribute(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  body: z.infer<typeof DistributeSchema>,
) {
  const roleFilter = body.role_filter;

  let query = supabase
    .from("sales_team_members")
    .select("*")
    .eq("is_active", true);

  if (roleFilter !== "any") {
    query = query.eq("role", roleFilter);
  }

  const { data: members, error: mErr } = await query
    .order("last_assigned_at", { ascending: true, nullsFirst: true });

  if (mErr) return json({ error: mErr.message }, 500);
  if (!members?.length) {
    return json({ error: "Nenhum vendedor elegível disponível" }, 400);
  }

  const now = new Date();
  const eligible = members.filter((m: Record<string, unknown>) => {
    const leadsToday = (m.leads_today as number) ?? 0;
    const maxDay = (m.max_leads_day as number) ?? 10;
    const currentCount = (m.current_lead_count as number) ?? 0;
    const maxTotal = (m.max_leads_total as number) ?? 50;

    if (leadsToday >= maxDay || currentCount >= maxTotal) return false;

    const vacStart = m.vacation_start as string | null;
    const vacEnd = m.vacation_end as string | null;
    if (vacStart && vacEnd) {
      if (now >= new Date(vacStart) && now <= new Date(vacEnd)) return false;
    }
    return true;
  });

  if (!eligible.length) {
    return json({ error: "Todos os vendedores atingiram o limite ou estão em férias" }, 400);
  }

  eligible.sort((a: Record<string, unknown>, b: Record<string, unknown>) => {
    const aTime = a.last_assigned_at ? new Date(a.last_assigned_at as string).getTime() : 0;
    const bTime = b.last_assigned_at ? new Date(b.last_assigned_at as string).getTime() : 0;
    const weightDiff = ((b.weight as number) ?? 5) - ((a.weight as number) ?? 5);
    return (aTime - bTime) + weightDiff * -100_000;
  });

  const selected = eligible[0];
  const selectedId = selected.id as string;

  const { error: assignErr } = await supabase
    .from("lead_assignments")
    .insert({
      user_id: userId,
      contact_id: body.contact_id ?? null,
      company_id: body.company_id ?? null,
      assigned_to: selectedId,
      assignment_type: "auto_weighted",
      status: "active",
      routing_rule_id: body.rule_id ?? null,
      sla_deadline: new Date(Date.now() + 4 * 3600_000).toISOString(),
    });

  if (assignErr) return json({ error: assignErr.message }, 500);

  await supabase
    .from("sales_team_members")
    .update({
      current_lead_count: ((selected.current_lead_count as number) ?? 0) + 1,
      leads_today: ((selected.leads_today as number) ?? 0) + 1,
      last_assigned_at: new Date().toISOString(),
    })
    .eq("id", selectedId);

  return json({
    success: true,
    assigned_to: selectedId,
    member_name: selected.name as string,
  });
}

async function handleRedistribute(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  body: z.infer<typeof RedistributeSchema>,
) {
  const inactivityDays = body.inactivity_days;
  const cutoff = new Date(Date.now() - inactivityDays * 86400_000).toISOString();

  const { data: stale, error: staleErr } = await supabase
    .from("lead_assignments")
    .select("*")
    .eq("status", "active")
    .is("first_contact_at", null)
    .lt("created_at", cutoff)
    .limit(50);

  if (staleErr) return json({ error: staleErr.message }, 500);
  if (!stale?.length) {
    return json({ redistributed: 0, message: "Nenhum lead inativo encontrado" });
  }

  let redistributed = 0;

  for (const assignment of stale) {
    await supabase
      .from("lead_assignments")
      .update({ status: "expired" })
      .eq("id", assignment.id);

    if (assignment.assigned_to) {
      const { data: oldMember } = await supabase
        .from("sales_team_members")
        .select("current_lead_count")
        .eq("id", assignment.assigned_to)
        .single();

      if (oldMember) {
        await supabase
          .from("sales_team_members")
          .update({
            current_lead_count: Math.max(0, (oldMember.current_lead_count ?? 0) - 1),
          })
          .eq("id", assignment.assigned_to);
      }
    }

    await supabase.from("redistribution_log").insert({
      user_id: userId,
      contact_id: assignment.contact_id,
      company_id: assignment.company_id,
      from_member_id: assignment.assigned_to,
      reason: "inactivity",
      auto_triggered: true,
      inactivity_days: inactivityDays,
    });

    redistributed++;
  }

  return json({ redistributed, message: `${redistributed} leads redistribuídos` });
}

async function handleResetDaily(supabase: ReturnType<typeof createClient>) {
  const { data, error } = await supabase.rpc("reset_daily_lead_counts");
  if (error) return json({ error: error.message }, 500);
  return json({ success: true, reset_count: data });
}

/* ─── Main ─────────────────────────────────────────────────── */

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {

  const cronCheck = requireCronSecret(req);
  if (cronCheck) return cronCheck;
    return new Response("ok", { headers: cors });
  }

  try {
    const supabase = createSupabaseAdmin();
    const user = await authenticateUser(supabase, req.headers.get("Authorization"));
    const rawBody = await req.json();

    const parsed = RequestSchema.safeParse(rawBody);
    if (!parsed.success) {
      return json({
        error: "Dados inválidos",
        details: parsed.error.flatten().fieldErrors,
      }, 400);
    }

    const body = parsed.data;

    switch (body.action) {
      case "distribute":
        return await handleDistribute(supabase, user.id, body);
      case "redistribute":
        return await handleRedistribute(supabase, user.id, body);
      case "reset_daily":
        return await handleResetDaily(supabase);
    }
  } catch (e) {
    const message = e instanceof Error ? e.message : "Erro interno";
    const status = message.includes("autorizado") || message.includes("Token") ? 401 : 500;
    console.error("[lead-routing] Error:", e);
    return json({ error: message }, status);
  }
});
