CREATE OR REPLACE FUNCTION public.get_seasonality_analysis()
 RETURNS TABLE(month_num integer, month_name text, avg_revenue numeric, deal_count bigint)
 LANGUAGE sql
 STABLE
 SET search_path TO 'public', 'pg_temp'
AS $function$
  SELECT 
    EXTRACT(MONTH FROM closed_at)::int,
    TO_CHAR(DATE_TRUNC('month', MIN(closed_at)), 'Month'),
    ROUND(AVG(valor), 2),
    COUNT(*)
  FROM deals
  WHERE status = 'ganho' AND closed_at >= NOW() - interval '2 years'
  GROUP BY EXTRACT(MONTH FROM closed_at)
  ORDER BY 1;
$function$
