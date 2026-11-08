CREATE OR REPLACE FUNCTION public.get_customer_ranking(p_limit integer DEFAULT 20, p_order_by text DEFAULT 'valor'::text)
 RETURNS TABLE(ranking integer, company_id uuid, nome_crm text, vendedor_nome text, valor_total_compras numeric, total_pedidos integer, ticket_medio numeric, dias_como_cliente integer)
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    ROW_NUMBER() OVER (
      ORDER BY 
        CASE WHEN p_order_by = 'valor' THEN cu.valor_total_compras END DESC NULLS LAST,
        CASE WHEN p_order_by = 'pedidos' THEN cu.total_pedidos END DESC NULLS LAST,
        CASE WHEN p_order_by = 'ticket' THEN cu.ticket_medio END DESC NULLS LAST,
        CASE WHEN p_order_by = 'antiguidade' THEN cu.created_at END ASC NULLS LAST
    )::int as ranking,
    c.id as company_id,
    c.nome_crm,
    s.nome as vendedor_nome,
    cu.valor_total_compras,
    cu.total_pedidos,
    cu.ticket_medio,
    EXTRACT(DAY FROM now() - cu.created_at)::int as dias_como_cliente
  FROM companies c
  JOIN customers cu ON cu.company_id = c.id AND cu.deleted_at IS NULL
  LEFT JOIN salespeople s ON s.id = cu.vendedor_id
  WHERE c.deleted_at IS NULL
  AND cu.ja_comprou = true
  ORDER BY ranking
  LIMIT p_limit;
END;
$function$
