CREATE OR REPLACE FUNCTION public.get_leads_by_maturity()
 RETURNS TABLE(maturity text, lead_count bigint, total_potential numeric)
 LANGUAGE sql
 STABLE
 SET search_path TO 'public'
AS $function$
  SELECT calculate_lead_maturity(c.id), COUNT(*),
    COALESCE(SUM((SELECT SUM(d.valor) FROM deals d WHERE d.company_id = c.id AND d.status NOT IN ('ganho', 'perdido'))), 0)
  FROM companies c WHERE c.deleted_at IS NULL AND c.is_customer = false
  GROUP BY 1 ORDER BY 2 DESC;
$function$
