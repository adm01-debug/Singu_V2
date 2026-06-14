import { useMemo } from 'react';
import { Building2, Landmark, Package, Truck, Users } from 'lucide-react';
import type { FilterConfig, SortOption } from '@/components/filters/AdvancedFilters';
import { useExternalBatchLookup } from '@/hooks/useExternalLookup';

const MAX_LOOKUP_OPTIONS = 60;

 import { Brain, Target, Zap } from 'lucide-react';
 
const LOOKUP_COLUMNS = [
  'ramo_atividade',
  'nicho_cliente',
  'grupo_economico',
  'tipo_cooperativa',
  'natureza_juridica_desc',
  'status',
  'situacao_rf',
  'porte_rf',
  'financial_health',
  'employee_count',
] as const;

const statusFallback = [
  { value: 'ativo', label: 'Ativo' },
  { value: 'inativo', label: 'Inativo' },
  { value: 'suspenso', label: 'Suspenso' },
];

const situacaoRfFallback = [
  { value: 'ATIVA', label: 'Ativa' },
  { value: 'BAIXADA', label: 'Baixada' },
  { value: 'INAPTA', label: 'Inapta' },
  { value: 'SUSPENSA', label: 'Suspensa' },
  { value: 'NULA', label: 'Nula' },
];

const porteRfFallback = [
  { value: 'MEI', label: 'MEI' },
  { value: 'ME', label: 'ME - Microempresa' },
  { value: 'EPP', label: 'EPP - Pequeno Porte' },
  { value: 'MEDIO', label: 'Médio Porte' },
  { value: 'GRANDE', label: 'Grande Porte' },
  { value: 'DEMAIS', label: 'Demais' },
];

const financialHealthFallback = [
  { value: 'excellent', label: 'Excelente' },
  { value: 'good', label: 'Boa' },
  { value: 'growing', label: 'Em Crescimento' },
  { value: 'stable', label: 'Estável' },
  { value: 'average', label: 'Regular' },
  { value: 'cutting', label: 'Em Retração' },
  { value: 'poor', label: 'Ruim' },
  { value: 'unknown', label: 'Desconhecida' },
];

const employeeCountFallback = [
  { value: '1-10', label: '1-10' },
  { value: '11-50', label: '11-50' },
  { value: '51-100', label: '51-100' },
  { value: '101-500', label: '101-500' },
  { value: '500+', label: '500+' },
];

const healthLabels: Record<string, string> = {
  excellent: 'Excelente', good: 'Boa', growing: 'Em Crescimento',
  stable: 'Estável', average: 'Regular', cutting: 'Em Retração',
  poor: 'Ruim', unknown: 'Desconhecida',
};

const statusLabels: Record<string, string> = {
  ativo: 'Ativo', inativo: 'Inativo', suspenso: 'Suspenso',
};

const situacaoRfLabels: Record<string, string> = {
  ATIVA: 'Ativa', BAIXADA: 'Baixada', INAPTA: 'Inapta',
  SUSPENSA: 'Suspensa', NULA: 'Nula',
};

const porteRfLabels: Record<string, string> = {
  MEI: 'MEI', ME: 'ME - Microempresa', EPP: 'EPP - Pequeno Porte',
  MEDIO: 'Médio Porte', GRANDE: 'Grande Porte', DEMAIS: 'Demais',
};

function normalizeLookupValues(values?: string[]) {
  return Array.from(
    new Set(
      (values || [])
        .map((value) => value?.trim())
        .filter((value): value is string => Boolean(value))
    )
  )
    .sort((a, b) => a.localeCompare(b, 'pt-BR', { sensitivity: 'base' }))
    .slice(0, MAX_LOOKUP_OPTIONS);
}

function buildLookupOptions(
  values: string[] | undefined,
  fallback: FilterConfig['options'] = [],
  labels: Record<string, string> = {}
) {
  const normalizedValues = normalizeLookupValues(values);
  const fallbackMap = new Map(fallback.map((option) => [option.value, option]));

  const mergedFallback = fallback.map((option) => ({
    ...option,
    label: labels[option.value] || option.label,
  }));

  const dynamicOptions = normalizedValues
    .filter((value) => !fallbackMap.has(value))
    .map((value) => ({ value, label: labels[value] || value }));

  return [...mergedFallback, ...dynamicOptions];
}

export const companySortOptions: SortOption[] = [
  { value: 'updated_at', label: 'Última Atualização' },
  { value: 'name', label: 'Nome' },
  { value: 'status', label: 'Status' },
  { value: 'ramo_atividade', label: 'Ramo de Atividade' },
  { value: 'grupo_economico', label: 'Grupo Econômico' },
  { value: 'financial_health', label: 'Saúde Financeira' },
  { value: 'employee_count', label: 'Faixa de Funcionários' },
];

export function useCompanyFilterOptions(options?: { enabled?: boolean }) {
  const externalEnabled = options?.enabled ?? true;
  const { data: batchData = {} } = useExternalBatchLookup('companies', [...LOOKUP_COLUMNS], externalEnabled);

  return useMemo<FilterConfig[]>(() => {
    const v = (col: string) => batchData[col] || [];

    const filters: FilterConfig[] = [
      {
        key: 'is_customer',
        label: 'Tipo',
        multiple: false,
        options: [
          { value: 'true', label: 'Cliente', icon: Users },
          { value: 'false', label: 'Prospect', icon: Building2 },
        ],
      },
      {
        key: 'status',
        label: 'Status',
        multiple: true,
        options: buildLookupOptions(v('status'), statusFallback, statusLabels),
      },
      {
        key: 'ramo_atividade',
        label: 'Ramo',
        multiple: true,
        options: buildLookupOptions(v('ramo_atividade')),
      },
      {
        key: 'nicho_cliente',
        label: 'Nicho',
        multiple: true,
        options: buildLookupOptions(v('nicho_cliente')),
      },
      {
        key: 'grupo_economico',
        label: 'Grupo Econômico',
        multiple: true,
        options: buildLookupOptions(v('grupo_economico')),
      },
      {
        key: 'tipo_cooperativa',
        label: 'Cooperativa',
        multiple: true,
        options: buildLookupOptions(v('tipo_cooperativa')),
      },
      {
        key: 'natureza_juridica_desc',
        label: 'Natureza Jurídica',
        multiple: true,
        options: buildLookupOptions(v('natureza_juridica_desc')),
      },
      {
        key: 'situacao_rf',
        label: 'Situação RF',
        multiple: true,
        options: buildLookupOptions(v('situacao_rf'), situacaoRfFallback, situacaoRfLabels),
      },
      {
        key: 'porte_rf',
        label: 'Porte RF',
        multiple: true,
        options: buildLookupOptions(v('porte_rf'), porteRfFallback, porteRfLabels),
      },
      {
        key: 'financial_health',
        label: 'Saúde Financeira',
        multiple: true,
        options: buildLookupOptions(v('financial_health'), financialHealthFallback, healthLabels),
      },
      {
        key: 'employee_count',
        label: 'Funcionários',
        multiple: true,
        options: buildLookupOptions(v('employee_count'), employeeCountFallback),
      },
      {
        key: 'is_supplier',
        label: 'Fornecedor',
        multiple: false,
        options: [
          { value: 'true', label: 'Sim', icon: Package },
          { value: 'false', label: 'Não', icon: Package },
        ],
      },
      {
        key: 'is_carrier',
        label: 'Transportadora',
        multiple: false,
        options: [
          { value: 'true', label: 'Sim', icon: Truck },
          { value: 'false', label: 'Não', icon: Truck },
        ],
      },
       {
         key: 'is_matriz',
         label: 'Estrutura',
         multiple: false,
         options: [
           { value: 'true', label: 'Matriz', icon: Landmark },
           { value: 'false', label: 'Filial', icon: Building2 },
         ],
       },
       {
         key: 'vak_dominant',
         label: 'VAK Dominante',
         multiple: true,
         options: [
           { value: 'V', label: 'Visual' },
           { value: 'A', label: 'Auditivo' },
           { value: 'K', label: 'Cinestésico' },
           { value: 'D', label: 'Auditivo Digital' }
         ],
       },
       {
         key: 'motivation_direction',
         label: 'Motivação',
         multiple: true,
         options: [
           { value: 'toward', label: 'Em Direção A', icon: Target },
           { value: 'away_from', label: 'Afastar-se De', icon: Zap },
           { value: 'balanced', label: 'Equilibrado', icon: Brain }
         ],
       },
    ];

    return filters.filter((filter) => filter.options.length > 0);
  }, [batchData]);
}
