CREATE OR REPLACE FUNCTION public.export_customer_data_lgpd(p_company_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE
  v_result jsonb;
BEGIN
  SELECT jsonb_build_object(
    'export_date', NOW(),
    'export_type', 'LGPD_DATA_PORTABILITY',
    'company', (
      SELECT to_jsonb(c.*) - 'user_id' - 'deleted_at'
      FROM companies c WHERE id = p_company_id
    ),
    'contacts', (
      SELECT COALESCE(jsonb_agg(to_jsonb(ct) - 'user_id'), '[]'::jsonb)
      FROM contacts ct WHERE company_id = p_company_id
    ),
    'interactions', (
      SELECT COALESCE(jsonb_agg(jsonb_build_object(
        'date', i.data_interacao,
        'type', i.type,
        'notes', COALESCE(i.resumo, i.content)
      ) ORDER BY i.data_interacao DESC), '[]'::jsonb)
      FROM interactions i WHERE i.company_id = p_company_id
    ),
    'addresses', (
      SELECT COALESCE(jsonb_agg(to_jsonb(a) - 'id' - 'company_id'), '[]'::jsonb)
      FROM addresses a WHERE company_id = p_company_id
    )
  ) INTO v_result;
  
  INSERT INTO activity_logs (user_id, action, entity_type, entity_id, details)
  VALUES (auth.uid(), 'lgpd_export', 'company', p_company_id, jsonb_build_object('export_type', 'data_portability'));
  
  RETURN v_result;
END;
$function$
