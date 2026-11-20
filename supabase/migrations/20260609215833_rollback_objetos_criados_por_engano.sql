-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20260609215833
-- nome:   rollback_objetos_criados_por_engano

-- ROLLBACK: remover objetos criados por engano neste projeto (pertencem ao promo-gifts-v4)
DROP FUNCTION IF EXISTS public.fn_spot_silver_enrich(uuid, text);
DROP FUNCTION IF EXISTS public.fn_spot_gold_enrich(uuid, text);
DROP TABLE IF EXISTS public.spot_typecode_map;
ALTER TABLE public.products DROP COLUMN IF EXISTS supplier_categories;
