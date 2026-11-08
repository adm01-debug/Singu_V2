CREATE OR REPLACE FUNCTION public.get_mini_dashboard(p_user_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
BEGIN
  PERFORM public.assert_self_user_id(p_user_id);
  RETURN jsonb_build_object(
    'today_interactions', (SELECT COUNT(*) FROM interactions WHERE user_id = p_user_id AND DATE(data_interacao) = CURRENT_DATE),
    'month_revenue', (SELECT COALESCE(SUM(valor), 0) FROM deals WHERE user_id = p_user_id AND status = 'ganho' AND closed_at >= DATE_TRUNC('month', NOW())),
    'pending_reminders', (SELECT COUNT(*) FROM reminders WHERE user_id = p_user_id AND is_completed = false AND reminder_date <= NOW() + interval '1 day'),
    'pipeline_value', (SELECT COALESCE(SUM(valor), 0) FROM deals WHERE user_id = p_user_id AND status NOT IN ('ganho', 'perdido'))
  );
END;
$function$
