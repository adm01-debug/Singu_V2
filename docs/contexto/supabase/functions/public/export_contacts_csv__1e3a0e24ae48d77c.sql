CREATE OR REPLACE FUNCTION public.export_contacts_csv(p_company_id uuid DEFAULT NULL::uuid)
 RETURNS TABLE(nome text, cargo text, email text, telefone text, whatsapp text, empresa text, criado_em timestamp with time zone)
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT COALESCE(ct.full_name, ct.first_name)::text as nome,
         ct.cargo::text,
         (SELECT ce.email FROM contact_emails ce WHERE ce.contact_id = ct.id AND ce.is_primary LIMIT 1)::text as email,
         (SELECT cp.numero FROM contact_phones cp WHERE cp.contact_id = ct.id AND cp.is_primary LIMIT 1)::text as telefone,
         (SELECT cp.numero FROM contact_phones cp WHERE cp.contact_id = ct.id AND cp.is_whatsapp LIMIT 1)::text as whatsapp,
         COALESCE(c.nome_fantasia, c.nome_crm, c.razao_social)::text as empresa,
         ct.created_at as criado_em
  FROM contacts ct
  JOIN companies c ON c.id = ct.company_id
  WHERE ct.deleted_at IS NULL
    AND (p_company_id IS NULL OR ct.company_id = p_company_id)
  ORDER BY COALESCE(ct.full_name, ct.first_name);
END;
$function$
