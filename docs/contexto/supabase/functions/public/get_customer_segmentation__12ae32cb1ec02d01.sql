CREATE OR REPLACE FUNCTION public.get_customer_segmentation()
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
    'segments', jsonb_build_object(
      'vip', (
        SELECT COUNT(*) FROM customers 
        WHERE ja_comprou = true AND cliente_ativado = true 
        AND valor_total_compras > (SELECT AVG(valor_total_compras) * 2 FROM customers WHERE ja_comprou = true)
        AND deleted_at IS NULL
      ),
      'regular', (
        SELECT COUNT(*) FROM customers 
        WHERE ja_comprou = true AND cliente_ativado = true 
        AND valor_total_compras BETWEEN 
          (SELECT AVG(valor_total_compras) * 0.5 FROM customers WHERE ja_comprou = true) AND
          (SELECT AVG(valor_total_compras) * 2 FROM customers WHERE ja_comprou = true)
        AND deleted_at IS NULL
      ),
      'new', (
        SELECT COUNT(*) FROM customers 
        WHERE cliente_ativado = true AND ja_comprou = false AND deleted_at IS NULL
      ),
      'inactive', (
        SELECT COUNT(*) FROM customers 
        WHERE cliente_ativado = false AND deleted_at IS NULL
      ),
      'one_time', (
        SELECT COUNT(*) FROM customers 
        WHERE ja_comprou = true AND total_pedidos = 1 AND deleted_at IS NULL
      )
    ),
    'metrics', jsonb_build_object(
      'avg_ticket', (SELECT COALESCE(AVG(ticket_medio), 0) FROM customers WHERE ticket_medio > 0 AND deleted_at IS NULL),
      'avg_total_compras', (SELECT COALESCE(AVG(valor_total_compras), 0) FROM customers WHERE valor_total_compras > 0 AND deleted_at IS NULL),
      'total_revenue', (SELECT COALESCE(SUM(valor_total_compras), 0) FROM customers WHERE deleted_at IS NULL)
    )
  ) INTO result;
  
  RETURN result;
END;
$function$
