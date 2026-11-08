CREATE OR REPLACE FUNCTION public.prepare_webhook_payload(p_event_type text, p_entity_type text, p_entity_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
DECLARE v_payload jsonb;
BEGIN
  CASE p_entity_type
    WHEN 'company' THEN
      SELECT jsonb_build_object('event', p_event_type, 'entity_type', p_entity_type, 'entity_id', p_entity_id, 'timestamp', NOW(),
        'data', jsonb_build_object('id', c.id, 'nome', COALESCE(c.nome_fantasia, c.nome_crm), 'cnpj', c.cnpj, 'status', c.status)) INTO v_payload FROM companies c WHERE c.id = p_entity_id;
    WHEN 'deal' THEN
      SELECT jsonb_build_object('event', p_event_type, 'entity_type', p_entity_type, 'entity_id', p_entity_id, 'timestamp', NOW(),
        'data', jsonb_build_object('id', d.id, 'titulo', d.titulo, 'valor', d.valor, 'status', d.status)) INTO v_payload FROM deals d WHERE d.id = p_entity_id;
    ELSE
      v_payload := jsonb_build_object('event', p_event_type, 'entity_type', p_entity_type, 'entity_id', p_entity_id, 'timestamp', NOW());
  END CASE;
  RETURN v_payload;
END;
$function$
