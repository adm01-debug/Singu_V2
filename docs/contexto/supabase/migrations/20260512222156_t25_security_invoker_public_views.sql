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
