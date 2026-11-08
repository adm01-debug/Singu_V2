CREATE OR REPLACE FUNCTION public.get_benchmark_metrics()
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
DECLARE
  v_result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'generated_at', NOW(),
    'response_time', jsonb_build_object(
      'avg_minutes', (SELECT ROUND(AVG(response_time)::NUMERIC / 60, 2) FROM interactions WHERE response_time IS NOT NULL),
      'p50_minutes', (SELECT ROUND(PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY response_time)::NUMERIC / 60, 2) FROM interactions WHERE response_time IS NOT NULL),
      'p90_minutes', (SELECT ROUND(PERCENTILE_CONT(0.9) WITHIN GROUP (ORDER BY response_time)::NUMERIC / 60, 2) FROM interactions WHERE response_time IS NOT NULL),
      'target_minutes', 30
    ),
    'engagement', jsonb_build_object(
      'avg_interactions_per_company', (
        SELECT ROUND(AVG(cnt), 2)
        FROM (SELECT company_id, COUNT(*) as cnt FROM interactions GROUP BY company_id) sub
      ),
      'companies_with_weekly_contact', (
        SELECT COUNT(DISTINCT company_id) 
        FROM interactions WHERE created_at >= NOW() - INTERVAL '7 days'
      ),
      'companies_with_monthly_contact', (
        SELECT COUNT(DISTINCT company_id) 
        FROM interactions WHERE created_at >= NOW() - INTERVAL '30 days'
      )
    ),
    'sentiment', jsonb_build_object(
      'positive_pct', (SELECT ROUND(100.0 * COUNT(*) FILTER (WHERE sentiment = 'positivo') / NULLIF(COUNT(*), 0), 1) FROM interactions),
      'negative_pct', (SELECT ROUND(100.0 * COUNT(*) FILTER (WHERE sentiment = 'negativo') / NULLIF(COUNT(*), 0), 1) FROM interactions),
      'target_positive', 80,
      'target_negative', 5
    ),
    'coverage', jsonb_build_object(
      'total_companies', (SELECT COUNT(*) FROM companies WHERE deleted_at IS NULL AND status = 'ativo'),
      'with_interactions', (SELECT COUNT(DISTINCT company_id) FROM interactions),
      'coverage_pct', (
        SELECT ROUND(100.0 * COUNT(DISTINCT i.company_id) / NULLIF((SELECT COUNT(*) FROM companies WHERE deleted_at IS NULL AND status = 'ativo'), 0), 1)
        FROM interactions i
      )
    )
  ) INTO v_result;
  
  RETURN v_result;
END;
$function$
