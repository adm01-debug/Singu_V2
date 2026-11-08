CREATE OR REPLACE FUNCTION public.get_ai_recommendations(p_user_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
DECLARE
  v_result JSONB;
BEGIN
  PERFORM public.assert_self_user_id(p_user_id);
  SELECT jsonb_build_object(
    'user_id', p_user_id,
    'generated_at', NOW(),
    'priority_contacts', (
      SELECT jsonb_agg(jsonb_build_object(
        'company_id', company_id,
        'company_name', company_name,
        'reason', 'Alto risco de churn',
        'score', risk_score
      ))
      FROM get_at_risk_accounts(p_user_id, 5)
    ),
    'followup_reminders', (
      SELECT jsonb_agg(jsonb_build_object(
        'company_id', company_id,
        'company_name', company_name,
        'days_overdue', days_overdue,
        'assunto', assunto
      ))
      FROM get_overdue_followups(p_user_id, 0)
      LIMIT 5
    ),
    'reactivation_targets', (
      SELECT jsonb_agg(jsonb_build_object(
        'company_id', company_id,
        'company_name', company_name,
        'days_inactive', days_inactive
      ))
      FROM get_stale_companies(45, p_user_id, 5)
    ),
    'birthday_opportunities', (
      SELECT jsonb_agg(jsonb_build_object(
        'contact_id', contact_id,
        'contact_name', contact_name,
        'company_name', company_name,
        'days_until', days_until
      ))
      FROM get_birthday_alerts(7, p_user_id)
      LIMIT 3
    ),
    'workload_status', (
      SELECT jsonb_build_object(
        'total_companies', COUNT(*),
        'contacted_last_7d', COUNT(DISTINCT company_id) FILTER (WHERE last_interaction >= NOW() - INTERVAL '7 days'),
        'pct_coverage', ROUND(100.0 * COUNT(DISTINCT company_id) FILTER (WHERE last_interaction >= NOW() - INTERVAL '30 days') / NULLIF(COUNT(*), 0), 1)
      )
      FROM (
        SELECT c.id as company_id, (SELECT MAX(created_at) FROM interactions i WHERE i.company_id = c.id) as last_interaction
        FROM companies c WHERE c.user_id = p_user_id AND c.deleted_at IS NULL AND c.status = 'ativo'
      ) sub
    )
  ) INTO v_result;
  
  RETURN v_result;
END;
$function$
