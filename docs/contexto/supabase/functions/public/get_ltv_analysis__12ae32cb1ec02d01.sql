CREATE OR REPLACE FUNCTION public.get_ltv_analysis()
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
    'metricas_globais', jsonb_build_object(
      'ltv_medio', (
        SELECT ROUND(AVG(valor_total_compras * 24 / GREATEST(EXTRACT(EPOCH FROM now() - created_at) / (30 * 24 * 60 * 60), 1)), 2)
        FROM customers WHERE ja_comprou = true AND valor_total_compras > 0 AND deleted_at IS NULL
      ),
      'valor_medio_cliente', (SELECT ROUND(AVG(valor_total_compras), 2) FROM customers WHERE ja_comprou = true AND deleted_at IS NULL),
      'ticket_medio_global', (SELECT ROUND(AVG(ticket_medio), 2) FROM customers WHERE ticket_medio > 0 AND deleted_at IS NULL)
    ),
    'distribuicao_ltv', (
      SELECT jsonb_agg(row_to_json(t) ORDER BY t.ordem)
      FROM (
        SELECT 
          categoria,
          ordem,
          COUNT(*) as total,
          ROUND(AVG(valor_total_compras), 2) as valor_medio
        FROM (
          SELECT 
            valor_total_compras,
            CASE 
              WHEN valor_total_compras >= 50000 THEN 'platinum'
              WHEN valor_total_compras >= 20000 THEN 'gold'
              WHEN valor_total_compras >= 5000 THEN 'silver'
              ELSE 'bronze'
            END as categoria,
            CASE 
              WHEN valor_total_compras >= 50000 THEN 1
              WHEN valor_total_compras >= 20000 THEN 2
              WHEN valor_total_compras >= 5000 THEN 3
              ELSE 4
            END as ordem
          FROM customers WHERE ja_comprou = true AND deleted_at IS NULL
        ) sub
        GROUP BY categoria, ordem
      ) t
    ),
    'top_10_ltv', (
      SELECT jsonb_agg(row_to_json(t))
      FROM (
        SELECT 
          c.nome_crm,
          cu.valor_total_compras,
          cu.total_pedidos,
          s.nome as vendedor
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
