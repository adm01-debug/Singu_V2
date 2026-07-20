import { createClient } from "npm:@supabase/supabase-js@2";
import { z } from "npm:zod@3.23.8";
import { scopedCorsHeaders } from "../_shared/auth.ts";
import { fetchAI } from "../_shared/fetch-utils.ts";
import { rateLimit } from "../_shared/rate-limit.ts";

const limiter = rateLimit({ windowMs: 60_000, max: 5 });


const BodySchema = z.object({
  scenario: z.enum(["discovery", "demo", "negotiation", "objection", "closing", "winback", "onboarding", "custom"]),
  industry: z.string().max(120).optional(),
  persona: z.string().max(120).optional(),
  product_context: z.string().max(2000).optional(),
  prompt: z.string().min(5).max(2000),
  save: z.boolean().default(true),
});

const tools = [{
  type: "function",
  function: {
    name: "create_playbook",
    description: "Gera um playbook de vendas estruturado com seções práticas (talktrack, perguntas, objeções, próximos passos).",
    parameters: {
      type: "object",
      properties: {
        name: { type: "string", description: "Nome curto e direto do playbook" },
        description: { type: "string", description: "Descrição em 1-2 frases" },
        tags: { type: "array", items: { type: "string" }, description: "3-6 tags relevantes em pt-BR" },
        sections: {
          type: "array",
          minItems: 4,
          maxItems: 8,
          items: {
            type: "object",
            properties: {
              title: { type: "string" },
              type: { type: "string", enum: ["talktrack", "questions", "objections", "next_steps", "resources"] },
              body: { type: "string", description: "Texto introdutório/explicativo da seção" },
              items: { type: "array", items: { type: "string" }, description: "Bullets acionáveis (perguntas, objeções, passos)" },
            },
            required: ["title", "type", "body", "items"],
            additionalProperties: false,
          },
        },
      },
      required: ["name", "description", "tags", "sections"],
      additionalProperties: false,
    },
  },
}];

Deno.serve(async (req) => {
  const cors = scopedCorsHeaders(req);
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });

  try {
    const auth = req.headers.get("Authorization");
    if (!auth) return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401, headers: { ...cors, "Content-Type": "application/json" } });

    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: auth } },
    });
    const { data: userData } = await supabase.auth.getUser();
    const user = userData?.user;
    if (!user) return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401, headers: { ...cors, "Content-Type": "application/json" } });

    const rl = limiter.check(user.id, req);
    if (rl) return rl;

    const parsed = BodySchema.safeParse(await req.json());
    if (!parsed.success) {
      return new Response(JSON.stringify({ error: parsed.error.flatten().fieldErrors }), { status: 400, headers: { ...cors, "Content-Type": "application/json" } });
    }
    const { scenario, industry, persona, product_context, prompt, save } = parsed.data;

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY missing");

    const systemPrompt = `Você é um especialista em metodologias de vendas B2B (SPIN, MEDDIC, Challenger, Sandler). Gere playbooks práticos, acionáveis e em português brasileiro. Evite jargão genérico — use exemplos concretos. Estruture o playbook com 4-7 seções claras.`;

    const userPrompt = `Cenário: ${scenario}
${industry ? `Indústria: ${industry}` : ""}
${persona ? `Persona alvo: ${persona}` : ""}
${product_context ? `Contexto do produto/serviço: ${product_context}` : ""}

Requisição: ${prompt}

Gere o playbook chamando a function create_playbook.`;

    const aiResp = await fetchAI("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        tools,
        tool_choice: { type: "function", function: { name: "create_playbook" } },
      }),
    });

    if (!aiResp.ok) {
      const txt = await aiResp.text();
      console.error("AI gateway error", aiResp.status, txt);
      if (aiResp.status === 429) return new Response(JSON.stringify({ error: "Rate limit excedido. Tente em alguns segundos." }), { status: 429, headers: { ...cors, "Content-Type": "application/json" } });
      if (aiResp.status === 402) return new Response(JSON.stringify({ error: "Créditos de IA esgotados. Adicione em Settings > Workspace > Usage." }), { status: 402, headers: { ...cors, "Content-Type": "application/json" } });
      throw new Error("Falha na geração via IA");
    }

    const aiData = await aiResp.json();
    const toolCall = aiData?.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) throw new Error("AI não retornou estrutura esperada");

    const args = JSON.parse(toolCall.function.arguments);
    const playbook = {
      user_id: user.id,
      name: args.name,
      description: args.description,
      scenario,
      industry_target: industry || null,
      persona_target: persona || null,
      tags: args.tags || [],
      content: { sections: args.sections },
      active: true,
    };

    if (save) {
      const { data: saved, error: saveErr } = await supabase
        .from("sales_playbooks")
        .insert(playbook)
        .select()
        .single();
      if (saveErr) throw saveErr;
      return new Response(JSON.stringify({ playbook: saved, generated: args }), { headers: { ...cors, "Content-Type": "application/json" } });
    }

    return new Response(JSON.stringify({ generated: args, playbook_draft: playbook }), { headers: { ...cors, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("playbook-generator error", e);
    return new Response(JSON.stringify({ error: "Internal server error" }), { status: 500, headers: { ...cors, "Content-Type": "application/json" } });
  }
});
