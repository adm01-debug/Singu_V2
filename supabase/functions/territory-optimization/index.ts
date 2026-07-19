import { createClient } from "npm:@supabase/supabase-js@2";
import {
  handleCorsAndMethod,
  withAuth,
  jsonError,
  jsonOk,
} from "../_shared/auth.ts";
import { rateLimit } from "../_shared/rate-limit.ts";

/* ─── Types ──────────────────────────────────────────────── */

interface TerritoryRow {
  id: string;
  name: string;
  state?: string | null;
  city?: string | null;
  region?: string | null;
  assigned_to?: string | null;
  assigned_to_name?: string | null;
  company_count?: number | null;
  contact_count?: number | null;
  deal_count?: number | null;
  total_revenue?: number | null;
}

interface TerritoryPerformanceRow {
  territory_id: string;
  territory_name: string;
  total_deals: number;
  won_deals: number;
  total_revenue: number;
  conversion_rate: number;
  avg_deal_size: number;
  active_companies: number;
}

interface Recommendation {
  type: "reassign" | "split" | "merge" | "hire" | "rebalance";
  territory_id: string | null;
  territory_name: string;
  action: string;
  impact: string;
  priority: "high" | "medium" | "low";
}

/* ─── Math helpers ───────────────────────────────────────── */

/** Gini coefficient — 0 = perfect equality, 1 = max inequality. */
function giniIndex(values: number[]): number {
  const arr = values.filter((v) => v >= 0).sort((a, b) => a - b);
  const n = arr.length;
  if (n === 0) return 0;
  const sum = arr.reduce((s, v) => s + v, 0);
  if (sum === 0) return 0;
  let cumulative = 0;
  for (let i = 0; i < n; i++) {
    cumulative += (2 * (i + 1) - n - 1) * arr[i];
  }
  return cumulative / (n * sum);
}

function mean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((s, v) => s + v, 0) / values.length;
}

/* ─── Rate limiter (5 req/min/user — análise pesada) ─── */
const limiter = rateLimit({
  windowMs: 60_000,
  max: 5,
  message: "Análise muito frequente. Aguarde antes de tentar novamente.",
});

/* ─── Lovable AI — recommendations via tool calling ─── */

async function generateAiRecommendations(payload: {
  territories: TerritoryRow[];
  performance: TerritoryPerformanceRow[];
  underserved: TerritoryRow[];
  overserved: TerritoryRow[];
  giniIndex: number;
  coverage: number;
}): Promise<Recommendation[]> {
  const apiKey = Deno.env.get("LOVABLE_API_KEY");
  if (!apiKey) {
    console.warn("[territory-optimization] LOVABLE_API_KEY missing — heuristic only");
    return [];
  }

  const summary = {
    total_territories: payload.territories.length,
    coverage_pct: Math.round(payload.coverage * 100),
    gini: Number(payload.giniIndex.toFixed(2)),
    territories: payload.territories.slice(0, 25).map((t) => ({
      id: t.id,
      name: t.name,
      state: t.state,
      assigned_to_name: t.assigned_to_name,
      companies: t.company_count ?? 0,
      contacts: t.contact_count ?? 0,
      deals: t.deal_count ?? 0,
    })),
    underserved_names: payload.underserved.map((t) => t.name),
    overserved_names: payload.overserved.map((t) => t.name),
  };

  try {
    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content:
              "Você é um especialista em gestão de territórios comerciais. Gere 3 a 5 recomendações concretas em PORTUGUÊS para otimizar a distribuição de territórios, baseando-se nos dados fornecidos. Priorize ações com maior impacto em receita e cobertura.",
          },
          {
            role: "user",
            content:
              "Analise estes dados e retorne recomendações:\n\n" +
              JSON.stringify(summary, null, 2),
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "emit_recommendations",
              description: "Retorna recomendações estruturadas",
              parameters: {
                type: "object",
                properties: {
                  recommendations: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        type: {
                          type: "string",
                          enum: ["reassign", "split", "merge", "hire", "rebalance"],
                        },
                        territory_id: { type: "string", nullable: true },
                        territory_name: { type: "string" },
                        action: { type: "string" },
                        impact: { type: "string" },
                        priority: {
                          type: "string",
                          enum: ["high", "medium", "low"],
                        },
                      },
                      required: ["type", "territory_name", "action", "impact", "priority"],
                      additionalProperties: false,
                    },
                  },
                },
                required: ["recommendations"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "emit_recommendations" } },
      }),
    });

    if (res.status === 429 || res.status === 402) {
      console.warn(`[territory-optimization] AI gateway ${res.status}`);
      return [];
    }
    if (!res.ok) {
      console.error("[territory-optimization] AI gateway error", res.status, await res.text());
      return [];
    }

    const data = await res.json();
    const toolCall = data?.choices?.[0]?.message?.tool_calls?.[0];
    const args = toolCall?.function?.arguments;
    if (!args) return [];
    const parsed = JSON.parse(args);
    const recs = Array.isArray(parsed?.recommendations) ? parsed.recommendations : [];
    return recs.map((r: Recommendation) => ({
      ...r,
      territory_id: r.territory_id ?? null,
    }));
  } catch (err) {
    console.error("[territory-optimization] AI call failed", err);
    return [];
  }
}

/* ─── Main handler ───────────────────────────────────────── */

Deno.serve(async (req) => {
  const corsResp = handleCorsAndMethod(req);
  if (corsResp) return corsResp;

  const authResult = await withAuth(req);
  if (typeof authResult !== "string") return authResult;
  const userId = authResult;

  const limited = limiter.check(userId, req);
  if (limited) return limited;

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const externalUrl = Deno.env.get("EXTERNAL_SUPABASE_URL");
    const externalKey = Deno.env.get("EXTERNAL_SUPABASE_SERVICE_ROLE_KEY");

    let territories: TerritoryRow[] = [];
    let performance: TerritoryPerformanceRow[] = [];

    if (externalUrl && externalKey) {
      const externalDb = createClient(externalUrl, externalKey);
      const [{ data: tData }, { data: pData }] = await Promise.all([
        externalDb.rpc("get_territories", {}),
        externalDb.rpc("get_territory_performance", {}),
      ]);
      territories = Array.isArray(tData) ? (tData as TerritoryRow[]) : [];
      performance = Array.isArray(pData) ? (pData as TerritoryPerformanceRow[]) : [];
    }

    const { data: teamMembers } = await supabase
      .from("sales_team_members")
      .select("user_id, territories, is_active, role")
      .eq("is_active", true);

    const assignedTerritoryIds = new Set<string>();
    (teamMembers ?? []).forEach((m) => {
      const ts = (m as { territories?: string[] }).territories;
      if (Array.isArray(ts)) ts.forEach((id) => assignedTerritoryIds.add(id));
    });

    /* ─── Computed metrics ─── */
    const totalTerritories = territories.length;
    const assignedCount = territories.filter(
      (t) => t.assigned_to || assignedTerritoryIds.has(t.id),
    ).length;
    const coverage = totalTerritories > 0 ? assignedCount / totalTerritories : 0;

    const companyCounts = territories.map((t) => t.company_count ?? 0);
    const gini = giniIndex(companyCounts);
    const avgCompanies = mean(companyCounts);

    const underserved = territories.filter((t) => {
      const c = t.company_count ?? 0;
      const isUnassigned = !t.assigned_to && !assignedTerritoryIds.has(t.id);
      return (isUnassigned && c >= 3) || (avgCompanies > 0 && c > avgCompanies * 1.5);
    });

    const overserved = territories.filter((t) => {
      const c = t.company_count ?? 0;
      return avgCompanies > 0 && c < avgCompanies * 0.5 && (t.assigned_to || assignedTerritoryIds.has(t.id));
    });

    const avgConversion = mean(performance.map((p) => p.conversion_rate ?? 0));

    // ─── Health score (0-100) ─── coverage 40% + balance (1-gini) 40% + conversion 20%
    const healthScore = Math.round(
      coverage * 40 + (1 - gini) * 40 + Math.min(1, avgConversion) * 20,
    );

    /* ─── AI Recommendations ─── */
    const recommendations = await generateAiRecommendations({
      territories,
      performance,
      underserved,
      overserved,
      giniIndex: gini,
      coverage,
    });

    /* ─── Chart data ─── */
    const chartData = territories
      .slice(0, 15)
      .map((t) => ({
        name: t.name,
        empresas: t.company_count ?? 0,
        contatos: t.contact_count ?? 0,
        deals: t.deal_count ?? 0,
      }))
      .sort((a, b) => b.empresas - a.empresas);

    const tableData = territories.map((t) => {
      const perf = performance.find((p) => p.territory_id === t.id);
      const isAssigned = !!t.assigned_to || assignedTerritoryIds.has(t.id);
      const companies = t.company_count ?? 0;
      let status: "healthy" | "underserved" | "overserved" | "unassigned" = "healthy";
      if (!isAssigned && companies > 0) status = "unassigned";
      else if (avgCompanies > 0 && companies > avgCompanies * 1.5) status = "underserved";
      else if (avgCompanies > 0 && companies < avgCompanies * 0.5 && isAssigned) status = "overserved";
      return {
        id: t.id,
        name: t.name,
        state: t.state,
        assigned_to_name: t.assigned_to_name,
        company_count: companies,
        deal_count: t.deal_count ?? 0,
        conversion_rate: perf?.conversion_rate ?? 0,
        status,
      };
    });

    return jsonOk(
      {
        healthScore,
        coverage,
        giniIndex: gini,
        avgConversion,
        totalTerritories,
        assignedCount,
        underservedCount: underserved.length,
        overservedCount: overserved.length,
        recommendations,
        chartData,
        tableData,
        analyzedAt: new Date().toISOString(),
      },
      req,
    );
  } catch (err) {
    console.error("[territory-optimization] error", err);
    return jsonError(err instanceof Error ? err.message : "Erro inesperado", 500, req);
  }
});
