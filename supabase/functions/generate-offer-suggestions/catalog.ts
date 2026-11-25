// Catalogo de ofertas do motor de recomendacao.
//
// Antes desta mudanca o motor comparava o contato com 8 ofertas SaaS escritas
// no proprio codigo ("Upgrade para Plano Premium", "Licencas Adicionais"...),
// que a empresa nao vende. Agora o catalogo vem de public.products, o espelho
// do catalogo real do ERP Promo Gifts.
//
// O catalogo tem milhares de itens e cada contato so pode receber um punhado de
// ofertas, entao a selecao e feita por casamento de palavras-chave e limitada a
// MAX_CANDIDATES_PER_CONTACT itens por contato.

export interface CatalogItem {
  name: string;
  category: string;
  targetScore: number;
  keywords: string[];
}

export interface ProductRow {
  name: string | null;
  category: string | null;
  unit_price: number | null;
  stock_qty: number | null;
  metadata?: Record<string, unknown> | null;
}

export const MAX_CANDIDATES_PER_CONTACT = 12;
export const MIN_CANDIDATES_PER_CONTACT = 6;

const MIN_KEYWORD_LENGTH = 4;
const MAX_CONTEXT_TOKENS = 500;
const FALLBACK_CATEGORY = 'Outros';
const METADATA_KEYWORD_FIELDS = ['target_audience', 'use_cases', 'key_benefits'];

/** Remove acentos e caixa para que "Cafe" e "café" casem entre si. */
export function normalizeText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

/** Palavras com menos de 4 letras ("de", "kit", "cor") nao discriminam produto. */
export function keywordsFrom(text: string | null | undefined): string[] {
  if (!text) return [];
  return normalizeText(text)
    .split(/[^a-z0-9]+/)
    .filter((token) => token.length >= MIN_KEYWORD_LENGTH);
}

/** Item caro e oferta premium: so vai para contato com relacionamento forte. */
export function targetScoreForPrice(price: number | null): number {
  if (price === null) return 55;
  if (price <= 50) return 45;
  if (price <= 150) return 55;
  if (price <= 400) return 65;
  return 75;
}

function metadataStrings(metadata: Record<string, unknown> | null | undefined): string[] {
  if (!metadata) return [];
  const out: string[] = [];
  for (const key of METADATA_KEYWORD_FIELDS) {
    const value = metadata[key];
    if (Array.isArray(value)) {
      for (const entry of value) {
        if (typeof entry === 'string') out.push(entry);
      }
    } else if (typeof value === 'string') {
      out.push(value);
    }
  }
  return out;
}

function metadataOrderCount(metadata: Record<string, unknown> | null | undefined): number {
  const raw = metadata?.order_count;
  const parsed = typeof raw === 'number' ? raw : Number(raw ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function buildCatalog(products: ProductRow[]): CatalogItem[] {
  const catalog: CatalogItem[] = [];
  for (const product of products) {
    const name = (product.name ?? '').trim();
    if (!name) continue;
    const category = (product.category ?? '').trim();
    const keywords = new Set([
      ...keywordsFrom(name),
      ...keywordsFrom(category),
      ...keywordsFrom(metadataStrings(product.metadata).join(' ')),
    ]);
    catalog.push({
      name,
      category: category || FALLBACK_CATEGORY,
      targetScore: targetScoreForPrice(product.unit_price),
      keywords: [...keywords],
    });
  }
  return catalog;
}

export function buildKeywordIndex(catalog: CatalogItem[]): Map<string, number[]> {
  const index = new Map<string, number[]>();
  catalog.forEach((item, position) => {
    for (const keyword of item.keywords) {
      const positions = index.get(keyword);
      if (positions) positions.push(position);
      else index.set(keyword, [position]);
    }
  });
  return index;
}

/**
 * Recheio usado quando o contexto do contato nao casa com produto nenhum:
 * prioriza o que mais saiu, depois o que tem estoque e e mais barato.
 */
export function buildFallbackOrder(products: ProductRow[]): number[] {
  return products
    .map((product, position) => ({
      position,
      orders: metadataOrderCount(product.metadata),
      stock: product.stock_qty ?? 0,
      price: product.unit_price,
    }))
    .filter((row): row is { position: number; orders: number; stock: number; price: number } =>
      typeof row.price === 'number' && row.price > 0,
    )
    .sort((a, b) => b.orders - a.orders || b.stock - a.stock || a.price - b.price)
    .slice(0, MAX_CANDIDATES_PER_CONTACT * 2)
    .map((row) => row.position);
}

/**
 * Escolhe os produtos que fazem sentido para um contato a partir do contexto
 * dele (interacoes, interesses, topicos recorrentes).
 */
export function candidatesFor(
  context: string,
  catalog: CatalogItem[],
  keywordIndex: Map<string, number[]>,
  fallbackOrder: number[],
): CatalogItem[] {
  const tokens = [...new Set(keywordsFrom(context))].slice(0, MAX_CONTEXT_TOKENS);
  const hits = new Map<number, number>();
  for (const token of tokens) {
    const positions = keywordIndex.get(token);
    if (!positions) continue;
    for (const position of positions) hits.set(position, (hits.get(position) ?? 0) + 1);
  }

  const chosen = [...hits.entries()]
    .sort((a, b) => b[1] - a[1] || a[0] - b[0])
    .slice(0, MAX_CANDIDATES_PER_CONTACT)
    .map(([position]) => position);

  if (chosen.length < MIN_CANDIDATES_PER_CONTACT) {
    const taken = new Set(chosen);
    for (const position of fallbackOrder) {
      if (chosen.length >= MIN_CANDIDATES_PER_CONTACT) break;
      if (taken.has(position)) continue;
      taken.add(position);
      chosen.push(position);
    }
  }

  return chosen.map((position) => catalog[position]);
}
