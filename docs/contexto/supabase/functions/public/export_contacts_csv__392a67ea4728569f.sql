CREATE OR REPLACE FUNCTION public.export_contacts_csv(p_limit integer DEFAULT 1000)
 RETURNS TABLE(id text, full_name text, email text, telefone text, cargo text, company_name text, created_at text)
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT
    ct.id::text,
    COALESCE(ct.full_name, ct.first_name)::text as full_name,
    (SELECT ce.email FROM contact_emails ce WHERE ce.contact_id = ct.id AND ce.is_primary LIMIT 1)::text as email,
    (SELECT cp.numero FROM contact_phones cp WHERE cp.contact_id = ct.id AND cp.is_primary LIMIT 1)::text as telefone,
    ct.cargo::text,
    COALESCE(co.nome_fantasia, co.nome_crm, co.razao_social)::text as company_name,
    ct.created_at::text
  FROM contacts ct
  LEFT JOIN companies co ON co.id = ct.company_id
  WHERE ct.deleted_at IS NULL
  ORDER BY ct.created_at DESC
  LIMIT p_limit;
END;
$function$
