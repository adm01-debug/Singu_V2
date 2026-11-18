import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { PipelineDeal } from './usePipeline';

export interface NLPProbabilityFactor {
  label: string;
  impact: 'positive' | 'negative' | 'neutral';
  /** Número medido de verdade. `null` = atributo mapeado, mas sem escala numérica. */
  score: number | null;
}

export interface NLPProbabilityResult {
  /** Probabilidade final exibida: base do negócio + ajuste comportamental. */
  probability: number;
  /** Probabilidade do próprio negócio, como está no banco. */
  base: number;
  /** Quanto a leitura comportamental somou ou subtraiu. 0 quando não há leitura. */
  ajuste: number;
  level: 'low' | 'medium' | 'high' | 'elite';
  factors: NLPProbabilityFactor[];
  recommendation: string;
  /** `false` quando o contato não tem nenhum sinal comportamental medido. */
  temLeitura: boolean;
}

/**
 * Probabilidade de fechamento do negócio, com ajuste pela leitura
 * comportamental do contato quando ela existir.
 *
 * Antes, este hook devolvia quatro fatores cravados no código
 * (`Calibração VAK 85`, `Sincronia de Rapport 92`, ...) iguais para todos os
 * deals, e somava a média deles ponderada em 0,25 — um acréscimo fixo de ~19
 * pontos — à probabilidade de qualquer negócio. O próprio comentário dizia
 * "Fatores determinísticos simulados para demonstração de inteligência".
 *
 * Agora o número exibido é a probabilidade real do negócio (`deals.probabilidade`).
 * A leitura comportamental vem de `public.vw_communication_dashboard` e só mexe
 * no número quando há `rapport_score` medido — hoje a camada comportamental
 * está dormente e nenhum contato tem perfil mapeado, então o badge mostra a
 * probabilidade do negócio e diz, no tooltip, que não há leitura. O badge não
 * some: sumir seria tirar informação verdadeira da tela.
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

/** Texto de ação genérico que a view devolve quando não há perfil mapeado. */
const ACAO_GENERICA = 'Seguir perfil';

function montarFatores(leitura: LeituraComportamental | null): NLPProbabilityFactor[] {
  if (!leitura) return [];
  const factors: NLPProbabilityFactor[] = [];
  if (leitura.rapport_score != null) {
    const s = Math.round(leitura.rapport_score);
    factors.push({
      label: 'Rapport',
      score: s,
      impact: s >= 60 ? 'positive' : s >= 40 ? 'neutral' : 'negative',
    });
  }
  // DISC, VAK e estilo de decisão são rótulos, não medidas: entram sem
  // percentual, para não virar o "100%" inventado que este hook tinha antes.
  if (leitura.disc_type) factors.push({ label: 'Perfil DISC', score: null, impact: 'neutral' });
  if (leitura.vak_type) factors.push({ label: 'Canal VAK', score: null, impact: 'neutral' });
  if (leitura.decision_style) factors.push({ label: 'Estilo de decisão', score: null, impact: 'neutral' });
  if (leitura.eq_level) factors.push({ label: 'Inteligência emocional', score: null, impact: 'neutral' });
  return factors;
}

export function useNLPClosingProbability(deal: PipelineDeal) {
  const contactId = deal.contact_id ?? null;

  return useQuery({
    queryKey: ['nlp-closing-probability', deal.id, contactId, deal.probabilidade],
    enabled: !!deal.id,
    staleTime: 1000 * 60 * 5,
    queryFn: async (): Promise<NLPProbabilityResult> => {
      let leitura: LeituraComportamental | null = null;

      if (contactId) {
        const { data, error } = await supabase
          .from('vw_communication_dashboard')
          .select('rapport_score, rapport_level, disc_type, vak_type, eq_level, decision_style, communication_action')
          .eq('contact_id', contactId)
          .maybeSingle();
        if (error) throw error;
        leitura = data as LeituraComportamental | null;
      }

      const factors = montarFatores(leitura);
      const temLeitura = factors.length > 0;

      const base = deal.probabilidade || 0;
      // Só o rapport é um número medido; o resto é presença ou ausência de
      // mapeamento, que não justifica mexer na probabilidade do negócio.
      const ajuste = leitura?.rapport_score != null
        ? Math.round(((leitura.rapport_score - 50) / 50) * AJUSTE_MAXIMO)
        : 0;
      const probability = Math.max(0, Math.min(base + ajuste, TETO));

      let level: NLPProbabilityResult['level'] = 'medium';
      if (probability > 85) level = 'elite';
      else if (probability > 60) level = 'high';
      else if (probability < 30) level = 'low';

      const acaoDaView = leitura?.communication_action?.replace(/[^\p{L}\p{N} ]/gu, '').trim();
      const acaoUtil = acaoDaView && acaoDaView !== ACAO_GENERICA ? acaoDaView : null;

      let recommendation: string;
      if (!temLeitura) {
        recommendation = 'Sem leitura comportamental deste contato. Mapeie o perfil para ajustar a probabilidade.';
      } else if (acaoUtil) {
        recommendation = acaoUtil;
      } else if (leitura?.rapport_score != null && leitura.rapport_score < 40) {
        recommendation = 'Rapport baixo: invista em conexão antes da próxima proposta.';
      } else {
        recommendation = 'Siga o perfil comportamental mapeado para este contato.';
      }

      return { probability, base, ajuste, level, factors, recommendation, temLeitura };
    },
  });
}
