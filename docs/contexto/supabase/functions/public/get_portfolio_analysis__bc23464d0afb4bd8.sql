CREATE OR REPLACE FUNCTION public.get_portfolio_analysis(p_vendedor_id integer DEFAULT NULL::integer)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
DECLARE
  result jsonb;
BEGIN
  SELECT jsonb_build_object(
    'vendedor_id', p_vendedor_id,
    'resumo_geral', jsonb_build_object(
      'total_carteira', (
        SELECT COUNT(*) FROM customers 
        WHERE deleted_at IS NULL 
        AND (p_vendedor_id IS NULL OR vendedor_id = p_vendedor_id)
      ),
      'valor_total', (
        SELECT COALESCE(SUM(valor_total_compras), 0) FROM customers 
        WHERE deleted_at IS NULL 
        AND (p_vendedor_id IS NULL OR vendedor_id = p_vendedor_id)
      ),
      'ticket_medio_geral', (
        SELECT COALESCE(AVG(ticket_medio), 0) FROM customers 
        WHERE ticket_medio > 0 AND deleted_at IS NULL 
        AND (p_vendedor_id IS NULL OR vendedor_id = p_vendedor_id)
      )
    ),
    'segmentacao', jsonb_build_object(
      'ativos', (SELECT COUNT(*) FROM customers WHERE cliente_ativado = true AND deleted_at IS NULL AND (p_vendedor_id IS NULL OR vendedor_id = p_vendedor_id)),
      'inativos', (SELECT COUNT(*) FROM customers WHERE cliente_ativado = false AND deleted_at IS NULL AND (p_vendedor_id IS NULL OR vendedor_id = p_vendedor_id)),
      'compradores', (SELECT COUNT(*) FROM customers WHERE ja_comprou = true AND deleted_at IS NULL AND (p_vendedor_id IS NULL OR vendedor_id = p_vendedor_id)),
      'prospects', (SELECT COUNT(*) FROM customers WHERE ja_comprou = false AND deleted_at IS NULL AND (p_vendedor_id IS NULL OR vendedor_id = p_vendedor_id))
    ),
    'top_10_clientes', (
      SELECT jsonb_agg(row_to_json(t))
      FROM (
        SELECT 
          cu.company_id,
          c.nome_crm,
          cu.valor_total_compras,
          cu.total_pedidos,
          cu.ticket_medio
        FROM customers cu
        JOIN companies c ON c.id = cu.company_id
        WHERE cu.deleted_at IS NULL
        AND (p_vendedor_id IS NULL OR cu.vendedor_id = p_vendedor_id)
        ORDER BY cu.valor_total_compras DESC NULLS LAST
        LIMIT 10
      ) t
    ),
    'por_faixa_valor', (
      SELECT jsonb_agg(row_to_json(t) ORDER BY t.ordem)
      FROM (
        SELECT 
          CASE 
            WHEN valor_total_compras >= 50000 THEN 'VIP (50k+)'
            WHEN valor_total_compras >= 10000 THEN 'Premium (10k-50k)'
            WHEN valor_total_compras >= 1000 THEN 'Regular (1k-10k)'
            ELSE 'Inicial (<1k)'
          END as faixa,
          CASE 
            WHEN valor_total_compras >= 50000 THEN 1
            WHEN valor_total_compras >= 10000 THEN 2
            WHEN valor_total_compras >= 1000 THEN 3
            ELSE 4
          END as ordem,
          COUNT(*) as total,
          COALESCE(SUM(valor_total_compras), 0) as valor_total
        FROM customers
        WHERE deleted_at IS NULL
        AND (p_vendedor_id IS NULL OR vendedor_id = p_vendedor_id)
        GROUP BY 1, 2
      ) t
    )
  ) INTO result;
  
  RETURN result;
END;
$function$
