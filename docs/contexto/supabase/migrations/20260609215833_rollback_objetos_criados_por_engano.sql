-- ROLLBACK: remover objetos criados por engano neste projeto (pertencem ao promo-gifts-v4)
DROP FUNCTION IF EXISTS public.fn_spot_silver_enrich(uuid, text);
DROP FUNCTION IF EXISTS public.fn_spot_gold_enrich(uuid, text);
DROP TABLE IF EXISTS public.spot_typecode_map;
ALTER TABLE public.products DROP COLUMN IF EXISTS supplier_categories;
