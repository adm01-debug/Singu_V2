import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { TablesUpdate } from '@/integrations/supabase/types';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';
import { parseApiError } from '@/lib/errorMessages';
import type { RodizioCloserCarga, RodizioSdrCarga, RodizioConfigFlags } from '@/types/rodizio';

/**
 * Substitui `useSalesTeam.ts`. A fonte de dados deixou de ser a tabela
 * `sales_team_members` (uuid, por usuário do CRM) e passou a ser `users`
 * (inteiro, sincronizada com o Bitrix) enriquecida pelas views
 * `vw_rodizio_carga_closers` e `vw_rodizio_carga_sdrs`, por isso o hook foi
 * renomeado — o conteúdo é outro, não faria sentido manter o nome antigo.
 */

const QUERY_KEY_BASE = ['rodizio-equipe'];

export function useRodizioEquipe() {
  const { user } = useAuth();

  return useQuery({
    queryKey: [...QUERY_KEY_BASE, user?.id],
    queryFn: async (): Promise<{ closers: RodizioCloserCarga[]; sdrs: RodizioSdrCarga[] }> => {
      if (!user) return { closers: [], sdrs: [] };

      const [closersRes, sdrsRes] = await Promise.all([
        supabase.from('vw_rodizio_carga_closers').select('*').order('closer_nome', { ascending: true }).limit(500),
        supabase.from('vw_rodizio_carga_sdrs').select('*').order('sdr_nome', { ascending: true }).limit(500),
      ]);

      if (closersRes.error) {
        logger.error('Erro ao carregar carga de closers:', closersRes.error);
        throw closersRes.error;
      }
      if (sdrsRes.error) {
        logger.error('Erro ao carregar carga de SDRs:', sdrsRes.error);
        throw sdrsRes.error;
      }

      return {
        closers: closersRes.data ?? [],
        sdrs: sdrsRes.data ?? [],
      };
    },
    enabled: !!user,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });
}

interface UpdateMembroPayload {
  id: number;
  tipo: 'closer' | 'sdr';
  ordem_rodizio?: number | null;
  capacidade_max?: number | null;
  afastado_ate?: string | null;
  /** Liga/desliga a participação do vendedor no rodízio deste papel. */
  participa?: boolean;
}

/** CRUD real de afastamento/capacidade/ordem/participação: UPDATE direto em `users`. */
export function useUpdateRodizioMembro() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, tipo, participa, ...updates }: UpdateMembroPayload) => {
      const payload: TablesUpdate<'users'> = { ...updates };
      if (participa !== undefined) {
        payload[tipo === 'closer' ? 'participa_rodizio_closer' : 'participa_rodizio_sdr'] = participa;
      }
      const { error } = await supabase
        .from('users')
        .update(payload)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEY_BASE });
      toast.success('Membro do rodízio atualizado');
    },
    onError: (err) => toast.error(parseApiError(err, 'Erro ao atualizar membro do rodízio')),
  });
}

/**
 * Kill switches `RODIZIO_CLOSER_ATIVO` / `RODIZIO_SDR_ATIVO` em
 * `config_regras_negocio` (texto 'true'/'false'). Somente leitura por ora.
 */
export function useRodizioConfigFlags() {
  return useQuery({
    queryKey: ['rodizio-config-flags'],
    queryFn: async (): Promise<RodizioConfigFlags> => {
      const { data, error } = await supabase
        .from('config_regras_negocio')
        .select('chave, valor')
        .in('chave', ['RODIZIO_CLOSER_ATIVO', 'RODIZIO_SDR_ATIVO']);
      if (error) throw error;
      const map = new Map((data ?? []).map((r) => [r.chave, r.valor]));
      return {
        closerAtivo: map.get('RODIZIO_CLOSER_ATIVO') === 'true',
        sdrAtivo: map.get('RODIZIO_SDR_ATIVO') === 'true',
      };
    },
    staleTime: 5 * 60_000,
    refetchOnWindowFocus: false,
  });
}
