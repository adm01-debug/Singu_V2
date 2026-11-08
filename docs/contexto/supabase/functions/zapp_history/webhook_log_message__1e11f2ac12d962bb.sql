CREATE OR REPLACE FUNCTION zapp_history.webhook_log_message(p_direction text, p_whatsapp_number text, p_push_name text DEFAULT NULL::text, p_message_text text DEFAULT NULL::text, p_raw_payload jsonb DEFAULT NULL::jsonb, p_bitrix_response jsonb DEFAULT NULL::jsonb, p_evolution_response jsonb DEFAULT NULL::jsonb)
 RETURNS TABLE(log_id bigint, processed boolean, message_id uuid, parse_error text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'zapp_history', 'pg_temp'
AS $function$
DECLARE
  v_log_id BIGINT;
BEGIN
  IF p_direction NOT IN ('inbound','outbound','open-chat') THEN
    RAISE EXCEPTION 'invalid direction: %', p_direction;
  END IF;
  IF p_whatsapp_number IS NULL OR p_whatsapp_number = '' THEN
    RAISE EXCEPTION 'whatsapp_number required';
  END IF;

  INSERT INTO public.connector_log (
    direction, whatsapp_number, push_name, message_text,
    raw_payload, bitrix_response, evolution_response
  ) VALUES (
    p_direction, p_whatsapp_number, p_push_name, p_message_text,
    p_raw_payload, p_bitrix_response, p_evolution_response
  )
  RETURNING id INTO v_log_id;

  -- Retorna o estado pós-trigger
  RETURN QUERY
  SELECT cl.id, cl.processed, cl.zapp_message_id, cl.parse_error
  FROM public.connector_log cl
  WHERE cl.id = v_log_id;
END;
$function$
