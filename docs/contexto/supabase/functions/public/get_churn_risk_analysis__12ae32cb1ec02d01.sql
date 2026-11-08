CREATE OR REPLACE FUNCTION public.get_churn_risk_analysis()
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
    'categorias_risco', jsonb_build_object(
      'alto_risco', (
        SELECT COUNT(*) FROM customers cu
        WHERE cu.cliente_ativado = true AND cu.deleted_at IS NULL
        AND NOT EXISTS (SELECT 1 FROM interactions i WHERE i.company_id = cu.company_id AND i.created_at >= now() - interval '60 days')
      ),
      'medio_risco', (
        SELECT COUNT(*) FROM customers cu
        WHERE cu.cliente_ativado = true AND cu.deleted_at IS NULL
        AND EXISTS (SELECT 1 FROM interactions i WHERE i.company_id = cu.company_id AND i.created_at >= now() - interval '60 days' AND i.created_at < now() - interval '30 days')
      ),
      'baixo_risco', (
        SELECT COUNT(*) FROM customers cu
        WHERE cu.cliente_ativado = true AND cu.deleted_at IS NULL
        AND EXISTS (SELECT 1 FROM interactions i WHERE i.company_id = cu.company_id AND i.created_at >= now() - interval '30 days')
      )
    ),
    'clientes_alto_risco', (
      SELECT jsonb_agg(row_to_json(t) ORDER BY t.dias_sem_interacao DESC)
      FROM (
        SELECT 
          cu.company_id,
          c.nome_crm,
          cu.valor_total_compras,
          EXTRACT(DAY FROM now() - (SELECT MAX(created_at) FROM interactions WHERE company_id = cu.company_id))::int as dias_sem_interacao,
          s.nome as vendedor
        FROM customers cu
        JOIN companies c ON c.id = cu.company_id
        LEFT JOIN salespeople s ON s.id = cu.vendedor_id
        WHERE cu.cliente_ativado = true AND cu.deleted_at IS NULL
        AND NOT EXISTS (SELECT 1 FROM interactions i WHERE i.company_id = cu.company_id AND i.created_at >= now() - interval '60 days')
        ORDER BY cu.valor_total_compras DESC NULLS LAST
        LIMIT 20
      ) t
    ),
    'valor_em_risco', (
      SELECT COALESCE(SUM(valor_total_compras), 0) FROM customers cu
      WHERE cu.cliente_ativado = true AND cu.deleted_at IS NULL
      AND NOT EXISTS (SELECT 1 FROM interactions i WHERE i.company_id = cu.company_id AND i.created_at >= now() - interval '60 days')
    )
  ) INTO result;
  
  RETURN result;
END;
$function$
