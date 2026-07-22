import { useQuery } from '@tanstack/react-query';
import { queryExternalData } from '@/lib/externalData';
import { useAuth } from '@/hooks/useAuth';

export interface InteracaoSemApelido {
  interaction_id: string;
  contact_id: string;
  full_name: string;
  nome_tratamento: string | null;
  company_id: string | null;
  empresa: string | null;
  canal: string | null;
  data_interacao: string | null;
  created_by: number | null;
  vendedor: string | null;
}

/** Interactions where contact has no nickname — data quality view */
export function useInteracoesSemApelido(limit = 20) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['interacoes-sem-apelido', limit, user?.id],
    queryFn: async () => {
      const { data, error } = await queryExternalData<InteracaoSemApelido>({
        table: 'vw_interacoes_sem_apelido',
        filters: [{ type: 'eq', column: 'user_id', value: user!.id }],
        order: { column: 'data_interacao', ascending: false },
        range: { from: 0, to: limit - 1 },
      });
      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
    staleTime: 10 * 60 * 1000,
    gcTime: 20 * 60 * 1000,
  });
}
