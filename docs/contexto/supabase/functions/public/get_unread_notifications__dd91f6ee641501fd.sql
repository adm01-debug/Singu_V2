CREATE OR REPLACE FUNCTION public.get_unread_notifications(p_user_id uuid, p_limit integer DEFAULT 20)
 RETURNS TABLE(id uuid, notification_type text, title text, message text, entity_type text, entity_id uuid, action_url text, created_at timestamp with time zone, time_ago text)
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
BEGIN
  PERFORM public.assert_self_user_id(p_user_id);
  RETURN QUERY
  SELECT 
    n.id,
    n.type::text as notification_type,
    n.title::text,
    n.message::text,
    n.entity_type::text,
    n.entity_id,
    n.action_url::text,
    n.created_at,
    CASE 
      WHEN n.created_at > NOW() - INTERVAL '1 hour' THEN 'agora'
      WHEN n.created_at > NOW() - INTERVAL '1 day' THEN EXTRACT(HOUR FROM NOW() - n.created_at)::int || 'h atrás'
      WHEN n.created_at > NOW() - INTERVAL '7 days' THEN EXTRACT(DAY FROM NOW() - n.created_at)::int || 'd atrás'
      ELSE TO_CHAR(n.created_at, 'DD/MM')
    END::text as time_ago
  FROM notifications n
  WHERE n.user_id = p_user_id
    AND n.is_read = false
  ORDER BY n.created_at DESC
  LIMIT p_limit;
END;
$function$
