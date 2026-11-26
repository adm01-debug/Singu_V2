CREATE OR REPLACE FUNCTION public.get_sales_cycle_analysis()
 RETURNS TABLE(metric text, value numeric)
 LANGUAGE sql
 STABLE
 SET search_path TO 'public', 'pg_temp'
AS $function$
  SELECT 'avg_cycle_days'::text, ROUND(AVG(EXTRACT(EPOCH FROM (closed_at - created_at))/86400), 1)
  FROM deals WHERE status = 'ganho' AND closed_at IS NOT NULL
  UNION ALL
  SELECT 'min_cycle_days', MIN(EXTRACT(EPOCH FROM (closed_at - created_at))/86400)
  FROM deals WHERE status = 'ganho' AND closed_at IS NOT NULL
  UNION ALL
  SELECT 'max_cycle_days', MAX(EXTRACT(EPOCH FROM (closed_at - created_at))/86400)
  FROM deals WHERE status = 'ganho' AND closed_at IS NOT NULL
  UNION ALL
  SELECT 'median_cycle_days', PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY EXTRACT(EPOCH FROM (closed_at - created_at))/86400)
  FROM deals WHERE status = 'ganho' AND closed_at IS NOT NULL;
$function$
