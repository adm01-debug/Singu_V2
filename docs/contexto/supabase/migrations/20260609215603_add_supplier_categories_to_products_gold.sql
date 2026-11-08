-- MELHORIA 1: Coluna supplier_categories (catálogos comerciais SPOT) no Gold
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS supplier_categories jsonb;

COMMENT ON COLUMN public.products.supplier_categories IS 
'Catálogos comerciais do fornecedor (ex: ["SPOT","Our Nature","Stockout"]). Origem: campo Catalogs do OptionalsComplete (SPOT). Fluxo: Bronze raw_data → Prata (fn_spot_silver_enrich) → Gold (fn_spot_gold_enrich).';
