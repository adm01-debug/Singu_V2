CREATE OR REPLACE FUNCTION public.get_activity_heatmap()
 RETURNS TABLE(day_of_week integer, hour_of_day integer, activity_count bigint)
 LANGUAGE sql
 STABLE
 SET search_path TO 'public'
AS $function$
  SELECT EXTRACT(DOW FROM data_interacao)::int, EXTRACT(HOUR FROM data_interacao)::int, COUNT(*)
  FROM interactions WHERE data_interacao >= NOW() - interval '90 days'
  GROUP BY 1, 2 ORDER BY 1, 2;
$function$
