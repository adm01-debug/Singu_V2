CREATE OR REPLACE FUNCTION public.get_new_customers_report(p_days integer DEFAULT 30)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
DECLARE
  result jsonb;
  start_date timestamptz := now() - (p_days || ' days')::interval;
BEGIN
  SELECT jsonb_build_object(
    'periodo_dias', p_days,
    'resumo', jsonb_build_object(
      'total_novos', (SELECT COUNT(*) FROM customers WHERE created_at >= start_date AND deleted_at IS NULL),
      'ativados', (SELECT COUNT(*) FROM customers WHERE created_at >= start_date AND cliente_ativado = true AND deleted_at IS NULL),
      'compradores', (SELECT COUNT(*) FROM customers WHERE created_at >= start_date AND ja_comprou = true AND deleted_at IS NULL),
      'valor_total', (SELECT COALESCE(SUM(valor_total_compras), 0) FROM customers WHERE created_at >= start_date AND ja_comprou = true AND deleted_at IS NULL)
    ),
    'por_vendedor', (
      SELECT jsonb_agg(row_to_json(t) ORDER BY t.total DESC)
      FROM (
        SELECT 
          s.nome as vendedor,
          COUNT(cu.id) as total,
          COUNT(cu.id) FILTER (WHERE cu.cliente_ativado = true) as ativados,
          COUNT(cu.id) FILTER (WHERE cu.ja_comprou = true) as compradores,
          COALESCE(SUM(cu.valor_total_compras), 0) as valor
        FROM salespeople s
        LEFT JOIN customers cu ON cu.vendedor_id = s.id AND cu.created_at >= start_date AND cu.deleted_at IS NULL
        GROUP BY s.id, s.nome
      ) t
    ),
    'lista_novos', (
      SELECT jsonb_agg(row_to_json(t) ORDER BY t.created_at DESC)
      FROM (
        SELECT 
          cu.id,
          c.nome_crm,
          s.nome as vendedor,
          cu.cliente_ativado,
          cu.ja_comprou,
          cu.valor_total_compras,
          cu.created_at
        FROM customers cu
        JOIN companies c ON c.id = cu.company_id
        LEFT JOIN salespeople s ON s.id = cu.vendedor_id
        WHERE cu.created_at >= start_date AND cu.deleted_at IS NULL
        LIMIT 50
      ) t
    )
  ) INTO result;
  
  RETURN result;
END;
$function$
