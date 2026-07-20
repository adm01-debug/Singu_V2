import { createClient } from "npm:@supabase/supabase-js@2";
import { scopedCorsHeaders } from "../_shared/auth.ts";
import { rateLimit } from "../_shared/rate-limit.ts";

const limiter = rateLimit({ windowMs: 60_000, max: 5 });


interface ProductSearchResult {
  id: string;
  similarity: number;
  [key: string]: unknown;
}

async function analyzeImageWithAI(imageDataUrl: string): Promise<{
  description: string;
  keywords: string[];
  category: string | null;
  dominant_colors: string[];
}> {
  const apiKey = Deno.env.get("LOVABLE_API_KEY");
  if (!apiKey) throw new Error("LOVABLE_API_KEY not configured");

  const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [
        {
          role: "system",
          content:
            "Você analisa imagens de produtos e extrai metadados estruturados em português para busca por similaridade visual.",
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Analise esta imagem de produto e extraia: descrição curta, palavras-chave, categoria e cores dominantes.",
            },
            { type: "image_url", image_url: { url: imageDataUrl } },
          ],
        },
      ],
      tools: [
        {
          type: "function",
          function: {
            name: "extract_product_metadata",
            description: "Extrai metadados estruturados da imagem de produto",
            parameters: {
              type: "object",
              properties: {
                description: { type: "string", description: "Descrição curta em português" },
                keywords: {
                  type: "array",
                  items: { type: "string" },
                  description: "5-10 palavras-chave relevantes",
                },
                category: { type: "string", description: "Categoria geral do produto" },
                dominant_colors: {
                  type: "array",
                  items: { type: "string" },
                  description: "2-4 cores dominantes em português",
                },
              },
              required: ["description", "keywords", "category", "dominant_colors"],
              additionalProperties: false,
            },
          },
        },
      ],
      tool_choice: { type: "function", function: { name: "extract_product_metadata" } },
    }),
  });

  if (resp.status === 429) throw new Error("Rate limit exceeded. Tente novamente em instantes.");
  if (resp.status === 402) throw new Error("Créditos esgotados. Adicione créditos no workspace.");
  if (!resp.ok) {
    const t = await resp.text();
    throw new Error(`AI gateway error ${resp.status}: ${t}`);
  }

  const data = await resp.json();
  const args = data?.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
  if (!args) throw new Error("AI did not return structured output");
  return JSON.parse(args);
}

Deno.serve(async (req) => {
  const cors = scopedCorsHeaders(req);
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: cors });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing authorization" }), {
        status: 401,
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    const rl = limiter.check(user.id, req);
    if (rl) return rl;

    const body = await req.json().catch(() => ({}));
    const imageDataUrl = String(body?.image ?? "");
    const limit = Math.min(Math.max(Number(body?.limit ?? 12), 1), 30);

    if (!imageDataUrl.startsWith("data:image/")) {
      return new Response(JSON.stringify({ error: "Invalid image. Send a data URL (data:image/...;base64,...)" }), {
        status: 400,
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    // 1. Analyze image with AI
    const analysis = await analyzeImageWithAI(imageDataUrl);

    // 2. Build search query from extracted keywords
    const searchTerms = [analysis.category, ...analysis.keywords].filter(Boolean).join(" ");

    // 3. Search products using semantic RPC for each keyword
    const merged = new Map<string, ProductSearchResult>();
    const searches = [
      analysis.category,
      ...analysis.keywords.slice(0, 5),
    ].filter(Boolean) as string[];

    for (const term of searches) {
      const { data, error } = await supabase.rpc("search_products_semantic", {
        p_user_id: user.id,
        p_query: term,
        p_limit: limit,
        p_min_similarity: 0.1,
      });
      if (error) {
        console.error("RPC error for term", term, error);
        continue;
      }
      for (const row of data || []) {
        const existing = merged.get(row.id);
        if (!existing || row.similarity > existing.similarity) {
          merged.set(row.id, row);
        }
      }
    }

    const results = Array.from(merged.values())
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, limit);

    return new Response(
      JSON.stringify({ analysis, results, searchTerms }),
      { headers: { ...cors, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("visual-search error:", e);
    const msg = e instanceof Error ? e.message : "Unknown error";
    const status = msg.includes("Rate limit") ? 429 : msg.includes("Créditos") ? 402 : 500;
    return new Response(JSON.stringify({ error: msg }), {
      status,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }
});
