CREATE OR REPLACE FUNCTION public.get_unassigned_companies_by_region(p_state text)
 RETURNS TABLE(company_id uuid, name text, city text)
 LANGUAGE sql
 STABLE
 SET search_path TO 'public'
AS $function$
  SELECT c.id, COALESCE(c.nome_fantasia, c.nome_crm), ca.cidade
  FROM companies c JOIN company_addresses ca ON ca.company_id = c.id
  WHERE ca.estado = p_state AND c.user_id IS NULL AND c.deleted_at IS NULL
  ORDER BY c.nome_fantasia LIMIT 100;
$function$
