CREATE OR REPLACE FUNCTION public.get_lead_score_trend(p_company_id uuid, p_days integer DEFAULT 30)
 RETURNS TABLE(score_date date, lead_score integer, engagement_score integer, fit_score integer, behavior_score integer)
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    lsh.score_date,
    lsh.lead_score,
    lsh.engagement_score,
    lsh.fit_score,
    lsh.behavior_score
  FROM lead_score_history lsh
  WHERE lsh.company_id = p_company_id
    AND lsh.score_date >= CURRENT_DATE - p_days
  ORDER BY lsh.score_date;
END;
$function$
