REVOKE SELECT ON public.mv_daily_kpis  FROM anon;
REVOKE SELECT ON public.mv_daily_stats FROM anon;
GRANT  SELECT ON public.mv_daily_kpis  TO authenticated;
GRANT  SELECT ON public.mv_daily_stats TO authenticated;
