CREATE OR REPLACE FUNCTION public.get_pareto_customers()
 RETURNS TABLE(company_id uuid, name text, revenue numeric, cumulative_pct numeric, pareto_group text)
 LANGUAGE sql
 STABLE
 SET search_path TO 'public'
AS $function$
  WITH revenue_data AS (
    SELECT c.id, COALESCE(c.nome_fantasia, c.nome_crm) as name, COALESCE(SUM(d.valor), 0) as revenue
    FROM companies c LEFT JOIN deals d ON d.company_id = c.id AND d.status = 'ganho'
    WHERE c.is_customer = true AND c.deleted_at IS NULL
    GROUP BY c.id, c.nome_fantasia, c.nome_crm HAVING SUM(d.valor) > 0
  ), ranked AS (
    SELECT *, SUM(revenue) OVER (ORDER BY revenue DESC) as cumulative, SUM(revenue) OVER () as total
    FROM revenue_data
  )
  SELECT id, name, revenue, ROUND(cumulative / total * 100, 1), 
    CASE WHEN cumulative / total <= 0.8 THEN 'Top 20%' ELSE 'Outros 80%' END
  FROM ranked ORDER BY revenue DESC;
$function$
