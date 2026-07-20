import { createClient } from "npm:@supabase/supabase-js@2";
import { scopedCorsHeaders, guardBody } from "../_shared/auth.ts";
import { fetchAI } from "../_shared/fetch-utils.ts";
import { rateLimit } from "../_shared/rate-limit.ts";
import { z } from "npm:zod@3.23.8";

const bodySchema = z.object({
  query:    z.string().min(2).max(500),
  limit:    z.number().int().min(1).max(50).optional(),
  useAI:    z.boolean().optional(),
  entities: z.array(z.enum(["products","contacts","companies","interactions"])).optional(),
});


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
    const resp = await fetchAI("https://ai.gateway.lovable.dev/v1/chat/completions", {
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
    return new Response(null, { headers: cors });
  }

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const limited = limiter.check(ip, req);
  if (limited) return limited;

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

    const { body: rawBody, error: bodyError } = await guardBody(req);
    if (bodyError) return bodyError;

    const parsedBody = bodySchema.safeParse(rawBody);
    if (!parsedBody.success) {
      return new Response(
        JSON.stringify({ error: parsedBody.error.issues[0]?.message ?? "Invalid request body" }),
        { status: 400, headers: { ...cors, "Content-Type": "application/json" } },
      );
    }

    const query = parsedBody.data.query.trim();
    const limit = parsedBody.data.limit ?? 10;
    const useAI = parsedBody.data.useAI !== false;
    const requested: EntityKey[] = parsedBody.data.entities && parsedBody.data.entities.length > 0
      ? parsedBody.data.entities
      : ALL_ENTITIES;

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
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...cors, "Content-Type": "application/json" } },
    );
  }
});
