import { createClient } from "npm:@supabase/supabase-js@2";
import { scopedCorsHeaders } from "../_shared/auth.ts";
import { rateLimit } from "../_shared/rate-limit.ts";


const CACHE_TTL_MINUTES = 10;

type EntityKey = "products" | "contacts" | "companies" | "interactions";

const ALL_ENTITIES: EntityKey[] = ["products", "contacts", "companies", "interactions"];

interface ResultRow {
  id: string;
  similarity: number;
  [key: string]: unknown;
}

async function hashQuery(text: string): Promise<string> {
  const data = new TextEncoder().encode(text.trim().toLowerCase());
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function expandQueryWithAI(query: string): Promise<string[]> {
  const apiKey = Deno.env.get("LOVABLE_API_KEY");
  if (!apiKey) return [query];

  try {
    const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-lite",
        messages: [
          {
            role: "system",
            content:
              "Você expande consultas de busca em CRM (contatos, empresas, interações, produtos) em sinônimos e termos relacionados em português. Retorne APENAS um array JSON com 3-5 variações curtas, sem explicações.",
          },
          { role: "user", content: query },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "expand_query",
              description: "Retorna variações da consulta",
              parameters: {
                type: "object",
                properties: {
                  variations: {
                    type: "array",
                    items: { type: "string" },
                  },
                },
                required: ["variations"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "expand_query" } },
      }),
    });

    if (!resp.ok) return [query];
    const data = await resp.json();
    const args = data?.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
    if (!args) return [query];
    const parsed = JSON.parse(args);
    return Array.from(new Set([query, ...(parsed.variations || [])]));
  } catch (e) {
    console.error("AI expansion failed:", e);
    return [query];
  }
}

const RPC_BY_ENTITY: Record<EntityKey, string> = {
  products: "search_products_semantic",
  contacts: "search_contacts_semantic",
  companies: "search_companies_semantic",
  interactions: "search_interactions_semantic",
};

const limiter = rateLimit({ windowMs: 60_000, max: 30 });

Deno.serve(async (req) => {
  const cors = scopedCorsHeaders(req);
  if (req.method === "OPTIONS") {

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const limited = limiter.check(ip);
  if (limited) return limited;
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
      { global: { headers: { Authorization: authHeader } } },
    );

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    const body = await req.json().catch(() => ({}));
    const query = String(body?.query ?? "").trim();
    const limit = Math.min(Math.max(Number(body?.limit ?? 10), 1), 50);
    const useAI = body?.useAI !== false;
    const requested: EntityKey[] = Array.isArray(body?.entities) && body.entities.length > 0
      ? body.entities.filter((e: string): e is EntityKey =>
        ALL_ENTITIES.includes(e as EntityKey)
      )
      : ALL_ENTITIES;

    if (!query || query.length < 2) {
      return new Response(JSON.stringify({ error: "Query must be at least 2 characters" }), {
        status: 400,
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    const queryHash = await hashQuery(`${query}:${limit}:${useAI}:${requested.sort().join(",")}`);

    // Cache check
    const { data: cached } = await supabase
      .from("semantic_search_cache")
      .select("results, expires_at")
      .eq("user_id", user.id)
      .eq("query_hash", queryHash)
      .gt("expires_at", new Date().toISOString())
      .maybeSingle();

    if (cached) {
      return new Response(
        JSON.stringify({ results: cached.results, cached: true, query }),
        { headers: { ...cors, "Content-Type": "application/json" } },
      );
    }

    const variations = useAI ? await expandQueryWithAI(query) : [query];

    // Federar: para cada entidade, rodar todas as variações em paralelo, mesclar pelo melhor score
    const results: Record<EntityKey, ResultRow[]> = {
      products: [],
      contacts: [],
      companies: [],
      interactions: [],
    };

    await Promise.all(
      requested.map(async (entity) => {
        const merged = new Map<string, ResultRow>();
        const rpc = RPC_BY_ENTITY[entity];
        await Promise.all(
          variations.map(async (v) => {
            const { data, error } = await supabase.rpc(rpc, {
              p_user_id: user.id,
              p_query: v,
              p_limit: limit,
              p_min_similarity: 0.1,
            });
            if (error) {
              console.error(`RPC ${rpc} error:`, error.message);
              return;
            }
            for (const row of (data ?? []) as ResultRow[]) {
              const existing = merged.get(row.id);
              if (!existing || row.similarity > existing.similarity) {
                merged.set(row.id, row);
              }
            }
          }),
        );
        results[entity] = Array.from(merged.values())
          .sort((a, b) => b.similarity - a.similarity)
          .slice(0, limit);
      }),
    );

    // Cache (best-effort)
    const expiresAt = new Date(Date.now() + CACHE_TTL_MINUTES * 60 * 1000).toISOString();
    await supabase
      .from("semantic_search_cache")
      .upsert(
        {
          user_id: user.id,
          query_hash: queryHash,
          query_text: query,
          results,
          expires_at: expiresAt,
        },
        { onConflict: "user_id,query_hash" },
      );

    return new Response(
      JSON.stringify({ results, cached: false, query, variations, entities: requested }),
      { headers: { ...cors, "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error("semantic-search error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...cors, "Content-Type": "application/json" } },
    );
  }
});
