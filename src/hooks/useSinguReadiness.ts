import { useQuery } from '@tanstack/react-query';
import { queryExternalData } from '@/lib/externalData';
import type { Database } from '@/integrations/supabase/types';

export type ReadinessRow = Database['public']['Views']['vw_singu_readiness']['Row'];

export interface ReadinessResumo {
  total: number;
  comDados: number;
  vazias: number;
  registros: number;
  percentual: number;
}

const STATUS_COM_DADOS = 'OK';

/**
 * `vw_singu_readiness` devolve uma linha por tabela monitorada pelo sistema, com a
 * contagem real e o status: `OK` quando há registros, `PRONTO (vazio ...)` quando a
 * estrutura existe mas ninguém alimentou. Serve para enxergar módulos que parecem
 * prontos na UI mas estão sem dados.
 */
export function resumirReadiness(rows: ReadinessRow[]): ReadinessResumo {
  return rows.reduce<ReadinessResumo>(
    (acc, row) => {
      const registros = Number(row.registros ?? 0);
      acc.total += 1;
      acc.registros += registros;
      if ((row.status ?? '').startsWith(STATUS_COM_DADOS)) acc.comDados += 1;
      else acc.vazias += 1;
      acc.percentual = acc.total > 0 ? Math.round((acc.comDados / acc.total) * 100) : 0;
      return acc;
    },
    { total: 0, comDados: 0, vazias: 0, registros: 0, percentual: 0 },
  );
}

export function useSinguReadiness() {
  return useQuery({
    queryKey: ['vw-singu-readiness'],
    queryFn: async () => {
      const { data, error } = await queryExternalData<ReadinessRow>({
        table: 'vw_singu_readiness',
        select: 'tabela,registros,status',
        order: { column: 'registros', ascending: false },
        auditAccess: false,
      });
      if (error) throw error;
      return data ?? [];
    },
    staleTime: 5 * 60 * 1000,
  });
}