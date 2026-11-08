CREATE OR REPLACE FUNCTION public.get_opportunities_map(p_limit integer DEFAULT 100)
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
    'leads_quentes', (
      SELECT jsonb_agg(row_to_json(t))
      FROM (
        SELECT c.id, c.nome_crm, c.cidade, c.uf, COUNT(i.id) as interacoes_recentes
        FROM companies c
        JOIN interactions i ON i.company_id = c.id AND i.created_at >= now() - interval '14 days'
        LEFT JOIN customers cu ON cu.company_id = c.id
        WHERE c.deleted_at IS NULL AND (cu.ja_comprou IS NULL OR cu.ja_comprou = false)
        GROUP BY c.id, c.nome_crm, c.cidade, c.uf
        HAVING COUNT(i.id) >= 2
        ORDER BY COUNT(i.id) DESC
        LIMIT 20
      ) t
    ),
    'clientes_reativacao', (
      SELECT jsonb_agg(row_to_json(t))
      FROM (
        SELECT c.id, c.nome_crm, cu.valor_total_compras,
               EXTRACT(DAY FROM now() - (SELECT MAX(created_at) FROM interactions WHERE company_id = c.id))::int as dias_inativo
        FROM companies c
        JOIN customers cu ON cu.company_id = c.id
        WHERE cu.ja_comprou = true AND cu.deleted_at IS NULL
        AND NOT EXISTS (SELECT 1 FROM interactions i WHERE i.company_id = c.id AND i.created_at >= now() - interval '60 days')
        ORDER BY cu.valor_total_compras DESC NULLS LAST
        LIMIT 20
      ) t
    ),
    'empresas_sem_vendedor', (
      SELECT jsonb_agg(row_to_json(t))
      FROM (
        SELECT c.id, c.nome_crm, c.cidade, c.uf
        FROM companies c
        LEFT JOIN customers cu ON cu.company_id = c.id AND cu.deleted_at IS NULL
        WHERE c.deleted_at IS NULL AND cu.vendedor_id IS NULL
        ORDER BY c.created_at DESC
        LIMIT 20
      ) t
    )
  ) INTO result;
  
  RETURN result;
END;
$function$
