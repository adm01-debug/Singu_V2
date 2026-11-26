CREATE OR REPLACE FUNCTION public.get_executive_dashboard()
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  RETURN jsonb_build_object(
    'overview', jsonb_build_object(
      'total_companies', (SELECT COUNT(*) FROM companies WHERE status = 'ativo'),
      'total_contacts', (SELECT COUNT(*) FROM contacts),
      'total_interactions_month', (SELECT COUNT(*) FROM interactions WHERE created_at >= DATE_TRUNC('month', CURRENT_DATE)),
      'active_users', (SELECT COUNT(DISTINCT user_id) FROM interactions WHERE created_at >= NOW() - interval '7 days')
    ),
    'pipeline', get_workflow_pipeline(),
    'performance', jsonb_build_object(
      'interactions_today', (SELECT COUNT(*) FROM interactions WHERE created_at::date = CURRENT_DATE),
      'new_companies_month', (SELECT COUNT(*) FROM companies WHERE created_at >= DATE_TRUNC('month', CURRENT_DATE)),
      'pending_followups', (SELECT COUNT(*) FROM interactions WHERE follow_up_date <= CURRENT_DATE AND follow_up_date IS NOT NULL)
    ),
    'quality', jsonb_build_object(
      'positive_rate', (
        SELECT ROUND(COUNT(*) FILTER (WHERE sentiment = 'positive')::numeric / NULLIF(COUNT(*), 0) * 100, 2)
        FROM interactions WHERE created_at >= NOW() - interval '30 days'
      ),
      'companies_with_contact', (
        SELECT ROUND(COUNT(*) FILTER (WHERE EXISTS (SELECT 1 FROM contacts ct WHERE ct.company_id = c.id))::numeric / NULLIF(COUNT(*), 0) * 100, 2)
        FROM companies c WHERE status = 'ativo'
      )
    ),
    'trends', jsonb_build_object(
      'interactions_vs_last_month', (
        SELECT ROUND((
          (SELECT COUNT(*)::numeric FROM interactions WHERE created_at >= DATE_TRUNC('month', CURRENT_DATE)) -
          (SELECT COUNT(*)::numeric FROM interactions WHERE created_at >= DATE_TRUNC('month', CURRENT_DATE - interval '1 month') AND created_at < DATE_TRUNC('month', CURRENT_DATE))
        ) / NULLIF((SELECT COUNT(*)::numeric FROM interactions WHERE created_at >= DATE_TRUNC('month', CURRENT_DATE - interval '1 month') AND created_at < DATE_TRUNC('month', CURRENT_DATE)), 0) * 100, 2)
      )
    ),
    'generated_at', NOW()
  );
END;
$function$
