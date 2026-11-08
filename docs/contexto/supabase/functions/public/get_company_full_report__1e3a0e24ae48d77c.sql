CREATE OR REPLACE FUNCTION public.get_company_full_report(p_company_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
DECLARE
  result jsonb;
BEGIN
  SELECT jsonb_build_object(
    'timestamp', now(),
    'empresa', (
      SELECT row_to_json(c) FROM companies c WHERE c.id = p_company_id
    ),
    'customer', (
      SELECT row_to_json(cu) FROM customers cu WHERE cu.company_id = p_company_id AND cu.deleted_at IS NULL LIMIT 1
    ),
    'contatos', (
      SELECT jsonb_agg(row_to_json(ct))
      FROM contacts ct
      WHERE ct.company_id = p_company_id AND ct.deleted_at IS NULL
    ),
    'metricas', jsonb_build_object(
      'total_interacoes', (SELECT COUNT(*) FROM interactions WHERE company_id = p_company_id),
      'ultima_interacao', (SELECT MAX(created_at) FROM interactions WHERE company_id = p_company_id),
      'dias_sem_contato', EXTRACT(DAY FROM now() - (SELECT MAX(created_at) FROM interactions WHERE company_id = p_company_id))::int,
      'total_contatos', (SELECT COUNT(*) FROM contacts WHERE company_id = p_company_id AND deleted_at IS NULL),
      'total_alertas', (SELECT COUNT(*) FROM alerts WHERE company_id = p_company_id)
    ),
    'ultimas_interacoes', (
      SELECT jsonb_agg(row_to_json(i))
      FROM (
        SELECT tipo_interacao, canal, created_at, LEFT(resumo_interacao, 100) as resumo
        FROM interactions
        WHERE company_id = p_company_id
        ORDER BY created_at DESC
        LIMIT 5
      ) i
    ),
    'engagement', get_engagement_score(p_company_id)
  ) INTO result;
  
  RETURN result;
END;
$function$
