CREATE OR REPLACE FUNCTION public.export_companies_csv(p_limit integer DEFAULT 1000)
 RETURNS TABLE(id text, nome_crm text, razao_social text, cnpj text, email text, telefone text, status text, created_at text)
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT
    c.id::text,
    c.nome_crm,
    c.razao_social,
    c.cnpj,
    (SELECT ce.email FROM company_emails ce WHERE ce.company_id = c.id AND ce.is_primary LIMIT 1)::text AS email,
    (SELECT cp.numero FROM company_phones cp WHERE cp.company_id = c.id AND cp.is_primary LIMIT 1)::text AS telefone,
    c.status::text,
    c.created_at::text
  FROM companies c
  WHERE c.deleted_at IS NULL
  ORDER BY c.created_at DESC
  LIMIT p_limit;
END;
$function$
