-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20260512222156
-- nome:   t25_security_invoker_public_views

DO $$
DECLARE
  v_view text;
  v_views text[] := ARRAY[
    'v_channel_stats',
    'v_companies_metrics',
    'v_company_summary',
    'v_contact_summary',
    'v_daily_kpis',
    'v_dashboard_kpis',
    'v_deal_summary',
    'v_pipeline_summary',
    'v_recent_interactions'
  ];
BEGIN
  FOREACH v_view IN ARRAY v_views LOOP
    BEGIN
      EXECUTE format('ALTER VIEW public.%I SET (security_invoker=true)', v_view);
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Skipping view %: %', v_view, SQLERRM;
    END;
  END LOOP;
  RAISE NOTICE 'T25 complete: security_invoker=true set on all 9 public-schema views.';
END;
$$;
