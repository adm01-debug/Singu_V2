import { z } from "npm:zod@3.23.8";
import { withAuth, jsonError, jsonOk, scopedCorsHeaders } from "../_shared/auth.ts";
import { rateLimit } from "../_shared/rate-limit.ts";

const limiter = rateLimit({ windowMs: 60_000, max: 20, message: "Rate limit exceeded for AI writing. Please wait." });

interface ContactProfile {
  firstName: string;
  lastName: string;
  roleTitle?: string;
  companyName?: string;
  discProfile?: 'D' | 'I' | 'S' | 'C' | null;
  discNotes?: string;
  preferredChannel?: string;
  messageStyle?: string;
  formalityLevel?: number;
  primaryMotivation?: string;
  primaryFear?: string;
  communicationStyle?: string;
  hobbies?: string[];
  interests?: string[];
}

interface InteractionSummary {
  type: string;
  sentiment: string;
  content?: string;
  createdAt: string;
}

const WritingInput = z.object({
  contact: z.object({
    firstName: z.string().min(1),
    lastName: z.string().min(1),
    roleTitle: z.string().optional(),
    companyName: z.string().optional(),
    discProfile: z.enum(['D', 'I', 'S', 'C']).nullable().optional(),
    discNotes: z.string().optional(),
    preferredChannel: z.string().optional(),
    messageStyle: z.string().optional(),
    formalityLevel: z.number().min(1).max(10).optional(),
    primaryMotivation: z.string().optional(),
    primaryFear: z.string().optional(),
    communicationStyle: z.string().optional(),
    hobbies: z.array(z.string()).optional(),
    interests: z.array(z.string()).optional(),
  vakProfile: z.enum(['V', 'A', 'K']).nullable().optional(),
  }),
  recentInteractions: z.array(z.object({
    type: z.string(),
    sentiment: z.string(),
    content: z.string().optional(),
    createdAt: z.string(),
  })).default([]),
   messageType: z.enum(['follow_up', 'introduction', 'proposal', 'check_in', 'thank_you', 'meeting_request', 'custom']),
   customContext: z.string().max(2000).optional(),
   tone: z.enum(['formal', 'casual', 'friendly']).optional(),
    framework: z.enum(['AIDA', 'PAS', 'FAB', '4Ps', 'Storytelling', 'Carnegie', 'None']).optional().default('None'),
   storyArc: z.string().optional(),
 });

const DISC_COMMUNICATION_STYLES = {
  D: {
    name: "Dominante",
    approach: "Seja direto, objetivo e focado em resultados. Evite detalhes desnecessários. Vá direto ao ponto e mostre valor imediatamente.",
    avoid: "Não seja prolixo, não use linguagem emocional excessiva, não perca tempo com conversa fiada.",
    tone: "Confiante, assertivo, orientado a resultados",
    messageLength: "Curtas e diretas",
  },
  I: {
    name: "Influente", 
    approach: "Seja entusiasta, amigável e pessoal. Use linguagem positiva e mostre interesse genuíno na pessoa. Inclua elementos sociais.",
    avoid: "Não seja muito formal ou frio, não foque apenas em dados e números.",
    tone: "Caloroso, otimista, inspirador",
    messageLength: "Médias com toque pessoal",
  },
  S: {
    name: "Estável",
    approach: "Seja gentil, paciente e tranquilizador. Construa confiança gradualmente. Mostre que você é confiável e previsível.",
    avoid: "Não seja agressivo ou pressione para decisões rápidas. Não mude de assunto abruptamente.",
    tone: "Calmo, acolhedor, sincero",
    messageLength: "Médias com contexto",
  },
  C: {
    name: "Conforme",
    approach: "Seja preciso, detalhado e lógico. Forneça dados e evidências. Seja organizado e estruturado na comunicação.",
    avoid: "Não seja vago ou impreciso. Não use exageros ou promessas sem fundamento.",
    tone: "Profissional, analítico, preciso",
    messageLength: "Detalhadas e bem estruturadas",
  },
};

const VAK_STYLES = {
  V: {
    name: "Visual",
    keywords: ["ver", "olhar", "imagem", "claro", "visão", "foco", "perspectiva", "mostrar"],
    advice: "Use palavras visuais. 'Veja como isso funciona', 'Para você ter uma visão clara'."
  },
  A: {
    name: "Auditivo",
    keywords: ["ouvir", "escutar", "soar", "dizer", "pergunta", "conversa", "ritmo", "harmonia"],
    advice: "Use palavras auditivas. 'Isso soa bem para você?', 'Como essa proposta ressoa?'"
  },
  K: {
    name: "Cinestésico",
    keywords: ["sentir", "tocar", "pegar", "concreto", "sólido", "pressão", "base", "fluxo"],
    advice: "Use palavras ligadas a sensações e movimento. 'Sinta a diferença', 'Construir algo sólido'."
  }
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: scopedCorsHeaders(req) });
  }

  // ── Rate limit ──
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const limited = limiter.check(ip);
  if (limited) return limited;

  // ── Auth guard ──
  const authResult = await withAuth(req);
  if (authResult instanceof Response) return authResult;

  try {
    const rawBody = await req.json();
    const parsed = WritingInput.safeParse(rawBody);
    if (!parsed.success) {
      return jsonError(`Input inválido: ${JSON.stringify(parsed.error.flatten().fieldErrors)}`, 400);
    }
     const { contact, recentInteractions, messageType, customContext, tone, framework, storyArc } = parsed.data;
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const discStyle = contact.discProfile ? DISC_COMMUNICATION_STYLES[contact.discProfile] : null;
    const vakStyle = contact.vakProfile ? VAK_STYLES[contact.vakProfile] : null;
    
    const interactionContext = recentInteractions.length > 0 
      ? recentInteractions.slice(0, 5).map(i => 
          `- ${i.type} (${i.sentiment}): ${i.content?.substring(0, 100) || 'Sem conteúdo'}...`
        ).join('\n')
      : 'Sem interações recentes registradas.';

    const personalContext: string[] = [];
    if (contact.hobbies?.length) { personalContext.push(`Hobbies: ${contact.hobbies.join(', ')}`); }
    if (contact.interests?.length) { personalContext.push(`Interesses: ${contact.interests.join(', ')}`); }
    if (contact.primaryMotivation) { personalContext.push(`Motivação principal: ${contact.primaryMotivation}`); }
    if (contact.primaryFear) { personalContext.push(`Preocupação/Medo: ${contact.primaryFear}`); }

     const systemPrompt = `Você é um Copywriter Sênior e Estrategista de Vendas de elite, especialista em neurovendas e persuasão.
 Sua função é gerar 3 variações de mensagens personalizadas, utilizando técnicas avançadas de copywriting e frameworks de persuasão.
 
 ## Framework Solicitado: ${framework !== 'None' ? framework : 'Natural/Contextual'}
 ${framework === 'AIDA' ? '- AIDA: Atenção (Gancho), Interesse (Benefício), Desejo (Prova/Valor), Ação (CTA).' : ''}
 ${framework === 'PAS' ? '- PAS: Problema (Dor), Agitação (Consequência), Solução (Oferta).' : ''}
 ${framework === 'FAB' ? '- FAB: Feature (Recurso), Advantage (Vantagem), Benefit (Benefício real para o cliente).' : ''}
 ${framework === '4Ps' ? '- 4Ps: Promise (Promessa), Picture (Visualização do sucesso), Proof (Prova social/lógica), Push (Empurrão para ação).' : ''}
  ${framework === 'Storytelling' ? `- Storytelling: Use uma mini-narrativa focada no arco: ${storyArc || 'Jornada do Herói'}.` : ''}
  ${framework === 'Carnegie' ? '- Carnegie (Dale Carnegie): Demonstre interesse genuíno, fale em termos dos interesses do outro, faça-o sentir-se importante, seja amigável e evite críticas.' : ''}
 
 ## Regras de Ouro:
 1. Analisador de Copy Interno: Garanta alta legibilidade (Flesch PT-BR simplificado).
 2. Gatilhos Mentais: Use de forma elegante (Novidade, Escassez, Reciprocidade, Autoridade).
 3. Análise de Emoção: A mensagem deve evocar a emoção correta para o perfil DISC.

## Informações do Contato:
- Nome: ${contact.firstName} ${contact.lastName}
- Cargo: ${contact.roleTitle || 'Não especificado'}
- Empresa: ${contact.companyName || 'Não especificada'}
${discStyle ? `
## Perfil DISC: ${discStyle.name}
- Abordagem recomendada: ${discStyle.approach}
- O que evitar: ${discStyle.avoid}
- Tom ideal: ${discStyle.tone}
- Tamanho de mensagem: ${discStyle.messageLength}
${contact.discNotes ? `- Notas adicionais: ${contact.discNotes}` : ''}
` : ''}
## Canal Preferido: ${contact.preferredChannel || 'WhatsApp'}
## Nível de Formalidade: ${contact.formalityLevel || 3}/5 (1=muito informal, 5=muito formal)
${personalContext.length > 0 ? `
## Contexto Pessoal:
${personalContext.join('\n')}
` : ''}
## Histórico de Interações Recentes:
${interactionContext}

## Regras para geração de mensagens:
1. SEMPRE gere 3 variações de mensagem para o usuário escolher.
2. Adapte o vocabulário ao perfil sensorial VAK: ${vakStyle ? `${vakStyle.name} (Use: ${vakStyle.keywords.slice(0, 5).join(', ')})` : 'Equilibrado'}.
${vakStyle ? `3. Conselho VAK: ${vakStyle.advice}` : ''}
2. Adapte o tom e estilo ao perfil DISC do contato
3. Considere o histórico de interações para contextualizar
4. Seja natural e autêntico, evite linguagem robótica
5. Inclua personalização baseada nos interesses quando apropriado
6. A mensagem deve parecer escrita por um humano, não por IA
7. Escreva em português brasileiro
8. Formato esperado de resposta: JSON com array de sugestões`;

      const userPrompt = buildUserPrompt(messageType, customContext, tone, contact, framework, storyArc);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "generate_message_suggestions",
              description: "Gera 3 sugestões de mensagens personalizadas para o contato",
              parameters: {
                type: "object",
                properties: {
                  suggestions: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        id: { type: "string", description: "ID único da sugestão (1, 2, ou 3)" },
                        label: { type: "string", description: "Rótulo curto da sugestão (ex: 'Direto', 'Amigável', 'Formal')" },
                        message: { type: "string", description: "O texto completo da mensagem sugerida" },
                        reasoning: { type: "string", description: "Breve explicação de por que esta abordagem é recomendada para este perfil" },
                      },
                      required: ["id", "label", "message", "reasoning"],
                      additionalProperties: false,
                    },
                    minItems: 3,
                    maxItems: 3,
                  },
                  tips: {
                    type: "array",
                    items: { type: "string" },
                    description: "2-3 dicas rápidas para melhorar a comunicação com este perfil",
                  },
                },
                required: ["suggestions", "tips"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "generate_message_suggestions" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return jsonError("Limite de requisições excedido. Tente novamente em alguns minutos.", 429);
      }
      if (response.status === 402) {
        return jsonError("Créditos insuficientes. Adicione créditos na sua conta Lovable.", 402);
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) {
      throw new Error("No tool call response received");
    }

    const result = JSON.parse(toolCall.function.arguments);

    return jsonOk(result);
  } catch (error) {
    console.error("AI Writing Assistant error:", error);
    return jsonError(error instanceof Error ? error.message : "Erro ao gerar sugestões", 500);
  }
});

 function buildUserPrompt(
   messageType: any,
   customContext: string | undefined,
   tone: string | undefined,
   contact: any,
   framework: string | undefined,
   storyArc: string | undefined
 ): string {
  const typeDescriptions: Record<string, string> = {
    follow_up: "uma mensagem de follow-up para retomar o contato ou dar continuidade a uma conversa anterior",
    introduction: "uma mensagem de apresentação inicial para estabelecer primeiro contato",
    proposal: "uma mensagem apresentando uma proposta comercial ou sugestão de colaboração",
    check_in: "uma mensagem casual para verificar como a pessoa está e manter o relacionamento",
    thank_you: "uma mensagem de agradecimento sincero",
    meeting_request: "uma mensagem solicitando uma reunião ou call",
    custom: customContext || "uma mensagem personalizada",
  };

  const toneDescription = tone === 'formal' 
    ? 'Use um tom mais formal e profissional.'
    : tone === 'casual' 
    ? 'Use um tom mais descontraído e casual.'
    : 'Use um tom amigável mas profissional.';

   const storyArcSuffix = storyArc ? ` (Arco: ${storyArc})` : '';
   const frameworkLine = framework !== 'None' ? `Aplique rigorosamente o framework: ${framework}${storyArcSuffix}` : '';
   return `Gere 3 variações de mensagens para ${contact.firstName}.
 
 Objetivo: ${typeDescriptions[messageType]}
  ${frameworkLine}
 
 ${customContext ? `Contexto do usuário: ${customContext}` : ''}
 
 Estilo/Tom: ${toneDescription}
 
 Lembre-se:
 - Considere o perfil comportamental ${contact.discProfile || 'não especificado'}.
 - Use gatilhos mentais apropriados.
 - Maximize a legibilidade e o impacto emocional.`;
 }
