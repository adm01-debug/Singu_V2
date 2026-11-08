CREATE OR REPLACE FUNCTION public.get_activity_heatmap(p_user_id uuid DEFAULT NULL::uuid, p_weeks integer DEFAULT 4)
 RETURNS TABLE(day_of_week integer, hour_of_day integer, interaction_count bigint)
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
BEGIN
  PERFORM public.assert_self_user_id(p_user_id);
  RETURN QUERY
  SELECT 
    EXTRACT(ISODOW FROM data_interacao)::int as day_of_week,
    EXTRACT(HOUR FROM data_interacao)::int as hour_of_day,
    COUNT(*)::bigint as interaction_count
  FROM interactions
  WHERE data_interacao >= NOW() - (p_weeks || ' weeks')::interval
    AND (p_user_id IS NULL OR user_id = p_user_id)
  GROUP BY EXTRACT(ISODOW FROM data_interacao), EXTRACT(HOUR FROM data_interacao)
  ORDER BY day_of_week, hour_of_day;
END;
$function$
