CREATE OR REPLACE FUNCTION public.get_nps_trend(p_months integer DEFAULT 6)
 RETURNS TABLE(month date, nps_score numeric, responses_count integer)
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  WITH monthly AS (
    SELECT 
      DATE_TRUNC('month', responded_at)::date as month,
      COUNT(*) FILTER (WHERE category = 'promoter') as promoters,
      COUNT(*) FILTER (WHERE category = 'detractor') as detractors,
      COUNT(*) as total
    FROM customer_surveys
    WHERE survey_type = 'nps'
      AND responded_at >= CURRENT_DATE - (p_months || ' months')::interval
    GROUP BY DATE_TRUNC('month', responded_at)
  )
  SELECT 
    m.month,
    ROUND(((m.promoters::numeric - m.detractors::numeric) / NULLIF(m.total, 0) * 100), 1),
    m.total::integer
  FROM monthly m
  ORDER BY m.month;
END;
$function$
