CREATE OR REPLACE FUNCTION public.search_by_phone(p_phone text, p_limit integer DEFAULT 10)
 RETURNS TABLE(entity_type text, id uuid, name text, phone text, company_name text)
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT 'contact'::text, ct.id, COALESCE(ct.full_name, ct.first_name) as name, cp.numero, 
         COALESCE(c.nome_fantasia, c.nome_crm, c.razao_social) as company_name
  FROM contacts ct
  JOIN contact_phones cp ON cp.contact_id = ct.id
  JOIN companies c ON c.id = ct.company_id
  WHERE cp.numero ILIKE '%' || p_phone || '%' OR cp.numero_normalizado ILIKE '%' || p_phone || '%'
    AND ct.deleted_at IS NULL
  UNION ALL
  SELECT 'company'::text, co.id, COALESCE(co.nome_fantasia, co.nome_crm, co.razao_social) as name, 
         cop.numero, NULL::text as company_name
  FROM companies co
  JOIN company_phones cop ON cop.company_id = co.id
  WHERE cop.numero ILIKE '%' || p_phone || '%' OR cop.numero_normalizado ILIKE '%' || p_phone || '%'
    AND co.deleted_at IS NULL
  LIMIT p_limit;
END;
$function$
