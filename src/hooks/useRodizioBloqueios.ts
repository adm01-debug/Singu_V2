import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { z } from 'zod';
import { logger } from '@/lib/logger';
import { parseApiError } from '@/lib/errorMessages';
import { callRodizioRpc } from '@/lib/rodizioRpc';
import { supabase } from '@/integrations/supabase/client';
import { useAppUserId } from '@/hooks/useAppUserId';
import type {
  RodizioBloqueio,
  RodizioBloquearResult,
  RodizioAprovarBloqueioResult,
} from '@/types/rodizio';

/**
 * Substitui `useHandoffQueue.ts`. O conceito de "handoff SDR → Closer" não
 * existe mais no motor novo; o que existe é bloqueio de cliente (protegendo
 * um cliente contra rotação por um período), com aprovação quando o pedido
 * excede a cota mensal do vendedor.
 *
 * Decisão sobre realtime: o `useHandoffQueue` antigo assinava
 * `postgres_changes` na tabela `handoff_requests` diretamente. Aqui os dados
 * vêm de `vw_rodizio_bloqueios`, uma VIEW — o Supabase Realtime não emite
 * eventos de `postgres_changes` para views (só para tabelas físicas), e a
 * tabela física por trás dela não é conhecida deste módulo (é derivada,
 * possivelmente cruzando `customer_rotation_state` e a lógica de bloqueio).
 * Assinar a tabela errada arriscaria invalidar a cada write não relacionado
 * ou nunca disparar. Optei por **não** manter realtime aqui: os hooks de
 * mutação já invalidam a query ao aprovar/bloquear, e a lista usa
 * `staleTime` curto (30s) com refetch ao focar a aba, o que cobre o caso de
 * uso (poucas dezenas de bloqueios/mês) sem o risco de uma assinatura presa
 * a uma tabela errada.
 */

const BLOQUEIOS_KEY_BASE = ['rodizio-bloqueios'];

export function useRodizioBloqueios() {
  const { user } = useAuth();
  return useQuery({
    queryKey: [...BLOQUEIOS_KEY_BASE, user?.id],
    queryFn: async (): Promise<RodizioBloqueio[]> => {
      if (!user) return [];
      const { data, error } = await supabase.from('vw_rodizio_bloqueios')
        .select('*')
        .neq('status', 'NENHUM')
        .order('bloqueado_ate', { ascending: false, nullsFirst: false })
        .limit(500);
      if (error) {
        logger.error('Erro ao carregar bloqueios:', error);
        throw error;
      }
      return (data ?? []).map(row => ({
        ...row,
        customer_id: z.string().parse(row.customer_id),
        status: z.enum(['NENHUM', 'EXPIRADO', 'PENDENTE_APROVACAO', 'ATIVO']).parse(row.status),
      }));
    },
    enabled: !!user,
    staleTime: 30_000,
    refetchOnWindowFocus: true,
  });
}

export function useBloquearCliente() {
  const qc = useQueryClient();
  const { data: appUserId } = useAppUserId();

  return useMutation({
    mutationFn: async ({
      customerId,
      dias,
      motivo,
    }: {
      customerId: string;
      dias: number;
      motivo: string;
    }): Promise<RodizioBloquearResult> => {
      if (!appUserId) {
        throw new Error('Não foi possível identificar seu usuário interno (users.id) para registrar o bloqueio.');
      }
      return callRodizioRpc<RodizioBloquearResult>('rodizio_bloquear_cliente', {
        p_customer_id: customerId,
        p_dias: dias,
        p_motivo: motivo,
        p_solicitado_por_id: appUserId,
      });
    },
    onSuccess: (result) => {
      qc.invalidateQueries({ queryKey: BLOQUEIOS_KEY_BASE });
      if (result.status === 'ok' || result.status === 'success') {
        toast.success(
          result.pendente_aprovacao
            ? 'Bloqueio solicitado — aguardando aprovação'
            : `Cliente bloqueado até ${result.bloqueado_ate ?? '—'}`,
        );
      } else {
        toast.error(result.message ?? 'Não foi possível bloquear o cliente');
      }
    },
    onError: (err) => {
      logger.error('[BloquearCliente]', err);
      toast.error(parseApiError(err, 'Erro ao bloquear cliente'));
    },
  });
}

export function useAprovarBloqueio() {
  const qc = useQueryClient();
  const { data: appUserId } = useAppUserId();

  return useMutation({
    mutationFn: async (customerId: string): Promise<RodizioAprovarBloqueioResult> =>
      callRodizioRpc<RodizioAprovarBloqueioResult>('rodizio_aprovar_bloqueio', {
        p_customer_id: customerId,
        p_aprovado_por_id: appUserId ?? null,
      }),
    onSuccess: (result) => {
      qc.invalidateQueries({ queryKey: BLOQUEIOS_KEY_BASE });
      if (result.status === 'ok' || result.status === 'success') {
        toast.success(result.message ?? 'Bloqueio aprovado');
      } else {
        toast.error(result.message ?? 'Não foi possível aprovar o bloqueio');
      }
    },
    onError: (err) => {
      logger.error('[AprovarBloqueio]', err);
      toast.error(parseApiError(err, 'Erro ao aprovar bloqueio'));
    },
  });
}
