CREATE OR REPLACE FUNCTION public.search_by_email(p_email text, p_limit integer DEFAULT 10)
 RETURNS TABLE(entity_type text, id uuid, name text, email text, company_name text)
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT 'contact'::text, ct.id, COALESCE(ct.full_name, ct.first_name) as name, ce.email, 
         COALESCE(c.nome_fantasia, c.nome_crm, c.razao_social) as company_name
  FROM contacts ct
  JOIN contact_emails ce ON ce.contact_id = ct.id
  JOIN companies c ON c.id = ct.company_id
  WHERE ce.email ILIKE '%' || p_email || '%'
    AND ct.deleted_at IS NULL
  UNION ALL
  SELECT 'company'::text, co.id, COALESCE(co.nome_fantasia, co.nome_crm, co.razao_social) as name, 
         coe.email, NULL::text as company_name
  FROM companies co
  JOIN company_emails coe ON coe.company_id = co.id
  WHERE coe.email ILIKE '%' || p_email || '%'
    AND co.deleted_at IS NULL
  LIMIT p_limit;
END;
$function$
