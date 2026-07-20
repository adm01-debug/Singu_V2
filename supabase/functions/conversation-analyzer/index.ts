import { createClient } from "npm:@supabase/supabase-js@2";
import { handleCorsAndMethod, withAuth, jsonError, jsonOk, guardBody } from "../_shared/auth.ts";
import { fetchAI } from "../_shared/fetch-utils.ts";
import { rateLimit } from "../_shared/rate-limit.ts";
import { z } from "npm:zod@3.23.8";

const bodySchema = z.object({
  interaction_id: z.string().uuid(),
  force:          z.boolean().optional(),
});

const limiter = rateLimit({ windowMs: 60_000, max: 20 });

Deno.serve(async (req) => {
  const pre = handleCorsAndMethod(req);
  if (pre) return pre;

  const auth = await withAuth(req);
  if (auth instanceof Response) return auth;
  const userId = auth;

  const limited = limiter.check(userId, req);
  if (limited) return limited;

  const { body: rawBody, error: bodyError } = await guardBody(req);
  if (bodyError) return bodyError;

  const parsed = bodySchema.safeParse(rawBody);
  if (!parsed.success) {
    return jsonError(parsed.error.issues[0]?.message ?? "Invalid request body", 400, req);
  }
  const { interaction_id: interactionId, force } = parsed.data;

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

  // Existing-check and topics catalog are independent — fetch in parallel
  const [existingResult, topicsResult] = await Promise.all([
    force
      ? Promise.resolve({ data: null })
      : supabase
          .from("conversation_analyses")
          .select("id")
          .eq("interaction_id", interactionId)
          .maybeSingle(),
    supabase
      .from("conversation_topics_catalog")
      .select("topic_key, label, category, keywords")
      .eq("user_id", userId)
      .eq("active", true),
  ]);

  if (!force && existingResult.data) {
    return jsonOk({ ok: true, cached: true, id: (existingResult.data as { id: string }).id }, req);
  }

  const { data: topics } = topicsResult;
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

  const aiResp = await fetchAI("https://ai.gateway.lovable.dev/v1/chat/completions", {
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
                     reframing_suggestions: {
                       type: "array",
                       items: {
                         type: "object",
                         properties: {
                           pattern: { type: "string", enum: ["intention", "redefinition", "consequence", "chunk_up", "chunk_down", "counter_example", "analogy", "apply_to_self", "another_outcome", "hierarchy_criteria", "change_frame_size", "meta_frame", "model_of_world", "reality_strategy"] },
                           response: { type: "string" }
                         },
                         required: ["pattern", "response"]
                       },
                       maxItems: 3
                     }
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
               relatives_mentioned: {
                 type: "array",
                 items: {
                   type: "object",
                   properties: {
                     name: { type: "string" },
                     relationship_type: { type: "string", enum: ["conjuge", "filho", "filha", "pai", "mae", "irmao", "irma", "socio", "assistente", "outro"] },
                     occupation: { type: "string" },
                     company: { type: "string" },
                     is_decision_influencer: { type: "boolean" },
                     notes: { type: "string" }
                   },
                   required: ["name", "relationship_type"]
                 }
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
               },
               emotion_analysis: {
                 type: "object",
                 properties: {
                   joy: { type: "number", description: "0-1" },
                   fear: { type: "number", description: "0-1" },
                   anger: { type: "number", description: "0-1" },
                   sadness: { type: "number", description: "0-1" },
                   confidence: { type: "number", description: "0-1" },
                   hesitation: { type: "number", description: "0-1" },
                   urgency: { type: "number", description: "0-1" }
                 },
                 required: ["joy", "fear", "anger", "sadness", "confidence", "hesitation", "urgency"]
               }
             },
             required: ["talk_ratio_rep","talk_ratio_customer","sentiment_overall","topics","objections","action_items","coaching_score","coaching_tips","next_best_action", "emotion_analysis"],
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
 
    // Prepare all side-effect rows up-front (pure computation)
    const reframings: Array<Record<string, unknown>> = [];
    if (analysis.objections && Array.isArray(analysis.objections)) {
      (analysis.objections as Array<{ objection: string; category: string; reframing_suggestions?: Array<{ pattern: string; response: string }> }>).forEach((obj) => {
        if (obj.reframing_suggestions && Array.isArray(obj.reframing_suggestions)) {
          obj.reframing_suggestions.forEach((ref) => {
            reframings.push({
              user_id: userId,
              contact_id: interaction.contact_id,
              interaction_id: interactionId,
              objection: obj.objection,
              objection_category: obj.category,
              pattern_used: ref.pattern,
              suggested_response: ref.response,
              confidence_score: 90
            });
          });
        }
      });
    }

    const relativesSuggestions: Array<Record<string, unknown>> = [];
    if (analysis.relatives_mentioned && Array.isArray(analysis.relatives_mentioned)) {
      (analysis.relatives_mentioned as Array<{ name: string; relationship_type: string; occupation?: string; notes?: string }>).forEach((rel) => {
        const occupationSuffix = rel.occupation ? ` - ${rel.occupation}` : '';
        relativesSuggestions.push({
          user_id: userId,
          contact_id: interaction.contact_id,
          event_type: 'other',
          title: `Novo Relacionado Detectado: ${rel.name}`,
          description: `${rel.name} (${rel.relationship_type})${occupationSuffix}. ${rel.notes || ''}`,
          source_type: 'conversation',
          confidence: 0.8,
          status: 'pending',
          metadata: { interaction_id: interactionId, type: 'relative_suggestion', relative_data: rel }
        });
      });
    }

    const lifeEvents: Array<Record<string, unknown>> = [];
    if (analysis.life_events_detected && Array.isArray(analysis.life_events_detected)) {
      (analysis.life_events_detected as Array<{ event_type: string; title: string; description: string; event_date?: string; confidence: number }>).forEach((ev) => {
        lifeEvents.push({
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
        });
      });
    }

    // Side-effect writes — fire-and-forget (response uses saved.id + analysis, not these results)
    Promise.all([
      supabase.from("interactions").update({
        sentiment: analysis.sentiment_overall,
        emotion_analysis: analysis.emotion_analysis,
        key_insights: analysis.action_items && Array.isArray(analysis.action_items)
          ? (analysis.action_items as Array<{ task: string }>).map(i => i.task)
          : []
      }).eq("id", interactionId),
      reframings.length > 0
        ? supabase.from('reframing_analysis').insert(reframings)
        : Promise.resolve(),
      (relativesSuggestions.length + lifeEvents.length) > 0
        ? supabase.from('suggested_life_events').insert([...relativesSuggestions, ...lifeEvents])
        : Promise.resolve(),
    ]).catch((e: unknown) => console.error("conversation-analyzer side-effects error:", e));

   return jsonOk({ ok: true, id: saved.id, analysis }, req);
});
