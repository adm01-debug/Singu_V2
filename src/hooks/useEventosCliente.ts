import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { queryExternalData } from '@/lib/externalData';

export const TAMANHO_PAGINA = 25;

export const TIPOS_EVENTO = [
  { valor: 'TRANSFERENCIA', label: 'Transferência de carteira' },
  { valor: 'COMPRA', label: 'Compra' },
  { valor: 'PRIMEIRA_COMPRA', label: 'Primeira compra' },
  { valor: 'ATIVACAO', label: 'Ativação' },
  { valor: 'REATIVACAO', label: 'Reativação' },
  { valor: 'INATIVACAO', label: 'Inativação' },
  { valor: 'ATRIBUIDO_SDR', label: 'Atribuído a SDR' },
  { valor: 'QUALIFICADO_SDR', label: 'Qualificado pelo SDR' },
] as const;

export interface EventoClienteRow {
  id: string | null;
  company_id: string | null;
  customer_id: string | null;
  evento_tipo: string | null;
  data_evento: string | null;
  vendedor_nome: string | null;
  executado_por_nome: string | null;
  motivo: string | null;
  observacoes: string | null;
  dados_extras: Record<string, unknown> | null;
  empresa_nome: string | null;
  empresa_cnpj: string | null;
  created_at: string | null;
}

export function rotuloTipoEvento(tipo: string | null | undefined): string {
  if (!tipo) return '—';
  return TIPOS_EVENTO.find((item) => item.valor === tipo)?.label ?? tipo;
}

interface ParametrosEventos {
  pagina: number;
  busca: string;
  tipo: string;
}

export function useEventosCliente({ pagina, busca, tipo }: ParametrosEventos) {
  const termo = busca.trim();
  return useQuery({
    queryKey: ['eventos-cliente', pagina, termo, tipo],
    queryFn: async () => {
      const { data, count, error } = await queryExternalData<EventoClienteRow>({
        table: 'vw_timeline_cliente',
        select: '*',
        filters: tipo === 'todos' ? undefined : [{ type: 'eq', column: 'evento_tipo', value: tipo }],
        search: termo
          ? { term: termo, columns: ['empresa_nome', 'empresa_cnpj'], matchAllTerms: false }
          : undefined,
        order: [
          { column: 'data_evento', ascending: false },
          { column: 'id', ascending: true },
        ],
        range: { from: pagina * TAMANHO_PAGINA, to: pagina * TAMANHO_PAGINA + TAMANHO_PAGINA - 1 },
        countMethod: 'exact',
        auditAccess: false,
      });
      if (error) throw error;
      return { linhas: data ?? [], total: count ?? 0 };
    },
    placeholderData: keepPreviousData,
    staleTime: 60_000,
  });
}

const contarEventos = async (filtros?: Array<{ type: 'in'; column: string; value: string[] }>) => {
  const { count, error } = await queryExternalData<{ id: string }>({
    table: 'vw_timeline_cliente',
    select: 'id',
    filters: filtros,
    range: { from: 0, to: 0 },
    countMethod: 'exact',
    auditAccess: false,
  });
  if (error) throw error;
  return count ?? 0;
};

export function useResumoEventos() {
  return useQuery({
    queryKey: ['eventos-cliente-resumo'],
    queryFn: async () => {
      const [total, compras, transferencias, sdr] = await Promise.all([
        contarEventos(),
        contarEventos([{ type: 'in', column: 'evento_tipo', value: ['COMPRA', 'PRIMEIRA_COMPRA'] }]),
        contarEventos([{ type: 'in', column: 'evento_tipo', value: ['TRANSFERENCIA'] }]),
        contarEventos([{ type: 'in', column: 'evento_tipo', value: ['ATRIBUIDO_SDR', 'QUALIFICADO_SDR'] }]),
      ]);
      return { total, compras, transferencias, sdr };
    },
    staleTime: 5 * 60_000,
  });
}