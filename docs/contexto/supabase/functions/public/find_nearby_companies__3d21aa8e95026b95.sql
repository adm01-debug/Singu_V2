CREATE OR REPLACE FUNCTION public.find_nearby_companies(p_cep_prefix text, p_limit integer DEFAULT 20)
 RETURNS TABLE(company_id uuid, nome_crm text, cep text, cidade text, uf text, valor_compras numeric)
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    c.id as company_id,
    c.nome_crm,
    c.cep,
    c.cidade,
    c.uf,
    cu.valor_total_compras as valor_compras
  FROM companies c
  LEFT JOIN customers cu ON cu.company_id = c.id AND cu.deleted_at IS NULL
  WHERE c.deleted_at IS NULL
  AND c.cep LIKE p_cep_prefix || '%'
  ORDER BY c.cep, c.nome_crm
  LIMIT p_limit;
END;
$function$
