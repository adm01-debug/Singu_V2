CREATE OR REPLACE FUNCTION public.get_companies_without_contacts(p_limit integer DEFAULT 100)
 RETURNS TABLE(company_id uuid, nome_crm text, cidade text, uf text, created_at timestamp with time zone)
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
    c.created_at
  FROM companies c
  WHERE c.deleted_at IS NULL
  AND NOT EXISTS (SELECT 1 FROM contacts ct WHERE ct.company_id = c.id AND ct.deleted_at IS NULL)
  ORDER BY c.created_at DESC
  LIMIT p_limit;
END;
$function$
