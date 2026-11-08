CREATE OR REPLACE FUNCTION public.get_cold_leads(p_max_score integer DEFAULT 20)
 RETURNS TABLE(company_id uuid, name text, score integer, days_since_contact integer)
 LANGUAGE sql
 STABLE
 SET search_path TO 'public'
AS $function$
  SELECT c.id, COALESCE(c.nome_fantasia, c.nome_crm), calculate_conversion_probability(c.id),
    EXTRACT(DAY FROM NOW() - (SELECT MAX(i.data_interacao) FROM interactions i WHERE i.company_id = c.id))::int
  FROM companies c WHERE c.deleted_at IS NULL AND c.is_customer = false AND calculate_conversion_probability(c.id) <= p_max_score
  ORDER BY 4 DESC NULLS FIRST LIMIT 100;
$function$
