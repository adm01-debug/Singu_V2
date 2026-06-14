import { z } from "npm:zod@3.23.8";
import { scopedCorsHeaders, withAuth, jsonError, jsonOk } from "../_shared/auth.ts";
import { rateLimit } from "../_shared/rate-limit.ts";
import { extractTraceId, tracedLogger } from "../_shared/tracing.ts";

const limiter = rateLimit({ windowMs: 60_000, max: 15, message: "Rate limit exceeded for ai-suggest-mapping." });

const InputSchema = z.object({
  example_payload: z.record(z.unknown()),
  target_entity: z.enum(["contact", "company", "deal", "interaction", "note", "custom"]),
  source_hint: z.string().max(120).optional(),
});

const TARGET_FIELDS: Record<string, string[]> = {
  contact: ["first_name", "last_name", "email", "phone", "whatsapp", "role_title", "linkedin", "notes"],
  company: ["name", "cnpj", "email", "phone", "website", "industry", "city", "state", "razao_social"],
  deal: ["title", "value", "stage", "probability", "expected_close_date", "notes"],
  interaction: ["type", "subject", "notes", "duration_minutes", "sentiment"],
  note: ["title", "content", "tags"],
  custom: [],
};

const SYSTEM = `Você é um especialista em integração de dados. Receberá um payload JSON de exemplo (vindo de um sistema externo) e uma lista de campos de destino do CRM SINGU.

Sua tarefa: produzir um mapeamento JSON {campo_destino: caminho.dot.no.payload} sugerindo a melhor correspondência para cada campo de destino plausível.

Regras:
1. Use notação dot para campos aninhados (ex: "lead.contact.email").
2. Para arrays, use índice: "items.0.name".
3. Só inclua campos que tenham correspondência razoável no payload (não invente).
4. Atribua confiança 0.0-1.0 por campo (1.0 = nome idêntico, 0.7 = semântica clara, 0.4 = inferência).
5. Retorne APENAS JSON válido, sem markdown.

Formato de saída:
{
  "mapping": { "first_name": "user.name", "email": "user.email" },
  "confidence_per_field": { "first_name": 0.95, "email": 1.0 },
  "overall_confidence": 0.87,
  "notes": "Observações curtas (opcional)"
}`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: scopedCorsHeaders(req) });

  const traceId = extractTraceId(req);
  const log = tracedLogger(traceId, "ai-suggest-mapping");

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const limited = limiter.check(ip);
  if (limited) return limited;

  const auth = await withAuth(req);
  if (auth instanceof Response) return auth;

  log.info("request_received", { method: req.method });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const body = await req.json();
    const parsed = InputSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError(`Input inválido: ${JSON.stringify(parsed.error.flatten().fieldErrors)}`, 400, req);
    }

    const { example_payload, target_entity, source_hint } = parsed.data;
    const targetFields = TARGET_FIELDS[target_entity];

    const userPrompt = `Sistema de origem: ${source_hint ?? "desconhecido"}
Entidade de destino: ${target_entity}
Campos de destino disponíveis: ${JSON.stringify(targetFields)}

Payload de exemplo:
${JSON.stringify(example_payload, null, 2)}

Produza o mapeamento JSON conforme instruído.`;

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: SYSTEM },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.1,
        max_tokens: 800,
      }),
    });

    if (!aiRes.ok) {
      if (aiRes.status === 429) return jsonError("Rate limit IA. Tente em 1 minuto.", 429, req);
      if (aiRes.status === 402) return jsonError("Créditos IA esgotados.", 402, req);
      log.error("AI gateway error", { status: aiRes.status, body: await aiRes.text() });
      return jsonError("Erro no gateway IA", 500, req);
    }

    const aiData = await aiRes.json();
    const content = aiData.choices?.[0]?.message?.content ?? "";
    // eslint-disable-next-line sonarjs/slow-regex -- regex verified non-catastrophic (no nested ambiguous quantifiers / bounded)
    const jsonMatch = content.match(/\{[\s\S]*\}/);

    // Fallback determinístico: matching por nome quando IA falha
    if (!jsonMatch) {
      const fallback = deterministicMapping(example_payload, targetFields);
      return jsonOk({ ...fallback, fallback: true }, req);
    }

    try {
      const result = JSON.parse(jsonMatch[0]);
      return jsonOk({
        mapping: result.mapping ?? {},
        confidence_per_field: result.confidence_per_field ?? {},
        overall_confidence: typeof result.overall_confidence === "number" ? result.overall_confidence : 0.5,
        notes: result.notes ?? null,
        model: "google/gemini-2.5-flash",
        fallback: false,
      }, req);
    } catch {
      const fallback = deterministicMapping(example_payload, targetFields);
      return jsonOk({ ...fallback, fallback: true }, req);
    }
  } catch (e) {
    log.error("ai-suggest-mapping uncaught error", { error: e instanceof Error ? e.message : String(e) });
    return jsonError(e instanceof Error ? e.message : "Erro desconhecido", 500, req);
  }
});

function deterministicMapping(payload: Record<string, unknown>, targetFields: string[]) {
  const flat = flatten(payload);
  const mapping: Record<string, string> = {};
  const conf: Record<string, number> = {};
  for (const tf of targetFields) {
    const tfLower = tf.toLowerCase();
    const exact = Object.keys(flat).find(k => k.toLowerCase().endsWith(`.${tfLower}`) || k.toLowerCase() === tfLower);
    if (exact) {
      mapping[tf] = exact;
      conf[tf] = exact.toLowerCase() === tfLower ? 0.9 : 0.7;
    }
  }
  const overall = Object.values(conf).length
    ? Object.values(conf).reduce((a, b) => a + b, 0) / Object.values(conf).length
    : 0.3;
  return { mapping, confidence_per_field: conf, overall_confidence: overall, notes: "Fallback determinístico (IA indisponível)", model: "deterministic" };
}

function flatten(obj: unknown, prefix = ""): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  if (obj === null || typeof obj !== "object") {
    if (prefix) out[prefix] = obj;
    return out;
  }
  for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
    const path = prefix ? `${prefix}.${k}` : k;
    if (v !== null && typeof v === "object" && !Array.isArray(v)) Object.assign(out, flatten(v, path));
    else out[path] = v;
  }
  return out;
}
