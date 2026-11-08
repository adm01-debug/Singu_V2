CREATE OR REPLACE FUNCTION public.get_companies_to_enrich(p_limit integer DEFAULT 100)
 RETURNS TABLE(company_id uuid, cnpj text, current_name text, missing_fields text[])
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    c.id,
    c.cnpj::text,
    COALESCE(c.nome_fantasia, c.nome_crm)::text,
    ARRAY_REMOVE(ARRAY[
      CASE WHEN c.razao_social IS NULL THEN 'razao_social' END,
      CASE WHEN c.uf IS NULL THEN 'uf' END,
      CASE WHEN c.cidade IS NULL THEN 'cidade' END,
      CASE WHEN c.cep IS NULL THEN 'cep' END,
      CASE WHEN c.ramo_atividade IS NULL THEN 'ramo_atividade' END
    ], NULL)::text[]
  FROM companies c
  WHERE c.deleted_at IS NULL
    AND c.cnpj IS NOT NULL 
    AND LENGTH(REGEXP_REPLACE(c.cnpj, '[^0-9]', '', 'g')) >= 11
    AND (c.razao_social IS NULL OR c.uf IS NULL OR c.cidade IS NULL)
    AND NOT EXISTS (SELECT 1 FROM cnpj_cache cc WHERE cc.cnpj = REGEXP_REPLACE(c.cnpj, '[^0-9]', '', 'g'))
  ORDER BY c.created_at DESC
  LIMIT p_limit;
END;
$function$
