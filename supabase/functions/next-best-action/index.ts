import { createClient } from "npm:@supabase/supabase-js@2";
import { handleCorsAndMethod, withAuth, jsonError, jsonOk } from "../_shared/auth.ts";

Deno.serve(async (req) => {
  const pre = handleCorsAndMethod(req);
  if (pre) return pre;

  const auth = await withAuth(req);
  if (auth instanceof Response) return auth;
  const userId = auth;

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  try {
    const { contactId, force = false } = await req.json();
    if (!contactId) return jsonError("contactId is required", 400);

    // 1. Gather Rich Context
    const [contactRes, interactionsRes, socialRes, neuroRes] = await Promise.all([
      supabase.from('contacts').select('*').eq('id', contactId).single(),
      supabase.from('interactions').select('*').eq('contact_id', contactId).order('created_at', { ascending: false }).limit(5),
      supabase.from('social_behavior_analysis').select('*').eq('contact_id', contactId).order('analysis_date', { ascending: false }).limit(1),
      supabase.from('neuro_behavioral_history').select('*').eq('contact_id', contactId).order('created_at', { ascending: false }).limit(3)
    ]);

    const contact = contactRes.data;
    const interactions = interactionsRes.data || [];
    const social = socialRes.data?.[0];
    const neuroHistory = neuroRes.data || [];

    if (!contact) return jsonError("Contact not found", 404);

    // 2. Call AI Gateway for Intelligent Suggestion
    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) return jsonError("AI Gateway misconfigured", 500);

    const systemPrompt = `Você é um Estrategista de Vendas e Customer Success de elite.
Sua missão é sugerir a "Próxima Melhor Ação" para um contato no CRM, baseando-se no estágio do funil, perfil comportamental (DISC) e histórico recente.
Seja específico, prático e persuasivo.`;

    const userPrompt = `
CONTATO: ${contact.first_name} ${contact.last_name}
ESTÁGIO ATUAL (NEGOCIAÇÃO): ${contact.relationship_stage}
SCORE: ${contact.relationship_score}/100
SENTIMENTO ATUAL: ${contact.sentiment}

PERFIL COMPORTAMENTAL (DISC): ${JSON.stringify(contact.behavior || {})}
HISTÓRICO NEUROMARKETING (Evolução):
${neuroHistory.map(n => `- ${new Date(n.created_at).toLocaleDateString()}: Empatia=${n.empathy_score}, Domínio=${JSON.stringify(n.dominance_data)}`).join('\n')}

INSIGHTS SOCIAIS: ${social?.executive_summary || 'Nenhum dado social disponível'}

ÚLTIMAS INTERAÇÕES DA TIMELINE:
${interactions.map(i => `- ${i.type}: ${i.resumo || i.title} (${i.sentiment || 'neutral'})`).join('\n')}

INSTRUÇÃO: Gere a Próxima Melhor Ação considerando o contexto de neuromarketing e o estágio da negociação. Se a empatia está caindo, sugira uma abordagem mais humana. Se a dominância é alta, seja mais direto.

Por favor, gere:
1. Uma ação clara e estratégica
2. O motivo (explicando a correlação com o neuromarketing/estágio)
3. Um script sugerido personalizado
4. O canal ideal
5. Urgência
`;

    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.0-flash-exp",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        tools: [{
          type: "function",
          function: {
            name: "submit_next_best_action",
            parameters: {
              type: "object",
              properties: {
                action: { type: "string" },
                reason: { type: "string" },
                suggested_script: { type: "string" },
                channel: { type: "string", enum: ["whatsapp", "email", "call", "linkedin", "meeting"] },
                urgency: { type: "string", enum: ["low", "medium", "high"] },
                expected_outcome: { type: "string" }
              },
              required: ["action", "reason", "suggested_script", "channel", "urgency"]
            }
          }
        }],
        tool_choice: { type: "function", function: { name: "submit_next_best_action" } }
      })
    });

    if (!aiResp.ok) throw new Error("AI Gateway failed");

    const aiJson = await aiResp.json();
    const toolCall = aiJson.choices?.[0]?.message?.tool_calls?.[0];
    const result = JSON.parse(toolCall.function.arguments);

    // 3. Persist Action
    const nextActionData = {
      user_id: userId,
      contact_id: contactId,
      action: result.action,
      reason: result.reason,
      channel: result.channel,
      urgency: result.urgency,
      suggested_script: result.suggested_script,
      expected_outcome: result.expected_outcome,
      generated_at: new Date().toISOString(),
      model: "gemini-2.0-flash"
    };

    await supabase.from('contact_next_actions').upsert(nextActionData, { onConflict: 'contact_id' });

    return jsonOk({ success: true, next_action: nextActionData });

  } catch (error) {
    console.error("NBA Error:", error);
    return jsonError(error.message, 500);
  }
});
