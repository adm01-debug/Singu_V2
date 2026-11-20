-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20260721223203
-- nome:   idx_user_id_wave173_tables

-- Migration: idx_user_id_wave173_tables (Wave 174)
-- PERFORMANCE: Add user_id indexes to 3 tables fixed in Wave 173 Part A.
-- churn_predictions, deal_velocity_analysis, search_products_cache now have
-- user_id = (SELECT auth.uid()) policies but no user_id index.

CREATE INDEX IF NOT EXISTS idx_churn_predictions_user_id
  ON public.churn_predictions (user_id);

CREATE INDEX IF NOT EXISTS idx_deal_velocity_analysis_user_id
  ON public.deal_velocity_analysis (user_id);

CREATE INDEX IF NOT EXISTS idx_search_products_cache_user_id
  ON public.search_products_cache (user_id);

DO $$
DECLARE
  missing int;
BEGIN
  WITH rls_tables AS (
    SELECT DISTINCT cl.relname AS tablename
    FROM pg_policy pol
    JOIN pg_class cl ON pol.polrelid = cl.oid
    JOIN pg_namespace ns ON ns.oid = cl.relnamespace AND ns.nspname = 'public'
    WHERE (pg_get_expr(pol.polqual, pol.polrelid) LIKE '%user_id%'
        OR pg_get_expr(pol.polwithcheck, pol.polrelid) LIKE '%user_id%')
      AND cl.relname <> 'connector_log'
  ),
  indexed AS (
    SELECT DISTINCT t.relname AS tablename
    FROM pg_index ix
    JOIN pg_class t ON t.oid = ix.indrelid
    JOIN pg_namespace ns ON ns.oid = t.relnamespace AND ns.nspname = 'public'
    JOIN pg_attribute a ON a.attrelid = t.oid AND a.attnum = ANY(ix.indkey)
    WHERE a.attname = 'user_id'
  )
  SELECT COUNT(*) INTO missing
  FROM rls_tables rt LEFT JOIN indexed i ON i.tablename = rt.tablename
  WHERE i.tablename IS NULL;

  IF missing = 0 THEN
    RAISE NOTICE '[Wave 174] All RLS user_id-filtered tables now have user_id indexes. Performance fully clean.';
  ELSE
    RAISE WARNING '[Wave 174] % tables still missing user_id index', missing;
  END IF;
END;
$$;
