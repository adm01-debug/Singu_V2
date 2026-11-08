CREATE OR REPLACE FUNCTION public.forecast_revenue(p_months_ahead integer DEFAULT 3)
 RETURNS TABLE(month text, projected_revenue numeric, projected_deals integer, confidence_pct numeric)
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
DECLARE v_avg_monthly numeric; v_avg_deals int; i int;
BEGIN
  SELECT AVG(monthly_value), AVG(monthly_count)::int INTO v_avg_monthly, v_avg_deals
  FROM (SELECT DATE_TRUNC('month', closed_at) as m, SUM(valor) as monthly_value, COUNT(*) as monthly_count
        FROM deals WHERE status = 'ganho' AND closed_at >= NOW() - interval '6 months' GROUP BY 1) sub;
  FOR i IN 1..p_months_ahead LOOP
    month := TO_CHAR(NOW() + (i || ' months')::interval, 'YYYY-MM');
    projected_revenue := COALESCE(v_avg_monthly, 0) * (1 + (i-1) * 0.05);
    projected_deals := COALESCE(v_avg_deals, 0);
    confidence_pct := GREATEST(50, 90 - (i * 10));
    RETURN NEXT;
  END LOOP;
END;
$function$
