CREATE OR REPLACE FUNCTION public.get_monthly_comparison()
 RETURNS TABLE(month text, revenue numeric, deals_won bigint)
 LANGUAGE sql
 STABLE
 SET search_path TO 'public'
AS $function$
  SELECT TO_CHAR(DATE_TRUNC('month', closed_at), 'YYYY-MM'), COALESCE(SUM(valor), 0), COUNT(*)
  FROM deals WHERE status = 'ganho' AND closed_at >= NOW() - interval '12 months'
  GROUP BY DATE_TRUNC('month', closed_at) ORDER BY 1;
$function$
