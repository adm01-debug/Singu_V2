CREATE OR REPLACE FUNCTION public.get_critical_health_companies(p_threshold integer DEFAULT 30)
 RETURNS TABLE(company_id uuid, name text, health_score integer, days_inactive integer, revenue numeric)
 LANGUAGE sql
 STABLE
 SET search_path TO 'public'
AS $function$
  SELECT c.id, COALESCE(c.nome_fantasia, c.nome_crm), calculate_company_health_score(c.id),
    EXTRACT(DAY FROM NOW() - (SELECT MAX(i.data_interacao) FROM interactions i WHERE i.company_id = c.id))::int,
    (SELECT COALESCE(SUM(d.valor), 0) FROM deals d WHERE d.company_id = c.id AND d.status = 'ganho')
  FROM companies c WHERE c.is_customer = true AND c.deleted_at IS NULL AND calculate_company_health_score(c.id) < p_threshold
  ORDER BY 5 DESC LIMIT 50;
$function$
