CREATE OR REPLACE FUNCTION public.get_customers_report()
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
    'totais', jsonb_build_object(
      'total', (SELECT COUNT(*) FROM customers WHERE deleted_at IS NULL),
      'ativados', (SELECT COUNT(*) FROM customers WHERE cliente_ativado = true AND deleted_at IS NULL),
      'compradores', (SELECT COUNT(*) FROM customers WHERE ja_comprou = true AND deleted_at IS NULL),
      'valor_total', (SELECT COALESCE(SUM(valor_total_compras), 0) FROM customers WHERE deleted_at IS NULL)
    ),
    'distribuicao_valor', jsonb_build_object(
      'acima_100k', (SELECT COUNT(*) FROM customers WHERE valor_total_compras >= 100000 AND deleted_at IS NULL),
      'entre_50k_100k', (SELECT COUNT(*) FROM customers WHERE valor_total_compras >= 50000 AND valor_total_compras < 100000 AND deleted_at IS NULL),
      'entre_10k_50k', (SELECT COUNT(*) FROM customers WHERE valor_total_compras >= 10000 AND valor_total_compras < 50000 AND deleted_at IS NULL),
      'abaixo_10k', (SELECT COUNT(*) FROM customers WHERE (valor_total_compras < 10000 OR valor_total_compras IS NULL) AND deleted_at IS NULL)
    ),
    'ticket_medio_global', (SELECT ROUND(AVG(ticket_medio), 2) FROM customers WHERE ticket_medio > 0 AND deleted_at IS NULL),
    'top_10', (
      SELECT jsonb_agg(row_to_json(t))
      FROM (
        SELECT c.nome_crm, cu.valor_total_compras, cu.total_pedidos, s.nome as vendedor
        FROM customers cu
        JOIN companies c ON c.id = cu.company_id
        LEFT JOIN salespeople s ON s.id = cu.vendedor_id
        WHERE cu.deleted_at IS NULL
        ORDER BY cu.valor_total_compras DESC NULLS LAST
        LIMIT 10
      ) t
    )
  ) INTO result;
  
  RETURN result;
END;
$function$
