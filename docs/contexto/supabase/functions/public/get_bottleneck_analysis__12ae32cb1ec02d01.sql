CREATE OR REPLACE FUNCTION public.get_bottleneck_analysis()
 RETURNS TABLE(stage text, stuck_deals bigint, avg_days_stuck numeric, total_value numeric)
 LANGUAGE sql
 STABLE
 SET search_path TO 'public'
AS $function$
  SELECT pipeline_stage, COUNT(*), ROUND(AVG(EXTRACT(EPOCH FROM (NOW() - updated_at))/86400), 1), SUM(valor)
  FROM deals WHERE status NOT IN ('ganho', 'perdido') AND updated_at < NOW() - interval '7 days'
  GROUP BY pipeline_stage ORDER BY 3 DESC;
$function$
