CREATE OR REPLACE FUNCTION public.log_integration_action(p_integration_id uuid, p_action text, p_direction text, p_status text, p_request_data jsonb DEFAULT NULL::jsonb, p_response_data jsonb DEFAULT NULL::jsonb, p_error_message text DEFAULT NULL::text, p_duration_ms integer DEFAULT NULL::integer)
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
  INSERT INTO integration_logs (integration_id, action, direction, status, request_data, response_data, error_message, duration_ms)
  VALUES (p_integration_id, p_action, p_direction, p_status, p_request_data, p_response_data, p_error_message, p_duration_ms)
  RETURNING id INTO v_id;
  
  -- Atualizar status da integração
  UPDATE integrations SET 
    last_sync_at = NOW(),
    sync_status = CASE WHEN p_status = 'success' THEN 'success' ELSE 'error' END,
    sync_error = p_error_message,
    updated_at = NOW()
  WHERE id = p_integration_id;
  
  RETURN v_id;
END;
$function$
