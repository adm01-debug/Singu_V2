import { createClient } from "npm:@supabase/supabase-js@2";
import { bestEffortWrite } from "../_shared/best-effort-write.ts";
import { scopedCorsHeaders, withAuth, jsonError, jsonOk, guardBody } from "../_shared/auth.ts";
import { fetchAI } from "../_shared/fetch-utils.ts";
import { rateLimit } from "../_shared/rate-limit.ts";
import { z } from "npm:zod@3.23.8";

const bodySchema = z.object({
  contactId:    z.string().uuid(),
  // objectionId is interpolated into AI system prompt — cap at 200 chars to prevent prompt injection
  objectionId:  z.string().min(1).max(200),
});

const limiter = rateLimit({ windowMs: 60_000, max: 20 });

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

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  try {
    const { body: rawBody, error: bodyError } = await guardBody(req);
    if (bodyError) return bodyError;

    const parsed = bodySchema.safeParse(rawBody);
    if (!parsed.success) {
      return jsonError(parsed.error.issues[0]?.message ?? "Invalid request body", 400, req);
    }
    const { contactId, objectionId } = parsed.data;

    // 1. Gather Profile and Context — verify ownership with user_id filter
    const { data: contact } = await supabase
      .from('contacts')
      .select('*, contact_behavior(*), contact_personality(*)')
      .eq('id', contactId)
      .eq('user_id', userId)
      .single();

    if (!contact) return jsonError("Contact not found", 404, req);

    const behavior = contact.contact_behavior?.[0] || {};
    const personality = contact.contact_personality?.[0] || {};

    // 2. AI Intelligence for Objection Handling
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const systemPrompt = `Você é um mestre em Negociação, Neurovendas e Psicologia Comportamental de elite.
Sua especialidade é contornar objeções usando o perfil comportamental e sensorial do cliente.

Objeção atual: ${objectionId}

## Perfil do Cliente:
- DISC: ${behavior.dominant_style || 'Não identificado'}
- VAK: ${personality.vak_profile || 'Equilibrado'}
- Tom preferido: ${behavior.communication_style || 'Neutro'}

## Estratégias a Incorporar:
1. Dale Carnegie: Demonstre interesse genuíno e valide o ponto de vista do outro.
2. PNL: Sincronize o vocabulário com o sistema VAK dominante.
3. Feel-Felt-Found: "Entendo como se sente, outros sentiram o mesmo, e o que eles descobriram foi..."

Gere um script que:
1. Valide a objeção com empatia sincera.
2. Requadre o problema para focar em benefício ou custo de oportunidade.
3. CTA clara e de baixo atrito.`;

    if (!LOVABLE_API_KEY) return jsonError("LOVABLE_API_KEY não configurada", 500, req);

    const response = await fetchAI("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.0-flash-exp",
        messages: [{ role: "system", content: systemPrompt }],
        tools: [{
          type: "function",
          function: {
            name: "submit_objection_handler",
            parameters: {
              type: "object",
              properties: {
                title: { type: "string" },
                description: { type: "string" },
                suggested_message: { type: "string" },
                urgency: { type: "string", enum: ["high", "medium"] },
                reasoning: { type: "string" },
                confidence: { type: "number" }
              },
              required: ["title", "description", "suggested_message", "urgency", "reasoning", "confidence"]
            }
          }
        }],
        tool_choice: { type: "function", function: { name: "submit_objection_handler" } }
      })
    });

    if (!response.ok) {
      if (response.status === 429) return jsonError("Rate limit do gateway IA. Tente em alguns segundos.", 429, req);
      if (response.status === 402) return jsonError("Créditos de IA esgotados. Adicione créditos em Settings.", 402, req);
      const errText = await response.text();
      console.error("AI gateway error:", response.status, errText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const aiJson = await response.json();
    const toolArgs = aiJson.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
    if (!toolArgs) throw new Error("AI did not return expected tool call");
    const result = JSON.parse(toolArgs);

     // 3. Persist for Audit and Intelligence Dashboard
     await bestEffortWrite(supabase.from('crm_objection_intelligence').insert({
       contact_id: contactId,
       user_id: userId,
       objection_type: objectionId,
       behavioral_profile: contact.behavior?.dominant_style || 'Não Identificado',
       suggested_strategy: result.title,
       script_content: result.suggested_message,
       success_rate: result.confidence
     }), "crm_objection_intelligence insert error:");

     // Also log in the older table for backward compatibility
     await bestEffortWrite(supabase.from('contact_objection_scripts').insert({
       contact_id: contactId,
       user_id: userId,
       objection_type: objectionId,
       script_content: result.suggested_message,
       neurological_bias: result.reasoning
     }), "Compatible log failed");

    return jsonOk({ suggestion: result }, req);

  } catch (error) {
    console.error("Objection Handler Error:", error);
    return jsonError("Internal server error", 500, req);
  }
});
