CREATE OR REPLACE FUNCTION public.prepare_generic_webhook(p_event_type text, p_entity_type text, p_entity_id uuid, p_extra_data jsonb DEFAULT '{}'::jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
DECLARE
  v_entity_data jsonb;
BEGIN
  IF p_entity_type = 'company' THEN
    SELECT to_jsonb(c) INTO v_entity_data FROM companies c WHERE id = p_entity_id;
  ELSIF p_entity_type = 'contact' THEN
    SELECT to_jsonb(ct) INTO v_entity_data FROM contacts ct WHERE id = p_entity_id;
  ELSIF p_entity_type = 'interaction' THEN
    SELECT to_jsonb(i) INTO v_entity_data FROM interactions i WHERE id = p_entity_id;
  END IF;
  
  RETURN jsonb_build_object(
    'event', p_event_type,
    'entity_type', p_entity_type,
    'entity_id', p_entity_id,
    'timestamp', NOW(),
    'data', COALESCE(v_entity_data, '{}'::jsonb),
    'extra', p_extra_data
  );
END;
$function$
