import { quotePostgrestValue } from './tenant-guard.ts';

export function buildSearchFilter(term: string, columns: readonly string[], matchAllTerms = false): string {
  const normalized = term.trim().slice(0, 200);
  const terms = matchAllTerms ? normalized.split(/\s+/u) : [normalized];
  const filters = terms.map(word => {
    const value = quotePostgrestValue(`%${word}%`);
    return columns.map(column => `${column}.ilike.${value}`).join(',');
  });
  const conjunction = filters.map(filter => 'or(' + filter + ')').join(',');
  return filters.length === 1 ? filters[0] : `and(${conjunction})`;
}
