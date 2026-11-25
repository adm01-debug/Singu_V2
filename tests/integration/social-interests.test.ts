import { describe, expect, it } from 'vitest';
import {
  deriveInterests,
  deriveKeywords,
  mergeUnique,
  rankTokens,
  tokenize,
} from '../../supabase/functions/sync-social-interests/analysis';

describe('tokenize', () => {
  it('tira acento e caixa para a mesma palavra nao virar duas evidencias', () => {
    expect(tokenize('Caneca TÉRMICA')).toEqual(['caneca', 'termica']);
  });

  it('descarta palavra curta, numero solto e ruido de conversa', () => {
    const tokens = tokenize('Cliente pediu orcamento de 2 canecas para o time');
    expect(tokens).not.toContain('cliente');
    expect(tokens).not.toContain('orcamento');
    expect(tokens).not.toContain('para');
    expect(tokens).not.toContain('de');
    expect(tokens).toContain('canecas');
  });
});

describe('rankTokens', () => {
  it('conta em quantas interacoes o token aparece, nao quantas vezes repete', () => {
    const ranked = rankTokens([
      'caneca caneca caneca garrafa',
      'caneca squeeze',
      'garrafa squeeze',
    ]);
    const caneca = ranked.find((entry) => entry.token === 'caneca');
    expect(caneca?.hits).toBe(2);
  });
});

describe('deriveInterests', () => {
  it('so promove a interesse o que voltou em mais de uma conversa', () => {
    const interests = deriveInterests([
      'preciso de caneca personalizada',
      'voltando sobre a caneca e a garrafa',
      'garrafa tambem serve',
    ]);
    expect(interests).toContain('caneca');
    expect(interests).toContain('garrafa');
  });

  it('promove a interesse o que o contato repetiu no mesmo historico', () => {
    const interests = deriveInterests([
      'sobre a caneca: preciso da caneca em 300 unidades, a caneca com logo',
    ]);
    expect(interests).toContain('caneca');
  });

  it('nao promove termo que apareceu uma unica vez', () => {
    const interests = deriveInterests(['preciso de garrafa e mais nada']);
    expect(interests).not.toContain('garrafa');
  });

  it('nao inventa interesse quando o contato nao tem conversa', () => {
    expect(deriveInterests([])).toEqual([]);
  });
});

describe('deriveKeywords', () => {
  it('ordena por frequencia e respeita o limite', () => {
    const keywords = deriveKeywords(['caneca caneca garrafa squeeze'], 2);
    expect(keywords).toHaveLength(2);
    expect(keywords[0]).toBe('caneca');
  });
});

describe('mergeUnique', () => {
  it('nao repete o que ja existia, em qualquer caixa', () => {
    expect(mergeUnique(['Caneca', 'garrafa'], ['GARRAFA', 'squeeze'])).toEqual(['caneca', 'garrafa', 'squeeze']);
  });

  it('corta pelo mais recente quando passa do limite', () => {
    expect(mergeUnique(['antigo'], ['novo'], 1)).toEqual(['novo']);
  });

  it('sobrevive a analise anterior nula', () => {
    expect(mergeUnique(null, ['caneca'])).toEqual(['caneca']);
  });
});