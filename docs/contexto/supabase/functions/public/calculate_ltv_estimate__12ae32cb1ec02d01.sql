CREATE OR REPLACE FUNCTION public.calculate_ltv_estimate()
 RETURNS TABLE(segment text, avg_ltv numeric, avg_lifespan_months numeric, customer_count bigint)
 LANGUAGE sql
 STABLE
 SET search_path TO 'public'
AS $function$
  SELECT 
    CASE WHEN total >= 100000 THEN 'Enterprise' WHEN total >= 50000 THEN 'Premium' WHEN total >= 10000 THEN 'Standard' ELSE 'Starter' END,
    ROUND(AVG(total), 2),
    ROUND(AVG(EXTRACT(EPOCH FROM (NOW() - first_deal))/2592000), 1),
    COUNT(*)
  FROM (
    SELECT c.id, COALESCE(SUM(d.valor), 0) as total, MIN(d.closed_at) as first_deal
    FROM companies c JOIN deals d ON d.company_id = c.id AND d.status = 'ganho'
    WHERE c.is_customer = true GROUP BY c.id
  ) sub GROUP BY 1 ORDER BY 2 DESC;
$function$
