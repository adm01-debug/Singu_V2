CREATE OR REPLACE FUNCTION public.get_top_customers(p_limit integer DEFAULT 10)
 RETURNS TABLE(company_id uuid, company_name text, total_revenue numeric, deals_count bigint, last_deal timestamp with time zone)
 LANGUAGE sql
 STABLE
 SET search_path TO 'public'
AS $function$
  SELECT 
    c.id, COALESCE(c.nome_fantasia, c.nome_crm),
    COALESCE(SUM(d.valor), 0), COUNT(d.id), MAX(d.closed_at)
  FROM companies c
  LEFT JOIN deals d ON d.company_id = c.id AND d.status = 'ganho'
  WHERE c.is_customer = true AND c.deleted_at IS NULL
  GROUP BY c.id, c.nome_fantasia, c.nome_crm
  ORDER BY 3 DESC
  LIMIT p_limit;
$function$
