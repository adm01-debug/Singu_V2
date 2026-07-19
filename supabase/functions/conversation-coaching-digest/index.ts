import { createClient } from "npm:@supabase/supabase-js@2";
import { handleCorsAndMethod, withAuth, jsonOk } from "../_shared/auth.ts";
import { rateLimit } from "../_shared/rate-limit.ts";

const limiter = rateLimit({ windowMs: 60_000, max: 10 });

Deno.serve(async (req) => {
  const pre = handleCorsAndMethod(req);
  if (pre) return pre;
  const auth = await withAuth(req);
  if (auth instanceof Response) return auth;
  const userId = auth;
  const limited = limiter.check(userId, req);
  if (limited) return limited;

  let body: { period_days?: number };
  try { body = await req.json(); } catch { body = {}; }
  const days = Math.min(Math.max(body.period_days ?? 7, 1), 90);
  const since = new Date(Date.now() - days * 86400_000).toISOString();

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const { data: analyses } = await supabase
    .from("conversation_analyses")
    .select("coaching_score, sentiment_overall, talk_ratio_rep, objections, topics, coaching_tips, analyzed_at")
    .eq("user_id", userId)
    .gte("analyzed_at", since)
    .order("analyzed_at", { ascending: false })
    .limit(200);

  if (!analyses || analyses.length === 0) {
    return jsonOk({ ok: true, narrative: "Sem conversas analisadas no período.", stats: null }, req);
  }

  const avgScore = analyses.reduce((s, a) => s + (a.coaching_score ?? 0), 0) / analyses.length;
  const avgTalkRep = analyses.reduce((s, a) => s + Number(a.talk_ratio_rep ?? 0), 0) / analyses.length;
  const sentimentDist = analyses.reduce<Record<string, number>>((acc, a) => {
    const k = a.sentiment_overall ?? "neutral";
    acc[k] = (acc[k] ?? 0) + 1;
    return acc;
  }, {});

  const objectionCount: Record<string, number> = {};
  let unhandled = 0;
  for (const a of analyses) {
    for (const o of (a.objections as Array<{ objection: string; handled: boolean }> ?? [])) {
      objectionCount[o.objection] = (objectionCount[o.objection] ?? 0) + 1;
      if (!o.handled) unhandled++;
    }
  }
  const topObjections = Object.entries(objectionCount).sort((a, b) => b[1] - a[1]).slice(0, 5);

  const stats = {
    total_conversations: analyses.length,
    avg_coaching_score: Math.round(avgScore),
    avg_talk_ratio_rep: Math.round(avgTalkRep),
    sentiment_distribution: sentimentDist,
    top_objections: topObjections,
    unhandled_objections: unhandled,
    period_days: days,
  };

  const apiKey = Deno.env.get("LOVABLE_API_KEY");
  if (!apiKey) return jsonOk({ ok: true, stats, narrative: "IA indisponível." }, req);

  const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "google/gemini-3-flash-preview",
      messages: [
        { role: "system", content: "Você é um sales coach executivo. Gere um digest de coaching curto (3 parágrafos máx, em português) com insights acionáveis." },
        { role: "user", content: `Estatísticas dos últimos ${days} dias: ${JSON.stringify(stats)}` },
      ],
    }),
  });

  if (!aiResp.ok) return jsonOk({ ok: true, stats, narrative: "Falha ao gerar narrativa." }, req);
  const aiJson = await aiResp.json();
  const narrative = aiJson.choices?.[0]?.message?.content ?? "";

  return jsonOk({ ok: true, stats, narrative }, req);
});
