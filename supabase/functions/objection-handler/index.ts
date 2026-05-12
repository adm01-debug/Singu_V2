import { createClient } from "npm:@supabase/supabase-js@2";
import { scopedCorsHeaders, withAuth, jsonError, jsonOk } from "../_shared/auth.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: scopedCorsHeaders(req) });
  }

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

    // 1. Gather Profile and Context
    const { data: contact } = await supabase
      .from('contacts')
      .select('*, contact_behavior(*)')
      .eq('id', contactId)
      .single();

    if (!contact) return jsonError("Contact not found", 404, req);

    // 2. AI Intelligence for Objection Handling
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const systemPrompt = `Você é um mestre em Negociação e Psicologia Comportamental.
Sua especialidade é contornar objeções usando o perfil DISC do cliente.
Objeção atual: ${objectionId}
Perfil DISC: ${JSON.stringify(contact.behavior || {})}

Gere um script altamente persuasivo que:
1. Valide a preocupação do cliente (Empatia)
2. Requadre o problema (Ponto de vista lógico/DISC)
3. Chame para uma ação específica.`;

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

    // 3. Persist for Audit
    await supabase.from('contact_objection_scripts').insert({
      contact_id: contactId,
      user_id: userId,
      objection_type: objectionId,
      script_content: result.suggested_message,
      neurological_bias: result.reasoning
    });

    return jsonOk({ suggestion: result });

  } catch (error) {
    console.error("Objection Handler Error:", error);
    return jsonError(error.message, 500, req);
  }
});
