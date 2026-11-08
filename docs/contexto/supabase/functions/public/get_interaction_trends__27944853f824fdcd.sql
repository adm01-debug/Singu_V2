CREATE OR REPLACE FUNCTION public.get_interaction_trends(p_user_id uuid DEFAULT NULL::uuid, p_weeks integer DEFAULT 12)
 RETURNS TABLE(week_start date, total_interactions bigint, by_type jsonb, avg_per_day numeric)
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
BEGIN
  PERFORM public.assert_self_user_id(p_user_id);
  RETURN QUERY
  SELECT 
    DATE_TRUNC('week', i.data_interacao)::date as week_start,
    COUNT(*)::bigint as total_interactions,
    jsonb_object_agg(COALESCE(i.type, 'other'), type_count) as by_type,
    ROUND(COUNT(*)::numeric / 7, 2) as avg_per_day
  FROM interactions i
  LEFT JOIN LATERAL (
    SELECT i2.type, COUNT(*) as type_count
    FROM interactions i2
    WHERE DATE_TRUNC('week', i2.data_interacao) = DATE_TRUNC('week', i.data_interacao)
      AND (p_user_id IS NULL OR i2.user_id = p_user_id)
    GROUP BY i2.type
  ) t ON true
  WHERE i.data_interacao >= NOW() - (p_weeks || ' weeks')::interval
    AND (p_user_id IS NULL OR i.user_id = p_user_id)
  GROUP BY DATE_TRUNC('week', i.data_interacao)
  ORDER BY week_start DESC;
END;
$function$
