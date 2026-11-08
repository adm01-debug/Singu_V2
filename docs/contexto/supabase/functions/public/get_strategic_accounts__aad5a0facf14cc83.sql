CREATE OR REPLACE FUNCTION public.get_strategic_accounts(p_min_revenue numeric DEFAULT 50000)
 RETURNS TABLE(company_id uuid, name text, revenue numeric, health_score integer, churn_risk text, open_pipeline numeric)
 LANGUAGE sql
 STABLE
 SET search_path TO 'public'
AS $function$
  SELECT c.id, COALESCE(c.nome_fantasia, c.nome_crm),
    (SELECT COALESCE(SUM(d.valor), 0) FROM deals d WHERE d.company_id = c.id AND d.status = 'ganho'),
    calculate_company_health_score(c.id),
    calculate_churn_risk(c.id),
    (SELECT COALESCE(SUM(d.valor), 0) FROM deals d WHERE d.company_id = c.id AND d.status NOT IN ('ganho', 'perdido'))
  FROM companies c WHERE c.is_customer = true AND c.deleted_at IS NULL
    AND (SELECT COALESCE(SUM(d.valor), 0) FROM deals d WHERE d.company_id = c.id AND d.status = 'ganho') >= p_min_revenue
  ORDER BY 3 DESC;
$function$
