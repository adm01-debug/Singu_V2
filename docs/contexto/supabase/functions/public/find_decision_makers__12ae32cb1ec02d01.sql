CREATE OR REPLACE FUNCTION public.find_decision_makers()
 RETURNS TABLE(contact_id uuid, name text, cargo text, company_name text, importance_score integer)
 LANGUAGE sql
 STABLE
 SET search_path TO 'public'
AS $function$
  SELECT c.id, COALESCE(c.full_name, c.first_name), c.cargo,
    (SELECT COALESCE(co.nome_fantasia, co.nome_crm) FROM companies co WHERE co.id = c.company_id),
    calculate_contact_importance(c.id)
  FROM contacts c WHERE c.deleted_at IS NULL AND calculate_contact_importance(c.id) >= 50
  ORDER BY 5 DESC LIMIT 100;
$function$
