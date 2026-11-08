CREATE OR REPLACE FUNCTION public.get_repurchase_analysis(p_days integer DEFAULT 90)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
DECLARE
  result jsonb;
BEGIN
  SELECT jsonb_build_object(
    'periodo_dias', p_days,
    'clientes_recorrentes', (
      SELECT COUNT(*) FROM customers
      WHERE ja_comprou = true AND total_pedidos > 1 AND deleted_at IS NULL
    ),
    'taxa_recompra', ROUND(
      (SELECT COUNT(*) FROM customers WHERE ja_comprou = true AND total_pedidos > 1 AND deleted_at IS NULL)::numeric /
      NULLIF((SELECT COUNT(*) FROM customers WHERE ja_comprou = true AND deleted_at IS NULL), 0) * 100, 2
    ),
    'top_recorrentes', (
      SELECT jsonb_agg(row_to_json(t))
      FROM (
        SELECT c.nome_crm, cu.total_pedidos, cu.valor_total_compras, cu.ticket_medio
        FROM customers cu
        JOIN companies c ON c.id = cu.company_id
        WHERE cu.ja_comprou = true AND cu.total_pedidos > 1 AND cu.deleted_at IS NULL
        ORDER BY cu.total_pedidos DESC
        LIMIT 10
      ) t
    )
  ) INTO result;
  
  RETURN result;
END;
$function$
