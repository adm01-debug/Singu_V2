CREATE OR REPLACE FUNCTION public.get_health_distribution()
 RETURNS TABLE(health_level text, company_count bigint, total_revenue numeric)
 LANGUAGE sql
 STABLE
 SET search_path TO 'public'
AS $function$
  SELECT CASE 
    WHEN calculate_company_health_score(c.id) >= 80 THEN 'Excelente'
    WHEN calculate_company_health_score(c.id) >= 60 THEN 'Bom'
    WHEN calculate_company_health_score(c.id) >= 40 THEN 'Regular'
    WHEN calculate_company_health_score(c.id) >= 20 THEN 'Em Risco'
    ELSE 'Crítico'
  END, COUNT(*), COALESCE(SUM((SELECT SUM(d.valor) FROM deals d WHERE d.company_id = c.id AND d.status = 'ganho')), 0)
  FROM companies c WHERE c.is_customer = true AND c.deleted_at IS NULL
  GROUP BY 1 ORDER BY 2 DESC;
$function$
