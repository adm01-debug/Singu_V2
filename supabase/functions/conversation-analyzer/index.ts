import { createClient } from "npm:@supabase/supabase-js@2";
import { handleCorsAndMethod, withAuth, jsonError, jsonOk } from "../_shared/auth.ts";
import { rateLimit } from "../_shared/rate-limit.ts";

const limiter = rateLimit({ windowMs: 60_000, max: 20 });

Deno.serve(async (req) => {
  const pre = handleCorsAndMethod(req);
  if (pre) return pre;

  const auth = await withAuth(req);
  if (auth instanceof Response) return auth;
  const userId = auth;

  const limited = limiter.check(userId);
  if (limited) return limited;

  let body: { interaction_id?: string; force?: boolean };
  try { body = await req.json(); } catch { return jsonError("Invalid JSON", 400, req); }
  const interactionId = body.interaction_id;
  if (!interactionId || typeof interactionId !== "string") {
    return jsonError("interaction_id required", 400, req);
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const { data: interaction, error: intErr } = await supabase
    .from("interactions")
    .select("id, user_id, contact_id, content, type, duration_seconds, title")
    .eq("id", interactionId)
    .eq("user_id", userId)
    .maybeSingle();
  if (intErr || !interaction) return jsonError("Interaction not found", 404, req);
  if (!interaction.content || interaction.content.length < 80) {
    return jsonError("Conteúdo insuficiente para análise (mínimo 80 caracteres)", 400, req);
  }

  if (!body.force) {
    const { data: existing } = await supabase
      .from("conversation_analyses")
      .select("id")
      .eq("interaction_id", interactionId)
      .maybeSingle();
    if (existing) {
      return jsonOk({ ok: true, cached: true, id: existing.id }, req);
    }
  }

  const { data: topics } = await supabase
    .from("conversation_topics_catalog")
    .select("topic_key, label, category, keywords")
    .eq("user_id", userId)
    .eq("active", true);
  const topicCatalog = (topics ?? []).map((t) => ({
    key: t.topic_key, label: t.label, category: t.category, keywords: t.keywords,
  }));

  const apiKey = Deno.env.get("LOVABLE_API_KEY");
  if (!apiKey) return jsonError("AI gateway misconfigured", 500, req);

  const systemPrompt = `Você é um analista sênior de Conversation Intelligence para vendas B2B.
Analise a transcrição abaixo e extraia métricas estruturadas. Use o catálogo de tópicos do usuário para classificar quando aplicável.
Catálogo de tópicos: ${JSON.stringify(topicCatalog)}`;

  const userPrompt = `Transcrição (tipo: ${interaction.type}, título: ${interaction.title ?? "—"}):

${interaction.content.slice(0, 12000)}`;

  const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "google/gemini-3-flash-preview",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      tools: [{
        type: "function",
        function: {
          name: "submit_conversation_analysis",
          description: "Estrutura completa da análise da conversa",
          parameters: {
            type: "object",
            properties: {
              talk_ratio_rep: { type: "number", description: "% de fala do vendedor (0-100)" },
              talk_ratio_customer: { type: "number", description: "% de fala do cliente (0-100)" },
              longest_monologue_seconds: { type: "integer" },
              questions_asked: { type: "integer", description: "Perguntas abertas feitas pelo vendedor" },
              sentiment_overall: { type: "string", enum: ["positive","neutral","negative","mixed"] },
              sentiment_timeline: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    position_pct: { type: "number" },
                    sentiment: { type: "string", enum: ["positive","neutral","negative"] },
                    note: { type: "string" },
                  },
                  required: ["position_pct","sentiment"],
                },
              },
              topics: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    topic_key: { type: "string" },
                    label: { type: "string" },
                    category: { type: "string" },
                    mentions: { type: "integer" },
                    relevance: { type: "number" },
                  },
                  required: ["label","category","mentions"],
                },
              },
              objections: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    objection: { type: "string" },
                    category: { type: "string", enum: ["price","timing","authority","need","competition","trust","other"] },
                    handled: { type: "boolean" },
                    suggested_response: { type: "string" },
                  },
                  required: ["objection","category","handled"],
                },
              },
              action_items: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    task: { type: "string" },
                    owner: { type: "string", enum: ["rep","customer","shared"] },
                    deadline: { type: "string" },
                  },
                  required: ["task","owner"],
                },
              },
              key_moments: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    position_pct: { type: "number" },
                    moment_type: { type: "string", enum: ["pain_revealed","budget_disclosed","decision_criteria","objection","commitment","competitor_mentioned","next_step"] },
                    description: { type: "string" },
                  },
                  required: ["position_pct","moment_type","description"],
                },
              },
              coaching_score: { type: "integer", minimum: 0, maximum: 100 },
               coaching_tips: { type: "array", items: { type: "string" }, maxItems: 6 },
               next_best_action: { type: "string" },
               life_events_detected: {
                 type: "array",
                 items: {
                   type: "object",
                   properties: {
                     event_type: { type: "string", enum: ["birthday", "anniversary", "promotion", "travel", "family", "achievement", "other"] },
                     title: { type: "string" },
                     description: { type: "string" },
                     event_date: { type: "string", description: "ISO date if mentioned, otherwise null" },
                     confidence: { type: "number" }
                   },
                   required: ["event_type", "title", "confidence"]
                 }
               }
             },
             required: ["talk_ratio_rep","talk_ratio_customer","sentiment_overall","topics","objections","action_items","coaching_score","coaching_tips","next_best_action"],
            additionalProperties: false,
          },
        },
      }],
      tool_choice: { type: "function", function: { name: "submit_conversation_analysis" } },
    }),
  });

  if (!aiResp.ok) {
    const txt = await aiResp.text();
    if (aiResp.status === 429) return jsonError("Rate limit do gateway IA. Tente em alguns segundos.", 429, req);
    if (aiResp.status === 402) return jsonError("Créditos de IA esgotados. Adicione créditos em Settings > Workspace > Usage.", 402, req);
    console.error("AI gateway error:", aiResp.status, txt);
    return jsonError("Falha ao chamar IA", 500, req);
  }

  const aiJson = await aiResp.json();
  const toolCall = aiJson.choices?.[0]?.message?.tool_calls?.[0];
  if (!toolCall?.function?.arguments) return jsonError("IA não retornou estrutura esperada", 500, req);

  let analysis: Record<string, unknown>;
  try { analysis = JSON.parse(toolCall.function.arguments); }
  catch { return jsonError("Falha ao parsear resposta da IA", 500, req); }

  const { data: saved, error: saveErr } = await supabase
    .from("conversation_analyses")
    .upsert({
      user_id: userId,
      interaction_id: interactionId,
      contact_id: interaction.contact_id,
      duration_seconds: interaction.duration_seconds ?? null,
      talk_ratio_rep: analysis.talk_ratio_rep,
      talk_ratio_customer: analysis.talk_ratio_customer,
      longest_monologue_seconds: analysis.longest_monologue_seconds ?? null,
      questions_asked: analysis.questions_asked ?? 0,
      sentiment_overall: analysis.sentiment_overall,
      sentiment_timeline: analysis.sentiment_timeline ?? [],
      topics: analysis.topics ?? [],
      objections: analysis.objections ?? [],
      action_items: analysis.action_items ?? [],
      key_moments: analysis.key_moments ?? [],
      coaching_score: analysis.coaching_score,
      coaching_tips: analysis.coaching_tips ?? [],
      next_best_action: analysis.next_best_action,
      model_used: "google/gemini-3-flash-preview",
      analyzed_at: new Date().toISOString(),
    }, { onConflict: "user_id,interaction_id" })
    .select("id")
    .single();

   if (saveErr) {
     console.error("Save error:", saveErr);
     return jsonError("Falha ao persistir análise", 500, req);
   }

   // Handle detected life events
   if (analysis.life_events_detected && Array.isArray(analysis.life_events_detected)) {
     const lifeEvents = analysis.life_events_detected.map((ev: any) => ({
       user_id: userId,
       contact_id: interaction.contact_id,
       event_type: ev.event_type,
       title: ev.title,
       description: ev.description,
       event_date: ev.event_date || null,
       source_type: 'conversation',
       confidence: ev.confidence,
       status: 'pending',
       metadata: { interaction_id: interactionId }
     }));

     if (lifeEvents.length > 0) {
       await supabase.from('suggested_life_events').insert(lifeEvents);
     }
   }

   return jsonOk({ ok: true, id: saved.id, analysis }, req);
});
