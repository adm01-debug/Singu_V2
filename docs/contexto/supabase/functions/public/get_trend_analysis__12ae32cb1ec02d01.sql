CREATE OR REPLACE FUNCTION public.get_trend_analysis()
 RETURNS TABLE(metric text, current_week numeric, previous_week numeric, change_pct numeric, trend text)
 LANGUAGE sql
 STABLE
 SET search_path TO 'public', 'pg_temp'
AS $function$
  SELECT 'Revenue'::text, 
    (SELECT COALESCE(SUM(valor), 0) FROM deals WHERE status = 'ganho' AND closed_at >= DATE_TRUNC('week', NOW())),
    (SELECT COALESCE(SUM(valor), 0) FROM deals WHERE status = 'ganho' AND closed_at >= DATE_TRUNC('week', NOW() - interval '1 week') AND closed_at < DATE_TRUNC('week', NOW())),
    ROUND(((SELECT COALESCE(SUM(valor), 1) FROM deals WHERE status = 'ganho' AND closed_at >= DATE_TRUNC('week', NOW())) / 
      NULLIF((SELECT COALESCE(SUM(valor), 1) FROM deals WHERE status = 'ganho' AND closed_at >= DATE_TRUNC('week', NOW() - interval '1 week') AND closed_at < DATE_TRUNC('week', NOW())), 0) - 1) * 100, 1),
    CASE WHEN (SELECT SUM(valor) FROM deals WHERE status = 'ganho' AND closed_at >= DATE_TRUNC('week', NOW())) > (SELECT SUM(valor) FROM deals WHERE status = 'ganho' AND closed_at >= DATE_TRUNC('week', NOW() - interval '1 week') AND closed_at < DATE_TRUNC('week', NOW())) THEN '📈' ELSE '📉' END;
$function$
