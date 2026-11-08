CREATE OR REPLACE FUNCTION public.export_contacts_to_csv(p_limit integer DEFAULT 10000)
 RETURNS TABLE(nome text, empresa text, email text, telefone text, cargo text)
 LANGUAGE sql
 STABLE
 SET search_path TO 'public'
AS $function$
  SELECT COALESCE(ct.full_name, ct.first_name),
    (SELECT COALESCE(c.nome_fantasia, c.nome_crm) FROM companies c WHERE c.id = ct.company_id),
    (SELECT ce.email FROM contact_emails ce WHERE ce.contact_id = ct.id LIMIT 1),
    (SELECT cp.numero FROM contact_phones cp WHERE cp.contact_id = ct.id LIMIT 1),
    ct.cargo
  FROM contacts ct WHERE ct.deleted_at IS NULL ORDER BY ct.full_name LIMIT p_limit;
$function$
