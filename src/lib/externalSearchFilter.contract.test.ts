import { describe, expect, it } from 'vitest';
import { buildSearchFilter } from '../../supabase/functions/_shared/search-filter';

describe('Busca composta pelo proxy externo', () => {
  it('preserva a busca legada por frase inteira', () => {
    expect(buildSearchFilter(' Maria Silva ', ['first_name', 'last_name']))
      .toBe('first_name.ilike."%Maria Silva%",last_name.ilike."%Maria Silva%"');
  });

  it('exige todas as palavras, aceitando partes distribuídas entre nome e sobrenome', () => {
    expect(buildSearchFilter(' Maria  Silva ', ['first_name', 'last_name'], true))
      .toBe('and(or(first_name.ilike."%Maria%",last_name.ilike."%Maria%"),or(first_name.ilike."%Silva%",last_name.ilike."%Silva%"))');
  });

  it('preserva nomes compostos e normaliza espaços, tabulação e quebra de linha', () => {
    expect(buildSearchFilter('Maria\tde\nSilva', ['first_name'], true))
      .toBe('and(or(first_name.ilike."%Maria%"),or(first_name.ilike."%de%"),or(first_name.ilike."%Silva%"))');
  });

  it('mantém pontuação e aspas no valor, sem ampliar a expressão do filtro', () => {
    expect(buildSearchFilter('Silva,user_id.neq.x', ['last_name'], true))
      .toBe('last_name.ilike."%Silva,user_id.neq.x%"');
    expect(buildSearchFilter('Maria"', ['first_name'], true))
      .toBe(String.raw`first_name.ilike."%Maria\"%"`);
  });
});
