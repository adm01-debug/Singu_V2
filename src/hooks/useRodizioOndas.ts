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
  RodizioStagingRow,
  RodizioExecucao,
  RodizioFiltrosSugestao,
  RodizioAplicarOndaResult,
  RodizioSugerirDistribuicaoResult,
  RodizioReverterResult,
  ExecucaoModo,
  StagingStatus,
} from '@/types/rodizio';

/**
 * Substitui `useLeadRouting.ts` (regras de roteamento). O conceito de "regra"
 * (round-robin/weighted/território) não existe mais — o motor novo trabalha
 * por "ondas" de distribuição em staging (`rodizio_distribuicao_staging`),
 * aprovadas manualmente e aplicadas via RPC.
 */

const STAGING_KEY_BASE = ['rodizio-staging'];
const EXECUCOES_KEY = ['rodizio-execucoes'];

/* ─── Staging por onda ─── */

export function useRodizioStaging(onda: number) {
  const { user } = useAuth();
  return useQuery({
    queryKey: [...STAGING_KEY_BASE, onda, user?.id],
    queryFn: async (): Promise<RodizioStagingRow[]> => {
      if (!user) return [];
      const { data, error } = await supabase.from('rodizio_distribuicao_staging')
        .select('*')
        .eq('onda', onda)
        .order('id', { ascending: true })
        .limit(2000);
      if (error) {
        logger.error('Erro ao carregar staging do rodízio:', error);
        throw error;
      }
      return (data ?? []).map(row => ({
        ...row,
        origem: z.enum(['MANUAL', 'SUGESTAO_MOTOR', 'IMPORT_CSV']).parse(row.origem),
        status: z.enum(['RASCUNHO', 'APROVADO', 'APLICADO', 'REJEITADO']).parse(row.status),
      }));
    },
    enabled: !!user,
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });
}

/** Aprova/rejeita uma linha de staging (apenas RASCUNHO → APROVADO/REJEITADO, aplicado no client). */
export function useDecidirStaging() {
  const qc = useQueryClient();
  const { data: appUserId } = useAppUserId();

  return useMutation({
    mutationFn: async ({ id, decisao }: { id: string; decisao: Extract<StagingStatus, 'APROVADO' | 'REJEITADO'> }) => {
      const { error } = await supabase.from('rodizio_distribuicao_staging')
        .update({ status: decisao, aprovado_por_id: appUserId ?? null })
        .eq('id', id)
        .eq('status', 'RASCUNHO');
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: STAGING_KEY_BASE });
      toast.success(vars.decisao === 'APROVADO' ? 'Distribuição aprovada' : 'Distribuição rejeitada');
    },
    onError: (err) => toast.error(parseApiError(err, 'Erro ao decidir distribuição')),
  });
}

/* ─── Motor: sugerir e aplicar onda ─── */

export function useSugerirDistribuicao() {
  const qc = useQueryClient();
  const { data: appUserId } = useAppUserId();

  return useMutation({
    mutationFn: async ({ onda, filtros }: { onda: number; filtros?: RodizioFiltrosSugestao }) =>
      callRodizioRpc<RodizioSugerirDistribuicaoResult>('rodizio_sugerir_distribuicao', {
        p_onda: onda,
        p_filtros: filtros ?? {},
        p_criado_por_id: appUserId ?? null,
      }),
    onSuccess: (result, vars) => {
      qc.invalidateQueries({ queryKey: [...STAGING_KEY_BASE, vars.onda] });
      if (result.status !== 'success') {
        toast.error(result.message ?? 'Erro ao sugerir distribuição');
        return;
      }
      toast.success(`Sugestão de distribuição gerada: ${result.clientes_sugeridos ?? 0} cliente(s)`);
    },
    onError: (err) => {
      logger.error('[SugerirDistribuicao]', err);
      toast.error(parseApiError(err, 'Erro ao sugerir distribuição'));
    },
  });
}

export function useAplicarOnda() {
  const qc = useQueryClient();
  const { data: appUserId } = useAppUserId();

  return useMutation({
    mutationFn: async ({ onda, modo }: { onda: number; modo: ExecucaoModo }): Promise<RodizioAplicarOndaResult> =>
      callRodizioRpc<RodizioAplicarOndaResult>('rodizio_aplicar_onda', {
        p_onda: onda,
        p_modo: modo,
        p_executado_por_id: appUserId ?? null,
      }),
    onSuccess: (result, vars) => {
      qc.invalidateQueries({ queryKey: [...STAGING_KEY_BASE, vars.onda] });
      qc.invalidateQueries({ queryKey: EXECUCOES_KEY });
      qc.invalidateQueries({ queryKey: ['rodizio-equipe'] });
      qc.invalidateQueries({ queryKey: ['rodizio-kpis'] });
      if (result.status !== 'success') {
        toast.error(result.message ?? 'Erro ao aplicar onda');
        return;
      }
      if (vars.modo === 'DRY_RUN') {
        toast.info(`Simulação: ${result.total_aplicados ?? 0} registros seriam aplicados`);
      } else {
        toast.success(`Onda aplicada: ${result.total_aplicados ?? 0} clientes rotacionados`);
        if (Array.isArray(result.erros) && result.erros.length > 0) {
          toast.error(`${result.erros.length} cliente(s) não foram aplicados — veja o histórico da execução`);
        }
      }
    },
    onError: (err) => {
      logger.error('[AplicarOnda]', err);
      toast.error(parseApiError(err, 'Erro ao aplicar onda'));
    },
  });
}

/* ─── Histórico de execuções (substitui Histórico/Auditoria como abas) ─── */

export function useRodizioExecucoes() {
  const { user } = useAuth();
  return useQuery({
    queryKey: [...EXECUCOES_KEY, user?.id],
    queryFn: async (): Promise<RodizioExecucao[]> => {
      if (!user) return [];
      const { data, error } = await supabase.from('vw_rodizio_execucoes')
        .select('*')
        .order('iniciado_em', { ascending: false })
        .limit(200);
      if (error) throw error;
      return (data ?? []).map(row => ({
        ...row,
        id: z.string().parse(row.id), iniciado_em: z.string().parse(row.iniciado_em),
        tipo: z.enum(['CLOSER', 'SDR', 'SEGMENTAR', 'DISTRIBUICAO_INICIAL']).parse(row.tipo),
        modo: z.enum(['DRY_RUN', 'REAL', 'ROLLBACK']).parse(row.modo),
        foi_revertida: z.boolean().parse(row.foi_revertida),
        parametros: z.record(z.unknown()).nullable().parse(row.parametros),
      }));
    },
    enabled: !!user,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });
}

export function useReverterExecucao() {
  const qc = useQueryClient();
  const { data: appUserId } = useAppUserId();

  return useMutation({
    mutationFn: async (execucaoId: string) =>
      callRodizioRpc<RodizioReverterResult>('rodizio_reverter_execucao', {
        p_execucao_id: execucaoId,
        p_revertido_por_id: appUserId ?? null,
      }),
    onSuccess: (result) => {
      qc.invalidateQueries({ queryKey: EXECUCOES_KEY });
      qc.invalidateQueries({ queryKey: STAGING_KEY_BASE });
      qc.invalidateQueries({ queryKey: ['rodizio-equipe'] });
      if (result.status !== 'success') {
        toast.error(result.message ?? 'Erro ao reverter execução');
        return;
      }
      toast.success(`Execução revertida: ${result.clientes_revertidos ?? 0} cliente(s)`);
    },
    onError: (err) => {
      logger.error('[ReverterExecucao]', err);
      toast.error(parseApiError(err, 'Erro ao reverter execução'));
    },
  });
}
