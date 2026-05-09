// ==============================================
// DISC Analyzer Edge Function
// Powered by Lovable AI - Enterprise Level Analysis
// ==============================================

import { createClient } from "npm:@supabase/supabase-js@2";
import { z } from "npm:zod@3.23.8";
import { withAuth, jsonError, jsonOk, corsHeaders } from "../_shared/auth.ts";
import { rateLimit } from "../_shared/rate-limit.ts";

const limiter = rateLimit({ windowMs: 60_000, max: 30, message: "Rate limit exceeded for DISC analyzer. Please wait." });

const DiscAnalyzerInput = z.object({
  texts: z.array(z.string().min(1)).min(1, 'Pelo menos 1 texto é necessário').max(50),
  contactId: z.string().uuid('contactId deve ser UUID válido'),
  interactionId: z.string().uuid().optional(),
});

interface DISCScores {
  D: number;
  I: number;
  S: number;
  C: number;
}

interface AnalysisResult {
  scores: DISCScores;
  primaryProfile: string;
  secondaryProfile: string | null;
  blendProfile: string;
  confidence: number;
  stressPrimary: string | null;
  stressSecondary: string | null;
  behaviorIndicators: string[];
  salesStrategies: {
    opening: string[];
    presentation: string[];
    objectionHandling: string[];
    closing: string[];
  };
  communicationTips: string[];
  avoidBehaviors: string[];
  profileSummary: string;
}

const DISC_ANALYSIS_PROMPT = `Você é um especialista certificado em metodologia DISC com mais de 20 anos de experiência em análise comportamental.

Analise o seguinte texto e identifique o perfil DISC da pessoa que escreveu/falou, considerando:

## CARACTERÍSTICAS DOS PERFIS:

**D (Dominância)** - Foco em resultados
- Palavras-chave: agora, imediatamente, resultado, objetivo, decisão, controle, vencer
- Frases típicas: "vamos ao ponto", "qual o resultado?", "não temos tempo"
- Comunicação: direta, assertiva, impaciente, focada em resultados
- Sob pressão: mais autoritário, impositivo

**I (Influência)** - Foco em pessoas
- Palavras-chave: incrível, fantástico, juntos, equipe, celebrar, criativo, empolgante
- Frases típicas: "que legal!", "vamos fazer junto", "tenho uma ideia"
- Comunicação: entusiasta, otimista, expressiva, storytelling
- Sob pressão: mais disperso, emocional

**S (Estabilidade)** - Foco em segurança
- Palavras-chave: processo, calma, apoio, harmonia, tradicional, confiável
- Frases típicas: "sempre fizemos assim", "preciso pensar", "vamos com calma"
- Comunicação: paciente, acolhedora, metódica, evita conflitos
- Sob pressão: mais passivo, indeciso

**C (Conformidade)** - Foco em qualidade
- Palavras-chave: dados, análise, precisão, correto, documentação, padrão
- Frases típicas: "preciso analisar", "onde estão os dados?", "está correto?"
- Comunicação: precisa, detalhada, questionadora, cética
- Sob pressão: mais crítico, perfeccionista

## INSTRUÇÕES:

1. Analise o tom, vocabulário, estrutura e conteúdo do texto
2. Identifique padrões comportamentais e comunicacionais
3. Atribua scores de 0-100 para cada dimensão
4. Determine perfil primário e secundário
5. Identifique como a pessoa se comporta sob pressão
6. Forneça insights acionáveis para vendas

Retorne APENAS um JSON válido com a seguinte estrutura:
{
  "scores": { "D": 0-100, "I": 0-100, "S": 0-100, "C": 0-100 },
  "primaryProfile": "D|I|S|C",
  "secondaryProfile": "D|I|S|C|null",
  "blendProfile": "string (ex: DI, SC, etc)",
  "confidence": 0-100,
  "stressPrimary": "D|I|S|C|null",
  "stressSecondary": "D|I|S|C|null",
  "behaviorIndicators": ["3-5 indicadores observados"],
  "salesStrategies": {
    "opening": ["2-3 estratégias de abertura"],
    "presentation": ["2-3 dicas de apresentação"],
    "objectionHandling": ["2-3 técnicas de objeção"],
    "closing": ["2-3 técnicas de fechamento"]
  },
  "communicationTips": ["3-5 dicas de comunicação"],
  "avoidBehaviors": ["3-5 comportamentos a evitar"],
  "profileSummary": "Resumo de 2-3 frases sobre o perfil"
}`;

function calculateBlendCode(D: number, I: number, S: number, C: number): { primary: string; secondary: string | null; blend: string } {
  const scores: [string, number][] = [
    ['D', D], ['I', I], ['S', S], ['C', C]
  ];
  scores.sort((a, b) => b[1] - a[1]);
  
  const primary = scores[0][0];
  const secondary = scores[1][1] >= 40 ? scores[1][0] : null;
  const blend = secondary ? `${primary}${secondary}` : primary;
  
  return { primary, secondary, blend };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // ── Rate limit ──
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const limited = limiter.check(ip);
  if (limited) return limited;

  // ── Auth guard: use JWT user_id, ignore body userId ──
  const authResult = await withAuth(req);
  if (authResult instanceof Response) return authResult;
  const userId = authResult; // from JWT

  try {
    const rawBody = await req.json();
    const parsed = DiscAnalyzerInput.safeParse(rawBody);
    if (!parsed.success) {
      return jsonError(`Input inválido: ${JSON.stringify(parsed.error.flatten().fieldErrors)}`, 400);
    }
    const { texts, contactId, interactionId } = parsed.data;

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return jsonError("LOVABLE_API_KEY não configurada", 500);
    }

    const combinedText = texts.join("\n\n---\n\n");
    
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: DISC_ANALYSIS_PROMPT },
          { role: "user", content: `Analise o seguinte texto e determine o perfil DISC:\n\n${combinedText}` }
        ],
        temperature: 0.3
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return jsonError("Rate limit exceeded. Tente novamente em alguns segundos.", 429);
      }
      if (aiResponse.status === 402) {
        return jsonError("Créditos insuficientes. Adicione créditos ao workspace.", 402);
      }
      const errorText = await aiResponse.text();
      console.error("AI error:", errorText);
      throw new Error(`AI gateway error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const content = aiData.choices?.[0]?.message?.content || "";
    
    let analysisResult: AnalysisResult;
    try {
      const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/) || 
                       content.match(/```\s*([\s\S]*?)\s*```/);
      const jsonStr = jsonMatch ? jsonMatch[1] : content;
      analysisResult = JSON.parse(jsonStr.trim());
    } catch (parseErr) {
      console.error("Parse error:", parseErr, "Content:", content);
      analysisResult = {
        scores: { D: 50, I: 50, S: 50, C: 50 },
        primaryProfile: "I",
        secondaryProfile: null,
        blendProfile: "I",
        confidence: 40,
        stressPrimary: null,
        stressSecondary: null,
        behaviorIndicators: ["Análise parcial - texto insuficiente"],
        salesStrategies: {
          opening: ["Abordagem balanceada recomendada"],
          presentation: ["Combine dados com entusiasmo"],
          objectionHandling: ["Ouça atentamente as preocupações"],
          closing: ["Ofereça tempo para decisão"]
        },
        communicationTips: ["Adapte conforme feedback"],
        avoidBehaviors: ["Pressão excessiva"],
        profileSummary: "Perfil indefinido - necessita mais dados de interação"
      };
    }

    const { primary, secondary, blend } = calculateBlendCode(
      analysisResult.scores.D,
      analysisResult.scores.I,
      analysisResult.scores.S,
      analysisResult.scores.C
    );

    // Save to Supabase — scoped to JWT userId
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: savedRecord, error: saveError } = await supabase
      .from("disc_analysis_history")
      .insert({
        user_id: userId,
        contact_id: contactId,
        interaction_id: interactionId || null,
        dominance_score: analysisResult.scores.D,
        influence_score: analysisResult.scores.I,
        steadiness_score: analysisResult.scores.S,
        conscientiousness_score: analysisResult.scores.C,
        primary_profile: primary,
        secondary_profile: secondary,
        blend_profile: blend,
        stress_primary: analysisResult.stressPrimary,
        stress_secondary: analysisResult.stressSecondary,
        confidence: analysisResult.confidence,
        analysis_source: "ai_analysis",
        detected_keywords: [],
        detected_phrases: [],
        behavior_indicators: analysisResult.behaviorIndicators,
        analyzed_text: combinedText.slice(0, 5000),
        profile_summary: analysisResult.profileSummary
      })
      .select()
      .single();

    if (saveError) {
      console.error("Save error:", saveError);
      throw new Error(`Database save error: ${saveError.message}`);
    }

    // Verify contact belongs to this user before updating
    const { data: contactOwnership } = await supabase
      .from("contacts")
      .select("id, behavior")
      .eq("id", contactId)
      .eq("user_id", userId)
      .maybeSingle();

    if (contactOwnership) {
      const currentBehavior = (contactOwnership.behavior as Record<string, unknown>) || {};
      await supabase
        .from("contacts")
        .update({
          behavior: {
            ...currentBehavior,
            discProfile: primary,
            discConfidence: analysisResult.confidence,
            discBlend: blend,
            discLastAnalysis: new Date().toISOString()
          }
        })
        .eq("id", contactId)
        .eq("user_id", userId);
    }

    await supabase
      .from("disc_communication_logs")
      .insert({
        user_id: userId,
        contact_id: contactId,
        contact_disc_profile: primary,
        approach_adapted: false,
        adaptation_tips_shown: analysisResult.salesStrategies
      });

    return jsonOk({
      success: true,
      analysis: {
        id: savedRecord.id,
        scores: analysisResult.scores,
        primaryProfile: primary,
        secondaryProfile: secondary,
        blendProfile: blend,
        confidence: analysisResult.confidence,
        stressPrimary: analysisResult.stressPrimary,
        stressSecondary: analysisResult.stressSecondary,
        behaviorIndicators: analysisResult.behaviorIndicators,
        salesStrategies: analysisResult.salesStrategies,
        communicationTips: analysisResult.communicationTips,
        avoidBehaviors: analysisResult.avoidBehaviors,
        profileSummary: analysisResult.profileSummary
      }
    });

  } catch (error) {
    console.error("DISC analyzer error:", error);
    return jsonError(error instanceof Error ? error.message : "Erro desconhecido", 500);
  }
});