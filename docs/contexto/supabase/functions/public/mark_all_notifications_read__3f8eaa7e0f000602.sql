CREATE OR REPLACE FUNCTION public.mark_all_notifications_read(p_user_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE
  v_count int;
BEGIN
  PERFORM public.assert_self_user_id(p_user_id);
  UPDATE notifications SET is_read = true, read_at = NOW() 
  WHERE user_id = p_user_id AND is_read = false;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN jsonb_build_object('success', true, 'marked_count', v_count);
END;
$function$
