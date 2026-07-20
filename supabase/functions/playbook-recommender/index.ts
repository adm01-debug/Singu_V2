import { createClient } from "npm:@supabase/supabase-js@2";
import { z } from "npm:zod@3.23.8";
import { scopedCorsHeaders, guardBody } from "../_shared/auth.ts";
import { rateLimit } from "../_shared/rate-limit.ts";

const limiter = rateLimit({ windowMs: 60_000, max: 5 });


const BodySchema = z.object({
  contact_id: z.string().uuid().optional(),
  deal_id: z.string().optional(),
  current_stage: z.string().optional(),
  recent_topics: z.array(z.string()).max(20).optional(),
  industry: z.string().optional(),
  persona: z.string().optional(),
  competitor_mentioned: z.string().optional(),
});

interface Playbook {
  stage_target?: string;
  scenario?: string;
  industry_target?: string;
  persona_target?: string;
  tags?: string[];
  usage_count?: number;
  [key: string]: unknown;
}

type PlaybookContext = z.infer<typeof BodySchema>;

function scorePlaybook(pb: Playbook, ctx: PlaybookContext): { score: number; reasons: string[] } {
  let score = 0;
  const reasons: string[] = [];

  // Stage match
  if (ctx.current_stage && pb.stage_target && pb.stage_target.toLowerCase() === ctx.current_stage.toLowerCase()) {
    score += 40; reasons.push("Estágio alinhado");
  }

  // Scenario inferred from stage
  const stageScenarioMap: Record<string, string[]> = {
    lead: ["discovery"],
    qualified: ["discovery"],
    demo: ["demo"],
    proposal: ["negotiation", "objection"],
    negotiation: ["negotiation", "objection", "closing"],
    closing: ["closing"],
    won: ["onboarding"],
    lost: ["winback"],
  };
  const stageKey = (ctx.current_stage || "").toLowerCase();
  const expected = stageScenarioMap[stageKey] || [];
  if (expected.includes(pb.scenario)) {
    score += 25; reasons.push(`Cenário ${pb.scenario} adequado`);
  }

  // Industry match
  if (ctx.industry && pb.industry_target && pb.industry_target.toLowerCase().includes(ctx.industry.toLowerCase())) {
    score += 15; reasons.push("Indústria match");
  }

  // Persona match
  if (ctx.persona && pb.persona_target && pb.persona_target.toLowerCase().includes(ctx.persona.toLowerCase())) {
    score += 15; reasons.push("Persona match");
  }

  // Recent topics match against tags
  if (ctx.recent_topics?.length && pb.tags?.length) {
    const topicsLower = ctx.recent_topics.map((t: string) => t.toLowerCase());
    const tagsLower = pb.tags.map((t: string) => t.toLowerCase());
    const overlap = tagsLower.filter((t: string) => topicsLower.some((tp: string) => tp.includes(t) || t.includes(tp))).length;
    if (overlap > 0) {
      score += overlap * 8; reasons.push(`${overlap} tópico(s) relacionados`);
    }
  }

  // Usage popularity boost (small)
  score += Math.min((pb.usage_count || 0) * 0.5, 10);

  return { score, reasons };
}

Deno.serve(async (req) => {
  const cors = scopedCorsHeaders(req);
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });

  const { body: rawBody, error: bodyError } = await guardBody(req, 128 * 1024);
  if (bodyError) return bodyError;

  try {
    const auth = req.headers.get("Authorization");
    if (!auth) return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401, headers: { ...cors, "Content-Type": "application/json" } });

    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: auth } },
    });

    const { data: userData } = await supabase.auth.getUser();
    const user = userData?.user;
    if (!user) return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401, headers: { ...cors, "Content-Type": "application/json" } });

    const rl = limiter.check(user.id, req);
    if (rl) return rl;

    const body = rawBody;
    const parsed = BodySchema.safeParse(body);
    if (!parsed.success) {
      return new Response(JSON.stringify({ error: parsed.error.flatten().fieldErrors }), { status: 400, headers: { ...cors, "Content-Type": "application/json" } });
    }
    const ctx = parsed.data;

    // Pull active playbooks
    const { data: playbooks, error: pbErr } = await supabase
      .from("sales_playbooks")
      .select("*")
      .eq("active", true)
      .limit(100);

    if (pbErr) throw pbErr;

    const ranked = (playbooks || [])
      .map((pb) => ({ playbook: pb, ...scorePlaybook(pb, ctx) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);

    // Battle card if competitor mentioned
    let battleCard = null;
    if (ctx.competitor_mentioned) {
      const escapedCompetitor = ctx.competitor_mentioned
        .replace(/\\/g, "\\\\")
        .replace(/%/g, "\\%")
        .replace(/_/g, "\\_");
      const { data: bc } = await supabase
        .from("battle_cards")
        .select("*")
        .eq("active", true)
        .ilike("competitor_name", `%${escapedCompetitor}%`)
        .limit(1)
        .maybeSingle();
      battleCard = bc;
    }

    return new Response(JSON.stringify({
      recommendations: ranked,
      battle_card: battleCard,
      context: ctx,
    }), { headers: { ...cors, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("playbook-recommender error", e);
    return new Response(JSON.stringify({ error: "Internal server error" }), { status: 500, headers: { ...cors, "Content-Type": "application/json" } });
  }
});
