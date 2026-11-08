CREATE OR REPLACE FUNCTION public.get_customer_concentration()
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
DECLARE
  result jsonb;
  total_valor numeric;
BEGIN
  SELECT COALESCE(SUM(valor_total_compras), 0) INTO total_valor FROM customers WHERE deleted_at IS NULL;
  
  SELECT jsonb_build_object(
    'timestamp', now(),
    'valor_total', total_valor,
    'top_10_percentual', ROUND(
      (SELECT COALESCE(SUM(valor_total_compras), 0) FROM (
        SELECT valor_total_compras FROM customers WHERE deleted_at IS NULL ORDER BY valor_total_compras DESC LIMIT 10
      ) t)::numeric / NULLIF(total_valor, 0) * 100, 2
    ),
    'top_20_percentual', ROUND(
      (SELECT COALESCE(SUM(valor_total_compras), 0) FROM (
        SELECT valor_total_compras FROM customers WHERE deleted_at IS NULL ORDER BY valor_total_compras DESC LIMIT 20
      ) t)::numeric / NULLIF(total_valor, 0) * 100, 2
    ),
    'risco_concentracao', CASE 
      WHEN (SELECT COALESCE(SUM(valor_total_compras), 0) FROM (SELECT valor_total_compras FROM customers WHERE deleted_at IS NULL ORDER BY valor_total_compras DESC LIMIT 10) t)::numeric / NULLIF(total_valor, 0) > 0.5 THEN 'alto'
      WHEN (SELECT COALESCE(SUM(valor_total_compras), 0) FROM (SELECT valor_total_compras FROM customers WHERE deleted_at IS NULL ORDER BY valor_total_compras DESC LIMIT 10) t)::numeric / NULLIF(total_valor, 0) > 0.3 THEN 'medio'
      ELSE 'baixo'
    END,
    'top_5_clientes', (
      SELECT jsonb_agg(row_to_json(t))
      FROM (
        SELECT c.nome_crm, cu.valor_total_compras, ROUND(cu.valor_total_compras / NULLIF(total_valor, 0) * 100, 2) as percentual
        FROM customers cu
        JOIN companies c ON c.id = cu.company_id
        WHERE cu.deleted_at IS NULL
        ORDER BY cu.valor_total_compras DESC NULLS LAST
        LIMIT 5
      ) t
    )
  ) INTO result;
  
  RETURN result;
END;
$function$
