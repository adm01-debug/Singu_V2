CREATE OR REPLACE FUNCTION public.get_crosssell_opportunities(p_limit integer DEFAULT 20)
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
    'oportunidades', (
      SELECT jsonb_agg(row_to_json(t))
      FROM (
        SELECT 
          c.id, c.nome_crm, cu.valor_total_compras, cu.total_pedidos,
          ROUND(cu.valor_total_compras / NULLIF(cu.total_pedidos, 0), 2) as ticket_atual,
          (SELECT ROUND(AVG(ticket_medio), 2) FROM customers WHERE ticket_medio > 0 AND deleted_at IS NULL) as ticket_medio_geral,
          s.nome as vendedor
        FROM companies c
        JOIN customers cu ON cu.company_id = c.id AND cu.deleted_at IS NULL
        LEFT JOIN salespeople s ON s.id = cu.vendedor_id
        WHERE cu.ja_comprou = true AND cu.cliente_ativado = true
        AND cu.ticket_medio < (SELECT AVG(ticket_medio) FROM customers WHERE ticket_medio > 0 AND deleted_at IS NULL)
        AND cu.valor_total_compras > 5000
        ORDER BY cu.valor_total_compras DESC
        LIMIT p_limit
      ) t
    ),
    'potencial_aumento', (
      SELECT ROUND(SUM(
        (SELECT AVG(ticket_medio) FROM customers WHERE ticket_medio > 0 AND deleted_at IS NULL) - cu.ticket_medio
      ), 2)
      FROM customers cu
      WHERE cu.ja_comprou = true AND cu.cliente_ativado = true AND cu.deleted_at IS NULL
      AND cu.ticket_medio < (SELECT AVG(ticket_medio) FROM customers WHERE ticket_medio > 0 AND deleted_at IS NULL)
    )
  ) INTO result;
  
  RETURN result;
END;
$function$
