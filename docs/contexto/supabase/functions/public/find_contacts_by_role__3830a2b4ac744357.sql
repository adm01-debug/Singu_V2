CREATE OR REPLACE FUNCTION public.find_contacts_by_role(p_role_pattern text, p_limit integer DEFAULT 50)
 RETURNS TABLE(contact_id uuid, contact_name text, role text, company_name text, email text, phone text)
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT
    ct.id as contact_id,
    COALESCE(ct.full_name, ct.first_name)::text as contact_name,
    ct.cargo::text as role,
    COALESCE(c.nome_fantasia, c.nome_crm, c.razao_social)::text as company_name,
    (SELECT ce.email FROM contact_emails ce WHERE ce.contact_id = ct.id AND ce.is_primary LIMIT 1)::text as email,
    (SELECT cp.numero FROM contact_phones cp WHERE cp.contact_id = ct.id AND cp.is_primary LIMIT 1)::text as phone
  FROM contacts ct
  JOIN companies c ON c.id = ct.company_id
  WHERE ct.deleted_at IS NULL
    AND ct.cargo ILIKE '%' || p_role_pattern || '%'
  ORDER BY ct.full_name
  LIMIT p_limit;
END;
$function$
