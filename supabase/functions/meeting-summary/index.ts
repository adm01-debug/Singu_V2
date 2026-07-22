import { createClient } from "npm:@supabase/supabase-js@2";
import { rateLimit } from "../_shared/rate-limit.ts";
import { guardBody, scopedCorsHeaders } from "../_shared/auth.ts";
import { fetchAI } from "../_shared/fetch-utils.ts";
import { validate } from "../_shared/validate.ts";


const limiter = rateLimit({ windowMs: 60_000, max: 10, message: "Rate limit excedido para meeting-summary." });

Deno.serve(async (req) => {
  const cors = scopedCorsHeaders(req);
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: cors });
  }

  const requestId = crypto.randomUUID();
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const limited = limiter.check(ip, req);
  if (limited) return limited;

  const { body: rawBody, error: bodyError } = await guardBody(req, 256 * 1024);
  if (bodyError) return bodyError;

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), {
        status: 401,
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: "Não autenticado" }), {
        status: 401,
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    const vms = validate(rawBody, {
      interaction_id: { type: 'string', required: true, maxLength: 36 },
    });
    if (!vms.ok) {
      return new Response(JSON.stringify({ error: vms.error }), { status: 400, headers: { ...cors, "Content-Type": "application/json" } });
    }
    const { interaction_id } = vms.data as { interaction_id: string };

    // Fetch interaction
    const { data: interaction, error: intError } = await supabase
      .from("interactions")
      .select("*")
      .eq("id", interaction_id)
      .eq("user_id", user.id)
      .single();

    if (intError || !interaction) {
      return new Response(
        JSON.stringify({ error: "Interação não encontrada" }),
        {
          status: 404,
          headers: { ...cors, "Content-Type": "application/json" },
        }
      );
    }

    const textToSummarize =
      interaction.transcription || interaction.content || "";

    if (textToSummarize.length < 30) {
      return new Response(
        JSON.stringify({
          error:
            "Conteúdo insuficiente para gerar resumo. Adicione uma transcrição ou conteúdo mais detalhado.",
        }),
        {
          status: 400,
          headers: { ...cors, "Content-Type": "application/json" },
        }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(
        JSON.stringify({ error: "API key não configurada" }),
        {
          status: 500,
          headers: { ...cors, "Content-Type": "application/json" },
        }
      );
    }

    const prompt = `Você é um assistente de CRM especializado em reuniões de vendas B2B. Analise o seguinte texto de uma interação e gere um resumo estruturado em JSON.

Tipo da interação: ${interaction.type}
Título: ${interaction.title}
Data: ${interaction.created_at}
${interaction.duration ? `Duração: ${Math.floor(interaction.duration / 60)} minutos` : ""}

Texto:
"""
${textToSummarize.substring(0, 8000)}
"""

Responda APENAS com JSON válido no formato:
{
  "summary": "Resumo executivo em 2-4 parágrafos",
  "key_decisions": ["decisão 1", "decisão 2"],
  "action_items": [
    {"task": "descrição da tarefa", "responsible": "pessoa responsável ou 'indefinido'", "deadline": "prazo se mencionado ou null", "status": "pending"}
  ],
  "participants": ["nome dos participantes mencionados"],
  "sentiment_overview": "positivo|neutro|negativo - breve justificativa",
  "topics": ["tópico 1", "tópico 2"],
  "next_steps": ["próximo passo 1", "próximo passo 2"]
}`;

    const aiResponse = await fetchAI(
      "https://api.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [{ role: "user", content: prompt }],
          temperature: 0.3,
        }),
      }
    );

    if (aiResponse.status === 429) {
      return new Response(JSON.stringify({ error: "Limite de uso da IA atingido. Aguarde antes de tentar novamente." }), {
        status: 429, headers: { ...cors, "Content-Type": "application/json" },
      });
    }
    if (aiResponse.status === 402) {
      return new Response(JSON.stringify({ error: "Créditos da IA esgotados. Adicione créditos para continuar." }), {
        status: 402, headers: { ...cors, "Content-Type": "application/json" },
      });
    }
    if (!aiResponse.ok) {
      const errText = await aiResponse.text().catch(() => "");
      console.error("AI API error:", aiResponse.status, errText);
      return new Response(
        JSON.stringify({ error: "Erro ao processar com IA" }),
        {
          status: 502,
          headers: { ...cors, "Content-Type": "application/json" },
        }
      );
    }

    const aiData = await aiResponse.json();
    const rawContent =
      aiData.choices?.[0]?.message?.content || "";

    // Extract JSON from response
    let parsed;
    try {
      // eslint-disable-next-line sonarjs/super-linear-regex -- regex verified non-catastrophic (no nested ambiguous quantifiers / bounded)
      const jsonMatch = rawContent.match(/\{[\s\S]*\}/);
      parsed = JSON.parse(jsonMatch ? jsonMatch[0] : rawContent);
    } catch {
      console.error("Failed to parse AI response:", rawContent);
      return new Response(
        JSON.stringify({ error: "Erro ao interpretar resposta da IA" }),
        {
          status: 502,
          headers: { ...cors, "Content-Type": "application/json" },
        }
      );
    }

    // Upsert meeting summary
    const { data: summary, error: saveError } = await supabase
      .from("meeting_summaries")
      .upsert(
        {
          interaction_id,
          user_id: user.id,
          summary: parsed.summary || "",
          key_decisions: parsed.key_decisions || [],
          action_items: parsed.action_items || [],
          participants: parsed.participants || [],
          sentiment_overview: parsed.sentiment_overview || null,
          topics: parsed.topics || [],
          next_steps: parsed.next_steps || [],
          duration_minutes: interaction.duration
            ? Math.floor(interaction.duration / 60)
            : null,
          generated_by_model: "gemini-2.5-flash",
        },
        { onConflict: "interaction_id" }
      )
      .select()
      .single();

    if (saveError) {
      console.error("Save error:", saveError);
      return new Response(
        JSON.stringify({ error: "Erro ao salvar resumo" }),
        {
          status: 500,
          headers: { ...cors, "Content-Type": "application/json" },
        }
      );
    }

    return new Response(JSON.stringify(summary), {
      headers: { ...cors, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error(JSON.stringify({ requestId, level: "error", fn: "meeting-summary", err: String(err) }));
    return new Response(
      JSON.stringify({ error: "Erro interno", requestId }),
      {
        status: 500,
        headers: { ...cors, "Content-Type": "application/json" },
      }
    );
  }
});
