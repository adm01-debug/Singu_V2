CREATE OR REPLACE FUNCTION public.list_companies_by_value_range(p_min numeric DEFAULT 0, p_max numeric DEFAULT NULL::numeric, p_limit integer DEFAULT 50)
 RETURNS TABLE(company_id uuid, nome_crm text, valor_compras numeric, total_pedidos integer, vendedor text)
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    c.id as company_id,
    c.nome_crm,
    cu.valor_total_compras as valor_compras,
    cu.total_pedidos,
    s.nome as vendedor
  FROM companies c
  JOIN customers cu ON cu.company_id = c.id AND cu.deleted_at IS NULL
  LEFT JOIN salespeople s ON s.id = cu.vendedor_id
  WHERE c.deleted_at IS NULL
  AND cu.valor_total_compras >= p_min
  AND (p_max IS NULL OR cu.valor_total_compras <= p_max)
  ORDER BY cu.valor_total_compras DESC
  LIMIT p_limit;
END;
$function$
