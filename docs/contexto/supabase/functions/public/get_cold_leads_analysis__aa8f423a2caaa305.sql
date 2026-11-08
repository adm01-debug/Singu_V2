CREATE OR REPLACE FUNCTION public.get_cold_leads_analysis(p_days integer DEFAULT 60)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
DECLARE
  result jsonb;
BEGIN
  SELECT jsonb_build_object(
    'dias_sem_contato', p_days,
    'total_leads_frios', (
      SELECT COUNT(*) FROM companies c
      WHERE c.deleted_at IS NULL
      AND NOT EXISTS (SELECT 1 FROM interactions i WHERE i.company_id = c.id AND i.created_at >= now() - (p_days || ' days')::interval)
    ),
    'por_vendedor', (
      SELECT jsonb_agg(row_to_json(t) ORDER BY t.leads_frios DESC)
      FROM (
        SELECT 
          s.nome,
          COUNT(c.id) as leads_frios
        FROM companies c
        JOIN customers cu ON cu.company_id = c.id AND cu.deleted_at IS NULL
        JOIN salespeople s ON s.id = cu.vendedor_id
        WHERE c.deleted_at IS NULL
        AND NOT EXISTS (SELECT 1 FROM interactions i WHERE i.company_id = c.id AND i.created_at >= now() - (p_days || ' days')::interval)
        GROUP BY s.id, s.nome
      ) t
    ),
    'top_leads_frios_valor', (
      SELECT jsonb_agg(row_to_json(t))
      FROM (
        SELECT c.id, c.nome_crm, cu.valor_total_compras,
               (SELECT MAX(created_at) FROM interactions WHERE company_id = c.id) as ultima_interacao
        FROM companies c
        JOIN customers cu ON cu.company_id = c.id AND cu.deleted_at IS NULL
        WHERE c.deleted_at IS NULL AND cu.ja_comprou = true
        AND NOT EXISTS (SELECT 1 FROM interactions i WHERE i.company_id = c.id AND i.created_at >= now() - (p_days || ' days')::interval)
        ORDER BY cu.valor_total_compras DESC NULLS LAST
        LIMIT 10
      ) t
    )
  ) INTO result;
  
  RETURN result;
END;
$function$
