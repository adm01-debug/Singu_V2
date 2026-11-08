CREATE OR REPLACE FUNCTION public.refresh_daily_stats()
 RETURNS void
 LANGUAGE plpgsql
 SET search_path TO 'reporting', 'public', 'pg_catalog'
AS $function$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY reporting.mv_daily_stats;
END;
$function$
