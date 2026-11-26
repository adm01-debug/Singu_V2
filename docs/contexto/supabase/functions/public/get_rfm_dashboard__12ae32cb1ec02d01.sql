CREATE OR REPLACE FUNCTION public.get_rfm_dashboard()
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE v_result jsonb;
BEGIN
  SELECT jsonb_build_object(
    'total_scored', (SELECT COUNT(*) FROM company_rfm_scores),
    'avg_recency', (SELECT ROUND(AVG(recency_score), 2) FROM company_rfm_scores),
    'avg_frequency', (SELECT ROUND(AVG(frequency_score), 2) FROM company_rfm_scores),
    'avg_monetary', (SELECT ROUND(AVG(monetary_score), 2) FROM company_rfm_scores),
    'champions_count', (SELECT COUNT(*) FROM company_rfm_scores WHERE combined_score >= 4.5),
    'at_risk_count', (SELECT COUNT(*) FROM company_rfm_scores WHERE combined_score < 2.0),
    'last_calculation', (SELECT MAX(calculated_at) FROM company_rfm_scores)
  ) INTO v_result;
  RETURN v_result;
END;
$function$
