import { z } from "npm:zod@3.23.8";
import { createClient } from "npm:@supabase/supabase-js@2";
import { withAuth, jsonError, jsonOk, scopedCorsHeaders, guardBody } from "../_shared/auth.ts";
import { rateLimit } from "../_shared/rate-limit.ts";
import { fetchAI } from "../_shared/fetch-utils.ts";

/**
 * objection-context-summary
 *
 * Recebe uma objeção e até N IDs de interações em que ela apareceu, busca o
 * conteúdo dessas interações no banco e usa Lovable AI para gerar um resumo
 * curto (1–2 frases) do contexto. O resumo serve como introdução rápida na
 * aba "Resumo" do card de objeção, antes da resposta sugerida.
 */

const limiter = rateLimit({
  windowMs: 60_000,
  max: 30,
  message: "Muitas requisições de resumo. Aguarde alguns segundos.",
});

const Input = z.object({
  objection: z.string().min(3).max(500),
  category: z.string().max(80).optional(),
  interactionIds: z.array(z.string().uuid()).min(1).max(8),
  /** IDs marcados como "Útil" pelo usuário; recebem prioridade no contexto. */
  usefulInteractionIds: z.array(z.string().uuid()).max(8).optional(),
});

const MAX_CONTENT_PER_INTERACTION = 1200;
const MAX_TOTAL_CONTEXT = 6000;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: scopedCorsHeaders(req) });
  }

  // Rate limit por IP
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const limited = limiter.check(ip, req);
  if (limited) return limited;

  // Auth
  const authResult = await withAuth(req);
  if (authResult instanceof Response) return authResult;

  const { body: rawBody, error: bodyError } = await guardBody(req, 256 * 1024);
  if (bodyError) return bodyError;

  try {
    const parsed = Input.safeParse(rawBody);
    if (!parsed.success) {
      return jsonError(
        `Input inválido: ${JSON.stringify(parsed.error.flatten().fieldErrors)}`,
        400,
      );
    }
    const { objection, category, interactionIds, usefulInteractionIds } = parsed.data;
    const usefulSet = new Set(usefulInteractionIds ?? []);

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return jsonError("LOVABLE_API_KEY não configurada", 500);
    }

    // Busca conteúdo das interações respeitando RLS (token do usuário).
    const authHeader = req.headers.get("Authorization") ?? "";
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );

    const { data: rows, error } = await supabase
      .from("interactions")
      .select("id, type, sentiment, created_at, content, title")
      .in("id", interactionIds)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("interactions fetch error:", error);
      return jsonError("Falha ao carregar conversas relacionadas", 500);
    }

    // Ordena: úteis primeiro (sinal explícito do vendedor), depois o restante.
    const orderedRows = [...(rows ?? [])].sort((a, b) => {
      const au = usefulSet.has(a.id) ? 1 : 0;
      const bu = usefulSet.has(b.id) ? 1 : 0;
      return bu - au;
    });

    const snippets: string[] = [];
    let total = 0;
    for (const r of orderedRows) {
      const content = (r.content ?? "").toString().trim();
      if (!content) continue;
      const truncated = content.slice(0, MAX_CONTENT_PER_INTERACTION);
      const useful = usefulSet.has(r.id);
      const flag = useful ? " · ÚTIL" : "";
      const block = `• [${r.type ?? "interação"} · ${r.sentiment ?? "neutro"}${flag}] ${truncated}`;
      if (total + block.length > MAX_TOTAL_CONTEXT) break;
      snippets.push(block);
      total += block.length;
    }

    if (snippets.length === 0) {
      return jsonOk({
        summary: "Não há conteúdo textual disponível nas conversas relacionadas.",
        empty: true,
      });
    }

    const systemPrompt = `Você é um analista de vendas que escreve resumos
ULTRA-curtos para vendedores ocupados. Sua função é resumir, em 1–2 frases
(máximo 280 caracteres no total), o contexto em que uma objeção específica
aparece nas conversas com clientes — quem levanta, quando aparece, qual a
preocupação real por trás, e padrões observáveis.

Regras absolutas:
- Português do Brasil, tom direto e neutro.
- Máximo 2 frases. Seja factual, evite jargão de IA.
- Não invente dados que não estão nos trechos.
- Não repita literalmente a objeção; agregue contexto novo.
- Não use markdown, listas, emojis ou aspas.`;

    const userPrompt = `Objeção: ${objection}
${category ? `Categoria: ${category}\n` : ""}
Trechos das conversas onde essa objeção apareceu:

${snippets.join("\n\n")}

Gere o resumo do contexto.`;

    const aiResponse = await fetchAI(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
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
                name: "emit_objection_summary",
                description:
                  "Devolve o resumo curto do contexto em que a objeção aparece.",
                parameters: {
                  type: "object",
                  properties: {
                    summary: {
                      type: "string",
                      description:
                        "1–2 frases (máximo 280 caracteres) em português do Brasil resumindo o contexto da objeção.",
                    },
                  },
                  required: ["summary"],
                  additionalProperties: false,
                },
              },
            },
          ],
          tool_choice: {
            type: "function",
            function: { name: "emit_objection_summary" },
          },
        }),
      },
    );

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return jsonError(
          "Limite de requisições da IA atingido. Tente novamente em instantes.",
          429,
        );
      }
      if (aiResponse.status === 402) {
        return jsonError(
          "Créditos da IA esgotados. Adicione créditos em Settings > Workspace > Usage.",
          402,
        );
      }
      const t = await aiResponse.text();
      console.error("AI gateway error:", aiResponse.status, t);
      return jsonError("Falha ao gerar resumo via IA", 502);
    }

    const data = await aiResponse.json();
    const toolCall = data?.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall?.function?.arguments) {
      return jsonError("Resposta da IA em formato inesperado", 502);
    }

    let parsedArgs: { summary?: string };
    try {
      parsedArgs = JSON.parse(toolCall.function.arguments);
    } catch {
      return jsonError("Não foi possível interpretar a resposta da IA", 502);
    }

    const summary = (parsedArgs.summary ?? "").trim();
    if (!summary) {
      return jsonError("IA não devolveu resumo", 502);
    }

    return jsonOk({
      summary: summary.slice(0, 320),
      basedOn: snippets.length,
    });
  } catch (err) {
    console.error("objection-context-summary error:", err);
    return jsonError("Internal server error", 500);
  }
});
