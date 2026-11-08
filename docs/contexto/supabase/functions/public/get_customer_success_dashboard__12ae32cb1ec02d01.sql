CREATE OR REPLACE FUNCTION public.get_customer_success_dashboard()
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN jsonb_build_object(
    'total_customers', (SELECT COUNT(*) FROM companies WHERE is_customer = true AND deleted_at IS NULL),
    'health_distribution', (
      SELECT jsonb_build_object(
        'high', COUNT(*) FILTER (WHERE engagement_level = 'high'),
        'medium', COUNT(*) FILTER (WHERE engagement_level = 'medium'),
        'low', COUNT(*) FILTER (WHERE engagement_level = 'low'),
        'at_risk', COUNT(*) FILTER (WHERE engagement_level = 'at_risk')
      )
      FROM customer_health_scores
      WHERE score_date = CURRENT_DATE
    ),
    'avg_health_score', (
      SELECT ROUND(AVG(health_score)::numeric, 1)
      FROM customer_health_scores
      WHERE score_date = CURRENT_DATE
    ),
    'at_risk_count', (
      SELECT COUNT(*)
      FROM customer_health_scores chs
      JOIN companies c ON c.id = chs.company_id
      WHERE chs.score_date = CURRENT_DATE
        AND chs.engagement_level = 'at_risk'
        AND c.is_customer = true
    ),
    'needs_attention', (
      SELECT COALESCE(jsonb_agg(r), '[]')
      FROM (
        SELECT c.id, c.nome_crm, chs.health_score, chs.engagement_level
        FROM customer_health_scores chs
        JOIN companies c ON c.id = chs.company_id
        WHERE chs.score_date = CURRENT_DATE
          AND chs.health_score < 50
          AND c.is_customer = true
        ORDER BY chs.health_score
        LIMIT 10
      ) r
    ),
    'top_healthy', (
      SELECT COALESCE(jsonb_agg(r), '[]')
      FROM (
        SELECT c.id, c.nome_crm, chs.health_score
        FROM customer_health_scores chs
        JOIN companies c ON c.id = chs.company_id
        WHERE chs.score_date = CURRENT_DATE
          AND c.is_customer = true
        ORDER BY chs.health_score DESC
        LIMIT 5
      ) r
    )
  );
END;
$function$
