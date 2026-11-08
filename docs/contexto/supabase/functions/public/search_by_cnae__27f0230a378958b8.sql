CREATE OR REPLACE FUNCTION public.search_by_cnae(p_cnae text, p_limit integer DEFAULT 50)
 RETURNS TABLE(id uuid, nome_crm text, cnpj text, cnae text, cidade text, uf text)
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    c.id,
    c.nome_crm,
    c.cnpj,
    c.cnae,
    c.cidade,
    c.uf
  FROM companies c
  WHERE c.deleted_at IS NULL
  AND c.cnae LIKE '%' || p_cnae || '%'
  ORDER BY c.nome_crm
  LIMIT p_limit;
END;
$function$
