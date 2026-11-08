CREATE OR REPLACE FUNCTION public.get_customer_statistics()
 RETURNS json
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  RETURN json_build_object(
    'total_registros', (SELECT count(*) FROM customers WHERE deleted_at IS NULL),
    'ativados', (SELECT count(*) FROM customers WHERE cliente_ativado = true AND deleted_at IS NULL),
    'ja_compraram', (SELECT count(*) FROM customers WHERE ja_comprou = true AND deleted_at IS NULL),
    'com_vendedor', (SELECT count(*) FROM customers WHERE vendedor_id IS NOT NULL AND deleted_at IS NULL),
    'com_pedidos', (SELECT count(*) FROM customers WHERE total_pedidos > 0 AND deleted_at IS NULL),
    'vazios', (SELECT count(*) FROM customers WHERE 
      cliente_ativado = false AND ja_comprou = false 
      AND vendedor_id IS NULL AND total_pedidos = 0 
      AND valor_total_compras = 0 AND deleted_at IS NULL),
    'valor_total_geral', (SELECT COALESCE(SUM(valor_total_compras), 0) FROM customers WHERE deleted_at IS NULL),
    'total_pedidos_geral', (SELECT COALESCE(SUM(total_pedidos), 0) FROM customers WHERE deleted_at IS NULL),
    'generated_at', NOW()
  );
END;
$function$
