CREATE OR REPLACE FUNCTION public.get_hot_leads_analysis(p_days integer DEFAULT 7)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
DECLARE
  result jsonb;
BEGIN
  SELECT jsonb_build_object(
    'dias_recentes', p_days,
    'total_leads_quentes', (
      SELECT COUNT(DISTINCT company_id) FROM interactions WHERE created_at >= now() - (p_days || ' days')::interval
    ),
    'leads_multiplas_interacoes', (
      SELECT jsonb_agg(row_to_json(t))
      FROM (
        SELECT c.id, c.nome_crm, COUNT(i.id) as interacoes_recentes
        FROM companies c
        JOIN interactions i ON i.company_id = c.id AND i.created_at >= now() - (p_days || ' days')::interval
        WHERE c.deleted_at IS NULL
        GROUP BY c.id, c.nome_crm
        HAVING COUNT(i.id) >= 2
        ORDER BY COUNT(i.id) DESC
        LIMIT 20
      ) t
    ),
    'leads_nao_clientes', (
      SELECT jsonb_agg(row_to_json(t))
      FROM (
        SELECT c.id, c.nome_crm, COUNT(i.id) as interacoes
        FROM companies c
        JOIN interactions i ON i.company_id = c.id AND i.created_at >= now() - (p_days || ' days')::interval
        LEFT JOIN customers cu ON cu.company_id = c.id
        WHERE c.deleted_at IS NULL AND (cu.ja_comprou IS NULL OR cu.ja_comprou = false)
        GROUP BY c.id, c.nome_crm
        ORDER BY COUNT(i.id) DESC
        LIMIT 15
      ) t
    )
  ) INTO result;
  
  RETURN result;
END;
$function$
