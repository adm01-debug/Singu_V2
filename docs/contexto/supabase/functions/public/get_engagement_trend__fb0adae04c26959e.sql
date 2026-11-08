CREATE OR REPLACE FUNCTION public.get_engagement_trend(p_company_id uuid, p_months integer DEFAULT 6)
 RETURNS TABLE(month text, interactions bigint, positive_count bigint, negative_count bigint, trend_vs_previous numeric)
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  WITH monthly AS (
    SELECT 
      TO_CHAR(d.month, 'YYYY-MM') as month,
      (SELECT COUNT(*) FROM interactions WHERE company_id = p_company_id AND DATE_TRUNC('month', created_at) = d.month) as interactions,
      (SELECT COUNT(*) FROM interactions WHERE company_id = p_company_id AND DATE_TRUNC('month', created_at) = d.month AND sentiment = 'positive') as positive_count,
      (SELECT COUNT(*) FROM interactions WHERE company_id = p_company_id AND DATE_TRUNC('month', created_at) = d.month AND sentiment = 'negative') as negative_count
    FROM generate_series(
      DATE_TRUNC('month', CURRENT_DATE - (p_months || ' months')::interval),
      DATE_TRUNC('month', CURRENT_DATE),
      '1 month'::interval
    ) d(month)
  )
  SELECT 
    m.month,
    m.interactions,
    m.positive_count,
    m.negative_count,
    ROUND(
      (m.interactions - LAG(m.interactions) OVER (ORDER BY m.month))::numeric / 
      NULLIF(LAG(m.interactions) OVER (ORDER BY m.month), 0) * 100, 2
    ) as trend_vs_previous
  FROM monthly m
  ORDER BY m.month;
END;
$function$
