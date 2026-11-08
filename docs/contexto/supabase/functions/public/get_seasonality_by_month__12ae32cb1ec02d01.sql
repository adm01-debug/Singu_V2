CREATE OR REPLACE FUNCTION public.get_seasonality_by_month()
 RETURNS TABLE(month_num integer, total_revenue numeric, deals_count bigint)
 LANGUAGE sql
 STABLE
 SET search_path TO 'public'
AS $function$
  SELECT EXTRACT(MONTH FROM closed_at)::int, COALESCE(SUM(valor), 0), COUNT(*)
  FROM deals WHERE status = 'ganho' GROUP BY 1 ORDER BY 1;
$function$
