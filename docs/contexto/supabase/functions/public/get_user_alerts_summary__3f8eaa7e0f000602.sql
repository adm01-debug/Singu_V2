CREATE OR REPLACE FUNCTION public.get_user_alerts_summary(p_user_id uuid DEFAULT auth.uid())
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
BEGIN
  PERFORM public.assert_self_user_id(p_user_id);
  RETURN jsonb_build_object(
    'unread_notifications', (SELECT COUNT(*) FROM notifications WHERE user_id = p_user_id AND is_read = false),
    'overdue_followups', (
      SELECT COUNT(*) FROM interactions i
      JOIN companies c ON c.id = i.company_id
      WHERE c.user_id = p_user_id
        AND i.follow_up_date < CURRENT_DATE
        AND COALESCE(i.followup_concluido, false) = false
    ),
    'overdue_tasks', (SELECT COUNT(*) FROM tasks WHERE user_id = p_user_id AND due_date < CURRENT_DATE AND status = 'pending'),
    'tasks_today', (SELECT COUNT(*) FROM tasks WHERE user_id = p_user_id AND due_date = CURRENT_DATE AND status = 'pending'),
    'meetings_today', (SELECT COUNT(*) FROM meetings WHERE user_id = p_user_id AND DATE(scheduled_at) = CURRENT_DATE AND status IN ('scheduled', 'confirmed')),
    'stale_deals', (
      SELECT COUNT(*) FROM deals 
      WHERE user_id = p_user_id 
        AND status NOT IN ('ganho', 'perdido', 'arquivado')
        AND updated_at < NOW() - INTERVAL '7 days'
    )
  );
END;
$function$
