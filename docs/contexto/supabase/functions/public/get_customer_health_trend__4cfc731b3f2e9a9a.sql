CREATE OR REPLACE FUNCTION public.get_customer_health_trend(p_company_id uuid, p_days integer DEFAULT 30)
 RETURNS TABLE(score_date date, health_score integer, engagement_level text)
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    chs.score_date,
    chs.health_score,
    chs.engagement_level
  FROM customer_health_scores chs
  WHERE chs.company_id = p_company_id
    AND chs.score_date >= CURRENT_DATE - p_days
  ORDER BY chs.score_date;
END;
$function$
