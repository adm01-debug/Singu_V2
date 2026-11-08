CREATE OR REPLACE FUNCTION public.get_propensity_distribution()
 RETURNS TABLE(score_range text, lead_count bigint)
 LANGUAGE sql
 STABLE
 SET search_path TO 'public'
AS $function$
  SELECT CASE 
    WHEN calculate_propensity_score(id) >= 80 THEN '80-100 (Muito Alto)'
    WHEN calculate_propensity_score(id) >= 60 THEN '60-79 (Alto)'
    WHEN calculate_propensity_score(id) >= 40 THEN '40-59 (Médio)'
    WHEN calculate_propensity_score(id) >= 20 THEN '20-39 (Baixo)'
    ELSE '0-19 (Muito Baixo)'
  END, COUNT(*)
  FROM companies WHERE deleted_at IS NULL AND is_customer = false
  GROUP BY 1 ORDER BY 1 DESC;
$function$
