CREATE OR REPLACE FUNCTION public.get_sales_report(p_start_date date, p_end_date date)
 RETURNS TABLE(metric text, value numeric)
 LANGUAGE sql
 STABLE
 SET search_path TO 'public'
AS $function$
  SELECT 'total_revenue'::text, COALESCE(SUM(valor), 0) FROM deals WHERE status = 'ganho' AND closed_at BETWEEN p_start_date AND p_end_date + 1
  UNION ALL SELECT 'deals_won', COUNT(*)::numeric FROM deals WHERE status = 'ganho' AND closed_at BETWEEN p_start_date AND p_end_date + 1
  UNION ALL SELECT 'avg_deal_value', ROUND(AVG(valor), 2) FROM deals WHERE status = 'ganho' AND closed_at BETWEEN p_start_date AND p_end_date + 1;
$function$
