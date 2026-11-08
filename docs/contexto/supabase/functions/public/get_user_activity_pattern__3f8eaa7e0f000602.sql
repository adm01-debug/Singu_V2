CREATE OR REPLACE FUNCTION public.get_user_activity_pattern(p_user_id uuid)
 RETURNS TABLE(hour_of_day integer, interaction_count bigint, avg_per_day numeric)
 LANGUAGE sql
 STABLE
 SET search_path TO 'public'
AS $function$
  SELECT EXTRACT(HOUR FROM data_interacao)::int, COUNT(*),
    ROUND(COUNT(*)::numeric / 90, 1)
  FROM interactions WHERE user_id = p_user_id AND data_interacao >= NOW() - interval '90 days'
  GROUP BY 1 ORDER BY 1;
$function$
