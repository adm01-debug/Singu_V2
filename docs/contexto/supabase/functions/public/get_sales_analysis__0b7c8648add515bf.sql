CREATE OR REPLACE FUNCTION public.get_sales_analysis(p_start_date date DEFAULT ((now() - '30 days'::interval))::date, p_end_date date DEFAULT CURRENT_DATE)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
DECLARE
  result jsonb;
BEGIN
  SELECT jsonb_build_object(
    'periodo', jsonb_build_object('inicio', p_start_date, 'fim', p_end_date),
    'resumo', jsonb_build_object(
      'total_clientes_novos', (SELECT COUNT(*) FROM customers WHERE created_at::date BETWEEN p_start_date AND p_end_date AND deleted_at IS NULL),
      'total_ativados', (SELECT COUNT(*) FROM customers WHERE cliente_ativado = true AND updated_at::date BETWEEN p_start_date AND p_end_date AND deleted_at IS NULL),
      'valor_total', (SELECT COALESCE(SUM(valor_total_compras), 0) FROM customers WHERE updated_at::date BETWEEN p_start_date AND p_end_date AND ja_comprou = true AND deleted_at IS NULL),
      'ticket_medio', (SELECT COALESCE(AVG(ticket_medio), 0) FROM customers WHERE updated_at::date BETWEEN p_start_date AND p_end_date AND ticket_medio > 0 AND deleted_at IS NULL)
    ),
    'por_vendedor', (
      SELECT jsonb_agg(row_to_json(t) ORDER BY t.valor DESC)
      FROM (
        SELECT 
          s.nome as vendedor,
          COUNT(cu.id) as clientes,
          COALESCE(SUM(cu.valor_total_compras), 0) as valor,
          COALESCE(AVG(cu.ticket_medio), 0) as ticket_medio
        FROM salespeople s
        LEFT JOIN customers cu ON cu.vendedor_id = s.id AND cu.updated_at::date BETWEEN p_start_date AND p_end_date AND cu.deleted_at IS NULL
        GROUP BY s.id, s.nome
      ) t
    ),
    'evolucao_diaria', (
      SELECT jsonb_agg(row_to_json(t) ORDER BY t.dia)
      FROM (
        SELECT 
          updated_at::date as dia,
          COUNT(*) as novos_clientes,
          COALESCE(SUM(valor_total_compras), 0) as valor
        FROM customers
        WHERE updated_at::date BETWEEN p_start_date AND p_end_date
        AND deleted_at IS NULL
        GROUP BY updated_at::date
      ) t
    )
  ) INTO result;
  
  RETURN result;
END;
$function$
