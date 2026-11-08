CREATE OR REPLACE FUNCTION public.search_companies_advanced(p_query text DEFAULT NULL::text, p_uf text DEFAULT NULL::text, p_cidade text DEFAULT NULL::text, p_status text DEFAULT NULL::text, p_vendedor_id integer DEFAULT NULL::integer, p_limit integer DEFAULT 50)
 RETURNS TABLE(company_id uuid, nome_crm text, cnpj text, cidade text, uf text, status text, vendedor_nome text, valor_compras numeric)
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    c.id as company_id,
    c.nome_crm,
    c.cnpj,
    c.cidade,
    c.uf,
    c.status::text,
    s.nome as vendedor_nome,
    cu.valor_total_compras as valor_compras
  FROM companies c
  LEFT JOIN customers cu ON cu.company_id = c.id AND cu.deleted_at IS NULL
  LEFT JOIN salespeople s ON s.id = cu.vendedor_id
  WHERE c.deleted_at IS NULL
  AND (p_query IS NULL OR c.nome_crm ILIKE '%' || p_query || '%' OR c.cnpj LIKE '%' || p_query || '%')
  AND (p_uf IS NULL OR c.uf = p_uf)
  AND (p_cidade IS NULL OR LOWER(c.cidade) = LOWER(p_cidade))
  AND (p_status IS NULL OR c.status::text = p_status)
  AND (p_vendedor_id IS NULL OR cu.vendedor_id = p_vendedor_id)
  ORDER BY c.nome_crm
  LIMIT p_limit;
END;
$function$
