CREATE OR REPLACE FUNCTION public.get_contacts_without_interaction(p_user_id uuid DEFAULT NULL::uuid, p_limit integer DEFAULT 50)
 RETURNS TABLE(contact_id uuid, contact_name text, company_id uuid, company_name text, contact_created_at timestamp with time zone, days_since_creation integer)
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
BEGIN
  PERFORM public.assert_self_user_id(p_user_id);
  RETURN QUERY
  SELECT 
    ct.id as contact_id,
    COALESCE(ct.full_name, ct.first_name) as contact_name,
    c.id as company_id,
    COALESCE(c.nome_fantasia, c.nome_crm, c.razao_social) as company_name,
    ct.created_at as contact_created_at,
    EXTRACT(DAY FROM NOW() - ct.created_at)::int as days_since_creation
  FROM contacts ct
  JOIN companies c ON c.id = ct.company_id
  WHERE NOT EXISTS (SELECT 1 FROM interactions i WHERE i.contact_id = ct.id)
  AND c.status = 'ativo'
  AND ct.deleted_at IS NULL
  AND (p_user_id IS NULL OR c.user_id = p_user_id)
  ORDER BY ct.created_at
  LIMIT p_limit;
END;
$function$
