CREATE OR REPLACE FUNCTION public.get_revenue_projection(p_months integer DEFAULT 3)
 RETURNS TABLE(month text, projected_revenue numeric, confidence text)
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
DECLARE v_avg numeric; i int;
BEGIN
  SELECT AVG(monthly_rev) INTO v_avg FROM (
    SELECT SUM(valor) as monthly_rev FROM deals WHERE status = 'ganho' AND closed_at >= NOW() - interval '6 months' GROUP BY DATE_TRUNC('month', closed_at)
  ) sub;
  FOR i IN 1..p_months LOOP
    month := TO_CHAR(NOW() + (i || ' months')::interval, 'YYYY-MM');
    projected_revenue := COALESCE(v_avg, 0) * (1 + (i-1) * 0.05);
    confidence := CASE WHEN i <= 1 THEN 'Alta' WHEN i <= 2 THEN 'Média' ELSE 'Baixa' END;
    RETURN NEXT;
  END LOOP;
END;
$function$
