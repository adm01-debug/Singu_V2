import { quotePostgrestValue } from './tenant-guard.ts';

const MAX_SEARCH_TERMS = 10;

export class SearchFilterInputError extends Error {}

export function buildSearchFilter(term: string, columns: readonly string[], matchAllTerms = false): string {
  const normalized = term.trim().slice(0, 200);
  const terms = matchAllTerms ? normalized.split(/\s+/u) : [normalized];
  if (terms.length > MAX_SEARCH_TERMS) {
    throw new SearchFilterInputError('A busca composta aceita até 10 palavras.');
  }
  const filters = terms.map(word => {
    const value = quotePostgrestValue(`%${word}%`);
    return columns.map(column => `${column}.ilike.${value}`).join(',');
  });
  const conjunction = filters.map(filter => 'or(' + filter + ')').join(',');
  return filters.length === 1 ? filters[0] : `and(${conjunction})`;
}
