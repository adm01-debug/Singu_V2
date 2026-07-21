/**
 * Report Engine — motor de relatórios customizáveis.
 * Define entidades, campos disponíveis, operadores de filtro, agregações e
 * fornece executores que rodam a query no Supabase + agregam client-side.
 */
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

export type EntityKey = 'contacts' | 'companies' | 'interactions' | 'deals' | 'tickets';

export type FieldType = 'text' | 'number' | 'date' | 'enum' | 'boolean';

export interface ReportField {
  key: string;
  label: string;
  type: FieldType;
  /** Caminho real no Supabase (ex: "company.name") */
  selectPath?: string;
  enumValues?: string[];
}

export interface EntityDef {
  key: EntityKey;
  label: string;
  table: string;
  /** Select padrão (campos + relations) */
  defaultSelect: string;
  fields: ReportField[];
}

export const ENTITIES: Record<EntityKey, EntityDef> = {
  contacts: {
    key: 'contacts',
    label: 'Contatos',
    table: 'contacts',
    defaultSelect: '*, company:companies(name, industry, city, state)',
    fields: [
      { key: 'first_name', label: 'Nome', type: 'text' },
      { key: 'last_name', label: 'Sobrenome', type: 'text' },
      { key: 'email', label: 'Email', type: 'text' },
      { key: 'phone', label: 'Telefone', type: 'text' },
      { key: 'role_title', label: 'Cargo', type: 'text' },
      { key: 'sentiment', label: 'Sentimento', type: 'enum', enumValues: ['positive', 'neutral', 'negative'] },
      { key: 'relationship_score', label: 'Score Relacionamento', type: 'number' },
      { key: 'relationship_stage', label: 'Estágio', type: 'enum', enumValues: ['lead', 'prospect', 'customer', 'champion'] },
      { key: 'created_at', label: 'Criado em', type: 'date' },
      { key: 'updated_at', label: 'Atualizado em', type: 'date' },
      { key: 'company.name', label: 'Empresa', type: 'text' },
      { key: 'company.industry', label: 'Setor', type: 'text' },
      { key: 'company.city', label: 'Cidade', type: 'text' },
      { key: 'company.state', label: 'Estado', type: 'text' },
    ],
  },
  companies: {
    key: 'companies',
    label: 'Empresas',
    table: 'companies',
    defaultSelect: '*',
    fields: [
      { key: 'name', label: 'Nome', type: 'text' },
      { key: 'industry', label: 'Setor', type: 'text' },
      { key: 'city', label: 'Cidade', type: 'text' },
      { key: 'state', label: 'Estado', type: 'text' },
      { key: 'employee_count', label: 'Funcionários', type: 'text' },
      { key: 'annual_revenue', label: 'Receita Anual', type: 'text' },
      { key: 'is_customer', label: 'É Cliente', type: 'boolean' },
      { key: 'is_supplier', label: 'É Fornecedor', type: 'boolean' },
      { key: 'created_at', label: 'Criada em', type: 'date' },
    ],
  },
  interactions: {
    key: 'interactions',
    label: 'Interações',
    table: 'interactions',
    defaultSelect: '*, contact:contacts(first_name, last_name)',
    fields: [
      { key: 'title', label: 'Título', type: 'text' },
      { key: 'type', label: 'Tipo', type: 'enum', enumValues: ['email', 'call', 'meeting', 'whatsapp', 'note'] },
      { key: 'sentiment', label: 'Sentimento', type: 'enum', enumValues: ['positive', 'neutral', 'negative'] },
      { key: 'created_at', label: 'Data', type: 'date' },
      { key: 'contact.first_name', label: 'Contato (Nome)', type: 'text' },
      { key: 'contact.last_name', label: 'Contato (Sobrenome)', type: 'text' },
    ],
  },
  deals: {
    key: 'deals',
    label: 'Oportunidades',
    table: 'deals',
    defaultSelect: '*, contact:contacts(first_name, last_name), company:companies(name)',
    fields: [
      { key: 'title', label: 'Título', type: 'text' },
      { key: 'value', label: 'Valor', type: 'number' },
      { key: 'stage', label: 'Estágio', type: 'text' },
      { key: 'probability', label: 'Probabilidade', type: 'number' },
      { key: 'expected_close_date', label: 'Fechamento Esperado', type: 'date' },
      { key: 'created_at', label: 'Criado em', type: 'date' },
      { key: 'company.name', label: 'Empresa', type: 'text' },
    ],
  },
  tickets: {
    key: 'tickets',
    label: 'Tickets',
    table: 'support_tickets',
    defaultSelect: '*, contact:contacts(first_name, last_name)',
    fields: [
      { key: 'subject', label: 'Assunto', type: 'text' },
      { key: 'status', label: 'Status', type: 'enum', enumValues: ['open', 'in_progress', 'resolved', 'closed'] },
      { key: 'priority', label: 'Prioridade', type: 'enum', enumValues: ['low', 'medium', 'high', 'urgent'] },
      { key: 'created_at', label: 'Aberto em', type: 'date' },
      { key: 'resolved_at', label: 'Resolvido em', type: 'date' },
    ],
  },
};

export type FilterOperator =
  | 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte'
  | 'contains' | 'starts_with' | 'is_null' | 'is_not_null';

export interface ReportFilter {
  fieldKey: string;
  operator: FilterOperator;
  value?: string | number | boolean | null;
}

export type AggregationFn = 'count' | 'sum' | 'avg' | 'min' | 'max';

export interface ReportAggregation {
  fieldKey: string;
  fn: AggregationFn;
  label?: string;
}

export interface ReportConfig {
  id?: string;
  name: string;
  entity: EntityKey;
  fields: string[];
  filters: ReportFilter[];
  groupBy?: string;
  aggregations: ReportAggregation[];
  orderBy?: { field: string; direction: 'asc' | 'desc' };
  limit?: number;
}

/** Helper: lê valor aninhado por dot-path */
export function getValue(row: Record<string, unknown>, path: string): unknown {
  return path.split('.').reduce<unknown>((acc, k) => {
    if (acc && typeof acc === 'object' && k in (acc as Record<string, unknown>)) {
      return (acc as Record<string, unknown>)[k];
    }
    return undefined;
  }, row);
}

/** Aplica filtros client-side (após query base). */
export function applyFilters(rows: Record<string, unknown>[], filters: ReportFilter[]): Record<string, unknown>[] {
  return rows.filter(row =>
    filters.every(f => {
      const v = getValue(row, f.fieldKey);
      switch (f.operator) {
        case 'eq': return v == f.value;
        case 'neq': return v != f.value;
        case 'gt': return typeof v === 'number' && typeof f.value === 'number' && v > f.value;
        case 'gte': return typeof v === 'number' && typeof f.value === 'number' && v >= f.value;
        case 'lt': return typeof v === 'number' && typeof f.value === 'number' && v < f.value;
        case 'lte': return typeof v === 'number' && typeof f.value === 'number' && v <= f.value;
        case 'contains': return String(v ?? '').toLowerCase().includes(String(f.value ?? '').toLowerCase());
        case 'starts_with': return String(v ?? '').toLowerCase().startsWith(String(f.value ?? '').toLowerCase());
        case 'is_null': return v === null || v === undefined || v === '';
        case 'is_not_null': return v !== null && v !== undefined && v !== '';
        default: return true;
      }
    }),
  );
}

/** Calcula agregação para um conjunto de linhas. */
export function aggregate(rows: Record<string, unknown>[], agg: ReportAggregation): number {
  if (agg.fn === 'count') return rows.length;
  const nums = rows
    .map(r => Number(getValue(r, agg.fieldKey)))
    .filter(n => !Number.isNaN(n));
  if (nums.length === 0) return 0;
  switch (agg.fn) {
    case 'sum': return nums.reduce((a, b) => a + b, 0);
    case 'avg': return nums.reduce((a, b) => a + b, 0) / nums.length;
    case 'min': return Math.min(...nums);
    case 'max': return Math.max(...nums);
  }
}

export interface ReportResult {
  rows: Record<string, unknown>[];
  groups?: Array<{ key: string; rows: Record<string, unknown>[]; aggregations: Record<string, number> }>;
  totals: Record<string, number>;
}

export async function runReport(config: ReportConfig, userId: string): Promise<ReportResult> {
  const def = ENTITIES[config.entity];
  // Cast to valid DB table name — ENTITIES dict is constrained to known tables at definition.
  const query = supabase.from(def.table as keyof Database['public']['Tables']).select(def.defaultSelect).eq('user_id', userId)
  .limit(1000);

  if (config.orderBy) {
    query.order(config.orderBy.field, { ascending: config.orderBy.direction === 'asc' });
  }
  if (config.limit) query.limit(config.limit);

  const { data, error } = await query;
  if (error) throw error;

  const rawRows = (data || []) as unknown as Record<string, unknown>[];
  const filtered = applyFilters(rawRows, config.filters);

  // Totals (sem agrupamento)
  const totals: Record<string, number> = {};
  for (const a of config.aggregations) {
    totals[`${a.fn}:${a.fieldKey}`] = aggregate(filtered, a);
  }

  // Group-by
  let groups: ReportResult['groups'];
  if (config.groupBy) {
    const buckets = new Map<string, Record<string, unknown>[]>();
    for (const row of filtered) {
      const key = String(getValue(row, config.groupBy) ?? '—');
      const bucket = buckets.get(key) || [];
      bucket.push(row);
      buckets.set(key, bucket);
    }
    groups = Array.from(buckets.entries()).map(([key, rows]) => {
      const aggregations: Record<string, number> = {};
      for (const a of config.aggregations) {
        aggregations[`${a.fn}:${a.fieldKey}`] = aggregate(rows, a);
      }
      return { key, rows, aggregations };
    }).sort((a, b) => a.key.localeCompare(b.key));
  }

  return { rows: filtered, groups, totals };
}

/** Exporta resultado para CSV. */
export function exportToCsv(result: ReportResult, config: ReportConfig): string {
  const headers = config.fields;
  const lines = [headers.join(',')];
  for (const row of result.rows) {
    const cells = headers.map(h => {
      const v = getValue(row, h);
      const s = v === null || v === undefined ? '' : String(v);
      return `"${s.replace(/"/g, '""')}"`;
    });
    lines.push(cells.join(','));
  }
  return lines.join('\n');
}

export function downloadCsv(filename: string, csv: string) {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
