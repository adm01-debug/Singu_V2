CREATE OR REPLACE FUNCTION public.get_user_dashboard(p_user_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
DECLARE v_result jsonb;
BEGIN
  PERFORM public.assert_self_user_id(p_user_id);
  SELECT jsonb_build_object(
    'user_id', p_user_id,
    'today', jsonb_build_object(
      'interactions', (SELECT COUNT(*) FROM interactions WHERE user_id = p_user_id AND DATE(data_interacao) = CURRENT_DATE),
      'companies_contacted', (SELECT COUNT(DISTINCT company_id) FROM interactions WHERE user_id = p_user_id AND DATE(data_interacao) = CURRENT_DATE),
      'deals_created', (SELECT COUNT(*) FROM deals WHERE user_id = p_user_id AND DATE(created_at) = CURRENT_DATE)
    ),
    'month', jsonb_build_object(
      'revenue', (SELECT COALESCE(SUM(valor), 0) FROM deals WHERE user_id = p_user_id AND status = 'ganho' AND closed_at >= DATE_TRUNC('month', NOW())),
      'deals_won', (SELECT COUNT(*) FROM deals WHERE user_id = p_user_id AND status = 'ganho' AND closed_at >= DATE_TRUNC('month', NOW())),
      'interactions', (SELECT COUNT(*) FROM interactions WHERE user_id = p_user_id AND data_interacao >= DATE_TRUNC('month', NOW()))
    ),
    'pipeline', jsonb_build_object(
      'open_deals', (SELECT COUNT(*) FROM deals WHERE user_id = p_user_id AND status NOT IN ('ganho', 'perdido')),
      'pipeline_value', (SELECT COALESCE(SUM(valor), 0) FROM deals WHERE user_id = p_user_id AND status NOT IN ('ganho', 'perdido')),
      'weighted_value', (SELECT COALESCE(SUM(valor * probabilidade / 100), 0) FROM deals WHERE user_id = p_user_id AND status NOT IN ('ganho', 'perdido'))
    ),
    'alerts', jsonb_build_object(
      'overdue_reminders', (SELECT COUNT(*) FROM reminders WHERE user_id = p_user_id AND is_completed = false AND reminder_date < NOW()),
      'stalled_deals', (SELECT COUNT(*) FROM deals WHERE user_id = p_user_id AND status NOT IN ('ganho', 'perdido') AND updated_at < NOW() - interval '7 days'),
      'unread_notifications', (SELECT COUNT(*) FROM notifications WHERE user_id = p_user_id AND is_read = false)
    ),
    'goals', (SELECT jsonb_agg(jsonb_build_object('type', goal_type, 'target', target_value, 'current', current_value, 'pct', ROUND(current_value/NULLIF(target_value,0)*100, 1)))
      FROM user_goals WHERE user_id = p_user_id AND period_end >= CURRENT_DATE),
    'generated_at', NOW()
  ) INTO v_result;
  RETURN v_result;
END;
$function$
