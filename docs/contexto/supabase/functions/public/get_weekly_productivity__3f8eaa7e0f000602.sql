CREATE OR REPLACE FUNCTION public.get_weekly_productivity(p_user_id uuid)
 RETURNS TABLE(dia date, interactions bigint, companies bigint)
 LANGUAGE sql
 STABLE
 SET search_path TO 'public'
AS $function$
  SELECT DATE(data_interacao), COUNT(*), COUNT(DISTINCT company_id)
  FROM interactions WHERE user_id = p_user_id AND data_interacao >= NOW() - interval '7 days'
  GROUP BY 1 ORDER BY 1;
$function$
