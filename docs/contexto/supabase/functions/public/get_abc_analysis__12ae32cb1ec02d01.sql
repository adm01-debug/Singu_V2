CREATE OR REPLACE FUNCTION public.get_abc_analysis()
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
DECLARE
  result jsonb;
  total_value numeric;
BEGIN
  SELECT COALESCE(SUM(valor_total_compras), 0) INTO total_value
  FROM customers WHERE ja_comprou = true AND deleted_at IS NULL;
  
  SELECT jsonb_build_object(
    'timestamp', now(),
    'valor_total', total_value,
    'classificacao', (
      SELECT jsonb_agg(row_to_json(t))
      FROM (
        WITH ranked AS (
          SELECT 
            cu.company_id,
            c.nome_crm,
            cu.valor_total_compras,
            SUM(cu.valor_total_compras) OVER (ORDER BY cu.valor_total_compras DESC) as cumsum,
            (SUM(cu.valor_total_compras) OVER (ORDER BY cu.valor_total_compras DESC) / NULLIF(total_value, 0) * 100) as cumsum_pct
          FROM customers cu
          JOIN companies c ON c.id = cu.company_id
          WHERE cu.ja_comprou = true AND cu.deleted_at IS NULL AND cu.valor_total_compras > 0
        )
        SELECT 
          CASE 
            WHEN cumsum_pct <= 80 THEN 'A'
            WHEN cumsum_pct <= 95 THEN 'B'
            ELSE 'C'
          END as classe,
          COUNT(*) as clientes,
          ROUND(SUM(valor_total_compras), 2) as valor_total,
          ROUND(SUM(valor_total_compras) / NULLIF(total_value, 0) * 100, 2) as percentual
        FROM ranked
        GROUP BY CASE 
            WHEN cumsum_pct <= 80 THEN 'A'
            WHEN cumsum_pct <= 95 THEN 'B'
            ELSE 'C'
          END
        ORDER BY classe
      ) t
    ),
    'top_classe_a', (
      SELECT jsonb_agg(row_to_json(t))
      FROM (
        SELECT c.nome_crm, cu.valor_total_compras, s.nome as vendedor
        FROM customers cu
        JOIN companies c ON c.id = cu.company_id
        LEFT JOIN salespeople s ON s.id = cu.vendedor_id
        WHERE cu.ja_comprou = true AND cu.deleted_at IS NULL
        ORDER BY cu.valor_total_compras DESC NULLS LAST
        LIMIT 10
      ) t
    )
  ) INTO result;
  
  RETURN result;
END;
$function$
