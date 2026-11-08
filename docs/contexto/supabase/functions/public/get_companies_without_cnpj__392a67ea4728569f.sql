CREATE OR REPLACE FUNCTION public.get_companies_without_cnpj(p_limit integer DEFAULT 100)
 RETURNS TABLE(company_id uuid, nome text, status text, created_at timestamp with time zone)
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    c.id as company_id,
    COALESCE(c.nome_fantasia, c.nome_crm, c.razao_social)::text as nome,
    c.status::text,
    c.created_at
  FROM companies c
  WHERE c.cnpj IS NULL 
    AND c.deleted_at IS NULL
  ORDER BY c.created_at DESC
  LIMIT p_limit;
END;
$function$
