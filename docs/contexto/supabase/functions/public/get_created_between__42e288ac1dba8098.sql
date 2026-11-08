CREATE OR REPLACE FUNCTION public.get_created_between(p_entity text, p_start_date date, p_end_date date, p_limit integer DEFAULT 100)
 RETURNS TABLE(entity_type text, id uuid, nome text, email text, criado_em timestamp with time zone)
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
BEGIN
  IF p_entity = 'company' OR p_entity = 'companies' THEN
    RETURN QUERY
    SELECT 'company'::text, c.id, COALESCE(c.nome_fantasia, c.nome_crm, c.razao_social) as nome,
           (SELECT ce.email FROM company_emails ce WHERE ce.company_id = c.id AND ce.is_primary LIMIT 1) as email,
           c.created_at as criado_em
    FROM companies c
    WHERE c.created_at::date BETWEEN p_start_date AND p_end_date
      AND c.deleted_at IS NULL
    ORDER BY c.created_at DESC
    LIMIT p_limit;
  ELSIF p_entity = 'contact' OR p_entity = 'contacts' THEN
    RETURN QUERY
    SELECT 'contact'::text, ct.id, COALESCE(ct.full_name, ct.first_name) as nome,
           (SELECT ce.email FROM contact_emails ce WHERE ce.contact_id = ct.id AND ce.is_primary LIMIT 1) as email,
           ct.created_at as criado_em
    FROM contacts ct
    WHERE ct.created_at::date BETWEEN p_start_date AND p_end_date
      AND ct.deleted_at IS NULL
    ORDER BY ct.created_at DESC
    LIMIT p_limit;
  END IF;
END;
$function$
