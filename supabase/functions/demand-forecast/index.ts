import { createClient } from "npm:@supabase/supabase-js@2";
import { withAuth, jsonError, jsonOk, scopedCorsHeaders } from "../_shared/auth.ts";
import { fetchAI } from "../_shared/fetch-utils.ts";
import { rateLimit } from "../_shared/rate-limit.ts";

const limiter = rateLimit({ windowMs: 60_000, max: 10 });

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: scopedCorsHeaders(req) });
  }

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const limited = limiter.check(ip, req);
  if (limited) return limited;

  const authResult = await withAuth(req);
  if (authResult instanceof Response) return authResult;
  const userId = authResult; // withAuth returns the user ID string

  const authHeader = req.headers.get("Authorization")!;
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } } },
  );

  try {
    // Fetch recent deals for forecast context
    const { data: deals, error: dealsErr } = await supabase
      .from('interactions')
      .select('type, created_at, sentiment')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(500);

    if (dealsErr) throw dealsErr;

    // Build monthly summary
    const monthlyCounts: Record<string, { interactions: number; positive: number; negative: number }> = {};
    for (const d of deals || []) {
      const month = d.created_at.slice(0, 7);
      if (!monthlyCounts[month]) monthlyCounts[month] = { interactions: 0, positive: 0, negative: 0 };
      monthlyCounts[month].interactions++;
      if (d.sentiment === 'positive' || d.sentiment === 'very_positive') monthlyCounts[month].positive++;
      if (d.sentiment === 'negative' || d.sentiment === 'very_negative') monthlyCounts[month].negative++;
    }

    const monthlyData = Object.entries(monthlyCounts)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, data]) => ({ month, ...data }));

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) throw new Error('LOVABLE_API_KEY is not configured');

    const prompt = `Analise os dados mensais de interações comerciais abaixo e gere uma previsão de demanda para os próximos 3 meses.

Dados históricos (JSON):
${JSON.stringify(monthlyData)}

Retorne EXATAMENTE um JSON com a estrutura usando a tool fornecida.`;

    const response = await fetchAI('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
        messages: [
          { role: 'system', content: 'Você é um analista de demand forecasting. Responda sempre em português.' },
          { role: 'user', content: prompt },
        ],
        tools: [{
          type: 'function',
          function: {
            name: 'demand_forecast',
            description: 'Return demand forecast data',
            parameters: {
              type: 'object',
              properties: {
                forecast: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      month: { type: 'string' },
                      predicted_interactions: { type: 'number' },
                      confidence: { type: 'number' },
                      trend: { type: 'string', enum: ['up', 'down', 'stable'] },
                    },
                    required: ['month', 'predicted_interactions', 'confidence', 'trend'],
                  },
                },
                insights: {
                  type: 'array',
                  items: { type: 'string' },
                },
                seasonality_detected: { type: 'boolean' },
                growth_rate_percent: { type: 'number' },
              },
              required: ['forecast', 'insights', 'seasonality_detected', 'growth_rate_percent'],
            },
          },
        }],
        tool_choice: { type: 'function', function: { name: 'demand_forecast' } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) return jsonError('Rate limit exceeded', 429, req);
      if (response.status === 402) return jsonError('Payment required', 402, req);
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const result = await response.json();
    const toolCall = result.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) throw new Error('No tool call in response');

    const forecastData = JSON.parse(toolCall.function.arguments);

    return jsonOk({
      historical: monthlyData,
      ...forecastData,
    }, req);
  } catch (error: unknown) {
    console.error("demand-forecast error:", error);
    return jsonError("Internal server error", 500, req);
  }
});
