CREATE OR REPLACE FUNCTION public.get_customers_at_churn_risk(p_min_risk text DEFAULT 'MÉDIO'::text)
 RETURNS TABLE(company_id uuid, name text, risk text, days_inactive integer, revenue numeric, last_contact timestamp with time zone)
 LANGUAGE sql
 STABLE
 SET search_path TO 'public'
AS $function$
  SELECT c.id, COALESCE(c.nome_fantasia, c.nome_crm), calculate_churn_risk(c.id),
    EXTRACT(DAY FROM NOW() - (SELECT MAX(i.data_interacao) FROM interactions i WHERE i.company_id = c.id))::int,
    (SELECT COALESCE(SUM(d.valor), 0) FROM deals d WHERE d.company_id = c.id AND d.status = 'ganho'),
    (SELECT MAX(i.data_interacao) FROM interactions i WHERE i.company_id = c.id)
  FROM companies c WHERE c.is_customer = true AND c.deleted_at IS NULL
    AND calculate_churn_risk(c.id) IN (
      CASE WHEN p_min_risk = 'BAIXO' THEN 'BAIXO' END, 'MÉDIO', 'ALTO', 'CRÍTICO'
    )
  ORDER BY 5 DESC LIMIT 100;
$function$
