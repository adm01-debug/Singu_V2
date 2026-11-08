CREATE OR REPLACE FUNCTION public.get_notifications_for_user(p_user_id uuid DEFAULT auth.uid(), p_unread_only boolean DEFAULT true, p_limit integer DEFAULT 50)
 RETURNS TABLE(notification_id uuid, notification_type text, title text, message text, entity_type text, entity_id uuid, is_read boolean, created_at timestamp with time zone, metadata jsonb)
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
BEGIN
  PERFORM public.assert_self_user_id(p_user_id);
  RETURN QUERY
  SELECT 
    n.id as notification_id,
    n.type as notification_type,
    n.title,
    n.message,
    n.entity_type,
    n.entity_id,
    COALESCE(n.is_read, false) as is_read,
    n.created_at,
    n.metadata
  FROM notifications n
  WHERE n.user_id = COALESCE(p_user_id, auth.uid())
    AND (NOT p_unread_only OR COALESCE(n.is_read, false) = false)
  ORDER BY n.created_at DESC
  LIMIT p_limit;
END;
$function$
