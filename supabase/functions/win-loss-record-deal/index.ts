import { createClient } from "npm:@supabase/supabase-js@2";
import { scopedCorsHeaders, guardBody } from "../_shared/auth.ts";
import { rateLimit } from "../_shared/rate-limit.ts";
import { z } from "npm:zod@3.23.8";

const limiter = rateLimit({ windowMs: 60_000, max: 60 });

const BodySchema = z.object({
  deal_id: z.string().min(1).max(255),
  outcome: z.enum(["won", "lost", "no_decision", "pending"]).default("pending"),
  deal_value: z.number().nullable().optional(),
  sales_cycle_days: z.number().int().nullable().optional(),
  decision_maker_contact_id: z.string().uuid().nullable().optional(),
});

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: scopedCorsHeaders(req) });

  const { body: rawBody, error: bodyError } = await guardBody(req, 64 * 1024);
  if (bodyError) return bodyError;

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing authorization" }), {
        status: 401,
        headers: { ...scopedCorsHeaders(req), "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );

    const { data: userData } = await supabase.auth.getUser();
    if (!userData?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...scopedCorsHeaders(req), "Content-Type": "application/json" },
      });
    }

    const userId = userData.user.id;
    const limited = limiter.check(userId, req);
    if (limited) return limited;

    const parsed = BodySchema.safeParse(rawBody);
    if (!parsed.success) {
      return new Response(JSON.stringify({ error: parsed.error.flatten().fieldErrors }), {
        status: 400,
        headers: { ...scopedCorsHeaders(req), "Content-Type": "application/json" },
      });
    }

    const body = parsed.data;

    // Upsert placeholder
    const { data, error } = await supabase
      .from("win_loss_records")
      .upsert(
        {
          user_id: userId,
          deal_id: body.deal_id,
          outcome: body.outcome,
          deal_value: body.deal_value ?? null,
          sales_cycle_days: body.sales_cycle_days ?? null,
          decision_maker_contact_id: body.decision_maker_contact_id ?? null,
        },
        { onConflict: "user_id,deal_id" },
      )
      .select()
      .single();

    if (error) throw error;

    return new Response(JSON.stringify({ record: data }), {
      headers: { ...scopedCorsHeaders(req), "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("win-loss-record-deal error:", e);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...scopedCorsHeaders(req), "Content-Type": "application/json" },
    });
  }
});
