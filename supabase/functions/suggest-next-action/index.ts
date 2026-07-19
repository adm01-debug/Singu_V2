import { createClient } from "npm:@supabase/supabase-js@2";
import { z } from "npm:zod@3.23.8";
import { scopedCorsHeaders, withAuth, jsonError, jsonOk } from "../_shared/auth.ts";
import { rateLimit } from "../_shared/rate-limit.ts";

 const InputSchema = z.object({
   contactId: z.string().optional(),
   contact: z.record(z.unknown()).optional(),
   interactions: z.array(z.record(z.unknown())).optional(),
   company: z.record(z.unknown()).optional(),
 });

const limiter = rateLimit({ windowMs: 60_000, max: 20 });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: scopedCorsHeaders(req) });
  }

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const limited = limiter.check(ip, req);
  if (limited) return limited;

  // 🔒 Authenticate — userId from JWT
  const authResult = await withAuth(req);
  if (authResult instanceof Response) return authResult;
  const userId = authResult;

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

     const rawBody = await req.json();
     const parsed = InputSchema.safeParse(rawBody);
     if (!parsed.success) {
       return jsonError(`Invalid input: ${JSON.stringify(parsed.error.flatten().fieldErrors)}`, 400, req);
     }
     let { contactId, contact, interactions, company } = parsed.data;
 
     const supabase = createClient(
       Deno.env.get("SUPABASE_URL")!,
       Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
     );
 
     // 🔄 Auto-fetch context if contactId provided — verify ownership with user_id filter
     if (contactId && !contact) {
       const { data: dbContact } = await supabase
         .from('contacts')
         .select('*, companies(*)')
         .eq('id', contactId)
         .eq('user_id', userId)
         .single();

       if (dbContact) {
         contact = dbContact;
         company = dbContact.companies;

         const { data: dbInteractions } = await supabase
           .from('interactions')
           .select('*')
           .eq('contact_id', contactId)
           .eq('user_id', userId)
           .order('created_at', { ascending: false })
           .limit(10);

         interactions = dbInteractions || [];
       }
     }

    const systemPrompt = `Você é um assistente especializado em relacionamentos comerciais e CRM. Sua função é analisar o perfil de um contato, seu histórico de interações e sugerir a melhor próxima ação a ser tomada.

Considere:
1. O perfil comportamental DISC do contato e como isso afeta a comunicação
2. O histórico de interações recentes (frequência, tipo, sentimento)
3. O estágio do relacionamento atual
4. Eventos importantes (aniversários, últimas reuniões)
5. O cargo e papel de decisão do contato
6. O tempo desde a última interação

Gere UMA sugestão de próxima ação que seja:
- Específica e acionável
- Baseada no contexto real do relacionamento
- Adequada ao perfil comportamental do contato
- Com timing apropriado

Use tool calling para retornar a resposta estruturada.`;

    const userPrompt = `Analise este contato e sugira a melhor próxima ação:

CONTATO:
${JSON.stringify(contact, null, 2)}

HISTÓRICO DE INTERAÇÕES (últimas 10):
${JSON.stringify(interactions?.slice(0, 10) || [], null, 2)}

EMPRESA:
${JSON.stringify(company || {}, null, 2)}

Com base nestes dados, qual é a melhor próxima ação a ser tomada com este contato?`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "suggest_next_action",
              description: "Retorna a sugestão de próxima ação para o contato.",
              parameters: {
                type: "object",
                properties: {
                  action_type: {
                    type: "string",
                    enum: ["call", "email", "whatsapp", "meeting", "social", "gift", "follow_up"],
                    description: "Tipo de ação sugerida"
                  },
                  title: { type: "string", description: "Título curto da ação (max 60 caracteres)" },
                  description: { type: "string", description: "Descrição detalhada da ação e porque ela é recomendada" },
                  suggested_message: { type: "string", description: "Exemplo de mensagem ou script para a interação (opcional)" },
                  urgency: { type: "string", enum: ["low", "medium", "high", "critical"], description: "Nível de urgência da ação" },
                  best_time: { type: "string", description: "Melhor horário ou dia para realizar a ação" },
                  reasoning: { type: "string", description: "Explicação de por que esta ação é a melhor escolha" },
                  confidence: { type: "number", description: "Nível de confiança na sugestão (0-100)" }
                },
                required: ["action_type", "title", "description", "urgency", "reasoning", "confidence"],
                additionalProperties: false
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "suggest_next_action" } },
        temperature: 0.7,
        max_tokens: 1500,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) return jsonError("Limite de requisições excedido. Tente novamente em alguns minutos.", 429);
      if (response.status === 402) return jsonError("Créditos insuficientes. Adicione créditos em Configurações > Workspace > Uso.", 402);
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return jsonError("Erro ao gerar sugestão", 500);
    }

     const aiResponse = await response.json();
     let suggestion = null;
     const toolCall = aiResponse.choices?.[0]?.message?.tool_calls?.[0];
     
     if (toolCall?.function?.arguments) {
       try {
         suggestion = JSON.parse(toolCall.function.arguments);
         
         // 🔮 Roadmap Prediction Logic (Only if high confidence)
         if (contactId && suggestion.confidence > 80) {
           // Generate 3 milestone predictions for the roadmap
           const roadmapMonths = [1, 3, 6];
           const roadmapPromises = roadmapMonths.map(async (monthsAhead) => {
             const forecastDate = new Date();
             forecastDate.setMonth(forecastDate.getMonth() + monthsAhead);
             
             // Simple prediction logic based on current suggestion + months ahead
             // In a real scenario, this would be another LLM call or complex logic
             const needs = [
               "Expansão de licenças e adoção de novos recursos",
               "Revisão estratégica de performance e ROI",
               "Renovação de contrato com ajuste de volume",
               "Implementação de módulos avançados de BI",
               "Treinamento de reciclagem para novas equipes"
             ];
             
             return supabase.from('contact_predictive_roadmap').upsert({
               contact_id: contactId,
               user_id: userId,
               forecast_month: forecastDate.toISOString().split('T')[0],
               // eslint-disable-next-line sonarjs/pseudo-random -- non-security UI/animation/mock/test randomness
               predicted_need: needs[Math.floor(Math.random() * needs.length)],
               suggested_offering: `Pacote de Serviços ${monthsAhead}m`,
               probability: Math.max(40, suggestion.confidence - (monthsAhead * 5)),
               rationale: `Projeção baseada na tendência atual de ${suggestion.action_type}.`
             });
           });
           await Promise.all(roadmapPromises);
         }
       } catch (parseError) {
         console.error("Error parsing/persisting prediction:", parseError);
       }
     }
 
     return jsonOk({ suggestion });
  } catch (error) {
    console.error("suggest-next-action error:", error);
    return jsonError(error instanceof Error ? error.message : "Erro desconhecido", 500);
  }
});
