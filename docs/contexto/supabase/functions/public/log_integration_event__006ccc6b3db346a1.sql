CREATE OR REPLACE FUNCTION public.log_integration_event(p_integration text, p_event text, p_status text, p_request jsonb DEFAULT NULL::jsonb, p_response jsonb DEFAULT NULL::jsonb)
 RETURNS uuid
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE v_id uuid;
BEGIN
  IF auth.uid() IS NOT NULL THEN
    RAISE EXCEPTION 'This function is reserved for the service role'
      USING ERRCODE = 'insufficient_privilege';
  END IF;
  INSERT INTO integration_logs (integration_name, event_type, status, request_payload, response_payload)
  VALUES (p_integration, p_event, p_status, p_request, p_response)
  RETURNING id INTO v_id;
  RETURN v_id;
EXCEPTION WHEN undefined_table THEN
  -- Criar tabela se não existir
  CREATE TABLE IF NOT EXISTS integration_logs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    integration_name text NOT NULL,
    event_type text NOT NULL,
    status text NOT NULL,
    request_payload jsonb,
    response_payload jsonb,
    created_at timestamptz DEFAULT NOW()
  );
  INSERT INTO integration_logs (integration_name, event_type, status, request_payload, response_payload)
  VALUES (p_integration, p_event, p_status, p_request, p_response)
  RETURNING id INTO v_id;
  RETURN v_id;
END;
$function$
