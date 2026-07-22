/**
 * Auditoria exaustiva: Filtros de empresas, paginação e listas salvas
 * Cobre edge cases de boolean null, paginação multi-batch, deduplicação, 
 * lookup fallback, e preset CRUD
 */
import { describe, it, expect } from 'vitest';

// ══════════════════════════════════════════════════════════════
// SECTION 1: BOOLEAN FILTER EDGE CASES
// ══════════════════════════════════════════════════════════════

interface MockCompany {
  id: string;
  name: string;
  is_customer: boolean | null;
  is_supplier: boolean | null;
  is_carrier: boolean | null;
  is_matriz: boolean | null;
  status: string | null;
  ramo_atividade: string | null;
  grupo_economico: string | null;
  financial_health: string | null;
  state: string | null;
  city: string | null;
}

const BOOLEAN_FIELDS = ['is_customer', 'is_supplier', 'is_carrier', 'is_matriz'];

function applyFilters(
  companies: MockCompany[],
  activeFilters: Record<string, string[]>
): MockCompany[] {
  return companies.filter(company => {
    for (const [key, values] of Object.entries(activeFilters)) {
      if (values.length === 0) continue;

      const companyValue = company[key as keyof MockCompany];

      // Boolean fields: null/undefined treated as 'false'
      if (BOOLEAN_FIELDS.includes(key)) {
        const boolStr = String(companyValue ?? false);
        if (!values.includes(boolStr)) return false;
        continue;
      }

      if (typeof companyValue === 'boolean') {
        if (!values.includes(String(companyValue))) return false;
        continue;
      }

      if (companyValue === null || companyValue === undefined || companyValue === '') {
        return false;
      }

      if (!values.includes(String(companyValue))) return false;
    }
    return true;
  });
}

const testCompanies: MockCompany[] = [
  { id: '1', name: 'Matriz SA', is_customer: true, is_supplier: false, is_carrier: false, is_matriz: true, status: 'ativo', ramo_atividade: 'Agro', grupo_economico: 'Grupo A', financial_health: 'good', state: 'SP', city: 'São Paulo' },
  { id: '2', name: 'Filial Ltd', is_customer: true, is_supplier: false, is_carrier: false, is_matriz: false, status: 'ativo', ramo_atividade: 'Tech', grupo_economico: 'Grupo A', financial_health: 'excellent', state: 'RJ', city: 'Rio' },
  { id: '3', name: 'PAC Castilho', is_customer: false, is_supplier: true, is_carrier: false, is_matriz: null, status: 'inativo', ramo_atividade: 'Agro', grupo_economico: null, financial_health: null, state: 'SP', city: null },
  { id: '4', name: 'Transportadora XYZ', is_customer: false, is_supplier: false, is_carrier: true, is_matriz: null, status: 'ativo', ramo_atividade: null, grupo_economico: null, financial_health: 'unknown', state: null, city: null },
  { id: '5', name: 'Nova Empresa', is_customer: null, is_supplier: null, is_carrier: null, is_matriz: null, status: null, ramo_atividade: null, grupo_economico: null, financial_health: null, state: null, city: null },
];

describe('Company Filters — Boolean Fields', () => {
  it('is_customer=true filters only true customers', () => {
    const result = applyFilters(testCompanies, { is_customer: ['true'] });
    expect(result.map(c => c.id)).toEqual(['1', '2']);
  });

  it('is_customer=false includes null as false', () => {
    const result = applyFilters(testCompanies, { is_customer: ['false'] });
    expect(result.map(c => c.id)).toEqual(['3', '4', '5']);
  });

  it('is_matriz=true filters only explicit true', () => {
    const result = applyFilters(testCompanies, { is_matriz: ['true'] });
    expect(result.map(c => c.id)).toEqual(['1']);
  });

  it('is_matriz=false includes null as false (filial or unset)', () => {
    const result = applyFilters(testCompanies, { is_matriz: ['false'] });
    expect(result.map(c => c.id)).toEqual(['2', '3', '4', '5']);
  });

  it('is_carrier=true filters only carriers', () => {
    const result = applyFilters(testCompanies, { is_carrier: ['true'] });
    expect(result.map(c => c.id)).toEqual(['4']);
  });

  it('is_carrier=false includes null as false', () => {
    const result = applyFilters(testCompanies, { is_carrier: ['false'] });
    expect(result.map(c => c.id)).toEqual(['1', '2', '3', '5']);
  });

  it('is_supplier=true filters suppliers', () => {
    const result = applyFilters(testCompanies, { is_supplier: ['true'] });
    expect(result.map(c => c.id)).toEqual(['3']);
  });

  it('is_supplier=false includes null as false', () => {
    const result = applyFilters(testCompanies, { is_supplier: ['false'] });
    expect(result.map(c => c.id)).toEqual(['1', '2', '4', '5']);
  });
});

describe('Company Filters — String Fields', () => {
  it('status=ativo filters correctly', () => {
    const result = applyFilters(testCompanies, { status: ['ativo'] });
    expect(result.map(c => c.id)).toEqual(['1', '2', '4']);
  });

  it('status=inativo includes only inactive', () => {
    const result = applyFilters(testCompanies, { status: ['inativo'] });
    expect(result.map(c => c.id)).toEqual(['3']);
  });

  it('null status excluded from any string filter', () => {
    const result = applyFilters(testCompanies, { status: ['ativo', 'inativo'] });
    expect(result.map(c => c.id)).not.toContain('5');
  });

  it('ramo_atividade=Agro filters multi-select', () => {
    const result = applyFilters(testCompanies, { ramo_atividade: ['Agro'] });
    expect(result.map(c => c.id)).toEqual(['1', '3']);
  });

  it('multiple ramo_atividade values work with OR', () => {
    const result = applyFilters(testCompanies, { ramo_atividade: ['Agro', 'Tech'] });
    expect(result.map(c => c.id)).toEqual(['1', '2', '3']);
  });

  it('grupo_economico=Grupo A', () => {
    const result = applyFilters(testCompanies, { grupo_economico: ['Grupo A'] });
    expect(result.map(c => c.id)).toEqual(['1', '2']);
  });

  it('null grupo_economico excluded from filter', () => {
    const result = applyFilters(testCompanies, { grupo_economico: ['Grupo A'] });
    expect(result).not.toContainEqual(expect.objectContaining({ id: '3' }));
  });

  it('state=SP', () => {
    const result = applyFilters(testCompanies, { state: ['SP'] });
    expect(result.map(c => c.id)).toEqual(['1', '3']);
  });

  it('null state excluded', () => {
    const result = applyFilters(testCompanies, { state: ['SP'] });
    expect(result).not.toContainEqual(expect.objectContaining({ id: '4' }));
  });
});

describe('Company Filters — Combined Filters', () => {
  it('is_customer + ramo_atividade', () => {
    const result = applyFilters(testCompanies, {
      is_customer: ['true'],
      ramo_atividade: ['Agro'],
    });
    expect(result.map(c => c.id)).toEqual(['1']);
  });

  it('is_customer + status + state', () => {
    const result = applyFilters(testCompanies, {
      is_customer: ['true'],
      status: ['ativo'],
      state: ['SP'],
    });
    expect(result.map(c => c.id)).toEqual(['1']);
  });

  it('is_matriz + grupo_economico', () => {
    const result = applyFilters(testCompanies, {
      is_matriz: ['true'],
      grupo_economico: ['Grupo A'],
    });
    expect(result.map(c => c.id)).toEqual(['1']);
  });

  it('empty filter returns all', () => {
    const result = applyFilters(testCompanies, {});
    expect(result.length).toBe(5);
  });

  it('filter with empty values array returns all', () => {
    const result = applyFilters(testCompanies, { is_customer: [] });
    expect(result.length).toBe(5);
  });

  it('all companies with null fields excluded from strict string filters', () => {
    const result = applyFilters(testCompanies, { financial_health: ['good', 'excellent'] });
    expect(result.map(c => c.id)).toEqual(['1', '2']);
  });
});

// ══════════════════════════════════════════════════════════════
// SECTION 2: DEDUPLICATION LOGIC
// ══════════════════════════════════════════════════════════════

describe('Company Deduplication', () => {
  interface Row { id?: string; nome_crm?: string }

  function dedup(rows: Row[]): Row[] {
    const seen = new Set<string>();
    return rows.filter(row => {
      if (!row.id) return false;
      if (seen.has(row.id)) return false;
      seen.add(row.id);
      return true;
    });
  }

  it('removes duplicates by id', () => {
    const rows: Row[] = [
      { id: 'a', nome_crm: 'X' },
      { id: 'b', nome_crm: 'Y' },
      { id: 'a', nome_crm: 'X copy' },
    ];
    expect(dedup(rows).length).toBe(2);
    expect(dedup(rows).map(r => r.id)).toEqual(['a', 'b']);
  });

  it('removes rows without id', () => {
    const rows: Row[] = [
      { id: 'a', nome_crm: 'X' },
      { nome_crm: 'No ID' },
    ];
    expect(dedup(rows).length).toBe(1);
  });

  it('handles empty array', () => {
    expect(dedup([]).length).toBe(0);
  });

  it('handles all duplicates', () => {
    const rows: Row[] = [
      { id: 'a', nome_crm: 'X' },
      { id: 'a', nome_crm: 'X' },
      { id: 'a', nome_crm: 'X' },
    ];
    expect(dedup(rows).length).toBe(1);
  });

  it('preserves order (first occurrence wins)', () => {
    const rows: Row[] = [
      { id: 'c', nome_crm: 'Third' },
      { id: 'a', nome_crm: 'First' },
      { id: 'b', nome_crm: 'Second' },
      { id: 'a', nome_crm: 'First dup' },
    ];
    const result = dedup(rows);
    expect(result.map(r => r.id)).toEqual(['c', 'a', 'b']);
    expect(result[1].nome_crm).toBe('First');
  });
});

// ══════════════════════════════════════════════════════════════
// SECTION 3: PAGINATION RANGE CALCULATION
// ══════════════════════════════════════════════════════════════

describe('Pagination Range Calculation', () => {
  const PAGE_SIZE = 100;
  const MAX_TOTAL = 2000;

  function calcRanges(totalCount: number, firstBatchSize: number) {
    const cappedTotal = Math.min(totalCount, MAX_TOTAL);
    const ranges: Array<{ from: number; to: number }> = [];
    for (let from = firstBatchSize; from < cappedTotal; from += PAGE_SIZE) {
      ranges.push({
        from,
        to: Math.min(from + PAGE_SIZE - 1, cappedTotal - 1),
      });
    }
    return ranges;
  }

  it('returns no ranges when total <= first batch', () => {
    expect(calcRanges(50, 50)).toEqual([]);
    expect(calcRanges(100, 100)).toEqual([]);
  });

  it('returns 1 range for 150 total', () => {
    const ranges = calcRanges(150, 100);
    expect(ranges.length).toBe(1);
    expect(ranges[0]).toEqual({ from: 100, to: 149 });
  });

  it('returns 9 ranges for 1000 total', () => {
    const ranges = calcRanges(1000, 100);
    expect(ranges.length).toBe(9);
    expect(ranges[0]).toEqual({ from: 100, to: 199 });
    expect(ranges[8]).toEqual({ from: 900, to: 999 });
  });

  it('caps at MAX_TOTAL (2000)', () => {
    const ranges = calcRanges(10000, 100);
    expect(ranges.length).toBe(19);
    const lastRange = ranges[ranges.length - 1];
    expect(lastRange.to).toBe(1999);
  });

  it('handles exact multiples of PAGE_SIZE', () => {
    const ranges = calcRanges(300, 100);
    expect(ranges.length).toBe(2);
    expect(ranges[1]).toEqual({ from: 200, to: 299 });
  });

  it('handles 0 total', () => {
    expect(calcRanges(0, 0)).toEqual([]);
  });
});

// ══════════════════════════════════════════════════════════════
// SECTION 4: LOOKUP OPTIONS BUILDER
// ══════════════════════════════════════════════════════════════

describe('Lookup Options Builder', () => {
  interface FilterOption { value: string; label: string }

  function normalizeLookupValues(values?: string[]): string[] {
    return Array.from(
      new Set(
        (values || [])
          .map(v => v?.trim())
          .filter((v): v is string => Boolean(v))
      )
    )
      .sort((a, b) => a.localeCompare(b, 'pt-BR', { sensitivity: 'base' }))
      .slice(0, 60);
  }

  function buildLookupOptions(
    values: string[] | undefined,
    fallback: FilterOption[] = [],
    labels: Record<string, string> = {}
  ): FilterOption[] {
    const normalizedValues = normalizeLookupValues(values);
    const fallbackMap = new Map(fallback.map(o => [o.value, o]));
    const mergedFallback = fallback.map(o => ({
      ...o,
      label: labels[o.value] || o.label,
    }));
    const dynamicOptions = normalizedValues
      .filter(v => !fallbackMap.has(v))
      .map(v => ({ value: v, label: labels[v] || v }));
    return [...mergedFallback, ...dynamicOptions];
  }

  it('returns fallback when no values provided', () => {
    const fb = [{ value: 'a', label: 'A' }];
    expect(buildLookupOptions(undefined, fb)).toEqual(fb);
  });

  it('returns fallback when values is empty', () => {
    const fb = [{ value: 'a', label: 'A' }];
    expect(buildLookupOptions([], fb)).toEqual(fb);
  });

  it('merges fallback with dynamic values', () => {
    const fb = [{ value: 'ativo', label: 'Ativo' }];
    const result = buildLookupOptions(['ativo', 'novo'], fb);
    expect(result.length).toBe(2);
    expect(result[0].value).toBe('ativo');
    expect(result[1].value).toBe('novo');
  });

  it('applies labels to dynamic values', () => {
    const labels = { 'ATIVA': 'Ativa', 'BAIXADA': 'Baixada' };
    const result = buildLookupOptions(['ATIVA', 'BAIXADA'], [], labels);
    expect(result[0].label).toBe('Ativa');
    expect(result[1].label).toBe('Baixada');
  });

  it('deduplicates values', () => {
    const result = buildLookupOptions(['a', 'a', 'b', 'b']);
    expect(result.length).toBe(2);
  });

  it('trims whitespace', () => {
    const result = buildLookupOptions(['  hello  ', 'hello']);
    expect(result.length).toBe(1);
    expect(result[0].value).toBe('hello');
  });

  it('filters out empty strings and nullish', () => {
    const result = buildLookupOptions(['', '  ', 'valid']);
    expect(result.length).toBe(1);
    expect(result[0].value).toBe('valid');
  });

  it('caps at 60 options', () => {
    const values = Array.from({ length: 100 }, (_, i) => `opt_${String(i).padStart(3, '0')}`);
    const result = buildLookupOptions(values);
    expect(result.length).toBe(60);
  });

  it('sorts by pt-BR locale', () => {
    const result = buildLookupOptions(['Óleo', 'Abacaxi', 'Zebra']);
    expect(result[0].value).toBe('Abacaxi');
  });
});

// ══════════════════════════════════════════════════════════════
// SECTION 5: SEARCH PRESETS CRUD
// ══════════════════════════════════════════════════════════════

describe('Search Presets for Companies', () => {
  interface Preset {
    id: string;
    name: string;
    filters: Record<string, string[]>;
    sortBy: string;
    sortOrder: 'asc' | 'desc';
    searchTerm?: string;
  }

  function savePreset(presets: Preset[], data: Omit<Preset, 'id'>): Preset[] {
    const newPreset: Preset = { ...data, id: `p-${presets.length}` };
    return [newPreset, ...presets].slice(0, 10);
  }

  it('saves a new preset', () => {
    const result = savePreset([], {
      name: 'Clientes SP',
      filters: { is_customer: ['true'], state: ['SP'] },
      sortBy: 'name',
      sortOrder: 'asc',
    });
    expect(result.length).toBe(1);
    expect(result[0].name).toBe('Clientes SP');
  });

  it('limits to 10 presets', () => {
    let presets: Preset[] = [];
    for (let i = 0; i < 15; i++) {
      presets = savePreset(presets, {
        name: `Preset ${i}`,
        filters: {},
        sortBy: 'name',
        sortOrder: 'asc',
      });
    }
    expect(presets.length).toBe(10);
  });

  it('preserves complex filter combinations', () => {
    const filters = {
      is_customer: ['true'],
      ramo_atividade: ['Agro', 'Tech'],
      grupo_economico: ['Grupo A'],
      is_matriz: ['true'],
      status: ['ativo'],
    };
    const result = savePreset([], {
      name: 'Complex List',
      filters,
      sortBy: 'ramo_atividade',
      sortOrder: 'desc',
      searchTerm: 'cooperativa',
    });
    expect(result[0].filters).toEqual(filters);
    expect(result[0].searchTerm).toBe('cooperativa');
  });

  it('applies preset to filter correctly', () => {
    const preset: Preset = {
      id: 'p-0',
      name: 'Transportadoras Ativas',
      filters: { is_carrier: ['true'], status: ['ativo'] },
      sortBy: 'name',
      sortOrder: 'asc',
    };
    const result = applyFilters(testCompanies, preset.filters);
    expect(result.map(c => c.id)).toEqual(['4']);
  });

  it('applies preset with all-null company gracefully', () => {
    const preset: Preset = {
      id: 'p-1',
      name: 'Prospects',
      filters: { is_customer: ['false'] },
      sortBy: 'name',
      sortOrder: 'asc',
    };
    const result = applyFilters(testCompanies, preset.filters);
    // id 3, 4, 5 — all non-customers (including null)
    expect(result.map(c => c.id)).toEqual(['3', '4', '5']);
  });
});

// ══════════════════════════════════════════════════════════════
// SECTION 6: LOCATION EXTRACTION
// ══════════════════════════════════════════════════════════════

describe('Location Extraction from Name', () => {
  function extractLocation(name: string) {
    // eslint-disable-next-line sonarjs/super-linear-regex -- regex verified non-catastrophic (no nested ambiguous quantifiers / bounded)
    const slashMatch = name.match(/[-–—]\s*([^-–—/]+)\/([A-Z]{2})\s*$/);
    if (slashMatch) return { city: slashMatch[1].trim(), state: slashMatch[2] };
    const ufMatch = name.match(/[-–—]\s*([A-Z]{2})\s*$/);
    if (ufMatch) return { city: null, state: ufMatch[1] };
    return { city: null, state: null };
  }

  it('extracts City/UF pattern', () => {
    expect(extractLocation('PAC Castilho - SP - Castilho/SP')).toEqual({ city: 'Castilho', state: 'SP' });
  });

  it('extracts UF-only pattern', () => {
    expect(extractLocation('Lopestur - RJ')).toEqual({ city: null, state: 'RJ' });
  });

  it('handles no location info', () => {
    expect(extractLocation('Empresa ABC')).toEqual({ city: null, state: null });
  });

  it('handles em-dash', () => {
    expect(extractLocation('PAC — SP')).toEqual({ city: null, state: 'SP' });
  });

  it('handles en-dash', () => {
    expect(extractLocation('PAC – SP')).toEqual({ city: null, state: 'SP' });
  });

  it('handles complex multi-dash name', () => {
    expect(extractLocation('05 - PAC Xerém - RJ - Duque de Caxias/RJ')).toEqual({ city: 'Duque de Caxias', state: 'RJ' });
  });

  it('does not match lowercase state', () => {
    expect(extractLocation('Empresa - sp')).toEqual({ city: null, state: null });
  });

  it('handles trailing whitespace', () => {
    expect(extractLocation('PAC - MG  ')).toEqual({ city: null, state: 'MG' });
  });
});

// ══════════════════════════════════════════════════════════════
// SECTION 7: SORT EDGE CASES
// ══════════════════════════════════════════════════════════════

describe('Company Sorting', () => {
  function sortCompanies(
    companies: MockCompany[],
    sortBy: keyof MockCompany,
    sortOrder: 'asc' | 'desc'
  ): MockCompany[] {
    return [...companies].sort((a, b) => {
      let aVal = a[sortBy];
      let bVal = b[sortBy];
      if (aVal === null || aVal === undefined) aVal = '' as never;
      if (bVal === null || bVal === undefined) bVal = '' as never;
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        const comparison = aVal.localeCompare(bVal, 'pt-BR');
        return sortOrder === 'asc' ? comparison : -comparison;
      }
      return 0;
    });
  }

  it('sorts by name asc', () => {
    const result = sortCompanies(testCompanies, 'name', 'asc');
    expect(result[0].name).toBe('Filial Ltd');
  });

  it('sorts by name desc', () => {
    const result = sortCompanies(testCompanies, 'name', 'desc');
    expect(result[0].name).toBe('Transportadora XYZ');
  });

  it('nulls sort to beginning (empty string)', () => {
    const result = sortCompanies(testCompanies, 'ramo_atividade', 'asc');
    // nulls → '' → sort first
    expect(result[0].ramo_atividade).toBeNull();
  });

  it('sorts by grupo_economico with nulls', () => {
    const result = sortCompanies(testCompanies, 'grupo_economico', 'asc');
    const firstNonNull = result.find(c => c.grupo_economico !== null);
    expect(firstNonNull?.grupo_economico).toBe('Grupo A');
  });

  it('sorts by status', () => {
    const result = sortCompanies(testCompanies, 'status', 'asc');
    const statuses = result.map(c => c.status);
    // nulls first (empty), then 'ativo', then 'inativo'
    expect(statuses.filter(Boolean)).toEqual(['ativo', 'ativo', 'ativo', 'inativo']);
  });
});

// ══════════════════════════════════════════════════════════════
// SECTION 8: EDGE CASES & REGRESSION GUARDS
// ══════════════════════════════════════════════════════════════

describe('Edge Cases & Regressions', () => {
  it('filtering with non-existent key does not crash', () => {
    const result = applyFilters(testCompanies, { nonexistent_key: ['value'] } as Record<string, string[]>);
    // All excluded since key doesn't exist → undefined → treated as null → excluded
    expect(result.length).toBe(0);
  });

  it('empty companies array returns empty', () => {
    const result = applyFilters([], { is_customer: ['true'] });
    expect(result).toEqual([]);
  });

  it('multiple boolean filters combine as AND', () => {
    const result = applyFilters(testCompanies, {
      is_customer: ['true'],
      is_supplier: ['false'],
      is_carrier: ['false'],
    });
    expect(result.map(c => c.id)).toEqual(['1', '2']);
  });

  it('combining boolean + string filters is strict intersection', () => {
    const result = applyFilters(testCompanies, {
      is_customer: ['true'],
      financial_health: ['good'],
    });
    expect(result.map(c => c.id)).toEqual(['1']);
  });

  it('all-null company passes only boolean filters with false', () => {
    const allNull = testCompanies.filter(c => c.id === '5');
    
    // Boolean false includes null → passes
    expect(applyFilters(allNull, { is_customer: ['false'] }).length).toBe(1);
    
    // String filter → null excluded
    expect(applyFilters(allNull, { status: ['ativo'] }).length).toBe(0);
    
    // Combined → excluded by string
    expect(applyFilters(allNull, { is_customer: ['false'], status: ['ativo'] }).length).toBe(0);
  });
});