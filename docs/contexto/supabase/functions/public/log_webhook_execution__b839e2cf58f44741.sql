CREATE OR REPLACE FUNCTION public.log_webhook_execution(p_webhook_id uuid, p_event_type text, p_payload jsonb, p_response_status integer, p_success boolean, p_duration_ms integer DEFAULT NULL::integer)
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE v_id uuid;
BEGIN
  IF auth.uid() IS NOT NULL THEN
    RAISE EXCEPTION 'This function is reserved for the service role'
      USING ERRCODE = 'insufficient_privilege';
  END IF;
  INSERT INTO webhook_logs (webhook_id, event_type, payload, response_status, success, duration_ms) VALUES (p_webhook_id, p_event_type, p_payload, p_response_status, p_success, p_duration_ms) RETURNING id INTO v_id;
  RETURN jsonb_build_object('success', true, 'log_id', v_id);
END;
$function$
