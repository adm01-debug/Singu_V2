CREATE OR REPLACE FUNCTION public.get_productivity_trend(p_user_id uuid, p_weeks integer DEFAULT 4)
 RETURNS TABLE(week_start date, interactions bigint)
 LANGUAGE sql
 STABLE
 SET search_path TO 'public'
AS $function$
  SELECT DATE_TRUNC('week', data_interacao)::date, COUNT(*)
  FROM interactions WHERE user_id = p_user_id AND data_interacao >= NOW() - (p_weeks || ' weeks')::interval
  GROUP BY 1 ORDER BY 1;
$function$
