import { describe, expect, it } from 'vitest';
import {
  MAX_CANDIDATES_PER_CONTACT,
  MIN_CANDIDATES_PER_CONTACT,
  buildCatalog,
  buildFallbackOrder,
  buildKeywordIndex,
  candidatesFor,
  keywordsFrom,
  normalizeText,
  targetScoreForPrice,
  type ProductRow,
} from '../../supabase/functions/generate-offer-suggestions/catalog';

function product(overrides: Partial<ProductRow> & { name: string }): ProductRow {
  return {
    category: 'Brindes',
    unit_price: 100,
    stock_qty: 10,
    metadata: null,
    ...overrides,
  };
}

describe('normalizeText e keywordsFrom', () => {
  it('remove acento e caixa para o casamento entre nome de produto e conversa', () => {
    expect(normalizeText('Caneca Café PREMIUM')).toBe('caneca cafe premium');
    expect(keywordsFrom('Copo Térmico 500ml')).toContain('termico');
  });

  it('descarta palavras curtas que nao discriminam produto', () => {
    const tokens = keywordsFrom('de com kit cor caneca');
    expect(tokens).not.toContain('de');
    expect(tokens).not.toContain('kit');
    expect(tokens).toContain('caneca');
  });
});

describe('buildCatalog', () => {
  it('mapeia produto real e ignora linha sem nome', () => {
    const catalog = buildCatalog([
      product({ name: 'Caneca plástica PP 400ml', category: 'Bebidas', unit_price: 11.44 }),
      product({ name: '   ' }),
    ]);
    expect(catalog).toHaveLength(1);
    expect(catalog[0].name).toBe('Caneca plástica PP 400ml');
    expect(catalog[0].category).toBe('Bebidas');
  });

  it('usa categoria neutra quando o ERP nao informa categoria', () => {
    const catalog = buildCatalog([product({ name: 'Squeeze 500ml', category: null })]);
    expect(catalog[0].category).toBe('Outros');
  });

  it('aproveita target_audience/use_cases do ERP como palavra-chave', () => {
    const catalog = buildCatalog([
      product({
        name: 'Kit Corporativo',
        metadata: { target_audience: ['eventos corporativos'], use_cases: ['onboarding'] },
      }),
    ]);
    expect(catalog[0].keywords).toContain('corporativos');
    expect(catalog[0].keywords).toContain('onboarding');
  });

  it('escala a exigencia de relacionamento com o preco do produto', () => {
    expect(targetScoreForPrice(40)).toBe(45);
    expect(targetScoreForPrice(120)).toBe(55);
    expect(targetScoreForPrice(300)).toBe(65);
    expect(targetScoreForPrice(900)).toBe(75);
    expect(targetScoreForPrice(null)).toBe(55);
  });
});

describe('candidatesFor', () => {
  const products = [
    product({ name: 'Caneca Personalizada', metadata: { order_count: 900 } }),
    product({ name: 'Garrafa Térmica 500ml', metadata: { order_count: 5 } }),
    product({ name: 'Camiseta Polo', metadata: { order_count: 400 } }),
    product({ name: 'Pen Drive 8GB', metadata: { order_count: 300 } }),
    product({ name: 'Agenda Executiva', metadata: { order_count: 200 } }),
    product({ name: 'Squeeze 750ml', metadata: { order_count: 100 } }),
    product({ name: 'Chaveiro Metal', metadata: { order_count: 50 } }),
  ];
  const catalog = buildCatalog(products);
  const index = buildKeywordIndex(catalog);
  const fallback = buildFallbackOrder(products);

  it('prioriza o produto que casa com o contexto do contato', () => {
    const chosen = candidatesFor(normalizeText('quero uma garrafa termica para o time'), catalog, index, fallback);
    expect(chosen[0].name).toBe('Garrafa Térmica 500ml');
  });

  it('completa com os produtos de maior giro quando o contexto nao casa nada', () => {
    const chosen = candidatesFor(normalizeText('assunto sem relacao alguma'), catalog, index, fallback);
    expect(chosen).toHaveLength(MIN_CANDIDATES_PER_CONTACT);
    expect(chosen.map((item) => item.name)).toContain('Caneca Personalizada');
  });

  it('nunca devolve mais que o teto de candidatos por contato', () => {
    const many = Array.from({ length: 40 }, (_item, position) =>
      product({ name: `Caneca Modelo ${position}` }),
    );
    const bigCatalog = buildCatalog(many);
    const chosen = candidatesFor('caneca', bigCatalog, buildKeywordIndex(bigCatalog), buildFallbackOrder(many));
    expect(chosen.length).toBeLessThanOrEqual(MAX_CANDIDATES_PER_CONTACT);
  });
});

describe('buildFallbackOrder', () => {
  it('ordena por giro e ignora produto sem preco valido', () => {
    const rows = [
      product({ name: 'Sem preco', unit_price: null, metadata: { order_count: 9999 } }),
      product({ name: 'Gira muito', unit_price: 10, metadata: { order_count: 800 } }),
      product({ name: 'Gira pouco', unit_price: 10, metadata: { order_count: 1 } }),
    ];
    const order = buildFallbackOrder(rows);
    expect(order[0]).toBe(1);
    expect(order).not.toContain(0);
  });
});
