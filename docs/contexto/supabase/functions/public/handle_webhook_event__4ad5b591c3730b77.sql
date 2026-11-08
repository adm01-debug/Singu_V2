CREATE OR REPLACE FUNCTION public.handle_webhook_event(p_event_type text, p_payload jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE
  result jsonb;
BEGIN
  IF auth.uid() IS NOT NULL THEN
    RAISE EXCEPTION 'This function is reserved for the service role'
      USING ERRCODE = 'insufficient_privilege';
  END IF;
  -- Log do evento
  INSERT INTO webhook_logs (event_type, payload, created_at)
  VALUES (p_event_type, p_payload, now())
  ON CONFLICT DO NOTHING;
  
  -- Processar baseado no tipo
  CASE p_event_type
    WHEN 'company.created' THEN
      result := jsonb_build_object('processed', true, 'event', p_event_type);
    WHEN 'interaction.created' THEN
      result := jsonb_build_object('processed', true, 'event', p_event_type);
    ELSE
      result := jsonb_build_object('processed', false, 'message', 'Evento não reconhecido');
  END CASE;
  
  RETURN result;
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('processed', false, 'error', SQLERRM);
END;
$function$
