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
