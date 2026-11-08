CREATE OR REPLACE FUNCTION public.get_notification_stats(p_user_id uuid DEFAULT auth.uid())
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
BEGIN
  PERFORM public.assert_self_user_id(p_user_id);
  RETURN (
    SELECT jsonb_build_object(
      'total', COUNT(*),
      'unread', COUNT(*) FILTER (WHERE COALESCE(is_read, false) = false),
      'read', COUNT(*) FILTER (WHERE is_read = true),
      'by_type', (
        SELECT COALESCE(jsonb_object_agg(type, cnt), '{}'::jsonb)
        FROM (
          SELECT type, COUNT(*) as cnt
          FROM notifications
          WHERE user_id = COALESCE(p_user_id, auth.uid())
          GROUP BY type
        ) t
      ),
      'last_24h', COUNT(*) FILTER (WHERE created_at >= NOW() - interval '24 hours'),
      'oldest_unread', MIN(created_at) FILTER (WHERE COALESCE(is_read, false) = false)
    )
    FROM notifications
    WHERE user_id = COALESCE(p_user_id, auth.uid())
  );
END;
$function$
