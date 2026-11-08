CREATE OR REPLACE FUNCTION public.find_companies_near_cep(p_cep_prefix text, p_limit integer DEFAULT 50)
 RETURNS TABLE(id uuid, nome_crm text, cep text, endereco text, cidade text, uf text)
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    c.id,
    c.nome_crm,
    c.cep,
    c.endereco,
    c.cidade,
    c.uf
  FROM companies c
  WHERE c.deleted_at IS NULL
  AND c.cep LIKE p_cep_prefix || '%'
  ORDER BY c.cep, c.nome_crm
  LIMIT p_limit;
END;
$function$
