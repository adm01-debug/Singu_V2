CREATE OR REPLACE FUNCTION public.mark_notification_read(p_notification_id uuid, p_user_id uuid DEFAULT auth.uid())
 RETURNS boolean
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE
  v_updated boolean := false;
BEGIN
  PERFORM public.assert_self_user_id(p_user_id);
  UPDATE notifications
  SET is_read = true, read_at = NOW()
  WHERE id = p_notification_id
    AND user_id = COALESCE(p_user_id, auth.uid());
  
  v_updated := FOUND;
  RETURN v_updated;
END;
$function$
