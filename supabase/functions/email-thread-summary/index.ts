import { createClient } from "npm:@supabase/supabase-js@2";
import { z } from "npm:zod@3.23.8";
import {
  handleCorsAndMethod,
  withAuth,
  jsonError,
  jsonOk,
} from "../_shared/auth.ts";
import { rateLimit } from "../_shared/rate-limit.ts";

const limiter = rateLimit({ windowMs: 60_000, max: 20 });

const InputSchema = z.union([
  z.object({ interaction_id: z.string().uuid() }),
  z.object({
    contact_id: z.string().uuid(),
    subject: z.string().min(1).max(500),
  }),
]);

interface InteractionRow {
  id: string;
  type: string;
  title: string | null;
  content: string | null;
  transcription: string | null;
  contact_id: string | null;
  created_at: string;
}

async function hashThreadKey(contactId: string, subject: string): Promise<string> {
  const norm = subject.toLowerCase().replace(/^(re:|fw:|fwd:)\s*/gi, "").trim();
  const data = new TextEncoder().encode(`${contactId}::${norm}`);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash))
    .slice(0, 16)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

Deno.serve(async (req) => {
  const corsResp = handleCorsAndMethod(req);
  if (corsResp) return corsResp;

  const auth = await withAuth(req);
  if (typeof auth !== "string") return auth;
  const userId = auth;

  const limited = limiter.check(userId);
  if (limited) return limited;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonError("JSON inválido", 400, req);
  }
  const parsed = InputSchema.safeParse(body);
  if (!parsed.success) return jsonError("Parâmetros inválidos", 400, req);

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: req.headers.get("Authorization")! } } },
  );

  let contactId: string | null = null;
  let subject = "";
  let interactions: InteractionRow[] = [];

  if ("interaction_id" in parsed.data) {
    const { data: anchor, error } = await supabase
      .from("interactions")
      .select("id,type,title,content,transcription,contact_id,created_at")
      .eq("id", parsed.data.interaction_id)
      .eq("user_id", userId)
      .maybeSingle();
    if (error || !anchor) return jsonError("Interação não encontrada", 404, req);
    contactId = anchor.contact_id;
    subject = anchor.title ?? "(sem assunto)";
    if (!contactId) {
      interactions = [anchor as InteractionRow];
    }
  } else {
    contactId = parsed.data.contact_id;
    subject = parsed.data.subject;
  }

  if (contactId) {
    const normSubject = subject.toLowerCase().replace(/^(re:|fw:|fwd:)\s*/gi, "").trim();
    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const { data: rows, error } = await supabase
      .from("interactions")
      .select("id,type,title,content,transcription,contact_id,created_at")
      .eq("user_id", userId)
      .eq("contact_id", contactId)
      .in("type", ["email", "email_received", "email_sent"])
      .gte("created_at", since)
      .order("created_at", { ascending: false })
      .limit(20);
    if (error) return jsonError("Erro ao buscar thread", 500, req);
    interactions = (rows ?? []).filter((r) => {
      const t = (r.title ?? "").toLowerCase().replace(/^(re:|fw:|fwd:)\s*/gi, "").trim();
      return t === normSubject;
    }) as InteractionRow[];
  }

  if (interactions.length === 0) {
    return jsonError("Nenhuma mensagem encontrada para resumir", 404, req);
  }

  const threadText = interactions
    .slice()
    .reverse()
    .map((i, idx) => {
      const txt = (i.transcription || i.content || "").substring(0, 4000);
      return `--- Mensagem ${idx + 1} (${i.created_at}) ---\nTítulo: ${i.title ?? ""}\n${txt}`;
    })
    .join("\n\n");

  if (threadText.replace(/\s+/g, "").length < 50) {
    return jsonError("Conteúdo insuficiente para resumir", 400, req);
  }

  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  if (!LOVABLE_API_KEY) return jsonError("API key não configurada", 500, req);

  const prompt = `Você é um assistente CRM. Analise esta thread de emails (${interactions.length} mensagens) e gere resumo estruturado em JSON.

Assunto: ${subject}

Thread:
"""
${threadText.substring(0, 12000)}
"""

Responda APENAS com JSON válido:
{
  "summary": "Resumo executivo em 2-3 frases",
  "key_points": ["ponto 1", "ponto 2", "ponto 3"],
  "action_items": [
    {"task": "tarefa", "responsible": "pessoa ou 'indefinido'", "deadline": "prazo ou null"}
  ],
  "sentiment": "positivo|neutro|negativo - breve justificativa",
  "next_steps": ["próximo passo 1", "próximo passo 2"]
}`;

  const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
      temperature: 0.3,
    }),
  });

  if (aiResp.status === 429) return jsonError("Limite de requisições IA atingido. Tente novamente em instantes.", 429, req);
  if (aiResp.status === 402) return jsonError("Créditos de IA esgotados. Adicione créditos no workspace.", 402, req);
  if (!aiResp.ok) {
    console.error("AI error", aiResp.status, await aiResp.text());
    return jsonError("Erro na IA", 502, req);
  }

  const aiData = await aiResp.json();
  const raw = aiData.choices?.[0]?.message?.content ?? "";
  let parsedAI: {
    summary?: string;
    key_points?: string[];
    action_items?: Array<{ task: string; responsible?: string; deadline?: string | null }>;
    sentiment?: string;
    next_steps?: string[];
  };
  try {
    const match = raw.match(/\{[\s\S]*\}/);
    parsedAI = JSON.parse(match ? match[0] : raw);
  } catch {
    console.error("Parse fail", raw);
    return jsonError("Falha ao interpretar resposta da IA", 502, req);
  }

  const threadKey = await hashThreadKey(contactId ?? interactions[0].id, subject);

  const { data: saved, error: saveErr } = await supabase
    .from("email_thread_summaries")
    .upsert(
      {
        user_id: userId,
        thread_key: threadKey,
        interaction_ids: interactions.map((i) => i.id),
        summary: parsedAI.summary ?? "",
        key_points: parsedAI.key_points ?? [],
        action_items: parsedAI.action_items ?? [],
        sentiment: parsedAI.sentiment ?? null,
        next_steps: parsedAI.next_steps ?? [],
        generated_by_model: "google/gemini-2.5-flash",
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,thread_key" },
    )
    .select()
    .single();

  if (saveErr) {
    console.error("Save error", saveErr);
    return jsonError("Erro ao salvar resumo", 500, req);
  }

  return jsonOk(saved, req);
});
