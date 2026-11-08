import { describe, expect, it } from 'vitest';
import { buildSearchFilter, SearchFilterInputError } from '../../supabase/functions/_shared/search-filter';

describe('Limites da busca composta', () => {
  it('rejeita palavras excedentes sem descartar parte da pesquisa', () => {
    const query = Array.from({ length: 11 }, (_, index) => `nome${index}`).join(' ');
    expect(() => buildSearchFilter(query, ['first_name'], true))
      .toThrow(SearchFilterInputError);
    expect(() => buildSearchFilter('a '.repeat(100), ['first_name'], true))
      .toThrow('A busca composta aceita até 10 palavras.');
  });

  it('aceita dez palavras e limita a expansão a cem predicados em dez colunas', () => {
    const query = Array.from({ length: 10 }, (_, index) => `nome${index}`).join(' ');
    const columns = Array.from({ length: 10 }, (_, index) => `coluna${index}`);
    const filter = buildSearchFilter(query, columns, true);
    expect(filter.match(/\.ilike\./gu)).toHaveLength(100);
    expect(filter).toContain('coluna9.ilike."%nome9%"');
  });

  it('preserva frases com mais palavras quando a busca composta não foi solicitada', () => {
    const query = 'a '.repeat(11).trim();
    expect(buildSearchFilter(query, ['first_name']))
      .toBe(`first_name.ilike."%${query}%"`);
  });
});
