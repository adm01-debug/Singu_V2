CREATE OR REPLACE FUNCTION public.log_webhook_execution(p_webhook_id uuid, p_event_type text, p_payload jsonb, p_response_status integer, p_response_body text, p_success boolean, p_duration_ms integer)
 RETURNS uuid
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE
  v_id uuid;
BEGIN
  IF auth.uid() IS NOT NULL THEN
    RAISE EXCEPTION 'This function is reserved for the service role'
      USING ERRCODE = 'insufficient_privilege';
  END IF;
  INSERT INTO webhook_logs (webhook_id, event_type, payload, response_status, response_body, success, duration_ms)
  VALUES (p_webhook_id, p_event_type, p_payload, p_response_status, p_response_body, p_success, p_duration_ms)
  RETURNING id INTO v_id;
  
  UPDATE webhooks SET 
    last_triggered_at = NOW(),
    failure_count = CASE WHEN p_success THEN 0 ELSE failure_count + 1 END
  WHERE id = p_webhook_id;
  
  RETURN v_id;
END;
$function$
