import { useQuery } from '@tanstack/react-query';
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

export function useNLPClosingProbability(deal: PipelineDeal) {
  return useQuery({
    queryKey: ['nlp-closing-probability', deal.id],
    queryFn: async (): Promise<NLPProbabilityResult> => {
      // Simulamos uma análise profunda baseada em logs de interação
      // Em um cenário real, consultaríamos tabelas de análise de sentimentos e rapport
      
      const baseProb = deal.probabilidade || 20;
      
      // Fatores determinísticos simulados para demonstração de inteligência
      const factors = [
        { label: 'Calibração VAK', score: 85, impact: 'positive' as const },
        { label: 'Sincronia de Rapport', score: 92, impact: 'positive' as const },
        { label: 'Linguagem Hipnótica', score: 45, impact: 'neutral' as const },
        { label: 'Enquadramento de Valor', score: 78, impact: 'positive' as const }
      ];

      const nlpBoost = (factors.reduce((acc, f) => acc + f.score, 0) / 4) * 0.25;
      const finalProb = Math.min(Math.round(baseProb + nlpBoost), 98);
      
      let level: NLPProbabilityResult['level'] = 'medium';
      if (finalProb > 85) level = 'elite';
      else if (finalProb > 60) level = 'high';
      else if (finalProb < 30) level = 'low';

      const recommendation = finalProb > 80 
        ? "Padrões de fechamento direto recomendados. Use 'Sleight of Mouth: Consequência'." 
        : "Reforce o Rapport Auditivo antes da próxima proposta.";

      return {
        probability: finalProb,
        level,
        factors,
        recommendation
      };
    },
    enabled: !!deal.id,
    staleTime: 1000 * 60 * 5, // 5 minutos
  });
}