CREATE OR REPLACE FUNCTION public.get_weekday_analysis(p_days integer DEFAULT 90)
 RETURNS TABLE(day_of_week integer, day_name text, total_interactions bigint, avg_response_time_min numeric, positive_pct numeric, peak_hour integer)
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    EXTRACT(DOW FROM i.created_at)::INT,
    TO_CHAR(i.created_at, 'Day'),
    COUNT(*),
    ROUND(AVG(i.response_time)::NUMERIC / 60, 2),
    ROUND(100.0 * COUNT(*) FILTER (WHERE i.sentiment = 'positivo') / NULLIF(COUNT(*), 0), 1),
    (
      SELECT EXTRACT(HOUR FROM created_at)::INT
      FROM interactions i2
      WHERE EXTRACT(DOW FROM i2.created_at) = EXTRACT(DOW FROM i.created_at)
        AND i2.created_at >= NOW() - (p_days || ' days')::INTERVAL
      GROUP BY EXTRACT(HOUR FROM created_at)
      ORDER BY COUNT(*) DESC
      LIMIT 1
    )
  FROM interactions i
  WHERE i.created_at >= NOW() - (p_days || ' days')::INTERVAL
  GROUP BY EXTRACT(DOW FROM i.created_at), TO_CHAR(i.created_at, 'Day')
  ORDER BY EXTRACT(DOW FROM i.created_at);
END;
$function$
