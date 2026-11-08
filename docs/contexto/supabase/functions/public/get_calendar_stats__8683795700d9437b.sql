CREATE OR REPLACE FUNCTION public.get_calendar_stats(p_user_id uuid, p_days integer DEFAULT 30)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
BEGIN
  PERFORM public.assert_self_user_id(p_user_id);
  RETURN jsonb_build_object(
    'total_events', (SELECT COUNT(*) FROM calendar_events WHERE user_id = p_user_id AND start_time >= NOW() - (p_days || ' days')::interval),
    'completed', (SELECT COUNT(*) FROM calendar_events WHERE user_id = p_user_id AND status = 'completed' AND start_time >= NOW() - (p_days || ' days')::interval),
    'cancelled', (SELECT COUNT(*) FROM calendar_events WHERE user_id = p_user_id AND status = 'cancelled' AND start_time >= NOW() - (p_days || ' days')::interval),
    'upcoming_week', (SELECT COUNT(*) FROM calendar_events WHERE user_id = p_user_id AND start_time BETWEEN NOW() AND NOW() + INTERVAL '7 days' AND status = 'scheduled'),
    'by_type', (SELECT jsonb_object_agg(event_type, cnt) FROM (SELECT event_type, COUNT(*) as cnt FROM calendar_events WHERE user_id = p_user_id AND start_time >= NOW() - (p_days || ' days')::interval GROUP BY event_type) t)
  );
END;
$function$
