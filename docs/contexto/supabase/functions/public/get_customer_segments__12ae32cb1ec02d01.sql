CREATE OR REPLACE FUNCTION public.get_customer_segments()
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
    'segmentos', jsonb_build_object(
      'vip', jsonb_build_object(
        'criterio', 'valor_total >= 100000',
        'total', (SELECT COUNT(*) FROM customers WHERE valor_total_compras >= 100000 AND deleted_at IS NULL),
        'valor_agregado', (SELECT COALESCE(SUM(valor_total_compras), 0) FROM customers WHERE valor_total_compras >= 100000 AND deleted_at IS NULL)
      ),
      'premium', jsonb_build_object(
        'criterio', 'valor_total entre 50000 e 99999',
        'total', (SELECT COUNT(*) FROM customers WHERE valor_total_compras >= 50000 AND valor_total_compras < 100000 AND deleted_at IS NULL),
        'valor_agregado', (SELECT COALESCE(SUM(valor_total_compras), 0) FROM customers WHERE valor_total_compras >= 50000 AND valor_total_compras < 100000 AND deleted_at IS NULL)
      ),
      'regular', jsonb_build_object(
        'criterio', 'valor_total entre 10000 e 49999',
        'total', (SELECT COUNT(*) FROM customers WHERE valor_total_compras >= 10000 AND valor_total_compras < 50000 AND deleted_at IS NULL),
        'valor_agregado', (SELECT COALESCE(SUM(valor_total_compras), 0) FROM customers WHERE valor_total_compras >= 10000 AND valor_total_compras < 50000 AND deleted_at IS NULL)
      ),
      'basico', jsonb_build_object(
        'criterio', 'valor_total < 10000',
        'total', (SELECT COUNT(*) FROM customers WHERE (valor_total_compras < 10000 OR valor_total_compras IS NULL) AND deleted_at IS NULL),
        'valor_agregado', (SELECT COALESCE(SUM(valor_total_compras), 0) FROM customers WHERE (valor_total_compras < 10000 OR valor_total_compras IS NULL) AND deleted_at IS NULL)
      )
    )
  ) INTO result;
  
  RETURN result;
END;
$function$
