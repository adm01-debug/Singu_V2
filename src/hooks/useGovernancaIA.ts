import { useQuery } from '@tanstack/react-query';
import { queryExternalData } from '@/lib/externalData';

const LIMITE = 100;

export interface ModeloIA {
  tier: string | null;
  model: string | null;
  provider: string | null;
  cost_input: number | null;
  cost_output: number | null;
  context_window: number | null;
  capabilities: string[] | null;
  cost_tier: string | null;
}

export interface ReframeRow {
  pattern_id: string | null;
  pattern_name: string | null;
  category: string | null;
  description: string | null;
  example_objection: string | null;
  example_response: string | null;
  effectiveness_score: number | null;
  difficulty_level: string | null;
  effectiveness_status: string | null;
  recommended_contexts: string[] | null;
  disc_compatibility: string[] | null;
}

export interface ScriptRow {
  script_id: string | null;
  script_name: string | null;
  script_type: string | null;
  stage: string | null;
  channel: string | null;
  objective: string | null;
  estimated_duration_minutes: number | null;
  success_rate: number | null;
  times_used: number | null;
  performance_status: string | null;
  total_sections: number | null;
  recommended_disc_types: string[] | null;
}

export function useCatalogoModelos() {
  return useQuery({
    queryKey: ['governanca-ia-modelos'],
    queryFn: async () => {
      const { data, error } = await queryExternalData<ModeloIA>({
        table: 'v_model_catalog',
        select: '*',
        order: [{ column: 'tier', ascending: true }, { column: 'cost_input', ascending: true }],
        range: { from: 0, to: LIMITE - 1 },
        auditAccess: false,
      });
      if (error) throw error;
      return data ?? [];
    },
    staleTime: 5 * 60_000,
  });
}

export function useReframes() {
  return useQuery({
    queryKey: ['governanca-ia-reframes'],
    queryFn: async () => {
      const { data, error } = await queryExternalData<ReframeRow>({
        table: 'vw_reframe_suggestions',
        select: '*',
        order: { column: 'effectiveness_score', ascending: false },
        range: { from: 0, to: LIMITE - 1 },
        auditAccess: false,
      });
      if (error) throw error;
      return data ?? [];
    },
    staleTime: 5 * 60_000,
  });
}

export function useScriptsRecomendados() {
  return useQuery({
    queryKey: ['governanca-ia-scripts'],
    queryFn: async () => {
      const { data, error } = await queryExternalData<ScriptRow>({
        table: 'vw_recommended_scripts',
        select: '*',
        order: { column: 'success_rate', ascending: false },
        range: { from: 0, to: LIMITE - 1 },
        auditAccess: false,
      });
      if (error) throw error;
      return data ?? [];
    },
    staleTime: 5 * 60_000,
  });
}