CREATE OR REPLACE FUNCTION public.count_notifications_unread(p_user_id uuid DEFAULT auth.uid())
 RETURNS integer
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
BEGIN
  PERFORM public.assert_self_user_id(p_user_id);
  RETURN (
    SELECT COUNT(*)::int
    FROM notifications
    WHERE user_id = COALESCE(p_user_id, auth.uid())
      AND COALESCE(is_read, false) = false
  );
END;
$function$
