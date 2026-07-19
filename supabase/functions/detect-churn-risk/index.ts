import { createClient } from "npm:@supabase/supabase-js@2";
import { scopedCorsHeaders, withAuth, jsonError, jsonOk } from "../_shared/auth.ts";
import { rateLimit } from "../_shared/rate-limit.ts";

const limiter = rateLimit({ windowMs: 60_000, max: 15 });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: scopedCorsHeaders(req) });
  }

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const limited = limiter.check(ip, req);
  if (limited) return limited;

  const authResult = await withAuth(req);
  if (authResult instanceof Response) return authResult;
  const userId = authResult;

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    let body: { contactId?: string } = {};
    try { body = await req.json(); } catch { /* no body */ }

    let contactsQuery = supabase.from("contacts").select("*").eq("user_id", userId);
    if (body.contactId) contactsQuery = contactsQuery.eq("id", body.contactId);
    const { data: contacts, error: cErr } = await contactsQuery;
    if (cErr) throw cErr;
    if (!Array.isArray(contacts) || contacts.length === 0) {
      return jsonOk({ success: true, analyzed: 0, risks: [] }, req);
    }

    const contactIds = contacts.map((c) => c.id);
    const { data: interactions } = await supabase
      .from("interactions")
      .select("contact_id, created_at, sentiment, type")
      .in("contact_id", contactIds)
      .order("created_at", { ascending: false })
      .limit(500);

    const now = Date.now();
    const risks: Array<Record<string, unknown>> = [];

    for (const contact of contacts) {
      const cInteractions = (interactions || []).filter((i) => i.contact_id === contact.id);
      const factors: Array<{ factor: string; weight: number; detail: string }> = [];
      let riskScore = 0;

      // Factor 1: Inactivity
      const lastInteraction = cInteractions[0];
      const daysSince = lastInteraction
        ? Math.floor((now - new Date(lastInteraction.created_at).getTime()) / 86400000)
        : 999;

      if (daysSince > 60) {
        riskScore += 35;
        factors.push({ factor: "inatividade_critica", weight: 35, detail: `${daysSince} dias sem interação` });
      } else if (daysSince > 30) {
        riskScore += 25;
        factors.push({ factor: "inatividade_alta", weight: 25, detail: `${daysSince} dias sem interação` });
      } else if (daysSince > 14) {
        riskScore += 10;
        factors.push({ factor: "inatividade_moderada", weight: 10, detail: `${daysSince} dias sem interação` });
      }

      // Factor 2: Negative sentiment trend
      const recent5 = cInteractions.slice(0, 5);
      const negCount = recent5.filter((i) => i.sentiment === "negative").length;
      const sentimentTrend = negCount >= 3 ? "declining" : negCount >= 1 ? "mixed" : "positive";
      if (negCount >= 3) {
        riskScore += 25;
        factors.push({ factor: "sentimento_negativo", weight: 25, detail: `${negCount}/5 interações negativas` });
      } else if (negCount >= 1) {
        riskScore += 10;
        factors.push({ factor: "sentimento_misto", weight: 10, detail: `${negCount}/5 interações negativas` });
      }

      // Factor 3: Low relationship score
      const relScore = contact.relationship_score ?? 50;
      if (relScore < 20) {
        riskScore += 20;
        factors.push({ factor: "score_muito_baixo", weight: 20, detail: `Score: ${relScore}` });
      } else if (relScore < 40) {
        riskScore += 10;
        factors.push({ factor: "score_baixo", weight: 10, detail: `Score: ${relScore}` });
      }
      const scoreTrend = relScore < 30 ? "declining" : relScore < 60 ? "stable" : "growing";

      // Factor 4: Interaction frequency drop
      const last30 = cInteractions.filter(
        (i) => now - new Date(i.created_at).getTime() < 30 * 86400000
      ).length;
      const prev30 = cInteractions.filter((i) => {
        const age = now - new Date(i.created_at).getTime();
        return age >= 30 * 86400000 && age < 60 * 86400000;
      }).length;
      if (prev30 > 0 && last30 === 0) {
        riskScore += 15;
        factors.push({ factor: "queda_frequencia", weight: 15, detail: `De ${prev30} para 0 interações/mês` });
      } else if (prev30 > 2 && last30 <= 1) {
        riskScore += 10;
        factors.push({ factor: "reducao_frequencia", weight: 10, detail: `De ${prev30} para ${last30} interações/mês` });
      }

      // Factor 5: No response channel
      if (cInteractions.length === 0) {
        riskScore += 15;
        factors.push({ factor: "sem_historico", weight: 15, detail: "Nenhuma interação registrada" });
      }

      riskScore = Math.min(100, riskScore);
      const riskLevel = riskScore >= 75 ? "critical" : riskScore >= 50 ? "high" : riskScore >= 25 ? "medium" : "low";

      const recommendations = buildRecommendations(riskLevel, factors, daysSince, contact);

      if (riskScore >= 20) {
        risks.push({
          contact_id: contact.id,
          risk_level: riskLevel,
          risk_score: riskScore,
          risk_factors: factors,
          recommendations,
          days_since_last_interaction: daysSince === 999 ? null : daysSince,
          sentiment_trend: sentimentTrend,
          score_trend: scoreTrend,
        });
      }
    }

    risks.sort((a, b) => (b.risk_score as number) - (a.risk_score as number));
    const top = risks.slice(0, 50);

    // Upsert results
    if (top.length > 0) {
      // Delete old for these contacts
      const riskContactIds = top.map((r) => r.contact_id as string);
      await supabase.from("churn_risk_scores").delete().eq("user_id", userId).in("contact_id", riskContactIds);

      const rows = top.map((r) => ({
        user_id: userId,
        contact_id: r.contact_id,
        risk_level: r.risk_level,
        risk_score: r.risk_score,
        risk_factors: r.risk_factors,
        recommendations: r.recommendations,
        days_since_last_interaction: r.days_since_last_interaction,
        sentiment_trend: r.sentiment_trend,
        score_trend: r.score_trend,
        analyzed_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 7 * 86400000).toISOString(),
      }));
      await supabase.from("churn_risk_scores").insert(rows);
    }

    return jsonOk({ success: true, analyzed: contacts.length, risks: top }, req);
  } catch (error) {
    console.error("detect-churn-risk error:", error);
    return jsonError(error instanceof Error ? error.message : "Erro desconhecido", 500, req);
  }
});

function buildRecommendations(
  level: string,
  factors: Array<{ factor: string }>,
  daysSince: number,
  contact: Record<string, unknown>
): string[] {
  const recs: string[] = [];
  const hasInactivity = factors.some((f) => f.factor.startsWith("inatividade"));
  const hasNegSentiment = factors.some((f) => f.factor === "sentimento_negativo");

  if (level === "critical") {
    recs.push("Agendar reunião urgente de retenção com o contato");
    if (hasNegSentiment) recs.push("Preparar plano de ação para resolver insatisfações pendentes");
  }
  if (level === "high" || level === "critical") {
    recs.push("Enviar mensagem personalizada demonstrando valor");
    if (hasInactivity && daysSince > 30) recs.push(`Re-engajar via ${contact.whatsapp ? "WhatsApp" : "email"}`);
  }
  if (hasInactivity) {
    recs.push(`Último contato há ${daysSince} dias — programar follow-up imediato`);
  }
  if (factors.some((f) => f.factor === "queda_frequencia")) {
    recs.push("Aumentar cadência de comunicação nas próximas 2 semanas");
  }
  if (recs.length === 0) recs.push("Manter monitoramento regular do relacionamento");
  return recs.slice(0, 4);
}
