CREATE OR REPLACE FUNCTION public.get_ltv_segments()
 RETURNS TABLE(segment text, company_count bigint, avg_ltv numeric, total_ltv numeric)
 LANGUAGE sql
 STABLE
 SET search_path TO 'public', 'pg_temp'
AS $function$
  WITH ltv AS (
    SELECT c.id, COALESCE(SUM(d.valor), 0) as lifetime_value
    FROM companies c
    LEFT JOIN deals d ON d.company_id = c.id AND d.status = 'ganho'
    WHERE c.deleted_at IS NULL
    GROUP BY c.id
  )
  SELECT 
    CASE 
      WHEN lifetime_value >= 100000 THEN 'Enterprise'
      WHEN lifetime_value >= 50000 THEN 'Premium'
      WHEN lifetime_value >= 10000 THEN 'Standard'
      WHEN lifetime_value > 0 THEN 'Starter'
      ELSE 'Prospect'
    END,
    COUNT(*), ROUND(AVG(lifetime_value), 2), SUM(lifetime_value)
  FROM ltv
  GROUP BY 1
  ORDER BY AVG(lifetime_value) DESC;
$function$
