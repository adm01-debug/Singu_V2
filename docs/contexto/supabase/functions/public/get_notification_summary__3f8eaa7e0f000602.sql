CREATE OR REPLACE FUNCTION public.get_notification_summary(p_user_id uuid)
 RETURNS TABLE(total_unread integer, urgent_count integer, follow_ups_today integer, meetings_today integer, alerts_active integer, reminders_overdue integer)
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_catalog'
AS $function$
BEGIN
  PERFORM public.assert_self_user_id(p_user_id);

  RETURN QUERY
  SELECT
    (SELECT COUNT(*)::INTEGER FROM notifications
     WHERE user_id = p_user_id AND is_read = false AND is_dismissed = false),
    (SELECT COUNT(*)::INTEGER FROM notifications
     WHERE user_id = p_user_id AND is_read = false AND category = 'urgent'),
    (SELECT COUNT(*)::INTEGER FROM smart_reminders
     WHERE user_id = p_user_id AND reminder_type = 'follow_up'
       AND DATE(remind_at) = CURRENT_DATE AND status = 'pending'),
    (SELECT COUNT(*)::INTEGER FROM smart_reminders
     WHERE user_id = p_user_id AND reminder_type = 'meeting'
       AND DATE(remind_at) = CURRENT_DATE AND status = 'pending'),
    (SELECT COUNT(*)::INTEGER FROM inactivity_alerts WHERE status = 'active'),
    (SELECT COUNT(*)::INTEGER FROM smart_reminders
     WHERE user_id = p_user_id AND status = 'pending' AND remind_at < NOW());
END;
$function$
