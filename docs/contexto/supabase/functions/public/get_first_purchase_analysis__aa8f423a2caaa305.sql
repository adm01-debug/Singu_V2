CREATE OR REPLACE FUNCTION public.get_first_purchase_analysis(p_days integer DEFAULT 90)
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
    'primeiras_compras', (
      SELECT jsonb_agg(row_to_json(t) ORDER BY t.data_compra DESC)
      FROM (
        SELECT c.id, c.nome_crm, cu.valor_total_compras, cu.updated_at as data_compra, s.nome as vendedor
        FROM customers cu
        JOIN companies c ON c.id = cu.company_id
        LEFT JOIN salespeople s ON s.id = cu.vendedor_id
        WHERE cu.ja_comprou = true
        AND cu.total_pedidos = 1
        AND cu.updated_at >= now() - (p_days || ' days')::interval
        AND cu.deleted_at IS NULL
        ORDER BY cu.updated_at DESC
        LIMIT 20
      ) t
    ),
    'total_novas_conversoes', (
      SELECT COUNT(*) FROM customers
      WHERE ja_comprou = true AND total_pedidos = 1 AND updated_at >= now() - (p_days || ' days')::interval AND deleted_at IS NULL
    ),
    'valor_primeiras_compras', (
      SELECT COALESCE(SUM(valor_total_compras), 0) FROM customers
      WHERE ja_comprou = true AND total_pedidos = 1 AND updated_at >= now() - (p_days || ' days')::interval AND deleted_at IS NULL
    )
  ) INTO result;
  
  RETURN result;
END;
$function$
