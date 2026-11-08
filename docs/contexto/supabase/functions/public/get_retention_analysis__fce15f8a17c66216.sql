CREATE OR REPLACE FUNCTION public.get_retention_analysis(p_months integer DEFAULT 6)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
DECLARE
  v_result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'periodo_meses', p_months,
    'active_companies', jsonb_build_object(
      'with_recent_interaction', (
        SELECT COUNT(DISTINCT company_id) FROM interactions WHERE created_at >= NOW() - INTERVAL '30 days'
      ),
      'with_quarterly_interaction', (
        SELECT COUNT(DISTINCT company_id) FROM interactions WHERE created_at >= NOW() - INTERVAL '90 days'
      ),
      'inactive_30d', (
        SELECT COUNT(*) FROM companies c
        WHERE c.status = 'ativo' AND c.deleted_at IS NULL
        AND NOT EXISTS (SELECT 1 FROM interactions i WHERE i.company_id = c.id AND i.created_at >= NOW() - INTERVAL '30 days')
      ),
      'inactive_60d', (
        SELECT COUNT(*) FROM companies c
        WHERE c.status = 'ativo' AND c.deleted_at IS NULL
        AND NOT EXISTS (SELECT 1 FROM interactions i WHERE i.company_id = c.id AND i.created_at >= NOW() - INTERVAL '60 days')
      )
    ),
    'churn_indicators', jsonb_build_object(
      'negative_sentiment_30d', (
        SELECT COUNT(DISTINCT company_id) FROM interactions 
        WHERE sentiment = 'negativo' AND created_at >= NOW() - INTERVAL '30 days'
      ),
      'pending_followups', (
        SELECT COUNT(DISTINCT company_id) FROM interactions 
        WHERE follow_up_required AND NOT COALESCE(followup_concluido, FALSE)
      )
    ),
    'engagement_distribution', (
      SELECT jsonb_build_object(
        'high', COUNT(*) FILTER (WHERE int_count >= 10),
        'medium', COUNT(*) FILTER (WHERE int_count BETWEEN 3 AND 9),
        'low', COUNT(*) FILTER (WHERE int_count BETWEEN 1 AND 2),
        'none', COUNT(*) FILTER (WHERE int_count = 0)
      )
      FROM (
        SELECT c.id, COALESCE((
          SELECT COUNT(*) FROM interactions i WHERE i.company_id = c.id AND i.created_at >= NOW() - INTERVAL '30 days'
        ), 0) as int_count
        FROM companies c WHERE c.status = 'ativo' AND c.deleted_at IS NULL
      ) sub
    )
  ) INTO v_result;
  
  RETURN v_result;
END;
$function$
