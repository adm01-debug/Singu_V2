-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20260611130914
-- nome:   fix_product_novelties_source_constraint_and_populate

-- Ampliar constraint de source para cobrir todos os casos reais
ALTER TABLE public.product_novelties
DROP CONSTRAINT IF EXISTS chk_pn_source;

ALTER TABLE public.product_novelties
ADD CONSTRAINT chk_pn_source CHECK (source = ANY (ARRAY[
    'manual',
    'import',
    'pipeline_auto',
    'pipeline_backfill',
    'migration_from_supplier',
    'spot_new_product',
    'spot_catalogo_novidades',
    'xbz_recently_promoted',
    'asia_recently_promoted',
    'sm_recently_promoted',
    '88brindes_recently_promoted'
]));

-- Também garantir que o índice único em product_id exista para uso futuro
CREATE UNIQUE INDEX IF NOT EXISTS idx_pn_product_id_unique ON public.product_novelties (product_id);
