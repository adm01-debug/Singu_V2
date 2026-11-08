CREATE OR REPLACE FUNCTION public.get_key_contacts(p_company_id uuid)
 RETURNS TABLE(contact_id uuid, name text, cargo text, importance_score integer, has_whatsapp boolean)
 LANGUAGE sql
 STABLE
 SET search_path TO 'public'
AS $function$
  SELECT c.id, COALESCE(c.full_name, c.first_name), c.cargo, calculate_contact_importance(c.id),
    EXISTS(SELECT 1 FROM contact_phones cp WHERE cp.contact_id = c.id AND cp.is_whatsapp = true)
  FROM contacts c WHERE c.company_id = p_company_id AND c.deleted_at IS NULL
  ORDER BY calculate_contact_importance(c.id) DESC;
$function$
