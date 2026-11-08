CREATE OR REPLACE FUNCTION public.get_revenue_trend(p_months integer DEFAULT 12)
 RETURNS TABLE(month text, revenue numeric, deals_count bigint, avg_deal_value numeric)
 LANGUAGE sql
 STABLE
 SET search_path TO 'public'
AS $function$
  SELECT 
    TO_CHAR(DATE_TRUNC('month', closed_at), 'YYYY-MM'),
    COALESCE(SUM(valor), 0),
    COUNT(*),
    ROUND(AVG(valor), 2)
  FROM deals
  WHERE status = 'ganho' AND closed_at >= NOW() - (p_months || ' months')::interval
  GROUP BY DATE_TRUNC('month', closed_at)
  ORDER BY 1;
$function$
