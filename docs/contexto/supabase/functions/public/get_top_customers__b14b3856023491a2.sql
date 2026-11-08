CREATE OR REPLACE FUNCTION public.get_top_customers(p_limit integer DEFAULT 10, p_vendedor_id integer DEFAULT NULL::integer)
 RETURNS TABLE(ranking bigint, company_id uuid, nome_crm text, valor_total_compras numeric, total_pedidos integer, ticket_medio numeric, vendedor_nome text)
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    ROW_NUMBER() OVER (ORDER BY cu.valor_total_compras DESC NULLS LAST) as ranking,
    c.id as company_id,
    c.nome_crm,
    cu.valor_total_compras,
    cu.total_pedidos,
    cu.ticket_medio,
    s.nome as vendedor_nome
  FROM customers cu
  JOIN companies c ON c.id = cu.company_id
  LEFT JOIN salespeople s ON s.id = cu.vendedor_id
  WHERE cu.ja_comprou = true
  AND cu.deleted_at IS NULL
  AND (p_vendedor_id IS NULL OR cu.vendedor_id = p_vendedor_id)
  ORDER BY cu.valor_total_compras DESC NULLS LAST
  LIMIT p_limit;
END;
$function$
