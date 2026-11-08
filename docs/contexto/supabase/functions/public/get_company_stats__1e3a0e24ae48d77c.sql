CREATE OR REPLACE FUNCTION public.get_company_stats(p_company_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
DECLARE
  result jsonb;
BEGIN
  SELECT jsonb_build_object(
    'company_id', p_company_id,
    'empresa', (SELECT row_to_json(c) FROM companies c WHERE c.id = p_company_id),
    'contatos', (SELECT COUNT(*) FROM contacts WHERE company_id = p_company_id AND deleted_at IS NULL),
    'interacoes', jsonb_build_object(
      'total', (SELECT COUNT(*) FROM interactions WHERE company_id = p_company_id),
      'ultimos_30_dias', (SELECT COUNT(*) FROM interactions WHERE company_id = p_company_id AND created_at >= now() - interval '30 days'),
      'ultima', (SELECT MAX(created_at) FROM interactions WHERE company_id = p_company_id)
    ),
    'cliente', (SELECT row_to_json(cu) FROM customers cu WHERE cu.company_id = p_company_id AND cu.deleted_at IS NULL LIMIT 1),
    'alertas_pendentes', (SELECT COUNT(*) FROM alerts WHERE company_id = p_company_id AND resolved_at IS NULL)
  ) INTO result;
  
  RETURN result;
END;
$function$
