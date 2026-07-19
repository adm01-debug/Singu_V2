import { createClient } from "npm:@supabase/supabase-js@2";
import { scopedCorsHeaders, withAuth, jsonError, jsonOk } from "../_shared/auth.ts";
import { rateLimit } from "../_shared/rate-limit.ts";

const limiter = rateLimit({ windowMs: 60_000, max: 20 });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: scopedCorsHeaders(req) });
  }

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const limited = limiter.check(ip);
  if (limited) return limited;

  const authResult = await withAuth(req);
  if (authResult instanceof Response) return authResult;
  const userId = authResult;

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  try {
    const { contactId, objectionId } = await req.json();
    if (!contactId || !objectionId) return jsonError("Missing parameters", 400, req);

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

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
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

    const aiJson = await response.json();
    const result = JSON.parse(aiJson.choices[0].message.tool_calls[0].function.arguments);

     // 3. Persist for Audit and Intelligence Dashboard
     await supabase.from('crm_objection_intelligence').insert({
       contact_id: contactId,
       user_id: userId,
       objection_type: objectionId,
       behavioral_profile: contact.behavior?.dominant_style || 'Não Identificado',
       suggested_strategy: result.title,
       script_content: result.suggested_message,
       success_rate: result.confidence
     });
 
     // Also log in the older table for backward compatibility
     await supabase.from('contact_objection_scripts').insert({
       contact_id: contactId,
       user_id: userId,
       objection_type: objectionId,
       script_content: result.suggested_message,
       neurological_bias: result.reasoning
     }).catch(e => console.error("Compatible log failed", e));

    return jsonOk({ suggestion: result });

  } catch (error) {
    console.error("Objection Handler Error:", error);
    return jsonError(error.message, 500, req);
  }
});
