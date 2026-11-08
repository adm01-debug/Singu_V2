CREATE OR REPLACE FUNCTION public.prepare_n8n_webhook_data(p_event_type text, p_entity_type text, p_entity_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
DECLARE
  v_result JSONB;
BEGIN
  IF p_entity_type = 'company' THEN
    SELECT jsonb_build_object(
      'event_type', p_event_type,
      'timestamp', NOW(),
      'entity', jsonb_build_object(
        'type', 'company',
        'id', c.id,
        'nome_fantasia', c.nome_fantasia,
        'cnpj', c.cnpj,
        'status', c.status
      )
    ) INTO v_result
    FROM companies c WHERE c.id = p_entity_id;
  ELSIF p_entity_type = 'interaction' THEN
    SELECT jsonb_build_object(
      'event_type', p_event_type,
      'timestamp', NOW(),
      'entity', jsonb_build_object(
        'type', 'interaction',
        'id', i.id,
        'company_id', i.company_id,
        'channel', i.channel
      )
    ) INTO v_result
    FROM interactions i WHERE i.id = p_entity_id;
  END IF;
  
  RETURN COALESCE(v_result, '{}'::JSONB);
END;
$function$
