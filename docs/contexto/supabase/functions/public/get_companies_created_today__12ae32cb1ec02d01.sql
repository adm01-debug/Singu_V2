CREATE OR REPLACE FUNCTION public.get_companies_created_today()
 RETURNS TABLE(id uuid, nome_crm text, cnpj text, cidade text, uf text, created_at timestamp with time zone)
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT c.id, c.nome_crm, c.cnpj, c.cidade, c.uf, c.created_at
  FROM companies c
  WHERE c.created_at::date = CURRENT_DATE
  AND c.deleted_at IS NULL
  ORDER BY c.created_at DESC;
END;
$function$
