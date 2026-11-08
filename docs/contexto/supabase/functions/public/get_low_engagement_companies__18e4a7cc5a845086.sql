CREATE OR REPLACE FUNCTION public.get_low_engagement_companies(p_threshold integer DEFAULT 20)
 RETURNS TABLE(company_id uuid, name text, engagement_score integer, days_since_contact integer)
 LANGUAGE sql
 STABLE
 SET search_path TO 'public'
AS $function$
  SELECT c.id, COALESCE(c.nome_fantasia, c.nome_crm), calculate_engagement_score(c.id),
    EXTRACT(DAY FROM NOW() - (SELECT MAX(i.data_interacao) FROM interactions i WHERE i.company_id = c.id))::int
  FROM companies c WHERE c.deleted_at IS NULL AND c.is_customer = true AND calculate_engagement_score(c.id) < p_threshold
  ORDER BY 3 LIMIT 100;
$function$
