CREATE OR REPLACE FUNCTION public.get_peak_hours(p_user_id uuid DEFAULT NULL::uuid)
 RETURNS TABLE(hour_of_day integer, cnt bigint)
 LANGUAGE sql
 STABLE
 SET search_path TO 'public'
AS $function$
  SELECT EXTRACT(HOUR FROM data_interacao)::int, COUNT(*)
  FROM interactions WHERE (p_user_id IS NULL OR user_id = p_user_id) AND data_interacao >= NOW() - interval '30 days'
  GROUP BY 1 ORDER BY 2 DESC;
$function$
