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
    const [contactRes, interactionsRes, socialRes] = await Promise.all([
      supabase.from('contacts').select('*').eq('id', contactId).single(),
      supabase.from('interactions').select('*').eq('contact_id', contactId).order('created_at', { ascending: false }).limit(5),
      supabase.from('social_behavior_analysis').select('*').eq('contact_id', contactId).order('analysis_date', { ascending: false }).limit(1)
    ]);

    const contact = contactRes.data;
    const interactions = interactionsRes.data || [];
    const social = socialRes.data?.[0];

    if (!contact) return jsonError("Contact not found", 404);

    // 2. Call AI Gateway for Intelligent Suggestion
    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) return jsonError("AI Gateway misconfigured", 500);

    const systemPrompt = `Você é um Estrategista de Vendas e Customer Success de elite.
Sua missão é sugerir a "Próxima Melhor Ação" para um contato no CRM, baseando-se no estágio do funil, perfil comportamental (DISC) e histórico recente.
Seja específico, prático e persuasivo.`;

    const userPrompt = `
CONTATO: ${contact.first_name} ${contact.last_name}
ESTÁGIO ATUAL: ${contact.relationship_stage}
SCORE: ${contact.relationship_score}/100
SENTIMENTO: ${contact.sentiment}

PERFIL COMPORTAMENTAL (DISC): ${JSON.stringify(contact.behavior || {})}
INSIGHTS SOCIAIS: ${social?.executive_summary || 'Nenhum dado social disponível'}

ÚLTIMAS INTERAÇÕES:
${interactions.map(i => `- ${i.type}: ${i.title} (${i.sentiment})`).join('\n')}

Por favor, gere:
1. Uma ação clara (ex: "Enviar Mensagem de Reaquecimento")
2. O motivo estratégico (baseado nos dados)
3. Um script/template sugerido pronto para uso
4. O canal ideal (whatsapp, email, call, etc)
5. Urgência (low, medium, high)
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
