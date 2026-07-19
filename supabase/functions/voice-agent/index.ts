import { rateLimit } from "../_shared/rate-limit.ts";
import {
  handleCorsAndMethod,
  withAuth,
  jsonError,
  jsonOk,
} from "../_shared/auth.ts";

const SYSTEM_PROMPT = `Você é um assistente de voz inteligente para um CRM de relacionamentos (SINGU).
Sua função é interpretar comandos de voz do usuário e retornar uma ação estruturada.

CONTEXTO: O usuário gerencia contatos, empresas, interações e relacionamentos comerciais.

PÁGINAS DO SISTEMA:
- /dashboard (painel principal)
- /contatos (lista de contatos)
- /empresas (lista de empresas)
- /interacoes (interações)
- /pipeline (pipeline de vendas)
- /automacao (automações)
- /relatorios (relatórios)
- /configuracoes (configurações)

AÇÕES DISPONÍVEIS:
- search: Buscar contatos ou empresas
- navigate: Navegar para uma página
- answer: Responder uma pergunta geral
- create_interaction: Sugerir criar uma interação
 - create_reminder: Sugerir criar um lembrete
 - create_relative: Sugerir adicionar um familiar/relacionado
 - update_preferences: Sugerir atualizar preferências de contato (canal, dias, horários)

Responda SEMPRE em JSON com esta estrutura:
{
   "action": "search" | "navigate" | "answer" | "create_interaction" | "create_reminder" | "create_relative" | "update_preferences",
  "response": "texto curto e amigável para falar de volta ao usuário (max 2 frases)",
  "data": {
    "query": "termo de busca (se action=search)",
    "route": "rota para navegar (se action=navigate)",
    "contactName": "nome do contato mencionado (se aplicável)",
    "filters": {
      "tag": "tag mencionada",
      "company": "empresa mencionada",
      "sentiment": "sentimento mencionado"
    }
  }
}

Se o usuário fizer uma pergunta geral, use action="answer" e responda de forma útil.
Se o comando não fizer sentido, responda com action="answer" e peça esclarecimento.
Seja conciso e amigável. Use linguagem informal brasileira.`;

const TOOL_SCHEMA = {
  type: "function" as const,
  function: {
    name: "execute_voice_command",
    description: "Execute a voice command from the user",
    parameters: {
      type: "object",
      properties: {
         action: {
           type: "string",
           enum: ["search", "navigate", "answer", "create_interaction", "create_reminder", "create_relative", "update_preferences"],
             preferences: {
               type: "object",
               properties: {
                 channel: { type: "string" },
                 preferredDays: { type: "array", items: { type: "string" } },
                 preferredTimes: { type: "array", items: { type: "string" } }
               }
             },
         },
             relative: {
               type: "object",
               properties: {
                 name: { type: "string" },
                 relationship: { type: "string", enum: ["conjuge", "filho", "filha", "pai", "mae", "irmao", "irma", "socio", "assistente", "outro"] },
                 occupation: { type: "string" }
               }
             },
        response: { type: "string", description: "Friendly response to speak back (max 2 sentences)" },
        data: {
          type: "object",
          properties: {
            query: { type: "string" },
            route: { type: "string" },
            contactName: { type: "string" },
            filters: {
              type: "object",
              properties: {
                tag: { type: "string" },
                company: { type: "string" },
                sentiment: { type: "string" },
              },
            },
          },
        },
      },
      required: ["action", "response"],
      additionalProperties: false,
    },
  },
};

const limiter = rateLimit({ windowMs: 60_000, max: 10 });

Deno.serve(async (req) => {
  const guard = handleCorsAndMethod(req);
  if (guard) return guard;
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const limited = limiter.check(ip);
  if (limited) return limited;


  const authResult = await withAuth(req);
  if (authResult instanceof Response) return authResult;

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    let body: Record<string, unknown>;
    try {
      body = await req.json();
    } catch {
      return jsonError("Invalid JSON body", 400);
    }

    const transcript = body?.transcript;
    if (!transcript || typeof transcript !== "string" || transcript.trim().length === 0 || transcript.length > 1000) {
      return jsonError("Invalid transcript (required, max 1000 chars)", 400);
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: transcript.trim() },
        ],
        tools: [TOOL_SCHEMA],
        tool_choice: { type: "function", function: { name: "execute_voice_command" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) return jsonError("Rate limit exceeded. Please try again later.", 429);
      if (response.status === 402) return jsonError("AI credits exhausted. Please add funds.", 402);
      const errText = await response.text();
      console.error("AI gateway error:", response.status, errText);
      return jsonError("AI processing failed", 500);
    }

    const aiData = await response.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];

    let result;
    if (toolCall?.function?.arguments) {
      try {
        result = JSON.parse(toolCall.function.arguments);
      } catch {
        result = { action: "answer", response: "Desculpe, não entendi. Pode repetir?", data: {} };
      }
    } else {
      const content = aiData.choices?.[0]?.message?.content || "";
      try {
        result = JSON.parse(content);
      } catch {
        result = { action: "answer", response: content || "Desculpe, não entendi.", data: {} };
      }
    }

    if (!result.action || !result.response) {
      result = { action: "answer", response: result.response || "Desculpe, ocorreu um erro.", data: {} };
    }

    return jsonOk(result);
  } catch (error: unknown) {
    console.error("Voice agent error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return jsonError(message, 500);
  }
});
