CREATE OR REPLACE FUNCTION public.get_created_between(p_start timestamp with time zone, p_end timestamp with time zone)
 RETURNS TABLE(entity_type text, id uuid, nome text, email text, criado_em timestamp with time zone)
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  -- Empresas
  SELECT 'company'::text, c.id, COALESCE(c.nome_fantasia, c.nome_crm, c.razao_social) as nome,
         (SELECT ce.email FROM company_emails ce WHERE ce.company_id = c.id AND ce.is_primary LIMIT 1) as email,
         c.created_at as criado_em
  FROM companies c
  WHERE c.created_at BETWEEN p_start AND p_end
    AND c.deleted_at IS NULL
  UNION ALL
  -- Contatos
  SELECT 'contact'::text, ct.id, COALESCE(ct.full_name, ct.first_name) as nome,
         (SELECT ce.email FROM contact_emails ce WHERE ce.contact_id = ct.id AND ce.is_primary LIMIT 1) as email,
         ct.created_at as criado_em
  FROM contacts ct
  WHERE ct.created_at BETWEEN p_start AND p_end
    AND ct.deleted_at IS NULL
  ORDER BY criado_em DESC;
END;
$function$
