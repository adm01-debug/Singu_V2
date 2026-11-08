CREATE OR REPLACE FUNCTION public.list_companies_by_region(p_uf text DEFAULT NULL::text, p_cidade text DEFAULT NULL::text, p_limit integer DEFAULT 50)
 RETURNS TABLE(company_id uuid, nome_crm text, cidade text, uf text, status text, vendedor text)
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    c.id as company_id,
    c.nome_crm,
    c.cidade,
    c.uf,
    c.status::text,
    s.nome as vendedor
  FROM companies c
  LEFT JOIN customers cu ON cu.company_id = c.id AND cu.deleted_at IS NULL
  LEFT JOIN salespeople s ON s.id = cu.vendedor_id
  WHERE c.deleted_at IS NULL
  AND (p_uf IS NULL OR c.uf = p_uf)
  AND (p_cidade IS NULL OR LOWER(c.cidade) = LOWER(p_cidade))
  ORDER BY c.nome_crm
  LIMIT p_limit;
END;
$function$
