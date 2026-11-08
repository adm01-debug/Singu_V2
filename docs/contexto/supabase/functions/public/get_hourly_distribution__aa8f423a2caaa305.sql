CREATE OR REPLACE FUNCTION public.get_hourly_distribution(p_days integer DEFAULT 30)
 RETURNS TABLE(hour_of_day integer, total_interactions bigint, inbound_count bigint, outbound_count bigint, avg_response_time_min numeric)
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    EXTRACT(HOUR FROM i.created_at)::INT,
    COUNT(*),
    COUNT(*) FILTER (WHERE i.direction = 'inbound'),
    COUNT(*) FILTER (WHERE i.direction = 'outbound'),
    ROUND(AVG(i.response_time)::NUMERIC / 60, 2)
  FROM interactions i
  WHERE i.created_at >= NOW() - (p_days || ' days')::INTERVAL
  GROUP BY EXTRACT(HOUR FROM i.created_at)
  ORDER BY EXTRACT(HOUR FROM i.created_at);
END;
$function$
