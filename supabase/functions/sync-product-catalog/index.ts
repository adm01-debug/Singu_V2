// Espelha o catalogo de produtos do ERP Promo Gifts (doufsxqlfjyuvxuezpln)
// em public.products do Singu, que e a fonte usada pelo motor de ofertas
// (generate-offer-suggestions).
//
// O ERP e a fonte da verdade dos produtos; o Singu so replica. O upsert usa
// sku como chave natural (products_sku_key UNIQUE), entao rodar de novo
// atualiza preco/estoque sem duplicar.

import { createClient } from "npm:@supabase/supabase-js@2";
import {
  scopedCorsHeaders,
  requireCronSecretOrAuth,
  guardBody,
  jsonError,
  jsonOk,
} from "../_shared/auth.ts";
import { validate } from "../_shared/validate.ts";

const ERP_PAGE_SIZE = 500;
const UPSERT_CHUNK_SIZE = 200;
const ERP_MAX_PRODUCTS = 20_000;

const ERP_SELECT = [
  'id',
  'sku',
  'name',
  'description',
  'short_description',
  'ai_summary',
  'category_name',
  'sale_price',
  'cost_price',
  'stock_quantity',
  'is_deleted',
  'brand',
  'primary_image_url',
  'tags',
  'slug',
  'order_count',
  'is_bestseller',
  'is_new',
  'target_audience',
  'use_cases',
  'key_benefits',
].join(',');

type NumericValue = number | string | null;

interface ErpProduct {
  id: string;
  sku: string | null;
  name: string | null;
  description: string | null;
  short_description: string | null;
  ai_summary: string | null;
  category_name: string | null;
  sale_price: NumericValue;
  cost_price: NumericValue;
  stock_quantity: number | null;
  is_deleted: boolean | null;
  brand: string | null;
  primary_image_url: string | null;
  tags: unknown;
  slug: string | null;
  order_count: number | null;
  is_bestseller: boolean | null;
  is_new: boolean | null;
  target_audience: unknown;
  use_cases: unknown;
  key_benefits: unknown;
}

function toNumber(value: NumericValue): number | null {
  if (value === null || value === '') return null;
  const parsed = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function toSinguRow(product: ErpProduct) {
  const price = toNumber(product.sale_price);
  const cost = toNumber(product.cost_price);
  return {
    sku: product.sku,
    name: product.name,
    description: product.description ?? product.short_description ?? product.ai_summary ?? null,
    category: product.category_name ?? null,
    unit_price: price,
    cost_price: cost,
    stock_qty: product.stock_quantity ?? 0,
    is_active: product.is_deleted !== true,
    metadata: {
      erp_id: product.id,
      brand: product.brand,
      image_url: product.primary_image_url,
      slug: product.slug,
      tags: product.tags,
      target_audience: product.target_audience,
      use_cases: product.use_cases,
      key_benefits: product.key_benefits,
      order_count: product.order_count ?? 0,
      is_bestseller: product.is_bestseller ?? false,
      is_new: product.is_new ?? false,
      synced_at: new Date().toISOString(),
    },
  };
}

function trimTrailingSlashes(value: string): string {
  let end = value.length;
  while (end > 0 && value.charAt(end - 1) === '/') end -= 1;
  return value.slice(0, end);
}

Deno.serve(async (req) => {
  const cors = scopedCorsHeaders(req);
  if (req.method === 'OPTIONS') return new Response(null, { headers: cors });

  const guard = await requireCronSecretOrAuth(req);
  if (guard instanceof Response) return guard;

  const { body: rawBody, error: bodyError } = await guardBody(req, 8 * 1024);
  if (bodyError) return bodyError;

  const vgo = validate(rawBody ?? {}, {
    dryRun: { type: 'boolean' },
    maxProdutos: { type: 'number' },
  });
  if (!vgo.ok) return jsonError(vgo.error, 400, req);
  const { dryRun = false, maxProdutos } = vgo.data as { dryRun?: boolean; maxProdutos?: number };

  const rawErpUrl = Deno.env.get('ERP_SUPABASE_URL');
  const erpUrl = rawErpUrl ? trimTrailingSlashes(rawErpUrl) : undefined;
  const erpKey = Deno.env.get('ERP_SUPABASE_SERVICE_ROLE_KEY');
  if (!erpUrl || !erpKey) {
    return jsonError('ERP_SUPABASE_URL e ERP_SUPABASE_SERVICE_ROLE_KEY precisam estar configurados', 503, req);
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  const hardLimit = Math.min(maxProdutos ?? ERP_MAX_PRODUCTS, ERP_MAX_PRODUCTS);
  const startedAt = Date.now();

  try {
    let fetched = 0;
    let upserted = 0;
    let skipped = 0;
    let pages = 0;

    for (let offset = 0; offset < hardLimit; offset += ERP_PAGE_SIZE) {
      const query = [
        `select=${encodeURIComponent(ERP_SELECT)}`,
        'is_active=eq.true',
        'sku=not.is.null',
        'order=sku.asc',
        `limit=${ERP_PAGE_SIZE}`,
        `offset=${offset}`,
      ].join('&');
      const response = await fetch(`${erpUrl}/rest/v1/products?${query}`, {
        headers: {
          apikey: erpKey,
          Authorization: `Bearer ${erpKey}`,
          Accept: 'application/json',
        },
      });
      if (!response.ok) {
        const detail = await response.text();
        throw new Error(`ERP respondeu ${response.status}: ${detail.slice(0, 300)}`);
      }

      const page = await response.json();
      if (!Array.isArray(page) || page.length === 0) break;
      pages += 1;
      fetched += page.length;

      const rows = [];
      for (const product of page as ErpProduct[]) {
        if (!product.sku || !product.name) {
          skipped += 1;
          continue;
        }
        rows.push(toSinguRow(product));
      }

      if (!dryRun) {
        for (let index = 0; index < rows.length; index += UPSERT_CHUNK_SIZE) {
          const chunk = rows.slice(index, index + UPSERT_CHUNK_SIZE);
          const { error } = await supabase.from('products').upsert(chunk, { onConflict: 'sku' });
          if (error) throw new Error(`Upsert falhou: ${error.message}`);
          upserted += chunk.length;
        }
      }

      if (page.length < ERP_PAGE_SIZE) break;
    }

    return jsonOk({
      success: true,
      dryRun,
      pages,
      fetched,
      upserted,
      skipped,
      durationMs: Date.now() - startedAt,
    }, req);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'erro desconhecido';
    console.error('sync-product-catalog error:', message);
    return jsonError(message, 502, req);
  }
});
