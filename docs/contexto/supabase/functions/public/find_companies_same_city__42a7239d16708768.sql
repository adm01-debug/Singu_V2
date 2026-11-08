CREATE OR REPLACE FUNCTION public.find_companies_same_city(p_company_id uuid, p_limit integer DEFAULT 50)
 RETURNS TABLE(id uuid, nome_crm text, endereco text, cidade text, uf text)
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
DECLARE
  ref_cidade text;
  ref_uf text;
BEGIN
  SELECT cidade, uf INTO ref_cidade, ref_uf FROM companies WHERE id = p_company_id;
  
  RETURN QUERY
  SELECT 
    c.id,
    c.nome_crm,
    c.endereco,
    c.cidade,
    c.uf
  FROM companies c
  WHERE c.deleted_at IS NULL
  AND c.id != p_company_id
  AND LOWER(c.cidade) = LOWER(ref_cidade)
  AND c.uf = ref_uf
  ORDER BY c.nome_crm
  LIMIT p_limit;
END;
$function$
