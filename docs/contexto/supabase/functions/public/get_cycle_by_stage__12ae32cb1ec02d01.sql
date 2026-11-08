CREATE OR REPLACE FUNCTION public.get_cycle_by_stage()
 RETURNS TABLE(stage text, avg_days numeric, deals_count bigint)
 LANGUAGE sql
 STABLE
 SET search_path TO 'public'
AS $function$
  SELECT pipeline_stage, ROUND(AVG(EXTRACT(EPOCH FROM (updated_at - created_at))/86400), 1), COUNT(*)
  FROM deals WHERE status NOT IN ('ganho', 'perdido')
  GROUP BY pipeline_stage ORDER BY 2 DESC;
$function$
