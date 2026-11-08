CREATE OR REPLACE FUNCTION public.update_event_status(p_event_id uuid, p_status text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
  PERFORM public.assert_event_access(p_event_id);
  UPDATE calendar_events SET status = p_status, updated_at = NOW() WHERE id = p_event_id;
  RETURN jsonb_build_object('success', true);
END;
$function$
