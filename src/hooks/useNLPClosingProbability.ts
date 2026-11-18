import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { PipelineDeal } from './usePipeline';

export interface NLPProbabilityResult {
  probability: number;
  level: 'low' | 'medium' | 'high' | 'elite';
  factors: {
    label: string;
    impact: 'positive' | 'negative' | 'neutral';
    score: number;
  }[];
  recommendation: string;
}

/**
 * Leitura comportamental do contato por trás do deal.
 *
 * Antes, este hook devolvia quatro fatores cravados no código
 * (`Calibração VAK 85`, `Sincronia de Rapport 92`, ...) iguais para todos os
 * deals, e somava a média deles ponderada em 0,25 — um acréscimo fixo de ~19
 * pontos — à probabilidade de qualquer negócio. O próprio comentário dizia
 * "Fatores determinísticos simulados para demonstração de inteligência".
 *
 * Agora os fatores vêm de public.vw_communication_dashboard, que reúne DISC,
 * VAK, EQ, estilo de comunicação e rapport do contato. Sem leitura
 * comportamental para aquele contato, o hook devolve `null` e o badge não é
 * renderizado: é melhor não mostrar nada do que mostrar um número inventado.
 */

/** Peso máximo que a leitura comportamental pode somar à probabilidade do deal. */
const AJUSTE_MAXIMO = 10;
const TETO = 98;

interface LeituraComportamental {
  rapport_score: number | null;
  rapport_level: string | null;
  disc_type: string | null;
  vak_type: string | null;
  eq_level: string | null;
  decision_style: string | null;
  communication_action: string | null;
}

export function useNLPClosingProbability(deal: PipelineDeal) {
  const contactId = deal.contact_id ?? null;

  return useQuery({
    queryKey: ['nlp-closing-probability', deal.id, contactId],
    enabled: !!deal.id && !!contactId,
    staleTime: 1000 * 60 * 5,
    queryFn: async (): Promise<NLPProbabilityResult | null> => {
      const { data, error } = await supabase
        .from('vw_communication_dashboard')
        .select('rapport_score, rapport_level, disc_type, vak_type, eq_level, decision_style, communication_action')
        .eq('contact_id', contactId!)
        .maybeSingle();
      if (error) throw error;

      const leitura = data as LeituraComportamental | null;
      if (!leitura) return null;

      const factors: NLPProbabilityResult['factors'] = [];

      if (leitura.rapport_score != null) {
        factors.push({
          label: 'Rapport',
          score: Math.round(leitura.rapport_score),
          impact: leitura.rapport_score >= 60 ? 'positive' : leitura.rapport_score >= 40 ? 'neutral' : 'negative',
        });
      }
      if (leitura.disc_type) {
        factors.push({ label: `Perfil DISC (${leitura.disc_type})`, score: 100, impact: 'positive' });
      }
      if (leitura.vak_type) {
        factors.push({ label: `Canal VAK (${leitura.vak_type})`, score: 100, impact: 'positive' });
      }
      if (leitura.decision_style) {
        factors.push({ label: `Estilo de decisão (${leitura.decision_style})`, score: 100, impact: 'positive' });
      }

      // Nenhum sinal comportamental medido: nada honesto a mostrar.
      if (factors.length === 0) return null;

      const baseProb = deal.probabilidade || 0;
      // Só o rapport é um número medido; o resto é presença ou ausência de
      // mapeamento, que não justifica mexer na probabilidade do negócio.
      const ajuste = leitura.rapport_score != null
        ? Math.round(((leitura.rapport_score - 50) / 50) * AJUSTE_MAXIMO)
        : 0;
      const probability = Math.max(0, Math.min(baseProb + ajuste, TETO));

      let level: NLPProbabilityResult['level'] = 'medium';
      if (probability > 85) level = 'elite';
      else if (probability > 60) level = 'high';
      else if (probability < 30) level = 'low';

      const recommendation = leitura.communication_action
        ?? (leitura.rapport_score != null && leitura.rapport_score < 40
          ? 'Rapport baixo: invista em conexão antes da próxima proposta.'
          : 'Siga o perfil comportamental mapeado para este contato.');

      return { probability, level, factors, recommendation };
    },
  });
}
