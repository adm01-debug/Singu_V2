-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20260609215603
-- nome:   add_supplier_categories_to_products_gold

-- MELHORIA 1: Coluna supplier_categories (catálogos comerciais SPOT) no Gold
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS supplier_categories jsonb;

COMMENT ON COLUMN public.products.supplier_categories IS 
'Catálogos comerciais do fornecedor (ex: ["SPOT","Our Nature","Stockout"]). Origem: campo Catalogs do OptionalsComplete (SPOT). Fluxo: Bronze raw_data → Prata (fn_spot_silver_enrich) → Gold (fn_spot_gold_enrich).';
