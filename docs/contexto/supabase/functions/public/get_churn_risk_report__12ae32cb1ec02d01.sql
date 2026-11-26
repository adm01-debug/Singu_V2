CREATE OR REPLACE FUNCTION public.get_churn_risk_report()
 RETURNS TABLE(risk_level text, customer_count bigint, total_revenue numeric, pct_total numeric)
 LANGUAGE sql
 STABLE
 SET search_path TO 'public', 'pg_temp'
AS $function$
  WITH data AS (
    SELECT c.id, calculate_churn_risk(c.id) as risk, (SELECT COALESCE(SUM(d.valor), 0) FROM deals d WHERE d.company_id = c.id AND d.status = 'ganho') as revenue
    FROM companies c WHERE c.is_customer = true AND c.deleted_at IS NULL
  )
  SELECT risk, COUNT(*), SUM(revenue), ROUND(COUNT(*)::numeric / NULLIF((SELECT COUNT(*) FROM data), 0) * 100, 1)
  FROM data GROUP BY risk ORDER BY CASE risk WHEN 'CRÍTICO' THEN 1 WHEN 'ALTO' THEN 2 WHEN 'MÉDIO' THEN 3 ELSE 4 END;
$function$
