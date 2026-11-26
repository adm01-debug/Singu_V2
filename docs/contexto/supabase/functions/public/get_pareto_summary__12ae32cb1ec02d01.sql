CREATE OR REPLACE FUNCTION public.get_pareto_summary()
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE v_top_count int; v_top_revenue numeric; v_total_count int; v_total_revenue numeric;
BEGIN
  SELECT COUNT(*), SUM(revenue) INTO v_total_count, v_total_revenue FROM (
    SELECT COALESCE(SUM(d.valor), 0) as revenue FROM companies c JOIN deals d ON d.company_id = c.id AND d.status = 'ganho'
    WHERE c.is_customer = true GROUP BY c.id HAVING SUM(d.valor) > 0
  ) sub;
  
  SELECT COUNT(*), SUM(revenue) INTO v_top_count, v_top_revenue FROM (
    SELECT * FROM get_pareto_customers() WHERE pareto_group = 'Top 20%'
  ) sub;
  
  RETURN jsonb_build_object(
    'total_customers', v_total_count,
    'total_revenue', v_total_revenue,
    'top_20_count', v_top_count,
    'top_20_revenue', v_top_revenue,
    'top_20_pct_customers', ROUND(v_top_count::numeric / NULLIF(v_total_count, 0) * 100, 1),
    'top_20_pct_revenue', ROUND(v_top_revenue / NULLIF(v_total_revenue, 0) * 100, 1)
  );
END;
$function$
