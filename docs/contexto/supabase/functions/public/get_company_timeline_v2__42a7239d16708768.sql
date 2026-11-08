CREATE OR REPLACE FUNCTION public.get_company_timeline_v2(p_company_id uuid, p_limit integer DEFAULT 50)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
DECLARE
  v_result JSONB;
BEGIN
  SELECT jsonb_agg(event ORDER BY (event->>'event_date')::TIMESTAMPTZ DESC) INTO v_result
  FROM (
    SELECT jsonb_build_object(
      'event_date', created_at,
      'event_type', 'interaction',
      'event_title', COALESCE(title, type, 'Interação'),
      'event_data', jsonb_build_object('id', id, 'channel', channel, 'direction', direction)
    ) as event
    FROM interactions WHERE company_id = p_company_id
    
    UNION ALL
    
    SELECT jsonb_build_object(
      'event_date', created_at,
      'event_type', 'contact_created',
      'event_title', 'Novo contato: ' || full_name,
      'event_data', jsonb_build_object('id', id, 'cargo', cargo)
    )
    FROM contacts WHERE company_id = p_company_id AND deleted_at IS NULL
    
    UNION ALL
    
    SELECT jsonb_build_object(
      'event_date', created_at,
      'event_type', 'company_created',
      'event_title', 'Empresa cadastrada',
      'event_data', jsonb_build_object('id', id, 'cnpj', cnpj)
    )
    FROM companies WHERE id = p_company_id
  ) sub
  LIMIT p_limit;
  
  RETURN COALESCE(v_result, '[]'::JSONB);
END;
$function$
