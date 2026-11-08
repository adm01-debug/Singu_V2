CREATE OR REPLACE FUNCTION public.get_day_of_week_performance()
 RETURNS TABLE(day_num integer, deals_count bigint, revenue numeric)
 LANGUAGE sql
 STABLE
 SET search_path TO 'public'
AS $function$
  SELECT EXTRACT(DOW FROM closed_at)::int, COUNT(*), SUM(valor)
  FROM deals WHERE status = 'ganho' GROUP BY 1 ORDER BY 1;
$function$
