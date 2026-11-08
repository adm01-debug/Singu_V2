CREATE OR REPLACE FUNCTION public.get_churn_analysis(p_days_inactive integer DEFAULT 90)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
DECLARE
  result jsonb;
  cutoff_date timestamptz := now() - (p_days_inactive || ' days')::interval;
BEGIN
  SELECT jsonb_build_object(
    'dias_inatividade', p_days_inactive,
    'data_corte', cutoff_date,
    'total_clientes_ativos', (
      SELECT COUNT(*) FROM customers WHERE cliente_ativado = true AND deleted_at IS NULL
    ),
    'clientes_inativos', (
      SELECT COUNT(*) FROM customers cu
      WHERE cu.cliente_ativado = true AND cu.deleted_at IS NULL
      AND NOT EXISTS (
        SELECT 1 FROM interactions i 
        WHERE i.company_id = cu.company_id AND i.created_at >= cutoff_date
      )
    ),
    'taxa_churn_potencial', (
      SELECT ROUND(
        (COUNT(*) FILTER (WHERE NOT EXISTS (
          SELECT 1 FROM interactions i 
          WHERE i.company_id = cu.company_id AND i.created_at >= cutoff_date
        ))::numeric / NULLIF(COUNT(*), 0)) * 100, 2
      )
      FROM customers cu
      WHERE cu.cliente_ativado = true AND cu.deleted_at IS NULL
    ),
    'top_10_risco', (
      SELECT jsonb_agg(row_to_json(t))
      FROM (
        SELECT 
          cu.company_id,
          co.nome_crm,
          cu.valor_total_compras,
          (SELECT MAX(created_at) FROM interactions WHERE company_id = cu.company_id) as ultima_interacao
        FROM customers cu
        JOIN companies co ON co.id = cu.company_id
        WHERE cu.cliente_ativado = true AND cu.deleted_at IS NULL
        AND NOT EXISTS (
          SELECT 1 FROM interactions i 
          WHERE i.company_id = cu.company_id AND i.created_at >= cutoff_date
        )
        ORDER BY cu.valor_total_compras DESC NULLS LAST
        LIMIT 10
      ) t
    )
  ) INTO result;
  
  RETURN result;
END;
$function$
