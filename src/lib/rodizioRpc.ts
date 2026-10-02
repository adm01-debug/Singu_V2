/**
 * Helper para chamar as RPCs e views novas do Rodízio de Carteira (Bloco 3).
 *
 * As views `vw_rodizio_*`, a tabela `rodizio_distribuicao_staging` e as RPCs
 * `rodizio_*` ainda não estão no arquivo de tipos gerado
 * (`@/integrations/supabase/types`), pois a migration que as cria (PR #50)
 * ainda não foi mergeada — embora já esteja aplicada em produção. Por isso
 * usamos casts pontuais para `any` aqui, isolados neste helper, em vez de
 * espalhar `as any` pelos hooks. Quando os tipos forem regenerados
 * (`supabase gen types`), este helper pode ser removido e as chamadas podem
 * voltar a usar `supabase.rpc(...)` / `supabase.from(...)` tipados
 * diretamente.
 */
import { supabase } from '@/integrations/supabase/client';

/** Nome das views/tabelas novas do rodízio ainda não presentes nos tipos gerados. */
export type RodizioTable =
  | 'vw_rodizio_carga_closers'
  | 'vw_rodizio_carga_sdrs'
  | 'vw_rodizio_execucoes'
  | 'vw_rodizio_bloqueios'
  | 'vw_rodizio_kpis'
  | 'rodizio_distribuicao_staging';

/** Nome das RPCs novas do rodízio ainda não presentes nos tipos gerados. */
export type RodizioRpc =
  | 'rodizio_sugerir_distribuicao'
  | 'rodizio_aplicar_onda'
  | 'rodizio_bloquear_cliente'
  | 'rodizio_aprovar_bloqueio'
  | 'rodizio_reverter_execucao'
  | 'rodizio_closer_executar'
  | 'rodizio_sdr_executar';

/**
 * `supabase.from(...)` para views/tabelas do rodízio ainda fora dos tipos
 * gerados. Preserva o tipo de retorno do cliente e limita o cast ao nome
 * tipagem completa do `PostgrestQueryBuilder` aqui à mão, o que quebraria
 * assim que os tipos forem regenerados. Os hooks fazem `as unknown as T`
 * no retorno de `.select(...)` para recuperar tipagem no nível de uso.
 */
export function rodizioFrom(table: RodizioTable): ReturnType<typeof supabase.from> {
  return (
    supabase.from as unknown as (
      tableName: string,
    ) => ReturnType<typeof supabase.from>
  )(table);
}

/** `supabase.rpc(...)` para as RPCs do rodízio ainda fora dos tipos gerados. */
export async function callRodizioRpc<T = unknown>(
  fn: RodizioRpc,
  args?: Record<string, unknown>,
): Promise<T> {
  const { data, error } = await (
    supabase.rpc as unknown as (
      fn: string,
      args?: Record<string, unknown>,
    ) => Promise<{ data: T; error: { message: string } | null }>
  )(fn, args);
  if (error) throw new Error(error.message);
  return data;
}
