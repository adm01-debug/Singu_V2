CREATE OR REPLACE FUNCTION public.find_duplicate_cnpjs(p_limit integer DEFAULT 50)
 RETURNS TABLE(cnpj text, quantidade bigint, empresas jsonb)
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    c.cnpj,
    COUNT(*) as quantidade,
    jsonb_agg(jsonb_build_object('id', c.id, 'nome_crm', c.nome_crm)) as empresas
  FROM companies c
  WHERE c.deleted_at IS NULL
  AND c.cnpj IS NOT NULL AND c.cnpj != ''
  GROUP BY c.cnpj
  HAVING COUNT(*) > 1
  ORDER BY COUNT(*) DESC
  LIMIT p_limit;
END;
$function$
