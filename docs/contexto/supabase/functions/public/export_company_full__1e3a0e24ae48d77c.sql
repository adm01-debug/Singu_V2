CREATE OR REPLACE FUNCTION public.export_company_full(p_company_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
DECLARE
  v_result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'exported_at', NOW(),
    'company', (SELECT row_to_json(c) FROM companies c WHERE id = p_company_id),
    'contacts', (
      SELECT jsonb_agg(row_to_json(ct))
      FROM contacts ct WHERE company_id = p_company_id AND deleted_at IS NULL
    ),
    'addresses', (
      SELECT jsonb_agg(row_to_json(ca))
      FROM company_addresses ca WHERE company_id = p_company_id
    ),
    'interactions_count', (SELECT COUNT(*) FROM interactions WHERE company_id = p_company_id),
    'recent_interactions', (
      SELECT jsonb_agg(jsonb_build_object(
        'id', i.id, 'type', i.type, 'channel', i.channel,
        'created_at', i.created_at, 'sentiment', i.sentiment
      ))
      FROM (SELECT * FROM interactions WHERE company_id = p_company_id ORDER BY created_at DESC LIMIT 20) i
    )
  ) INTO v_result;
  
  RETURN v_result;
END;
$function$
