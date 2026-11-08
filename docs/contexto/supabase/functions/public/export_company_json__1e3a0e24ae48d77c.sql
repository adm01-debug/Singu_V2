CREATE OR REPLACE FUNCTION public.export_company_json(p_company_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
DECLARE
  result jsonb;
BEGIN
  SELECT jsonb_build_object(
    'exportado_em', now(),
    'empresa', (SELECT row_to_json(c) FROM companies c WHERE c.id = p_company_id),
    'contatos', (SELECT jsonb_agg(row_to_json(ct)) FROM contacts ct WHERE ct.company_id = p_company_id AND ct.deleted_at IS NULL),
    'cliente', (SELECT row_to_json(cu) FROM customers cu WHERE cu.company_id = p_company_id AND cu.deleted_at IS NULL),
    'interacoes', (
      SELECT jsonb_agg(row_to_json(i) ORDER BY i.created_at DESC)
      FROM interactions i WHERE i.company_id = p_company_id
    ),
    'alertas', (
      SELECT jsonb_agg(row_to_json(a))
      FROM alerts a WHERE a.company_id = p_company_id
    )
  ) INTO result;
  
  RETURN result;
END;
$function$
