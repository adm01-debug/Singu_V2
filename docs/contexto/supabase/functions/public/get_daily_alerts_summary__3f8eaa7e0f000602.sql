CREATE OR REPLACE FUNCTION public.get_daily_alerts_summary(p_user_id uuid DEFAULT NULL::uuid)
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
    'data', CURRENT_DATE,
    'sla_breaches', (SELECT COUNT(*) FROM check_sla_breaches(48, p_user_id)),
    'overdue_followups', (SELECT COUNT(*) FROM get_overdue_followups(p_user_id, 0)),
    'urgent_interactions', (SELECT COUNT(*) FROM get_urgent_interactions(p_user_id, 100)),
    'birthdays_today', (SELECT COUNT(*) FROM get_birthday_alerts(0, p_user_id)),
    'birthdays_week', (SELECT COUNT(*) FROM get_birthday_alerts(7, p_user_id)),
    'stale_accounts', (SELECT COUNT(*) FROM get_stale_companies(30, p_user_id, 1000)),
    'at_risk_accounts', (SELECT COUNT(*) FROM get_at_risk_accounts(p_user_id, 1000)),
    'pending_callbacks', (SELECT COUNT(*) FROM get_pending_callbacks(p_user_id, TRUE))
  ) INTO v_result;
  
  RETURN v_result;
END;
$function$
