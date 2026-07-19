import { z } from "npm:zod@3.23.8";
import { handleCorsAndMethod, withAuth, jsonError, jsonOk } from "../_shared/auth.ts";
import { rateLimit } from "../_shared/rate-limit.ts";

const limiter = rateLimit({ windowMs: 60_000, max: 30, message: "Limite de refinamentos atingido. Aguarde um momento." });

const RefineInput = z.object({
  original: z.string().min(1).max(8000),
  subject: z.string().max(300).optional(),
  instruction: z.string().min(1).max(500),
  tone: z.enum(['formal', 'casual', 'friendly']).optional(),
});

const INSTRUCTION_HINTS: Record<string, string> = {
  'mais curto': 'Reduza o tamanho mantendo a essência. Seja conciso e direto.',
  'mais formal': 'Aumente o nível de formalidade, use tratamento adequado e linguagem corporativa.',
  'mais persuasivo': 'Aumente o poder de convencimento com gatilhos de valor, prova social ou urgência sutil.',
  'adicionar urgência': 'Inclua um senso de urgência claro e ético, com prazo ou motivo específico.',
  'mais amigável': 'Torne o tom mais caloroso, próximo e humano.',
  'traduzir para inglês': 'Traduza todo o conteúdo para inglês mantendo o tom.',
  'corrigir gramática': 'Corrija qualquer erro gramatical ou ortográfico mantendo o conteúdo idêntico.',
};

function buildPrompt(original: string, subject: string | undefined, instruction: string, tone?: string) {
  const lowered = instruction.toLowerCase().trim();
  const hint = INSTRUCTION_HINTS[lowered] ?? `Aplique a seguinte instrução: "${instruction}".`;
  const toneText = tone ? `Mantenha o tom geral ${tone}.` : '';
  return `Você é um editor especialista em emails comerciais em PT-BR. ${hint} ${toneText}

Email original${subject ? ` (assunto: "${subject}")` : ''}:
"""
${original}
"""

Retorne APENAS um JSON válido no formato exato:
{"subject": "novo assunto se mudou ou o original", "message": "novo corpo do email"}

Sem comentários, sem markdown, apenas o JSON.`;
}

Deno.serve(async (req) => {
  const cors = handleCorsAndMethod(req);
  if (cors) return cors;

  const userId = await withAuth(req);
  if (typeof userId !== 'string') return userId;

  const limited = limiter.check(userId, req);
  if (limited) return limited;

  let payload: unknown;
  try {
    payload = await req.json();
  } catch {
    return jsonError('JSON inválido', 400, req);
  }

  const parsed = RefineInput.safeParse(payload);
  if (!parsed.success) {
    return jsonError(`Entrada inválida: ${JSON.stringify(parsed.error.flatten().fieldErrors)}`, 400, req);
  }

  const { original, subject, instruction, tone } = parsed.data;
  const apiKey = Deno.env.get('LOVABLE_API_KEY');
  if (!apiKey) return jsonError('LOVABLE_API_KEY não configurada', 500, req);

  try {
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
        messages: [
          { role: 'system', content: 'Você é um editor preciso de emails comerciais em PT-BR. Sempre responde apenas JSON válido.' },
          { role: 'user', content: buildPrompt(original, subject, instruction, tone) },
        ],
        response_format: { type: 'json_object' },
      }),
    });

    if (response.status === 429) return jsonError('Limite de requisições da IA atingido. Tente novamente em instantes.', 429, req);
    if (response.status === 402) return jsonError('Créditos da IA esgotados. Adicione créditos no workspace.', 402, req);
    if (!response.ok) {
      const text = await response.text();
      console.error('AI gateway error:', response.status, text);
      return jsonError('Falha ao refinar email', 500, req);
    }

    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content as string | undefined;
    if (!content) return jsonError('Resposta vazia da IA', 500, req);

    let result: { subject?: string; message: string };
    try {
      result = JSON.parse(content);
    } catch {
      return jsonError('Resposta da IA fora do formato esperado', 500, req);
    }
    if (!result?.message || typeof result.message !== 'string') {
      return jsonError('Mensagem refinada ausente', 500, req);
    }

    return jsonOk({ subject: result.subject, message: result.message }, req);
  } catch (err) {
    console.error('refine error:', err);
    return jsonError(err instanceof Error ? err.message : 'Erro desconhecido', 500, req);
  }
});
