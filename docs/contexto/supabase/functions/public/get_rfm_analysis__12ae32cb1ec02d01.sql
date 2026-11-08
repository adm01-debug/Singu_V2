CREATE OR REPLACE FUNCTION public.get_rfm_analysis()
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
    'total_analisados', (SELECT COUNT(*) FROM customers WHERE ja_comprou = true AND deleted_at IS NULL),
    'distribuicao_rfm', (
      SELECT jsonb_agg(row_to_json(t))
      FROM (
        WITH rfm AS (
          SELECT 
            cu.company_id,
            c.nome_crm,
            cu.valor_total_compras as monetary,
            cu.total_pedidos as frequency,
            EXTRACT(DAY FROM now() - (SELECT MAX(created_at) FROM interactions WHERE company_id = cu.company_id))::int as recency_days,
            CASE 
              WHEN cu.valor_total_compras >= 100000 THEN 5
              WHEN cu.valor_total_compras >= 50000 THEN 4
              WHEN cu.valor_total_compras >= 20000 THEN 3
              WHEN cu.valor_total_compras >= 5000 THEN 2
              ELSE 1
            END as m_score,
            CASE 
              WHEN cu.total_pedidos >= 20 THEN 5
              WHEN cu.total_pedidos >= 10 THEN 4
              WHEN cu.total_pedidos >= 5 THEN 3
              WHEN cu.total_pedidos >= 2 THEN 2
              ELSE 1
            END as f_score
          FROM customers cu
          JOIN companies c ON c.id = cu.company_id
          WHERE cu.ja_comprou = true AND cu.deleted_at IS NULL
        )
        SELECT 
          CASE 
            WHEN m_score >= 4 AND f_score >= 4 THEN 'Champions'
            WHEN m_score >= 3 AND f_score >= 3 THEN 'Loyal Customers'
            WHEN m_score >= 4 AND f_score <= 2 THEN 'Big Spenders'
            WHEN m_score <= 2 AND f_score >= 4 THEN 'Frequent Buyers'
            ELSE 'Regular'
          END as segmento,
          COUNT(*) as total,
          ROUND(SUM(monetary), 2) as valor_total
        FROM rfm
        GROUP BY CASE 
            WHEN m_score >= 4 AND f_score >= 4 THEN 'Champions'
            WHEN m_score >= 3 AND f_score >= 3 THEN 'Loyal Customers'
            WHEN m_score >= 4 AND f_score <= 2 THEN 'Big Spenders'
            WHEN m_score <= 2 AND f_score >= 4 THEN 'Frequent Buyers'
            ELSE 'Regular'
          END
        ORDER BY valor_total DESC
      ) t
    )
  ) INTO result;
  
  RETURN result;
END;
$function$
