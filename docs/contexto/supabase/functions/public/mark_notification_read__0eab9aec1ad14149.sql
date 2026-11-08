CREATE OR REPLACE FUNCTION public.mark_notification_read(p_notification_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
  PERFORM public.assert_notification_access(p_notification_id);
  UPDATE notifications SET is_read = true, read_at = NOW() WHERE id = p_notification_id;
  RETURN jsonb_build_object('success', true, 'notification_id', p_notification_id);
END;
$function$
